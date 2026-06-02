import { Flame } from './icons';
import type { DayStatus } from '../../types/api';

interface Props {
  days: DayStatus[];
  size?: number;
  gap?: number;
  twoRow?: boolean;
}

export function PipStrip({ days, size = 18, gap = 8, twoRow = false }: Props) {
  const rows = twoRow ? [days.slice(0, 7), days.slice(7)] : [days];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap, alignItems: 'center' }}>
          {row.map((status, i) => <Pip key={i} status={status} size={size} />)}
        </div>
      ))}
    </div>
  );
}

function Pip({ status, size }: { status: DayStatus; size: number }) {
  if (status === 'today') {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: 'var(--orange)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 3px var(--orange-soft)',
      }}>
        <Flame size={size * 0.62} color="#fff" />
      </div>
    );
  }

  const styles: Record<DayStatus, { background: string; border?: string }> = {
    hit:    { background: 'var(--orange)' },
    miss:   { background: 'var(--red-soft)' },
    future: { background: 'transparent', border: '1.5px dashed var(--hairline)' },
    today:  { background: 'var(--orange)' },
  };

  const s = styles[status];
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 999,
      ...s,
    }} />
  );
}
