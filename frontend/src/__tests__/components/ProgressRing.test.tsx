import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from '../../components/ui/ProgressRing';

// Les arcs de progression ont un stroke-dasharray ; le cercle de fond n'en a pas.
const progressArcs = (c: HTMLElement) => c.querySelectorAll('circle[stroke-dasharray]');

describe('ProgressRing — cas limites', () => {
  it('ne dessine aucun arc (pas de point residuel) quand la valeur vaut 0', () => {
    const { container } = render(<ProgressRing value={0} target={1800} mbr={1600} />);
    expect(progressArcs(container)).toHaveLength(0);
  });

  it('ne dessine aucun arc et affiche le net reel quand il est negatif', () => {
    const { container } = render(<ProgressRing value={-200} target={1800} mbr={1600} />);
    expect(progressArcs(container)).toHaveLength(0);
    expect(screen.getByText(/200/)).toHaveTextContent(/[-−]\s?200/);
  });

  it('dessine l\'arc des que la valeur redevient positive', () => {
    const { container } = render(<ProgressRing value={500} target={1800} mbr={1600} />);
    expect(progressArcs(container)).toHaveLength(1);
  });

  it('ne produit aucune valeur NaN quand l\'echelle vaut 0', () => {
    const { container } = render(<ProgressRing value={300} target={0} />);
    expect(container.innerHTML).not.toContain('NaN');
  });
});
