import { readPersistedToken, persistTokenOnly } from '../auth/session';
import { sessionBus } from '../auth/sessionBus';

const BASE = import.meta.env.VITE_API_URL ?? '';

// Un seul refresh en vol à la fois : plusieurs 401 concurrents (le dashboard tire
// plusieurs requêtes en parallèle) partagent le même appel /api/auth/refresh.
// Évite une rafale de refresh qui, côté serveur, se supprimeraient mutuellement
// (la rotation est mono-token par utilisateur).
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Tente de renouveler l'access token via le cookie httpOnly `refresh_token`.
 * Renvoie le nouveau token (déjà persisté) ou `null` si le refresh échoue.
 * Exporté pour le refresh silencieux au démarrage (voir useAuth).
 */
export function refreshSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken: string };
        persistTokenOnly(data.accessToken);
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = readPersistedToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (!res.ok) {
    // 401 sur une requête authentifiée : on tente UN refresh silencieux puis on rejoue
    // une seule fois. Sans token en cours (ex. échec de login), on ne fait rien de spécial.
    if (res.status === 401 && token) {
      if (retry) {
        const newToken = await refreshSession();
        if (newToken) {
          return request<T>(path, options, false);
        }
      }
      sessionBus.emitSessionExpired();
    }
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
