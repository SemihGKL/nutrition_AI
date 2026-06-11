import { useState, useEffect } from 'react';
import { ProgressRing } from '../components/ui/ProgressRing';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { PrimaryCTA } from '../components/ui/PrimaryCTA';
import { Check } from '../components/ui/icons';
import { StatusBar } from '../components/dashboard/StatusBar';
import { DayHeader } from '../components/dashboard/DayHeader';
import { ContextMessage } from '../components/dashboard/ContextMessage';
import { EntrySection } from '../components/dashboard/EntrySection';
import { NetBalanceRow } from '../components/dashboard/NetBalanceRow';
import { DeficitBanner } from '../components/dashboard/DeficitBanner';
import { ConfirmationView } from '../components/dashboard/ConfirmationView';
import { useAuth } from '../hooks/useAuth';
import { useDailyEntry } from '../hooks/useDailyEntry';
import { computeStreak } from '../hooks/useStreak';
import { dailyApi } from '../api/daily';
import { isoToday, addDays, stepsToKcal } from '../utils/format';
import type { DailyCalories } from '../types/api';
import type { StreakInfo } from '../hooks/useStreak';

const EMPTY_STREAK: StreakInfo = { current: 0, best: 0, last14: Array(14).fill('future') };

interface Props {
  onTabChange: (tab: NavTab) => void;
}

export function DashboardPage({ onTabChange }: Props) {
  const { user } = useAuth();
  const [viewedDate, setViewedDate] = useState(isoToday);
  const [allEntries, setAllEntries] = useState<DailyCalories[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const today = isoToday();
  const isToday = viewedDate === today;
  const isPast  = viewedDate < today;

  useEffect(() => { setIsEditing(false); }, [viewedDate]);

  const { entry, recap, isLoading, isSaving, setCalories, setSteps, setBurned, confirm } =
    useDailyEntry(user?.id, viewedDate);

  useEffect(() => {
    if (!user) return;
    dailyApi.getAll().then(setAllEntries).catch(() => {});
  }, [user]);

  const streak = user ? computeStreak(allEntries, viewedDate) : EMPTY_STREAK;

  const calories = entry?.caloriesConsumed ?? 0;
  const steps    = entry?.steps ?? 0;
  const burned   = entry?.caloriesBurned ?? 0;
  const target   = user?.dailyCalorieGoal ?? 1800;

  const stepsKcal = stepsToKcal(steps, user?.currentWeight ?? 70);
  const net       = calories - stepsKcal - burned;


  const handleConfirm = async () => {
    await confirm();
    const fresh = await dailyApi.getAll();
    setAllEntries(fresh);
    setIsEditing(false);
  };

  if (isLoading) {
    return <PageShell><LoadingState /></PageShell>;
  }

  if (entry?.confirmed && recap && !isEditing) {
    return (
      <PageShell>
        <StatusBar />
        <ConfirmationView
          date={viewedDate}
          recap={recap}
          streak={streak}
          weightKg={user?.currentWeight ?? 70}
          canEdit={isToday}
          onEdit={() => setIsEditing(true)}
        />
        <BottomNav active="jour" onChange={onTabChange} />
        <HomeIndicator />
      </PageShell>
    );
  }

  if (isPast && !isEditing) {
    return (
      <PageShell>
        <StatusBar />
        <DayHeader
          date={viewedDate}
          streakCount={streak.current}
          canGoForward
          onPrev={() => setViewedDate(d => addDays(d, -1))}
          onNext={() => setViewedDate(d => addDays(d, 1))}
        />
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '0 24px',
        }}>
          <div style={{ fontSize: 32 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            Journée non confirmée
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.5 }}>
            Les jours passés ne peuvent plus être modifiés.
          </div>
        </div>
        <BottomNav active="jour" onChange={onTabChange} />
        <HomeIndicator />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <StatusBar />
      <DayHeader
        date={viewedDate}
        streakCount={streak.current}
        canGoForward={viewedDate < today}
        onPrev={() => setViewedDate(d => addDays(d, -1))}
        onNext={() => setViewedDate(d => addDays(d, 1))}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 10 }}>
          <ProgressRing
            value={Math.max(0, net)}
            target={target}
            size={232}
            stroke={14}
            label="kcal net"
          />
        </div>

        <ContextMessage calories={net} target={target} />

        <EntrySection
          key={viewedDate}
          calories={calories}
          steps={steps}
          burned={burned}
          weightKg={user?.currentWeight ?? 70}
          isSaving={isSaving}
          onCalories={setCalories}
          onSteps={setSteps}
          onBurned={setBurned}
        />

        {(steps > 0 || burned > 0) && calories > 0 && (
          <NetBalanceRow calories={calories} stepsKcal={stepsKcal} burned={burned} target={target} />
        )}

        {calories > 0 && (
          <DeficitBanner net={net} target={target} />
        )}

        <PrimaryCTA
          tone="orange"
          icon={<Check size={18} color="#fff" strokeWidth={2.2} />}
          disabled={calories === 0}
          onClick={handleConfirm}
        >
          {isEditing ? 'Mettre à jour' : 'Confirmer ma journée'}
        </PrimaryCTA>

        <div style={{ height: 12 }} />
      </div>

      <BottomNav active="jour" />
      <HomeIndicator />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      height: '100dvh',
      background: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {children}
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{
      height: 22,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingBottom: 6,
      background: 'var(--paper)',
    }}>
      <div style={{
        width: 110,
        height: 4,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.22)',
      }} />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink-3)',
      fontSize: 14,
    }}>
      chargement…
    </div>
  );
}
