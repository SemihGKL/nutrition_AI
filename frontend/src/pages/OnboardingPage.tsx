import { useState, useEffect } from 'react';
import { Field } from '../components/ui/Field';
import { PrimaryCTA } from '../components/ui/PrimaryCTA';
import { Chevron } from '../components/ui/icons';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { formatNumber } from '../utils/format';
import { computeMbr, suggestedTarget } from '../utils/mbr';


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
        weightGoal: 0,
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
          <Step3
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

function Step3({
  mbr,
  target,
  onTargetChange,
  submitError,
}: {
  mbr: number;
  target: number;
  onTargetChange: (v: number) => void;
  submitError: string | null;
}) {
  // Food deficit = how much below MBR the user plans to eat
  const foodDeficit = mbr - target;
  // Minimum weekly loss from food restriction alone (activity adds on top)
  const minWeeklyLossKg = (foodDeficit * 7) / 7700;

  type Zone = 'light' | 'recommended' | 'intensive';
  const zone: Zone = foodDeficit < 100 ? 'light'
    : foodDeficit < 250 ? 'recommended'
    : 'intensive';

  const zoneLabel: Record<Zone, string> = {
    light:       'déficit léger',
    recommended: 'recommandé',
    intensive:   'intensif',
  };
  const zoneHint: Record<Zone, string> = {
    light:       "l'activité crée l'essentiel du déficit",
    recommended: '100 – 250 kcal / j depuis l\'assiette',
    intensive:   '250 – 400 kcal / j depuis l\'assiette',
  };
  const zoneColor: Record<Zone, string> = {
    light:       'var(--ink-2)',
    recommended: 'var(--green)',
    intensive:   'var(--orange)',
  };

  // Slider anchored on MBR : from MBR−400 to MBR
  const sliderMin = Math.round((mbr - 400) / 50) * 50;
  const sliderMax = Math.round(mbr / 50) * 50;
  const sliderRange = sliderMax - sliderMin;

  useEffect(() => {
    const clamped = Math.max(sliderMin, Math.min(sliderMax, target));
    if (clamped !== target) onTargetChange(clamped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderMin, sliderMax]);

  const ZONE_SEGMENTS = [
    { upTo: mbr - 250, color: 'var(--orange)', label: 'intensif'   },
    { upTo: mbr - 100, color: 'var(--green)',  label: 'recommandé' },
    { upTo: sliderMax, color: 'var(--ink-3)',  label: 'léger'      },
  ];

  type Segment = { from: number; to: number; color: string; label: string };
  const segments: Segment[] = [];
  let cursor = sliderMin;
  for (const seg of ZONE_SEGMENTS) {
    const to = Math.min(sliderMax, Math.max(sliderMin, seg.upTo));
    if (to > cursor) {
      segments.push({ from: cursor, to, color: seg.color, label: seg.label });
      cursor = to;
    }
    if (cursor >= sliderMax) break;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ResultStat
          label="MBR"
          sublabel="au repos"
          tooltip="Métabolisme de Base au Repos — calories que ton corps brûle juste pour fonctionner (cœur, cerveau, chaleur). Tu trackeras toute activité au jour le jour."
          value={formatNumber(Math.round(mbr))}
          suffix="kcal"
        />
        <ResultStat
          label="déficit alim. / j"
          sublabel="depuis l'assiette"
          tooltip="Déficit créé uniquement par ton alimentation (MBR − objectif). À ça s'ajoutent chaque jour tes pas et séances de sport."
          value={foodDeficit > 0 ? `−${formatNumber(Math.round(foodDeficit))}` : `+${formatNumber(Math.round(-foodDeficit))}`}
          suffix="kcal"
        />
      </div>

      {/* Target card */}
      <div style={{
        background: 'var(--orange-tint)',
        border: '1px solid var(--orange-soft)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 18px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>objectif alimentaire</div>
            <div className="display tabular" style={{
              fontSize: 44, fontWeight: 500, color: 'var(--ink)',
              lineHeight: 1, letterSpacing: '-0.025em',
            }}>
              {formatNumber(target)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5 }}>kcal / jour</div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: 2 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 5 }}>perte min. alim.</div>
            <div className="display tabular" style={{
              fontSize: 26, fontWeight: 500, lineHeight: 1,
              color: minWeeklyLossKg > 0.02 ? 'var(--green)' : 'var(--ink-2)',
            }}>
              −{Math.abs(minWeeklyLossKg).toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>kg / sem. (alim.)</div>
          </div>
        </div>

        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: '1px solid var(--orange-soft)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: 999,
            background: zoneColor[zone], flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: zoneColor[zone] }}>
            {zoneLabel[zone]}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {zoneHint[zone]}</span>
        </div>
      </div>

      {/* Slider */}
      <div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>ajuste si tu veux</div>
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={50}
          value={Math.max(sliderMin, Math.min(sliderMax, target))}
          onChange={e => onTargetChange(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--orange)', cursor: 'pointer', display: 'block' }}
        />

        {/* Zone colour bar */}
        <div style={{ display: 'flex', height: 5, borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{
              width: `${((seg.to - seg.from) / sliderRange) * 100}%`,
              background: seg.color,
              opacity: 0.35,
            }} />
          ))}
        </div>

        {/* Zone labels aligned to segment centres */}
        <div style={{ position: 'relative', height: 16, marginTop: 3 }}>
          {segments.map((seg, i) => {
            const centerPct = (((seg.from + seg.to) / 2) - sliderMin) / sliderRange * 100;
            return (
              <span key={i} style={{
                position: 'absolute',
                left: `${centerPct}%`,
                transform: 'translateX(-50%)',
                fontSize: 9, color: seg.color,
                fontWeight: 600, whiteSpace: 'nowrap',
                opacity: 0.8,
              }}>
                {seg.label}
              </span>
            );
          })}
        </div>

        {/* Min / max kcal labels */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: 'var(--ink-3)', marginTop: 4,
        }}>
          <span className="tabular">{formatNumber(sliderMin)} kcal · déficit max</span>
          <span className="tabular">MBR · {formatNumber(sliderMax)} kcal</span>
        </div>
      </div>

      {submitError && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--red-soft)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--red)',
          fontSize: 13,
        }}>
          {submitError}
        </div>
      )}
    </div>
  );
}

function ResultStat({ label, sublabel, tooltip, value, suffix }: {
  label: string; sublabel?: string; tooltip?: string; value: string; suffix: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--paper-2)',
      border: '1px solid var(--hairline-2)',
      borderRadius: 'var(--radius)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {label}
        </span>
        {sublabel && (
          <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{sublabel}</span>
        )}
        {tooltip && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              marginLeft: 2,
              width: 14, height: 14, borderRadius: 999,
              background: open ? 'var(--orange-soft)' : 'var(--paper-3)',
              border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: open ? 'var(--orange)' : 'var(--ink-3)',
              fontSize: 9, fontWeight: 700, lineHeight: 1,
              fontFamily: 'var(--font-body)',
            }}
            aria-label="en savoir plus"
          >
            ?
          </button>
        )}
      </div>

      {open && tooltip && (
        <div style={{
          marginTop: 6,
          fontSize: 11, color: 'var(--ink-2)',
          lineHeight: 1.5,
          padding: '6px 8px',
          background: 'var(--paper)',
          borderRadius: 6,
          border: '1px solid var(--hairline-2)',
        }}>
          {tooltip}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <span className="display tabular" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>
          {value}
        </span>
        <span className="tabular" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
    </div>
  );
}
