import { api } from './client';
import type { ObjectiveDto } from '../types/api';

export interface CompletionsMap {
  [date: string]: number[];
}

export const objectivesApi = {
  getAll: (): Promise<ObjectiveDto[]> =>
    api.get('/api/objectives'),

  create: (dayOfWeek: number, label: string, type = 'CUSTOM', targetValue?: number): Promise<ObjectiveDto> =>
    api.post('/api/objectives', { dayOfWeek, label, type, targetValue: targetValue ?? null }),

  remove: (id: number): Promise<void> =>
    api.delete(`/api/objectives/${id}`),

  markDone: (id: number, date: string): Promise<void> =>
    api.post(`/api/objectives/${id}/completions/${date}`, {}),

  markUndone: (id: number, date: string): Promise<void> =>
    api.delete(`/api/objectives/${id}/completions/${date}`),

  getCompletions: (from: string, to: string): Promise<CompletionsMap> =>
    api.get(`/api/objectives/completions?from=${from}&to=${to}`),
};
