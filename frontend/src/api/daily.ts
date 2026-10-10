import { api, ApiError } from './client';
import type { DailyCalories, DailyRecap } from '../types/api';

const SAVE_TIMEOUT_MS = 15_000;

export const dailyApi = {
  getByDate: (date: string): Promise<DailyCalories | null> =>
    api.get<DailyCalories>(`/api/daily-kcal/${date}`).catch(e => {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }),

  getAll: (): Promise<DailyCalories[]> =>
    api.get<DailyCalories[]>('/api/daily-kcal'),

  save: (entry: DailyCalories): Promise<DailyCalories> =>
    api.post<DailyCalories>('/api/daily-kcal', {
      id: entry.id ?? null,
      date: entry.date,
      caloriesConsumed: entry.caloriesConsumed,
      meals: entry.meals ?? null,
      steps: entry.steps,
      caloriesBurned: entry.caloriesBurned,
      confirmed: entry.confirmed,
    }, {
      keepalive: true, // la requête doit survivre au passage en arrière-plan / à la fermeture
      // Une requête sans réponse ne doit pas bloquer indéfiniment la file de sauvegarde.
      signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
    }),

  getRecap: (date: string): Promise<DailyRecap> =>
    api.get<DailyRecap>(`/api/daily-kcal/${date}/recap`),
};
