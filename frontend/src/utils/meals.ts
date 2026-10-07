import type { Meals, MealKey } from '../types/api';

export const NO_MEALS: Meals = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };

export const MEAL_LABELS: Record<MealKey, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
};

export const MEAL_ORDER: MealKey[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function mealsTotal(m: Meals): number {
  return m.breakfast + m.lunch + m.snack + m.dinner;
}
