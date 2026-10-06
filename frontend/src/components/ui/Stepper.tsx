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
  const format = (n: number) => round(n).toFixed(decimals);

  // Valeur numérique représentée par le texte saisi. Vide ou illisible = min, pour que
  // le parent (total, anneau) reste cohérent pendant la saisie. La virgule est acceptée
  // (clavier français) : sans ça, parseFloat("72,5") vaut 72.
  const parse = (str: string) => {
    const parsed = parseFloat(str.replace(',', '.'));
    return isNaN(parsed) ? min : Math.max(min, round(parsed));
  };

  const [raw, setRaw] = useState(() => format(value));
  const rawRef = useRef(raw);
  rawRef.current = raw;

  // Resynchronise le texte dès que la valeur change pour une autre raison que la
  // frappe en cours (boutons +/−, case décochée, rechargement). On ne teste pas le
  // focus : sur iOS, un tap sur +/− ne retire pas le focus du champ, et l'affichage
  // restait figé sur l'ancienne valeur.
  useEffect(() => {
    if (parse(rawRef.current) !== value) setRaw(format(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (next: number) => {
    if (next !== value) onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value);
    emit(parse(e.target.value));
  };

  const commit = (str: string) => {
    const next = parse(str);
    emit(next);
    setRaw(format(next));
  };

  const step_ = (delta: number) => emit(Math.max(min, round(value + delta)));

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

        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {/* Miroir invisible du suffixe : réserve la même largeur à gauche pour
              que le nombre reste centré dans le champ, avec ou sans suffixe.
              Sans lui, le "0" glisse à gauche quand un suffixe est affiché. */}
          {suffix && (
            <span aria-hidden className="tabular" style={{ fontSize: 12, flexShrink: 0, visibility: 'hidden' }}>
              {suffix}
            </span>
          )}
          <input
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            value={raw}
            onChange={handleChange}
            onFocus={e => e.currentTarget.select()}
            onBlur={e => commit(e.currentTarget.value)}
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
