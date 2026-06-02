'use client';

/**
 * HomeClient.tsx — Keel Welcome screen (light theme, matches app).
 * Animated: income bars stagger in, paycheck line draws, text fades up.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { KeelMark } from '@/components/keel/icons';

const BARS = [58, 36, 84, 30, 68, 48, 42];
const SVG_W = 280;
const SVG_H = 88;
const PAY_Y  = 26;
const BAR_W  = 28;
const GAP    = (SVG_W - BARS.length * BAR_W) / (BARS.length + 1);

export function HomeClient(): React.ReactElement {
  const router = useRouter();

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
        @keyframes k-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes k-bar {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes k-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes k-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .k-rise { animation: k-rise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Logo */}
      <div
        className="k-rise"
        style={{ padding: '28px 24px 0', display: 'flex', alignItems: 'center', gap: 10, animationDelay: '0ms' }}
      >
        <KeelMark size={30} />
        <span className="serif" style={{ fontSize: 22, color: 'var(--pine)', letterSpacing: 0.3 }}>
          Keel
        </span>
      </div>

      {/* Centre */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>

        {/* Income illustration */}
        <div className="k-rise" style={{ marginBottom: 40, animationDelay: '80ms' }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', overflow: 'visible' }}>
            {/* Irregular bars */}
            {BARS.map((h, i) => {
              const x = GAP + i * (BAR_W + GAP);
              return (
                <rect
                  key={i}
                  x={x} y={SVG_H - h} width={BAR_W} height={h} rx={6}
                  fill="var(--pine-soft)"
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'bottom center',
                    animation: `k-bar 0.5s cubic-bezier(0.22,1,0.36,1) both`,
                    animationDelay: `${180 + i * 60}ms`,
                  }}
                />
              );
            })}

            {/* Paycheck line draws left → right */}
            <path
              d={`M0,${PAY_Y} L${SVG_W},${PAY_Y}`}
              stroke="var(--pine)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={SVG_W}
              style={{ strokeDashoffset: SVG_W, animation: `k-draw 0.75s cubic-bezier(0.4,0,0.2,1) 760ms both` }}
            />

            {/* Label */}
            <text
              x={SVG_W - 2} y={PAY_Y - 8}
              textAnchor="end"
              fill="var(--muted)"
              fontSize={9.5}
              fontFamily="var(--font-ui)"
              fontWeight={600}
              letterSpacing={0.4}
              style={{ animation: 'k-fade 0.5s ease 1400ms both', opacity: 0 }}
            >
              YOUR PAYCHECK
            </text>
          </svg>
        </div>

        {/* Headline */}
        <div
          className="k-rise serif"
          style={{
            fontSize: 'clamp(36px, 10.5vw, 52px)',
            lineHeight: 1.05,
            color: 'var(--ink)',
            letterSpacing: -0.6,
            marginBottom: 14,
            animationDelay: '280ms',
          }}
        >
          Money that looks forward.
        </div>

        {/* Short subtext */}
        <p
          className="k-rise"
          style={{ margin: 0, fontSize: 15.5, color: 'var(--muted)', animationDelay: '400ms' }}
        >
          Calm. Steady. Yours.
        </p>
      </div>

      {/* Buttons */}
      <div
        className="k-rise"
        style={{ padding: '0 24px 44px', display: 'flex', flexDirection: 'column', gap: 12, animationDelay: '540ms' }}
      >
        <button
          type="button"
          onClick={() => router.push('/onboarding')}
          style={{
            width: '100%', padding: '17px',
            borderRadius: 'var(--r-pill)',
            cursor: 'pointer',
            background: 'var(--pine)',
            color: 'var(--on-pine)',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Get started
        </button>
        <button
          type="button"
          onClick={() => router.push('/signin')}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 'var(--r-pill)',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            cursor: 'pointer',
            color: 'var(--ink)',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
          }}
        >
          I have an account
        </button>
      </div>
    </div>
  );
}
