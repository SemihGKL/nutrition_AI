import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeStreak } from '../../hooks/useStreak';
import type { DailyCalories } from '../../types/api';

const TODAY = '2026-06-22';

function entry(date: string, confirmed: boolean): DailyCalories {
  return { date, caloriesConsumed: 1800, caloriesBurned: 0, steps: 0, confirmed, user: { id: 1 } };
}

describe('computeStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T10:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('streak nul sur historique vide', () => {
    const r = computeStreak([], TODAY);
    expect(r.current).toBe(0);
    expect(r.best).toBe(0);
  });

  it('3 jours confirmes consecutifs dont aujourd\'hui = streak courant de 3', () => {
    const entries = [
      entry('2026-06-20', true),
      entry('2026-06-21', true),
      entry('2026-06-22', true),
    ];
    expect(computeStreak(entries, TODAY).current).toBe(3);
  });

  it('une journee non confirmee interrompt le streak courant', () => {
    const entries = [
      entry('2026-06-19', true),
      entry('2026-06-21', true), // gap le 20
      entry('2026-06-22', true),
    ];
    expect(computeStreak(entries, TODAY).current).toBe(2);
  });

  it('streak courant = 0 si ni aujourd\'hui ni hier ne sont confirmes', () => {
    const entries = [
      entry('2026-06-18', true),
      entry('2026-06-19', true),
      // gap depuis le 20
    ];
    expect(computeStreak(entries, TODAY).current).toBe(0);
  });

  it('best streak memorise la plus longue sequence apres une interruption', () => {
    const entries = [
      entry('2026-06-10', true),
      entry('2026-06-11', true),
      entry('2026-06-12', true), // sequence de 3
      entry('2026-06-14', true),
      entry('2026-06-15', true), // sequence de 2
    ];
    expect(computeStreak(entries, TODAY).best).toBe(3);
  });

  it('last14 contient exactement 14 elements', () => {
    expect(computeStreak([], TODAY).last14).toHaveLength(14);
  });

  it('le dernier element de last14 est "today" quand viewedDate = aujourd\'hui', () => {
    const r = computeStreak([], TODAY);
    expect(r.last14[13]).toBe('today');
  });

  it('les 13 jours passes non confirmes sont marques "miss"', () => {
    const r = computeStreak([], TODAY);
    expect(r.last14.filter(s => s === 'miss')).toHaveLength(13);
  });

  it('un jour passe confirme est marque "hit"', () => {
    const entries = [entry('2026-06-21', true)];
    expect(computeStreak(entries, TODAY).last14).toContain('hit');
  });
});
