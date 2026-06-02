import type { ReactNode } from 'react';

type CTATone = 'orange' | 'green' | 'ink';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  tone?: CTATone;
  icon?: ReactNode;
  disabled?: boolean;
}

const TONE_BG: Record<CTATone, string> = {
  orange: 'var(--orange)',
  green:  'var(--green)',
  ink:    'var(--ink)',
};

export function PrimaryCTA({ children, onClick, tone = 'orange', icon, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        height: 56,
        borderRadius: 14,
        background: TONE_BG[tone],
        color: '#fff',
        border: 'none',
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 0.1,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: 'var(--shadow-md)',
        opacity: disabled ? 0.55 : 1,
        transition: 'transform 80ms ease, box-shadow 200ms',
      }}
    >
      <span>{children}</span>
      {icon}
    </button>
  );
}
