import { describe, it, expect } from 'vitest';
import { computeMbr, computeTdee, suggestedTarget } from '../../utils/mbr';

describe('computeMbr — formule Mifflin-St Jeor', () => {
  it('should compute mbr correctly for male using mifflin st jeor formula', () => {
    // (10 × 80) + (6.25 × 180) − (5 × 30) + 5 = 800 + 1125 − 150 + 5 = 1780
    expect(computeMbr(80, 180, 30, 'MALE')).toBe(1780);
  });

  it('should compute mbr correctly for female using mifflin st jeor formula', () => {
    // (10 × 60) + (6.25 × 165) − (5 × 25) − 161 = 600 + 1031.25 − 125 − 161 = 1345.25
    expect(computeMbr(60, 165, 25, 'FEMALE')).toBe(1345.25);
  });

  it('should compute suggested target as tdee minus 400 rounded to nearest 50 (sync MbrCalculator.java)', () => {
    // TDEE = 1780 × 1.2 = 2136 → (2136 − 400) / 50 = 34.72 → 35 × 50 = 1750
    expect(suggestedTarget(computeTdee(1780))).toBe(1750);
    // TDEE = 1978.5 → (1978.5 − 400) / 50 = 31.57 → 32 × 50 = 1600
    expect(suggestedTarget(1978.5)).toBe(1600);
  });

  it('keeps the suggested target 300 to 500 kcal under tdee', () => {
    for (let mbr = 1200; mbr <= 2600; mbr += 37) {
      const tdee = computeTdee(mbr);
      const deficit = tdee - suggestedTarget(tdee);
      expect(deficit).toBeGreaterThanOrEqual(300);
      expect(deficit).toBeLessThanOrEqual(500);
    }
  });
});
