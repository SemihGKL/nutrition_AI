import { Card } from '../ui/Card';
import { MBRGauge } from '../ui/MBRGauge';

interface Props {
  deficitPct: number | null;
  status: 'good' | 'warn' | 'over';
}

const STATUS_COLOR = {
  good: 'var(--green)',
  warn: 'var(--amber)',
  over: 'var(--red)',
};

export function MBRGaugeCard({ deficitPct, status }: Props) {
  const label =
    deficitPct === null
      ? '—'
      : deficitPct < 0
        ? `−${Math.abs(Math.round(deficitPct))} %`
        : `+${Math.round(deficitPct)} %`;

  return (
    <Card padding={14} style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
          déficit vs MBR
        </span>
        <span className="tabular" style={{
          fontSize: 14,
          fontWeight: 600,
          color: STATUS_COLOR[status],
        }}>
          {label}
        </span>
      </div>
      <MBRGauge pct={deficitPct ?? -12} />
    </Card>
  );
}
