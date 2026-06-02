import { useMemo } from 'react';
import { StatusBar } from '../components/dashboard/StatusBar';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { StreakChip } from '../components/ui/StreakChip';
import { PipStrip } from '../components/ui/PipStrip';
import { useAuth } from '../hooks/useAuth';
import type { DailyCalories } from '../types/api';
import type { StreakInfo } from '../hooks/useStreak';
import {
  isoToday, addDays, weekStart, weekEnd, weekNumber,
  frenchDateShort, formatNumber,
} from '../utils/format';

interface Props {
  onTabChange: (tab: NavTab) => void;
  streakCount: number;
  streak: StreakInfo;
  allEntries: DailyCalories[];
}

const MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface BarDay {
  label: string;
  date: string;
  net: number;
  met: boolean;
  future: boolean;
  partial: boolean;
}

export function SemainePage({ onTabChange, streakCount, streak, allEntries }: Props) {
  const { user } = useAuth();
  const today = isoToday();
  const target = user?.dailyCalorieGoal ?? 1800;
  const monday = weekStart(today);

  const entryMap = useMemo(() => {
    const m = new Map<string, DailyCalories>();
    allEntries.forEach(e => m.set(e.date, e));
    return m;
  }, [allEntries]);

  const bars: BarDay[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const entry = entryMap.get(date);
      const isFuture = date > today;
      const isToday = date === today;
      const net = entry ? entry.caloriesConsumed - (entry.caloriesBurned ?? 0) : 0;
      const met = net > 0 && net <= target;
      const partial = isToday && !!entry && !entry.confirmed;
      return { label: DAY_LABELS[i], date, net, met, future: isFuture, partial };
    });
  }, [monday, entryMap, target, today]);

  const confirmedBars = bars.filter(b => !b.future && !b.partial && b.net > 0);
  const avgKcal = confirmedBars.length > 0
    ? Math.round(confirmedBars.reduce((s, b) => s + b.net, 0) / confirmedBars.length)
    : 0;
  const avgDeficit = avgKcal > 0 ? target - avgKcal : 0;

  const maxVal = Math.max(target * 1.25, ...bars.map(b => b.net));

  const nextMilestone = MILESTONES.find(m => m > streakCount) ?? MILESTONES[MILESTONES.length - 1];
  const milestoneProgress = Math.min(1, streakCount / nextMilestone);
  const daysToMilestone = nextMilestone - streakCount;

  const weekNum = weekNumber(today);
  const weekRange = `${frenchDateShort(monday)} → ${frenchDateShort(weekEnd(today))}`;

  return (
    <PageShell>
      <StatusBar />

      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>semaine {weekNum}</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>
            {weekRange}
          </div>
        </div>
        <StreakChip count={streakCount} size="md" />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 20px' }}>
        <div style={{
          background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--hairline-2)', padding: 16, marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, letterSpacing: 0.3 }}>kcal nettes / jour</div>
          <WeekBars bars={bars} target={target} max={maxVal} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <MiniStat
            label="moy."
            value={avgKcal > 0 ? formatNumber(avgKcal) : '—'}
            suffix="kcal"
          />
          <MiniStat
            label="déficit/j"
            value={avgKcal > 0
              ? (avgDeficit >= 0 ? `−${formatNumber(avgDeficit)}` : `+${formatNumber(-avgDeficit)}`)
              : '—'}
            suffix="kcal"
            tone={avgKcal > 0 ? (avgDeficit >= 0 ? 'green' : 'red') : undefined}
          />
          <MiniStat label="objectif" value={formatNumber(target)} suffix="kcal" muted />
        </div>

        <div style={{
          background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--hairline-2)', padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="display" style={{ fontSize: 15, fontWeight: 500 }}>14 derniers jours</span>
            <span className="tabular" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {streak.last14.filter(s => s === 'hit').length} / 14 ✓
            </span>
          </div>
          <PipStrip days={streak.last14} size={18} gap={6} twoRow={false} />

          {streakCount > 0 && (
            <div style={{
              marginTop: 14, padding: 12, borderRadius: 10,
              background: 'var(--orange-tint)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>prochain palier</div>
                <div className="display tabular" style={{ fontSize: 18, fontWeight: 600, color: 'var(--orange)', marginTop: 2 }}>
                  {nextMilestone} jours
                </div>
              </div>
              <div style={{ flex: 1, marginLeft: 16 }}>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--paper)', overflow: 'hidden' }}>
                  <div style={{ width: `${milestoneProgress * 100}%`, height: '100%', background: 'var(--orange)' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, textAlign: 'right' }}>
                  +{daysToMilestone} jours
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="semaine" onChange={onTabChange} />
      <HomeIndicator />
    </PageShell>
  );
}

function WeekBars({ bars, target, max, h = 200 }: {
  bars: BarDay[]; target: number; max: number; h?: number;
}) {
  const targetY = ((max - target) / max) * (h - 32) + 8;

  return (
    <div style={{ position: 'relative', height: h, padding: '8px 0 24px' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: targetY,
        height: 0, borderTop: '1.5px dashed var(--orange)',
        pointerEvents: 'none',
      }}>
        <span style={{
          position: 'absolute', right: -8, top: -10, fontSize: 10,
          color: 'var(--orange)', background: 'var(--paper-2)',
          padding: '2px 4px', letterSpacing: 0.3,
        }}>obj.</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: h - 24, gap: 8 }}>
        {bars.map((bar, i) => {
          const isEmpty = bar.net === 0;
          const heightPct = (bar.future || isEmpty) ? 4 : Math.max(6, (bar.net / max) * 100);
          const color = bar.future || isEmpty
            ? 'var(--paper-3)'
            : bar.partial
            ? 'var(--paper-3)'
            : bar.met
            ? 'var(--green-soft)'
            : 'var(--red-soft)';
          const border = (bar.future || bar.partial || isEmpty)
            ? '1px dashed var(--hairline)'
            : 'none';

          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                <div style={{
                  width: '100%', maxWidth: 32,
                  height: `${heightPct}%`,
                  background: color, border,
                  borderRadius: '6px 6px 2px 2px',
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8, letterSpacing: 0.4 }}>{bar.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix, tone, muted }: {
  label: string; value: string; suffix: string;
  tone?: 'green' | 'red'; muted?: boolean;
}) {
  const color = tone === 'green' ? 'var(--green)'
    : tone === 'red' ? 'var(--red)'
    : muted ? 'var(--ink-2)'
    : 'var(--ink)';

  return (
    <div style={{
      padding: '12px 14px', background: 'var(--paper-2)',
      border: '1px solid var(--hairline-2)', borderRadius: 12,
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span className="display tabular" style={{ fontSize: 18, fontWeight: 600, color }}>{value}</span>
        <span className="tabular" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: 480, minHeight: '100dvh',
      background: 'var(--paper)', color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6, background: 'var(--paper)' }}>
      <div style={{ width: 110, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.22)' }} />
    </div>
  );
}
