import { describe, it, expect } from 'vitest';
import { computeMbr, suggestedTarget } from '../../utils/mbr';

describe('computeMbr — formule Mifflin-St Jeor', () => {
  it('should compute mbr correctly for male using mifflin st jeor formula', () => {
    // (10 × 80) + (6.25 × 180) − (5 × 30) + 5 = 800 + 1125 − 150 + 5 = 1780
    expect(computeMbr(80, 180, 30, 'MALE')).toBe(1780);
  });

  it('should compute mbr correctly for female using mifflin st jeor formula', () => {
    // (10 × 60) + (6.25 × 165) − (5 × 25) − 161 = 600 + 1031.25 − 125 − 161 = 1345.25
    expect(computeMbr(60, 165, 25, 'FEMALE')).toBe(1345.25);
  });

  it('should compute suggested target as mbr minus 200 rounded to nearest 50', () => {
    // MBR = 1780 → (1780 - 200) / 50 = 31.6 → round = 32 → 32 × 50 = 1600
    expect(suggestedTarget(1780)).toBe(1600);
    // MBR = 1600 → (1600 - 200) / 50 = 28 → round = 28 → 28 × 50 = 1400
    expect(suggestedTarget(1600)).toBe(1400);
    // MBR = 1500 → (1500 - 200) / 50 = 26 → round = 26 → 26 × 50 = 1300
    expect(suggestedTarget(1500)).toBe(1300);
  });
});
