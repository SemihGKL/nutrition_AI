import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../api/daily', () => ({
  dailyApi: {
    getByDate: vi.fn(),
    getRecap: vi.fn(),
    save: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock('../../auth/session', () => ({
  readPersistedToken: () => 'mock-token',
  hasActiveSession: () => true,
  readPersistedUser: () => null,
  persistAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
}));

import { dailyApi } from '../../api/daily';
import { useDailyEntry } from '../../hooks/useDailyEntry';
import type { DailyCalories, DailyRecap } from '../../types/api';

const TODAY = '2026-06-22';
const USER_ID = 1;

const mockEntry: DailyCalories = {
  id: 42,
  date: TODAY,
  caloriesConsumed: 1500,
  caloriesBurned: 200,
  steps: 8000,
  confirmed: false,
  user: { id: USER_ID },
};

const mockRecap: DailyRecap = {
  date: TODAY,
  caloriesConsumed: 1500,
  caloriesBurned: 200,
  steps: 8000,
  stepsKcal: 100,
  netCalories: 1300,
  dailyCalorieGoal: 1800,
  mbr: 1750,
  tdee: 2100,
  deficit: 300,
  deficitPercentage: 16,
  confirmed: false,
};

// Les tests utilisent les vrais timers sauf le test de debounce
// pour que waitFor fonctionne normalement.

describe('useDailyEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers(); // securite si un test active les fake timers
  });

  it('demarre en chargement puis expose entree et recap', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(mockEntry);
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entry).toEqual(mockEntry);
    expect(result.current.recap).toEqual(mockRecap);
  });

  it('entry est null quand aucune donnee pour la date', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entry).toBeNull();
  });

  it('confirm envoie entree avec confirmed: true', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(mockEntry);
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
    vi.mocked(dailyApi.save).mockResolvedValue({ ...mockEntry, confirmed: true });

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.confirm(); });

    expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(dailyApi.save).mock.calls[0][0].confirmed).toBe(true);
  });

  it('setCalories met a jour immediatement et declenche save apres 800ms', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.save).mockResolvedValue({ ...mockEntry, caloriesConsumed: 1800 });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    // Charge avec les vrais timers
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Active les fake timers uniquement pour tester le debounce
    vi.useFakeTimers();

    act(() => { result.current.setCalories(1800); });
    expect(result.current.entry?.caloriesConsumed).toBe(1800);
    expect(vi.mocked(dailyApi.save)).not.toHaveBeenCalled();

    // Avance le debounce de 800 ms
    await act(async () => { vi.advanceTimersByTime(800); });

    vi.useRealTimers();
    await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(dailyApi.save).mock.calls[0][0].caloriesConsumed).toBe(1800);
  });

  it('confirm annule le debounce et ne lance qu\'une seule requete', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.save).mockResolvedValue({ ...mockEntry, confirmed: true });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.useFakeTimers();

    act(() => { result.current.setCalories(1800); }); // planifie debounce
    await act(async () => { await result.current.confirm(); }); // doit annuler le debounce

    vi.advanceTimersByTime(1000); // le timer annule ne doit pas se declencher

    vi.useRealTimers();
    await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1));
  });
});
