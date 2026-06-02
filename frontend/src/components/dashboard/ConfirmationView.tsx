import { Check } from '../ui/icons';
import { Flame } from '../ui/icons';
import { PipStrip } from '../ui/PipStrip';
import { Card } from '../ui/Card';
import { BilanRow } from './BilanRow';
import { frenchWeekday, frenchDay, formatNumber } from '../../utils/format';
import type { DailyRecap } from '../../types/api';
import type { StreakInfo } from '../../hooks/useStreak';

interface Props {
  date: string;
  recap: DailyRecap;
  streak: StreakInfo;
}

const NEXT_MILESTONES = [50, 100, 200, 365, 500, 1000];

function nextMilestone(current: number): number {
  return NEXT_MILESTONES.find(m => m > current) ?? current + 100;
}

export function ConfirmationView({ date, recap, streak }: Props) {
  const milestone = nextMilestone(streak.current);
  const toMilestone = milestone - streak.current;
  const progressPct = (streak.current / milestone) * 100;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 20px' }}>

      {/* Top bar */}
      <div style={{ padding: '0 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>
            {frenchWeekday(date)}
          </div>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, marginTop: 2 }}>
            {frenchDay(date)}
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999,
          background: 'var(--green-soft)', color: 'var(--green)',
          fontSize: 13, fontWeight: 600,
        }}>
          <Check size={14} color="var(--green)" strokeWidth={2.2} />
          confirmé
        </div>
      </div>

      {/* Celebration card */}
      <div style={{
        background: 'var(--orange-tint)',
        border: '1px solid var(--orange-soft)',
        borderRadius: 'var(--radius-md)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 18,
      }}>
        <Confetti />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>
            série en cours
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
            <span className="display tabular" style={{
              fontSize: 56, fontWeight: 500, color: 'var(--orange)',
              lineHeight: 1, letterSpacing: '-0.03em',
            }}>
              {streak.current}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Flame size={26} color="var(--orange)" />
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
            jours d'affilée — record perso : {streak.best}j
          </div>
          <div style={{ height: 1, background: 'var(--orange-soft)', margin: '14px 0' }} />
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 8 }}>
            14 derniers jours
          </div>
          <PipStrip days={streak.last14} size={16} gap={6} twoRow />
        </div>
      </div>

      {/* Bilan du jour */}
      <div style={{ marginBottom: 18 }}>
        <div className="display" style={{ fontSize: 17, fontWeight: 500, marginBottom: 12 }}>
          bilan du jour
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BilanRow label="Consommé" value={recap.caloriesConsumed} suffix="kcal" />
          <BilanRow label="Brûlé" value={recap.caloriesBurned} suffix="kcal" muted />
          <div style={{ height: 1, background: 'var(--hairline-2)' }} />
          <BilanRow label="Net" value={recap.netCalories} suffix="kcal" emphasis="ink" />
          <BilanRow
            label="Déficit MBR"
            value={-Math.round(recap.deficit)}
            suffix="kcal"
            emphasis={recap.deficit > 0 ? 'green' : 'red'}
            signed
            trailing={
              recap.deficitPercentage > 0
                ? (
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 999,
                    background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600,
                  }}>
                    −{Math.abs(Math.round(recap.deficitPercentage))} % ✓
                  </span>
                )
                : undefined
            }
          />
        </div>
      </div>

      {/* Prochain palier */}
      <Card padding={14} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>prochain palier</span>
          <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color: 'var(--orange)' }}>
            {formatNumber(milestone)} j
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--paper-3)', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, progressPct)}%`,
            height: '100%',
            background: 'var(--orange)',
            borderRadius: 999,
          }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
          +{formatNumber(toMilestone)} jours pour débloquer le palier « {formatNumber(milestone)} jours »
        </div>
      </Card>
    </div>
  );
}

function Confetti() {
  const dots = [
    { x: 88, y: 12, c: 'var(--orange)', s: 4 },
    { x: 80, y: 28, c: 'var(--green)',  s: 3 },
    { x: 92, y: 36, c: 'var(--amber)',  s: 5 },
    { x: 78, y: 52, c: 'var(--orange)', s: 3 },
    { x: 68, y: 18, c: 'var(--amber)',  s: 4 },
    { x: 70, y: 40, c: 'var(--orange)', s: 3 },
    { x: 96, y: 60, c: 'var(--green)',  s: 3 },
    { x: 60, y: 8,  c: 'var(--orange)', s: 2 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${d.x}%`,
          top: `${d.y}%`,
          width: d.s,
          height: d.s,
          borderRadius: 999,
          background: d.c,
          opacity: 0.85,
        }} />
      ))}
    </div>
  );
}
