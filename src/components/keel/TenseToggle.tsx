'use client';

/**
 * TenseToggle.tsx — Keel's signature Spent / Spending toggle.
 * TypeScript port of keel_handoff/design_reference/components/TenseToggle.jsx.
 *
 * Sliding thumb: forward = pine, back = var(--back-surface).
 * Transition: cubic-bezier(0.34, 1.32, 0.5, 1) — slight overshoot, calm.
 * Uses framer-motion animate for the thumb.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBack, IconForward } from './icons';

export type Tense = 'forward' | 'back';

interface TenseToggleProps {
  tense: Tense;
  onChange: (tense: Tense) => void;
}

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 22, mass: 0.8 };

export function TenseToggle({ tense, onChange }: TenseToggleProps): React.ReactElement {
  const forward = tense === 'forward';

  function halfStyle(active: boolean, plain: boolean): React.CSSProperties {
    return {
      flex: 1,
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '13px 13px',
      cursor: 'pointer',
      color: active
        ? (plain ? 'var(--ink)' : 'var(--on-pine)')
        : 'var(--muted)',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    };
  }

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-pill)',
      padding: 4,
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      {/* Sliding thumb via framer-motion */}
      <motion.div
        animate={{ x: forward ? '100%' : '0%' }}
        transition={SPRING}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 4,
          width: 'calc(50% - 4px)',
          borderRadius: 'var(--r-pill)',
          background: forward
            ? 'var(--pine)'
            : 'var(--back-surface)',
          boxShadow: forward
            ? '0 2px 8px rgba(31,77,58,0.28), inset 0 1px 0 rgba(255,255,255,0.12)'
            : '0 1px 2px rgba(0,0,0,0.10)',
        }}
      />

      {/* Spent (back) */}
      <div style={halfStyle(!forward, true)} onClick={() => onChange('back')}>
        <IconBack size={18} />
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>Spent</span>
      </div>

      {/* Spending (forward) */}
      <div style={halfStyle(forward, false)} onClick={() => onChange('forward')}>
        <IconForward size={18} />
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>Spending</span>
      </div>
    </div>
  );
}
