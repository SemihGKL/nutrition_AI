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
import { dailyApi } from '../daily';
import type { DailyCalories } from '../../types/api';

describe('dailyApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /api/daily-kcal without any userId in the path', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await dailyApi.getAll();

    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.get).mock.calls[0][0];
    expect(calledPath).toBe('/api/daily-kcal');
    expect(calledPath).not.toMatch(/userId/i);
    expect(calledPath).not.toMatch(/\/\d+/);
  });

  it('getByDate calls GET /api/daily-kcal/{date} with the exact date string', async () => {
    const date = '2026-06-11';
    vi.mocked(api.get).mockResolvedValue({ id: 1, date } as DailyCalories);

    await dailyApi.getByDate(date);

    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.get).mock.calls[0][0];
    expect(calledPath).toBe(`/api/daily-kcal/${date}`);
  });

  it('getByDate returns null when the response is 404', async () => {
    const { ApiError } = await import('../client');
    vi.mocked(api.get).mockRejectedValue(new ApiError(404, 'Not Found'));

    const result = await dailyApi.getByDate('2026-06-11');

    expect(result).toBeNull();
  });

  it('save calls POST /api/daily-kcal with body containing date caloriesConsumed steps caloriesBurned confirmed but no userId', async () => {
    const entry: DailyCalories = {
      date: '2026-06-11',
      caloriesConsumed: 1800,
      steps: 8000,
      caloriesBurned: 300,
      confirmed: false,
      user: { id: 1 },
    };
    vi.mocked(api.post).mockResolvedValue(entry);

    await dailyApi.save(entry);

    expect(vi.mocked(api.post)).toHaveBeenCalledTimes(1);
    const [calledPath, calledBody] = vi.mocked(api.post).mock.calls[0];
    expect(calledPath).toBe('/api/daily-kcal');
    expect(calledBody).not.toHaveProperty('userId');
    expect(calledBody).toHaveProperty('date', '2026-06-11');
    expect(calledBody).toHaveProperty('caloriesConsumed', 1800);
    expect(calledBody).toHaveProperty('steps', 8000);
    expect(calledBody).toHaveProperty('caloriesBurned', 300);
    expect(calledBody).toHaveProperty('confirmed', false);
  });

  it('getRecap calls GET /api/daily-kcal/{date}/recap with the exact date string', async () => {
    const date = '2026-06-11';
    vi.mocked(api.get).mockResolvedValue({ totalCalories: 1800 });

    await dailyApi.getRecap(date);

    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.get).mock.calls[0][0];
    expect(calledPath).toBe(`/api/daily-kcal/${date}/recap`);
  });
});
