import { useState, useEffect } from 'react';
import { formatNumber } from '../../utils/format';

interface Props {
  mbr: number;
  target: number;
  onTargetChange: (v: number) => void;
  submitError?: string | null;
}

export function CalorieTargetStep({ mbr, target, onTargetChange, submitError }: Props) {
  const foodDeficit = mbr - target;
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
    recommended: "100 – 250 kcal / j depuis l'assiette",
    intensive:   '250 – 400 kcal / j depuis l\'assiette',
  };
  const zoneColor: Record<Zone, string> = {
    light:       'var(--ink-2)',
    recommended: 'var(--green)',
    intensive:   'var(--orange)',
  };

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
          description="ce que ton corps brûle pour fonctionner"
          tooltip="Métabolisme de Base au Repos — calories que ton corps brûle juste pour fonctionner (cœur, cerveau, chaleur). Tu trackeras toute activité au jour le jour."
          value={formatNumber(Math.round(mbr))}
          suffix="kcal"
        />
        <ResultStat
          label="déficit alim. / j"
          description="ce qu'on retire de l'assiette pour créer le déficit"
          uppercase={false}
          tooltip="Déficit créé uniquement par ton alimentation (MBR − objectif)."
          value={foodDeficit > 0 ? `−${formatNumber(Math.round(foodDeficit))}` : `+${formatNumber(Math.round(-foodDeficit))}`}
          suffix="kcal"
        />
      </div>

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

        <div style={{ display: 'flex', height: 5, borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{
              width: `${((seg.to - seg.from) / sliderRange) * 100}%`,
              background: seg.color,
              opacity: 0.35,
            }} />
          ))}
        </div>

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

function ResultStat({ label, sublabel, description, uppercase = true, tooltip, value, suffix }: {
  label: string;
  sublabel?: string;
  description?: string;
  uppercase?: boolean;
  tooltip?: string;
  value: string;
  suffix: string;
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
        <span style={{
          fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.4,
          textTransform: uppercase ? 'uppercase' : 'none',
        }}>
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

      {description && (
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.4 }}>
          {description}
        </div>
      )}

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
