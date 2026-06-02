import { Stepper } from '../ui/Stepper';

interface Props {
  calories: number;
  steps: number;
  burned: number;
  isSaving: boolean;
  onCalories: (v: number) => void;
  onSteps: (v: number) => void;
  onBurned: (v: number) => void;
}

export function EntrySection({
  calories,
  steps,
  burned,
  isSaving,
  onCalories,
  onSteps,
  onBurned,
}: Props) {
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Stepper
            label="Pas"
            value={steps}
            onChange={onSteps}
            suffix=""
            step={500}
          />
          <Stepper
            label="Brûlées"
            value={burned}
            onChange={onBurned}
            suffix="kcal"
            step={50}
          />
        </div>
      </div>
    </div>
  );
}
