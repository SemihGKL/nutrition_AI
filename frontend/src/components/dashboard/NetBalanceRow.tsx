import { formatNumber } from '../../utils/format';

interface Props {
  calories: number;
  stepsKcal: number;
  burned: number;
  target: number;
}

export function NetBalanceRow({ calories, stepsKcal, burned, target }: Props) {
  const net = calories - stepsKcal - burned;
  return (
    <div style={{
      padding: '14px 16px',
      marginBottom: 16,
      background: 'var(--paper-2)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--hairline-2)',
    }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>bilan net</span>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
          ce que tu as mangé, moins ton activité physique
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
      }}>
        <FormulaCell label="consommées" value={calories} />
        {stepsKcal > 0 && (
          <>
            <Op>−</Op>
            <FormulaCell label="pas (est.)" value={stepsKcal} />
          </>
        )}
        {burned > 0 && (
          <>
            <Op>−</Op>
            <FormulaCell label="séance" value={burned} />
          </>
        )}
        <Op>=</Op>
        <FormulaCell label="net" value={net} accent />
      </div>

      <div style={{
        marginTop: 10,
        fontSize: 11,
        color: 'var(--ink-3)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <span>Objectif journalier</span>
        <span>·</span>
        <span className="tabular">{formatNumber(target)} kcal</span>
      </div>
    </div>
  );
}

function FormulaCell({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div className="tabular" style={{
        fontSize: 14,
        fontWeight: 600,
        color: accent ? 'var(--ink)' : 'var(--ink-2)',
        letterSpacing: 0.2,
      }}>
        {formatNumber(value)}
      </div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

function Op({ children }: { children: string }) {
  return (
    <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500, flexShrink: 0 }}>
      {children}
    </span>
  );
}
