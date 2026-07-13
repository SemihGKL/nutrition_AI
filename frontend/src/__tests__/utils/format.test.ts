import { describe, it, expect } from 'vitest';
import { formatNumber, weekStart, addDays, frenchDayLetter } from '../../utils/format';

describe('formatNumber — séparateur de milliers français', () => {
  it('should format number with french locale thousand separator', () => {
    // fr-FR uses narrow no-break space (U+202F) as thousand separator
    const result = formatNumber(1500);
    // Verify it contains 1, then some space-like separator, then 500
    expect(result).toMatch(/^1\s500$/);
    // Also verify it rounds floats
    expect(formatNumber(1500.7)).toBe(formatNumber(1501));
  });
});

describe('weekStart — début de semaine ISO (lundi)', () => {
  it('should compute week start as monday when given date is a saturday', () => {
    // 2026-06-27 is a Saturday → lundi de la même semaine = 2026-06-22
    expect(weekStart('2026-06-27')).toBe('2026-06-22');
  });

  it('should compute week start as monday when given date is a sunday', () => {
    // 2026-06-28 is a Sunday → lundi de la même semaine = 2026-06-22
    expect(weekStart('2026-06-28')).toBe('2026-06-22');
  });
});

describe('addDays — ajout de jours avec débordement de mois', () => {
  it('should add days correctly when crossing a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('should add days correctly when crossing a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('frenchDayLetter — initiale du jour de la semaine', () => {
  it('should return L for a monday', () => {
    // 2026-07-13 est un lundi
    expect(frenchDayLetter('2026-07-13')).toBe('L');
  });

  it('should return D for a sunday', () => {
    // 2026-07-12 est un dimanche
    expect(frenchDayLetter('2026-07-12')).toBe('D');
  });

  it('should return S for a saturday', () => {
    // 2026-07-11 est un samedi
    expect(frenchDayLetter('2026-07-11')).toBe('S');
  });
});
