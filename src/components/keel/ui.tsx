'use client';

/**
 * ui.tsx — Keel shared primitives.
 * TypeScript port of keel_handoff/design_reference/components/ui.jsx.
 *
 * RULES:
 * - All colors via CSS variables (var(--pine), var(--surface), …) — never hardcode hex.
 * - BIG_PAYMENTS and PAY_STATUS imported from src/lib/demo-seed.ts.
 * - CCY rates, toAED, fmtFx, approxAED re-exported from engine.ts / fx.ts.
 */

import React, { CSSProperties } from 'react';

// ── Re-export BIG_PAYMENTS and PAY_STATUS from the canonical source ───────────
export { BIG_PAYMENTS } from '@/lib/demo-seed';
export type { BigPayment } from '@/lib/demo-seed';

export const PAY_STATUS: Record<'set' | 'saving' | 'soon', { label: string; color: string }> = {
  set:    { label: 'Set aside', color: 'var(--mint)' },
  saving: { label: 'Saving',    color: 'var(--gold)' },
  soon:   { label: 'Not yet',   color: 'var(--clay)' },
};

// ── Multi-currency ─────────────────────────────────────────────────────────────
// Re-export from engine.ts so that this file is the one-stop shop for UI helpers.
export { CCY_RATES as CCY, toAED } from '@/lib/engine';

export interface CcyEntry { sym: string; code: string; rate: number }

/** Map of CCY code → display info (sym is the short prefix/symbol). */
export const CCY_INFO: Record<string, CcyEntry> = {
  AED: { sym: 'AED', code: 'AED', rate: 1 },
  USD: { sym: '$',   code: 'USD', rate: 3.6725 },
  EUR: { sym: '€',   code: 'EUR', rate: 3.95 },
  GBP: { sym: '£',   code: 'GBP', rate: 4.62 },
  SAR: { sym: 'SAR', code: 'SAR', rate: 0.979 },
};

/**
 * Format a native-currency figure: "$2,450", "€600", "AED 5,500".
 * Mirrors fmtFx from ui.jsx exactly.
 */
export function fmtFx(n: number, ccy: string): string {
  const c = CCY_INFO[ccy] ?? CCY_INFO.AED;
  const v = Math.round(n).toLocaleString('en-US');
  return (ccy === 'AED' || ccy === 'SAR') ? `${c.sym} ${v}` : `${c.sym}${v}`;
}

/** "≈ AED 9,000" — the approximate-converted marker. */
export function approxAED(n: number): string {
  return '≈ AED ' + Math.round(n).toLocaleString('en-US');
}

// ── Money formatters ───────────────────────────────────────────────────────────

/** "AED 12,345" */
export function money(n: number): string {
  return 'AED ' + Math.round(n).toLocaleString('en-US');
}

/** "AED 14.5k" (removes .0 suffix) */
export function moneyK(n: number): string {
  return 'AED ' + (n / 1000).toFixed(1).replace('.0', '') + 'k';
}

/** Bare figure — no currency prefix. "12,345" */
export function amt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

// ── Cur ────────────────────────────────────────────────────────────────────────

/** Big-figure currency display: renders "AED" smaller than the numeric part. */
export function Cur({ n }: { n: number }): React.ReactElement {
  return (
    <>
      <span style={{ fontSize: '0.5em', fontWeight: 400, opacity: 0.6, marginRight: '0.16em', letterSpacing: 0 }}>
        AED
      </span>
      {amt(n)}
    </>
  );
}

// ── Disclaimer ─────────────────────────────────────────────────────────────────

interface DisclaimerProps {
  children?: React.ReactNode;
  style?: CSSProperties;
}

/** Quiet, unobtrusive estimate disclaimer. */
export function Disclaimer({ children, style }: DisclaimerProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)', ...style }}>
      <svg width="13" height="13" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1.5, opacity: 0.6 }}>
        <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
      </svg>
      <span>{children ?? 'Estimate — not tax or financial advice.'}</span>
    </div>
  );
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

interface SkProps {
  w?: string | number;
  h?: number;
  r?: number;
  mb?: number;
  style?: CSSProperties;
}

/** Single skeleton bar — calm pulsing loading state. */
export function Sk({ w = '100%', h = 13, r = 8, mb = 0, style }: SkProps): React.ReactElement {
  return (
    <div
      className="sk"
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb, ...style }}
    />
  );
}

interface SkCardProps {
  big?: boolean;
  lines?: number;
  style?: CSSProperties;
}

/** Card-shaped skeleton: optional large number placeholder, then text lines. */
export function SkCard({ big = false, lines = 3, style }: SkCardProps): React.ReactElement {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: 'var(--pad)', ...style }}>
      <Sk w={96} h={11} mb={big ? 16 : 14} />
      {big && <Sk w={170} h={34} r={10} mb={18} />}
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} w={i === lines - 1 ? '70%' : '100%'} mb={i === lines - 1 ? 0 : 10} />
      ))}
    </div>
  );
}

interface ScreenSkeletonProps {
  hero?: boolean;
  cards?: number;
}

/** Full-screen skeleton — drop in while data is loading. */
export function ScreenSkeleton({ hero = true, cards = 2 }: ScreenSkeletonProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {hero && (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: '22px var(--pad) 24px' }}>
          <Sk w={80} h={11} mb={14} />
          <Sk w={200} h={40} r={12} mb={16} />
          <Sk w="55%" />
        </div>
      )}
      {Array.from({ length: cards }).map((_, i) => (
        <SkCard key={i} lines={i === 0 ? 4 : 3} />
      ))}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: CSSProperties;
  tint?: string;
  className?: string;
}

/** Surface card — the primary container unit across every screen. */
export function Card({ children, style, tint, className = '' }: CardProps): React.ReactElement {
  return (
    <div
      className={className}
      style={{
        background: tint ?? 'var(--surface)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--pad)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Segmented ──────────────────────────────────────────────────────────────────

interface SegmentedOption {
  label: string;
  value: string;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Quiet pill-shaped segmented control. Thumb positioned by percentage. */
export function Segmented({ options, value, onChange }: SegmentedProps): React.ReactElement {
  const n = options.length;
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  return (
    <div style={{ position: 'relative', display: 'flex', background: 'var(--surface-2)', borderRadius: 'var(--r-pill)', padding: 4 }}>
      {/* sliding thumb */}
      <div style={{
        position: 'absolute', top: 4, bottom: 4,
        left: `calc(${(idx * 100) / n}% + 4px)`,
        width: `calc(${100 / n}% - 8px)`,
        background: 'var(--surface)', borderRadius: 'var(--r-pill)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
      {options.map(o => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1, position: 'relative', zIndex: 2, background: 'none', border: 'none',
            cursor: 'pointer', padding: '8px 6px', fontFamily: 'var(--font-ui)',
            fontSize: 13.5, fontWeight: 600,
            color: o.value === value ? 'var(--ink)' : 'var(--muted)',
            transition: 'color 0.3s ease',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Switch ─────────────────────────────────────────────────────────────────────

interface SwitchProps {
  on: boolean;
  onClick: () => void;
}

/** Pill toggle switch — pixel-translate thumb (no percentage jitter). */
export function Switch({ on, onClick }: SwitchProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={on ? 'Toggle off' : 'Toggle on'}
      aria-pressed={on}
      style={{
        width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? 'var(--pine)' : 'var(--surface-2)', position: 'relative',
        boxShadow: on ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: 3, width: 21, height: 21, borderRadius: '50%',
        background: on ? 'var(--on-pine)' : 'var(--surface)', boxShadow: 'var(--shadow-sm)',
        transform: on ? 'translateX(19px)' : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.5,1.3,0.5,1)',
        display: 'block',
      }} />
    </button>
  );
}
