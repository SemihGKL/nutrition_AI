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
  getAll: () => api.get<User[]>('/api/users'),
  getById: (id: number) => api.get<User>(`/api/users/${id}`),
  getMe: () => api.get<User>('/api/users/me'),
  update: (_id: number, payload: UpdateUserPayload) =>
    api.put<User>('/api/users/me', payload),
};
