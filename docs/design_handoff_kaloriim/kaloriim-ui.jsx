/* global React */
// kaloriim — shared UI components
// All components consume CSS custom props (var(--…)), so a parent
// data-theme="dark" attribute reskins the entire subtree.

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Wordmark — "kaloriim" in display serif italic
// ─────────────────────────────────────────────────────────────
function KWordmark({ size = 28, color }) {
  return (
    <span style={{
      fontFamily: 'var(--font-script)',
      fontStyle: 'italic',
      fontSize: size,
      letterSpacing: '-0.01em',
      color: color || 'var(--orange)',
      lineHeight: 1,
    }}>kaloriim</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Flame — small monoline SVG (Phosphor-flavored)
// ─────────────────────────────────────────────────────────────
function Flame({ size = 14, color = 'var(--orange)', filled = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 3.5c0 3.5 -3.5 5 -3.5 8.5a3.5 3.5 0 0 0 7 0c0 -1.4 -.6 -2.5 -1.5 -3.6 c2 .8 3.5 2.7 3.5 5.6 a6 6 0 1 1 -12 0 c0 -4.6 6.5 -6.4 6.5 -10.5z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check({ size = 14, color = 'currentColor', strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Chevron({ dir = 'right', size = 14, color = 'currentColor', sw = 1.6 }) {
  const path = {
    right: 'M9 5l7 7-7 7',
    left:  'M15 5l-7 7 7 7',
    down:  'M5 9l7 7 7-7',
    up:    'M5 15l7-7 7 7',
  }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={path} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Plus({ size = 14, color = 'currentColor', sw = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  );
}
function Minus({ size = 14, color = 'currentColor', sw = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// StreakChip — pill with flame + count
// ─────────────────────────────────────────────────────────────
function StreakChip({ count = 42, size = 'md', tone = 'soft', onClick }) {
  const sizes = {
    sm: { h: 26, px: 9, fs: 13, gap: 5, flame: 12 },
    md: { h: 32, px: 12, fs: 15, gap: 6, flame: 14 },
    lg: { h: 40, px: 16, fs: 18, gap: 7, flame: 18 },
  }[size];
  const bg = tone === 'soft' ? 'var(--orange-soft)' : 'transparent';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: sizes.gap,
        height: sizes.h, padding: `0 ${sizes.px}px`,
        background: bg,
        border: tone === 'outline' ? '1px solid var(--hairline)' : 'none',
        borderRadius: 999,
        color: 'var(--orange)',
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: sizes.fs,
        cursor: onClick ? 'pointer' : 'default',
        fontVariantNumeric: 'tabular-nums',
      }}>
      <Flame size={sizes.flame} color="var(--orange)" filled />
      <span>{count}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PipStrip — Duolingo-style 14-day calendar dots
// days: array of 14 entries, each: 'hit' | 'miss' | 'today' | 'future'
// ─────────────────────────────────────────────────────────────
function PipStrip({ days, size = 18, gap = 8, twoRow = false }) {
  const rows = twoRow ? [days.slice(0, 7), days.slice(7)] : [days];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap, alignItems: 'center' }}>
          {row.map((d, i) => <Pip key={i} kind={d} size={size} />)}
        </div>
      ))}
    </div>
  );
}

function Pip({ kind = 'hit', size = 18 }) {
  if (kind === 'today') {
    return (
      <div style={{
        width: size, height: size, borderRadius: 999,
        background: 'var(--orange)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 3px var(--orange-soft)',
        position: 'relative',
      }}>
        <Flame size={size * 0.62} color="#fff" />
      </div>
    );
  }
  const fill =
    kind === 'hit'    ? 'var(--orange)' :
    kind === 'miss'   ? 'var(--red-soft)' :
    kind === 'future' ? 'transparent' : 'var(--hairline)';
  const border = kind === 'future' ? '1.5px dashed var(--hairline)' : 'none';
  return <div style={{ width: size, height: size, borderRadius: 999, background: fill, border }} />;
}

// ─────────────────────────────────────────────────────────────
// ProgressRing — central kcal hero
// ─────────────────────────────────────────────────────────────
function ProgressRing({
  value = 1650, target = 1800, label = 'kcal',
  size = 240, stroke = 14,
  status, // 'good' | 'warn' | 'over' — auto if absent
  animateOnMount = true,
}) {
  const ratio = Math.max(0, value / target);
  const auto = ratio <= 1 ? 'good' : ratio <= 1.15 ? 'warn' : 'over';
  const s = status || auto;
  const color =
    s === 'good' ? 'var(--green)' :
    s === 'warn' ? 'var(--amber)' : 'var(--red)';

  // arc visualization caps at 100% (rest shown as track), but if over,
  // we draw a second arc layer in red
  const clamp = Math.min(ratio, 1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - clamp);
  const overRatio = Math.max(0, ratio - 1);

  // animate dashOffset on mount
  const [mounted, setMounted] = useState(!animateOnMount);
  useEffect(() => {
    if (animateOnMount) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, []);

  const drawnOffset = mounted ? dashOffset : c;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="var(--paper-3)" strokeWidth={stroke} />
        {/* arc */}
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={drawnOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)' }}
        />
        {/* over arc (red wraparound) */}
        {overRatio > 0 && (
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke="var(--red)" strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={mounted ? c * (1 - Math.min(overRatio, 1)) : c}
            strokeLinecap="round"
            opacity={0.9}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1) .15s' }}
          />
        )}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="display tabular" style={{
          fontSize: size * 0.235, lineHeight: 1, color: 'var(--ink)',
          fontWeight: 500,
        }}>{value.toLocaleString('fr-FR').replace(',', ' ')}</div>
        <div className="tabular" style={{
          fontSize: 14, color: 'var(--ink-3)', marginTop: 6, letterSpacing: 0.2,
        }}>/ {target.toLocaleString('fr-FR').replace(',', ' ')} {label}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MBRGauge — horizontal 4-zone gauge with marker at current deficit %
// zones default: <-25 red · -25..-10 ambr · -10..0 green · >0 red
// pct: signed deficit % vs MBR (e.g. -4 means 4% below MBR)
// ─────────────────────────────────────────────────────────────
function MBRGauge({ pct = -4, min = -30, max = 10 }) {
  const zoneStops = [
    { from: min,  to: -20, color: 'var(--red-soft)' },
    { from: -20,  to: -10, color: 'var(--amber-soft)' },
    { from: -10,  to: 0,   color: 'var(--green-soft)' },
    { from: 0,    to: max, color: 'var(--red-soft)' },
  ];
  const span = max - min;
  const t = (v) => ((v - min) / span) * 100;
  const markerLeft = Math.min(100, Math.max(0, t(pct)));
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--ink-3)', marginBottom: 6,
        fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3,
      }}>
        <span>−30%</span><span>cible</span><span>+10%</span>
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
        {zoneStops.map((z, i) => (
          <div key={i} style={{ flex: (z.to - z.from) / span, background: z.color }} />
        ))}
        {/* zero tick */}
        <div style={{
          position: 'absolute', top: -2, bottom: -2, left: `${t(0)}%`,
          width: 1, background: 'var(--ink-4)',
        }} />
        {/* marker */}
        <div style={{
          position: 'absolute', top: -3, bottom: -3, left: `${markerLeft}%`,
          width: 4, marginLeft: -2, borderRadius: 2,
          background: 'var(--ink)', boxShadow: '0 0 0 3px var(--paper)',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stepper input — label + number with +/- 
// ─────────────────────────────────────────────────────────────
function Stepper({ label, value, onChange, suffix = 'kcal', step = 50, min = 0, hint }) {
  const set = (v) => onChange(Math.max(min, v));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <label style={{
          fontSize: 13, color: 'var(--ink-2)', fontWeight: 500,
          letterSpacing: 0.1,
        }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</span>}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--paper-2)',
        border: '1px solid var(--hairline-2)',
        borderRadius: 'var(--radius-sm)',
        height: 48, padding: '0 4px',
      }}>
        <button
          onClick={() => set(value - step)}
          style={stepperBtn}
          aria-label="diminuer">
          <Minus size={16} color="var(--ink-2)" sw={1.8} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
          <span className="display tabular" style={{
            fontSize: 22, fontWeight: 500, color: 'var(--ink)',
          }}>{value.toLocaleString('fr-FR').replace(',', ' ')}</span>
          <span className="tabular" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{suffix}</span>
        </div>
        <button
          onClick={() => set(value + step)}
          style={stepperBtn}
          aria-label="augmenter">
          <Plus size={16} color="var(--ink-2)" sw={1.8} />
        </button>
      </div>
    </div>
  );
}
const stepperBtn = {
  width: 40, height: 40, borderRadius: 8,
  background: 'transparent', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink-2)',
};

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
function Card({ children, style, padding = 16, tone = 'paper' }) {
  const bg = tone === 'paper' ? 'var(--paper-2)' : tone === 'orange' ? 'var(--orange-tint)' : tone === 'green' ? 'var(--green-tint)' : 'var(--paper-2)';
  return (
    <div style={{
      background: bg,
      border: '1px solid var(--hairline-2)',
      borderRadius: 'var(--radius-md)',
      padding,
      ...style,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// BottomNav — 4 tab bar matching Jour · Semaine · Bilan · Profil
// ─────────────────────────────────────────────────────────────
function BottomNav({ active = 'jour', onChange = () => {} }) {
  const items = [
    { id: 'jour',    label: 'Jour',    icon: NavRing },
    { id: 'semaine', label: 'Semaine', icon: NavBars },
    { id: 'bilan',   label: 'Bilan',   icon: NavReport },
    { id: 'profil',  label: 'Profil',  icon: NavUser },
  ];
  return (
    <div style={{
      display: 'flex',
      background: 'var(--paper)',
      borderTop: '1px solid var(--hairline-2)',
      paddingTop: 8, paddingBottom: 8,
    }}>
      {items.map(it => {
        const isActive = active === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => onChange(it.id)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 4px', cursor: 'pointer',
              color: isActive ? 'var(--orange)' : 'var(--ink-3)',
            }}>
            <Icon active={isActive} />
            <span style={{
              fontSize: 11, fontWeight: isActive ? 600 : 500, letterSpacing: 0.2,
            }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function NavRing({ active }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" />
      {active && <circle cx="12" cy="12" r="3" fill={c} />}
    </svg>
  );
}
function NavBars({ active }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="3.5" height="9" rx="1" stroke={c} strokeWidth="1.6" fill={active?c:'none'}/>
      <rect x="10.25" y="6" width="3.5" height="14" rx="1" stroke={c} strokeWidth="1.6" fill={active?c:'none'}/>
      <rect x="16.5" y="14" width="3.5" height="6" rx="1" stroke={c} strokeWidth="1.6" fill={active?c:'none'}/>
    </svg>
  );
}
function NavReport({ active }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" stroke={c} strokeWidth="1.6"/>
      <path d="M9 11l2 2 4-4" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function NavUser({ active }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="3.5" stroke={c} strokeWidth="1.6"/>
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Date header — < date >
// ─────────────────────────────────────────────────────────────
function DateHeader({ weekday, date, canForward = false, onPrev, onNext }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button onClick={onPrev} style={iconBtn} aria-label="jour précédent">
        <Chevron dir="left" size={16} color="var(--ink-2)" />
      </button>
      <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'lowercase', letterSpacing: 0.5 }}>{weekday}</div>
        <div className="display" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)', marginTop: 2 }}>{date}</div>
      </div>
      <button onClick={onNext} disabled={!canForward} style={{
        ...iconBtn, opacity: canForward ? 1 : 0.35, cursor: canForward ? 'pointer' : 'default',
      }} aria-label="jour suivant">
        <Chevron dir="right" size={16} color="var(--ink-2)" />
      </button>
    </div>
  );
}
const iconBtn = {
  width: 36, height: 36, borderRadius: 999,
  background: 'transparent', border: '1px solid var(--hairline)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--ink-2)',
};

// ─────────────────────────────────────────────────────────────
// Primary CTA
// ─────────────────────────────────────────────────────────────
function PrimaryCTA({ children, onClick, icon, disabled, tone = 'orange' }) {
  const bg =
    tone === 'orange' ? 'var(--orange)' :
    tone === 'green'  ? 'var(--green)' :
    'var(--ink)';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 56, borderRadius: 14,
      background: bg, color: '#fff', border: 'none',
      fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
      letterSpacing: 0.1, cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: 'var(--shadow-md)',
      opacity: disabled ? 0.55 : 1,
      transition: 'transform 80ms ease, box-shadow 200ms',
    }}>
      <span>{children}</span>
      {icon}
    </button>
  );
}

Object.assign(window, {
  KWordmark, Flame, Check, Chevron, Plus, Minus,
  StreakChip, PipStrip, Pip,
  ProgressRing, MBRGauge,
  Stepper, Card, BottomNav, DateHeader, PrimaryCTA,
});
