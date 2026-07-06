import { useState } from 'react';
import { NavRing, NavBars, NavReport, NavObjectifs, NavUser } from './icons';

interface Step {
  icon: React.ReactNode;
  bg: string;
  tag: string;
  tagColor: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: (
      <span style={{ fontFamily: 'var(--font-script)', fontStyle: 'italic', fontSize: 44, color: 'var(--orange)' }}>
        kaloriim
      </span>
    ),
    bg: 'var(--orange-tint)',
    tag: 'Bienvenue',
    tagColor: 'var(--orange)',
    title: 'Ton compagnon calorique',
    body: 'Un tour rapide pour que tu saches où tout se trouve. Tu peux le relire à tout moment depuis le profil.',
  },
  {
    icon: <NavRing active />,
    bg: 'var(--orange-tint)',
    tag: 'Jour',
    tagColor: 'var(--orange)',
    title: 'Saisis ton quotidien',
    body: 'Entre tes calories consommées, tes pas et tes calories brûlées au sport. Kaloriim calcule ton déficit en temps réel.',
  },
  {
    icon: <NavBars active />,
    bg: 'var(--green-tint)',
    tag: 'Semaine',
    tagColor: 'var(--green)',
    title: 'Vue hebdomadaire',
    body: 'Retrouve ici le récap de ta semaine et ton streak de jours consécutifs confirmés.',
  },
  {
    icon: <NavReport active />,
    bg: 'var(--amber-soft)',
    tag: 'Bilan',
    tagColor: 'var(--amber)',
    title: 'Suivi du poids',
    body: 'Enregistre ta pesée hebdomadaire et visualise ta trajectoire vers ton objectif de poids.',
  },
  {
    icon: <NavObjectifs active />,
    bg: 'var(--green-tint)',
    tag: 'Objectifs',
    tagColor: 'var(--green)',
    title: 'Tes habitudes',
    body: 'Crée des objectifs récurrents (sport, eau, sommeil…) et coche-les chaque jour.',
  },
  {
    icon: <NavUser active />,
    bg: 'var(--paper-2)',
    tag: 'Profil',
    tagColor: 'var(--ink-2)',
    title: 'Tes réglages',
    body: 'Consulte tes dépenses caloriques journalières estimées, ton objectif calorique et configure ton jour de pesée hebdomadaire.',
  },
];

interface Props {
  onDone: () => void;
}

export function TutorialOverlay({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function dismiss() {
    setExiting(true);
    setTimeout(onDone, 260);
  }

  function next() {
    if (isLast) { dismiss(); return; }
    setStep(s => s + 1);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(20,14,6,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 260ms ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--paper)',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 32px',
          boxShadow: 'var(--shadow-lg)',
          transform: exiting ? 'translateY(40px)' : 'translateY(0)',
          transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Skip button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
          {!isLast && (
            <button
              onClick={dismiss}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--ink-3)',
                fontFamily: 'var(--font-body)',
                padding: '4px 8px',
              }}
            >
              Passer
            </button>
          )}
        </div>

        {/* Illustration */}
        <div
          style={{
            margin: '8px 24px 0',
            borderRadius: 'var(--radius-lg)',
            background: current.bg,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 300ms ease',
          }}
        >
          <div style={{ transform: 'scale(2.8)', transformOrigin: 'center' }}>
            {current.icon}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 24px 0' }}>
          <span style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: current.tagColor,
            fontFamily: 'var(--font-body)',
            marginBottom: 8,
            transition: 'color 300ms ease',
          }}>
            {current.tag}
          </span>

          <h2 style={{
            margin: '0 0 10px',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 22,
            lineHeight: 1.25,
            color: 'var(--ink)',
          }}>
            {current.title}
          </h2>

          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            minHeight: 48,
          }}>
            {current.body}
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '20px 0 0' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? 'var(--orange)' : 'var(--hairline)',
                transition: 'width 200ms ease, background 200ms ease',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '16px 24px 0' }}>
          <button
            onClick={next}
            style={{
              width: '100%',
              padding: '14px 0',
              background: 'var(--orange)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: 0.2,
            }}
          >
            {isLast ? 'C\'est parti !' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}
