import { useEffect, useState } from 'react';
import { mealRemindersApi, type MealReminder, type MealReminderMeal } from '../../api/mealReminders';

const MEALS: Record<MealReminderMeal, { label: string; switchLabel: string; timeLabel: string }> = {
  BREAKFAST: { label: 'Petit-déjeuner', switchLabel: 'Rappel petit-déjeuner', timeLabel: 'Heure du petit-déjeuner' },
  LUNCH:     { label: 'Déjeuner',       switchLabel: 'Rappel déjeuner',       timeLabel: 'Heure du déjeuner' },
  SNACK:     { label: 'Collation',      switchLabel: 'Rappel collation',      timeLabel: 'Heure de la collation' },
  DINNER:    { label: 'Dîner',          switchLabel: 'Rappel dîner',          timeLabel: 'Heure du dîner' },
};

interface Props {
  /** Les rappels passent par les notifications push de l'appareil. */
  notificationsEnabled: boolean;
}

/** Rappels pour renseigner chaque repas à son heure habituelle (si le repas n'est pas déjà saisi). */
export function MealRemindersSection({ notificationsEnabled }: Props) {
  const [reminders, setReminders] = useState<MealReminder[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    mealRemindersApi.getAll().then(setReminders).catch(() => {});
  }, []);

  const save = async (changed: MealReminder) => {
    const previous = reminders;
    setReminders(rs => rs.map(r => (r.meal === changed.meal ? changed : r)));
    setSaveFailed(false);
    try {
      setReminders(await mealRemindersApi.update([changed]));
    } catch {
      setReminders(previous);
      setSaveFailed(true);
    }
  };

  return (
    <div>
      {!notificationsEnabled && (
        <div style={{ padding: '10px 16px 0', fontSize: 12, color: 'var(--ink-3)' }}>
          Active les notifications ci-dessus pour recevoir ces rappels.
        </div>
      )}
      {saveFailed && (
        <div style={{ padding: '10px 16px 0', fontSize: 12, color: 'var(--red)' }}>
          Réglage non enregistré — réessaie.
        </div>
      )}
      {reminders.map((r, i) => {
        const meal = MEALS[r.meal];
        return (
          <div key={r.meal} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
            borderBottom: i < reminders.length - 1 ? '1px solid var(--hairline-2)' : 'none',
            opacity: notificationsEnabled ? 1 : 0.5,
          }}>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)' }}>{meal.label}</span>
            <input
              type="time"
              aria-label={meal.timeLabel}
              value={r.time}
              disabled={!notificationsEnabled}
              onChange={e => { if (e.target.value) save({ ...r, time: e.target.value }); }}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
                background: 'var(--paper-2)', border: '1px solid var(--hairline-2)',
                borderRadius: 8, padding: '4px 8px',
              }}
            />
            <button
              role="switch"
              aria-checked={r.enabled}
              aria-label={meal.switchLabel}
              disabled={!notificationsEnabled}
              onClick={() => save({ ...r, enabled: !r.enabled })}
              style={{
                width: 42, height: 24, borderRadius: 999, border: 'none', padding: 2,
                background: r.enabled ? 'var(--orange)' : 'var(--paper-3)',
                cursor: notificationsEnabled ? 'pointer' : 'default',
                display: 'flex', justifyContent: r.enabled ? 'flex-end' : 'flex-start',
                transition: 'background 150ms', flexShrink: 0,
              }}
            >
              <span style={{ width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: 'var(--shadow-sm)' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
