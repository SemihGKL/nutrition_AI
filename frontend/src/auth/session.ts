import type { User } from '../types/api';

export const TOKEN_STORAGE_KEY = 'kaloriim_token';
export const USER_STORAGE_KEY  = 'kaloriim_user';

// ── Persistence ──────────────────────────────────────────────

export function readPersistedToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function readPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function persistTokenOnly(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function persistAuthSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

// ── Token validity ────────────────────────────────────────────

export function isTokenExpired(token: string): boolean {
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function extractEmailFromToken(token: string): string | null {
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64)) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function hasActiveSession(): boolean {
  const token = readPersistedToken();
  return token !== null && !isTokenExpired(token);
}
