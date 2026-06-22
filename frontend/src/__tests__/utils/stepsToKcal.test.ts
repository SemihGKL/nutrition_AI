import { describe, it, expect } from 'vitest';
import { stepsToKcal } from '../../utils/format';

describe('stepsToKcal — formule de conversion pas → kcal', () => {
  it('retourne 0 quand les pas sont en dessous du seuil sédentaire de 4 000', () => {
    expect(stepsToKcal(0, 70)).toBe(0);
    expect(stepsToKcal(3999, 70)).toBe(0);
  });

  it('retourne 0 exactement au seuil de 4 000 pas', () => {
    expect(stepsToKcal(4000, 70)).toBe(0);
  });

  it('ne compte que les pas au-dessus du seuil de 4 000 à 70 kg', () => {
    // 500 pas effectifs × 1.0 × 0.025 = 12.5 → arrondi à 13
    expect(stepsToKcal(4500, 70)).toBe(13);
    // 6 000 pas effectifs × 1.0 × 0.025 = 150
    expect(stepsToKcal(10000, 70)).toBe(150);
  });

  it('scale linéairement avec le poids corporel', () => {
    const ref = stepsToKcal(10000, 70);
    expect(stepsToKcal(10000, 90)).toBeGreaterThan(ref);
    expect(stepsToKcal(10000, 50)).toBeLessThan(ref);
  });

  it('retourne toujours un entier', () => {
    // 500 pas à 70 kg → 12.5 → doit être arrondi
    expect(Number.isInteger(stepsToKcal(4500, 70))).toBe(true);
    expect(Number.isInteger(stepsToKcal(7777, 83))).toBe(true);
  });

  it('formule complète : (steps - 4000) × (poids / 70) × 0.025', () => {
    const steps = 12000;
    const weight = 85;
    const expected = Math.round((steps - 4000) * (weight / 70) * 0.025);
    expect(stepsToKcal(steps, weight)).toBe(expected);
  });
});
