export interface DatedWeight {
  date: string;   // ISO yyyy-mm-dd
  weight: number;
}

/**
 * Poids à retenir pour un jour donné, pour que le calcul d'un jour passé ne change pas
 * à chaque nouvelle pesée.
 * ⚠️ SYNC : même règle que le récap serveur (BodyWeightHistory.weightOn).
 * - aucune pesée postérieure au jour → poids actuel ;
 * - sinon, dernière pesée faite ce jour-là ou avant ;
 * - sinon (toutes postérieures) → poids de départ.
 */
export function weightOn(date: string, weighIns: DatedWeight[], startWeight: number, currentWeight: number): number {
  if (!weighIns.some(w => w.date > date)) return currentWeight;
  const before = weighIns.filter(w => w.date <= date).sort((a, b) => (a.date < b.date ? 1 : -1));
  return before.length > 0 ? before[0].weight : startWeight;
}
