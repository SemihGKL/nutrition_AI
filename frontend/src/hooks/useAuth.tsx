import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types/api';
import {
  hasActiveSession,
  readPersistedToken,
  readPersistedUser,
  persistAuthSession,
  clearAuthSession,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '../auth/session';
import { refreshSession } from '../api/client';
import { authApi } from '../api/auth';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Fast-path synchrone : access token présent et non expiré → connecté immédiatement.
    if (hasActiveSession()) {
      return {
        token: readPersistedToken(),
        user: readPersistedUser(),
        isLoading: false,
        sessionExpired: false,
      };
    }
    // Sinon : un cookie de refresh valide existe peut-être → on tranche en asynchrone.
    return { token: null, user: null, isLoading: true, sessionExpired: false };
  });

  // Refresh silencieux au démarrage : l'access token (15 min) est expiré/absent mais
  // une session est mémorisée → on tente d'obtenir un nouveau token via le cookie refresh
  // (7 jours) AVANT de déconnecter. Sans ça, tout rechargement après 15 min éjecte l'user.
  useEffect(() => {
    if (!state.isLoading) return;
    let cancelled = false;

    const rememberedUser = readPersistedUser();
    if (!rememberedUser) {
      clearAuthSession();
      setState({ token: null, user: null, isLoading: false, sessionExpired: false });
      return;
    }

    refreshSession().then(newToken => {
      if (cancelled) return;
      if (newToken) {
        persistAuthSession(newToken, rememberedUser);
        setState({ token: newToken, user: rememberedUser, isLoading: false, sessionExpired: false });
      } else {
        clearAuthSession();
        setState({ token: null, user: null, isLoading: false, sessionExpired: false });
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    // Révoque le refresh token côté serveur (fire-and-forget), efface localement tout de suite.
    authApi.logout().catch(() => {});
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

  // Synchronisation multi-onglets : l'événement `storage` ne se déclenche que dans
  // les AUTRES onglets. Déconnexion / login / maj profil dans un onglet → les autres
  // se resynchronisent au lieu d'afficher un état périmé.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea && e.storageArea !== localStorage) return;
      if (e.key !== null && e.key !== TOKEN_STORAGE_KEY && e.key !== USER_STORAGE_KEY) return;
      const token = readPersistedToken();
      if (!token) {
        setState({ token: null, user: null, isLoading: false, sessionExpired: false });
      } else {
        setState(s => ({ ...s, token, user: readPersistedUser() }));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
