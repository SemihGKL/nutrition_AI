import { useState } from 'react';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { Chevron, Check } from '../components/ui/icons';
import { supportApi, type SupportCategory } from '../api/support';

interface Props {
  onBack: () => void;
  onTabChange: (tab: NavTab) => void;
}

const CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: 'PROBLEM',     label: 'Signaler un problème' },
  { value: 'IMPROVEMENT', label: 'Proposer une amélioration' },
];

// Miroir de la contrainte serveur @Size(max = 2000) sur SupportRequest.message.
const MESSAGE_MAX_LENGTH = 2000;

export function SupportPage({ onBack, onTabChange }: Props) {
  const [category, setCategory] = useState<SupportCategory>('PROBLEM');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canSend = message.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await supportApi.send({ category, message: message.trim() });
      setSent(true);
    } catch {
      setError("Échec de l'envoi — réessaie dans un instant.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderBottom: '1px solid var(--hairline-2)',
      }}>
        <button
          onClick={onBack}
          aria-label="Retour"
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: 'transparent', border: '1px solid var(--hairline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Chevron dir="left" size={16} color="var(--ink-2)" />
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
          Contactez le support
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '20px' }}>
        {sent ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', paddingTop: 48,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999,
              background: 'var(--orange-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Check size={26} color="var(--orange)" strokeWidth={2.4} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Message envoyé
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 300 }}>
              Merci ! On a bien reçu ton message et on te répondra par email si besoin.
            </div>
            <button
              onClick={onBack}
              style={{
                marginTop: 28, height: 48, padding: '0 24px',
                borderRadius: 'var(--radius)', border: 'none',
                background: 'var(--orange)', color: '#fff',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Retour au profil
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 0 20px' }}>
              Un souci, une idée pour améliorer l'app&nbsp;? Décris-le ci-dessous, on lit tout.
            </p>

            <Section label="type de message">
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CATEGORIES.map(c => {
                    const active = c.value === category;
                    return (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        style={{
                          height: 46, borderRadius: 'var(--radius-sm)',
                          border: active ? '1.5px solid var(--orange)' : '1px solid var(--hairline)',
                          background: active ? 'var(--orange-tint)' : 'var(--paper)',
                          color: active ? 'var(--orange)' : 'var(--ink-2)',
                          fontSize: 14, fontWeight: active ? 600 : 500,
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                          textAlign: 'left', padding: '0 14px',
                          transition: 'all 120ms',
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            <Section label="ton message">
              <div style={{ padding: '12px 16px' }}>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={
                    category === 'PROBLEM'
                      ? 'Décris le problème : ce que tu faisais, ce qui devait se passer, ce qui s’est passé…'
                      : 'Décris ton idée : quelle fonctionnalité aimerais-tu voir, et pourquoi ?'
                  }
                  rows={7}
                  maxLength={MESSAGE_MAX_LENGTH}
                  style={{
                    width: '100%', resize: 'vertical', minHeight: 140,
                    border: '1px solid var(--hairline)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--paper)', color: 'var(--ink)',
                    fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5,
                    padding: '12px 14px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 120ms linear, box-shadow 120ms linear',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--orange)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--orange-soft)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--hairline)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                  {message.length}/{MESSAGE_MAX_LENGTH}
                </div>
              </div>
            </Section>

            {error && (
              <div style={{
                padding: '10px 14px', marginBottom: 16,
                background: 'var(--red-soft)', borderRadius: 'var(--radius-sm)',
                color: 'var(--red)', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: '100%', height: 52, borderRadius: 'var(--radius)',
                background: 'var(--orange)', border: 'none',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: canSend ? 'pointer' : 'default',
                opacity: canSend ? 1 : 0.6,
                fontFamily: 'var(--font-body)',
              }}
            >
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </>
        )}
      </div>

      <BottomNav active="profil" onChange={onTabChange} />
      <HomeIndicator />
    </PageShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--ink-3)',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--hairline-2)', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: 480, height: '100dvh',
      background: 'var(--paper)', color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6, background: 'var(--paper)' }}>
      <div style={{ width: 110, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.22)' }} />
    </div>
  );
}
