import { useState } from 'react';
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

  useEffect(() => {
    if (!user) return;
    dailyApi.getAll(user.id).then(setAllEntries).catch(() => {});
  }, [user]);

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
      return <DashboardPage onTabChange={setTab} />;
  }
}

function AppRoutes() {
  const { token } = useAuth();
  return token ? <AppTabs /> : <AuthRoutes />;
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
