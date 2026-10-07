import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { User, DailyCalories } from '../../types/api';

const TODAY = '2026-07-05';

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

// Femme 30 ans, 165 cm, 76 kg : MBR 1480.25 → TDEE 1776.3 (arrondi 1776)
const baseUser: User = {
  id: 1, username: 'Alice', email: 'alice@example.com',
  dailyCalorieGoal: 1500, weightGoal: 72, gender: 'FEMALE',
  age: 30, height: 165, startWeight: 80, currentWeight: 76,
  weighInDay: null, dailyStepsGoal: null,
};

const day = (date: string, consumed: number, confirmed = true): DailyCalories => ({
  date, caloriesConsumed: consumed, caloriesBurned: 0, steps: 0, confirmed, userId: 1,
});

function renderBilan(entries: DailyCalories[], user: Partial<User> = {}) {
  (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: { ...baseUser, ...user } });
  return render(<BilanPage onTabChange={() => {}} allEntries={entries} />);
}

describe('BilanPage — calculs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (weighInApi.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('calcule le deficit cumule par rapport au TDEE', async () => {
    renderBilan([day('2026-07-04', 1500)]);
    await waitFor(() => expect(screen.getByText('lecture de cohérence')).toBeInTheDocument());
    // 1776 − 1500 = 276
    expect(screen.getAllByText(/−276 kcal/).length).toBeGreaterThan(0);
  });

  it('parle de prise attendue quand la semaine est en surplus', async () => {
    renderBilan([day('2026-07-03', 2600), day('2026-07-04', 2600)]);
    await waitFor(() => expect(screen.getByText('lecture de cohérence')).toBeInTheDocument());
    expect(screen.getByText(/prise attendue/)).toBeInTheDocument();
    expect(screen.queryByText(/perte attendue/)).not.toBeInTheDocument();
  });

  it('parle de perte attendue quand la semaine est en deficit', async () => {
    renderBilan([day('2026-07-04', 1200)]);
    await waitFor(() => expect(screen.getByText('lecture de cohérence')).toBeInTheDocument());
    expect(screen.getByText(/perte attendue/)).toBeInTheDocument();
  });

  it('affiche la vraie duree entre les deux dernieres pesees', async () => {
    (weighInApi.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, date: '2026-06-05', weight: 78 },
      { id: 2, date: '2026-07-05', weight: 76 },
    ]);
    renderBilan([]);
    await waitFor(() => expect(screen.getByText(/sur 30 jours/)).toBeInTheDocument());
    expect(screen.queryByText(/sur 7 jours/)).not.toBeInTheDocument();
  });

  it('ne declare pas atteint un objectif de prise de poids', async () => {
    renderBilan([], { startWeight: 60, currentWeight: 60, weightGoal: 65 });
    await waitFor(() => expect(screen.getByText(/prise de poids/)).toBeInTheDocument());
    expect(screen.queryByText(/poids cible atteint/)).not.toBeInTheDocument();
  });
});
