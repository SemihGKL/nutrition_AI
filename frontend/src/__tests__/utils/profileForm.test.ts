import { describe, it, expect } from 'vitest';
import { parseStepsGoalInput, parseWeightGoalInput } from '../../utils/profileForm';

describe('parseStepsGoalInput — objectif de pas du profil', () => {
  it('renvoie 0 (retrait de l\'objectif) pour un champ vide', () => {
    expect(parseStepsGoalInput('')).toBe(0);
    expect(parseStepsGoalInput('   ')).toBe(0);
  });

  it('renvoie 0 pour une valeur nulle ou negative', () => {
    expect(parseStepsGoalInput('0')).toBe(0);
    expect(parseStepsGoalInput('-50')).toBe(0);
  });

  it('renvoie la valeur saisie', () => {
    expect(parseStepsGoalInput('8000')).toBe(8000);
  });
});

describe('parseWeightGoalInput — poids objectif du profil', () => {
  it('garde les decimales, avec point ou virgule', () => {
    expect(parseWeightGoalInput('72.5')).toEqual({ ok: true, value: 72.5 });
    expect(parseWeightGoalInput('72,5')).toEqual({ ok: true, value: 72.5 });
  });

  it('renvoie null pour un champ vide (objectif inchange)', () => {
    expect(parseWeightGoalInput('')).toEqual({ ok: true, value: null });
  });

  it('refuse une valeur hors de 30 a 300 kg', () => {
    expect(parseWeightGoalInput('5')).toEqual({ ok: false });
    expect(parseWeightGoalInput('400')).toEqual({ ok: false });
    expect(parseWeightGoalInput('abc')).toEqual({ ok: false });
  });
});
