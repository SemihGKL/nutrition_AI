import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { weighInApi, type WeighIn } from '../api/weighIn';
import { useAuth } from './useAuth';

interface WeighInContextValue {
  needsBadge: boolean;
  latestWeighIn: WeighIn | null;
  refresh: () => Promise<void>;
}

const WeighInContext = createContext<WeighInContextValue>({
  needsBadge: false,
  latestWeighIn: null,
  refresh: async () => {},
});

export function useWeighInContext() {
  return useContext(WeighInContext);
}

export function WeighInProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [latestWeighIn, setLatestWeighIn] = useState<WeighIn | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await weighInApi.getLatest();
      setLatestWeighIn(data);
    } catch {
      // Erreur transitoire (serveur/réseau) : on garde la dernière valeur connue
      // plutôt que d'afficher à tort le badge « pesée à faire ».
    }
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const needsBadge = useMemo(
    () => computeNeedsBadge(user?.weighInDay ?? null, latestWeighIn),
    [user?.weighInDay, latestWeighIn],
  );

  return (
    <WeighInContext.Provider value={{ needsBadge, latestWeighIn, refresh }}>
      {children}
    </WeighInContext.Provider>
  );
}

const DAY_OFFSET: Record<string, number> = {
  MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2,
  THURSDAY: 3, FRIDAY: 4, SATURDAY: 5, SUNDAY: 6,
};

function computeNeedsBadge(weighInDay: string | null, latest: WeighIn | null): boolean {
  if (!weighInDay) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Monday of the current week
  const weekStart = new Date(today);
  const dow = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - (dow - 1));

  // Target date this week
  const targetDate = new Date(weekStart);
  targetDate.setDate(weekStart.getDate() + (DAY_OFFSET[weighInDay] ?? 0));

  if (targetDate > today) return false;

  if (!latest) return true;

  const latestDate = new Date(latest.date + 'T00:00:00');
  return latestDate < weekStart;
}
