import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeficitBanner } from '../../components/dashboard/DeficitBanner';

describe('DeficitBanner', () => {
  it('affiche "Objectif respecté" quand net est sous l\'objectif', () => {
    render(<DeficitBanner net={1500} target={1800} mbr={2000} />);
    expect(screen.getByText('Objectif respecté')).toBeInTheDocument();
  });

  it('affiche "Objectif dépassé — déficit préservé" quand net dépasse l\'objectif mais reste sous le MBR', () => {
    render(<DeficitBanner net={1900} target={1800} mbr={2000} />);
    expect(screen.getByText('Objectif dépassé — déficit préservé')).toBeInTheDocument();
  });

  it('affiche "Déficit non respecté" quand net dépasse le MBR', () => {
    render(<DeficitBanner net={2200} target={1800} mbr={2000} />);
    expect(screen.getByText('Déficit non respecté')).toBeInTheDocument();
  });

  it('affiche "Déficit non respecté" quand net dépasse l\'objectif sans MBR fourni', () => {
    render(<DeficitBanner net={2200} target={1800} />);
    expect(screen.getByText('Déficit non respecté')).toBeInTheDocument();
  });

  it('affiche l\'écart correct sous l\'objectif', () => {
    render(<DeficitBanner net={1500} target={1800} mbr={2000} />);
    expect(screen.getByText(/300/)).toBeInTheDocument();
  });

  it('affiche l\'écart correct au-dessus de l\'objectif', () => {
    render(<DeficitBanner net={1900} target={1800} mbr={2000} />);
    expect(screen.getByText(/\+100/)).toBeInTheDocument();
  });

  it('should display objectif atteint when net calories are exactly equal to daily target', () => {
    render(<DeficitBanner net={1800} target={1800} mbr={2000} />);
    expect(screen.getByText('Objectif respecté')).toBeInTheDocument();
  });

  it('should display objectif depasse deficit preserve when net calories are exactly equal to mbr', () => {
    render(<DeficitBanner net={2000} target={1800} mbr={2000} />);
    expect(screen.getByText('Objectif dépassé — déficit préservé')).toBeInTheDocument();
  });
});
