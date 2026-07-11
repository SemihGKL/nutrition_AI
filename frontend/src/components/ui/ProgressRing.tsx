import { useState, useEffect, type ReactNode } from 'react';
import { formatNumber } from '../../utils/format';
import { InfoDot } from './InfoDot';

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

  const goalBar = mbr ? notchCoords(goalRatio) : null;
  const mbrBar  = mbr ? notchCoords(0) : null;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
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
        {/* Colored bars as markers — white backing ensures visibility against any arc color */}
        {goalBar && (
          <>
            <line {...goalBar} stroke="var(--paper)" strokeWidth={6} strokeLinecap="butt" />
            <line {...goalBar} stroke={GOAL_COLOR} strokeWidth={3} strokeLinecap="butt" />
          </>
        )}
        {mbrBar && (
          <>
            <line {...mbrBar} stroke="var(--paper)" strokeWidth={6} strokeLinecap="butt" />
            <line {...mbrBar} stroke={MBR_COLOR} strokeWidth={3} strokeLinecap="butt" />
          </>
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
        {mbr && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10, alignItems: 'center' }}>
            <LegendChip
              color={GOAL_COLOR}
              label="objectif choisi"
              info={
                <InfoDot title="Ton objectif calorique">
                  <p style={{ margin: '0 0 10px' }}>
                    C'est le nombre de calories à ne pas dépasser dans la journée. On le
                    fixe volontairement <strong>sous ton métabolisme de base</strong> pour
                    créer un déficit et t'aider à perdre du poids en douceur.
                  </p>
                  <p style={{ margin: 0 }}>
                    Tu peux le modifier quand tu veux depuis l'onglet <strong>Profil</strong>.
                  </p>
                </InfoDot>
              }
            />
            <LegendChip
              color={MBR_COLOR}
              label="tes dépenses naturelles"
              info={
                <InfoDot title="Tes dépenses naturelles">
                  <p style={{ margin: '0 0 10px' }}>
                    Même sans bouger, ton corps brûle des calories pour respirer, digérer
                    et fonctionner. C'est ton <strong>métabolisme de base</strong>.
                  </p>
                  <p style={{ margin: 0 }}>
                    Dès que tu manges moins que ça, ton corps brûle ses réserves de graisse — <strong>donc tu perds du poids</strong>.
                  </p>
                </InfoDot>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LegendChip({ color, label, info }: { color: string; label: string; info?: ReactNode }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: color, flexShrink: 0,
        display: 'inline-block',
      }} />
      {label}
      {info}
    </span>
  );
}
