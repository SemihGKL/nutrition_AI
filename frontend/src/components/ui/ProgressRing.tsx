import { useState, useEffect } from 'react';
import { formatNumber } from '../../utils/format';

type RingStatus = 'good' | 'warn' | 'over';

interface Props {
  value: number;
  target: number;
  size?: number;
  stroke?: number;
  status?: RingStatus;
  label?: string;
}

const STATUS_COLOR: Record<RingStatus, string> = {
  good: 'var(--green)',
  warn: 'var(--amber)',
  over: 'var(--red)',
};

function resolveStatus(ratio: number, override?: RingStatus): RingStatus {
  if (override) return override;
  if (ratio <= 1) return 'good';
  if (ratio <= 1.15) return 'warn';
  return 'over';
}

export function ProgressRing({
  value,
  target,
  size = 240,
  stroke = 14,
  status: statusProp,
  label = 'kcal',
}: Props) {
  const ratio = Math.max(0, value / target);
  const status = resolveStatus(ratio, statusProp);
  const color = STATUS_COLOR[status];

  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamp = Math.min(ratio, 1);
  const dashOffset = circumference * (1 - clamp);
  const overRatio = Math.max(0, ratio - 1);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  const drawnOffset = mounted ? dashOffset : circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--paper-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={drawnOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)' }}
        />
        {overRatio > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="var(--red)"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? circumference * (1 - Math.min(overRatio, 1)) : circumference}
            strokeLinecap="round"
            opacity={0.9}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1) 0.15s' }}
          />
        )}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="display tabular" style={{
          fontSize: size * 0.235,
          lineHeight: 1,
          color: 'var(--ink)',
          fontWeight: 500,
        }}>
          {formatNumber(value)}
        </span>
        <span className="tabular" style={{
          fontSize: 14,
          color: 'var(--ink-3)',
          marginTop: 6,
          letterSpacing: 0.2,
        }}>
          / {formatNumber(target)} {label}
        </span>
      </div>
    </div>
  );
}
