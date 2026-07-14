import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { User, DailyCalories } from '../../types/api';
import type { StreakInfo } from '../../hooks/useStreak';

// Aujourd'hui = lundi 13 juillet 2026, premier jour d'une nouvelle semaine ISO.
// Les jours confirmés (samedi 11 + dimanche 12) appartiennent à la semaine
// calendaire *précédente*. Avec un cadrage « semaine calendaire », Bilan et
// Semaine se videraient alors que le streak (2) persiste. La fenêtre glissante
// des 7 derniers jours doit continuer à les afficher.
const TODAY = '2026-07-13';

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }));

vi.mock('../../api/weighIn', () => ({
  weighInApi: { getAll: vi.fn(), getLatest: vi.fn(), save: vi.fn() },
}));

vi.mock('../../hooks/useWeighIn', () => ({
  useWeighInContext: () => ({ needsBadge: false, latestWeighIn: null, refresh: vi.fn() }),
}));

vi.mock('../../utils/format', async () => {
  const actual = await vi.importActual<typeof import('../../utils/format')>('../../utils/format');
  return { ...actual, isoToday: () => TODAY };
});

import { useAuth } from '../../hooks/useAuth';
import { weighInApi } from '../../api/weighIn';
import { BilanPage } from '../../pages/BilanPage';
import { SemainePage } from '../../pages/SemainePage';

const mockUser: User = {
  id: 1, username: 'Alice', email: 'alice@example.com',
  dailyCalorieGoal: 1200, weightGoal: 72, gender: 'FEMALE',
  age: 30, height: 165, startWeight: 80, currentWeight: 76,
  weighInDay: null, dailyStepsGoal: null,
};

// net = 1000 kcal (< objectif 1200) sur les deux jours du week-end précédent.
const confirmed = (date: string): DailyCalories => ({
  date, caloriesConsumed: 1000, caloriesBurned: 0, steps: 0, confirmed: true, userId: 1,
});

const weekendEntries: DailyCalories[] = [
  confirmed('2026-07-11'), // samedi
  confirmed('2026-07-12'), // dimanche
];

const streak: StreakInfo = {
  current: 2,
  best: 2,
  last14: Array.from({ length: 14 }, (_, i) => (i === 13 ? 'today' : 'miss')),
};

describe('Fenêtre glissante — le lundi, le récap garde les jours confirmés du week-end', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
    (weighInApi.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('BilanPage garde les jours confirmés du week-end précédent', async () => {
    render(<BilanPage onTabChange={() => {}} allEntries={weekendEntries} />);

    await waitFor(() => expect(screen.getByText('récap · 7 derniers jours')).toBeInTheDocument());

    // Les jours confirmés sont dans la fenêtre → pas de vide.
    expect(screen.queryByText(/aucune journée confirmée/)).toBeNull();
    // Les cartes de synthèse s'affichent car confirmedDays > 0.
    expect(screen.getByText('plan vs réel')).toBeInTheDocument();
  });

  it('SemainePage calcule la moyenne à partir de ces jours', () => {
    render(
      <SemainePage
        onTabChange={() => {}}
        streakCount={streak.current}
        streak={streak}
        allEntries={weekendEntries}
      />,
    );

    expect(screen.getByText('7 derniers jours')).toBeInTheDocument();
    // moy. et déficit/j sont renseignés (plus de tiret « — »).
    expect(screen.queryAllByText('—')).toHaveLength(0);
  });
});
