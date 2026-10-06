import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalorieTargetStep } from '../../components/onboarding/CalorieTargetStep';

const setup = (target: number) =>
  render(<CalorieTargetStep tdee={2000} target={target} onTargetChange={vi.fn()} />);

describe('CalorieTargetStep — deficit par rapport a la depense du jour (TDEE)', () => {
  it('affiche la depense quotidienne comme reference', () => {
    setup(1600);
    expect(screen.getByText('dépense quotidienne')).toBeInTheDocument();
    expect(screen.getByText(/2\s?000/, { selector: '.display' })).toBeInTheDocument();
  });

  it('classe un deficit de 300 a 500 kcal en recommande', () => {
    setup(1600); // 400 sous le TDEE
    expect(screen.getByText(/300 – 500 kcal \/ jour sous ta dépense/)).toBeInTheDocument();
  });

  it('classe un deficit de moins de 300 kcal en leger', () => {
    setup(1800);
    expect(screen.getByText('déficit léger')).toBeInTheDocument();
    expect(screen.getByText(/moins de 300 kcal \/ jour sous ta dépense/)).toBeInTheDocument();
  });

  it('classe un deficit de plus de 500 kcal en intensif', () => {
    setup(1400);
    expect(screen.getByText(/plus de 500 kcal \/ jour sous ta dépense/)).toBeInTheDocument();
  });

  it('calcule la perte minimale a partir du deficit sous le TDEE', () => {
    setup(1600); // 400 × 7 / 7700 = 0,36 kg / semaine
    expect(screen.getByText('−0,36')).toBeInTheDocument();
  });
});
