import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const updateServiceWorker = vi.fn();
const setNeedRefresh = vi.fn();
let needRefresh = true;
let registerOptions: { onRegisteredSW?: (url: string, r: ServiceWorkerRegistration | undefined) => void } = {};

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options: typeof registerOptions) => {
    registerOptions = options;
    return { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker };
  },
}));
vi.mock('../../hooks/useDailyEntry', () => ({ waitForPendingDailySaves: vi.fn() }));

import { waitForPendingDailySaves } from '../../hooks/useDailyEntry';
import { UpdatePrompt } from '../../components/ui/UpdatePrompt';

describe('UpdatePrompt — mise a jour sans perte de saisie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    needRefresh = true;
    vi.mocked(waitForPendingDailySaves).mockResolvedValue(undefined);
  });

  it('annonce la nouvelle version au lieu de recharger d\'office', () => {
    render(<UpdatePrompt />);
    expect(screen.getByText('Nouvelle version disponible')).toBeInTheDocument();
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });

  it('n\'affiche rien sans nouvelle version', () => {
    needRefresh = false;
    render(<UpdatePrompt />);
    expect(screen.queryByText('Nouvelle version disponible')).not.toBeInTheDocument();
  });

  it('attend la fin des sauvegardes en cours avant d\'appliquer la mise a jour', async () => {
    let releaseSaves!: () => void;
    vi.mocked(waitForPendingDailySaves).mockReturnValue(new Promise<void>(r => { releaseSaves = r; }));
    render(<UpdatePrompt />);

    await userEvent.click(screen.getByRole('button', { name: 'Recharger' }));
    expect(updateServiceWorker).not.toHaveBeenCalled();

    releaseSaves();
    await waitFor(() => expect(updateServiceWorker).toHaveBeenCalledWith(true));
  });

  it('reporte la mise a jour avec « Plus tard »', async () => {
    render(<UpdatePrompt />);
    await userEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(setNeedRefresh).toHaveBeenCalledWith(false);
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });

  it('verifie toutes les heures si une nouvelle version existe (PWA restee ouverte)', () => {
    vi.useFakeTimers();
    try {
      render(<UpdatePrompt />);
      const registration = { update: vi.fn().mockResolvedValue(undefined) } as unknown as ServiceWorkerRegistration;
      registerOptions.onRegisteredSW?.('/sw.js', registration);

      vi.advanceTimersByTime(60 * 60 * 1000);
      expect(registration.update).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
