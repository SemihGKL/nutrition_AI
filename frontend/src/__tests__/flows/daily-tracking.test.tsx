import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User, DailyCalories, DailyRecap } from '../../types/api';

// ── Mocks ──────────────────────────────────────────────────────────────────
// On mocke isoToday pour figer la date sans avoir besoin des fake timers,
// ce qui permet a waitFor de fonctionner normalement.

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

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

vi.mock('../../utils/format', async () => {
  const actual = await vi.importActual<typeof import('../../utils/format')>('../../utils/format');
  return { ...actual, isoToday: () => TODAY };
});

// ── Imports apres mocks ────────────────────────────────────────────────────

import { useAuth } from '../../hooks/useAuth';
import { dailyApi } from '../../api/daily';
import { DashboardPage } from '../../pages/DashboardPage';

// ── Fixtures ───────────────────────────────────────────────────────────────

const TODAY = '2026-06-22';

const mockUser: User = {
  id: 1,
  username: 'Alice',
  email: 'alice@example.com',
  dailyCalorieGoal: 1800,
  weightGoal: 70,
  gender: 'FEMALE',
  age: 30,
  height: 165,
  startWeight: 75,
  currentWeight: 72,
  weighInDay: null,
  dailyStepsGoal: null,
};

const mockRecap: DailyRecap = {
  date: TODAY,
  caloriesConsumed: 1800,
  caloriesBurned: 0,
  steps: 0,
  stepsKcal: 0,
  netCalories: 1800,
  dailyCalorieGoal: 1800,
  mbr: 1600,
  tdee: 1920,
  deficit: 0,
  deficitPercentage: 0,
  confirmed: false,
};

function setupAuth(user: User | null = mockUser) {
  vi.mocked(useAuth).mockReturnValue({
    user,
    token: 'mock-token',
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DashboardPage — parcours saisie quotidienne', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche l\'etat de chargement au montage', () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    expect(screen.getByText('chargement…')).toBeInTheDocument();
  });

  it('affiche le formulaire de saisie quand aucune entree n\'existe pour aujourd\'hui', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('saisie du jour')).toBeInTheDocument());
    expect(screen.getByText('Calories consommées')).toBeInTheDocument();
  });

  it('le bouton Confirmer est desactive quand les calories valent 0', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => screen.getByText('Confirmer ma journée'));

    expect(screen.getByRole('button', { name: /Confirmer ma journée/ })).toBeDisabled();
  });

  it('le bouton Confirmer s\'active des que des calories sont saisies', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => screen.getByText('Confirmer ma journée'));

    // Premier bouton "augmenter" = stepper Calories consommees
    await userEvent.click(screen.getAllByRole('button', { name: 'augmenter' })[0]);

    expect(screen.getByRole('button', { name: /Confirmer ma journée/ })).not.toBeDisabled();
  });

  it('affiche la ConfirmationView quand l\'entree est confirmee', async () => {
    const confirmedEntry: DailyCalories = {
      id: 1,
      date: TODAY,
      caloriesConsumed: 1800,
      caloriesBurned: 0,
      steps: 0,
      confirmed: true,
      userId: 1,
    };
    vi.mocked(dailyApi.getByDate).mockResolvedValue(confirmedEntry);
    vi.mocked(dailyApi.getRecap).mockResolvedValue({ ...mockRecap, confirmed: true });
    vi.mocked(dailyApi.getAll).mockResolvedValue([confirmedEntry]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[confirmedEntry]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('chargement…')).not.toBeInTheDocument());

    // ConfirmationView expose un bouton "Modifier"
    expect(screen.getByRole('button', { name: /Modifier/i })).toBeInTheDocument();
  });

  it('affiche "Journee non confirmee" apres navigation vers un jour passe', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    // Attend que la vue du jour courant soit chargee
    await waitFor(() => screen.getByText('saisie du jour'));

    // Navigue vers le jour precedent (hier, qui n'a pas de donnees)
    await userEvent.click(screen.getByRole('button', { name: 'jour précédent' }));

    await waitFor(() =>
      expect(screen.getByText('Journée non confirmée')).toBeInTheDocument(),
    );
  });
});
