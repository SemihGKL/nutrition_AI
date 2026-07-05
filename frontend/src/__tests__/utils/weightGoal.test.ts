import { describe, it, expect } from 'vitest';
import { projectWeightGoal, type WeightGoalInput, type WeighInPoint } from '../../utils/weightGoal';

const TODAY = '2026-07-05';

function make(overrides: Partial<WeightGoalInput> = {}): WeightGoalInput {
  return {
    startWeight: 80,
    currentWeight: 76,
    weightGoal: 72,
    dailyTargetDeficit: 500, // → 500/7700 kg/j
    weighIns: [],
    today: TODAY,
    ...overrides,
  };
}

describe('projectWeightGoal', () => {
  it('should return status no-goal when weightGoal is missing', () => {
    const r = projectWeightGoal(make({ weightGoal: 0 }));
    expect(r.status).toBe('no-goal');
    expect(r.daysToGoal).toBeNull();
  });

  it('should return status reached when current weight is at or below goal', () => {
    const r = projectWeightGoal(make({ currentWeight: 72, weightGoal: 72 }));
    expect(r.status).toBe('reached');
    expect(r.progressPct).toBe(100);
  });

  it('should return status no-deficit when the calorie objective creates no deficit', () => {
    const r = projectWeightGoal(make({ dailyTargetDeficit: 0 }));
    expect(r.status).toBe('no-deficit');
    expect(r.planDaysRemaining).toBeNull();
  });

  it('should compute the plan estimate from the fixed daily deficit', () => {
    // reste 4 kg → 4*7700 = 30800 kcal ; /500 = 61.6 → 62 jours
    const r = projectWeightGoal(make());
    expect(r.planDaysRemaining).toBe(62);
    expect(r.planTargetDate).toBe('2026-09-05'); // +62 j
  });

  it('should compute journey progress from start weight', () => {
    const r = projectWeightGoal(make()); // 80 → 76, cible 72 : perdu 4 sur 8
    expect(r.totalToLose).toBe(8);
    expect(r.doneKg).toBe(4);
    expect(r.progressPct).toBe(50);
    expect(r.remainingKg).toBe(4);
  });

  it('should not derive a real pace with fewer than two weigh-ins', () => {
    const r = projectWeightGoal(make({ weighIns: [{ date: '2026-06-01', weight: 78 }] }));
    expect(r.hasRealPace).toBe(false);
    expect(r.pace).toBe('unknown');
    expect(r.daysToGoal).toBe(r.planDaysRemaining); // retombe sur le plan
  });

  it('should not derive a real pace when weigh-ins span less than a week', () => {
    const weighIns: WeighInPoint[] = [
      { date: '2026-07-01', weight: 76.5 },
      { date: '2026-07-04', weight: 76 },
    ];
    const r = projectWeightGoal(make({ weighIns }));
    expect(r.hasRealPace).toBe(false);
  });

  it('should flag ahead when the real pace is faster than the plan', () => {
    // 2 kg perdus en 14 j → 1 kg/semaine réel, vs plan ~0.45 kg/semaine
    const weighIns: WeighInPoint[] = [
      { date: '2026-06-21', weight: 78 },
      { date: '2026-07-05', weight: 76 },
    ];
    const r = projectWeightGoal(make({ weighIns }));
    expect(r.hasRealPace).toBe(true);
    expect(r.pace).toBe('ahead');
    expect(r.realDaysRemaining).toBeLessThan(r.planDaysRemaining!);
    expect(r.daysToGoal).toBe(r.realDaysRemaining); // l'estimation suit le réel
    expect(r.deltaDays!).toBeGreaterThan(0);
  });

  it('should flag behind when the real pace is slower than the plan', () => {
    // 0.4 kg perdus en 28 j → très lent vs plan
    const weighIns: WeighInPoint[] = [
      { date: '2026-06-07', weight: 76.4 },
      { date: '2026-07-05', weight: 76 },
    ];
    const r = projectWeightGoal(make({ weighIns }));
    expect(r.pace).toBe('behind');
    expect(r.realDaysRemaining!).toBeGreaterThan(r.planDaysRemaining!);
    expect(r.deltaDays!).toBeLessThan(0);
  });

  it('should flag stalled when weight is stable or rising over the period', () => {
    const weighIns: WeighInPoint[] = [
      { date: '2026-06-07', weight: 76 },
      { date: '2026-07-05', weight: 76.3 }, // en hausse
    ];
    const r = projectWeightGoal(make({ weighIns }));
    expect(r.pace).toBe('stalled');
    expect(r.realDaysRemaining).toBeNull();
    expect(r.daysToGoal).toBe(r.planDaysRemaining); // retombe sur le plan
  });

  it('should flag on-track when the real pace matches the plan', () => {
    // plan ≈ 0.4545 kg/semaine ; on vise un rythme réel proche
    // 4 kg perdus en ~62 j n'est pas mesurable ; on prend un rythme équivalent :
    // 500 kcal/j → 0.0649 kg/j ; sur 28 j → ~1.818 kg
    const weighIns: WeighInPoint[] = [
      { date: '2026-06-07', weight: 77.818 },
      { date: '2026-07-05', weight: 76 },
    ];
    const r = projectWeightGoal(make({ weighIns }));
    expect(r.pace).toBe('on-track');
  });
});
