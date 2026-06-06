import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types/api';
import {
  hasActiveSession,
  readPersistedToken,
  readPersistedUser,
  persistAuthSession,
  clearAuthSession,
} from '../auth/session';

import { sessionBus } from '../auth/sessionBus';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  sessionExpired: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
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

  const login = useCallback((token: string, user: User) => {
    persistAuthSession(token, user);
    setState({ token, user, isLoading: false, sessionExpired: false });
  }, []);

  const updateUser = useCallback((user: User) => {
    const token = readPersistedToken()!;
    persistAuthSession(token, user);
    setState(s => ({ ...s, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
