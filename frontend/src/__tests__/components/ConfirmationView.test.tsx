import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmationView } from '../../components/dashboard/ConfirmationView';
import type { DailyRecap } from '../../types/api';
import type { StreakInfo } from '../../hooks/useStreak';

const streak: StreakInfo = { current: 1, best: 1, last14: Array(14).fill('miss') };

function recap(overrides: Partial<DailyRecap> = {}): DailyRecap {
  return {
    date: '2026-06-22',
    caloriesConsumed: 1800,
    caloriesBurned: 0,
    steps: 0,
    stepsKcal: 0,
    netCalories: 1800,
    dailyCalorieGoal: 1800,
    mbr: 2000,
    tdee: 2400,
    deficit: 200,
    deficitPercentage: 10,
    confirmed: true,
    ...overrides,
  };
}

describe('ConfirmationView — bannière résultat', () => {
  it('affiche "Objectif atteint" quand net est sous l\'objectif', () => {
    render(
      <ConfirmationView
        date="2026-06-22"
        recap={recap({ netCalories: 1500, dailyCalorieGoal: 1800 })}
        streak={streak}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('Objectif atteint')).toBeInTheDocument();
  });

  it('affiche "Objectif dépassé — déficit préservé" quand net dépasse l\'objectif mais reste sous le MBR', () => {
    render(
      <ConfirmationView
        date="2026-06-22"
        recap={recap({ netCalories: 1900, dailyCalorieGoal: 1800, mbr: 2000 })}
        streak={streak}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('Objectif dépassé — déficit préservé')).toBeInTheDocument();
  });

  it('affiche "Au-dessus de l\'objectif" quand net dépasse le MBR', () => {
    render(
      <ConfirmationView
        date="2026-06-22"
        recap={recap({ netCalories: 2200, dailyCalorieGoal: 1800, mbr: 2000 })}
        streak={streak}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Au-dessus de l'objectif")).toBeInTheDocument();
  });

  it('affiche "Déficit préservé" dans le bilan du jour quand état partiel', () => {
    render(
      <ConfirmationView
        date="2026-06-22"
        recap={recap({ netCalories: 1900, dailyCalorieGoal: 1800, mbr: 2000 })}
        streak={streak}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getAllByText('Déficit préservé').length).toBeGreaterThan(0);
  });

  it('affiche "Surplus calorique" dans le bilan du jour quand net dépasse le MBR', () => {
    render(
      <ConfirmationView
        date="2026-06-22"
        recap={recap({ netCalories: 2200, dailyCalorieGoal: 1800, mbr: 2000 })}
        streak={streak}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getAllByText('Surplus calorique').length).toBeGreaterThan(0);
  });
});
