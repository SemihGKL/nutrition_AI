import { useState, useEffect, useRef, useCallback } from 'react';
import { dailyApi } from '../api/daily';
import { ApiError } from '../api/client';
import { readPersistedToken } from '../auth/session';
import type { DailyCalories, DailyRecap } from '../types/api';

interface EntryState {
  entry: DailyCalories | null;
  recap: DailyRecap | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface EntryActions {
  setCalories: (v: number) => void;
  setSteps: (v: number) => void;
  setBurned: (v: number) => void;
  confirm: () => Promise<void>;
}

export function useDailyEntry(
  userId: number | undefined,
  date: string,
): EntryState & EntryActions {
  const [state, setState] = useState<EntryState>({
    entry: null,
    recap: null,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEntryRef = useRef<DailyCalories | null>(null);

  useEffect(() => {
    const flushOnUnload = () => {
      const toSave = pendingEntryRef.current;
      if (!toSave || !userId) return;
      const token = readPersistedToken();
      fetch('/api/daily-kcal', {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: toSave.id ?? null,
          date: toSave.date,
          caloriesConsumed: toSave.caloriesConsumed,
          steps: toSave.steps,
          caloriesBurned: toSave.caloriesBurned,
          confirmed: toSave.confirmed,
        }),
      });
    };
    window.addEventListener('beforeunload', flushOnUnload);
    return () => window.removeEventListener('beforeunload', flushOnUnload);
  }, [userId]);

  const fetchEntry = useCallback(async () => {
    if (!userId) return;

    setState(s => ({ ...s, isLoading: true, error: null }));

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

      setState({ entry, recap, isLoading: false, isSaving: false, error: null });
    } catch {
      setState(s => ({ ...s, isLoading: false, error: 'Erreur de chargement' }));
    }
  }, [userId, date]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const scheduleSave = useCallback(
    (updatedEntry: DailyCalories) => {
      if (!userId) return;
      pendingEntryRef.current = updatedEntry;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        const toSave = pendingEntryRef.current;
        if (!toSave) return;

        setState(s => ({ ...s, isSaving: true }));

        try {
          const saved = await dailyApi.save(toSave);
          const recap = await dailyApi.getRecap(date);
          setState(s => ({
            ...s,
            entry: saved,
            recap,
            isSaving: false,
          }));
          pendingEntryRef.current = null;
        } catch {
          setState(s => ({ ...s, isSaving: false }));
        }
      }, 800);
    },
    [userId, date],
  );

  function buildEntry(patch: Partial<DailyCalories>): DailyCalories {
    const base = state.entry ?? {
      date,
      caloriesConsumed: 0,
      caloriesBurned: 0,
      steps: 0,
      confirmed: false,
      userId: userId!,
    };
    return { ...base, ...patch };
  }

  const setCalories = useCallback(
    (v: number) => {
      const updated = buildEntry({ caloriesConsumed: Math.max(0, v) });
      setState(s => ({ ...s, entry: updated }));
      scheduleSave(updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.entry, scheduleSave],
  );

  const setSteps = useCallback(
    (v: number) => {
      const updated = buildEntry({ steps: Math.max(0, v) });
      setState(s => ({ ...s, entry: updated }));
      scheduleSave(updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.entry, scheduleSave],
  );

  const setBurned = useCallback(
    (v: number) => {
      const updated = buildEntry({ caloriesBurned: Math.max(0, v) });
      setState(s => ({ ...s, entry: updated }));
      scheduleSave(updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.entry, scheduleSave],
  );

  const confirm = useCallback(async () => {
    if (!userId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingEntryRef.current = null;

    const toConfirm = buildEntry({ confirmed: true });
    setState(s => ({ ...s, isSaving: true }));

    try {
      const saved = await dailyApi.save(toConfirm);
      const recap = await dailyApi.getRecap(date);
      setState(s => ({
        ...s,
        entry: saved,
        recap,
        isSaving: false,
      }));
    } catch {
      setState(s => ({ ...s, isSaving: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, date, state.entry]);

  return {
    ...state,
    setCalories,
    setSteps,
    setBurned,
    confirm,
  };
}
