import { useState } from 'react';
import { Stepper } from '../ui/Stepper';
import { formatNumber } from '../../utils/format';

interface Props {
  calories: number;
  steps: number;
  burned: number;
  weightKg: number;
  isSaving: boolean;
  onCalories: (v: number) => void;
  onSteps: (v: number) => void;
  onBurned: (v: number) => void;
}

export function EntrySection({
  calories,
  steps,
  burned,
  weightKg,
  isSaving,
  onCalories,
  onSteps,
  onBurned,
}: Props) {
  const [hasSession, setHasSession] = useState(burned > 0);

  const stepsKcal = steps > 0 ? Math.round(steps * (weightKg / 70) * 0.025) : 0;

  const toggleSession = (checked: boolean) => {
    setHasSession(checked);
    if (!checked) onBurned(0);
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span className="display" style={{ fontSize: 17, fontWeight: 500 }}>
          saisie du jour
        </span>
        <span style={{
          fontSize: 11,
          color: 'var(--ink-3)',
          letterSpacing: 0.4,
          transition: 'opacity 200ms',
          opacity: isSaving ? 1 : 0.6,
        }}>
          {isSaving ? 'enregistrement…' : 'auto-enregistré'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <Stepper
          label="Calories consommées"
          value={calories}
          onChange={onCalories}
          suffix="kcal"
          step={50}
        />

        <Stepper
          label="Pas"
          value={steps}
          onChange={onSteps}
          suffix=""
          step={500}
          hint={stepsKcal > 0 ? `≈ ${formatNumber(stepsKcal)} kcal (est. basse)` : undefined}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => toggleSession(!hasSession)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              border: `2px solid ${hasSession ? 'var(--orange)' : 'var(--hairline-2)'}`,
              background: hasSession ? 'var(--orange)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 150ms',
            }}>
              {hasSession && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
              Séance de sport effectuée
            </span>
          </button>

          {hasSession && (
            <Stepper
              label="Calories brûlées (séance)"
              value={burned}
              onChange={onBurned}
              suffix="kcal"
              step={50}
              hint="chiffre affiché sur ta montre"
            />
          )}
        </div>
      </div>
    </div>
  );
}
