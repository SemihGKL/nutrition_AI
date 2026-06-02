import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { usersApi } from '../api/users';
import type { User } from '../types/api';
import {
  hasActiveSession,
  readPersistedToken,
  readPersistedUser,
  persistAuthSession,
  clearAuthSession,
  extractEmailFromToken,
} from '../auth/session';
import { sessionBus } from '../auth/sessionBus';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  sessionExpired: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadValidatedSession(): Pick<AuthState, 'token' | 'user'> {
  if (!hasActiveSession()) {
    clearAuthSession();
    return { token: null, user: null };
  }
  return {
    token: readPersistedToken(),
    user: readPersistedUser(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...loadValidatedSession(),
    isLoading: false,
    sessionExpired: false,
  });

  const logout = useCallback(() => {
    clearAuthSession();
    setState({ token: null, user: null, isLoading: false, sessionExpired: false });
  }, []);

  const expireSession = useCallback(() => {
    clearAuthSession();
    setState({ token: null, user: null, isLoading: false, sessionExpired: true });
  }, []);

  useEffect(() => {
    sessionBus.onSessionExpired(expireSession);
  }, [expireSession]);

  const login = useCallback(async (token: string) => {
    setState(s => ({ ...s, token, isLoading: true, sessionExpired: false }));

    const email = extractEmailFromToken(token);
    if (!email) throw new Error('Token invalide');

    const users = await usersApi.getAll();
    const user = users.find(u => u.email === email) ?? null;

    if (user) {
      persistAuthSession(token, user);
    }

    setState({ token, user, isLoading: false, sessionExpired: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
