import { useEffect, useRef, useState } from 'react';
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
// La roue d'heure d'iOS émet un changement à chaque cran : on attend qu'elle s'arrête.
const TIME_SAVE_DELAY_MS = 600;

export function MealRemindersSection({ notificationsEnabled }: Props) {
  const [reminders, setReminders] = useState<MealReminder[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);
  // Dernière configuration confirmée par le serveur : base d'un retour arrière.
  const confirmedRef = useRef<MealReminder[]>([]);
  // Une requête à la fois, dans l'ordre : une réponse ancienne n'écrase jamais une plus récente.
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const latestRequestRef = useRef(0);
  const timeTimersRef = useRef(new Map<MealReminderMeal, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    mealRemindersApi.getAll()
      .then(loaded => { confirmedRef.current = loaded; setReminders(loaded); })
      .catch(() => {});
    const timers = timeTimersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const persist = (changed: MealReminder) => {
    const request = ++latestRequestRef.current;
    setSaveFailed(false);
    chainRef.current = chainRef.current.then(async () => {
      try {
        const saved = await mealRemindersApi.update([changed]);
        confirmedRef.current = saved;
        if (request === latestRequestRef.current) setReminders(saved);
      } catch {
        if (request === latestRequestRef.current) {
          setReminders(confirmedRef.current);
          setSaveFailed(true);
        }
      }
    });
  };

  const show = (changed: MealReminder) =>
    setReminders(rs => rs.map(r => (r.meal === changed.meal ? changed : r)));

  const toggle = (reminder: MealReminder) => {
    const changed = { ...reminder, enabled: !reminder.enabled };
    show(changed);
    persist(changed);
  };

  const changeTime = (reminder: MealReminder, time: string) => {
    const changed = { ...reminder, time };
    show(changed);
    const timers = timeTimersRef.current;
    clearTimeout(timers.get(reminder.meal));
    timers.set(reminder.meal, setTimeout(() => {
      timers.delete(reminder.meal);
      persist(changed);
    }, TIME_SAVE_DELAY_MS));
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
              onChange={e => { if (e.target.value) changeTime(r, e.target.value); }}
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
              onClick={() => toggle(r)}
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
