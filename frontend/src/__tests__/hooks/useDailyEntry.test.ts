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
import { useDailyEntry, waitForPendingDailySaves } from '../../hooks/useDailyEntry';
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
  userId: USER_ID,
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

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

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

  it('setMeal met a jour immediatement et declenche save apres 800ms', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.save).mockResolvedValue({ ...mockEntry, caloriesConsumed: 1800 });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    // Charge avec les vrais timers
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Active les fake timers uniquement pour tester le debounce
    vi.useFakeTimers();

    act(() => { result.current.setMeal('lunch', 1800); });
    expect(result.current.entry?.caloriesConsumed).toBe(1800);
    expect(vi.mocked(dailyApi.save)).not.toHaveBeenCalled();

    // Avance le debounce de 800 ms
    await act(async () => { vi.advanceTimersByTime(800); });

    vi.useRealTimers();
    await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(dailyApi.save).mock.calls[0][0].caloriesConsumed).toBe(1800);
  });

  it('setMeal additionne les repas dans caloriesConsumed et envoie le detail au save', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue({
      ...mockEntry,
      caloriesConsumed: 400,
      meals: { breakfast: 400, lunch: 0, snack: 0, dinner: 0 },
    });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
    vi.mocked(dailyApi.save).mockImplementation(async e => e);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { result.current.setMeal('dinner', 600); });

    expect(result.current.entry?.caloriesConsumed).toBe(1000);
    expect(result.current.entry?.meals).toEqual({ breakfast: 400, lunch: 0, snack: 0, dinner: 600 });
    await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(dailyApi.save).mock.calls[0][0].meals).toEqual({ breakfast: 400, lunch: 0, snack: 0, dinner: 600 });
  });

  it('setMeal remplace le total d\'une ancienne saisie sans detail par repas', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue({ ...mockEntry, caloriesConsumed: 1500 });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
    vi.mocked(dailyApi.save).mockImplementation(async e => e);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { result.current.setMeal('breakfast', 300); });

    expect(result.current.entry?.caloriesConsumed).toBe(300);
  });

  it('should expose error state when getByDate fails with a network error', async () => {
    vi.mocked(dailyApi.getByDate).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.entry).toBeNull();
  });

  it('should not go below zero when setSteps is called with a negative value', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(mockEntry);
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { result.current.setSteps(-100); });

    expect(result.current.entry?.steps).toBe(0);
  });

  it('should not trigger any save when userId is undefined', async () => {
    const { result } = renderHook(() => useDailyEntry(undefined, TODAY));

    act(() => { result.current.setMeal('lunch', 1800); });
    await act(async () => { await result.current.confirm(); });

    expect(vi.mocked(dailyApi.save)).not.toHaveBeenCalled();
    expect(vi.mocked(dailyApi.getByDate)).not.toHaveBeenCalled();
  });

  it('confirm annule le debounce et ne lance qu\'une seule requete', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.save).mockResolvedValue({ ...mockEntry, confirmed: true });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

    const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.useFakeTimers();

    act(() => { result.current.setMeal('lunch', 1800); }); // planifie debounce
    await act(async () => { await result.current.confirm(); }); // doit annuler le debounce

    vi.advanceTimersByTime(1000); // le timer annule ne doit pas se declencher

    vi.useRealTimers();
    await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1));
  });

  const DAY_A = '2026-06-20';
  const DAY_B = '2026-06-21';

  it('flush la sauvegarde en attente du jour precedent quand la date change avant la fin du debounce', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
    vi.mocked(dailyApi.save).mockImplementation(async (entry: DailyCalories) => entry);

    const { result, rerender } = renderHook(
      ({ date }) => useDailyEntry(USER_ID, date),
      { initialProps: { date: DAY_A } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.useFakeTimers();

    // Modifie le jour A, mais ne laisse pas les 800ms s'ecouler.
    act(() => { result.current.setMeal('lunch', 1200); });
    vi.advanceTimersByTime(300);

    // Navigue vers le jour B avant l'echeance du debounce de A.
    rerender({ date: DAY_B });

    // Attendre le rechargement du jour B avec les vrais timers,
    // car fetchEntry utilise des Promises non liees aux fake timers.
    vi.useRealTimers();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.useFakeTimers();

    // Modifie le jour B.
    act(() => { result.current.setSteps(5000); });
    vi.advanceTimersByTime(800);

    vi.useRealTimers();

    // Le jour A doit avoir ete envoye (flush au changement de date),
    // et le jour B doit avoir ete envoye apres son propre debounce.
    await waitFor(() => {
      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledWith(
        expect.objectContaining({ date: DAY_A, caloriesConsumed: 1200 }),
      );
    });
    await waitFor(() => {
      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledWith(
        expect.objectContaining({ date: DAY_B, steps: 5000 }),
      );
    });
  });

  it("ne declenche aucun appel save superflu quand la date change sans modification en attente", async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(mockEntry);
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

    const { result, rerender } = renderHook(
      ({ date }) => useDailyEntry(USER_ID, date),
      { initialProps: { date: DAY_A } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ date: DAY_B });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(vi.mocked(dailyApi.save)).not.toHaveBeenCalled();
  });
  describe('robustesse de la sauvegarde', () => {
    it('ne perd pas une modification faite pendant qu\'une sauvegarde est en vol', async () => {
      const first = deferred<DailyCalories>();
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save)
        .mockReturnValueOnce(first.promise)
        .mockImplementation(async e => e);

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      vi.useFakeTimers();

      act(() => { result.current.setMeal('breakfast', 400); });
      await act(async () => { vi.advanceTimersByTime(800); });
      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1);

      act(() => { result.current.setMeal('lunch', 700); });
      await act(async () => { first.resolve({ ...vi.mocked(dailyApi.save).mock.calls[0][0], id: 1 }); });

      expect(result.current.entry?.meals).toEqual({ breakfast: 400, lunch: 700, snack: 0, dinner: 0 });

      await act(async () => { vi.advanceTimersByTime(800); });
      vi.useRealTimers();
      await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(2));
      expect(vi.mocked(dailyApi.save).mock.calls[1][0].meals)
        .toEqual({ breakfast: 400, lunch: 700, snack: 0, dinner: 0 });
    });

    it('n\'envoie une nouvelle sauvegarde qu\'une fois la precedente terminee', async () => {
      const first = deferred<DailyCalories>();
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save)
        .mockReturnValueOnce(first.promise)
        .mockImplementation(async e => e);

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      vi.useFakeTimers();

      act(() => { result.current.setMeal('breakfast', 400); });
      await act(async () => { vi.advanceTimersByTime(800); });
      act(() => { result.current.setMeal('lunch', 700); });
      await act(async () => { vi.advanceTimersByTime(800); });

      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1);

      await act(async () => { first.resolve(vi.mocked(dailyApi.save).mock.calls[0][0]); });
      vi.useRealTimers();
      await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(2));
      expect(vi.mocked(dailyApi.save).mock.calls[1][0].meals?.lunch).toBe(700);
    });

    it('confirm attend la sauvegarde en vol et envoie la derniere saisie confirmee', async () => {
      const first = deferred<DailyCalories>();
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save)
        .mockReturnValueOnce(first.promise)
        .mockImplementation(async e => e);

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      vi.useFakeTimers();

      act(() => { result.current.setMeal('breakfast', 400); });
      await act(async () => { vi.advanceTimersByTime(800); });
      act(() => { result.current.setMeal('lunch', 700); });

      let confirming!: Promise<void>;
      act(() => { confirming = result.current.confirm(); });
      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1);

      await act(async () => {
        first.resolve(vi.mocked(dailyApi.save).mock.calls[0][0]);
        await confirming;
      });
      vi.useRealTimers();

      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(dailyApi.save).mock.calls[1][0]).toMatchObject({
        confirmed: true,
        meals: { breakfast: 400, lunch: 700, snack: 0, dinner: 0 },
      });
      expect(result.current.entry?.confirmed).toBe(true);
    });

    it('expose l\'echec de sauvegarde et permet de la relancer', async () => {
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save)
        .mockRejectedValueOnce(new Error('offline'))
        .mockImplementation(async e => e);

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      vi.useFakeTimers();

      act(() => { result.current.setMeal('lunch', 500); });
      await act(async () => { vi.advanceTimersByTime(800); });
      vi.useRealTimers();
      await waitFor(() => expect(result.current.saveFailed).toBe(true));

      await act(async () => { await result.current.retrySave(); });

      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(dailyApi.save).mock.calls[1][0].meals?.lunch).toBe(500);
      expect(result.current.saveFailed).toBe(false);
    });

    it('retrySave ne renvoie pas une version echouee plus ancienne qu\'une saisie en attente', async () => {
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save)
        .mockRejectedValueOnce(new Error('offline'))
        .mockImplementation(async e => e);

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      vi.useFakeTimers();

      act(() => { result.current.setMeal('lunch', 500); });
      await act(async () => { vi.advanceTimersByTime(800); });
      vi.useRealTimers();
      await waitFor(() => expect(result.current.saveFailed).toBe(true));

      act(() => { result.current.setMeal('lunch', 600); });
      await act(async () => { await result.current.retrySave(); });

      const calls = vi.mocked(dailyApi.save).mock.calls;
      expect(calls[calls.length - 1][0].meals?.lunch).toBe(600);
      expect(calls.filter(c => c[0].meals?.lunch === 500)).toHaveLength(1);
    });

    it('confirm rejette et signale l\'echec quand la sauvegarde echoue', async () => {
      vi.mocked(dailyApi.getByDate).mockResolvedValue(mockEntry);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save).mockRejectedValue(new Error('offline'));

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let error: unknown;
      await act(async () => { await result.current.confirm().catch(e => { error = e; }); });

      expect(error).toBeDefined();
      expect(result.current.saveFailed).toBe(true);
    });

    it('garde l\'entree enregistree quand seul le recap echoue apres la sauvegarde', async () => {
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockRejectedValue(new Error('recap down'));
      vi.mocked(dailyApi.save).mockImplementation(async e => ({ ...e, id: 99 }));

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      vi.useFakeTimers();

      act(() => { result.current.setMeal('lunch', 500); });
      await act(async () => { vi.advanceTimersByTime(800); });
      vi.useRealTimers();

      await waitFor(() => expect(result.current.entry?.id).toBe(99));
      expect(result.current.saveFailed).toBe(false);
    });

    it('envoie immediatement la saisie en attente quand la page passe en arriere-plan', async () => {
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save).mockImplementation(async e => e);

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => { result.current.setMeal('dinner', 600); });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      try {
        await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
      } finally {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      }

      expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(dailyApi.save).mock.calls[0][0].meals?.dinner).toBe(600);
    });
  });

  describe('waitForPendingDailySaves', () => {
    it('attend la sauvegarde envoyee en quittant le dashboard', async () => {
      const save = deferred<DailyCalories>();
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save).mockReturnValueOnce(save.promise);

      const { result, unmount } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => { result.current.setBurned(400); });
      unmount(); // changement d'onglet : flush de la saisie en attente

      let settled = false;
      const waiting = waitForPendingDailySaves().then(() => { settled = true; });
      await act(async () => { await Promise.resolve(); });
      expect(settled).toBe(false);

      await act(async () => {
        save.resolve(vi.mocked(dailyApi.save).mock.calls[0][0]);
        await waiting;
      });
      expect(settled).toBe(true);
    });

    it('se resout aussi quand la sauvegarde echoue', async () => {
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.save).mockRejectedValueOnce(new Error('offline'));

      const { result, unmount } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => { result.current.setBurned(400); });
      unmount();

      await expect(waitForPendingDailySaves()).resolves.toBeUndefined();
    });

    it('se resout immediatement sans sauvegarde en cours', async () => {
      await expect(waitForPendingDailySaves()).resolves.toBeUndefined();
    });
  });

  describe('changement de date', () => {
    it('ignore la reponse de chargement d\'une date qui n\'est plus affichee', async () => {
      const dayA = deferred<DailyCalories | null>();
      vi.mocked(dailyApi.getByDate).mockImplementation(d =>
        d === DAY_A ? dayA.promise : Promise.resolve(null));
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save).mockImplementation(async e => e);

      const { result, rerender } = renderHook(
        ({ date }) => useDailyEntry(USER_ID, date),
        { initialProps: { date: DAY_A } },
      );
      rerender({ date: DAY_B });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => { dayA.resolve({ ...mockEntry, date: DAY_A }); });
      expect(result.current.entry).toBeNull();

      vi.useFakeTimers();
      act(() => { result.current.setSteps(5000); });
      await act(async () => { vi.advanceTimersByTime(800); });
      vi.useRealTimers();

      await waitFor(() => expect(vi.mocked(dailyApi.save)).toHaveBeenCalledTimes(1));
      expect(vi.mocked(dailyApi.save).mock.calls[0][0]).toMatchObject({
        date: DAY_B, steps: 5000, caloriesBurned: 0,
      });
    });

    it('n\'applique pas la reponse d\'une sauvegarde d\'un autre jour a la date affichee', async () => {
      const saveA = deferred<DailyCalories>();
      vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
      vi.mocked(dailyApi.save).mockReturnValueOnce(saveA.promise);

      const { result, rerender } = renderHook(
        ({ date }) => useDailyEntry(USER_ID, date),
        { initialProps: { date: DAY_A } },
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      vi.useFakeTimers();
      act(() => { result.current.setMeal('lunch', 1200); });
      await act(async () => { vi.advanceTimersByTime(800); });
      vi.useRealTimers();

      rerender({ date: DAY_B });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await act(async () => { saveA.resolve(vi.mocked(dailyApi.save).mock.calls[0][0]); });

      expect(result.current.entry).toBeNull();
    });

    it('vide l\'entree affichee quand le chargement de la nouvelle date echoue', async () => {
      vi.mocked(dailyApi.getByDate).mockImplementation(d =>
        d === DAY_A ? Promise.resolve({ ...mockEntry, date: DAY_A }) : Promise.reject(new Error('net')));
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

      const { result, rerender } = renderHook(
        ({ date }) => useDailyEntry(USER_ID, date),
        { initialProps: { date: DAY_A } },
      );
      await waitFor(() => expect(result.current.entry).not.toBeNull());

      rerender({ date: DAY_B });
      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.entry).toBeNull();
    });

    it('reload relance le chargement apres une erreur', async () => {
      vi.mocked(dailyApi.getByDate)
        .mockRejectedValueOnce(new Error('net'))
        .mockResolvedValue(mockEntry);
      vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);

      const { result } = renderHook(() => useDailyEntry(USER_ID, TODAY));
      await waitFor(() => expect(result.current.error).not.toBeNull());

      await act(async () => { await result.current.reload(); });

      expect(result.current.error).toBeNull();
      expect(result.current.entry).toEqual(mockEntry);
    });
  });
});
