// Only steps above sedentary baseline (4000) count — baseline is already baked into MBR × 1.2
// ⚠️ SYNC : duplique le backend (domain/service/StepsCalculator.java). Toute modif
// doit être répercutée côté back, sinon l'aperçu du dashboard et le recap serveur divergent.
export function stepsToKcal(steps: number, weightKg: number): number {
  const effectiveSteps = Math.max(0, steps - 4000);
  return Math.round(effectiveSteps * (weightKg / 70) * 0.025);
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

export function formatDecimal(n: number, decimals = 1): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function toLocalIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function isoToday(): string {
  return toLocalIso(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalIso(d);
}

export function frenchWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long' });
}

export function frenchDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export function frenchDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function frenchDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return names[d.getDay()];
}

export function frenchDayLetter(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const letters = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  return letters[d.getDay()];
}

export function weekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalIso(d);
}

export function weekEnd(dateStr: string): string {
  return addDays(weekStart(dateStr), 6);
}

export function weekNumber(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
