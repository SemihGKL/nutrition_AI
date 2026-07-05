import { addDays } from './format';

// 1 kg de masse grasse ≈ 7700 kcal. Constante partagée avec la lecture de
// cohérence du bilan (perte attendue = déficit cumulé / 7700).
export const KCAL_PER_KG = 7700;

// Rythme réel : on n'estime une allure observée qu'à partir de 2 pesées
// espacées d'au moins une semaine, sinon le bruit (eau, glycogène) domine.
const MIN_PACE_WEIGH_INS = 2;
const MIN_PACE_SPAN_DAYS = 7;

export type WeightGoalStatus =
  | 'no-goal'      // pas de poids cible renseigné
  | 'reached'      // poids cible déjà atteint
  | 'no-deficit'   // l'objectif calorique ne crée aucun déficit → pas de projection
  | 'projected';   // projection disponible

export type Pace =
  | 'ahead'        // rythme réel plus rapide que le plan
  | 'behind'       // rythme réel plus lent que le plan
  | 'on-track'     // rythme réel proche du plan
  | 'stalled'      // poids stable ou en hausse sur la période
  | 'unknown';     // pas assez de pesées pour juger

export interface WeighInPoint {
  date: string;    // ISO yyyy-mm-dd
  weight: number;
}

export interface WeightGoalInput {
  startWeight: number;
  currentWeight: number;      // idéalement la dernière pesée, sinon le profil
  weightGoal: number;
  dailyTargetDeficit: number; // mbr − objectif calorique quotidien (kcal/j)
  avgDailyCaloriesBurned: number; // moyenne kcal sport/j sur les 30 derniers jours
  weighIns: WeighInPoint[];
  today: string;              // ISO yyyy-mm-dd
}

export interface WeightGoalProjection {
  status: WeightGoalStatus;

  // Parcours (basé sur le poids de départ déclaré)
  remainingKg: number;   // ce qu'il reste à perdre (≥ 0)
  totalToLose: number;   // poids de départ − poids cible
  doneKg: number;        // déjà perdu, borné à [0, totalToLose]
  progressPct: number;   // 0..100

  // Plan théorique — objectif calorique fixé maintenu chaque jour
  planDailyLossKg: number;
  planDaysRemaining: number | null;
  planTargetDate: string | null;

  // Rythme réel observé via les pesées
  hasRealPace: boolean;
  realDailyLossKg: number | null;
  realDaysRemaining: number | null;
  realTargetDate: string | null;
  pace: Pace;
  deltaDays: number | null; // plan − réel : > 0 = en avance, < 0 = en retard

  // Estimation affichée (au plus proche de la réalité)
  daysToGoal: number | null;
  targetDate: string | null;

  // Sport moyen intégré dans le plan
  avgDailyCaloriesBurned: number;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + 'T00:00:00').getTime();
  const to = new Date(toIso + 'T00:00:00').getTime();
  return Math.round((to - from) / 86_400_000);
}

function classifyPace(planDays: number, realDays: number): Pace {
  const delta = planDays - realDays; // > 0 : le réel arrive plus tôt → avance
  const tolerance = Math.max(3, Math.round(planDays * 0.1));
  if (Math.abs(delta) <= tolerance) return 'on-track';
  return delta > 0 ? 'ahead' : 'behind';
}

export function projectWeightGoal(input: WeightGoalInput): WeightGoalProjection {
  const { startWeight, currentWeight, weightGoal, dailyTargetDeficit, avgDailyCaloriesBurned, weighIns, today } = input;

  const empty: WeightGoalProjection = {
    status: 'no-goal',
    remainingKg: 0, totalToLose: 0, doneKg: 0, progressPct: 0,
    planDailyLossKg: 0, planDaysRemaining: null, planTargetDate: null,
    hasRealPace: false, realDailyLossKg: null, realDaysRemaining: null,
    realTargetDate: null, pace: 'unknown', deltaDays: null,
    daysToGoal: null, targetDate: null,
    avgDailyCaloriesBurned: 0,
  };

  if (!weightGoal || weightGoal <= 0) return empty;

  const remainingKg = currentWeight - weightGoal;
  const totalToLose = startWeight - weightGoal;
  const doneKg = Math.min(Math.max(startWeight - currentWeight, 0), Math.max(totalToLose, 0));
  const progressPct = totalToLose > 0
    ? Math.min(100, Math.max(0, Math.round((doneKg / totalToLose) * 100)))
    : 100;

  // Objectif atteint (on considère la cible atteinte dès qu'on est au niveau ou en dessous).
  if (remainingKg <= 0) {
    return { ...empty, status: 'reached', totalToLose, doneKg, progressPct: 100 };
  }

  const base = { ...empty, remainingKg, totalToLose, doneKg, progressPct, avgDailyCaloriesBurned };

  // Le déficit effectif intègre le sport moyen enregistré sur les 30 derniers jours.
  const effectiveDeficit = dailyTargetDeficit + avgDailyCaloriesBurned;
  if (effectiveDeficit <= 0) {
    return { ...base, status: 'no-deficit' };
  }

  const planDailyLossKg = effectiveDeficit / KCAL_PER_KG;
  const planDaysRemaining = Math.ceil((remainingKg * KCAL_PER_KG) / effectiveDeficit);
  const planTargetDate = addDays(today, planDaysRemaining);

  // Rythme réel via les pesées (première ↔ dernière sur la période observée).
  const sorted = [...weighIns].sort((a, b) => (a.date < b.date ? -1 : 1));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const spanDays = first && last ? daysBetween(first.date, last.date) : 0;

  let hasRealPace = false;
  let realDailyLossKg: number | null = null;
  let realDaysRemaining: number | null = null;
  let realTargetDate: string | null = null;
  let pace: Pace = 'unknown';
  let deltaDays: number | null = null;

  if (sorted.length >= MIN_PACE_WEIGH_INS && spanDays >= MIN_PACE_SPAN_DAYS) {
    hasRealPace = true;
    realDailyLossKg = (first.weight - last.weight) / spanDays;
    if (realDailyLossKg > 0) {
      realDaysRemaining = Math.ceil(remainingKg / realDailyLossKg);
      realTargetDate = addDays(today, realDaysRemaining);
      pace = classifyPace(planDaysRemaining, realDaysRemaining);
      deltaDays = planDaysRemaining - realDaysRemaining;
    } else {
      // Poids stable ou en hausse : au rythme actuel la cible s'éloigne.
      pace = 'stalled';
    }
  }

  // Estimation affichée : au rythme réel si on peut le juger et qu'il est fini,
  // sinon on retombe sur le plan théorique.
  const useReal = realDaysRemaining !== null &&
    (pace === 'ahead' || pace === 'behind' || pace === 'on-track');
  const daysToGoal = useReal ? realDaysRemaining : planDaysRemaining;
  const targetDate = useReal ? realTargetDate : planTargetDate;

  return {
    status: 'projected',
    remainingKg, totalToLose, doneKg, progressPct,
    planDailyLossKg, planDaysRemaining, planTargetDate,
    hasRealPace, realDailyLossKg, realDaysRemaining, realTargetDate,
    pace, deltaDays,
    daysToGoal, targetDate,
    avgDailyCaloriesBurned,
  };
}
