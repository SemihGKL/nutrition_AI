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

const mockUser: User = {
  id: 1, username: 'Alice', email: 'alice@example.com',
  dailyCalorieGoal: 1500, weightGoal: 72, gender: 'FEMALE',
  age: 30, height: 165, startWeight: 80, currentWeight: 76,
  weighInDay: null, dailyStepsGoal: null,
};

function renderBilan() {
  return render(<BilanPage onTabChange={() => {}} allEntries={[] as DailyCalories[]} />);
}

describe('BilanPage — cap sur le poids cible', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
  });

  it('affiche la section entre la pesée et le jour par jour', async () => {
    (weighInApi.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderBilan();
    await waitFor(() => expect(screen.getByText("cap sur l'objectif")).toBeInTheDocument());
    expect(screen.getByText('jour par jour')).toBeInTheDocument();
  });

  it('sans assez de pesées, retombe sur l\'estimation du plan', async () => {
    (weighInApi.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderBilan();
    // MBR femme 76 kg = 10*76 + 6.25*165 - 5*30 - 161 = 760+1031.25-150-161 = 1480.25 → 1480
    // déficit plan = 1480 - 1500 = -20 → pas de déficit
    await waitFor(() => expect(screen.getByText(/ne crée pas de déficit/)).toBeInTheDocument());
  });

  it('avec deux pesées espacées et une perte rapide, indique « en avance »', async () => {
    // MBR sur 76 kg ≈ 1480, objectif 1200 → déficit plan = 280 kcal/j (déficit réel)
    mockUser.dailyCalorieGoal = 1200;
    (weighInApi.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, date: '2026-06-07', weight: 79 },
      { id: 2, date: '2026-07-05', weight: 76 }, // 3 kg en 28 j → rythme rapide
    ]);
    renderBilan();
    await waitFor(() => expect(screen.getByText("cap sur l'objectif")).toBeInTheDocument());
    expect(screen.getByText('en avance')).toBeInTheDocument();
    expect(screen.getByText(/au rythme du plan/)).toBeInTheDocument();
  });
});
