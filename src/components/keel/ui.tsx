'use client';

/**
 * ui.tsx — Keel shared primitives.
 * TypeScript port of keel_handoff/design_reference/components/ui.jsx.
 *
 * RULES:
 * - All colors via CSS variables (var(--pine), var(--surface), …) — never hardcode hex.
 * - CCY rates, toAED, fmtFx, approxAED re-exported from engine.ts / fx.ts.
 */

import React, { CSSProperties } from 'react';
import { POT_KINDS } from '@/lib/engine';
import type { PotKind, PotBalances } from '@/lib/engine';

export const PAY_STATUS: Record<'set' | 'saving' | 'soon', { label: string; color: string }> = {
  set:    { label: 'Set aside', color: 'var(--mint)' },
  saving: { label: 'Saving',    color: 'var(--gold)' },
  soon:   { label: 'Not yet',   color: 'var(--clay)' },
};

// ── Pots (distribution-layer vocabulary) ────────────────────────────────────────
// Money is set aside IN-APP only — a virtual split, never a real bank transfer.
// Color mapping honors the theme: gold = goals, mint = buffer/positive, zakat = zakat,
// spending = the primary pine "what's left is yours"; bills = neutral fixed obligation.

export interface PotMeta { label: string; color: string; soft: string; blurb: string; }

export const POT_META: Record<PotKind, PotMeta> = {
  bills:    { label: 'Bills',    color: 'var(--muted)', soft: 'var(--surface-2)',                     blurb: 'Rent & essentials, covered first' },
  tax:      { label: 'Tax',      color: 'var(--clay)',  soft: 'var(--clay-soft)',                     blurb: 'Set aside so filing season never stings' },
  zakat:    { label: 'Zakat',    color: 'var(--zakat)', soft: 'var(--zakat-soft, rgba(46,110,107,0.12))', blurb: '2.5% of wealth, ready when due' },
  buffer:   { label: 'Buffer',   color: 'var(--mint)',  soft: 'var(--mint-soft, rgba(47,163,116,0.12))',  blurb: 'Your runway — the cushion that carries lean months' },
  goals:    { label: 'Goals',    color: 'var(--gold)',  soft: 'var(--gold-soft)',                     blurb: 'Quietly saving toward what you want' },
  spending: { label: 'Spending', color: 'var(--pine)',  soft: 'var(--pine-soft)',                     blurb: "What's left — genuinely yours to spend" },
};

export { POT_KINDS };
export type { PotKind, PotBalances };

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

// ── Pot ──────────────────────────────────────────────────────────────────────
// One pot's accumulated balance (the money set aside so far) with its this-month
// routing target as a quiet subline. Balance and target never contradict: balance
// is the fold of the ledger; target is this month's split from the anchored plan.

interface PotProps {
  kind: PotKind;
  balance: number;               // AED set aside so far (accumulated)
  monthlyTarget?: number;        // AED routed into this pot in a typical month
  note?: string;                 // overrides the default blurb
  style?: CSSProperties;
}

export function Pot({ kind, balance, monthlyTarget, note, style }: PotProps): React.ReactElement {
  const m = POT_META[kind];
  const overdrawn = balance < 0;
  const sub = monthlyTarget && monthlyTarget > 0
    ? `${money(monthlyTarget)}/mo set aside`
    : (note ?? m.blurb);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <span style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: m.soft, color: m.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{m.label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="serif tnum" style={{ fontSize: 16.5, color: overdrawn ? 'var(--clay)' : 'var(--ink)' }}>
          {money(balance)}
        </div>
        <div className="smallcaps" style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>set aside</div>
      </div>
    </div>
  );
}

// ── SplitFlow ──────────────────────────────────────────────────────────────────
// The routing moment: a received deposit fanning out into its pots. Honest framing —
// "set aside in-app", never "transferred". Reused on Home and the received flow.

interface SplitFlowProps {
  amount: number;          // deposit in AED
  split: PotBalances;      // per-pot AED for this deposit
  ccy?: string;            // native currency, if foreign
  srcAmount?: number;      // native amount, if foreign
  style?: CSSProperties;
}

export function SplitFlow({ amount, split, ccy, srcAmount, style }: SplitFlowProps): React.ReactElement {
  const foreign = ccy && ccy !== 'AED' && srcAmount != null;
  const rows = POT_KINDS
    .map((k) => [k, split[k]] as [PotKind, number])
    .filter(([, v]) => v > 0);
  return (
    <div style={style}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div className="smallcaps" style={{ color: 'var(--mint)', marginBottom: 6 }}>Received</div>
        <div className="serif tnum" style={{ fontSize: 40, color: 'var(--ink)', lineHeight: 1 }}>
          {foreign ? fmtFx(srcAmount!, ccy!) : <Cur n={amount} />}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
          {foreign ? `${approxAED(amount)} · ` : ''}splits automatically into your pots
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map(([k, v], i) => {
          const m = POT_META[k];
          return (
            <div
              key={k}
              className="rise"
              style={{
                animationDelay: `${140 + i * 90}ms`,
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 0',
                borderTop: i ? '1px solid var(--hairline)' : 'none',
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 3, background: m.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14.5, color: 'var(--ink)' }}>{m.label}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>→</span>
              <span className="serif tnum" style={{ fontSize: 15.5, color: 'var(--ink)', minWidth: 78, textAlign: 'right' }}>
                {money(v)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
