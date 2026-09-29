import { useState, useEffect, useRef, useCallback } from 'react';
import { dailyApi } from '../api/daily';
import { waitForPendingDailySaves } from './useDailyEntry';
import type { DailyCalories } from '../types/api';

/**
 * Liste des entrées journalières, rechargée à chaque changement d'onglet.
 * Attend les sauvegardes de saisie en cours (sinon la liste montre l'état d'avant)
 * et ignore toute réponse plus ancienne que la dernière demande.
 */
export function useAllEntries(isAuthenticated: boolean, tab: string) {
  const [entries, setEntries] = useState<DailyCalories[]>([]);
  const requestSeqRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    const seq = ++requestSeqRef.current;
    try {
      await waitForPendingDailySaves();
      const all = await dailyApi.getAll();
      if (seq === requestSeqRef.current) setEntries(all);
    } catch {
      // liste conservée, rechargée au prochain changement d'onglet
    }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh, tab]);

  return { entries, refresh };
}
