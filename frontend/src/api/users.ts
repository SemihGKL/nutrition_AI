import { api } from './client';
import type { User } from '../types/api';

export const usersApi = {
  getAll: () => api.get<User[]>('/api/users'),
  getById: (id: number) => api.get<User>(`/api/users/${id}`),
};
