import { Flame } from './icons';

type ChipSize = 'sm' | 'md' | 'lg';
type ChipTone = 'soft' | 'outline';

const SIZES = {
  sm: { h: 26, px: 9,  fs: 13, gap: 5, flame: 12 },
  md: { h: 32, px: 12, fs: 15, gap: 6, flame: 14 },
  lg: { h: 40, px: 16, fs: 18, gap: 7, flame: 18 },
};

interface Props {
  count: number;
  size?: ChipSize;
  tone?: ChipTone;
  onClick?: () => void;
}

export function StreakChip({ count, size = 'md', tone = 'soft', onClick }: Props) {
  const s = SIZES[size];
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.px}px`,
        background: tone === 'soft' ? 'var(--orange-soft)' : 'transparent',
        border: tone === 'outline' ? '1px solid var(--hairline)' : 'none',
        borderRadius: 999,
        color: 'var(--orange)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: s.fs,
        cursor: onClick ? 'pointer' : 'default',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <Flame size={s.flame} color="var(--orange)" />
      <span>{count}</span>
    </button>
  );
}
