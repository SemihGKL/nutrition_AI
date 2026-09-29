import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../api/daily', () => ({
  dailyApi: { getAll: vi.fn() },
}));

vi.mock('../../hooks/useDailyEntry', () => ({
  waitForPendingDailySaves: vi.fn(),
}));

import { dailyApi } from '../../api/daily';
import { waitForPendingDailySaves } from '../../hooks/useDailyEntry';
import { useAllEntries } from '../../hooks/useAllEntries';
import type { DailyCalories } from '../../types/api';

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>(res => { resolve = res; });
  return { promise, resolve };
}

const entry = (date: string, caloriesConsumed: number): DailyCalories => ({
  date, caloriesConsumed, caloriesBurned: 0, steps: 0, confirmed: true, userId: 1,
});

describe('useAllEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(waitForPendingDailySaves).mockResolvedValue(undefined);
  });

  it('charge toutes les entrees au montage', async () => {
    vi.mocked(dailyApi.getAll).mockResolvedValue([entry('2026-09-29', 1800)]);

    const { result } = renderHook(() => useAllEntries(true, 'jour'));

    await waitFor(() => expect(result.current.entries).toEqual([entry('2026-09-29', 1800)]));
  });

  it('ne charge rien sans utilisateur connecte', async () => {
    renderHook(() => useAllEntries(false, 'jour'));
    await act(async () => { await Promise.resolve(); });
    expect(vi.mocked(dailyApi.getAll)).not.toHaveBeenCalled();
  });

  it('attend les sauvegardes du jour en cours avant de recharger', async () => {
    const saves = deferred<void>();
    vi.mocked(waitForPendingDailySaves).mockReturnValue(saves.promise);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    renderHook(() => useAllEntries(true, 'semaine'));
    await act(async () => { await Promise.resolve(); });
    expect(vi.mocked(dailyApi.getAll)).not.toHaveBeenCalled();

    await act(async () => { saves.resolve(); });
    await waitFor(() => expect(vi.mocked(dailyApi.getAll)).toHaveBeenCalledTimes(1));
  });

  it('ignore une reponse plus ancienne arrivee apres la plus recente', async () => {
    const first = deferred<DailyCalories[]>();
    const second = deferred<DailyCalories[]>();
    vi.mocked(dailyApi.getAll)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ tab }) => useAllEntries(true, tab),
      { initialProps: { tab: 'jour' } },
    );
    await waitFor(() => expect(vi.mocked(dailyApi.getAll)).toHaveBeenCalledTimes(1));
    rerender({ tab: 'semaine' });
    await waitFor(() => expect(vi.mocked(dailyApi.getAll)).toHaveBeenCalledTimes(2));

    await act(async () => { second.resolve([entry('2026-09-29', 2000)]); });
    await act(async () => { first.resolve([entry('2026-09-29', 1500)]); });

    expect(result.current.entries).toEqual([entry('2026-09-29', 2000)]);
  });

  it('refresh recharge les entrees a la demande', async () => {
    vi.mocked(dailyApi.getAll)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([entry('2026-09-29', 1800)]);

    const { result } = renderHook(() => useAllEntries(true, 'jour'));
    await waitFor(() => expect(vi.mocked(dailyApi.getAll)).toHaveBeenCalledTimes(1));

    await act(async () => { result.current.refresh(); });

    await waitFor(() => expect(result.current.entries).toEqual([entry('2026-09-29', 1800)]));
  });
});
