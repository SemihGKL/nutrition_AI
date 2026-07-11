import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../api/auth', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

// ── Imports après mocks ─────────────────────────────────────────────────────
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import { OnboardingPage } from '../../pages/OnboardingPage';

const login = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({ login } as never);
  vi.mocked(authApi.register).mockResolvedValue({
    token: 'jwt-token',
    user: { id: 1, username: 'Alex' },
  } as never);
});

/**
 * Remplit l'étape 1 avec des valeurs valides. Les champs numériques (âge, taille,
 * poids actuel, poids objectif) sont ciblés par ordre via leur rôle `spinbutton` ;
 * l'objectif de pas est ciblé par son libellé (il possède un id dédié).
 */
async function fillStep1(user: UserEvent, opts: { stepsGoal?: string } = {}) {
  await user.type(screen.getByLabelText('Prénom / pseudo'), 'Alex');
  await user.type(screen.getByLabelText('Email'), 'alex@example.com');
  await user.type(screen.getByLabelText('Mot de passe'), 'password123');

  const numbers = screen.getAllByRole('spinbutton'); // âge, taille, poids, poids objectif, (pas)
  await user.type(numbers[0], '30');
  await user.type(numbers[1], '175');
  await user.type(numbers[2], '70');
  await user.type(numbers[3], '65');

  if (opts.stepsGoal !== undefined) {
    await user.type(screen.getByLabelText('Objectif de pas / jour'), opts.stepsGoal);
  }
}

function renderOnboarding() {
  const onDone = vi.fn();
  const onBack = vi.fn();
  render(<OnboardingPage onDone={onDone} onBack={onBack} />);
  return { onDone, onBack };
}

describe("OnboardingPage — objectif de pas à l'inscription", () => {
  it('affiche le champ « Objectif de pas / jour » à la création de compte', () => {
    renderOnboarding();
    expect(screen.getByLabelText('Objectif de pas / jour')).toBeInTheDocument();
  });

  it("inclut le dailyStepsGoal saisi dans le payload d'inscription", async () => {
    const user = userEvent.setup();
    const { onDone } = renderOnboarding();

    await fillStep1(user, { stepsGoal: '8000' });
    await user.click(screen.getByRole('button', { name: 'continuer' }));
    await user.click(await screen.findByRole('button', { name: "c'est parti" }));

    await waitFor(() => expect(authApi.register).toHaveBeenCalledTimes(1));
    expect(authApi.register).toHaveBeenCalledWith(
      expect.objectContaining({ dailyStepsGoal: 8000 }),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('envoie dailyStepsGoal = null quand le champ est laissé vide', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await fillStep1(user); // pas d'objectif de pas
    await user.click(screen.getByRole('button', { name: 'continuer' }));
    await user.click(await screen.findByRole('button', { name: "c'est parti" }));

    await waitFor(() => expect(authApi.register).toHaveBeenCalledTimes(1));
    expect(authApi.register).toHaveBeenCalledWith(
      expect.objectContaining({ dailyStepsGoal: null }),
    );
  });

  it("bloque et affiche une erreur quand l'objectif de pas est invalide", async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await fillStep1(user, { stepsGoal: '0' });
    await user.click(screen.getByRole('button', { name: 'continuer' }));

    // On reste à l'étape 1 : l'étape 2 n'apparaît pas et l'inscription n'est pas appelée.
    expect(screen.getByText('ex. 8000')).toBeInTheDocument();
    expect(screen.queryByText('voici tes chiffres')).not.toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });
});
