import { api } from './client';
import type { User } from '../types/api';

export interface UpdateUserPayload {
  username: string;
  gender: string;
  age: number;
  height: number;
  activityLevel: string;
  currentWeight: number;
}

export const usersApi = {
  getAll: () => api.get<User[]>('/api/users'),
  getById: (id: number) => api.get<User>(`/api/users/${id}`),
  update: (id: number, payload: UpdateUserPayload) =>
    api.put<User>(`/api/users/${id}`, payload),
};
