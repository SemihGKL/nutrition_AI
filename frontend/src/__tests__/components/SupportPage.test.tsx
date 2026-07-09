import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../api/support', () => ({
  supportApi: { send: vi.fn() },
}));

import { supportApi } from '../../api/support';
import { SupportPage } from '../../pages/SupportPage';

function setup() {
  const onBack = vi.fn();
  const onTabChange = vi.fn();
  render(<SupportPage onBack={onBack} onTabChange={onTabChange} />);
  return { onBack, onTabChange };
}

describe('SupportPage — contact du support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et un bouton Envoyer désactivé tant que le message est vide', () => {
    setup();
    expect(screen.getByText('Contactez le support')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled();
  });

  it('envoie la catégorie PROBLEM par défaut avec le message saisi', async () => {
    vi.mocked(supportApi.send).mockResolvedValue(undefined);
    setup();

    await userEvent.type(screen.getByRole('textbox'), 'La page plante au chargement');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(vi.mocked(supportApi.send)).toHaveBeenCalledWith({
      category: 'PROBLEM',
      message: 'La page plante au chargement',
    });
  });

  it('envoie la catégorie IMPROVEMENT quand on choisit « Proposer une amélioration »', async () => {
    vi.mocked(supportApi.send).mockResolvedValue(undefined);
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Proposer une amélioration' }));
    await userEvent.type(screen.getByRole('textbox'), 'Ajoutez un mode sombre');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(vi.mocked(supportApi.send)).toHaveBeenCalledWith({
      category: 'IMPROVEMENT',
      message: 'Ajoutez un mode sombre',
    });
  });

  it('rogne les espaces autour du message avant l\'envoi', async () => {
    vi.mocked(supportApi.send).mockResolvedValue(undefined);
    setup();

    await userEvent.type(screen.getByRole('textbox'), '   coucou   ');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(vi.mocked(supportApi.send)).toHaveBeenCalledWith({
      category: 'PROBLEM',
      message: 'coucou',
    });
  });

  it('affiche l\'écran de confirmation après un envoi réussi', async () => {
    vi.mocked(supportApi.send).mockResolvedValue(undefined);
    setup();

    await userEvent.type(screen.getByRole('textbox'), 'Un message');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(await screen.findByText('Message envoyé')).toBeInTheDocument();
  });

  it('affiche un message d\'erreur quand l\'envoi échoue et ne bascule pas en confirmation', async () => {
    vi.mocked(supportApi.send).mockRejectedValue(new Error('boom'));
    setup();

    await userEvent.type(screen.getByRole('textbox'), 'Un message');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(await screen.findByText(/Échec de l'envoi/)).toBeInTheDocument();
    expect(screen.queryByText('Message envoyé')).not.toBeInTheDocument();
  });

  it('appelle onBack quand on clique sur le bouton retour', async () => {
    const { onBack } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
