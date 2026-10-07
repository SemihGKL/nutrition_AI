import { useState, useEffect } from 'react';
import { ProgressRing } from '../components/ui/ProgressRing';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { PrimaryCTA } from '../components/ui/PrimaryCTA';
import { Check } from '../components/ui/icons';
import { DayHeader } from '../components/dashboard/DayHeader';
import { ContextMessage } from '../components/dashboard/ContextMessage';
import { EntrySection } from '../components/dashboard/EntrySection';
import { NO_MEALS } from '../utils/meals';
import { NetBalanceRow } from '../components/dashboard/NetBalanceRow';
import { DeficitBanner } from '../components/dashboard/DeficitBanner';
import { ConfirmationView } from '../components/dashboard/ConfirmationView';
import { CalendarModal } from '../components/dashboard/CalendarModal';
import { useAuth } from '../hooks/useAuth';
import { useDailyEntry } from '../hooks/useDailyEntry';
import { computeStreak } from '../hooks/useStreak';
import { isoToday, addDays, stepsToKcal } from '../utils/format';
import { computeMbr, computeTdee } from '../utils/mbr';
import type { DailyCalories } from '../types/api';
import type { StreakInfo } from '../hooks/useStreak';

const EMPTY_STREAK: StreakInfo = { current: 0, best: 0, last14: Array(14).fill('future') };

interface Props {
  onTabChange: (tab: NavTab) => void;
  allEntries: DailyCalories[];
  onEntriesRefresh: () => void;
}

export function DashboardPage({ onTabChange, allEntries, onEntriesRefresh }: Props) {
  const { user } = useAuth();
  const [viewedDate, setViewedDate] = useState(isoToday);
  const [isEditing, setIsEditing] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const today = isoToday();

  useEffect(() => { setIsEditing(false); }, [viewedDate]);

  const {
    entry, recap, isLoading, isSaving, saveFailed, error,
    setMeal, setSteps, setBurned, confirm, retrySave, reload,
  } = useDailyEntry(user?.id, viewedDate);

  const streak = user ? computeStreak(allEntries, viewedDate) : EMPTY_STREAK;

  const calories = entry?.caloriesConsumed ?? 0;
  const steps    = entry?.steps ?? 0;
  const burned   = entry?.caloriesBurned ?? 0;
  const target   = user?.dailyCalorieGoal ?? 1800;

  const stepsKcal = stepsToKcal(steps, user?.currentWeight ?? 70);
  const net       = calories - stepsKcal - burned;

  // Référence du déficit : la dépense du jour (TDEE), celle du recap serveur dès qu'il existe.
  const tdeeValue = recap?.tdee !== undefined
    ? Math.round(recap.tdee)
    : user
      ? Math.round(computeTdee(computeMbr(user.currentWeight ?? 70, user.height ?? 170, user.age ?? 30, user.gender as 'MALE' | 'FEMALE')))
      : undefined;

  const openCalendar = () => setIsCalendarOpen(true);
  const closeCalendar = () => setIsCalendarOpen(false);

  const handleConfirm = async () => {
    try {
      await confirm();
    } catch {
      return; // échec signalé par EntrySection (« non enregistré · réessayer »)
    }
    onEntriesRefresh();
    setIsEditing(false);
  };

  const calendarModal = isCalendarOpen && (
    <CalendarModal
      selectedDate={viewedDate}
      todayDate={today}
      onSelect={setViewedDate}
      onClose={closeCalendar}
    />
  );

  if (isLoading) {
    return <PageShell><LoadingState /></PageShell>;
  }

  // Sans les données du jour, une saisie écraserait la journée existante : on bloque.
  if (error) {
    return <PageShell><ErrorState message={error} onRetry={reload} /></PageShell>;
  }

  if (entry?.confirmed && recap && !isEditing) {
    return (
      <PageShell>
        <ConfirmationView
          date={viewedDate}
          recap={recap}
          streak={streak}
          onEdit={() => setIsEditing(true)}
          onOpenCalendar={openCalendar}
        />
        <BottomNav active="jour" onChange={onTabChange} />
        <HomeIndicator />
        {calendarModal}
      </PageShell>
    );
  }

  return (
    <PageShell>
      <DayHeader
        date={viewedDate}
        streakCount={streak.current}
        canGoForward={viewedDate < today}
        onPrev={() => setViewedDate(d => addDays(d, -1))}
        onNext={() => setViewedDate(d => addDays(d, 1))}
        onOpenCalendar={openCalendar}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 10 }}>
          <ProgressRing
            value={net}
            target={target}
            expenditure={tdeeValue}
            size={232}
            stroke={14}
            label="kcal net"
          />
        </div>

        <ContextMessage consumed={calories} net={net} target={target} tdee={tdeeValue} />

        <EntrySection
          key={viewedDate}
          meals={entry?.meals ?? NO_MEALS}
          calories={calories}
          steps={steps}
          burned={burned}
          weightKg={user?.currentWeight ?? 70}
          stepsGoal={user?.dailyStepsGoal}
          isSaving={isSaving}
          saveFailed={saveFailed}
          onRetry={() => { retrySave(); }}
          onMeal={setMeal}
          onSteps={setSteps}
          onBurned={setBurned}
        />

        {(steps > 0 || burned > 0) && calories > 0 && (
          <NetBalanceRow calories={calories} stepsKcal={stepsKcal} burned={burned} target={target} />
        )}

        {calories > 0 && (
          <DeficitBanner net={net} target={target} tdee={tdeeValue} />
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

      <BottomNav active="jour" onChange={onTabChange} />
      <HomeIndicator />
      {calendarModal}
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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--ink-3)',
      fontSize: 14,
    }}>
      {message}
      <button
        onClick={onRetry}
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--orange)',
          background: 'none',
          border: '1px solid var(--orange)',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
