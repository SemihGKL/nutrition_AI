import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextMessage } from '../../components/dashboard/ContextMessage';

describe('ContextMessage — cas limites', () => {
  it('invite a commencer la journee quand rien n\'est consomme', () => {
    render(<ContextMessage consumed={0} net={0} target={1800} tdee={1920} />);
    expect(screen.getByText(/commence ta journée/)).toBeInTheDocument();
  });

  it('invite a commencer la journee quand rien n\'est consomme meme avec une seance', () => {
    render(<ContextMessage consumed={0} net={-300} target={1800} tdee={1920} />);
    expect(screen.getByText(/commence ta journée/)).toBeInTheDocument();
  });

  it('affiche le reste quand le sport depasse ce qui a ete mange (net negatif)', () => {
    render(<ContextMessage consumed={1500} net={-100} target={1800} tdee={1920} />);
    expect(screen.queryByText(/commence ta journée/)).not.toBeInTheDocument();
    expect(screen.getByText(/il te reste/)).toHaveTextContent(/1\s?900 kcal/);
  });

  it('affiche le reste quand le net vaut exactement 0', () => {
    render(<ContextMessage consumed={600} net={0} target={1800} tdee={1920} />);
    expect(screen.getByText(/il te reste/)).toHaveTextContent(/1\s?800 kcal/);
  });

  it('compare le net a la depense du jour (TDEE) et non au metabolisme de base', () => {
    // objectif 1800 < net 1850 < TDEE 1920 : au-dessus de l'objectif mais toujours en déficit
    render(<ContextMessage consumed={1850} net={1850} target={1800} tdee={1920} />);
    expect(screen.getByText(/au-dessus de l'objectif/)).toBeInTheDocument();
    expect(screen.getByText(/déficit de 70 kcal/)).toBeInTheDocument();
    expect(screen.queryByText(/métabolisme de base/)).not.toBeInTheDocument();
  });

  it('signale le depassement de la depense du jour', () => {
    render(<ContextMessage consumed={2000} net={2000} target={1800} tdee={1920} />);
    expect(screen.getByText(/\+80 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/au-dessus de ta dépense du jour/)).toBeInTheDocument();
  });
});
