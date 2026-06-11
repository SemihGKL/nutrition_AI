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
      delete: vi.fn(),
    },
  };
});

import { api } from '../client';
import { objectivesApi } from '../objectives';

describe('objectivesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /api/objectives without any userId in the path', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await objectivesApi.getAll();

    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.get).mock.calls[0][0];
    expect(calledPath).toBe('/api/objectives');
    expect(calledPath).not.toMatch(/userId/i);
    expect(calledPath).not.toMatch(/\/\d+/);
  });

  it('create calls POST /api/objectives with body containing dayOfWeek and label but not userId', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 1, dayOfWeek: 2, label: 'Méditer', position: 0 });

    await objectivesApi.create(2, 'Méditer');

    expect(vi.mocked(api.post)).toHaveBeenCalledTimes(1);
    const [calledPath, calledBody] = vi.mocked(api.post).mock.calls[0];
    expect(calledPath).toBe('/api/objectives');
    expect(calledBody).toHaveProperty('dayOfWeek', 2);
    expect(calledBody).toHaveProperty('label', 'Méditer');
    expect(calledBody).not.toHaveProperty('userId');
  });

  it('remove calls DELETE /api/objectives/{id} with the correct id in the path', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);

    await objectivesApi.remove(5);

    expect(vi.mocked(api.delete)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.delete).mock.calls[0][0];
    expect(calledPath).toBe('/api/objectives/5');
  });

  it('markDone calls POST /api/objectives/{id}/completions/{date} with the correct id and date', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);

    await objectivesApi.markDone(5, '2026-06-10');

    expect(vi.mocked(api.post)).toHaveBeenCalledTimes(1);
    const [calledPath] = vi.mocked(api.post).mock.calls[0];
    expect(calledPath).toBe('/api/objectives/5/completions/2026-06-10');
  });

  it('markUndone calls DELETE /api/objectives/{id}/completions/{date} with the correct id and date', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);

    await objectivesApi.markUndone(5, '2026-06-10');

    expect(vi.mocked(api.delete)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.delete).mock.calls[0][0];
    expect(calledPath).toBe('/api/objectives/5/completions/2026-06-10');
  });

  it('getCompletions calls GET /api/objectives/completions with from and to as query parameters', async () => {
    vi.mocked(api.get).mockResolvedValue({});

    await objectivesApi.getCompletions('2026-06-01', '2026-06-07');

    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1);
    const calledPath: string = vi.mocked(api.get).mock.calls[0][0];
    expect(calledPath).toContain('/api/objectives/completions');
    expect(calledPath).toContain('from=2026-06-01');
    expect(calledPath).toContain('to=2026-06-07');
  });
});
