import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntrySection } from '../../components/dashboard/EntrySection';
import type { Meals } from '../../types/api';

const NO_MEALS: Meals = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };

interface SetupOpts {
  meals?: Meals;
  calories?: number;
  steps?: number;
  burned?: number;
  weightKg?: number;
  stepsGoal?: number | null;
  saveFailed?: boolean;
}

function setup(opts: SetupOpts = {}) {
  const onMeal = vi.fn();
  const onSteps = vi.fn();
  const onBurned = vi.fn();
  const onRetry = vi.fn();
  render(
    <EntrySection
      meals={opts.meals ?? NO_MEALS}
      calories={opts.calories ?? 0}
      steps={opts.steps ?? 0}
      burned={opts.burned ?? 0}
      weightKg={opts.weightKg ?? 70}
      stepsGoal={opts.stepsGoal}
      isSaving={false}
      saveFailed={opts.saveFailed ?? false}
      onRetry={onRetry}
      onMeal={onMeal}
      onSteps={onSteps}
      onBurned={onBurned}
    />,
  );
  return { onMeal, onSteps, onBurned, onRetry };
}

describe('EntrySection — saisie du jour', () => {
  it('affiche les quatre repas a cocher et le stepper Pas', () => {
    setup();
    expect(screen.getByText('Petit-déjeuner')).toBeInTheDocument();
    expect(screen.getByText('Déjeuner')).toBeInTheDocument();
    expect(screen.getByText('Collation')).toBeInTheDocument();
    expect(screen.getByText('Dîner')).toBeInTheDocument();
    expect(screen.getByText('Pas')).toBeInTheDocument();
  });

  it('n\'affiche aucun stepper de repas par defaut', () => {
    setup();
    expect(screen.queryByText('Calories petit-déjeuner')).not.toBeInTheDocument();
  });

  it('affiche le stepper du repas apres avoir coche sa case', async () => {
    setup();
    await userEvent.click(screen.getByText('Déjeuner'));
    expect(screen.getByText('Calories déjeuner')).toBeInTheDocument();
  });

  it('coche d\'office les repas deja renseignes', () => {
    setup({ meals: { ...NO_MEALS, dinner: 600 }, calories: 600 });
    expect(screen.getByText('Calories dîner')).toBeInTheDocument();
  });

  it('appelle onMeal avec 0 quand un repas est decoche', async () => {
    const { onMeal } = setup({ meals: { ...NO_MEALS, snack: 150 }, calories: 150 });
    await userEvent.click(screen.getByText('Collation'));
    expect(onMeal).toHaveBeenCalledWith('snack', 0);
  });

  it('augmente le repas de 50 par clic sur le bouton +', async () => {
    const { onMeal } = setup({ meals: { ...NO_MEALS, breakfast: 400 }, calories: 400 });
    const increments = screen.getAllByRole('button', { name: 'augmenter' });
    await userEvent.click(increments[0]); // premier stepper = petit-déjeuner
    expect(onMeal).toHaveBeenCalledWith('breakfast', 450);
  });

  it('affiche le total consomme', () => {
    setup({ meals: { breakfast: 400, lunch: 700, snack: 150, dinner: 600 }, calories: 1850 });
    expect(screen.getByText('Total consommé')).toBeInTheDocument();
    expect(screen.getByText(/1\s?850 kcal/)).toBeInTheDocument();
  });

  it('signale une ancienne saisie sans detail par repas', () => {
    setup({ calories: 1800 });
    expect(screen.getByText(/sans détail par repas/)).toBeInTheDocument();
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
    await userEvent.click(increments[0]); // aucun repas coche : premier stepper = pas
    expect(onSteps).toHaveBeenCalledWith(5500);
  });

  it('signale un echec d\'enregistrement et relance au clic', async () => {
    const { onRetry } = setup({ saveFailed: true });
    await userEvent.click(screen.getByRole('button', { name: /non enregistré/ }));
    expect(onRetry).toHaveBeenCalled();
  });

});

// Parent avec état réel : vérifie l'enchaînement cocher / décocher / recocher.
function StatefulEntry() {
  const [burned, setBurned] = useState(0);
  const [meals, setMeals] = useState<Meals>(NO_MEALS);
  const total = meals.breakfast + meals.lunch + meals.snack + meals.dinner;
  return (
    <>
      <EntrySection
        meals={meals}
        calories={total}
        steps={0}
        burned={burned}
        weightKg={70}
        isSaving={false}
        saveFailed={false}
        onRetry={() => {}}
        onMeal={(meal, v) => setMeals(m => ({ ...m, [meal]: v }))}
        onSteps={() => {}}
        onBurned={setBurned}
      />
      <output data-testid="burned">{burned}</output>
      <output data-testid="total">{total}</output>
    </>
  );
}

describe('EntrySection — cocher, decocher, recocher', () => {
  const plus = () => screen.getAllByRole('button', { name: 'augmenter' });
  const last = <T,>(xs: T[]) => xs[xs.length - 1];
  const sessionInput = () => last(screen.getAllByRole('textbox')) as HTMLInputElement;

  it('la seance decochee puis recochee repart de 0 et le compteur suit les boutons', async () => {
    render(<StatefulEntry />);
    await userEvent.click(screen.getByText('Séance de sport effectuée'));
    await userEvent.click(last(plus()));
    await userEvent.click(last(plus()));
    expect(screen.getByTestId('burned')).toHaveTextContent('100');

    await userEvent.click(screen.getByText('Séance de sport effectuée')); // décoche
    expect(screen.getByTestId('burned')).toHaveTextContent('0');
    expect(screen.queryByText('Calories brûlées (séance)')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Séance de sport effectuée')); // recoche
    expect(sessionInput().value).toBe('0');
    await userEvent.click(last(plus()));
    expect(screen.getByTestId('burned')).toHaveTextContent('50');
    expect(sessionInput().value).toBe('50');
  });

  it('decocher la seance pendant la saisie clavier remet bien a 0', async () => {
    render(<StatefulEntry />);
    await userEvent.click(screen.getByText('Séance de sport effectuée'));
    await userEvent.clear(sessionInput());
    await userEvent.type(sessionInput(), '320');
    expect(screen.getByTestId('burned')).toHaveTextContent('320');

    // Le tap sur la case ne retire pas le focus (iOS)
    fireEvent.click(screen.getByText('Séance de sport effectuée'));
    expect(screen.getByTestId('burned')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('Séance de sport effectuée'));
    expect(sessionInput().value).toBe('0');
  });

  it('un repas decoche puis recoche repart de 0 et le total suit', async () => {
    render(<StatefulEntry />);
    await userEvent.click(screen.getByText('Dîner'));
    await userEvent.click(plus()[0]);
    await userEvent.click(plus()[0]);
    expect(screen.getByTestId('total')).toHaveTextContent('100');

    await userEvent.click(screen.getByText('Dîner'));
    expect(screen.getByTestId('total')).toHaveTextContent('0');

    await userEvent.click(screen.getByText('Dîner'));
    await userEvent.click(plus()[0]);
    expect(screen.getByTestId('total')).toHaveTextContent('50');
    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('50');
  });

  it('remettre un repas a 0 avec - garde le repas coche et met le total a jour', async () => {
    render(<StatefulEntry />);
    await userEvent.click(screen.getByText('Déjeuner'));
    await userEvent.click(plus()[0]);
    await userEvent.click(screen.getAllByRole('button', { name: 'diminuer' })[0]);

    expect(screen.getByTestId('total')).toHaveTextContent('0');
    expect(screen.getByText('Calories déjeuner')).toBeInTheDocument();
    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('0');
  });
});
