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
  activityLevel: string;
  startWeight: number;
  weightGoal: number;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthTokens>('/api/auth/login', payload),

  register: (payload: RegisterPayload) =>
    api.post<AuthTokens>('/api/auth/register', payload),
};
