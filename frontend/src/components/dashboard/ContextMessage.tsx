import type { CSSProperties } from 'react';
import { formatNumber } from '../../utils/format';

interface Props {
  /** Calories mangées : décide si la journée est commencée. */
  consumed: number;
  /** Bilan net (mangé − activité) : base des messages. Peut être ≤ 0 avec du sport. */
  net: number;
  target: number;
  /** Dépense du jour (TDEE) : référence du déficit. */
  tdee?: number;
}

export function ContextMessage({ consumed, net: calories, target, tdee }: Props) {
  if (consumed <= 0) {
    return (
      <div style={STYLE}>
        commence ta journée — saisis tes calories
      </div>
    );
  }

  const remaining = target - calories;

  if (remaining >= 0) {
    return (
      <div style={STYLE}>
        il te reste{' '}
        <span className="tabular" style={{ color: 'var(--green)', fontWeight: 600 }}>
          {formatNumber(remaining)} kcal
        </span>{' '}
        aujourd'hui
      </div>
    );
  }

  const over = Math.abs(remaining);

  if (tdee !== undefined && calories <= tdee) {
    const deficit = tdee - calories;
    return (
      <div style={STYLE}>
        <span className="tabular" style={{ color: 'var(--amber)', fontWeight: 600 }}>
          +{formatNumber(over)} kcal
        </span>{' '}
        au-dessus de l'objectif · tu restes sous ta dépense du jour, c'est correct{' '}
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>
          (déficit de {formatNumber(deficit)} kcal)
        </span>
      </div>
    );
  }

  if (tdee !== undefined && calories > tdee) {
    const overTdee = calories - tdee;
    return (
      <div style={STYLE}>
        <span className="tabular" style={{ color: 'var(--red)', fontWeight: 600 }}>
          +{formatNumber(overTdee)} kcal
        </span>{' '}
        au-dessus de ta dépense du jour — essaie de compenser cette semaine
      </div>
    );
  }

  return (
    <div style={STYLE}>
      dépassement de{' '}
      <span className="tabular" style={{ color: 'var(--red)', fontWeight: 600 }}>
        {formatNumber(over)} kcal
      </span>{' '}
      — pas grave
    </div>
  );
}

const STYLE: CSSProperties = {
  textAlign: 'center',
  fontSize: 14,
  color: 'var(--ink-2)',
  marginTop: 4,
  marginBottom: 18,
  lineHeight: 1.4,
};
