import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Toast « nouvelle version disponible ».
 *
 * En mode `registerType: 'prompt'`, le nouveau service worker est téléchargé
 * mais reste en attente. `needRefresh` passe à `true` quand une version à jour
 * est prête ; `updateServiceWorker(true)` l'active puis recharge la page.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
        maxWidth: 456,
        margin: '0 auto',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 12px 12px 16px',
        background: 'var(--paper)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--ink)',
          letterSpacing: 0.1,
        }}
      >
        Nouvelle version disponible
      </span>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '8px 10px',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--ink-3)',
          cursor: 'pointer',
        }}
      >
        Plus tard
      </button>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: 'var(--orange)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.1,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        Recharger
      </button>
    </div>
  );
}
