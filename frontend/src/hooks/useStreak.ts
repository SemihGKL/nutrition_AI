import type { DailyCalories, DayStatus } from '../types/api';

export interface StreakInfo {
  current: number;
  best: number;
  last14: DayStatus[];
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

export function computeStreak(entries: DailyCalories[], viewedDate: string): StreakInfo {
  const today = isoDate(new Date());
  const confirmedSet = new Set(
    entries.filter(e => e.confirmed).map(e => e.date),
  );

  const current = computeCurrentStreak(confirmedSet, today);
  const best = computeBestStreak(entries);
  const last14 = computeLast14(confirmedSet, viewedDate, today);

  return { current, best, last14 };
}

function computeCurrentStreak(confirmed: Set<string>, today: string): number {
  let start = confirmed.has(today) ? today : subtractDays(today, 1);
  let streak = 0;
  let date = start;

  while (confirmed.has(date)) {
    streak++;
    date = subtractDays(date, 1);
  }

  return streak;
}

function computeBestStreak(entries: DailyCalories[]): number {
  const confirmedDates = entries
    .filter(e => e.confirmed)
    .map(e => e.date)
    .sort();

  if (confirmedDates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < confirmedDates.length; i++) {
    const prev = new Date(confirmedDates[i - 1] + 'T00:00:00');
    const curr = new Date(confirmedDates[i] + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;

    if (diff === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

function computeLast14(
  confirmed: Set<string>,
  viewedDate: string,
  today: string,
): DayStatus[] {
  return Array.from({ length: 14 }, (_, i) => {
    const date = subtractDays(viewedDate, 13 - i);
    if (date > today) return 'future';
    if (date === viewedDate) return 'today';
    return confirmed.has(date) ? 'hit' : 'miss';
  });
}
