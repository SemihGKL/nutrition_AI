interface Props {
  pct: number;
  min?: number;
  max?: number;
}

const ZONES = [
  { from: -30, to: -20, color: 'var(--red-soft)' },
  { from: -20, to: -10, color: 'var(--amber-soft)' },
  { from: -10, to:   0, color: 'var(--green-soft)' },
  { from:   0, to:  10, color: 'var(--red-soft)' },
];

export function MBRGauge({ pct, min = -30, max = 10 }: Props) {
  const span = max - min;
  const toPct = (v: number) => ((v - min) / span) * 100;
  const markerLeft = Math.min(100, Math.max(0, toPct(pct)));

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: 'var(--ink-3)',
        marginBottom: 6,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: 0.3,
      }}>
        <span>−30 %</span>
        <span>cible</span>
        <span>+10 %</span>
      </div>
      <div style={{
        position: 'relative',
        height: 10,
        borderRadius: 999,
        overflow: 'hidden',
        display: 'flex',
      }}>
        {ZONES.map((z, i) => (
          <div
            key={i}
            style={{
              flex: (z.to - z.from) / span,
              background: z.color,
            }}
          />
        ))}
        <div style={{
          position: 'absolute',
          top: -2,
          bottom: -2,
          left: `${toPct(0)}%`,
          width: 1,
          background: 'var(--ink-4)',
        }} />
        <div style={{
          position: 'absolute',
          top: -3,
          bottom: -3,
          left: `${markerLeft}%`,
          width: 4,
          marginLeft: -2,
          borderRadius: 2,
          background: 'var(--ink)',
          boxShadow: '0 0 0 3px var(--paper)',
        }} />
      </div>
    </div>
  );
}
