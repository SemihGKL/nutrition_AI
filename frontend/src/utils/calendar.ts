import { toLocalIso, addDays, weekStart, weekEnd } from './format';

export function shiftMonth(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  return toLocalIso(d);
}

export function monthGrid(dateStr: string): string[][] {
  const [year, month] = dateStr.split('-');
  const firstOfMonth = `${year}-${month}-01`;
  const lastOfMonth = addDays(shiftMonth(firstOfMonth, 1), -1);

  const gridStart = weekStart(firstOfMonth);
  const gridEnd = weekEnd(lastOfMonth);

  const weeks: string[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function frenchMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
