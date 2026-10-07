import { api } from './client';

export type MealReminderMeal = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';

export interface MealReminder {
  meal: MealReminderMeal;
  time: string; // HH:mm, heure de Paris
  enabled: boolean;
}

export const mealRemindersApi = {
  getAll: () => api.get<MealReminder[]>('/api/meal-reminders'),
  /** Enregistre les repas fournis ; renvoie la configuration complète des 4 repas. */
  update: (changes: MealReminder[]) => api.put<MealReminder[]>('/api/meal-reminders', changes),
};
