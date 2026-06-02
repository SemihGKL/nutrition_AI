/* global React, Field, PrimaryCTA, Chevron, KWordmark */
const { useState } = React;

// Onboarding — 3 steps
function StepBar({ step, total = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 999,
          background: i < step ? 'var(--orange)' : i === step - 1 ? 'var(--orange)' : 'var(--hairline)',
          transition: 'background 240ms',
        }}/>
      ))}
    </div>
  );
}

function SegmentedToggle({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', padding: 4, gap: 4,
      background: 'var(--paper-3)', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--hairline-2)',
    }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            flex: 1, height: 44, border: 'none', borderRadius: 'calc(var(--radius-sm) - 2px)',
            background: active ? 'var(--paper)' : 'transparent',
            color: active ? 'var(--ink)' : 'var(--ink-2)',
            fontWeight: active ? 600 : 500,
            fontSize: 14, cursor: 'pointer',
            boxShadow: active ? 'var(--shadow-sm)' : 'none',
            transition: 'all 160ms',
          }}>{opt.label}</button>
        );
      })}
    </div>
  );
}

function ActivityCard({ value, label, hint, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      width: '100%', height: 64, padding: '0 16px',
      background: selected ? 'var(--orange-tint)' : 'var(--paper-2)',
      border: `1px solid ${selected ? 'var(--orange)' : 'var(--hairline-2)'}`,
      borderRadius: 'var(--radius)',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 140ms',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        border: `2px solid ${selected ? 'var(--orange)' : 'var(--hairline)'}`,
        background: selected ? 'var(--orange)' : 'transparent',
        position: 'relative', flexShrink: 0,
      }}>
        {selected && <div style={{
          position: 'absolute', inset: 4, borderRadius: 999, background: 'var(--paper)',
        }}/>}
      </div>
      <div style={{ flex: 1, lineHeight: 1.25 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>
      </div>
    </button>
  );
}

const ACTIVITIES = [
  { value: 'sed',  label: 'Sédentaire',         hint: 'peu / pas de sport' },
  { value: 'leg',  label: 'Légèrement actif',   hint: '1–3 j/sem' },
  { value: 'mod',  label: 'Modérément actif',   hint: '3–5 j/sem' },
  { value: 'tre',  label: 'Très actif',         hint: '6–7 j/sem' },
  { value: 'ext',  label: 'Extrême',            hint: 'sportif·ve pro' },
];

// ─────────────────────────────────────────────────────────────
// OnboardingMobile — single step at a time
// ─────────────────────────────────────────────────────────────
function OnboardingMobile({ step = 1, dark = false }) {
  const [age, setAge] = useState('28');
  const [height, setHeight] = useState('178');
  const [weight, setWeight] = useState('82.4');
  const [gender, setGender] = useState('h');
  const [activity, setActivity] = useState('leg');
  const [target, setTarget] = useState(1800);

  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label={`Onboarding mobile · étape ${step}`}
      style={{
        width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px 6px', fontSize: 14, fontWeight: 600 }}>
        <span className="tabular">9:41</span>
        <span style={{ opacity: 0.6 }}>•••</span>
      </div>

      <div style={{ padding: '12px 24px 0' }}>
        <StepBar step={step}/>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14, letterSpacing: 0.4 }}>
          étape {step} / 3
        </div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, marginTop: 4, letterSpacing: '-0.02em' }}>
          {step === 1 && 'tes infos physiques'}
          {step === 2 && "niveau d'activité"}
          {step === 3 && 'voici tes chiffres'}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Âge" value={age} onChange={setAge} hint="en années"/>
            <Field label="Taille (cm)" value={height} onChange={setHeight}/>
            <Field label="Poids de départ (kg)" value={weight} onChange={setWeight}/>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 6 }}>Genre</div>
              <SegmentedToggle
                value={gender}
                onChange={setGender}
                options={[{ value: 'h', label: 'Homme' }, { value: 'f', label: 'Femme' }]}
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACTIVITIES.map(a => (
              <ActivityCard key={a.value} {...a} selected={activity === a.value} onClick={() => setActivity(a.value)}/>
            ))}
          </div>
        )}
        {step === 3 && <Step3Result target={target} setTarget={setTarget}/>}
      </div>

      <div style={{
        display: 'flex', gap: 10, padding: '16px 24px 20px',
        borderTop: '1px solid var(--hairline-2)',
      }}>
        {step > 1 && (
          <button style={{
            height: 56, width: 80, borderRadius: 14,
            background: 'transparent', border: '1px solid var(--hairline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: 'var(--ink-2)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            <Chevron dir="left" size={14} color="var(--ink-2)"/> retour
          </button>
        )}
        <div style={{ flex: 1 }}>
          <PrimaryCTA tone="orange" icon={<Chevron dir="right" size={16} color="#fff" sw={2}/>}>
            {step === 3 ? "c'est parti" : 'continuer'}
          </PrimaryCTA>
        </div>
      </div>

      <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
        <div style={{ width: 110, height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)' }}/>
      </div>
    </div>
  );
}

function Step3Result({ target, setTarget }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ResultStat label="MBR" value="1 880" suffix="kcal"/>
        <ResultStat label="TDEE" value="2 350" suffix="kcal"/>
      </div>

      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 10 }}>objectif suggéré</div>
        <div style={{
          background: 'var(--orange-tint)', border: '1px solid var(--orange-soft)',
          borderRadius: 'var(--radius-md)', padding: '20px 18px',
          display: 'flex', alignItems: 'baseline', gap: 12, justifyContent: 'space-between',
        }}>
          <div>
            <div className="display tabular" style={{ fontSize: 44, fontWeight: 500, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.025em' }}>
              {target.toLocaleString('fr-FR').replace(',', ' ')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>kcal / jour</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>déficit</div>
            <div className="tabular" style={{ fontSize: 17, fontWeight: 600, color: 'var(--green)', marginTop: 4 }}>
              −4 % vs MBR
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
          <span>ajuste si tu veux</span>
          <span className="tabular">1 500 — 2 200</span>
        </div>
        <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--paper-3)', flex: 1, position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${((target - 1500) / 700) * 100}%`,
              background: 'var(--orange)', borderRadius: 999,
            }}/>
            <div style={{
              position: 'absolute', top: '50%',
              left: `${((target - 1500) / 700) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 22, height: 22, borderRadius: 999,
              background: 'var(--paper)', border: '2.5px solid var(--orange)',
              boxShadow: 'var(--shadow-sm)',
            }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ label, value, suffix }) {
  return (
    <div style={{
      padding: '14px 16px', background: 'var(--paper-2)',
      border: '1px solid var(--hairline-2)', borderRadius: 'var(--radius)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <span className="display tabular" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>{value}</span>
        <span className="tabular" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OnboardingDesktop — wizard with sidebar
// ─────────────────────────────────────────────────────────────
function OnboardingDesktop({ step = 2, dark = false }) {
  const [activity, setActivity] = useState('leg');
  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label={`Onboarding desktop · étape ${step}`}
      style={{
        width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)', display: 'flex',
      }}>
      {/* Sidebar */}
      <div style={{
        width: 260, padding: '40px 32px', borderRight: '1px solid var(--hairline-2)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <KWordmark size={28}/>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4, marginTop: 24, textTransform: 'uppercase' }}>onboarding</div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { i: 1, label: 'Physique' },
            { i: 2, label: 'Activité' },
            { i: 3, label: 'Objectif' },
          ].map(s => {
            const active = s.i === step;
            const done = s.i < step;
            return (
              <div key={s.i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 999,
                  background: active ? 'var(--orange)' : done ? 'var(--orange-soft)' : 'transparent',
                  border: `1.5px solid ${active || done ? 'var(--orange)' : 'var(--hairline)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: active ? '#fff' : 'var(--orange)',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {done ? '✓' : s.i}
                </div>
                <span style={{
                  fontSize: 14, color: active ? 'var(--ink)' : 'var(--ink-2)',
                  fontWeight: active ? 600 : 500,
                }}>{s.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          tes données restent sur l'appareil. on ne partage rien.
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '40px 64px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>étape {step}</div>
        <div className="display" style={{ fontSize: 36, fontWeight: 500, marginTop: 4, letterSpacing: '-0.02em', marginBottom: 32 }}>
          {step === 1 ? 'tes infos physiques' : step === 2 ? "niveau d'activité" : 'ton plan calorique'}
        </div>

        <div style={{ flex: 1, maxWidth: 540 }}>
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ACTIVITIES.map(a => (
                <ActivityCard key={a.value} {...a} selected={activity === a.value} onClick={() => setActivity(a.value)}/>
              ))}
            </div>
          )}
          {step === 3 && <Step3Result target={1800} setTarget={() => {}}/>}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button style={{
            height: 56, padding: '0 24px', borderRadius: 14,
            background: 'transparent', border: '1px solid var(--hairline)',
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--ink-2)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            <Chevron dir="left" size={14} color="var(--ink-2)"/> retour
          </button>
          <div style={{ flex: 1, maxWidth: 260 }}>
            <PrimaryCTA tone="orange" icon={<Chevron dir="right" size={16} color="#fff" sw={2}/>}>
              {step === 3 ? "c'est parti" : 'continuer'}
            </PrimaryCTA>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingMobile, OnboardingDesktop, ActivityCard, Step3Result });
