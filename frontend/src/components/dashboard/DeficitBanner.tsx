import { formatNumber } from '../../utils/format';

interface Props {
  net: number;
  target: number;
  mbr?: number;
}

type State = 'on-track' | 'partial' | 'over';

function resolveState(net: number, target: number, mbr?: number): State {
  if (net <= target) return 'on-track';
  if (mbr !== undefined && net <= mbr) return 'partial';
  return 'over';
}

const COLOR: Record<State, string> = {
  'on-track': 'var(--green)',
  'partial':  'var(--amber)',
  'over':     'var(--red)',
};
const BG: Record<State, string> = {
  'on-track': 'var(--green-soft)',
  'partial':  'var(--orange-tint)',
  'over':     'var(--red-soft)',
};
const TINT: Record<State, string> = {
  'on-track': 'var(--green-tint)',
  'partial':  'var(--orange-soft)',
  'over':     'var(--red-soft)',
};

export function DeficitBanner({ net, target, mbr }: Props) {
  const state = resolveState(net, target, mbr);
  const color = COLOR[state];
  const bg    = BG[state];
  const tint  = TINT[state];

  const diffFromTarget = Math.abs(net - target);

  const title = {
    'on-track': 'Objectif respecté',
    'partial':  'Objectif dépassé — déficit préservé',
    'over':     'Déficit non respecté',
  }[state];

  const subtitle = {
    'on-track': <><span className="tabular" style={{ fontWeight: 600 }}>{formatNumber(diffFromTarget)} kcal</span> sous ton objectif</>,
    'partial':  <><span className="tabular" style={{ fontWeight: 600 }}>+{formatNumber(diffFromTarget)} kcal</span> au-dessus de l'objectif · tu restes en déficit</>,
    'over':     <><span className="tabular" style={{ fontWeight: 600 }}>+{formatNumber(diffFromTarget)} kcal</span> au-dessus de ton objectif</>,
  }[state];

  const footnote = {
    'on-track': `≈ −${Math.round(diffFromTarget / 7.7)} g de graisse · continue comme ça pour progresser`,
    'partial':  '',
    'over':     `≈ +${Math.round(diffFromTarget / 7.7)} g de graisse · un écart ponctuel, ça se rattrape`,
  }[state];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '18px 16px',
      marginBottom: 16,
      background: bg,
      borderRadius: 'var(--radius-md)',
      borderLeft: `4px solid ${color}`,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 0 0 6px ${tint}`,
      }}>
        {state === 'on-track' ? (
          <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
            <path d="M1.5 7.5L7.5 13.5L18.5 1.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : state === 'partial' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v5M8 11v1" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1 1L14 14M14 1L1 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: 0.1, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>
          {subtitle}
        </div>
        {footnote && (
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
            {footnote}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="tabular" style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
          {formatNumber(net)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 3 }}>kcal net</div>
      </div>
    </div>
  );
}
