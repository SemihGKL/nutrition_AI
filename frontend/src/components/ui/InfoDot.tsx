import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  /** Titre affiché en tête de la pop-up. */
  title: string;
  /** Contenu explicatif de la pop-up. */
  children: ReactNode;
  /** Libellé accessible du bouton « ? ». */
  ariaLabel?: string;
}

/**
 * Petite pastille « ? » qui ouvre une pop-up (bottom-sheet) explicative.
 * Réutilise le style d'overlay de l'app (backdrop flouté + feuille remontante).
 */
export function InfoDot({ title, children, ariaLabel = 'en savoir plus' }: Props) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = setTimeout(() => setShown(true), 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        aria-label={ariaLabel}
        style={{
          width: 15,
          height: 15,
          borderRadius: 999,
          background: open ? 'var(--orange-soft)' : 'var(--paper-3)',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: open ? 'var(--orange)' : 'var(--ink-3)',
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: 'var(--font-body)',
        }}
      >
        ?
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(20,14,6,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            opacity: shown ? 1 : 0,
            transition: 'opacity 220ms ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--paper)',
              borderRadius: '24px 24px 0 0',
              boxShadow: 'var(--shadow-lg)',
              padding: '22px 24px 32px',
              transform: shown ? 'translateY(0)' : 'translateY(40px)',
              transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 10,
            }}>
              <span className="display" style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>
                {title}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="fermer"
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: 'var(--paper-3)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-2)',
                  fontSize: 17,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-body)',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
