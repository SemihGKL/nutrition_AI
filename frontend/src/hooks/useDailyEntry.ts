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

/**
 * Saisie du jour avec sauvegarde automatique.
 *
 * Invariants :
 *  - les sauvegardes sont sérialisées (une seule requête en vol), sinon une réponse
 *    ancienne pourrait écraser côté serveur une saisie plus récente ;
 *  - la réponse d'une sauvegarde n'est appliquée que si aucune édition n'a eu lieu
 *    depuis son envoi et que la date affichée est toujours la sienne ;
 *  - une réponse de chargement n'est appliquée que si c'est le dernier chargement lancé ;
 *  - une sauvegarde échouée reste mémorisée (par date) jusqu'à ce qu'une sauvegarde
 *    ultérieure du même jour réussisse, et peut être relancée via `retrySave`.
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
    saveFailed: false,
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
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const failedSavesRef = useRef(new Map<string, DailyCalories>());

  const enqueueSave = useCallback((toSave: DailyCalories): Promise<void> => {
    const editSeqAtEnqueue = editSeqRef.current;
    const isDisplayed = () => dateRef.current === toSave.date;

    const run = async () => {
      setState(s => ({ ...s, isSaving: true }));
      try {
        const saved = await dailyApi.save(toSave);
        failedSavesRef.current.delete(toSave.date);
        if (isDisplayed() && editSeqRef.current === editSeqAtEnqueue) {
          entryRef.current = saved;
          setState(s => ({ ...s, entry: saved }));
        }
      } catch (e) {
        failedSavesRef.current.set(toSave.date, toSave);
        throw e;
      } finally {
        setState(s => ({ ...s, isSaving: false, saveFailed: failedSavesRef.current.size > 0 }));
      }

      // Le recap n'est qu'un affichage dérivé : son échec ne rend pas la saisie non enregistrée.
      try {
        const recap = await dailyApi.getRecap(toSave.date);
        if (isDisplayed()) setState(s => ({ ...s, recap }));
      } catch {
        // recap rechargé à la prochaine sauvegarde
      }
    };

    const result = saveChainRef.current.then(run);
    saveChainRef.current = result.catch(() => {});
    return result;
  }, []);

  const flushPending = useCallback((): Promise<void> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const toSave = pendingEntryRef.current;
    if (!toSave) return saveChainRef.current;
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
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPending().catch(() => {});
    };
    const onPageHide = () => { flushPending().catch(() => {}); };
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
      entryRef.current = entry;
      setState(s => ({ ...s, entry, recap, isLoading: false, error: null }));
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
      editSeqRef.current++;
      entryRef.current = updated;
      setState(s => ({ ...s, entry: updated }));
      scheduleSave(updated);
    },
    [date, userId, scheduleSave],
  );

  const setMeal = useCallback(
    (meal: MealKey, v: number) => edit(base => {
      // Une ancienne saisie sans détail n'a aucun repas : le total direct est
      // remplacé par la somme des repas dès le premier repas renseigné.
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
    const failed = [...failedSavesRef.current.values()].filter(e => e.date !== pendingDate);
    const results = [...failed.map(enqueueSave), flushPending()];
    await Promise.allSettled(results);
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
