import type { CSSProperties } from 'react';
import { Plus, Minus } from './icons';
import { formatNumber } from '../../utils/format';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  hint?: string;
}

const BTN_STYLE: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 8,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--ink-2)',
};

export function Stepper({
  label,
  value,
  onChange,
  suffix = 'kcal',
  step = 50,
  min = 0,
  hint,
}: Props) {
  const set = (v: number) => onChange(Math.max(min, v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, letterSpacing: 0.1 }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</span>}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--paper-2)',
        border: '1px solid var(--hairline-2)',
        borderRadius: 'var(--radius-sm)',
        height: 48,
        padding: '0 4px',
      }}>
        <button
          style={BTN_STYLE}
          onClick={() => set(value - step)}
          aria-label="diminuer"
        >
          <Minus size={16} color="var(--ink-2)" sw={1.8} />
        </button>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 6,
        }}>
          <span className="display tabular" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>
            {formatNumber(value)}
          </span>
          {suffix && (
            <span className="tabular" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {suffix}
            </span>
          )}
        </div>
        <button
          style={BTN_STYLE}
          onClick={() => set(value + step)}
          aria-label="augmenter"
        >
          <Plus size={16} color="var(--ink-2)" sw={1.8} />
        </button>
      </div>
    </div>
  );
}
