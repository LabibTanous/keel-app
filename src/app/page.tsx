'use client';

/**
 * page.tsx — Keel Welcome screen.
 * Port of keel_handoff/design_reference/components/Welcome.jsx (welcome view only).
 * Full-viewport, no iOS frame, no Dock.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { KeelMark } from '@/components/keel/icons';

export default function WelcomePage(): React.ReactElement {
  const router = useRouter();

  return (
    <div
      data-theme="light"
      style={{
        height: '100dvh',
        background: 'var(--pine)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Logo top-left */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <KeelMark size={36} />
        <span
          className="serif"
          style={{ fontSize: 26, color: 'var(--on-pine)', letterSpacing: 0.3 }}
        >
          Keel
        </span>
      </div>

      {/* Center content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 28px',
        }}
      >
        <div
          className="serif"
          style={{
            fontSize: 40,
            lineHeight: 1.08,
            color: 'var(--on-pine)',
            letterSpacing: -0.5,
            marginBottom: 20,
          }}
        >
          Money that looks forward.
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            lineHeight: 1.55,
            color: 'var(--on-pine)',
            opacity: 0.72,
            maxWidth: 300,
          }}
        >
          A calm, honest plan for freelance income — steady pay, set before the money arrives.
        </p>
      </div>

      {/* Bottom buttons */}
      <div
        style={{
          padding: '0 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          onClick={() => router.push('/onboarding')}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: 'var(--r-pill)',
            cursor: 'pointer',
            background: 'var(--on-pine)',
            color: 'var(--pine)',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Get started
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 'var(--r-pill)',
            textAlign: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--on-pine)',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
            opacity: 0.8,
          }}
        >
          I have an account
        </button>
      </div>
    </div>
  );
}
