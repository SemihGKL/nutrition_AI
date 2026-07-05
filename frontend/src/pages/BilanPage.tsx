import { useState, useEffect, useMemo } from 'react';
import { StatusBar } from '../components/dashboard/StatusBar';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { Check } from '../components/ui/icons';
import { Stepper } from '../components/ui/Stepper';
import { useAuth } from '../hooks/useAuth';
import { weighInApi, type WeighIn } from '../api/weighIn';
import { useWeighInContext } from '../hooks/useWeighIn';
import type { DailyCalories } from '../types/api';
import {
  isoToday, addDays, weekStart, weekNumber, frenchDateShort, weekEnd,
  formatNumber, formatDecimal, frenchDayShort, stepsToKcal,
} from '../utils/format';
import { computeMbr } from '../utils/mbr';
import { projectWeightGoal, type WeightGoalProjection } from '../utils/weightGoal';

interface Props {
  onTabChange: (tab: NavTab) => void;
  allEntries: DailyCalories[];
}

export function BilanPage({ onTabChange, allEntries }: Props) {
  const { user } = useAuth();
  const today = isoToday();
  const target = user?.dailyCalorieGoal ?? 1800;
  const mbr = user
    ? Math.round(computeMbr(user.currentWeight, user.height, user.age, user.gender as 'MALE' | 'FEMALE'))
    : 1800;
  const monday = weekStart(today);
  const weekNum = weekNumber(today);

  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [weighInWeight, setWeighInWeight] = useState(user?.currentWeight ?? 70);
  const [savingWeighIn, setSavingWeighIn] = useState(false);
  const [weighInError, setWeighInError] = useState<string | null>(null);
  const { refresh: refreshBadge } = useWeighInContext();

  useEffect(() => {
    if (!user) return;
    weighInApi.getAll().then(setWeighIns).catch(() => {});
  }, [user]);

  const handleWeighIn = async () => {
    if (!user) return;
    setSavingWeighIn(true);
    setWeighInError(null);
    try {
      await weighInApi.save({ date: isoToday(), weight: weighInWeight });
      const updated = await weighInApi.getAll();
      setWeighIns(updated);
      await refreshBadge();
    } catch {
      setWeighInError("Échec de l'enregistrement — réessaie.");
    } finally {
      setSavingWeighIn(false);
    }
  };

  const entryMap = useMemo(() => {
    const m = new Map<string, DailyCalories>();
    allEntries.forEach(e => m.set(e.date, e));
    return m;
  }, [allEntries]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const entry = entryMap.get(date);
      const isFuture = date > today;
      const weightKg = user?.currentWeight ?? 70;
      const steps = stepsToKcal(entry?.steps ?? 0, weightKg);
      const net = entry ? entry.caloriesConsumed - (entry.caloriesBurned ?? 0) - steps : null;
      const delta = net !== null ? net - target : null;
      return {
        label: frenchDayShort(date),
        date,
        net,
        delta,
        ok: net !== null && net <= target,
        future: isFuture,
        confirmed: entry?.confirmed ?? false,
      };
    }),
  [monday, entryMap, target, today]);

  const confirmedDays = weekDays.filter(d => !d.future && d.net !== null && d.confirmed);
  const totalRealDeficit = confirmedDays.reduce((s, d) => s + (mbr - (d.net ?? 0)), 0);
  const theoreticalForConfirmedDays = (mbr - target) * confirmedDays.length;
  const maxBarVal = Math.max(Math.abs(totalRealDeficit), Math.abs(theoreticalForConfirmedDays), 1);

  const sortedWeighIns = [...weighIns].sort((a, b) => a.date > b.date ? -1 : 1);
  const latestWeighIn = sortedWeighIns[0] ?? null;
  const prevWeighIn = sortedWeighIns[1] ?? null;
  const weightDiff = latestWeighIn && prevWeighIn
    ? latestWeighIn.weight - prevWeighIn.weight
    : null;

  const expectedLoss = totalRealDeficit / 7700;
  const actualLoss = weightDiff !== null ? -weightDiff : null;

  const weekRange = `${frenchDateShort(monday)} → ${frenchDateShort(weekEnd(today))}`;

  // Cap sur le poids cible : jours restants au rythme du plan, ré-estimés au
  // rythme réel dès qu'assez de pesées existent (avance / retard).
  const goalProjection = useMemo<WeightGoalProjection>(() =>
    projectWeightGoal({
      startWeight: user?.startWeight ?? user?.currentWeight ?? 0,
      currentWeight: latestWeighIn?.weight ?? user?.currentWeight ?? 0,
      weightGoal: user?.weightGoal ?? 0,
      dailyTargetDeficit: mbr - target,
      weighIns: weighIns.map(w => ({ date: w.date, weight: w.weight })),
      today,
    }),
  [user, latestWeighIn, mbr, target, weighIns, today]);

  return (
    <PageShell>
      <StatusBar />

      <div style={{ padding: '12px 20px 4px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>récap · semaine {weekNum}</div>
        <div className="display" style={{ fontSize: 24, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>
          {weekRange}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '14px 20px 20px' }}>
        {/* Weight headline */}
        {latestWeighIn && (
          <div style={{
            background: weightDiff !== null && weightDiff <= 0 ? 'var(--green-tint)' : 'var(--paper-2)',
            border: `1px solid ${weightDiff !== null && weightDiff <= 0 ? 'var(--green-soft)' : 'var(--hairline-2)'}`,
            borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>évolution du poids</div>
            {weightDiff !== null ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span className="display tabular" style={{
                    fontSize: 48, fontWeight: 500,
                    color: weightDiff <= 0 ? 'var(--green)' : 'var(--red)',
                    lineHeight: 1, letterSpacing: '-0.025em',
                  }}>
                    {weightDiff > 0 ? '+' : ''}{formatDecimal(weightDiff)}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--ink-2)' }}>kg</span>
                </div>
                <div className="tabular" style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>
                  {formatDecimal(prevWeighIn!.weight)} → {formatDecimal(latestWeighIn.weight)} kg · sur 7 jours
                </div>
              </>
            ) : (
              <>
                <div className="display tabular" style={{ fontSize: 32, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>
                  {formatDecimal(latestWeighIn.weight)} kg
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>dernière pesée</div>
              </>
            )}
          </div>
        )}

        {!latestWeighIn && (
          <div style={{
            background: 'var(--orange-tint)', border: '1px solid var(--orange-soft)',
            borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 2 }}>
              pesée hebdomadaire
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
              aucune pesée cette semaine
            </div>
            <Stepper
              label="Poids"
              suffix="kg"
              value={weighInWeight}
              onChange={setWeighInWeight}
              min={30} step={0.1}
            />
            <button
              onClick={handleWeighIn}
              disabled={savingWeighIn}
              style={{
                marginTop: 12, width: '100%',
                padding: '12px 0', borderRadius: 'var(--radius)',
                background: 'var(--orange)', color: '#fff',
                border: 'none', fontSize: 15, fontWeight: 700,
                cursor: savingWeighIn ? 'default' : 'pointer',
                opacity: savingWeighIn ? 0.7 : 1,
                fontFamily: 'var(--font-body)',
              }}
            >
              {savingWeighIn ? 'Enregistrement…' : 'Enregistrer ma pesée'}
            </button>
            {weighInError && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--red)' }}>
                {weighInError}
              </div>
            )}
          </div>
        )}

        {/* Weight-goal projection */}
        <WeightGoalCard
          projection={goalProjection}
          weightGoal={user?.weightGoal ?? 0}
          startWeight={user?.startWeight ?? user?.currentWeight ?? 0}
          onGoToProfil={() => onTabChange('profil')}
        />

        {/* Day-by-day table */}
        <div style={{
          background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--hairline-2)', padding: 16, marginBottom: 14,
        }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>jour par jour</div>
          {(() => {
            const entered = weekDays.filter(d => !d.future && d.net !== null);
            const ok = entered.filter(d => d.ok);
            if (entered.length === 0) return null;
            const all = ok.length === entered.length;
            return (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12, lineHeight: 1.4 }}>
                {all
                  ? `objectif respecté tous les jours saisis — belle régularité !`
                  : `objectif respecté ${ok.length} jour${ok.length !== 1 ? 's' : ''} sur ${entered.length} saisi${entered.length !== 1 ? 's' : ''}`
                }
              </div>
            );
          })()}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '44px 1fr auto auto',
                gap: 10, alignItems: 'center', padding: '10px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--hairline-2)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{d.label}</span>

                {d.future ? (
                  <span className="tabular" style={{ fontSize: 13, color: 'var(--ink-3)' }}>—</span>
                ) : d.net === null ? (
                  <span className="tabular" style={{ fontSize: 13, color: 'var(--ink-3)' }}>non saisi</span>
                ) : (
                  <span className="tabular" style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                    {formatNumber(d.net)}{' '}
                    <span style={{ color: 'var(--ink-3)', fontSize: 11, fontWeight: 500 }}>kcal</span>
                  </span>
                )}

                {!d.future && d.delta !== null ? (
                  <span className="tabular" style={{
                    fontSize: 12, fontWeight: 600,
                    color: d.ok ? 'var(--green)' : 'var(--red)',
                  }}>
                    {d.delta > 0 ? '+' : '−'}{formatNumber(Math.abs(d.delta))}
                  </span>
                ) : (
                  <span />
                )}

                {!d.future && d.net !== null ? (
                  <div style={{
                    width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                    background: d.ok ? 'var(--green-soft)' : 'var(--red-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {d.ok
                      ? <Check size={11} color="var(--green)" strokeWidth={2.5} />
                      : <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, lineHeight: 1 }}>×</span>
                    }
                  </div>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Coherence reading */}
        {confirmedDays.length > 0 && (
          <div style={{
            background: 'var(--orange-tint)', border: '1px solid var(--orange-soft)',
            borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 6 }}>lecture de cohérence</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, color: 'var(--ink)' }}>
              déficit cumulé{' '}
              <span className="tabular" style={{ color: 'var(--orange)' }}>
                {totalRealDeficit >= 0 ? '−' : '+'}{formatNumber(Math.abs(totalRealDeficit))} kcal
              </span>
              <br />
              perte attendue{' '}
              <span className="tabular">~{formatDecimal(Math.abs(expectedLoss))} kg</span>
              {actualLoss !== null && (
                <>
                  <br />
                  perte réelle{' '}
                  <span className="tabular" style={{ color: actualLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {actualLoss >= 0 ? '−' : '+'}{formatDecimal(Math.abs(actualLoss))} kg
                  </span>
                </>
              )}
            </div>
            {actualLoss !== null && Math.abs(actualLoss - Math.abs(expectedLoss)) > 0.1 && (
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.5 }}>
                écart probablement lié à l'eau et au glycogène — c'est normal.
              </div>
            )}
          </div>
        )}

        {/* Theoretical vs real deficit */}
        {confirmedDays.length > 0 && (
          <div style={{
            background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--hairline-2)', padding: 16, marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>plan vs réel</div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: 'var(--orange)',
                background: 'var(--orange-tint)',
                borderRadius: 999,
                padding: '3px 10px',
              }}>
                {confirmedDays.length} / 7 j
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
              comparaison sur les {confirmedDays.length} jour{confirmedDays.length > 1 ? 's' : ''} confirmé{confirmedDays.length > 1 ? 's' : ''}
            </div>
            <BarRow
              label="si plan de base suivi à la lettre"
              value={`${theoreticalForConfirmedDays >= 0 ? '−' : '+'}${formatNumber(Math.abs(theoreticalForConfirmedDays))} kcal`}
              pct={Math.round((Math.abs(theoreticalForConfirmedDays) / maxBarVal) * 100)}
              color="var(--ink-3)"
            />
            <div style={{ height: 10 }} />
            <BarRow
              label="déficit réel accumulé"
              value={`${totalRealDeficit >= 0 ? '−' : '+'}${formatNumber(Math.abs(totalRealDeficit))} kcal`}
              pct={Math.round((Math.abs(totalRealDeficit) / maxBarVal) * 100)}
              color={totalRealDeficit >= 0 ? 'var(--green)' : 'var(--red)'}
            />
          </div>
        )}

        {confirmedDays.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8, padding: '40px 0',
          }}>
            <span style={{ fontSize: 32 }}>📋</span>
            <span style={{ fontSize: 15, color: 'var(--ink-2)' }}>aucune journée confirmée cette semaine</span>
          </div>
        )}
      </div>

      <BottomNav active="bilan" onChange={onTabChange} />
      <HomeIndicator />
    </PageShell>
  );
}

const PACE_META: Record<WeightGoalProjection['pace'], { chip: string; color: string; bg: string }> = {
  ahead:      { chip: 'en avance',     color: 'var(--green)',  bg: 'var(--green-tint)' },
  'on-track': { chip: 'dans les temps', color: 'var(--green)',  bg: 'var(--green-tint)' },
  behind:     { chip: 'en retard',     color: 'var(--orange)', bg: 'var(--orange-tint)' },
  stalled:    { chip: 'au ralenti',    color: 'var(--orange)', bg: 'var(--orange-tint)' },
  unknown:    { chip: 'est. plan',     color: 'var(--ink-3)',  bg: 'var(--paper-3)' },
};

function longFrenchDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function paceSentence(p: WeightGoalProjection): string {
  switch (p.pace) {
    case 'ahead':
      return `en avance de ~${formatNumber(p.deltaDays ?? 0)} j sur ton plan — continue comme ça.`;
    case 'on-track':
      return 'pile dans les temps par rapport à ton plan.';
    case 'behind':
      return `en retard de ~${formatNumber(Math.abs(p.deltaDays ?? 0))} j sur ton plan.`;
    case 'stalled':
      return "ton poids stagne sur la période — au rythme actuel, l'objectif s'éloigne.";
    default:
      return 'estimation basée sur ton plan — enregistre tes pesées pour l\'affiner au réel.';
  }
}

function WeightGoalCard({ projection, weightGoal, startWeight, onGoToProfil }: {
  projection: WeightGoalProjection;
  weightGoal: number;
  startWeight: number;
  onGoToProfil: () => void;
}) {
  const p = projection;

  if (p.status === 'no-goal') {
    return (
      <div style={{
        background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--hairline-2)', padding: 16, marginBottom: 14,
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 4 }}>cap sur l'objectif</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 12 }}>
          définis un poids cible pour estimer le nombre de jours qu'il te reste.
        </div>
        <button
          onClick={onGoToProfil}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 'var(--radius)',
            background: 'var(--paper-3)', color: 'var(--ink)', border: '1px solid var(--hairline)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          Définir mon poids cible
        </button>
      </div>
    );
  }

  if (p.status === 'reached') {
    return (
      <div style={{
        background: 'var(--green-tint)', border: '1px solid var(--green-soft)',
        borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 14,
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>cap sur l'objectif</div>
        <div className="display" style={{ fontSize: 20, fontWeight: 500, color: 'var(--green)', marginTop: 4 }}>
          🎉 poids cible atteint
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
          cible {formatDecimal(weightGoal)} kg — bravo pour la constance.
        </div>
      </div>
    );
  }

  if (p.status === 'no-deficit') {
    return (
      <div style={{
        background: 'var(--orange-tint)', border: '1px solid var(--orange-soft)',
        borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 14,
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 4 }}>cap sur l'objectif</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          ton objectif calorique ne crée pas de déficit — abaisse-le pour viser {formatDecimal(weightGoal)} kg.
        </div>
      </div>
    );
  }

  // status === 'projected'
  const meta = PACE_META[p.pace];
  const headColor = p.pace === 'behind' || p.pace === 'stalled'
    ? 'var(--orange)'
    : p.pace === 'unknown' ? 'var(--ink)' : 'var(--green)';
  const weeks = p.daysToGoal !== null ? Math.round(p.daysToGoal / 7) : null;

  return (
    <div style={{
      background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--hairline-2)', padding: 16, marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>cap sur l'objectif</div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg,
          borderRadius: 999, padding: '3px 10px',
        }}>
          {meta.chip}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="display tabular" style={{ fontSize: 44, fontWeight: 500, color: headColor, lineHeight: 1, letterSpacing: '-0.025em' }}>
          ≈ {formatNumber(p.daysToGoal ?? 0)}
        </span>
        <span style={{ fontSize: 15, color: 'var(--ink-2)' }}>jours</span>
      </div>
      {p.targetDate && (
        <div className="tabular" style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
          {weeks !== null && `~${weeks} semaine${weeks > 1 ? 's' : ''} · `}objectif atteint vers le {longFrenchDate(p.targetDate)}
        </div>
      )}

      {/* Journey bar : départ → cible */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
            il reste <span className="tabular" style={{ fontWeight: 600, color: 'var(--ink)' }}>{formatDecimal(p.remainingKg)} kg</span>
          </span>
          <span className="tabular" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>{p.progressPct}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${Math.max(2, p.progressPct)}%`, height: '100%', background: 'var(--green)', borderRadius: 999, opacity: 0.85 }} />
        </div>
        <div className="tabular" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--ink-3)' }}>
          <span>départ {formatDecimal(startWeight)} kg</span>
          <span>cible {formatDecimal(weightGoal)} kg</span>
        </div>
      </div>

      {/* Lecture avance / retard */}
      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 12, lineHeight: 1.5 }}>
        {paceSentence(p)}
      </div>
      {p.hasRealPace && p.realDaysRemaining !== null && p.planDaysRemaining !== null && (
        <div className="tabular" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
          au rythme du plan : ~{formatNumber(p.planDaysRemaining)} j
        </div>
      )}
    </div>
  );
}

function BarRow({ label, value, pct, color }: {
  label: string; value: string; pct: number; color: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{label}</span>
        <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(2, pct)}%`, height: '100%', background: color, borderRadius: 999, opacity: 0.85 }} />
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: 480, height: '100dvh',
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
