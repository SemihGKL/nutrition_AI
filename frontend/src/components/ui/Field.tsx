import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
}

export function Field({ label, value, onChange, type = 'text', hint, error, placeholder }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</span>}
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 48,
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? 'var(--red)' : focused ? 'var(--orange)' : 'var(--hairline)'}`,
          boxShadow: focused ? '0 0 0 3px var(--orange-soft)' : 'none',
          background: 'var(--paper-2)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          padding: '0 14px',
          outline: 'none',
          transition: 'border-color 120ms linear, box-shadow 120ms linear',
          width: '100%',
        }}
      />
      {error && (
        <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>
      )}
    </div>
  );
}
