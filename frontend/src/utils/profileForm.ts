/** Objectif de pas saisi dans le profil : vide ou ≤ 0 → 0, que le serveur traite comme « retirer l'objectif ». */
export function parseStepsGoalInput(raw: string): number {
  const parsed = parseInt(raw.trim(), 10);
  return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
}

export type WeightGoalInput = { ok: true; value: number | null } | { ok: false };

/** Poids objectif saisi dans le profil : décimales acceptées (point ou virgule), 30–300 kg, vide = inchangé. */
export function parseWeightGoalInput(raw: string): WeightGoalInput {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const parsed = Number(trimmed.replace(',', '.'));
  if (isNaN(parsed) || parsed < 30 || parsed > 300) return { ok: false };
  return { ok: true, value: parsed };
}
