import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntrySection } from '../../components/dashboard/EntrySection';

interface SetupOpts {
  calories?: number;
  steps?: number;
  burned?: number;
  weightKg?: number;
  stepsGoal?: number | null;
}

function setup(opts: SetupOpts = {}) {
  const onCalories = vi.fn();
  const onSteps = vi.fn();
  const onBurned = vi.fn();
  render(
    <EntrySection
      calories={opts.calories ?? 0}
      steps={opts.steps ?? 0}
      burned={opts.burned ?? 0}
      weightKg={opts.weightKg ?? 70}
      stepsGoal={opts.stepsGoal}
      isSaving={false}
      onCalories={onCalories}
      onSteps={onSteps}
      onBurned={onBurned}
    />,
  );
  return { onCalories, onSteps, onBurned };
}

describe('EntrySection — saisie du jour', () => {
  it('affiche les steppers Calories et Pas', () => {
    setup();
    expect(screen.getByText('Calories consommées')).toBeInTheDocument();
    expect(screen.getByText('Pas')).toBeInTheDocument();
  });

  it('n\'affiche pas le stepper sport par defaut', () => {
    setup();
    expect(screen.queryByText('Calories brûlées (séance)')).not.toBeInTheDocument();
  });

  it('affiche le stepper sport apres avoir coche la case seance', async () => {
    setup();
    await userEvent.click(screen.getByText('Séance de sport effectuée'));
    expect(screen.getByText('Calories brûlées (séance)')).toBeInTheDocument();
  });

  it('appelle onBurned(0) quand la seance est decochee', async () => {
    const { onBurned } = setup({ burned: 300 }); // burned > 0 → case deja cochee
    await userEvent.click(screen.getByText('Séance de sport effectuée'));
    expect(onBurned).toHaveBeenCalledWith(0);
  });

  it('affiche l\'estimation kcal quand les pas depassent 4 000', () => {
    // 10 000 pas → 6 000 effectifs × 0.025 × 1.0 = 150 kcal
    setup({ steps: 10000, weightKg: 70 });
    expect(screen.getByText(/≈ 150 kcal/)).toBeInTheDocument();
  });

  it('n\'affiche pas d\'indice kcal sous le seuil de 4 000 pas', () => {
    setup({ steps: 4000 });
    expect(screen.queryByText(/kcal \(est\. basse\)/)).not.toBeInTheDocument();
  });

  it('augmente les calories de 50 par clic sur le bouton +', async () => {
    const { onCalories } = setup({ calories: 1500 });
    const increments = screen.getAllByRole('button', { name: 'augmenter' });
    await userEvent.click(increments[0]); // premier stepper = calories
    expect(onCalories).toHaveBeenCalledWith(1550);
  });

  it('diminue les calories de 50 par clic sur le bouton -', async () => {
    const { onCalories } = setup({ calories: 1500 });
    const decrements = screen.getAllByRole('button', { name: 'diminuer' });
    await userEvent.click(decrements[0]);
    expect(onCalories).toHaveBeenCalledWith(1450);
  });

  it('affiche l\'indicateur objectif de pas quand stepsGoal est defini', () => {
    setup({ steps: 5000, stepsGoal: 10000 });
    expect(screen.getByText(/objectif de pas/i)).toBeInTheDocument();
  });

  it('n\'affiche pas l\'indicateur quand stepsGoal est null', () => {
    setup({ stepsGoal: null });
    expect(screen.queryByText(/objectif de pas/i)).not.toBeInTheDocument();
  });

  it('l\'indicateur affiche la coche quand les pas atteignent l\'objectif', () => {
    setup({ steps: 10000, stepsGoal: 10000 });
    expect(screen.getByText(/✓/)).toBeInTheDocument();
  });

  it('calls onSteps when the steps stepper increment button is clicked', async () => {
    const { onSteps } = setup({ steps: 5000 });
    const increments = screen.getAllByRole('button', { name: 'augmenter' });
    await userEvent.click(increments[1]); // second stepper = pas
    expect(onSteps).toHaveBeenCalledWith(5500);
  });
});
