import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, ApiError } from '../client';
import { sessionBus } from '../../auth/sessionBus';

const TOKEN_KEY = 'kaloriim_token';

function fakeRes(status: number, json: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => json,
    text: async () => JSON.stringify(json),
  };
}

function authHeader(call: unknown[]): string | undefined {
  const opts = call[1] as { headers?: Record<string, string> } | undefined;
  return opts?.headers?.Authorization;
}

describe('api client — refresh on 401', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should refresh the token and retry once after a 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(fakeRes(401))                          // requête initiale
      .mockResolvedValueOnce(fakeRes(200, { accessToken: 'new' }))  // /api/auth/refresh
      .mockResolvedValueOnce(fakeRes(200, { data: 'ok' }));         // rejeu
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.get<{ data: string }>('/api/daily-kcal');

    expect(result).toEqual({ data: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/auth/refresh');
    expect(authHeader(fetchMock.mock.calls[2])).toBe('Bearer new'); // rejeu avec le nouveau token
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new');
  });

  it('should share a single refresh across concurrent 401s (single-flight)', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired');
    let refreshCount = 0;
    const fetchMock = vi.fn(async (url: string, opts?: { headers?: Record<string, string> }) => {
      if (String(url).endsWith('/api/auth/refresh')) {
        refreshCount++;
        return fakeRes(200, { accessToken: 'new' });
      }
      if (opts?.headers?.Authorization === 'Bearer expired') return fakeRes(401);
      return fakeRes(200, { ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([
      api.get<{ ok: boolean }>('/api/daily-kcal'),
      api.get<{ ok: boolean }>('/api/objectives'),
    ]);

    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
    expect(refreshCount).toBe(1); // un seul appel /refresh malgré deux 401 concurrents
  });

  it('should emit sessionExpired and throw when the refresh fails', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired');
    const fetchMock = vi.fn(async () => fakeRes(401));
    vi.stubGlobal('fetch', fetchMock);
    const spy = vi.spyOn(sessionBus, 'emitSessionExpired');

    await expect(api.get('/api/daily-kcal')).rejects.toBeInstanceOf(ApiError);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should NOT attempt a refresh on a 401 when there is no session (e.g. failed login)', async () => {
    const fetchMock = vi.fn(async () => fakeRes(401));
    vi.stubGlobal('fetch', fetchMock);
    const spy = vi.spyOn(sessionBus, 'emitSessionExpired');

    await expect(api.post('/api/auth/login', { email: 'x', password: 'y' }))
      .rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // pas de tentative de refresh
    expect(spy).not.toHaveBeenCalled();
  });
});
