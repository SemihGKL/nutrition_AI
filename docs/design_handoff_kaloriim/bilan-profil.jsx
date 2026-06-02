/* global React, Card, StreakChip, PipStrip, PrimaryCTA, Chevron, Flame, Check, BottomNav, SidebarNav, Bars, MBRGauge */
const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Bilan (Récap) — mobile
// ─────────────────────────────────────────────────────────────
function BilanMobile({ dark = false }) {
  const days = [
    { d: 'Lun', net: 1720, ok: true,  delta: '−80' },
    { d: 'Mar', net: 2010, ok: false, delta: '+210' },
    { d: 'Mer', net: 1690, ok: true,  delta: '−110' },
    { d: 'Jeu', net: 1740, ok: true,  delta: '−60' },
    { d: 'Ven', net: 1650, ok: true,  delta: '−150' },
    { d: 'Sam', net: 1820, ok: true,  delta: '+20' },
    { d: 'Dim', net: 1660, ok: true,  delta: '−140' },
  ];

  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label="Bilan mobile"
      style={{
        width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px 6px', fontSize: 14, fontWeight: 600 }}>
        <span className="tabular">9:41</span><span style={{ opacity: 0.6 }}>•••</span>
      </div>

      <div style={{ padding: '12px 20px 4px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.4 }}>récap · semaine 18</div>
        <div className="display" style={{ fontSize: 24, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>
          ta semaine en clair
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 20px' }}>
        {/* Headline kg lost */}
        <div style={{
          background: 'var(--green-tint)', border: '1px solid var(--green-soft)',
          borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3 }}>perte de poids</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span className="display tabular" style={{ fontSize: 48, fontWeight: 500, color: 'var(--green)', lineHeight: 1, letterSpacing: '-0.025em' }}>−0,4</span>
            <span style={{ fontSize: 16, color: 'var(--ink-2)' }}>kg</span>
          </div>
          <div className="tabular" style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>
            82,4 → 82,0 kg · sur 7 jours
          </div>
        </div>

        {/* Day-by-day table */}
        <Card padding={16} style={{ marginBottom: 14 }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>jour par jour</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {days.map((d, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 10,
                alignItems: 'center', padding: '10px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--hairline-2)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{d.d}</span>
                <span className="tabular" style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{d.net.toLocaleString('fr-FR').replace(',', ' ')} <span style={{ color: 'var(--ink-3)', fontSize: 11, fontWeight: 500 }}>kcal</span></span>
                <span className="tabular" style={{
                  fontSize: 12, fontWeight: 600,
                  color: d.ok ? 'var(--green)' : 'var(--red)',
                }}>{d.delta}</span>
                <span style={{
                  width: 18, height: 18, borderRadius: 999,
                  background: d.ok ? 'var(--green-soft)' : 'var(--red-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {d.ok
                    ? <Check size={11} color="var(--green)" strokeWidth={2.5}/>
                    : <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>×</span>}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Coherence reading */}
        <Card padding={16} style={{ marginBottom: 14, background: 'var(--orange-tint)', borderColor: 'var(--orange-soft)' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.3, marginBottom: 6 }}>lecture de cohérence</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: 'var(--ink)' }}>
            déficit cumulé <span className="tabular" style={{ color: 'var(--orange)' }}>−980 kcal</span>
            <br/>perte attendue <span className="tabular">~0,13 kg</span>
            <br/>perte réelle <span className="tabular" style={{ color: 'var(--green)' }}>−0,4 kg</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.5 }}>
            écart probablement lié à l'eau et au glycogène — c'est normal.
          </div>
        </Card>

        {/* Theoretical vs real */}
        <Card padding={16} style={{ marginBottom: 14 }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>théorique vs réel</div>
          <BarRow label="déficit théorique" value="−980 kcal" pct={45} color="var(--ink-2)"/>
          <div style={{ height: 10 }}/>
          <BarRow label="déficit réel" value="−2 800 kcal" pct={100} color="var(--green)"/>
        </Card>

        {/* Share button */}
        <button style={{
          width: '100%', height: 48, borderRadius: 12,
          background: 'transparent', border: '1px solid var(--hairline)',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink-2)',
          cursor: 'pointer',
        }}>partager mon récap</button>
      </div>

      <BottomNav active="bilan"/>
      <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
        <div style={{ width: 110, height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)' }}/>
      </div>
    </div>
  );
}

function BarRow({ label, value, pct, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{label}</span>
        <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--paper-3)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, opacity: 0.85 }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profil — mobile (read mode)
// ─────────────────────────────────────────────────────────────
function ProfilMobile({ dark = false }) {
  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label="Profil mobile"
      style={{
        width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)',
        fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px 6px', fontSize: 14, fontWeight: 600 }}>
        <span className="tabular">9:41</span><span style={{ opacity: 0.6 }}>•••</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: 'var(--orange-tint)',
            border: '1px solid var(--orange-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22,
            color: 'var(--orange)', letterSpacing: '-0.02em',
          }}>JM</div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>jeanmi</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>jm@mail.fr</div>
          </div>
        </div>

        {/* Streak summary */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <StreakChip count={42} size="lg"/>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px',
            height: 40, borderRadius: 999, background: 'var(--paper-2)',
            border: '1px solid var(--hairline-2)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>record</span>
            <span className="tabular" style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>56 j</span>
          </div>
        </div>

        {/* Infos */}
        <div className="display" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8 }}>tes infos</div>
        <Card padding={0} style={{ marginBottom: 18 }}>
          <ProfileRow label="Âge" value="28 ans"/>
          <ProfileRow label="Taille" value="178 cm"/>
          <ProfileRow label="Poids départ" value="82,4 kg"/>
          <ProfileRow label="Poids actuel" value="82,0 kg" trailing={<span className="tabular" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>−0,4</span>}/>
          <ProfileRow label="Activité" value="Légèrement actif" last/>
        </Card>

        {/* Calculs */}
        <div className="display" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8 }}>tes calculs</div>
        <Card padding={0} style={{ marginBottom: 18 }}>
          <ProfileRow label="MBR" value="1 880 kcal"/>
          <ProfileRow label="TDEE" value="2 350 kcal"/>
          <ProfileRow label="Objectif" value="1 800 kcal/j"/>
          <ProfileRow label="Déficit MBR" value="" trailing={
            <span style={{ padding: '2px 10px', borderRadius: 999, background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600, fontSize: 12 }}>−4 %</span>
          } last/>
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SecondaryAction label="Modifier mon profil"/>
          <SecondaryAction label="Recalculer mon MBR"/>
        </div>
      </div>

      <BottomNav active="profil"/>
      <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
        <div style={{ width: 110, height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)' }}/>
      </div>
    </div>
  );
}

function ProfileRow({ label, value, trailing, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--hairline-2)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value && <span className="tabular" style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{value}</span>}
        {trailing}
      </span>
    </div>
  );
}

function SecondaryAction({ label }) {
  return (
    <button style={{
      width: '100%', height: 52, borderRadius: 12,
      background: 'var(--paper-2)', border: '1px solid var(--hairline-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px',
      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)',
      cursor: 'pointer',
    }}>
      <span>{label}</span>
      <Chevron dir="right" size={14} color="var(--ink-3)"/>
    </button>
  );
}

// Profil desktop
function ProfilDesktop({ dark = false }) {
  return (
    <div data-theme={dark ? 'dark' : 'light'}
      data-screen-label="Profil desktop"
      style={{ width: '100%', height: '100%', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'var(--font-body)', display: 'flex' }}>
      <SidebarNav active="profil"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 999,
            background: 'var(--orange-tint)', border: '1px solid var(--orange-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, color: 'var(--orange)',
          }}>JM</div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>jeanmi</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>jm@mail.fr · membre depuis fév. 2026</div>
          </div>
          <StreakChip count={42} size="lg"/>
          <button style={{
            height: 44, padding: '0 18px', borderRadius: 10,
            background: 'transparent', border: '1px solid var(--hairline)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)',
            cursor: 'pointer',
          }}>éditer</button>
          <button style={{
            height: 44, padding: '0 18px', borderRadius: 10,
            background: 'var(--orange)', border: 'none',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#fff',
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
          }}>recalculer MBR</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card padding={20}>
            <div className="display" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4 }}>infos personnelles</div>
            <ProfileRow label="Âge" value="28 ans"/>
            <ProfileRow label="Taille" value="178 cm"/>
            <ProfileRow label="Poids départ" value="82,4 kg"/>
            <ProfileRow label="Poids actuel" value="82,0 kg" trailing={<span className="tabular" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>−0,4</span>}/>
            <ProfileRow label="Activité" value="Légèrement actif" last/>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card padding={20}>
              <div className="display" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4 }}>calculs</div>
              <ProfileRow label="MBR" value="1 880 kcal"/>
              <ProfileRow label="TDEE" value="2 350 kcal"/>
              <ProfileRow label="Objectif" value="1 800 kcal/j"/>
              <ProfileRow label="Déficit MBR" value="" trailing={
                <span style={{ padding: '2px 10px', borderRadius: 999, background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600, fontSize: 12 }}>−4 %</span>
              } last/>
            </Card>
            <Card padding={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="display" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', letterSpacing: 0.3, textTransform: 'uppercase' }}>progression</span>
                <span className="tabular" style={{ fontSize: 12, color: 'var(--ink-3)' }}>14 derniers jours</span>
              </div>
              <PipStrip days={['hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','today','future']} size={20} gap={8}/>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BilanMobile, ProfilMobile, ProfilDesktop });
