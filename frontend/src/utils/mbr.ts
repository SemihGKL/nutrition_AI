// ⚠️ SYNC : ces formules dupliquent le backend (domain/service/MbrCalculator.java).
// Servent uniquement à l'aperçu live avant enregistrement ; après, la source de
// vérité est le recap serveur (GET /api/daily-kcal/{date}/recap). Toute modif ici
// doit être répercutée côté back (et inversement), sinon aperçu et recap divergent.
export function computeMbr(weightKg: number, heightCm: number, age: number, gender: 'MALE' | 'FEMALE'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'MALE' ? base + 5 : base - 161;
}

export function computeTdee(mbr: number): number {
  return mbr * 1.2;
}

export function suggestedTarget(mbr: number): number {
  return Math.round((mbr - 200) / 50) * 50;
}
