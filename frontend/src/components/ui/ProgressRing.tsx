import { useState, useEffect } from 'react';
import { formatNumber } from '../../utils/format';

type RingStatus = 'good' | 'warn' | 'over';

interface Props {
  value: number;
  target: number;
  mbr?: number;
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

const GOAL_COLOR = 'var(--amber)';
const MBR_COLOR  = 'var(--red)';

function resolveStatus(ratio: number, goalRatio: number, override?: RingStatus): RingStatus {
  if (override) return override;
  if (ratio <= goalRatio) return 'good';
  if (ratio <= 1) return 'warn';
  return 'over';
}

export function ProgressRing({
  value,
  target,
  mbr,
  size = 240,
  stroke = 14,
  status: statusProp,
  label = 'kcal',
}: Props) {
  const scale = mbr ?? target;
  const goalRatio = scale > 0 ? target / scale : 1;
  const ratio = Math.max(0, value / scale);
  const status = resolveStatus(ratio, goalRatio, statusProp);
  const color = STATUS_COLOR[status];

  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamp = Math.min(ratio, 1);
  const dashOffset = circumference * (1 - clamp);
  const overRatio = Math.max(0, ratio - 1);

  const cx = size / 2;
  const cy = size / 2;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  const drawnOffset = mounted ? dashOffset : circumference;

  // White notch cutting through the ring stroke
  function notchCoords(tickRatio: number) {
    const angle = 2 * Math.PI * tickRatio;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const halfLen = stroke / 2 + 4;
    return {
      x1: cx + (r - halfLen) * cos,
      y1: cy + (r - halfLen) * sin,
      x2: cx + (r + halfLen) * cos,
      y2: cy + (r + halfLen) * sin,
    };
  }

  // Colored dot centered on the ring stroke
  function dotPos(tickRatio: number) {
    const angle = 2 * Math.PI * tickRatio;
    return { cx: cx + r * Math.cos(angle), cy: cy + r * Math.sin(angle) };
  }

  const goalNotch = mbr ? notchCoords(goalRatio) : null;
  const mbrNotch  = mbr ? notchCoords(0) : null;
  const goalDot   = mbr ? dotPos(goalRatio) : null;
  const mbrDot    = mbr ? dotPos(0) : null;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--paper-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={cx} cy={cy} r={r}
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
            cx={cx} cy={cy} r={r}
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
        {/* White notches — always visible regardless of ring fill color */}
        {goalNotch && (
          <line {...goalNotch} stroke="var(--paper)" strokeWidth={3} strokeLinecap="round" />
        )}
        {mbrNotch && (
          <line {...mbrNotch} stroke="var(--paper)" strokeWidth={3} strokeLinecap="round" />
        )}
        {/* Colored dots on top of notches for color distinction */}
        {goalDot && <circle {...goalDot} r={4} fill={GOAL_COLOR} />}
        {mbrDot  && <circle {...mbrDot}  r={4} fill={MBR_COLOR} />}
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
        {mbr && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10, alignItems: 'center' }}>
            <LegendChip color={GOAL_COLOR} label="objectif alim." />
            <LegendChip color={MBR_COLOR}  label="métabolisme de base" />
          </div>
        )}
      </div>
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 11, color: 'var(--ink-3)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: color, flexShrink: 0,
        display: 'inline-block',
      }} />
      {label}
    </span>
  );
}
