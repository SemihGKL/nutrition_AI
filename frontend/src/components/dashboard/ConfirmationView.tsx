import { useState } from 'react';
import { Flame, Pencil, Chevron } from '../ui/icons';
import { PipStrip } from '../ui/PipStrip';
import { Card } from '../ui/Card';
import { BilanRow } from './BilanRow';
import { frenchWeekday, frenchDay, formatNumber, stepsToKcal } from '../../utils/format';
import type { DailyRecap } from '../../types/api';
import type { StreakInfo } from '../../hooks/useStreak';

interface Props {
  date: string;
  recap: DailyRecap;
  streak: StreakInfo;
  weightKg: number;
  canEdit?: boolean;
  onEdit: () => void;
}

const NEXT_MILESTONES = [30, 60, 90, 180, 365, 730];

function nextMilestone(current: number): number {
  return NEXT_MILESTONES.find(m => m > current) ?? current + 30;
}

function milestoneLabel(days: number): string {
  const months = days / 30;
  if (days === 365) return '1 an';
  if (days === 730) return '2 ans';
  return `${months} mois`;
}

export function ConfirmationView({ date, recap, streak, weightKg, canEdit = false, onEdit }: Props) {
  const [bilanOpen, setBilanOpen] = useState(false);
  const milestone   = nextMilestone(streak.current);
  const toMilestone = milestone - streak.current;
  const progressPct = (streak.current / milestone) * 100;

  const stepsKcal  = stepsToKcal(recap.steps, weightKg);
  const ecart      = recap.netCalories - recap.dailyCalorieGoal;
  const isOnTarget = ecart <= 0;
  const absEcart   = Math.abs(ecart);
  const resultColor = isOnTarget ? 'var(--green)' : 'var(--red)';

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
        {canEdit && (
          <button
            onClick={onEdit}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 999,
              background: 'transparent',
              border: '1.5px solid var(--hairline)',
              color: 'var(--ink-2)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Pencil size={13} color="var(--ink-2)" sw={1.8} />
            Modifier
          </button>
        )}
      </div>

      {/* Day result banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px',
        marginBottom: 16,
        background: isOnTarget ? 'var(--green-soft)' : 'var(--red-soft)',
        borderRadius: 'var(--radius-md)',
        borderLeft: `4px solid ${resultColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: resultColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 0 6px ${isOnTarget ? 'var(--green-tint)' : 'var(--red-soft)'}`,
        }}>
          {isOnTarget ? (
            <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
              <path d="M1.5 7.5L7.5 13.5L18.5 1.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1 1L14 14M14 1L1 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: resultColor, marginBottom: 3 }}>
            {isOnTarget ? 'Objectif atteint' : 'Au-dessus de l\'objectif'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            {isOnTarget
              ? <>Déficit de <span className="tabular" style={{ fontWeight: 600 }}>{formatNumber(absEcart)} kcal</span></>
              : <>Dépassement de <span className="tabular" style={{ fontWeight: 600 }}>+{formatNumber(absEcart)} kcal</span></>
            }
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
            ≈ {isOnTarget ? '−' : '+'}{Math.round(absEcart / 7.7)} g de graisse
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 700, color: resultColor, lineHeight: 1 }}>
            {isOnTarget ? '−' : '+'}{formatNumber(absEcart)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 3 }}>kcal</div>
        </div>
      </div>

      {/* Streak card */}
      <div style={{
        background: 'var(--orange-tint)',
        border: '1px solid var(--orange-soft)',
        borderRadius: 'var(--radius-md)',
        padding: 20,
        marginBottom: 18,
      }}>
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Flame size={26} color="var(--orange)" />
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
          jours de suivi confirmés d'affilée · record : {streak.best}j
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>
          Chaque journée confirmée fait progresser la série.
        </div>

        <div style={{ height: 1, background: 'var(--orange-soft)', margin: '14px 0' }} />

        <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 8 }}>
          14 derniers jours
        </div>
        <PipStrip days={streak.last14} size={16} gap={6} twoRow />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          <LegendDot color="var(--orange)" label="Journée validée" />
          <LegendDot color="var(--red-soft)" label="Non renseignée" />
          <LegendDot color="transparent" border="1.5px dashed var(--hairline)" label="À venir" />
        </div>
      </div>

      {/* Bilan du jour */}
      <div style={{ marginBottom: 18 }}>
        {/* Summary row — always visible, tap to expand */}
        <button
          onClick={() => setBilanOpen(o => !o)}
          style={{
            width: '100%', background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 8, marginBottom: bilanOpen ? 12 : 0,
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="display" style={{ fontSize: 17, fontWeight: 500 }}>
              bilan du jour
            </div>
            <div style={{ transition: 'transform 200ms', transform: bilanOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <Chevron dir="down" size={14} color="var(--ink-3)" />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: resultColor, lineHeight: 1 }}>
              {isOnTarget ? '−' : '+'}{formatNumber(absEcart)}{' '}
              <span style={{ fontSize: 12, fontWeight: 500 }}>kcal</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: resultColor, marginTop: 3 }}>
              {isOnTarget ? 'Déficit calorique ✓' : 'Surplus calorique'}
            </div>
          </div>
        </button>

        {/* Detail rows — collapsed by default */}
        {bilanOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BilanRow label="Calories consommées" value={recap.caloriesConsumed} suffix="kcal" />
            {stepsKcal > 0 && (
              <BilanRow label={`Pas (${formatNumber(recap.steps)} · est. basse)`} value={stepsKcal} suffix="kcal" muted />
            )}
            {recap.caloriesBurned > 0 && (
              <BilanRow label="Activité sportive" value={recap.caloriesBurned} suffix="kcal" muted />
            )}
            <BilanRow label="Objectif journalier" value={recap.dailyCalorieGoal} suffix="kcal" muted />
            <div style={{ height: 1, background: 'var(--hairline-2)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>Par rapport à l'objectif</span>
              <div style={{ textAlign: 'right' }}>
                <div className="tabular" style={{ fontSize: 18, fontWeight: 700, color: resultColor, lineHeight: 1 }}>
                  {isOnTarget ? '−' : '+'}{formatNumber(absEcart)}{' '}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>kcal</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: resultColor, marginTop: 3 }}>
                  {isOnTarget ? 'Déficit calorique ✓' : 'Surplus calorique'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prochain palier */}
      <Card padding={14} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>prochain palier</span>
          <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color: 'var(--orange)' }}>
            {milestoneLabel(milestone)}
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
          encore {formatNumber(toMilestone)} jour{toMilestone > 1 ? 's' : ''} pour atteindre le palier {milestoneLabel(milestone)}
        </div>
      </Card>

    </div>
  );
}

function LegendDot({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 10, height: 10, borderRadius: 999,
        background: color,
        border: border,
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{label}</span>
    </div>
  );
}
