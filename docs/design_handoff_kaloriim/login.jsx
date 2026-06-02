/* global React, KWordmark, StreakChip, PrimaryCTA, Flame, Check, Chevron */
const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Field — labelled input with focus ring + inline error slot
// ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, error, hint, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, letterSpacing: 0.1 }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 50, padding: '0 14px',
        background: 'var(--paper-2)',
        border: `1px solid ${error ? 'var(--red)' : focused ? 'var(--ink)' : 'var(--hairline-2)'}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: focused ? '0 0 0 3px var(--orange-soft)' : 'none',
        transition: 'border-color 120ms, box-shadow 120ms',
      }}>
        <input
          autoFocus={autoFocus}
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--ink)',
            letterSpacing: 0.1,
          }}/>
      </div>
      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10 }}>↑</span>{error}
        </div>
      )}
      {hint && !error && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LoginMobile
// ─────────────────────────────────────────────────────────────
function LoginMobile({ dark = false, mode = 'returning' }) {
  // mode: 'returning' (shows streak hook) | 'fresh' | 'error'
  const [email, setEmail] = useState(mode === 'returning' ? 'jeanmi@mail.fr' : '');
  const [pwd, setPwd] = useState(mode === 'returning' ? '••••••••' : (mode === 'error' ? '••••' : ''));
  const error = mode === 'error' ? 'Email ou mot de passe invalide' : null;

  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label={`Login mobile · ${mode}${dark ? ' · dark' : ''}`}
      style={{
        width: '100%', height: '100%',
        background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '14px 24px 6px', fontSize: 14, fontWeight: 600,
      }}>
        <span className="tabular">9:41</span>
        <span style={{ opacity: 0.6, fontSize: 12 }}>•••</span>
      </div>

      <div style={{ flex: 1, padding: '40px 28px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <KWordmark size={44}/>
          <div className="script" style={{ fontSize: 17, color: 'var(--ink-2)', marginTop: 6 }}>
            compte les bonnes choses.
          </div>
        </div>

        {/* Streak hook for returning user */}
        {mode === 'returning' && (
          <div style={{
            margin: '24px auto 32px',
            display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 999,
            background: 'var(--orange-tint)',
            border: '1px solid var(--orange-soft)',
          }}>
            <Flame size={16} color="var(--orange)"/>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              ta série <span className="tabular" style={{ fontWeight: 700, color: 'var(--orange)' }}>42</span> t'attend
            </span>
          </div>
        )}
        {mode !== 'returning' && <div style={{ height: 36 }}/>}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="tu@mail.fr"/>
          <Field label="Mot de passe" value={pwd} onChange={setPwd} type="password" error={error}/>
        </div>

        <div style={{ flex: 1 }}/>

        <PrimaryCTA tone="orange">Se connecter</PrimaryCTA>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--ink-2)' }}>
          pas de compte ? <span style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>créer</span>
        </div>
      </div>

      <div style={{
        height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 6,
      }}>
        <div style={{ width: 110, height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)' }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LoginDesktop — split hero
// ─────────────────────────────────────────────────────────────
function LoginDesktop({ dark = false }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label={`Login desktop${dark ? ' · dark' : ''}`}
      style={{
        width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)', display: 'flex',
      }}>
      {/* Left hero */}
      <div style={{
        flex: 1.1, padding: '60px 64px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: 'var(--paper)', borderRight: '1px solid var(--hairline-2)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div>
          <KWordmark size={64}/>
        </div>
        <div>
          <div className="display" style={{
            fontSize: 56, fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.025em',
            maxWidth: 480,
          }}>
            compte les calories,<br/>
            <span className="script" style={{ color: 'var(--orange)' }}>garde la série.</span>
          </div>
          <div style={{ fontSize: 17, color: 'var(--ink-2)', marginTop: 24, maxWidth: 460, lineHeight: 1.5 }}>
            un total par jour, un objectif, un bilan net. pas de scan, pas de macros — juste de la régularité.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32 }}>
            <StreakChip count={42} size="lg"/>
            <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>— ta série actuelle</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>
          v1.0 · {dark ? 'dark mode' : 'light mode'}
        </div>
      </div>

      {/* Right form */}
      <div style={{
        flex: 1, padding: '60px 64px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>
          <div className="display" style={{ fontSize: 32, fontWeight: 500, marginBottom: 28, letterSpacing: '-0.02em' }}>
            connexion
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28 }}>
            <Field label="Email" value={email} onChange={setEmail} placeholder="tu@mail.fr"/>
            <Field label="Mot de passe" value={pwd} onChange={setPwd} type="password"/>
          </div>
          <PrimaryCTA tone="orange">Se connecter</PrimaryCTA>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ink-2)' }}>
            pas de compte ? <span style={{ color: 'var(--orange)', fontWeight: 600 }}>inscription</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Field, LoginMobile, LoginDesktop });
