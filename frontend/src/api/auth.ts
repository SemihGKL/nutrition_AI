import { api } from './client';
import type { AuthTokens } from '../types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  gender: string;
  age: number;
  height: number;
  startWeight: number;
  weightGoal: number;
  weighInDay: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthTokens>('/api/auth/login', payload),

  register: (payload: RegisterPayload) =>
    api.post<AuthTokens>('/api/auth/register', payload),

  // Révoque le refresh token côté serveur et efface le cookie.
  logout: () => api.post<void>('/api/auth/logout', {}),

  forgotPassword: (email: string) =>
    api.post<void>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<void>('/api/auth/reset-password', { token, newPassword }),
};
