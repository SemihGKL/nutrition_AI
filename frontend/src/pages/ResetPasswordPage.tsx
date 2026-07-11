import { useState } from 'react';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';

interface Props {
  token: string;
  onDone: () => void;
}

export function ResetPasswordPage({ token, onDone }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('Ce lien est invalide ou expiré. Demande un nouveau lien.');
      } else {
        setError('Une erreur est survenue, réessaie.');
      }
    } finally {
      setIsLoading(false);
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
          Nouveau mot de passe
        </span>
        <span style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          {success
            ? 'Mot de passe mis à jour ! Tu peux te connecter.'
            : 'Choisis un nouveau mot de passe pour ton compte.'}
        </span>
      </div>

      {success ? (
        <button
          onClick={onDone}
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
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Se connecter
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PasswordField
            label="Nouveau mot de passe"
            id="reset-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hasError={!!error}
          />
          <PasswordField
            label="Confirmer le mot de passe"
            id="reset-confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            error={error ?? undefined}
          />

          <div style={{ marginTop: 4 }}>
            <button
              type="submit"
              disabled={isLoading}
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
                cursor: isLoading ? 'default' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {isLoading ? 'mise à jour…' : 'Réinitialiser'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
  hasError?: boolean;
}

function PasswordField({ label, id, value, onChange, autoComplete, error, hasError }: PasswordFieldProps) {
  const showError = !!(error || hasError);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 48,
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${showError ? 'var(--red)' : 'var(--hairline)'}`,
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
          e.currentTarget.style.borderColor = showError ? 'var(--red)' : 'var(--hairline)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {error && (
        <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>
      )}
    </div>
  );
}
