import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../api/mealReminders', () => ({
  mealRemindersApi: { getAll: vi.fn(), update: vi.fn() },
}));

import { mealRemindersApi, type MealReminder } from '../../api/mealReminders';
import { MealRemindersSection } from '../../components/profile/MealRemindersSection';

const CONFIG: MealReminder[] = [
  { meal: 'BREAKFAST', time: '08:00', enabled: false },
  { meal: 'LUNCH', time: '12:30', enabled: true },
  { meal: 'SNACK', time: '16:30', enabled: false },
  { meal: 'DINNER', time: '19:30', enabled: false },
];

describe('MealRemindersSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mealRemindersApi.getAll).mockResolvedValue(CONFIG);
    vi.mocked(mealRemindersApi.update).mockImplementation(async changes =>
      CONFIG.map(r => changes.find(c => c.meal === r.meal) ?? r));
  });

  it('affiche les quatre repas avec leur heure', async () => {
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => expect(screen.getByLabelText('Heure du déjeuner')).toHaveValue('12:30'));
    expect(screen.getByText('Petit-déjeuner')).toBeInTheDocument();
    expect(screen.getByText('Collation')).toBeInTheDocument();
    expect(screen.getByText('Dîner')).toBeInTheDocument();
  });

  it('active le rappel d\'un repas', async () => {
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du dîner'));

    await userEvent.click(screen.getByRole('switch', { name: 'Rappel dîner' }));

    expect(mealRemindersApi.update).toHaveBeenCalledWith([{ meal: 'DINNER', time: '19:30', enabled: true }]);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Rappel dîner' })).toHaveAttribute('aria-checked', 'true'));
  });

  it('desactive un rappel deja actif', async () => {
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du déjeuner'));

    await userEvent.click(screen.getByRole('switch', { name: 'Rappel déjeuner' }));

    expect(mealRemindersApi.update).toHaveBeenCalledWith([{ meal: 'LUNCH', time: '12:30', enabled: false }]);
  });

  it('enregistre la nouvelle heure d\'un repas', async () => {
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du déjeuner'));

    fireEvent.change(screen.getByLabelText('Heure du déjeuner'), { target: { value: '13:15' } });

    await waitFor(() => expect(mealRemindersApi.update)
      .toHaveBeenCalledWith([{ meal: 'LUNCH', time: '13:15', enabled: true }]));
  });

  it('ignore une heure videe', async () => {
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du déjeuner'));

    fireEvent.change(screen.getByLabelText('Heure du déjeuner'), { target: { value: '' } });

    expect(mealRemindersApi.update).not.toHaveBeenCalled();
  });

  it('indique d\'activer les notifications et bloque les reglages sinon', async () => {
    render(<MealRemindersSection notificationsEnabled={false} />);
    await waitFor(() => screen.getByLabelText('Heure du déjeuner'));

    expect(screen.getByText(/active les notifications/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Rappel déjeuner' })).toBeDisabled();
    expect(screen.getByLabelText('Heure du déjeuner')).toBeDisabled();
  });

  it('revient a l\'etat precedent si l\'enregistrement echoue', async () => {
    vi.mocked(mealRemindersApi.update).mockRejectedValue(new Error('net'));
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du dîner'));

    await userEvent.click(screen.getByRole('switch', { name: 'Rappel dîner' }));

    await waitFor(() => expect(screen.getByRole('switch', { name: 'Rappel dîner' })).toHaveAttribute('aria-checked', 'false'));
    expect(screen.getByText(/non enregistré/)).toBeInTheDocument();
  });

  it('enchaine les enregistrements : le suivant attend la reponse du precedent', async () => {
    // Faux serveur à état : comme le vrai, il renvoie la configuration enregistrée en base.
    let server = CONFIG;
    let resolveFirst!: () => void;
    vi.mocked(mealRemindersApi.update)
      .mockImplementationOnce(changes => new Promise(r => {
        resolveFirst = () => { server = server.map(x => changes.find(c => c.meal === x.meal) ?? x); r(server); };
      }))
      .mockImplementation(async changes => (server = server.map(x => changes.find(c => c.meal === x.meal) ?? x)));
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du dîner'));

    await userEvent.click(screen.getByRole('switch', { name: 'Rappel dîner' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Rappel collation' }));
    expect(mealRemindersApi.update).toHaveBeenCalledTimes(1);

    resolveFirst();
    await waitFor(() => expect(mealRemindersApi.update).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Rappel collation' })).toHaveAttribute('aria-checked', 'true'));
    expect(screen.getByRole('switch', { name: 'Rappel dîner' })).toHaveAttribute('aria-checked', 'true');
  });

  it('n\'enregistre l\'heure qu\'une fois la roue arretee (une requete pour plusieurs crans)', async () => {
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du déjeuner'));
    vi.useFakeTimers();
    try {
      fireEvent.change(screen.getByLabelText('Heure du déjeuner'), { target: { value: '12:45' } });
      fireEvent.change(screen.getByLabelText('Heure du déjeuner'), { target: { value: '13:00' } });
      fireEvent.change(screen.getByLabelText('Heure du déjeuner'), { target: { value: '13:15' } });
      expect(screen.getByLabelText('Heure du déjeuner')).toHaveValue('13:15');
      await act(async () => { vi.advanceTimersByTime(700); });
    } finally {
      vi.useRealTimers();
    }
    await waitFor(() => expect(mealRemindersApi.update).toHaveBeenCalledTimes(1));
    expect(mealRemindersApi.update).toHaveBeenCalledWith([{ meal: 'LUNCH', time: '13:15', enabled: true }]);
  });

  it('en cas d\'echec, revient au dernier etat enregistre (pas a un instantane perime)', async () => {
    vi.mocked(mealRemindersApi.update)
      .mockImplementationOnce(async () => CONFIG.map(r => (r.meal === 'DINNER' ? { ...r, enabled: true } : r)))
      .mockRejectedValueOnce(new Error('net'));
    render(<MealRemindersSection notificationsEnabled />);
    await waitFor(() => screen.getByLabelText('Heure du dîner'));

    await userEvent.click(screen.getByRole('switch', { name: 'Rappel dîner' }));     // enregistré
    await userEvent.click(screen.getByRole('switch', { name: 'Rappel collation' })); // échoue

    await waitFor(() => expect(screen.getByText(/non enregistré/)).toBeInTheDocument());
    expect(screen.getByRole('switch', { name: 'Rappel collation' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'Rappel dîner' })).toHaveAttribute('aria-checked', 'true');
  });
});
