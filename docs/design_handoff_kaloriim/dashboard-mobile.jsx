/* global React, ProgressRing, StreakChip, PipStrip, Stepper, Card, BottomNav, DateHeader, PrimaryCTA, MBRGauge, Flame, Check, Chevron, KWordmark */

const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Dashboard Mobile — primary state (in-progress, can edit)
// ─────────────────────────────────────────────────────────────
function DashboardMobile({ dark = false, state = 'progress' }) {
  // state = 'progress' | 'over' | 'confirmed' | 'empty'
  const [calories, setCalories] = useState(state === 'empty' ? 0 : state === 'over' ? 2050 : 1650);
  const [steps, setSteps] = useState(state === 'empty' ? 0 : 8240);
  const [burned, setBurned] = useState(state === 'empty' ? 0 : 300);
  const target = 1800;

  const ratio = calories / target;
  const remaining = target - calories;
  const status = ratio <= 1 ? 'good' : ratio <= 1.15 ? 'warn' : 'over';

  const days14 = [
    'hit','hit','hit','hit','hit','hit','hit',
    'hit','hit','hit','hit','hit','today','future',
  ];

  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label={`Dashboard mobile · ${state}${dark ? ' · dark' : ''}`}
      style={{
        width: '100%', height: '100%',
        background: 'var(--paper)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

      {/* Status bar (iOS-style) */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px 6px', fontSize: 14, fontWeight: 600,
        color: 'var(--ink)',
      }}>
        <span className="tabular">9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: 0.85 }}>
          <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
            <rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/>
            <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor"/>
            <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill="currentColor"/>
            <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/>
          </svg>
          <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
            <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" opacity="0.5"/>
            <rect x="2" y="2" width="14" height="7" rx="1.5" fill="currentColor"/>
            <rect x="22" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* Top bar — date + streak */}
      <div style={{ padding: '10px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>vendredi</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>2 mai</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button style={miniBtn(dark)} aria-label="précédent"><Chevron dir="left" size={14} color="var(--ink-2)"/></button>
          <StreakChip count={42} size="md"/>
          <button style={{...miniBtn(dark), opacity: 0.4}} aria-label="suivant"><Chevron dir="right" size={14} color="var(--ink-2)"/></button>
        </div>
      </div>

      {/* Main scroll area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 20px' }}>

        {/* Ring hero */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 10 }}>
          <ProgressRing
            value={calories || 0}
            target={target}
            size={232}
            stroke={14}
            status={state === 'empty' ? 'good' : status}
          />
        </div>

        {/* contextual message */}
        <div style={{
          textAlign: 'center', fontSize: 14, color: 'var(--ink-2)',
          marginTop: 4, marginBottom: 18, lineHeight: 1.4,
        }}>
          {state === 'empty' && <span>commence ta journée — saisis tes calories</span>}
          {state === 'progress' && <>il te reste <span className="tabular" style={{ color: 'var(--green)', fontWeight: 600 }}>150 kcal</span> aujourd'hui</>}
          {state === 'over' && <>dépassement de <span className="tabular" style={{ color: 'var(--red)', fontWeight: 600 }}>250 kcal</span> — pas grave</>}
        </div>

        {/* MBR gauge tucked under ring */}
        <Card padding={14} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>déficit vs MBR</span>
            <span className="tabular" style={{
              fontSize: 14, fontWeight: 600,
              color: status === 'good' ? 'var(--green)' : status === 'warn' ? 'var(--amber)' : 'var(--red)',
            }}>
              {state === 'empty' ? '—' : status === 'good' ? '−12 %' : status === 'warn' ? '+3 %' : '+9 %'}
            </span>
          </div>
          <MBRGauge pct={state === 'empty' ? -12 : status === 'good' ? -12 : status === 'warn' ? 3 : 9}/>
        </Card>

        {/* Saisie */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="display" style={{ fontSize: 17, fontWeight: 500 }}>saisie du jour</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.4 }}>auto-enregistré</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <Stepper label="Calories consommées" value={calories} onChange={setCalories} suffix="kcal" step={50}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Stepper label="Pas" value={steps} onChange={setSteps} suffix="" step={500}/>
            <Stepper label="Brûlées" value={burned} onChange={setBurned} suffix="kcal" step={50}/>
          </div>
        </div>

        {/* Bilan net */}
        {burned > 0 && calories > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', marginBottom: 16,
            background: 'var(--paper-2)', borderRadius: 'var(--radius)',
            border: '1px solid var(--hairline-2)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>bilan net</span>
            <span className="tabular" style={{
              fontSize: 16, fontWeight: 600, color: 'var(--ink)',
              letterSpacing: 0.2,
            }}>{(calories - burned).toLocaleString('fr-FR').replace(',', ' ')} <span style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 12 }}>kcal</span></span>
          </div>
        )}

        {/* CTA */}
        <PrimaryCTA
          onClick={() => {}}
          tone="orange"
          icon={<Check size={18} color="#fff" strokeWidth={2.2}/>}
          disabled={calories === 0}>
          Confirmer ma journée
        </PrimaryCTA>

        <div style={{ height: 12 }} />
      </div>

      <BottomNav active="jour" />

      {/* home indicator */}
      <div style={{
        height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 6, background: 'var(--paper)',
      }}>
        <div style={{
          width: 110, height: 4, borderRadius: 999,
          background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)',
        }}/>
      </div>
    </div>
  );
}
const miniBtn = (dark) => ({
  width: 30, height: 30, borderRadius: 999,
  background: 'transparent', border: '1px solid var(--hairline)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});

// ─────────────────────────────────────────────────────────────
// Dashboard Mobile — Confirmed state with celebration
// ─────────────────────────────────────────────────────────────
function DashboardMobileConfirmed({ dark = false }) {
  const days14 = [
    'hit','hit','hit','hit','hit','hit','hit',
    'hit','hit','hit','hit','hit','hit','today',
  ];
  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label={`Dashboard mobile · confirmed${dark ? ' · dark' : ''}`}
      style={{
        width: '100%', height: '100%',
        background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '14px 24px 6px', fontSize: 14, fontWeight: 600,
      }}>
        <span className="tabular">9:41</span>
        <span style={{ opacity: 0.6, fontSize: 12 }}>•••</span>
      </div>

      <div style={{ padding: '10px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>jeudi</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, marginTop: 2 }}>1 mai</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999,
          background: 'var(--green-soft)', color: 'var(--green)',
          fontSize: 13, fontWeight: 600,
        }}>
          <Check size={14} color="var(--green)" strokeWidth={2.2}/>
          confirmé
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 20px' }}>
        {/* Celebration card */}
        <div style={{
          background: 'var(--orange-tint)',
          border: '1px solid var(--orange-soft)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 18,
        }}>
          {/* subtle confetti */}
          <Confetti />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>série en cours</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
              <span className="display tabular" style={{
                fontSize: 56, fontWeight: 500, color: 'var(--orange)', lineHeight: 1, letterSpacing: '-0.03em',
              }}>43</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <Flame size={26} color="var(--orange)" />
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>jours d'affilée — record perso : 56j</div>
            <div style={{ height: 1, background: 'var(--orange-soft)', margin: '14px 0' }} />
            <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 8 }}>14 derniers jours</div>
            <PipStrip days={days14} size={16} gap={6} twoRow={true}/>
          </div>
        </div>

        {/* Bilan du jour */}
        <div style={{ marginBottom: 18 }}>
          <div className="display" style={{ fontSize: 17, fontWeight: 500, marginBottom: 12 }}>bilan du jour</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BilanRow label="Consommé" value="1 800" suffix="kcal"/>
            <BilanRow label="Brûlé" value="300" suffix="kcal" muted/>
            <div style={{ height: 1, background: 'var(--hairline-2)' }}/>
            <BilanRow label="Net" value="1 500" suffix="kcal" emphasis="ink"/>
            <BilanRow label="Déficit MBR" value="−380" suffix="kcal" emphasis="green" trailing={
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 999,
                background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600,
              }}>−20 % ✓</span>
            }/>
          </div>
        </div>

        {/* Prochain palier */}
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>prochain palier</span>
            <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color: 'var(--orange)' }}>50 j</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--paper-3)', overflow: 'hidden' }}>
            <div style={{
              width: `${(43/50)*100}%`, height: '100%',
              background: 'var(--orange)', borderRadius: 999,
            }}/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>+7 jours pour débloquer le badge "demi-siècle"</div>
        </Card>
      </div>

      <BottomNav active="jour" />
      <div style={{
        height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 6, background: 'var(--paper)',
      }}>
        <div style={{ width: 110, height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)' }}/>
      </div>
    </div>
  );
}

function BilanRow({ label, value, suffix, emphasis, trailing, muted }) {
  const valColor =
    emphasis === 'green' ? 'var(--green)' :
    emphasis === 'red'   ? 'var(--red)' :
    muted ? 'var(--ink-2)' : 'var(--ink)';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {trailing}
        <span className="tabular" style={{
          fontSize: 17, fontWeight: emphasis ? 600 : 500, color: valColor,
        }}>{value} <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{suffix}</span></span>
      </div>
    </div>
  );
}

function Confetti() {
  // tiny static confetti dots top-right
  const dots = [
    { x: 88, y: 12, c: 'var(--orange)', s: 4 },
    { x: 80, y: 28, c: 'var(--green)', s: 3 },
    { x: 92, y: 36, c: 'var(--amber)', s: 5 },
    { x: 78, y: 52, c: 'var(--orange)', s: 3 },
    { x: 68, y: 18, c: 'var(--amber)', s: 4 },
    { x: 70, y: 40, c: 'var(--orange)', s: 3 },
    { x: 96, y: 60, c: 'var(--green)', s: 3 },
    { x: 60, y: 8,  c: 'var(--orange)', s: 2 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${d.x}%`, top: `${d.y}%`,
          width: d.s, height: d.s, borderRadius: 999, background: d.c, opacity: 0.85,
        }}/>
      ))}
    </div>
  );
}

Object.assign(window, { DashboardMobile, DashboardMobileConfirmed });
