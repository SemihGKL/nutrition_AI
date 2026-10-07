import type { CSSProperties } from 'react';
import { Chevron } from '../ui/icons';
import { StreakChip } from '../ui/StreakChip';
import { DateVignette } from './DateVignette';

interface Props {
  date: string;
  streakCount: number;
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenCalendar: () => void;
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

export function DayHeader({ date, streakCount, canGoForward, onPrev, onNext, onOpenCalendar }: Props) {
  return (
    <div style={{
      padding: '10px 20px 0',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button style={MINI_BTN} onClick={onPrev} aria-label="jour précédent">
          <Chevron dir="left" size={14} color="var(--ink-2)" />
        </button>
      </div>

      <DateVignette date={date} onClick={onOpenCalendar} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
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
