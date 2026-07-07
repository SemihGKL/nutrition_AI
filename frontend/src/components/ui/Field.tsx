import { useState } from 'react';

type InputMode = 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  /** Nom du champ — aide les gestionnaires de mots de passe / l'AutoFill iOS à identifier le champ. */
  name?: string;
  id?: string;
  /** Jeton d'auto-complétion HTML (ex. "email", "username", "current-password", "new-password"). */
  autoComplete?: string;
  inputMode?: InputMode;
  autoCapitalize?: string;
  autoCorrect?: 'on' | 'off';
  spellCheck?: boolean;
}

export function Field({
  label, value, onChange, type = 'text', hint, error, placeholder,
  name, id, autoComplete, inputMode, autoCapitalize, autoCorrect, spellCheck,
}: Props) {
  const [focused, setFocused] = useState(false);

  // Valeurs par défaut adaptées au mobile, dérivées du type mais surchargables via les props.
  const isEmail = type === 'email';
  const isNumber = type === 'number';
  const resolvedInputMode: InputMode | undefined =
    inputMode ?? (isEmail ? 'email' : isNumber ? 'numeric' : undefined);
  const resolvedAutoCapitalize = autoCapitalize ?? (isEmail ? 'none' : undefined);
  const resolvedAutoCorrect = autoCorrect ?? (isEmail ? 'off' : undefined);
  const resolvedSpellCheck = spellCheck ?? (isEmail ? false : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label htmlFor={id} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</span>}
      </div>
      <input
        type={type}
        name={name}
        id={id}
        autoComplete={autoComplete}
        inputMode={resolvedInputMode}
        autoCapitalize={resolvedAutoCapitalize}
        autoCorrect={resolvedAutoCorrect}
        spellCheck={resolvedSpellCheck}
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
