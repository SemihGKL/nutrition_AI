const ACTIVITY_COEFFICIENT: Record<string, number> = {
  SEDENTARY:          1.2,
  LIGHTLY_ACTIVE:     1.375,
  MODERATELY_ACTIVE:  1.55,
  VERY_ACTIVE:        1.725,
  EXTREMELY_ACTIVE:   1.9,
};

export function computeMbr(weightKg: number, heightCm: number, age: number, gender: 'MALE' | 'FEMALE'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'MALE' ? base + 5 : base - 161;
}

export function computeTdee(mbr: number, activityLevel: string): number {
  return mbr * (ACTIVITY_COEFFICIENT[activityLevel] ?? 1.2);
}

export function suggestedTarget(mbr: number, tdee: number): number {
  return Math.round(Math.max(mbr * 0.95, tdee - 500));
}
