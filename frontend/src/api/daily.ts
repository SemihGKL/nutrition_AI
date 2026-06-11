import { api, ApiError } from './client';
import type { DailyCalories, DailyRecap } from '../types/api';

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
      steps: entry.steps,
      caloriesBurned: entry.caloriesBurned,
      confirmed: entry.confirmed,
    }),

  getRecap: (date: string): Promise<DailyRecap> =>
    api.get<DailyRecap>(`/api/daily-kcal/${date}/recap`),
};
