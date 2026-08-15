import { describe, it, expect } from 'vitest';
import { frenchMonthLabel, shiftMonth, monthGrid } from '../../utils/calendar';

describe('frenchMonthLabel — libellé du mois en français', () => {
  it('should return capitalized month label for a date in june', () => {
    expect(frenchMonthLabel('2026-06-15')).toBe('Juin 2026');
  });

  it('should return capitalized month label for a different month and year', () => {
    expect(frenchMonthLabel('2027-01-01')).toBe('Janvier 2027');
  });
});

describe('shiftMonth — décalage de mois, jour fixé au 1er', () => {
  it('should shift forward by one month within the same year', () => {
    expect(shiftMonth('2026-06-15', 1)).toBe('2026-07-01');
  });

  it('should shift backward by one month within the same year', () => {
    expect(shiftMonth('2026-06-15', -1)).toBe('2026-05-01');
  });

  it('should shift backward across a year boundary', () => {
    expect(shiftMonth('2026-01-15', -1)).toBe('2025-12-01');
  });

  it('should shift forward across a year boundary', () => {
    expect(shiftMonth('2026-12-15', 1)).toBe('2027-01-01');
  });
});

describe('monthGrid — grille de semaines pour un mois donné', () => {
  it('should return a grid with no padding when the month starts on a monday', () => {
    // Juin 2026 : le 1er est un lundi, le 30 un mardi → 5 semaines, pas de padding avant
    const grid = monthGrid('2026-06-15');
    expect(grid).toHaveLength(5);
    expect(grid[0][0]).toBe('2026-06-01');
  });

  it('should pad with previous and next month days when the month starts and ends mid-week', () => {
    // Février 2026 : le 1er est un dimanche, le 28 un samedi → padding avant ET après
    const grid = monthGrid('2026-02-10');
    expect(grid).toHaveLength(5);
    expect(grid[0][0]).toBe('2026-01-26');
    expect(grid[grid.length - 1][6]).toBe('2026-03-01');
  });

  it('should return 6 weeks when the month spans 6 calendar weeks', () => {
    // Août 2026 : le 1er est un samedi, le 31 un lundi → 6 semaines
    const grid = monthGrid('2026-08-15');
    expect(grid).toHaveLength(6);
    expect(grid[0][0]).toBe('2026-07-27');
    expect(grid[5][6]).toBe('2026-09-06');
  });

  it('should have exactly 7 dates in every week of the grid', () => {
    const grid = monthGrid('2026-06-15');
    expect(grid.every(week => week.length === 7)).toBe(true);
  });
});
