import { describe, it, expect } from 'vitest';
import { weightOn } from '../../utils/bodyWeight';

// Même règle que le récap serveur (BodyWeightHistory.weightOn).
const DAY = '2026-06-10';
const START = 90;
const CURRENT = 78;

describe('weightOn — poids retenu pour un jour donné', () => {
  it('renvoie le poids actuel sans aucune pesee', () => {
    expect(weightOn(DAY, [], START, CURRENT)).toBe(CURRENT);
  });

  it('renvoie le poids actuel quand aucune pesee n\'est posterieure au jour', () => {
    expect(weightOn(DAY, [{ date: '2026-06-05', weight: 82 }], START, CURRENT)).toBe(CURRENT);
  });

  it('renvoie la derniere pesee du jour ou d\'avant quand une pesee posterieure existe', () => {
    const weighIns = [
      { date: '2026-06-17', weight: 79 },
      { date: '2026-06-09', weight: 84 },
      { date: '2026-06-02', weight: 86 },
    ];
    expect(weightOn(DAY, weighIns, START, CURRENT)).toBe(84);
  });

  it('renvoie le poids de depart quand toutes les pesees sont posterieures', () => {
    expect(weightOn(DAY, [{ date: '2026-06-11', weight: 85 }], START, CURRENT)).toBe(START);
  });
});
