import { useState } from 'react';
import { Chevron } from '../ui/icons';
import { frenchMonthLabel, monthGrid, shiftMonth } from '../../utils/calendar';

const WEEKDAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const NAV_BTN: React.CSSProperties = {
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

const DAY_BTN: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
};

interface Props {
  selectedDate: string;
  todayDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export function CalendarModal({ selectedDate, todayDate, onSelect, onClose }: Props) {
  const [viewedMonth, setViewedMonth] = useState(selectedDate);

  const weeks = monthGrid(viewedMonth);
  const month = viewedMonth.slice(0, 7);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--hairline-2)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: 20,
          width: 320,
          maxWidth: '90vw',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={NAV_BTN} onClick={onClose} aria-label="fermer le calendrier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 5l14 14M19 5L5 19" stroke="var(--ink-2)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button style={NAV_BTN} aria-label="mois précédent" onClick={() => setViewedMonth(m => shiftMonth(m, -1))}>
            <Chevron dir="left" size={14} color="var(--ink-2)" />
          </button>
          <div className="display" style={{ fontSize: 17, fontWeight: 500 }}>
            {frenchMonthLabel(viewedMonth)}
          </div>
          <button
            style={{ ...NAV_BTN, opacity: month === todayDate.slice(0, 7) ? 0.4 : 1 }}
            aria-label="mois suivant"
            disabled={month === todayDate.slice(0, 7)}
            onClick={() => setViewedMonth(m => shiftMonth(m, 1))}
          >
            <Chevron dir="right" size={14} color="var(--ink-2)" />
          </button>
        </div>

        <div
          data-testid="calendar-weekday-header"
          style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
        >
          {WEEKDAY_LETTERS.map((letter, i) => (
            <span key={i} style={{ width: 36, textAlign: 'center', fontSize: 11, color: 'var(--ink-3)' }}>
              {letter}
            </span>
          ))}
        </div>

        <div>
          {weeks.map((week, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              {week.map(date => {
                const inMonth = date.slice(0, 7) === month;
                const isFuture = date > todayDate;
                const isSelected = date === selectedDate;
                return (
                  <button
                    key={date}
                    aria-label={date}
                    aria-current={isSelected ? 'date' : undefined}
                    disabled={!inMonth || isFuture}
                    onClick={() => {
                      onSelect(date);
                      onClose();
                    }}
                    style={{
                      ...DAY_BTN,
                      color: !inMonth || isFuture ? 'var(--ink-3)' : 'var(--ink)',
                      opacity: !inMonth ? 0.35 : isFuture ? 0.4 : 1,
                      background: isSelected ? 'var(--orange)' : 'transparent',
                      fontWeight: isSelected ? 700 : 400,
                    }}
                  >
                    {Number(date.slice(8, 10))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
