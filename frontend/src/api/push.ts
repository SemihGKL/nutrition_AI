import { api } from './client';

export interface PushSubscribePayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export const pushApi = {
  getVapidPublicKey: () =>
    api.get<{ publicKey: string }>('/api/push/vapid-public-key'),
  subscribe: (payload: PushSubscribePayload) =>
    api.post<void>('/api/push/subscribe', payload),
  unsubscribe: (payload: { endpoint: string }) =>
    api.post<void>('/api/push/unsubscribe', payload),
};
