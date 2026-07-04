export interface User {
  id: number;
  username: string;
  email: string;
  dailyCalorieGoal: number;
  weightGoal: number;
  gender: string;
  age: number;
  height: number;
  startWeight: number;
  currentWeight: number;
  weighInDay: string | null;
  dailyStepsGoal: number | null;
}

export interface WeighIn {
  id: number;
  date: string;
  weight: number;
  note?: string;
}

export interface DailyCalories {
  id?: number;
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  steps: number;
  confirmed: boolean;
  userId: number;
}

export interface DailyRecap {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  steps: number;
  stepsKcal: number;
  netCalories: number;
  dailyCalorieGoal: number;
  mbr: number;
  tdee: number;
  deficit: number;
  deficitPercentage: number;
  confirmed: boolean;
}

export interface AuthTokens {
  token: string;
  user: User;
}

export type DayStatus = 'hit' | 'miss' | 'today' | 'future';

export interface ObjectiveDto {
  id: number;
  dayOfWeek: number;
  label: string;
  position: number;
  type: string;
  targetValue: number | null;
}
