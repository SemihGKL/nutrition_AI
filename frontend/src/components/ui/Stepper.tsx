import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { Plus, Minus } from './icons';

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
  flexShrink: 0,
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
  const decimals = step < 1 ? Math.round(-Math.log10(step)) : 0;
  const round = (n: number) => parseFloat(n.toFixed(decimals));

  const [raw, setRaw] = useState(() => round(value).toFixed(decimals));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setRaw(round(value).toFixed(decimals));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (str: string) => {
    const parsed = parseFloat(str);
    const next = isNaN(parsed) ? min : Math.max(min, round(parsed));
    onChange(next);
    setRaw(String(next));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setRaw(str);
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, round(parsed)));
    }
  };

  const step_ = (delta: number) => onChange(Math.max(min, round(value + delta)));

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
        <button style={BTN_STYLE} onClick={() => step_(-step)} aria-label="diminuer">
          <Minus size={16} color="var(--ink-2)" sw={1.8} />
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
          <input
            inputMode="numeric"
            value={raw}
            onChange={handleChange}
            onFocus={e => { isFocusedRef.current = true; e.currentTarget.select(); }}
            onBlur={e => { isFocusedRef.current = false; commit(e.currentTarget.value); }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'var(--font-display, var(--font-body))',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--ink)',
              width: '100%',
              minWidth: 0,
            }}
          />
          {suffix && (
            <span className="tabular" style={{ fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>
              {suffix}
            </span>
          )}
        </div>

        <button style={BTN_STYLE} onClick={() => step_(step)} aria-label="augmenter">
          <Plus size={16} color="var(--ink-2)" sw={1.8} />
        </button>
      </div>
    </div>
  );
}
