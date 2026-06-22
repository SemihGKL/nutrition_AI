import type { CSSProperties } from 'react';
import { formatNumber } from '../../utils/format';

interface Props {
  calories: number;
  target: number;
  mbr?: number;
}

export function ContextMessage({ calories, target, mbr }: Props) {
  if (calories <= 0) {
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

  if (mbr !== undefined && calories <= mbr) {
    const mbrDeficit = mbr - calories;
    return (
      <div style={STYLE}>
        <span className="tabular" style={{ color: 'var(--amber)', fontWeight: 600 }}>
          +{formatNumber(over)} kcal
        </span>{' '}
        au-dessus de l'objectif · tu restes sous ton métabolisme de base, c'est correct{' '}
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>
          (déficit de {formatNumber(mbrDeficit)} kcal)
        </span>
      </div>
    );
  }

  if (mbr !== undefined && calories > mbr) {
    const overMbr = calories - mbr;
    return (
      <div style={STYLE}>
        <span className="tabular" style={{ color: 'var(--red)', fontWeight: 600 }}>
          +{formatNumber(overMbr)} kcal
        </span>{' '}
        au-dessus de ton métabolisme de base — essaie de compenser cette semaine
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
