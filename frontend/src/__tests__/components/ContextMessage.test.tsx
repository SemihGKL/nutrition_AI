import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextMessage } from '../../components/dashboard/ContextMessage';

describe('ContextMessage — cas limites', () => {
  it('invite a commencer la journee quand rien n\'est consomme', () => {
    render(<ContextMessage consumed={0} net={0} target={1800} mbr={1600} />);
    expect(screen.getByText(/commence ta journée/)).toBeInTheDocument();
  });

  it('invite a commencer la journee quand rien n\'est consomme meme avec une seance', () => {
    render(<ContextMessage consumed={0} net={-300} target={1800} mbr={1600} />);
    expect(screen.getByText(/commence ta journée/)).toBeInTheDocument();
  });

  it('affiche le reste quand le sport depasse ce qui a ete mange (net negatif)', () => {
    render(<ContextMessage consumed={1500} net={-100} target={1800} mbr={1600} />);
    expect(screen.queryByText(/commence ta journée/)).not.toBeInTheDocument();
    expect(screen.getByText(/il te reste/)).toHaveTextContent(/1\s?900 kcal/);
  });

  it('affiche le reste quand le net vaut exactement 0', () => {
    render(<ContextMessage consumed={600} net={0} target={1800} mbr={1600} />);
    expect(screen.getByText(/il te reste/)).toHaveTextContent(/1\s?800 kcal/);
  });
});
