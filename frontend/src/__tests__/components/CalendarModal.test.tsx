import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarModal } from '../../components/dashboard/CalendarModal';

describe('CalendarModal — libellé du mois', () => {
  it('affiche le libellé du mois pour la date sélectionnée', () => {
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Juin 2026')).toBeInTheDocument();
  });
});

describe('CalendarModal — en-tête des jours de la semaine', () => {
  it('affiche les initiales des jours de la semaine en commençant par lundi', () => {
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const header = screen.getByTestId('calendar-weekday-header');
    expect(header).toHaveTextContent('LMMJVSD');
  });
});

describe('CalendarModal — grille des jours', () => {
  it('affiche un bouton pour chaque jour de la grille, y compris le padding du mois suivant', () => {
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // Juin 2026 : le 1er est un lundi, le 30 un mardi → padding du mois suivant jusqu'au 5 juillet
    expect(screen.getByRole('button', { name: '2026-06-01' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2026-06-30' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2026-07-05' })).toBeInTheDocument();
  });

  it('désactive les jours de padding du mois précédent/suivant', () => {
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '2026-07-05' })).toBeDisabled();
  });

  it('désactive les jours du mois courant strictement postérieurs à todayDate', () => {
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '2026-06-23' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '2026-06-22' })).not.toBeDisabled();
  });
});

describe('CalendarModal — sélection d\'un jour', () => {
  it('appelle onSelect avec la date ISO puis onClose au clic sur un jour valide', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '2026-06-15' }));

    expect(onSelect).toHaveBeenCalledWith('2026-06-15');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CalendarModal — mise en évidence du jour sélectionné', () => {
  it('marque le jour sélectionné avec aria-current="date"', () => {
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '2026-06-10' })).toHaveAttribute('aria-current', 'date');
    expect(screen.getByRole('button', { name: '2026-06-11' })).not.toHaveAttribute('aria-current');
  });
});

describe('CalendarModal — fermeture', () => {
  it('appelle onClose sans changer la date au clic sur le bouton de fermeture', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'fermer le calendrier' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('CalendarModal — navigation entre mois', () => {
  it('navigue vers le mois suivant au clic sur le bouton "mois suivant"', async () => {
    render(
      <CalendarModal
        selectedDate="2026-04-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'mois suivant' }));

    expect(screen.getByText('Mai 2026')).toBeInTheDocument();
  });

  it('navigue vers le mois précédent au clic sur le bouton "mois précédent"', async () => {
    render(
      <CalendarModal
        selectedDate="2026-04-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'mois précédent' }));

    expect(screen.getByText('Mars 2026')).toBeInTheDocument();
  });

  it('désactive le bouton "mois suivant" quand le mois affiché est celui de todayDate', () => {
    render(
      <CalendarModal
        selectedDate="2026-06-10"
        todayDate="2026-06-22"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'mois suivant' })).toBeDisabled();
  });
});
