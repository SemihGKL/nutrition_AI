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
    // save n'est pas explicitement mocké dans chaque test : on lui donne un
    // retour par défaut résolu. Sans ça, le flush du save en attente déclenché
    // au démontage (useDailyEntry) appellerait `.catch` sur `undefined`.
    vi.mocked(dailyApi.save).mockResolvedValue({
      id: 1,
      date: TODAY,
      caloriesConsumed: 0,
      caloriesBurned: 0,
      steps: 0,
      confirmed: false,
      userId: 1,
    });
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
    expect(screen.getByText('Petit-déjeuner')).toBeInTheDocument();
    expect(screen.getByText('Dîner')).toBeInTheDocument();
  });

  it('bloque la saisie et propose de reessayer quand le chargement echoue', async () => {
    vi.mocked(dailyApi.getByDate)
      .mockRejectedValueOnce(new Error('net'))
      .mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => screen.getByRole('button', { name: 'Réessayer' }));
    expect(screen.queryByText('Petit-déjeuner')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    await waitFor(() => expect(screen.getByText('Petit-déjeuner')).toBeInTheDocument());
  });

  it('n\'invite pas a commencer la journee quand le sport depasse ce qui a ete mange', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue({
      id: 1, date: TODAY, caloriesConsumed: 1500, caloriesBurned: 1600, steps: 0, confirmed: false, userId: 1,
      meals: { breakfast: 0, lunch: 1500, snack: 0, dinner: 0 },
    });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => screen.getByText('saisie du jour'));

    expect(screen.queryByText(/commence ta journée/)).not.toBeInTheDocument();
    expect(screen.getByText(/il te reste/)).toBeInTheDocument();
  });

  it('juge le deficit par rapport au TDEE : net entre MBR et TDEE reste un deficit', async () => {
    // Recap : MBR 1600, TDEE 1920 ; objectif 1800 ; net 1850
    vi.mocked(dailyApi.getByDate).mockResolvedValue({
      id: 1, date: TODAY, caloriesConsumed: 1850, caloriesBurned: 0, steps: 0, confirmed: false, userId: 1,
      meals: { breakfast: 0, lunch: 1850, snack: 0, dinner: 0 },
    });
    vi.mocked(dailyApi.getRecap).mockResolvedValue(mockRecap);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => screen.getByText('saisie du jour'));

    expect(screen.getByText('Objectif dépassé — déficit préservé')).toBeInTheDocument();
    expect(screen.queryByText('Déficit non respecté')).not.toBeInTheDocument();
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

    await userEvent.click(screen.getByText('Déjeuner'));
    // Premier bouton "augmenter" = stepper du déjeuner, seul repas coché
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

  it('affiche le formulaire de saisie normal apres navigation vers un jour passe non rempli', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    // Attend que la vue du jour courant soit chargee
    await waitFor(() => screen.getByText('saisie du jour'));

    // Navigue vers le jour precedent (hier, qui n'a pas de donnees)
    await userEvent.click(screen.getByRole('button', { name: 'jour précédent' }));

    await waitFor(() => expect(screen.getByText('saisie du jour')).toBeInTheDocument());
    expect(screen.queryByText('Journée non confirmée')).not.toBeInTheDocument();
  });

  it('affiche le bouton Modifier pour un jour passe deja confirme', async () => {
    const YESTERDAY = '2026-06-21';
    const confirmedEntry: DailyCalories = {
      id: 1,
      date: YESTERDAY,
      caloriesConsumed: 1800,
      caloriesBurned: 0,
      steps: 0,
      confirmed: true,
      userId: 1,
    };
    vi.mocked(dailyApi.getByDate).mockImplementation(date =>
      Promise.resolve(date === YESTERDAY ? confirmedEntry : null),
    );
    vi.mocked(dailyApi.getRecap).mockResolvedValue({ ...mockRecap, date: YESTERDAY, confirmed: true });
    vi.mocked(dailyApi.getAll).mockResolvedValue([confirmedEntry]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[confirmedEntry]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => screen.getByText('saisie du jour'));

    await userEvent.click(screen.getByRole('button', { name: 'jour précédent' }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Modifier/i })).toBeInTheDocument());
  });

  it('ouvre le calendrier via la vignette de date et change de jour au clic sur un jour anterieur', async () => {
    vi.mocked(dailyApi.getByDate).mockResolvedValue(null);
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={vi.fn()} />);
    await waitFor(() => screen.getByText('saisie du jour'));

    await userEvent.click(screen.getByRole('button', { name: 'Changer de jour' }));

    // Juin 2026 : le calendrier s'ouvre sur le mois de TODAY (22 juin 2026)
    await waitFor(() => expect(screen.getByText('Juin 2026')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: '2026-06-15' }));

    await waitFor(() => expect(dailyApi.getByDate).toHaveBeenCalledWith('2026-06-15'));
    expect(screen.queryByText('Juin 2026')).not.toBeInTheDocument();
  });

  it('modifie un jour passe confirme de bout en bout : calendrier, Modifier, Mettre a jour, nouveau recap', async () => {
    const PAST_DAY = '2026-06-15';
    // Le « serveur » : l'entrée stockée, mise à jour par save, et un recap qui en dérive.
    let stored: DailyCalories = {
      id: 7,
      date: PAST_DAY,
      caloriesConsumed: 1300,
      meals: { breakfast: 0, lunch: 700, snack: 0, dinner: 600 },
      caloriesBurned: 0,
      steps: 0,
      confirmed: true,
      userId: 1,
    };
    const recapOf = (e: DailyCalories): DailyRecap => ({
      ...mockRecap,
      date: e.date,
      caloriesConsumed: e.caloriesConsumed,
      netCalories: e.caloriesConsumed,
      confirmed: e.confirmed,
    });
    vi.mocked(dailyApi.getByDate).mockImplementation(async date => (date === PAST_DAY ? stored : null));
    vi.mocked(dailyApi.getRecap).mockImplementation(async () => recapOf(stored));
    vi.mocked(dailyApi.save).mockImplementation(async e => { stored = { ...e, id: 7 }; return stored; });
    vi.mocked(dailyApi.getAll).mockResolvedValue([]);
    const onEntriesRefresh = vi.fn();

    render(<DashboardPage onTabChange={vi.fn()} allEntries={[]} onEntriesRefresh={onEntriesRefresh} />);
    await waitFor(() => screen.getByText('saisie du jour'));

    // 1. Retour sur un ancien jour via le calendrier : récap du jour confirmé.
    await userEvent.click(screen.getByRole('button', { name: 'Changer de jour' }));
    await userEvent.click(screen.getByRole('button', { name: PAST_DAY }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Modifier/i })).toBeInTheDocument());
    expect(screen.getByText(/Déficit de/)).toHaveTextContent('500 kcal'); // objectif 1800 − net 1300

    // 2. Modifier : formulaire pré-rempli avec les repas existants.
    await userEvent.click(screen.getByRole('button', { name: /Modifier/i }));
    expect(screen.getByText('Calories déjeuner')).toBeInTheDocument();
    expect(screen.getByText('Calories dîner')).toBeInTheDocument();
    expect(screen.queryByText('Calories petit-déjeuner')).not.toBeInTheDocument();

    // 3. +50 kcal au dîner (steppers cochés : déjeuner puis dîner), puis Mettre à jour.
    await userEvent.click(screen.getAllByRole('button', { name: 'augmenter' })[1]);
    await userEvent.click(screen.getByRole('button', { name: /Mettre à jour/ }));

    // 4. Le jour passé est enregistré, confirmé, avec le nouveau détail des repas.
    await waitFor(() => expect(screen.getByRole('button', { name: /Modifier/i })).toBeInTheDocument());
    const saves = vi.mocked(dailyApi.save).mock.calls.map(c => c[0]);
    expect(saves[saves.length - 1]).toMatchObject({
      date: PAST_DAY,
      confirmed: true,
      caloriesConsumed: 1350,
      meals: { breakfast: 0, lunch: 700, snack: 0, dinner: 650 },
    });
    expect(saves.every(s => s.date === PAST_DAY)).toBe(true);

    // 5. Retour au récap, recalculé, et liste des jours rafraîchie.
    expect(screen.queryByRole('button', { name: /Mettre à jour/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Déficit de/)).toHaveTextContent('450 kcal');
    expect(onEntriesRefresh).toHaveBeenCalled();
  });
});
