import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User, DailyCalories } from '../../types/api';
import type { StreakInfo } from '../../hooks/useStreak';

const TODAY = '2026-07-05';

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../utils/format', async () => {
  const actual = await vi.importActual<typeof import('../../utils/format')>('../../utils/format');
  return { ...actual, isoToday: () => TODAY };
});

import { useAuth } from '../../hooks/useAuth';
import { SemainePage } from '../../pages/SemainePage';

const user: User = {
  id: 1, username: 'Alice', email: 'alice@example.com',
  dailyCalorieGoal: 1800, weightGoal: 72, gender: 'FEMALE',
  age: 30, height: 165, startWeight: 80, currentWeight: 76,
  weighInDay: null, dailyStepsGoal: null,
};

const streak: StreakInfo = { current: 0, best: 0, last14: Array(14).fill('miss') };

const day = (date: string, consumed: number, burned: number, confirmed: boolean): DailyCalories => ({
  date, caloriesConsumed: consumed, caloriesBurned: burned, steps: 0, confirmed, userId: 1,
});

function renderSemaine(entries: DailyCalories[]) {
  return render(<SemainePage onTabChange={() => {}} streakCount={0} streak={streak} allEntries={entries} />);
}

const stat = (label: string) => screen.getByText(label).parentElement!;

describe('SemainePage — moyenne et deficit', () => {
  beforeEach(() => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user });
  });

  it('compte un jour confirme au net negatif (beaucoup de sport) dans la moyenne', () => {
    renderSemaine([
      day('2026-07-03', 1500, 1600, true), // net −100
      day('2026-07-04', 1500, 0, true),    // net 1500
    ]);
    // (−100 + 1500) / 2 = 700
    expect(stat('moy.')).toHaveTextContent('700');
  });

  it('exclut de la moyenne les jours passes non confirmes', () => {
    renderSemaine([
      day('2026-07-02', 3000, 0, false),
      day('2026-07-04', 1500, 0, true),
    ]);
    expect(stat('moy.')).toHaveTextContent(/1\s?500/);
  });

  it('affiche un tiret sans aucun jour confirme', () => {
    renderSemaine([day('2026-07-04', 1500, 0, false)]);
    expect(stat('moy.')).toHaveTextContent('—');
  });
});
