import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DashboardPage } from './pages/DashboardPage';
import { SemainePage } from './pages/SemainePage';
import { BilanPage } from './pages/BilanPage';
import { ObjectifsPage } from './pages/ObjectifsPage';
import { ProfilPage } from './pages/ProfilPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { computeStreak } from './hooks/useStreak';
import { dailyApi } from './api/daily';
import { useEffect } from 'react';
import type { NavTab } from './components/ui/BottomNav';
import type { DailyCalories } from './types/api';
import { isoToday } from './utils/format';
import { WeighInProvider } from './hooks/useWeighIn';

type AuthPage = 'login' | 'register';

function AuthRoutes() {
  const [page, setPage] = useState<AuthPage>('login');

  if (page === 'register') {
    return <OnboardingPage onDone={() => {}} onBack={() => setPage('login')} />;
  }
  return <LoginPage onRegister={() => setPage('register')} />;
}

function AppTabs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<NavTab>('jour');
  const [allEntries, setAllEntries] = useState<DailyCalories[]>([]);

  const refreshEntries = useCallback(() => {
    if (!user) return;
    dailyApi.getAll().then(setAllEntries).catch(() => {});
  }, [user]);

  useEffect(() => { refreshEntries(); }, [refreshEntries, tab]);

  const streak = user ? computeStreak(allEntries, isoToday()) : { current: 0, best: 0, last14: [] };

  switch (tab) {
    case 'semaine':
      return <SemainePage onTabChange={setTab} streakCount={streak.current} streak={streak} allEntries={allEntries} />;
    case 'bilan':
      return <BilanPage onTabChange={setTab} allEntries={allEntries} />;
    case 'objectifs':
      return <ObjectifsPage onTabChange={setTab} />;
    case 'profil':
      return <ProfilPage onTabChange={setTab} streakCount={streak.current} />;
    default:
      return <DashboardPage onTabChange={setTab} allEntries={allEntries} onEntriesRefresh={refreshEntries} />;
  }
}

function AppSplash() {
  return (
    <div style={{
      width: '100%', maxWidth: 480, height: '100dvh',
      background: 'var(--paper)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: 'var(--font-script)', fontStyle: 'italic',
        fontSize: 40, color: 'var(--orange)',
      }}>
        kaloriim
      </span>
    </div>
  );
}

function AppRoutes() {
  const { token, isLoading } = useAuth();
  if (isLoading) return <AppSplash />;
  if (!token) return <AuthRoutes />;
  return (
    <WeighInProvider>
      <AppTabs />
    </WeighInProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
