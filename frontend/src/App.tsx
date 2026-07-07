import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DashboardPage } from './pages/DashboardPage';
import { SemainePage } from './pages/SemainePage';
import { BilanPage } from './pages/BilanPage';
import { ObjectifsPage } from './pages/ObjectifsPage';
import { ProfilPage } from './pages/ProfilPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TutorialOverlay } from './components/ui/TutorialOverlay';
import { computeStreak } from './hooks/useStreak';
import { dailyApi } from './api/daily';
import { useEffect } from 'react';
import type { NavTab } from './components/ui/BottomNav';
import type { DailyCalories } from './types/api';
import { isoToday } from './utils/format';
import { WeighInProvider } from './hooks/useWeighIn';
import { TUTORIAL_STORAGE_KEY } from './auth/session';

type AuthPage = 'login' | 'register' | 'forgot-password';

function AuthRoutes() {
  const [page, setPage] = useState<AuthPage>('login');

  if (page === 'register') {
    return <OnboardingPage onDone={() => {}} onBack={() => setPage('login')} />;
  }
  if (page === 'forgot-password') {
    return <ForgotPasswordPage onBack={() => setPage('login')} />;
  }
  return (
    <LoginPage
      onRegister={() => setPage('register')}
      onForgotPassword={() => setPage('forgot-password')}
    />
  );
}

function AppTabs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<NavTab>('jour');
  const [allEntries, setAllEntries] = useState<DailyCalories[]>([]);
  const tutorialKey = user ? `${TUTORIAL_STORAGE_KEY}_${user.id}` : null;
  const [showTutorial, setShowTutorial] = useState(
    () => !!tutorialKey && !localStorage.getItem(tutorialKey)
  );

  const refreshEntries = useCallback(() => {
    if (!user) return;
    dailyApi.getAll().then(setAllEntries).catch(() => {});
  }, [user]);

  useEffect(() => { refreshEntries(); }, [refreshEntries, tab]);

  const streak = user ? computeStreak(allEntries, isoToday()) : { current: 0, best: 0, last14: [] };

  return (
    <>
      {(() => {
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
      })()}
      {showTutorial && tutorialKey && (
        <TutorialOverlay onDone={() => {
          localStorage.setItem(tutorialKey, '1');
          setShowTutorial(false);
        }} />
      )}
    </>
  );
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

  // Lien email de réinitialisation : ?token=xxx dans l'URL.
  const resetToken = new URLSearchParams(window.location.search).get('token');
  if (resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

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
