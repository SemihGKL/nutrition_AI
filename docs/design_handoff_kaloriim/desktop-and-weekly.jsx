/* global React, ProgressRing, StreakChip, PipStrip, MBRGauge, Stepper, Card, PrimaryCTA, Flame, Check, Chevron, KWordmark */
const { useState } = React;

// ─────────────────────────────────────────────────────────────
// SidebarNav — desktop nav
// ─────────────────────────────────────────────────────────────
function SidebarNav({ active = 'jour' }) {
  const items = [
    { id: 'jour',    label: 'Jour' },
    { id: 'semaine', label: 'Semaine' },
    { id: 'bilan',   label: 'Bilan' },
    { id: 'profil',  label: 'Profil' },
  ];
  return (
    <div style={{
      width: 220, padding: '32px 20px',
      borderRight: '1px solid var(--hairline-2)',
      display: 'flex', flexDirection: 'column', gap: 4,
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 12px 24px' }}>
        <KWordmark size={26}/>
      </div>
      {items.map(it => {
        const a = it.id === active;
        return (
          <button key={it.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', height: 40, border: 'none',
            background: a ? 'var(--paper-2)' : 'transparent',
            borderRadius: 10, cursor: 'pointer',
            color: a ? 'var(--orange)' : 'var(--ink-2)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: a ? 600 : 500,
            textAlign: 'left',
          }}>
            {a && <Chevron dir="right" size={12} color="var(--orange)"/>}
            {!a && <span style={{ width: 12, display: 'inline-block' }}/>}
            {it.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }}/>
      <div style={{
        padding: 14, background: 'var(--paper-2)',
        border: '1px solid var(--hairline-2)', borderRadius: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.3 }}>série en cours</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="display tabular" style={{ fontSize: 28, fontWeight: 500, color: 'var(--orange)', lineHeight: 1 }}>42</span>
          <Flame size={20} color="var(--orange)"/>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DashboardDesktop
// ─────────────────────────────────────────────────────────────
function DashboardDesktop({ dark = false }) {
  const [calories, setCalories] = useState(1650);
  const [steps, setSteps] = useState(8240);
  const [burned, setBurned] = useState(300);
  const target = 1800;
  const days14 = ['hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','today','future'];

  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label="Dashboard desktop"
      style={{
        width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)', display: 'flex',
      }}>
      <SidebarNav active="jour"/>

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 48px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', letterSpacing: 0.3 }}>vendredi</div>
            <div className="display" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em' }}>
              2 mai 2026
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={iconBtnD()}><Chevron dir="left" size={14} color="var(--ink-2)"/></button>
            <button style={{ ...iconBtnD(), opacity: 0.4 }}><Chevron dir="right" size={14} color="var(--ink-2)"/></button>
            <div style={{ width: 1, height: 24, background: 'var(--hairline)' }}/>
            <button style={{
              height: 40, padding: '0 18px', background: 'var(--orange)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-sm)',
            }}>
              <Check size={14} color="#fff" strokeWidth={2.2}/> Confirmer la journée
            </button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Ring card */}
          <Card padding={28}>
            <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <ProgressRing value={calories} target={target} size={200} stroke={13}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', letterSpacing: 0.3 }}>aujourd'hui</div>
                <div className="display" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>
                  −150 kcal restantes
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <DStat label="Net" value={`${(calories - burned).toLocaleString('fr-FR').replace(',', ' ')} kcal`} tone="ink"/>
                  <DStat label="Déficit MBR" value="−12 %" tone="green"/>
                </div>
              </div>
            </div>
          </Card>

          {/* Saisie card */}
          <Card padding={28}>
            <div className="display" style={{ fontSize: 17, fontWeight: 500, marginBottom: 16 }}>saisie du jour</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Stepper label="Calories" value={calories} onChange={setCalories} suffix="kcal" step={50}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Stepper label="Pas" value={steps} onChange={setSteps} suffix="" step={500}/>
                <Stepper label="Brûlées" value={burned} onChange={setBurned} suffix="kcal" step={50}/>
              </div>
            </div>
          </Card>
        </div>

        {/* Pip strip card */}
        <Card padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>14 derniers jours</div>
              <div className="display" style={{ fontSize: 17, fontWeight: 500, marginTop: 2 }}>série en cours</div>
            </div>
            <StreakChip count={42} size="lg"/>
          </div>
          <PipStrip days={days14} size={20} gap={8}/>
        </Card>
      </div>
    </div>
  );
}
const iconBtnD = () => ({
  width: 36, height: 36, borderRadius: 999,
  background: 'transparent', border: '1px solid var(--hairline)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});

function DStat({ label, value, tone }) {
  const c = tone === 'green' ? 'var(--green)' : tone === 'red' ? 'var(--red)' : 'var(--ink)';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</span>
      <span className="tabular" style={{ fontSize: 16, fontWeight: 600, color: c }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WeeklyMobile — bars + pip strip
// ─────────────────────────────────────────────────────────────
const WEEK = [
  { d: 'L', net: 1720, met: true },
  { d: 'M', net: 2010, met: false },
  { d: 'M', net: 1690, met: true },
  { d: 'J', net: 1740, met: true },
  { d: 'V', net: 1650, met: true },
  { d: 'S', net: 580,  met: true, partial: true },
  { d: 'D', net: 0,    met: null, future: true },
];
const TARGET = 1800;
const WEEK_MAX = 2200;

function Bars({ data = WEEK, target = TARGET, max = WEEK_MAX, h = 200 }) {
  return (
    <div style={{ position: 'relative', height: h, padding: '8px 0 24px' }}>
      {/* objective line */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: ((max - target) / max) * (h - 32) + 8,
        height: 0, borderTop: '1.5px dashed var(--orange)',
      }}>
        <span style={{
          position: 'absolute', right: -8, top: -10, fontSize: 10,
          color: 'var(--orange)', background: 'var(--paper)',
          padding: '2px 4px', letterSpacing: 0.3,
        }}>obj.</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: h - 24, gap: 8 }}>
        {data.map((d, i) => {
          const heightPct = d.future ? 4 : Math.max(6, (d.net / max) * 100);
          const color =
            d.future ? 'var(--paper-3)' :
            d.partial ? 'var(--paper-3)' :
            d.met ? 'var(--green-soft)' : 'var(--red-soft)';
          const border =
            d.future ? '1px dashed var(--hairline)' :
            d.partial ? '1px solid var(--hairline)' :
            'none';
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                <div style={{
                  width: '100%', maxWidth: 32, height: `${heightPct}%`,
                  background: color, border,
                  borderRadius: '6px 6px 2px 2px',
                }}/>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8, letterSpacing: 0.4 }}>{d.d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyMobile({ dark = false }) {
  const days14 = ['hit','hit','hit','miss','hit','hit','hit','hit','hit','hit','hit','hit','today','future'];
  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label="Semaine mobile"
      style={{
        width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px 6px', fontSize: 14, fontWeight: 600 }}>
        <span className="tabular">9:41</span><span style={{ opacity: 0.6 }}>•••</span>
      </div>

      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>semaine 18</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>
            28 avr → 4 mai
          </div>
        </div>
        <StreakChip count={42}/>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 20px' }}>
        <Card padding={16} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, letterSpacing: 0.3 }}>kcal nettes / jour</div>
          <Bars/>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <MiniStat label="moy." value="1 740" suffix="kcal"/>
          <MiniStat label="déficit/j" value="−60" suffix="kcal" tone="green"/>
          <MiniStat label="objectif" value="1 800" suffix="kcal" muted/>
        </div>

        <Card padding={16} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="display" style={{ fontSize: 15, fontWeight: 500 }}>14 derniers jours</span>
            <span className="tabular" style={{ fontSize: 12, color: 'var(--ink-3)' }}>13 / 14 ✓</span>
          </div>
          <PipStrip days={days14} size={18} gap={6} twoRow={false}/>
          <div style={{
            marginTop: 14, padding: 12, borderRadius: 10,
            background: 'var(--orange-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>prochain palier</div>
              <div className="display tabular" style={{ fontSize: 18, fontWeight: 600, color: 'var(--orange)', marginTop: 2 }}>
                50 jours
              </div>
            </div>
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--paper)', overflow: 'hidden' }}>
                <div style={{ width: '84%', height: '100%', background: 'var(--orange)' }}/>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, textAlign: 'right' }}>+8 jours</div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav active="semaine"/>
      <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
        <div style={{ width: 110, height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)' }}/>
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix, tone, muted }) {
  const c = tone === 'green' ? 'var(--green)' : tone === 'red' ? 'var(--red)' : muted ? 'var(--ink-2)' : 'var(--ink)';
  return (
    <div style={{
      padding: '12px 14px', background: 'var(--paper-2)',
      border: '1px solid var(--hairline-2)', borderRadius: 12,
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span className="display tabular" style={{ fontSize: 18, fontWeight: 600, color: c }}>{value}</span>
        <span className="tabular" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
    </div>
  );
}

// WeeklyDesktop
function WeeklyDesktop({ dark = false }) {
  const days14 = ['hit','hit','hit','miss','hit','hit','hit','hit','hit','hit','hit','hit','today','future'];
  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label="Semaine desktop"
      style={{ width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'var(--font-body)', display: 'flex' }}>
      <SidebarNav active="semaine"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', letterSpacing: 0.3 }}>semaine 18</div>
            <div className="display" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em' }}>28 avril → 4 mai</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={iconBtnD()}><Chevron dir="left" size={14} color="var(--ink-2)"/></button>
            <button style={iconBtnD()}><Chevron dir="right" size={14} color="var(--ink-2)"/></button>
            <StreakChip count={42} size="lg"/>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
          <Card padding={28}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>kcal nettes / jour</span>
              <span className="tabular" style={{ fontSize: 13, color: 'var(--ink-3)' }}>objectif 1 800</span>
            </div>
            <Bars h={260}/>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card padding={20}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>moyenne</div>
              <div className="display tabular" style={{ fontSize: 32, fontWeight: 500, marginTop: 4 }}>1 740 <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>kcal</span></div>
            </Card>
            <Card padding={20}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>déficit moyen / j</div>
              <div className="display tabular" style={{ fontSize: 32, fontWeight: 500, marginTop: 4, color: 'var(--green)' }}>−60 <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>kcal</span></div>
            </Card>
            <Card padding={20}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>jours tenus</div>
              <div className="display tabular" style={{ fontSize: 32, fontWeight: 500, marginTop: 4 }}>5 <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>/ 6</span></div>
            </Card>
          </div>
        </div>

        <Card padding={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="display" style={{ fontSize: 18, fontWeight: 500 }}>14 derniers jours</span>
            <span className="tabular" style={{ fontSize: 13, color: 'var(--ink-3)' }}>prochain palier 50 j · +8 jours</span>
          </div>
          <PipStrip days={days14} size={26} gap={10}/>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardDesktop, WeeklyMobile, WeeklyDesktop, SidebarNav, Bars });
