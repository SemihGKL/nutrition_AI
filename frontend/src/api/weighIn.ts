import { api } from './client';

export interface WeighIn {
  id?: number;
  date: string;
  weight: number;
  note?: string;
  user: { id: number };
}

export const weighInApi = {
  getAll: (userId: number) =>
    api.get<WeighIn[]>(`/api/weighin/${userId}`),

  getLatest: (userId: number) =>
    api.get<WeighIn>(`/api/weighin/${userId}/latest`),

  save: (data: WeighIn) =>
    api.post<WeighIn>('/api/weighin', data),
};
