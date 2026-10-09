import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

vi.mock('../../push/deviceSubscription', () => ({
  attachDeviceToCurrentUser: vi.fn(),
  detachDeviceFromCurrentUser: vi.fn(),
}));
vi.mock('../../api/auth', () => ({ authApi: { logout: vi.fn() } }));
vi.mock('../../api/client', () => ({ refreshSession: vi.fn() }));

import { attachDeviceToCurrentUser, detachDeviceFromCurrentUser } from '../../push/deviceSubscription';
import { authApi } from '../../api/auth';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { readPersistedToken } from '../../auth/session';
import type { User } from '../../types/api';

const user = { id: 1, username: 'Alice', email: 'alice@example.com' } as User;

let auth!: ReturnType<typeof useAuth>;
function Probe() {
  auth = useAuth();
  return <span data-testid="state">{auth.user ? 'connecte' : 'deconnecte'}</span>;
}

describe('AuthProvider — appareil et notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(attachDeviceToCurrentUser).mockResolvedValue(undefined);
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
  });

  it('rattache l\'appareil au compte a la connexion', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('deconnecte'));

    act(() => { auth.login('jwt-token', user); });

    await waitFor(() => expect(attachDeviceToCurrentUser).toHaveBeenCalledTimes(1));
  });

  it('detache l\'appareil a la deconnexion, avant d\'effacer la session', async () => {
    let tokenDuringDetach: string | null = 'non appele';
    vi.mocked(detachDeviceFromCurrentUser).mockImplementation(async () => {
      tokenDuringDetach = readPersistedToken();
    });
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => { auth.login('jwt-token', user); });

    await act(async () => { await auth.logout(); });

    expect(detachDeviceFromCurrentUser).toHaveBeenCalledTimes(1);
    expect(tokenDuringDetach).toBe('jwt-token'); // requête encore authentifiée
    expect(readPersistedToken()).toBeNull();
    expect(screen.getByTestId('state')).toHaveTextContent('deconnecte');
  });

  it('deconnecte quand meme si le detachement echoue', async () => {
    vi.mocked(detachDeviceFromCurrentUser).mockRejectedValue(new Error('offline'));
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => { auth.login('jwt-token', user); });

    await act(async () => { await auth.logout(); });

    expect(readPersistedToken()).toBeNull();
    expect(screen.getByTestId('state')).toHaveTextContent('deconnecte');
  });
});
