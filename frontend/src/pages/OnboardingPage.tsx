import { useState, useEffect } from 'react';
import { Field } from '../components/ui/Field';
import { PrimaryCTA } from '../components/ui/PrimaryCTA';
import { Chevron } from '../components/ui/icons';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { formatNumber } from '../utils/format';
import { computeMbr, computeTdee, suggestedTarget } from '../utils/mbr';

const ACTIVITIES = [
  { value: 'SEDENTARY',         label: 'Sédentaire',       hint: 'peu / pas de sport' },
  { value: 'LIGHTLY_ACTIVE',    label: 'Légèrement actif', hint: '1–3 j/sem' },
  { value: 'MODERATELY_ACTIVE', label: 'Modérément actif', hint: '3–5 j/sem' },
  { value: 'VERY_ACTIVE',       label: 'Très actif',       hint: '6–7 j/sem' },
  { value: 'EXTREMELY_ACTIVE',  label: 'Extrême',          hint: 'sportif·ve pro' },
];

interface Props {
  onDone: () => void;
  onBack: () => void;
}

interface FormState {
  username: string;
  email: string;
  password: string;
  age: string;
  height: string;
  weight: string;
  gender: 'MALE' | 'FEMALE';
  activity: string;
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
    activity: 'MODERATELY_ACTIVE',
    target: 1800,
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const mbr = form.age && form.height && form.weight
    ? computeMbr(parseFloat(form.weight), parseFloat(form.height), parseInt(form.age), form.gender)
    : 0;

  const tdee = mbr ? computeTdee(mbr, form.activity) : 0;

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
    if (step === 2) {
      const computed = suggestedTarget(mbr, tdee);
      set('target', computed);
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const { token } = await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        activityLevel: form.activity,
        startWeight: parseFloat(form.weight),
        weightGoal: 0,
      });
      await login(token);
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
      minHeight: '100dvh',
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
          étape {step} / 3
        </div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, marginTop: 4, letterSpacing: '-0.02em' }}>
          {step === 1 && 'tes infos'}
          {step === 2 && "niveau d'activité"}
          {step === 3 && 'voici tes chiffres'}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
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
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACTIVITIES.map(a => (
              <ActivityCard
                key={a.value}
                label={a.label}
                hint={a.hint}
                selected={form.activity === a.value}
                onClick={() => set('activity', a.value)}
              />
            ))}
          </div>
        )}

        {step === 3 && (
          <Step3
            mbr={mbr}
            tdee={tdee}
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
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {step === 3 ? (isSubmitting ? 'création…' : "c'est parti") : 'continuer'}
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
      {[1, 2, 3].map(i => (
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

function ActivityCard({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        height: 64,
        padding: '0 16px',
        background: selected ? 'var(--orange-tint)' : 'var(--paper-2)',
        border: `1px solid ${selected ? 'var(--orange)' : 'var(--hairline-2)'}`,
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 140ms linear',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        border: `2px solid ${selected ? 'var(--orange)' : 'var(--hairline)'}`,
        background: selected ? 'var(--orange)' : 'transparent',
        position: 'relative',
        flexShrink: 0,
      }}>
        {selected && (
          <div style={{ position: 'absolute', inset: 4, borderRadius: 999, background: 'var(--paper)' }} />
        )}
      </div>
      <div style={{ flex: 1, lineHeight: 1.25 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>
      </div>
    </button>
  );
}

function Step3({
  mbr,
  tdee,
  target,
  onTargetChange,
  submitError,
}: {
  mbr: number;
  tdee: number;
  target: number;
  onTargetChange: (v: number) => void;
  submitError: string | null;
}) {
  const dailyDeficit = tdee - target;
  const weeklyLossKg = (dailyDeficit * 7) / 7700;
  const belowMbr = target < mbr;

  type Zone = 'danger' | 'flat' | 'light' | 'recommended' | 'intensive' | 'aggressive';
  const zone: Zone = belowMbr ? 'danger'
    : dailyDeficit < 100 ? 'flat'
    : dailyDeficit < 300 ? 'light'
    : dailyDeficit <= 500 ? 'recommended'
    : dailyDeficit <= 750 ? 'intensive'
    : 'aggressive';

  const zoneLabel: Record<Zone, string> = {
    danger:      'en dessous du MBR',
    flat:        'sans déficit',
    light:       'déficit léger',
    recommended: 'recommandé',
    intensive:   'intensif',
    aggressive:  'trop agressif',
  };
  const zoneHint: Record<Zone, string> = {
    danger:      'risque de carences',
    flat:        'maintien du poids',
    light:       '< 300 kcal / j de déficit',
    recommended: '300 – 500 kcal / j de déficit',
    intensive:   '500 – 750 kcal / j de déficit',
    aggressive:  'risque de carences',
  };
  const zoneColor: Record<Zone, string> = {
    danger:      'var(--red)',
    flat:        'var(--ink-3)',
    light:       'var(--ink-2)',
    recommended: 'var(--green)',
    intensive:   'var(--orange)',
    aggressive:  'var(--red)',
  };

  // Dynamic range anchored on the user's real numbers
  const sliderMin = Math.round(mbr / 50) * 50;
  const sliderMax = Math.round(tdee / 50) * 50;
  const sliderRange = sliderMax - sliderMin;

  // Clamp target into range when component first mounts
  useEffect(() => {
    const clamped = Math.max(sliderMin, Math.min(sliderMax, target));
    if (clamped !== target) onTargetChange(clamped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderMin, sliderMax]);

  // Zone colour segments between sliderMin and sliderMax
  const ZONE_SEGMENTS = [
    { upTo: tdee - 750, color: 'var(--red)',    label: 'agressif'    },
    { upTo: tdee - 500, color: 'var(--orange)', label: 'intensif'    },
    { upTo: tdee - 300, color: 'var(--green)',  label: 'recommandé'  },
    { upTo: sliderMax,  color: 'var(--ink-3)',  label: 'léger'       },
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
          tooltip="Métabolisme de Base au Repos — calories que ton corps brûle juste pour fonctionner (cœur, cerveau, chaleur). Ne jamais descendre en dessous."
          value={formatNumber(Math.round(mbr))}
          suffix="kcal"
        />
        <ResultStat
          label="TDEE"
          sublabel="avec activité"
          tooltip="Total Daily Energy Expenditure — ton MBR multiplié par ton niveau d'activité. C'est ce que tu brûles vraiment par jour."
          value={formatNumber(Math.round(tdee))}
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
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>objectif suggéré</div>
            <div className="display tabular" style={{
              fontSize: 44, fontWeight: 500, color: 'var(--ink)',
              lineHeight: 1, letterSpacing: '-0.025em',
            }}>
              {formatNumber(target)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5 }}>kcal / jour</div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: 2 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 5 }}>perte estimée</div>
            <div className="display tabular" style={{
              fontSize: 26, fontWeight: 500, lineHeight: 1,
              color: weeklyLossKg > 0.05 ? 'var(--green)' : weeklyLossKg < -0.05 ? 'var(--red)' : 'var(--ink-2)',
            }}>
              {weeklyLossKg > 0 ? '−' : '+'}{Math.abs(weeklyLossKg).toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>kg / semaine</div>
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
          <span className="tabular">{formatNumber(sliderMin)} kcal · MBR</span>
          <span className="tabular">TDEE · {formatNumber(sliderMax)} kcal</span>
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
