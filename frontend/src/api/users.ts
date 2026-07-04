import { api } from './client';
import type { User } from '../types/api';

export interface UpdateUserPayload {
  username: string;
  gender: string;
  age: number;
  height: number;
  currentWeight: number;
  weighInDay: string;
  dailyCalorieGoal: number;
  dailyStepsGoal?: number | null;
}

export const usersApi = {
  getMe: () => api.get<User>('/api/users/me'),
  update: (_id: number, payload: UpdateUserPayload) =>
    api.put<User>('/api/users/me', payload),
};
