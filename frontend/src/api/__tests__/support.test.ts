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
import { supportApi } from '../support';

describe('supportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('send calls POST /api/support with category and message', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);

    await supportApi.send({ category: 'IMPROVEMENT', message: 'Un mode sombre svp' });

    expect(vi.mocked(api.post)).toHaveBeenCalledTimes(1);
    const [calledPath, calledBody] = vi.mocked(api.post).mock.calls[0];
    expect(calledPath).toBe('/api/support');
    expect(calledBody).toHaveProperty('category', 'IMPROVEMENT');
    expect(calledBody).toHaveProperty('message', 'Un mode sombre svp');
  });

  it('send forwards the PROBLEM category as-is', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);

    await supportApi.send({ category: 'PROBLEM', message: 'Une page plante' });

    const [, calledBody] = vi.mocked(api.post).mock.calls[0];
    expect(calledBody).toHaveProperty('category', 'PROBLEM');
  });
});
