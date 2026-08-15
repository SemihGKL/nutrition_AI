import { frenchWeekday, frenchDay } from '../../utils/format';

interface Props {
  date: string;
  onClick: () => void;
}

export function DateVignette({ date, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Changer de jour"
      style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--hairline-2)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: '6px 18px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1.1,
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>
        {frenchWeekday(date)}
      </div>
      <div className="display" style={{ fontSize: 26, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>
        {frenchDay(date)}
      </div>
    </button>
  );
}
