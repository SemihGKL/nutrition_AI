import { api } from './client';

export interface WeighIn {
  id?: number;
  date: string;
  weight: number;
  note?: string;
}

export interface WeighInRequest {
  date: string;
  weight: number;
  userId: number;
  note?: string;
}

export const weighInApi = {
  getAll: (userId: number) =>
    api.get<WeighIn[]>(`/api/weighin/${userId}`),

  getLatest: (userId: number): Promise<WeighIn | null> =>
    api.get<WeighIn | undefined>(`/api/weighin/${userId}/latest`)
      .then(data => data ?? null),

  save: (data: WeighInRequest) =>
    api.post<WeighIn>('/api/weighin', data),
};
