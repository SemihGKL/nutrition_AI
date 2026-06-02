import type { ReactNode } from 'react';
import { formatNumber } from '../../utils/format';

type Emphasis = 'green' | 'red' | 'ink' | null;

interface Props {
  label: string;
  value: number;
  suffix: string;
  emphasis?: Emphasis;
  muted?: boolean;
  trailing?: ReactNode;
  signed?: boolean;
}

const EMPHASIS_COLOR: Record<NonNullable<Emphasis>, string> = {
  green: 'var(--green)',
  red:   'var(--red)',
  ink:   'var(--ink)',
};

export function BilanRow({ label, value, suffix, emphasis, muted, trailing, signed }: Props) {
  const color =
    emphasis ? EMPHASIS_COLOR[emphasis] :
    muted ? 'var(--ink-2)' :
    'var(--ink)';

  const display = signed
    ? (value >= 0 ? `+${formatNumber(value)}` : `−${formatNumber(Math.abs(value))}`)
    : formatNumber(value);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {trailing}
        <span className="tabular" style={{ fontSize: 17, fontWeight: emphasis ? 600 : 500, color }}>
          {display}{' '}
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{suffix}</span>
        </span>
      </div>
    </div>
  );
}
