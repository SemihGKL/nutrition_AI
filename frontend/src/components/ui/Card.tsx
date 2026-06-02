import type { CSSProperties, ReactNode } from 'react';

type CardTone = 'paper' | 'orange' | 'green';

interface Props {
  children: ReactNode;
  padding?: number;
  tone?: CardTone;
  style?: CSSProperties;
}

const TONE_BG: Record<CardTone, string> = {
  paper:  'var(--paper-2)',
  orange: 'var(--orange-tint)',
  green:  'var(--green-tint)',
};

export function Card({ children, padding = 16, tone = 'paper', style }: Props) {
  return (
    <div style={{
      background: TONE_BG[tone],
      border: '1px solid var(--hairline-2)',
      borderRadius: 'var(--radius-md)',
      padding,
      ...style,
    }}>
      {children}
    </div>
  );
}
