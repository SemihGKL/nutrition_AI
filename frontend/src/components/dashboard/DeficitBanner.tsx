import { formatNumber } from '../../utils/format';

interface Props {
  net: number;
  target: number;
}

export function DeficitBanner({ net, target }: Props) {
  const isOnTrack = net <= target;
  const diff = Math.abs(net - target);

  const color  = isOnTrack ? 'var(--green)' : 'var(--red)';
  const bg     = isOnTrack ? 'var(--green-soft)' : 'var(--red-soft)';
  const tint   = isOnTrack ? 'var(--green-tint)' : 'var(--red-soft)';

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
        {isOnTrack ? (
          <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
            <path d="M1.5 7.5L7.5 13.5L18.5 1.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1 1L14 14M14 1L1 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color,
          letterSpacing: 0.1,
          marginBottom: 4,
        }}>
          {isOnTrack ? 'Déficit préservé' : 'Déficit non respecté'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>
          {isOnTrack
            ? <><span className="tabular" style={{ fontWeight: 600 }}>{formatNumber(diff)} kcal</span> sous ton objectif</>
            : <><span className="tabular" style={{ fontWeight: 600 }}>+{formatNumber(diff)} kcal</span> au-dessus de ton objectif</>
          }
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
          ≈ {isOnTrack ? '−' : '+'}{Math.round(diff / 7.7)} g de graisse
        </div>
      </div>

      <div style={{
        textAlign: 'right',
        flexShrink: 0,
      }}>
        <div className="tabular" style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}>
          {formatNumber(net)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 3 }}>kcal net</div>
      </div>
    </div>
  );
}
