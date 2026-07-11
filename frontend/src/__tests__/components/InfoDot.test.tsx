import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoDot } from '../../components/ui/InfoDot';

describe('InfoDot — pastille "?" avec pop-up', () => {
  it('affiche le bouton "?" sans ouvrir la pop-up par défaut', () => {
    render(<InfoDot title="Ton objectif calorique">Explication</InfoDot>);
    expect(screen.getByRole('button', { name: 'en savoir plus' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ouvre la pop-up avec le titre et le contenu au clic sur "?"', async () => {
    const user = userEvent.setup();
    render(
      <InfoDot title="Ton objectif calorique">
        C'est ce que tu vises chaque jour.
      </InfoDot>,
    );
    await user.click(screen.getByRole('button', { name: 'en savoir plus' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ton objectif calorique')).toBeInTheDocument();
    expect(screen.getByText(/tu vises chaque jour/i)).toBeInTheDocument();
  });

  it('ferme la pop-up au clic sur le bouton fermer', async () => {
    const user = userEvent.setup();
    render(<InfoDot title="Ton objectif calorique">Explication</InfoDot>);
    await user.click(screen.getByRole('button', { name: 'en savoir plus' }));
    await user.click(screen.getByRole('button', { name: 'fermer' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
