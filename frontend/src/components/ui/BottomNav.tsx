import { NavRing, NavBars, NavReport, NavUser, NavObjectifs } from './icons';
import { useWeighInContext } from '../../hooks/useWeighIn';

export type NavTab = 'jour' | 'semaine' | 'bilan' | 'objectifs' | 'profil';

interface NavItem {
  id: NavTab;
  label: string;
  Icon: React.ComponentType<{ active: boolean }>;
}

const ITEMS: NavItem[] = [
  { id: 'jour',    label: 'Jour',    Icon: NavRing },
  { id: 'semaine', label: 'Semaine', Icon: NavBars },
  { id: 'bilan',   label: 'Bilan',   Icon: NavReport },
  { id: 'objectifs', label: 'Objectifs', Icon: NavObjectifs },
  { id: 'profil',  label: 'Profil',  Icon: NavUser },
];

interface Props {
  active: NavTab;
  onChange?: (tab: NavTab) => void;
}

export function BottomNav({ active, onChange }: Props) {
  const { needsBadge } = useWeighInContext();

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
        const hasDot = id === 'profil' && needsBadge;
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
            <div style={{ position: 'relative' }}>
              <Icon active={isActive} />
              {hasDot && (
                <div style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--red)',
                  border: '1.5px solid var(--paper)',
                }} />
              )}
            </div>
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
