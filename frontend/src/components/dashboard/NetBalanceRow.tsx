import { formatNumber } from '../../utils/format';

interface Props {
  net: number;
}

export function NetBalanceRow({ net }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      marginBottom: 16,
      background: 'var(--paper-2)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--hairline-2)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>bilan net</span>
      <span className="tabular" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: 0.2 }}>
        {formatNumber(net)}{' '}
        <span style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 12 }}>kcal</span>
      </span>
    </div>
  );
}
