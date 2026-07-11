import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';

interface Props {
  onRegister: () => void;
  onForgotPassword: () => void;
}

const ACCENT = '#D9622E';
const ACCENT_SHADOW = 'rgba(217,98,46,0.45)';
const ACCENT_SOFT = 'rgba(217,98,46,0.16)';
const SAGE_SOFT = 'rgba(122,139,111,0.35)';
const FIELD_BG = '#FBF6EC';
const FIELD_BORDER = '#E7DCC9';
const LABEL_COLOR = '#4A3F32';
const MUTED = '#6B5D4C';
const ICON_COLOR = '#B7A995';

export function LoginPage({ onRegister, onForgotPassword }: Props) {
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
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: 430,
        maxWidth: '100%',
        background: '#FDF6EC',
        borderRadius: 36,
        boxShadow: `0 30px 80px -20px rgba(60,40,20,0.35), 0 2px 8px rgba(60,40,20,0.08)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Hero */}
        <div style={{
          position: 'relative',
          padding: '56px 32px 40px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #FBF0E1 0%, #FDF6EC 100%)',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -50,
            width: 180, height: 180, borderRadius: '50%',
            background: ACCENT_SOFT, opacity: 0.5,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -70, left: -40,
            width: 150, height: 150, borderRadius: '50%',
            background: SAGE_SOFT, opacity: 0.45,
            pointerEvents: 'none',
          }} />

          <div style={{
            width: 88, height: 88,
            margin: '0 auto 20px',
            borderRadius: 22,
            overflow: 'hidden',
            boxShadow: `0 12px 24px -8px ${ACCENT_SHADOW}`,
            position: 'relative',
          }}>
            <img
              src="/icons/icon-192x192.png"
              alt="Kaloriim"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>

          <div style={{
            fontFamily: "'Playfair Display', 'Instrument Serif', serif",
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 32,
            color: ACCENT,
            lineHeight: 1,
            letterSpacing: '-0.5px',
            marginBottom: 8,
          }}>
            kaloriim
          </div>
          <div style={{
            fontFamily: "'Playfair Display', 'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: 16,
            color: MUTED,
            marginTop: 2,
          }}>
            compte les bonnes choses.
          </div>
        </div>

        {/* Form section */}
        <div style={{
          flex: 1,
          padding: '36px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}>
          {sessionExpired && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(217,98,46,0.08)',
              border: `1px solid rgba(217,98,46,0.25)`,
              borderRadius: 12,
              fontSize: 13,
              color: MUTED,
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              Ta session a expiré — reconnecte-toi pour continuer.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
          >
            <IconField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              name="email"
              id="login-email"
              autoComplete="email"
              icon={<MailIcon />}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <IconField
                label="Mot de passe"
                type="password"
                value={password}
                onChange={setPassword}
                name="password"
                id="login-password"
                autoComplete="current-password"
                icon={<LockIcon />}
                error={error ?? undefined}
              />
              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8A7A64'; }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    color: '#8A7A64',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'var(--font-body)',
                    transition: 'color 150ms',
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 18px 32px -8px ${ACCENT_SHADOW}`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 14px 28px -10px ${ACCENT_SHADOW}`;
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              style={{
                width: '100%',
                padding: '17px 0',
                border: 'none',
                borderRadius: 14,
                background: ACCENT,
                color: '#FFF8F0',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '0.2px',
                cursor: isLoading ? 'default' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                boxShadow: `0 14px 28px -10px ${ACCENT_SHADOW}`,
                transition: 'transform 120ms, box-shadow 120ms',
                fontFamily: 'var(--font-body)',
              }}
            >
              {isLoading ? 'connexion…' : 'Se connecter'}
            </button>
          </form>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            margin: '2px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: FIELD_BORDER }} />
            <span style={{ fontSize: 12, color: ICON_COLOR }}>ou</span>
            <div style={{ flex: 1, height: 1, background: FIELD_BORDER }} />
          </div>

          <div style={{ textAlign: 'center', fontSize: 14, color: MUTED }}>
            Pas encore de compte ?{' '}
            <button
              type="button"
              onClick={onRegister}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
              style={{
                background: 'none',
                border: 'none',
                color: ACCENT,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'var(--font-body)',
                textUnderlineOffset: 3,
              }}
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IconFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  name?: string;
  id?: string;
  autoComplete?: string;
  icon: React.ReactNode;
  error?: string;
}

function IconField({ label, type = 'text', value, onChange, name, id, autoComplete, icon, error }: IconFieldProps) {
  const isEmail = type === 'email';
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label htmlFor={id} style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: LABEL_COLOR,
        marginBottom: 8,
        letterSpacing: '0.2px',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {icon}
        </span>
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
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px 16px 15px 44px',
            borderRadius: 14,
            border: `1.5px solid ${error ? 'var(--red)' : FIELD_BORDER}`,
            background: FIELD_BG,
            fontSize: 15,
            color: '#3A2E22',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            transition: 'border-color 150ms, box-shadow 150ms',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = ACCENT;
            e.currentTarget.style.boxShadow = `0 0 0 4px ${ACCENT_SOFT}`;
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? 'var(--red)' : FIELD_BORDER;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>
      {error && (
        <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>{error}</span>
      )}
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="1.8">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}
