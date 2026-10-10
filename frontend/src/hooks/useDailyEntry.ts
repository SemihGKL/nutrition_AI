import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { dailyApi } from '../api/daily';
import { ApiError } from '../api/client';
import { NO_MEALS, mealsTotal } from '../utils/meals';
import type { DailyCalories, DailyRecap, MealKey } from '../types/api';

interface EntryState {
  entry: DailyCalories | null;
  recap: DailyRecap | null;
  isLoading: boolean;
  isSaving: boolean;
  saveFailed: boolean;
  error: string | null;
}

interface EntryActions {
  setMeal: (meal: MealKey, v: number) => void;
  setSteps: (v: number) => void;
  setBurned: (v: number) => void;
  confirm: () => Promise<void>;
  retrySave: () => Promise<void>;
  reload: () => Promise<void>;
}

const SAVE_DEBOUNCE_MS = 800;
// Attente maximale des sauvegardes en cours avant de recharger un jour ou d'enchaîner.
const PENDING_SAVES_TIMEOUT_MS = 5000;

// ── File de sauvegarde partagée par toute l'app ─────────────────────────────────
// Une seule file (une requête en vol à la fois) pour toutes les instances du hook :
// la sauvegarde envoyée au démontage du dashboard et celle d'une nouvelle instance
// ne peuvent pas se doubler côté serveur.
// Les clés sont « utilisateur:date » : un échec n'est jamais renvoyé sous un autre compte.

type SaveKey = string;
interface QueuedSave { entry: DailyCalories; seq: number }

let saveChain: Promise<void> = Promise.resolve();
let saveSeq = 0;
let runningSaves = 0;
const latestEnqueued = new Map<SaveKey, number>();
const queuedSaves = new Map<SaveKey, QueuedSave>();   // en file, pas encore partis
const failedSaves = new Map<SaveKey, QueuedSave>();   // dernière version d'un jour non enregistrée
const lastSaveOfDay = new Map<SaveKey, Promise<void>>(); // dernière sauvegarde en file, par jour
const failureListeners = new Set<() => void>();

const keyOf = (userId: number | undefined, date: string): SaveKey => `${userId}:${date}`;

function notifyFailures(): void {
  failureListeners.forEach(listener => listener());
}

function hasFailedSaves(userId: number | undefined): boolean {
  const prefix = `${userId}:`;
  return [...failedSaves.keys()].some(k => k.startsWith(prefix));
}

/**
 * Résout quand toutes les sauvegardes de saisie en file sont terminées (réussies ou
 * non). Les pages qui lisent des données dérivées de la saisie (liste des jours,
 * complétions SPORT auto-cochées) l'attendent pour ne pas afficher l'état d'avant.
 */
export async function waitForPendingDailySaves(timeoutMs = PENDING_SAVES_TIMEOUT_MS): Promise<void> {
  await withTimeout(saveChain, timeoutMs);
}

/** Attend uniquement la dernière sauvegarde en file de ce jour (borné). */
function waitForSaveOfDay(key: SaveKey): Promise<void> {
  const pending = lastSaveOfDay.get(key);
  return pending ? withTimeout(pending, PENDING_SAVES_TIMEOUT_MS) : Promise.resolve();
}

// Borné : une requête bloquée ne doit jamais figer l'écran qui attend.
async function withTimeout(promise: Promise<void>, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>(resolve => { timer = setTimeout(resolve, timeoutMs); });
  try {
    await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Oublie les échecs mémorisés (déconnexion) : rien ne doit être renvoyé à la session suivante. */
export function clearDailySaveState(): void {
  saveChain = Promise.resolve();
  lastSaveOfDay.clear();
  latestEnqueued.clear();
  queuedSaves.clear();
  failedSaves.clear();
  notifyFailures();
}

interface SaveCallbacks {
  onStart: () => void;
  onSaved: (saved: DailyCalories) => void;
  onSettled: () => void;
  onRecap: (recap: DailyRecap) => void;
}

function enqueueDailySave(toSave: DailyCalories, callbacks: SaveCallbacks): Promise<void> {
  const key = keyOf(toSave.userId, toSave.date);
  const seq = ++saveSeq;
  latestEnqueued.set(key, seq);
  queuedSaves.set(key, { entry: toSave, seq });
  // Une version plus récente du même jour part : l'échec précédent est remplacé.
  if (failedSaves.delete(key)) notifyFailures();

  const run = async () => {
    if (queuedSaves.get(key)?.seq === seq) queuedSaves.delete(key);
    runningSaves++;
    callbacks.onStart();
    try {
      const saved = await dailyApi.save(toSave);
      const failed = failedSaves.get(key);
      if (failed && failed.seq <= seq) failedSaves.delete(key);
      callbacks.onSaved(saved);
    } catch (e) {
      // Seule la dernière version du jour vaut d'être relancée.
      if (latestEnqueued.get(key) === seq) failedSaves.set(key, { entry: toSave, seq });
      throw e;
    } finally {
      runningSaves--;
      notifyFailures();
      callbacks.onSettled();
    }

    // Le recap n'est qu'un affichage dérivé : son échec ne rend pas la saisie non enregistrée.
    try {
      callbacks.onRecap(await dailyApi.getRecap(toSave.date));
    } catch {
      // recap rechargé à la prochaine sauvegarde
    }
  };

  const result = saveChain.then(run);
  const settled = result.catch(() => {});
  saveChain = settled;
  lastSaveOfDay.set(key, settled);
  settled.then(() => { if (lastSaveOfDay.get(key) === settled) lastSaveOfDay.delete(key); });
  return result;
}

function emptyEntry(date: string, userId: number | undefined): DailyCalories {
  return {
    date,
    caloriesConsumed: 0,
    caloriesBurned: 0,
    steps: 0,
    confirmed: false,
    userId: userId!,
  };
}

function sameEntryValues(a: DailyCalories, b: DailyCalories): boolean {
  const ma = a.meals ?? NO_MEALS;
  const mb = b.meals ?? NO_MEALS;
  return a.caloriesConsumed === b.caloriesConsumed
    && a.steps === b.steps
    && a.caloriesBurned === b.caloriesBurned
    && ma.breakfast === mb.breakfast
    && ma.lunch === mb.lunch
    && ma.snack === mb.snack
    && ma.dinner === mb.dinner;
}

/**
 * Saisie du jour avec sauvegarde automatique.
 *
 * Invariants :
 *  - les sauvegardes sont sérialisées (une seule requête en vol), sinon une réponse
 *    ancienne pourrait écraser côté serveur une saisie plus récente ;
 *  - la réponse d'une sauvegarde n'est appliquée que si aucune édition n'a eu lieu
 *    depuis son envoi et que la date affichée est toujours la sienne ;
 *  - une réponse de chargement n'est appliquée que si c'est le dernier chargement lancé ;
 *  - une sauvegarde échouée reste mémorisée (par utilisateur et date, au niveau du module)
 *    jusqu'à ce qu'une version plus récente du même jour parte ; elle est réaffichée si
 *    le jour est rechargé, et peut être relancée via `retrySave`.
 */
export function useDailyEntry(
  userId: number | undefined,
  date: string,
): EntryState & EntryActions {
  const [state, setState] = useState<EntryState>({
    entry: null,
    recap: null,
    isLoading: true,
    isSaving: false,
    saveFailed: hasFailedSaves(userId),
    error: null,
  });

  const dateRef = useRef(date);
  const userIdRef = useRef(userId);
  useLayoutEffect(() => {
    dateRef.current = date;
    userIdRef.current = userId;
  }, [date, userId]);

  // Dernière version locale de l'entrée affichée (source des éditions).
  const entryRef = useRef<DailyCalories | null>(null);
  const editSeqRef = useRef(0);
  const loadSeqRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEntryRef = useRef<DailyCalories | null>(null);

  // État d'échec partagé : une sauvegarde lancée par une autre instance (démontage) peut
  // échouer après coup, l'indicateur doit quand même s'afficher ici.
  useEffect(() => {
    const listener = () => setState(s => ({ ...s, saveFailed: hasFailedSaves(userIdRef.current) }));
    failureListeners.add(listener);
    listener();
    return () => { failureListeners.delete(listener); };
  }, []);

  const enqueueSave = useCallback((toSave: DailyCalories): Promise<void> => {
    const editSeqAtEnqueue = editSeqRef.current;
    const isDisplayed = () => dateRef.current === toSave.date;
    return enqueueDailySave(toSave, {
      onStart: () => setState(s => ({ ...s, isSaving: true })),
      onSaved: saved => {
        if (isDisplayed() && editSeqRef.current === editSeqAtEnqueue) {
          entryRef.current = saved;
          setState(s => ({ ...s, entry: saved }));
        }
      },
      onSettled: () => setState(s => ({ ...s, isSaving: false })),
      onRecap: recap => { if (isDisplayed()) setState(s => ({ ...s, recap })); },
    });
  }, []);

  const flushPending = useCallback((): Promise<void> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const toSave = pendingEntryRef.current;
    if (!toSave) return waitForPendingDailySaves();
    pendingEntryRef.current = null;
    return enqueueSave(toSave);
  }, [enqueueSave]);

  const scheduleSave = useCallback((updated: DailyCalories) => {
    if (!userIdRef.current) return;
    pendingEntryRef.current = updated;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushPending().catch(() => {});
    }, SAVE_DEBOUNCE_MS);
  }, [flushPending]);

  // Envoie la saisie en attente quand on quitte le jour affiché (changement de date,
  // démontage), pour que ni la navigation ni la page suivante ne la perdent.
  useEffect(() => {
    return () => { flushPending().catch(() => {}); };
  }, [date, flushPending]);

  // `beforeunload` n'est pas émis sur iOS ni en PWA installée : on envoie dès que
  // la page passe en arrière-plan (la requête part en keepalive).
  useEffect(() => {
    const flushNow = () => {
      // iOS peut geler puis tuer l'app juste après : si une sauvegarde est en vol, la
      // version la plus récente part tout de suite, hors file (keepalive). La file la
      // renverra quand même ensuite si l'app survit (même contenu, upsert idempotent).
      const latest = pendingEntryRef.current
        ?? queuedSaves.get(keyOf(userIdRef.current, dateRef.current))?.entry;
      if (latest && runningSaves > 0) dailyApi.save(latest).catch(() => {});
      flushPending().catch(() => {});
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };
    const onPageHide = () => { flushNow(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [flushPending]);

  const fetchEntry = useCallback(async () => {
    if (!userId) return;

    const loadSeq = ++loadSeqRef.current;
    entryRef.current = null;
    setState(s => ({ ...s, entry: null, recap: null, isLoading: true, error: null }));

    try {
      // Une sauvegarde de ce jour peut être en vol (envoyée au démontage) : la relire avant
      // qu'elle soit enregistrée afficherait l'état d'avant, que la saisie suivante écraserait.
      // Les sauvegardes d'autres jours ne retardent pas le chargement.
      await waitForSaveOfDay(keyOf(userId, date));
      const entry = await dailyApi.getByDate(date);

      let recap: DailyRecap | null = null;
      if (entry) {
        try {
          recap = await dailyApi.getRecap(date);
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 404)) throw e;
        }
      }

      if (loadSeq !== loadSeqRef.current) return;
      // Une version de ce jour n'a pas pu être enregistrée : on la réaffiche (plus récente
      // que celle du serveur) au lieu de la perdre, avec l'indicateur « non enregistré ».
      const shown = failedSaves.get(keyOf(userId, date))?.entry ?? entry;
      entryRef.current = shown;
      setState(s => ({ ...s, entry: shown, recap, isLoading: false, error: null }));
    } catch {
      if (loadSeq !== loadSeqRef.current) return;
      setState(s => ({ ...s, isLoading: false, error: 'Erreur de chargement' }));
    }
  }, [userId, date]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const edit = useCallback(
    (patch: (base: DailyCalories) => Partial<DailyCalories>) => {
      const current = entryRef.current;
      const base = current && current.date === date ? current : emptyEntry(date, userId);
      const updated = { ...base, ...patch(base), date };
      // Rien ne change (ex. décocher une séance déjà à 0, y compris un jour sans saisie) :
      // pas d'édition, pas de requête, pas de journée vide créée.
      if (sameEntryValues(base, updated)) return;
      editSeqRef.current++;
      entryRef.current = updated;
      setState(s => ({ ...s, entry: updated }));
      scheduleSave(updated);
    },
    [date, userId, scheduleSave],
  );

  const setMeal = useCallback(
    (meal: MealKey, v: number) => edit(base => {
      // Ancienne saisie sans détail : son total n'est remplacé par la somme des repas que
      // lorsqu'un repas est vraiment renseigné (cocher puis décocher ne l'efface pas).
      if (v <= 0 && mealsTotal(base.meals ?? NO_MEALS) === 0) return {};
      const meals = { ...(base.meals ?? NO_MEALS), [meal]: Math.max(0, v) };
      return { meals, caloriesConsumed: mealsTotal(meals) };
    }),
    [edit],
  );

  const setSteps = useCallback(
    (v: number) => edit(() => ({ steps: Math.max(0, v) })),
    [edit],
  );

  const setBurned = useCallback(
    (v: number) => edit(() => ({ caloriesBurned: Math.max(0, v) })),
    [edit],
  );

  const confirm = useCallback(async () => {
    if (!userId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingEntryRef.current = null;

    const current = entryRef.current;
    const base = current && current.date === date ? current : emptyEntry(date, userId);
    await enqueueSave({ ...base, date, confirmed: true });
  }, [userId, date, enqueueSave]);

  const retrySave = useCallback(async () => {
    // Une saisie en attente est plus récente que l'échec du même jour : elle le remplace.
    // Les échecs partent avant elle, pour qu'aucune version ancienne n'arrive en dernier.
    const pendingDate = pendingEntryRef.current?.date;
    const prefix = `${userIdRef.current}:`;
    const failed = [...failedSaves.entries()]
      .filter(([key, f]) => key.startsWith(prefix) && f.entry.date !== pendingDate)
      .map(([, f]) => f.entry);
    await Promise.allSettled([...failed.map(enqueueSave), flushPending()]);
  }, [flushPending, enqueueSave]);

  return {
    ...state,
    setMeal,
    setSteps,
    setBurned,
    confirm,
    retrySave,
    reload: fetchEntry,
  };
}
