'use client';

/**
 * HomeClient.tsx — Keel Welcome screen.
 * Animated illustration + auto-cycling "How it works" steps.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeelMark } from '@/components/keel/icons';

const BARS = [58, 36, 84, 30, 68, 48, 42];
const SVG_W = 280, SVG_H = 88, PAY_Y = 26, BAR_W = 28;
const GAP = (SVG_W - BARS.length * BAR_W) / (BARS.length + 1);

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M7 10l5-5 5 5" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 19h14" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    title: 'Log what comes in',
    body: 'Add invoices, gigs, and payments as they arrive.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 12 Q8 6 12 12 Q16 18 21 12" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" />
        <path d="M3 12 h18" stroke="var(--pine)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="var(--pine)" />
      </svg>
    ),
    title: 'Get a steady paycheck',
    body: 'Keel sets a smooth monthly wage from your real history.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="var(--pine)" strokeWidth="1.8" />
        <path d="M8 6V4M16 6V4" stroke="var(--pine)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 11h4M6 15h6M14 15h4" stroke="var(--pine)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    title: 'Know what\'s ahead',
    body: 'See your runway, big costs, and tax set-aside — all live.',
  },
];

export function HomeClient(): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
      setAnimKey((k) => k + 1);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  function goStep(i: number) {
    setStep(i);
    setAnimKey((k) => k + 1);
  }

  return (
    <div
      data-theme="light"
      style={{
        height: '100dvh',
        background: 'var(--bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes k-rise { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes k-bar  { from { transform:scaleY(0); } to { transform:scaleY(1); } }
        @keyframes k-draw { to   { stroke-dashoffset:0; } }
        @keyframes k-fade { from { opacity:0; } to { opacity:1; } }
        @keyframes k-step { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .k-rise { animation: k-rise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .k-step { animation: k-step 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Logo */}
      <div
        className="k-rise"
        style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: 10, animationDelay: '0ms' }}
      >
        <KeelMark size={28} />
        <span className="serif" style={{ fontSize: 21, color: 'var(--pine)', letterSpacing: 0.3 }}>Keel</span>
      </div>

      {/* Centre */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>

        {/* Chart illustration */}
        <div className="k-rise" style={{ marginBottom: 28, animationDelay: '80ms' }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', overflow: 'visible' }}>
            {BARS.map((h, i) => {
              const x = GAP + i * (BAR_W + GAP);
              return (
                <rect key={i} x={x} y={SVG_H - h} width={BAR_W} height={h} rx={6}
                  fill="var(--pine-soft)"
                  style={{
                    transformBox: 'fill-box', transformOrigin: 'bottom center',
                    animation: `k-bar 0.5s cubic-bezier(0.22,1,0.36,1) both`,
                    animationDelay: `${180 + i * 55}ms`,
                  }}
                />
              );
            })}
            <path d={`M0,${PAY_Y} L${SVG_W},${PAY_Y}`}
              stroke="var(--pine)" strokeWidth="2" fill="none" strokeLinecap="round"
              strokeDasharray={SVG_W}
              style={{ strokeDashoffset: SVG_W, animation: `k-draw 0.75s cubic-bezier(0.4,0,0.2,1) 720ms both` }}
            />
            <text x={SVG_W - 2} y={PAY_Y - 8} textAnchor="end"
              fill="var(--muted)" fontSize={9} fontFamily="var(--font-ui)" fontWeight={600} letterSpacing={0.4}
              style={{ animation: 'k-fade 0.5s ease 1400ms both', opacity: 0 }}
            >
              YOUR PAYCHECK
            </text>
          </svg>
        </div>

        {/* Headline */}
        <div className="k-rise serif" style={{
          fontSize: 'clamp(32px, 9vw, 46px)', lineHeight: 1.06, color: 'var(--ink)',
          letterSpacing: -0.5, marginBottom: 10, animationDelay: '260ms',
        }}>
          Money that looks forward.
        </div>
        <p className="k-rise" style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--muted)', animationDelay: '380ms' }}>
          Calm. Steady. Yours.
        </p>

        {/* ── How it works ── */}
        <div
          className="k-rise"
          style={{
            animationDelay: '480ms',
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            borderRadius: 18,
            padding: '18px 20px 16px',
          }}
        >
          {/* Step content — keyed to re-animate on change */}
          <div key={animKey} className="k-step" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'var(--pine-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {STEPS[step].icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                {STEPS[step].title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.45 }}>
                {STEPS[step].body}
              </div>
            </div>
          </div>

          {/* Dot indicators + step counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Step ${i + 1}`}
                  onClick={() => goStep(i)}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === step ? 'var(--pine)' : 'var(--hairline)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1), background 0.3s',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
              {step + 1} / {STEPS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div
        className="k-rise"
        style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 10, animationDelay: '560ms' }}
      >
        <button type="button" onClick={() => router.push('/onboarding')}
          style={{
            width: '100%', padding: '16px', borderRadius: 'var(--r-pill)',
            background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
            fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Get started
        </button>
        <button type="button" onClick={() => router.push('/signin')}
          style={{
            width: '100%', padding: '14px', borderRadius: 'var(--r-pill)',
            background: 'var(--surface)', border: '1px solid var(--hairline)',
            color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 15,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          I have an account
        </button>
      </div>
    </div>
  );
}
