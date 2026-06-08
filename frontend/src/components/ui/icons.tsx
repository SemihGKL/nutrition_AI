interface SvgProps {
  size?: number;
  color?: string;
}

export function Flame({ size = 14, color = 'var(--orange)' }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 3.5c0 3.5-3.5 5-3.5 8.5a3.5 3.5 0 0 0 7 0c0-1.4-.6-2.5-1.5-3.6c2 .8 3.5 2.7 3.5 5.6a6 6 0 1 1-12 0c0-4.6 6.5-6.4 6.5-10.5z"
        fill={color}
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Check({
  size = 14,
  color = 'currentColor',
  strokeWidth = 1.8,
}: SvgProps & { strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ChevronDir = 'left' | 'right' | 'up' | 'down';

export function Chevron({
  dir = 'right',
  size = 14,
  color = 'currentColor',
  sw = 1.6,
}: SvgProps & { dir?: ChevronDir; sw?: number }) {
  const paths: Record<ChevronDir, string> = {
    right: 'M9 5l7 7-7 7',
    left:  'M15 5l-7 7 7 7',
    down:  'M5 9l7 7 7-7',
    up:    'M5 15l7-7 7 7',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d={paths[dir]}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Plus({ size = 14, color = 'currentColor', sw = 1.6 }: SvgProps & { sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}

export function Minus({ size = 14, color = 'currentColor', sw = 1.6 }: SvgProps & { sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}

export function NavRing({ active }: { active: boolean }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" />
      {active && <circle cx="12" cy="12" r="3" fill={c} />}
    </svg>
  );
}

export function NavBars({ active }: { active: boolean }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <rect x="4"    y="11" width="3.5" height="9"  rx="1" stroke={c} strokeWidth="1.6" fill={active ? c : 'none'} />
      <rect x="10.25" y="6"  width="3.5" height="14" rx="1" stroke={c} strokeWidth="1.6" fill={active ? c : 'none'} />
      <rect x="16.5" y="14" width="3.5" height="6"  rx="1" stroke={c} strokeWidth="1.6" fill={active ? c : 'none'} />
    </svg>
  );
}

export function NavReport({ active }: { active: boolean }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <path d="M5 7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" stroke={c} strokeWidth="1.6" />
      <path d="M9 11l2 2 4-4" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavUser({ active }: { active: boolean }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="3.5" stroke={c} strokeWidth="1.6" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Pencil({ size = 14, color = 'currentColor', sw = 1.6 }: SvgProps & { sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15.5 4.5l4 4L7 21H3v-4L15.5 4.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavObjectifs({ active }: { active: boolean }) {
  const c = active ? 'var(--orange)' : 'var(--ink-3)';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke={c} strokeWidth="1.6" />
      <path d="M3 11h18" stroke={c} strokeWidth="1.4" />
      <path d="M8 4v4M16 4v4" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      {active && <rect x="7" y="14" width="3.5" height="3.5" rx="0.8" fill={c} />}
    </svg>
  );
}
