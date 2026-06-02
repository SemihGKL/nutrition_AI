import type { CSSProperties } from 'react';
import { Chevron } from '../ui/icons';
import { StreakChip } from '../ui/StreakChip';
import { frenchWeekday, frenchDay } from '../../utils/format';

interface Props {
  date: string;
  streakCount: number;
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const MINI_BTN: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  background: 'transparent',
  border: '1px solid var(--hairline)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

export function DayHeader({ date, streakCount, canGoForward, onPrev, onNext }: Props) {
  const weekday = frenchWeekday(date);
  const day = frenchDay(date);

  return (
    <div style={{
      padding: '10px 20px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>
          {weekday}
        </div>
        <div className="display" style={{ fontSize: 26, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>
          {day}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={MINI_BTN} onClick={onPrev} aria-label="jour précédent">
          <Chevron dir="left" size={14} color="var(--ink-2)" />
        </button>
        <StreakChip count={streakCount} size="md" />
        <button
          style={{ ...MINI_BTN, opacity: canGoForward ? 1 : 0.4 }}
          onClick={onNext}
          disabled={!canGoForward}
          aria-label="jour suivant"
        >
          <Chevron dir="right" size={14} color="var(--ink-2)" />
        </button>
      </div>
    </div>
  );
}
