import { useState, useEffect, useMemo } from 'react';
import { StatusBar } from '../components/dashboard/StatusBar';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { Check } from '../components/ui/icons';
import { useAuth } from '../hooks/useAuth';
import { weighInApi, type WeighIn } from '../api/weighIn';
import type { DailyCalories } from '../types/api';
import {
  isoToday, addDays, weekStart, weekNumber, frenchDateShort, weekEnd,
  formatNumber, formatDecimal, frenchDayShort,
} from '../utils/format';

interface Props {
  onTabChange: (tab: NavTab) => void;
  allEntries: DailyCalories[];
}

export function BilanPage({ onTabChange, allEntries }: Props) {
  const { user } = useAuth();
  const today = isoToday();
  const target = user?.dailyCalorieGoal ?? 1800;
  const tdee = user?.dailyCalorieGoal ? user.dailyCalorieGoal + 300 : 2100;
  const monday = weekStart(today);
  const weekNum = weekNumber(today);

  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);

  useEffect(() => {
    if (!user) return;
    weighInApi.getAll(user.id).then(setWeighIns).catch(() => {});
  }, [user]);

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
      const net = entry ? entry.caloriesConsumed - (entry.caloriesBurned ?? 0) : null;
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
  const totalRealDeficit = confirmedDays.reduce((s, d) => s + (target - (d.net ?? 0)), 0);
  const theoreticalWeekDeficit = (target - tdee) * 7;
  const maxBarVal = Math.max(Math.abs(totalRealDeficit), Math.abs(theoreticalWeekDeficit), 1);

  const sortedWeighIns = [...weighIns].sort((a, b) => a.date > b.date ? -1 : 1);
  const latestWeighIn = sortedWeighIns[0] ?? null;
  const prevWeighIn = sortedWeighIns[1] ?? null;
  const weightDiff = latestWeighIn && prevWeighIn
    ? latestWeighIn.weight - prevWeighIn.weight
    : null;

  const expectedLoss = totalRealDeficit / 7700;
  const actualLoss = weightDiff !== null ? -weightDiff : null;

  const weekRange = `${frenchDateShort(monday)} → ${frenchDateShort(weekEnd(today))}`;

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
            background: 'var(--paper-2)', border: '1px solid var(--hairline-2)',
            borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 14,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>aucune pesée cette semaine</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>enregistre ton poids dans le profil</div>
          </div>
        )}

        {/* Day-by-day table */}
        <div style={{
          background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--hairline-2)', padding: 16, marginBottom: 14,
        }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>jour par jour</div>
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
            <div className="display" style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>théorique vs réel</div>
            <BarRow
              label="déficit théorique"
              value={`${theoreticalWeekDeficit >= 0 ? '−' : '+'}${formatNumber(Math.abs(theoreticalWeekDeficit))} kcal`}
              pct={Math.round((Math.abs(theoreticalWeekDeficit) / maxBarVal) * 100)}
              color="var(--ink-2)"
            />
            <div style={{ height: 10 }} />
            <BarRow
              label="déficit réel"
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
