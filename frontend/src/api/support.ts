import { api } from './client';

export type SupportCategory = 'PROBLEM' | 'IMPROVEMENT';

export interface SupportPayload {
  category: SupportCategory;
  message: string;
}

export const supportApi = {
  send: (payload: SupportPayload) =>
    api.post<void>('/api/support', payload),
};
