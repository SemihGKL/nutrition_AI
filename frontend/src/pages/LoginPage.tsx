import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';

interface Props {
  onRegister: () => void;
}

export function LoginPage({ onRegister }: Props) {
  const { login, sessionExpired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { token, user } = await authApi.login({ email, password });
      login(token, user);
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Impossible de joindre le serveur — vérifie qu'il est démarré");
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError('Une erreur est survenue, réessaie');
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
      overflowY: 'auto',
    }}>
      {sessionExpired && (
        <div style={{
          width: '100%',
          marginBottom: 24,
          padding: '12px 16px',
          background: 'var(--orange-tint)',
          border: '1px solid var(--orange-soft)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          color: 'var(--ink-2)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Ta session a expiré — reconnecte-toi pour continuer.
        </div>
      )}

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
          fontFamily: 'var(--font-script)',
          fontStyle: 'italic',
          fontSize: 17,
          color: 'var(--ink-2)',
        }}>
          compte les bonnes choses.
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          name="email"
          id="login-email"
          autoComplete="email"
        />
        <Field
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          error={error ?? undefined}
          name="password"
          id="login-password"
          autoComplete="current-password"
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
            {isLoading ? 'connexion…' : 'Se connecter'}
          </button>
        </div>
      </form>

      <button
        onClick={onRegister}
        style={{
          marginTop: 20,
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
        pas de compte ? créer
      </button>
    </div>
  );
}

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  name?: string;
  id?: string;
  autoComplete?: string;
}

function Field({ label, type = 'text', value, onChange, error, name, id, autoComplete }: FieldProps) {
  const isEmail = type === 'email';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={id}
        autoComplete={autoComplete}
        inputMode={isEmail ? 'email' : undefined}
        autoCapitalize={isEmail ? 'none' : undefined}
        autoCorrect={isEmail ? 'off' : undefined}
        spellCheck={isEmail ? false : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 48,
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--hairline)'}`,
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
          e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--hairline)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {error && (
        <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>
      )}
    </div>
  );
}
