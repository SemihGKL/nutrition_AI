import { useState, useEffect } from 'react';
import { ProgressRing } from '../components/ui/ProgressRing';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { PrimaryCTA } from '../components/ui/PrimaryCTA';
import { Check } from '../components/ui/icons';
import { StatusBar } from '../components/dashboard/StatusBar';
import { DayHeader } from '../components/dashboard/DayHeader';
import { ContextMessage } from '../components/dashboard/ContextMessage';
import { MBRGaugeCard } from '../components/dashboard/MBRGaugeCard';
import { EntrySection } from '../components/dashboard/EntrySection';
import { NetBalanceRow } from '../components/dashboard/NetBalanceRow';
import { ConfirmationView } from '../components/dashboard/ConfirmationView';
import { useAuth } from '../hooks/useAuth';
import { useDailyEntry } from '../hooks/useDailyEntry';
import { computeStreak } from '../hooks/useStreak';
import { dailyApi } from '../api/daily';
import { isoToday, addDays } from '../utils/format';
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
  const today = isoToday();

  const { entry, recap, isLoading, isSaving, setCalories, setSteps, setBurned, confirm } =
    useDailyEntry(user?.id, viewedDate);

  useEffect(() => {
    if (!user) return;
    dailyApi.getAll(user.id).then(setAllEntries).catch(() => {});
  }, [user]);

  const streak = user ? computeStreak(allEntries, viewedDate) : EMPTY_STREAK;

  const calories = entry?.caloriesConsumed ?? 0;
  const steps    = entry?.steps ?? 0;
  const burned   = entry?.caloriesBurned ?? 0;
  const target   = user?.dailyCalorieGoal ?? 1800;

  const ratio  = calories / target;
  const status = ratio <= 1 ? 'good' : ratio <= 1.15 ? 'warn' : 'over';

  const deficitPct = recap ? -recap.deficitPercentage : null;

  const handleConfirm = async () => {
    await confirm();
    const fresh = await dailyApi.getAll(user!.id);
    setAllEntries(fresh);
  };

  if (isLoading) {
    return <PageShell><LoadingState /></PageShell>;
  }

  if (entry?.confirmed && recap) {
    return (
      <PageShell>
        <StatusBar />
        <ConfirmationView date={viewedDate} recap={recap} streak={streak} />
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

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 10 }}>
          <ProgressRing
            value={calories}
            target={target}
            size={232}
            stroke={14}
            status={calories === 0 ? 'good' : status}
          />
        </div>

        <ContextMessage calories={calories} target={target} />

        <MBRGaugeCard deficitPct={deficitPct} status={status} />

        <EntrySection
          calories={calories}
          steps={steps}
          burned={burned}
          isSaving={isSaving}
          onCalories={setCalories}
          onSteps={setSteps}
          onBurned={setBurned}
        />

        {burned > 0 && calories > 0 && (
          <NetBalanceRow net={calories - burned} />
        )}

        <PrimaryCTA
          tone="orange"
          icon={<Check size={18} color="#fff" strokeWidth={2.2} />}
          disabled={calories === 0}
          onClick={handleConfirm}
        >
          Confirmer ma journée
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
      minHeight: '100dvh',
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
