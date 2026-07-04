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

  // 204 (aucune pesée) → le client renvoie undefined, qu'on normalise en null.
  // Les vraies erreurs (500, réseau) remontent : à l'appelant de décider (cf. useWeighIn).
  getLatest: async (): Promise<WeighIn | null> => {
    const res = await api.get<WeighIn | undefined>('/api/weighin/latest');
    return res ?? null;
  },

  save: (data: WeighInRequest): Promise<WeighIn> =>
    api.post<WeighIn>('/api/weighin', data),
};
