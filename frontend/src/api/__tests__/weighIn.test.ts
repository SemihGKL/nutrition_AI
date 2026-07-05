import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../client', async () => {
  const { ApiError } = await vi.importActual<typeof import('../client')>('../client');
  return {
    ApiError,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    },
  };
});

import { api } from '../client';
import { weighInApi } from '../weighIn';
import type { WeighInRequest } from '../weighIn';

describe('weighInApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /api/weighin without any userId in the path', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await weighInApi.getAll();

    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.get).mock.calls[0][0];
    expect(calledPath).toBe('/api/weighin');
    expect(calledPath).not.toMatch(/userId/i);
    expect(calledPath).not.toMatch(/\/\d+/);
  });

  it('getLatest calls GET /api/weighin/latest', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 1, date: '2026-06-11', weight: 80 });

    await weighInApi.getLatest();

    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.get).mock.calls[0][0];
    expect(calledPath).toBe('/api/weighin/latest');
  });

  it('getLatest returns null when there is no weigh-in (empty 204 → undefined)', async () => {
    vi.mocked(api.get).mockResolvedValue(undefined);

    const result = await weighInApi.getLatest();

    expect(result).toBeNull();
  });

  it('getLatest propagates errors instead of masking them as "no weigh-in"', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    await expect(weighInApi.getLatest()).rejects.toThrow('Network error');
  });

  it('save calls POST /api/weighin with body containing date weight and note but no userId', async () => {
    const data: WeighInRequest = {
      date: '2026-06-11',
      weight: 80.5,
      note: 'Morning weight',
    };
    vi.mocked(api.post).mockResolvedValue({ id: 1, ...data });

    await weighInApi.save(data);

    expect(vi.mocked(api.post)).toHaveBeenCalledTimes(1);
    const [calledPath, calledBody] = vi.mocked(api.post).mock.calls[0];
    expect(calledPath).toBe('/api/weighin');
    expect(calledBody).not.toHaveProperty('userId');
    expect(calledBody).toHaveProperty('date', '2026-06-11');
    expect(calledBody).toHaveProperty('weight', 80.5);
    expect(calledBody).toHaveProperty('note', 'Morning weight');
  });
});
