import { useState } from 'react';
import { StatusBar } from '../components/dashboard/StatusBar';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { StreakChip } from '../components/ui/StreakChip';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';

interface Props {
  onTabChange: (tab: NavTab) => void;
  streakCount: number;
}

const ACTIVITIES = [
  { value: 'SEDENTARY',          label: 'Sédentaire'         },
  { value: 'LIGHTLY_ACTIVE',     label: 'Légèrement actif'   },
  { value: 'MODERATELY_ACTIVE',  label: 'Modérément actif'   },
  { value: 'VERY_ACTIVE',        label: 'Très actif'         },
  { value: 'EXTREMELY_ACTIVE',   label: 'Extrême'            },
];

function formatActivity(level?: string): string {
  return ACTIVITIES.find(a => a.value === level)?.label ?? level ?? '—';
}

export function ProfilPage({ onTabChange, streakCount }: Props) {
  const { user, logout, updateUser } = useAuth();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '?';
  const [editing, setEditing] = useState(false);

  if (editing && user) {
    return (
      <EditView
        user={user}
        onSave={async (payload) => {
          const updated = await usersApi.update(user.id, payload);
          updateUser(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <PageShell>
      <StatusBar />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px 20px' }}>
        {/* Avatar header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            background: 'var(--orange-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'var(--orange)',
            fontFamily: 'var(--font-body)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
              {user?.username ?? '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
              {user?.email ?? '—'}
            </div>
          </div>
          <StreakChip count={streakCount} size="md" />
        </div>

        {/* Infos */}
        <Section label="tes infos">
          <InfoRow label="Âge"             value={user?.age ? `${user.age} ans` : '—'} />
          <InfoRow label="Taille"          value={user?.height ? `${user.height} cm` : '—'} />
          <InfoRow label="Poids actuel"    value={user?.currentWeight ? `${user.currentWeight} kg` : '—'} />
          <InfoRow label="Poids de départ" value={user?.startWeight ? `${user.startWeight} kg` : '—'} />
          <InfoRow label="Activité"        value={formatActivity(user?.activityLevel)} last />
        </Section>

        {/* Calculs */}
        <Section label="tes calculs">
          <InfoRow label="Objectif" value={user?.dailyCalorieGoal ? `${user.dailyCalorieGoal} kcal/j` : '—'} last />
        </Section>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => setEditing(true)}
            style={{
              width: '100%', height: 48, borderRadius: 'var(--radius)',
              background: 'var(--orange)', border: 'none',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Modifier mon profil
          </button>
          <button
            onClick={logout}
            style={{
              width: '100%', height: 48, borderRadius: 'var(--radius)',
              background: 'transparent', border: '1px solid var(--hairline)',
              color: 'var(--ink-2)', fontSize: 15, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <BottomNav active="profil" onChange={onTabChange} />
      <HomeIndicator />
    </PageShell>
  );
}

// ─── Edit view ────────────────────────────────────────────────────────────────

interface EditViewProps {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  onSave: (payload: {
    username: string; gender: string; age: number;
    height: number; activityLevel: string; currentWeight: number;
  }) => Promise<void>;
  onCancel: () => void;
  onTabChange: (tab: NavTab) => void;
}

function EditView({ user, onSave, onCancel, onTabChange }: EditViewProps) {
  const [form, setForm] = useState({
    username:      user.username,
    age:           String(user.age),
    height:        String(user.height),
    currentWeight: String(user.currentWeight),
    gender:        user.gender,
    activityLevel: user.activityLevel,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const age    = parseInt(form.age, 10);
    const height = parseFloat(form.height);
    const weight = parseFloat(form.currentWeight);

    if (!form.username.trim())              return setError('Le prénom est requis');
    if (isNaN(age) || age < 13 || age > 100) return setError('Âge invalide (13–100)');
    if (isNaN(height) || height < 100 || height > 230) return setError('Taille invalide (100–230 cm)');
    if (isNaN(weight) || weight < 30 || weight > 300)  return setError('Poids invalide (30–300 kg)');

    setSaving(true);
    setError(null);
    try {
      await onSave({
        username: form.username.trim(),
        gender: form.gender,
        age,
        height,
        activityLevel: form.activityLevel,
        currentWeight: weight,
      });
    } catch {
      setError('Erreur lors de la mise à jour');
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <StatusBar />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px 20px' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>
          Modifier mon profil
        </div>

        <Section label="identité">
          <EditField label="Prénom / pseudo" value={form.username}
            onChange={v => set('username', v)} />
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 8 }}>Genre</div>
            <SegmentedToggle
              value={form.gender}
              onChange={v => set('gender', v)}
              options={[{ value: 'MALE', label: 'Homme' }, { value: 'FEMALE', label: 'Femme' }]}
            />
          </div>
        </Section>

        <Section label="physique">
          <EditField label="Âge"               value={form.age}           onChange={v => set('age', v)}           type="number" />
          <EditField label="Taille (cm)"        value={form.height}        onChange={v => set('height', v)}        type="number" />
          <EditField label="Poids actuel (kg)"  value={form.currentWeight} onChange={v => set('currentWeight', v)} type="number" last />
        </Section>

        <Section label="activité">
          <div style={{ padding: '8px 0' }}>
            {ACTIVITIES.map((a, i) => (
              <button
                key={a.value}
                onClick={() => set('activityLevel', a.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 16px', background: 'transparent',
                  border: 'none', borderBottom: i < ACTIVITIES.length - 1 ? '1px solid var(--hairline-2)' : 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                  border: `2px solid ${form.activityLevel === a.value ? 'var(--orange)' : 'var(--hairline)'}`,
                  background: form.activityLevel === a.value ? 'var(--orange)' : 'transparent',
                  position: 'relative',
                }}>
                  {form.activityLevel === a.value && (
                    <div style={{ position: 'absolute', inset: 3, borderRadius: 999, background: 'var(--paper)' }} />
                  )}
                </div>
                <span style={{
                  fontSize: 14,
                  color: form.activityLevel === a.value ? 'var(--ink)' : 'var(--ink-2)',
                  fontWeight: form.activityLevel === a.value ? 600 : 400,
                }}>
                  {a.label}
                </span>
              </button>
            ))}
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

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 48, borderRadius: 'var(--radius)',
              background: 'transparent', border: '1px solid var(--hairline)',
              color: 'var(--ink-2)', fontSize: 15, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, height: 48, borderRadius: 'var(--radius)',
              background: 'var(--orange)', border: 'none',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'var(--font-body)',
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <BottomNav active="profil" onChange={onTabChange} />
      <HomeIndicator />
    </PageShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditField({
  label, value, onChange, type = 'text', last = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; last?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 16px', height: 52,
      borderBottom: last ? 'none' : '1px solid var(--hairline-2)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--ink-2)', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, textAlign: 'right',
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: 14, fontWeight: 500, color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
        }}
      />
    </div>
  );
}

function SegmentedToggle({
  options, value, onChange,
}: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      display: 'flex', padding: 4, gap: 4,
      background: 'var(--paper-3)', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--hairline-2)',
    }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, height: 36, border: 'none',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              background: active ? 'var(--paper)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-2)',
              fontWeight: active ? 600 : 500, fontSize: 14,
              cursor: 'pointer',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              fontFamily: 'var(--font-body)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

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

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 16px',
      borderBottom: last ? 'none' : '1px solid var(--hairline-2)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{value}</span>
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
