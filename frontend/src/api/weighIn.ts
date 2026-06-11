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
  note?: string;
}

export const weighInApi = {
  getAll: (): Promise<WeighIn[]> =>
    api.get<WeighIn[]>('/api/weighin'),

  getLatest: (): Promise<WeighIn | null> =>
    api.get<WeighIn>('/api/weighin/latest').catch(() => null),

  save: (data: WeighInRequest): Promise<WeighIn> =>
    api.post<WeighIn>('/api/weighin', data),
};
