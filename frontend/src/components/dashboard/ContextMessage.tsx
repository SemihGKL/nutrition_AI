import type { CSSProperties } from 'react';
import { formatNumber } from '../../utils/format';

interface Props {
  calories: number;
  target: number;
}

export function ContextMessage({ calories, target }: Props) {
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
