import { api } from './client';
import type { DailyCalories, DailyRecap } from '../types/api';

export const dailyApi = {
  getByDate: (userId: number, date: string) =>
    api.get<DailyCalories[]>(`/api/daily-kcal/${userId}/${date}`),

  getAll: (userId: number) =>
    api.get<DailyCalories[]>(`/api/daily-kcal/${userId}`),

  save: (entry: DailyCalories) =>
    api.post<DailyCalories>('/api/daily-kcal', {
      id: entry.id ?? null,
      userId: entry.user.id,
      date: entry.date,
      caloriesConsumed: entry.caloriesConsumed,
      steps: entry.steps,
      caloriesBurned: entry.caloriesBurned,
      confirmed: entry.confirmed,
    }),

  getRecap: (userId: number, date: string) =>
    api.get<DailyRecap>(`/api/daily-kcal/${userId}/recap?date=${date}`),
};
