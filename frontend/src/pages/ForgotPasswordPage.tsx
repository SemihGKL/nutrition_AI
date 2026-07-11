import { useState } from 'react';
import { authApi } from '../api/auth';

interface Props {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
    } finally {
      // Toujours afficher le message de confirmation, même si l'email est inconnu.
      setIsLoading(false);
      setSent(true);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      height: '100dvh',
      background: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 28px',
    }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-script)',
          fontStyle: 'italic',
          fontSize: 44,
          color: 'var(--orange)',
          lineHeight: 1,
          letterSpacing: '-0.01em',
          display: 'block',
          marginBottom: 8,
        }}>
          kaloriim
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--ink)',
          display: 'block',
          marginBottom: 8,
        }}>
          Mot de passe oublié
        </span>
        <span style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          {sent
            ? "Si ce compte existe, un email vient d'être envoyé."
            : "Entre ton adresse email pour recevoir un lien de réinitialisation."}
        </span>
      </div>

      {!sent && (
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="forgot-email" style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                height: 48,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--hairline)',
                background: 'var(--paper-2)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                padding: '0 14px',
                outline: 'none',
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
          </div>

          <div style={{ marginTop: 4 }}>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              style={{
                width: '100%',
                height: 56,
                borderRadius: 14,
                background: 'var(--orange)',
                color: '#fff',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 0.1,
                cursor: (isLoading || !email.trim()) ? 'default' : 'pointer',
                opacity: (isLoading || !email.trim()) ? 0.6 : 1,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {isLoading ? 'envoi…' : 'Envoyer le lien'}
            </button>
          </div>
        </form>
      )}

      <button
        onClick={onBack}
        style={{
          marginTop: 24,
          background: 'none',
          border: 'none',
          color: 'var(--ink-2)',
          fontSize: 14,
          cursor: 'pointer',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          fontFamily: 'var(--font-body)',
        }}
      >
        retour à la connexion
      </button>
    </div>
  );
}
