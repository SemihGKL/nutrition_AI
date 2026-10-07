import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 1, currentWeight: 70 } }) }));

vi.mock('../../api/objectives', () => ({
  objectivesApi: {
    getAll: vi.fn(),
    getCompletions: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    markDone: vi.fn(),
    markUndone: vi.fn(),
  },
}));

vi.mock('../../hooks/useDailyEntry', () => ({
  waitForPendingDailySaves: vi.fn(),
}));

import { objectivesApi } from '../../api/objectives';
import { waitForPendingDailySaves } from '../../hooks/useDailyEntry';
import { ObjectifsPage } from '../../pages/ObjectifsPage';

describe('ObjectifsPage — après une saisie du jour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(objectivesApi.getAll).mockResolvedValue([]);
    vi.mocked(objectivesApi.getCompletions).mockResolvedValue({});
  });

  it('attend la sauvegarde du jour avant de charger les completions (auto-completion SPORT)', async () => {
    let resolveSaves!: () => void;
    vi.mocked(waitForPendingDailySaves).mockReturnValue(new Promise<void>(res => { resolveSaves = res; }));

    render(<ObjectifsPage onTabChange={vi.fn()} />);
    await act(async () => { await Promise.resolve(); });
    expect(vi.mocked(objectivesApi.getCompletions)).not.toHaveBeenCalled();

    await act(async () => { resolveSaves(); });
    await waitFor(() => expect(vi.mocked(objectivesApi.getCompletions)).toHaveBeenCalledTimes(1));
  });
});
