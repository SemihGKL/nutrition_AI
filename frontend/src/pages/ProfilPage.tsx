import { StatusBar } from '../components/dashboard/StatusBar';
import { BottomNav, type NavTab } from '../components/ui/BottomNav';
import { StreakChip } from '../components/ui/StreakChip';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onTabChange: (tab: NavTab) => void;
  streakCount: number;
}

export function ProfilPage({ onTabChange, streakCount }: Props) {
  const { user, logout } = useAuth();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <PageShell>
      <StatusBar />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 20px' }}>
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
          <InfoRow label="Âge"      value={user?.age ? `${user.age} ans` : '—'} />
          <InfoRow label="Taille"   value={user?.height ? `${user.height} cm` : '—'} />
          <InfoRow label="Poids de départ"  value={user?.startWeight ? `${user.startWeight} kg` : '—'} />
          <InfoRow label="Activité" value={formatActivity(user?.activityLevel)} />
        </Section>

        {/* Calculs */}
        <Section label="tes calculs">
          <InfoRow label="Objectif"   value={user?.dailyCalorieGoal ? `${user.dailyCalorieGoal} kcal/j` : '—'} />
        </Section>

        {/* Actions */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={logout}
            style={{
              width: '100%', height: 48, borderRadius: 'var(--radius)',
              background: 'transparent',
              border: '1px solid var(--hairline)',
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--ink-3)',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        background: 'var(--paper-2)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--hairline-2)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 16px',
      borderBottom: '1px solid var(--hairline-2)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{value}</span>
    </div>
  );
}

function formatActivity(level?: string): string {
  const map: Record<string, string> = {
    SEDENTARY:          'Sédentaire',
    LIGHTLY_ACTIVE:     'Légèrement actif',
    MODERATELY_ACTIVE:  'Modérément actif',
    VERY_ACTIVE:        'Très actif',
    EXTREMELY_ACTIVE:   'Extrême',
  };
  return level ? (map[level] ?? level) : '—';
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: 480, minHeight: '100dvh',
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
