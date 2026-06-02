import { NavRing, NavBars, NavReport, NavUser } from './icons';

export type NavTab = 'jour' | 'semaine' | 'bilan' | 'profil';

interface NavItem {
  id: NavTab;
  label: string;
  Icon: React.ComponentType<{ active: boolean }>;
}

const ITEMS: NavItem[] = [
  { id: 'jour',    label: 'Jour',    Icon: NavRing },
  { id: 'semaine', label: 'Semaine', Icon: NavBars },
  { id: 'bilan',   label: 'Bilan',   Icon: NavReport },
  { id: 'profil',  label: 'Profil',  Icon: NavUser },
];

interface Props {
  active: NavTab;
  onChange?: (tab: NavTab) => void;
}

export function BottomNav({ active, onChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--paper)',
      borderTop: '1px solid var(--hairline-2)',
      paddingTop: 8,
      paddingBottom: 8,
    }}>
      {ITEMS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange?.(id)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 4px',
              cursor: 'pointer',
              color: isActive ? 'var(--orange)' : 'var(--ink-3)',
              transition: 'color 100ms linear',
            }}
          >
            <Icon active={isActive} />
            <span style={{
              fontSize: 11,
              fontWeight: isActive ? 600 : 500,
              letterSpacing: 0.2,
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
