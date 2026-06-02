export function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 24px 6px',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)',
    }}>
      <span className="tabular">{time}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: 0.85 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <rect x="0"    y="7"   width="3" height="4"    rx="0.5" fill="currentColor" />
          <rect x="4.5"  y="5"   width="3" height="6"    rx="0.5" fill="currentColor" />
          <rect x="9"    y="2.5" width="3" height="8.5"  rx="0.5" fill="currentColor" />
          <rect x="13.5" y="0"   width="3" height="11"   rx="0.5" fill="currentColor" />
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
          <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" opacity="0.5" />
          <rect x="2"   y="2"   width="14" height="7"  rx="1.5" fill="currentColor" />
          <rect x="22"  y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
