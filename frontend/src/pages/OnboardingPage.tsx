import { useState } from 'react';
import { Field } from '../components/ui/Field';
import { PrimaryCTA } from '../components/ui/PrimaryCTA';
import { Chevron } from '../components/ui/icons';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { computeMbr, suggestedTarget } from '../utils/mbr';
import { CalorieTargetStep } from '../components/onboarding/CalorieTargetStep';


interface Props {
  onDone: () => void;
  onBack: () => void;
}

const DAYS = [
  { value: 'MONDAY',    label: 'Lun' },
  { value: 'TUESDAY',   label: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mer' },
  { value: 'THURSDAY',  label: 'Jeu' },
  { value: 'FRIDAY',    label: 'Ven' },
  { value: 'SATURDAY',  label: 'Sam' },
  { value: 'SUNDAY',    label: 'Dim' },
];

interface FormState {
  username: string;
  email: string;
  password: string;
  age: string;
  height: string;
  weight: string;
  weightGoal: string;
  gender: 'MALE' | 'FEMALE';
  weighInDay: string;
  target: number;
}

type Errors = Partial<Record<keyof FormState, string>>;


export function OnboardingPage({ onDone, onBack }: Props) {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    age: '',
    height: '',
    weight: '',
    weightGoal: '',
    gender: 'MALE',
    weighInDay: 'MONDAY',
    target: 1800,
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const mbr = form.age && form.height && form.weight
    ? computeMbr(parseFloat(form.weight), parseFloat(form.height), parseInt(form.age), form.gender)
    : 0;

  const validateStep1 = (): boolean => {
    const errs: Errors = {};
    if (!form.username.trim()) errs.username = 'Champ requis';
    if (!form.email.includes('@')) errs.email = 'Format invalide';
    if (form.password.length < 8) errs.password = '8 caractères minimum';
    const age = parseInt(form.age);
    if (!form.age || age < 13 || age > 100) errs.age = '13–100 ans';
    const h = parseFloat(form.height);
    if (!form.height || h < 100 || h > 230) errs.height = '100–230 cm';
    const w = parseFloat(form.weight);
    if (!form.weight || w < 30 || w > 300) errs.weight = '30–300 kg';
    const wg = parseFloat(form.weightGoal);
    if (!form.weightGoal || wg < 30 || wg > 300) errs.weightGoal = '30–300 kg';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 1) {
      const computed = suggestedTarget(mbr);
      set('target', computed);
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const { token, user } = await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        startWeight: parseFloat(form.weight),
        weightGoal: parseInt(form.weightGoal, 10),
        weighInDay: form.weighInDay,
      });
      login(token, user);
      onDone();
    } catch (err) {
      if (err instanceof TypeError) {
        setSubmitError("Impossible de joindre le serveur — vérifie qu'il est démarré");
      } else if (err instanceof ApiError && err.status === 409) {
        setSubmitError('Cet email est déjà utilisé');
      } else if (err instanceof ApiError) {
        setSubmitError(`Erreur serveur (${err.status}) — vérifie les logs du backend`);
      } else {
        setSubmitError('Une erreur inattendue est survenue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      height: '100dvh',
      background: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Status bar mock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px 6px', fontSize: 14, fontWeight: 600 }}>
        <span className="tabular">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span style={{ opacity: 0.6, fontSize: 12 }}>•••</span>
      </div>

      {/* Header */}
      <div style={{ padding: '12px 24px 0' }}>
        <StepBar step={step} />
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14, letterSpacing: 0.4 }}>
          étape {step} / 2
        </div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, marginTop: 4, letterSpacing: '-0.02em' }}>
          {step === 1 && 'tes infos'}
          {step === 2 && 'voici tes chiffres'}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '24px' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionLabel>ton compte</SectionLabel>
            <Field label="Prénom / pseudo" value={form.username} onChange={v => set('username', v)} error={errors.username} />
            <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} error={errors.email} />
            <Field label="Mot de passe" type="password" value={form.password} onChange={v => set('password', v)} hint="8 car. minimum" error={errors.password} />

            <SectionLabel style={{ marginTop: 4 }}>physique</SectionLabel>
            <Field label="Âge" type="number" value={form.age} onChange={v => set('age', v)} hint="en années" error={errors.age} />
            <Field label="Taille (cm)" type="number" value={form.height} onChange={v => set('height', v)} error={errors.height} />
            <Field label="Poids actuel (kg)" type="number" value={form.weight} onChange={v => set('weight', v)} error={errors.weight} />
            <Field label="Poids objectif (kg)" type="number" value={form.weightGoal} onChange={v => set('weightGoal', v)} error={errors.weightGoal} />

            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 6 }}>Genre</div>
              <SegmentedToggle
                value={form.gender}
                onChange={v => set('gender', v as 'MALE' | 'FEMALE')}
                options={[{ value: 'MALE', label: 'Homme' }, { value: 'FEMALE', label: 'Femme' }]}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 6 }}>Jour de pesée hebdomadaire</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {DAYS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => set('weighInDay', d.value)}
                    style={{
                      flex: 1, height: 36, border: 'none', borderRadius: 8,
                      background: form.weighInDay === d.value ? 'var(--orange)' : 'var(--paper-3)',
                      color: form.weighInDay === d.value ? '#fff' : 'var(--ink-2)',
                      fontWeight: form.weighInDay === d.value ? 700 : 500,
                      fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
                      transition: 'all 120ms',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <CalorieTargetStep
            mbr={mbr}
            target={form.target}
            onTargetChange={v => set('target', v)}
            submitError={submitError}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '16px 24px 20px',
        borderTop: '1px solid var(--hairline-2)',
      }}>
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              height: 56,
              width: 80,
              borderRadius: 14,
              background: 'transparent',
              border: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: 'var(--ink-2)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Chevron dir="left" size={14} color="var(--ink-2)" /> retour
          </button>
        )}
        {step === 1 && (
          <button
            onClick={onBack}
            style={{
              height: 56,
              width: 80,
              borderRadius: 14,
              background: 'transparent',
              border: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: 'var(--ink-2)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Chevron dir="left" size={14} color="var(--ink-2)" /> retour
          </button>
        )}
        <div style={{ flex: 1 }}>
          <PrimaryCTA
            tone="orange"
            icon={<Chevron dir="right" size={16} color="#fff" sw={2} />}
            onClick={step === 2 ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {step === 2 ? (isSubmitting ? 'création…' : "c'est parti") : 'continuer'}
          </PrimaryCTA>
        </div>
      </div>

      <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
        <div style={{ width: 110, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.22)' }} />
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
      {[1, 2].map(i => (
        <div key={i} style={{
          flex: 1,
          height: 4,
          borderRadius: 999,
          background: i <= step ? 'var(--orange)' : 'var(--hairline)',
          transition: 'background 240ms linear',
        }} />
      ))}
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--ink-3)',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      padding: 4,
      gap: 4,
      background: 'var(--paper-3)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--hairline-2)',
    }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              height: 44,
              border: 'none',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              background: active ? 'var(--paper)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-2)',
              fontWeight: active ? 600 : 500,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: 'all 140ms linear',
              fontFamily: 'var(--font-body)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

