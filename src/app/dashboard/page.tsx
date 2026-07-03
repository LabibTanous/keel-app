'use client';

/**
 * dashboard/page.tsx — Keel Home screen.
 * Forward view (Spending) + Back view (Spent), wired to TenseToggle.
 * No iOS frame wrapper. Renders directly in viewport.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlan } from '@/lib/store';
import { PAY_STATUS, money, moneyK, amt, approxAED, Card, Disclaimer, Pot, POT_META, POT_KINDS } from '@/components/keel/ui';
import type { PotKind } from '@/lib/engine';
import { TenseToggle } from '@/components/keel/TenseToggle';
import { Dock } from '@/components/keel/Dock';
import { IconAfford } from '@/components/keel/icons';
import { KEEL_OPEN_ADD, KEEL_OPEN_ASSISTANT } from '@/components/keel/GlobalOverlays';

// ── Outlook config ───────────────────────────────────────────────────────────

type OutlookKey = 'running lean' | 'on track' | 'strong';

interface OutlookCfg {
  dot: string;
  track: string;
  tone: 'warn' | 'calm' | 'good';
  accent: string;
  soft: string;
  lead: string;
  border: boolean;
}

const OUTLOOK_CFG: Record<OutlookKey, OutlookCfg> = {
  'running lean': {
    dot: 'var(--clay)', track: 'var(--clay)',
    tone: 'warn', accent: 'var(--clay)', soft: 'var(--clay-soft)', lead: 'Heads up',
    border: false,
  },
  'on track': {
    dot: 'var(--mint)', track: 'var(--mint)',
    tone: 'calm', accent: 'var(--mint)', soft: 'var(--surface)', lead: 'Looking ahead',
    border: true,
  },
  'strong': {
    dot: 'var(--gold)', track: 'var(--gold)',
    tone: 'good', accent: 'var(--gold)', soft: 'var(--gold-soft)', lead: 'Good news',
    border: false,
  },
};

function outlookText(outlook: string, interpretation: string): React.ReactNode {
  if (interpretation) {
    return <span>{interpretation}</span>;
  }
  if (outlook === 'running lean') {
    return <span>Income is light so far — your buffer keeps the plan whole.</span>;
  }
  if (outlook === 'strong') {
    return <span>Ahead of plan. A good moment to bank the extra.</span>;
  }
  return <span>On track. Keep an eye on what&apos;s coming in.</span>;
}

// ── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ insight, level }: { insight: string; level: 'warning' | 'tip' | 'success' }) {
  if (!insight) return null;
  const cfg = {
    warning: { bg: 'var(--clay-soft)', color: 'var(--clay)' },
    tip:     { bg: 'var(--gold-soft)', color: 'var(--gold)' },
    success: { bg: 'var(--surface)',   color: 'var(--pine)' },
  }[level];
  return (
    <div style={{
      background: cfg.bg, borderRadius: 'var(--r-card)',
      padding: '12px var(--pad)', fontSize: 13.5, lineHeight: 1.5,
      color: 'var(--ink)', border: level === 'success' ? '1px solid var(--hairline)' : 'none',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <span style={{ fontWeight: 700, color: 'var(--ink)', marginRight: 6 }}>
        {level === 'warning' ? 'Heads up' : level === 'tip' ? 'Note' : 'Good news'}
      </span>
      {insight}
    </div>
  );
}

// ── Signal card ──────────────────────────────────────────────────────────────

function SignalCard({ outlook, interpretation }: { outlook: string; interpretation: string }) {
  const key = (outlook as OutlookKey) in OUTLOOK_CFG ? (outlook as OutlookKey) : 'on track';
  const cfg = OUTLOOK_CFG[key];
  const filled = cfg.tone === 'warn' || cfg.tone === 'good';

  return (
    <div style={{
      background: cfg.soft,
      borderRadius: 'var(--r-card)',
      padding: '16px var(--pad)',
      boxShadow: 'var(--shadow-sm)',
      border: cfg.border ? '1px solid var(--hairline)' : 'none',
      display: 'flex', gap: 13, alignItems: 'flex-start',
    }}>
      <span style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: filled ? cfg.accent : 'var(--pine-soft)',
        color: filled ? '#fff' : 'var(--pine)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
          <path d="M16.2 7.8a6 6 0 0 1 0 8.4M19 5a10 10 0 0 1 0 14M7.8 16.2a6 6 0 0 1 0-8.4M5 19a10 10 0 0 1 0-14"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="smallcaps" style={{ color: cfg.accent, marginBottom: 5 }}>{cfg.lead}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)' }}>{outlookText(outlook, interpretation)}</div>
      </div>
    </div>
  );
}

// ── Range band ───────────────────────────────────────────────────────────────

function RangeBand({
  lean, likely, strong, paycheck, tracking, trackColor,
}: {
  lean: number; likely: number; strong: number;
  paycheck: number; tracking: number; trackColor: string;
}) {
  const lo = lean - 200, hi = strong + 200, span = hi - lo;
  const pct = (v: number) => `${((v - lo) / span) * 100}%`;
  const b1 = (lean + likely) / 2;
  const b2 = (likely + strong) / 2;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
        <span className="smallcaps">This month&apos;s range</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>income, honestly</span>
      </div>

      {/* Paycheck pin above band */}
      <div style={{ position: 'relative', height: 34 }}>
        <div style={{
          position: 'absolute', left: pct(paycheck),
          transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pine)', letterSpacing: 0.2 }}>
            Paycheck {money(paycheck)}
          </div>
          <div style={{ width: 2, height: 12, background: 'var(--pine)', margin: '4px auto 0', borderRadius: 2 }} />
        </div>
      </div>

      {/* Band */}
      <div style={{ position: 'relative', height: 16, borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: pct(b1), background: 'var(--clay-soft)' }} />
        <div style={{ width: `calc(${pct(b2)} - ${pct(b1)})`, background: 'var(--pine-soft)' }} />
        <div style={{ flex: 1, background: 'var(--gold-soft)' }} />
        {/* paycheck line through band */}
        <div style={{
          position: 'absolute', top: -2, bottom: -2, left: pct(paycheck),
          width: 2.5, background: 'var(--pine)', borderRadius: 2,
        }} />
      </div>

      {/* "so far this month" marker */}
      {tracking != null && (
        <div style={{ position: 'relative', height: 22, marginTop: 5 }}>
          <div style={{
            position: 'absolute', left: pct(tracking),
            transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap',
            transition: 'left 0.6s cubic-bezier(0.5,1.1,0.5,1)',
          }}>
            <div style={{
              width: 0, height: 0, margin: '0 auto',
              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
              borderBottom: `6px solid ${trackColor || 'var(--mint)'}`,
            }} />
            <div style={{ fontSize: 10.5, fontWeight: 600, color: trackColor || 'var(--mint)', marginTop: 3 }}>
              {moneyK(tracking)} so far
            </div>
          </div>
        </div>
      )}

      {/* Zone labels */}
      <div style={{ display: 'flex', marginTop: 12 }}>
        {([
          ['Lean', lean, 'var(--clay)'],
          ['Likely', likely, 'var(--ink)'],
          ['Strong', strong, 'var(--gold)'],
        ] as [string, number, string][]).map(([l, v, c], i) => (
          <div key={l} style={{ flex: 1, textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: c, letterSpacing: 0.04, textTransform: 'uppercase' }}>{l}</div>
            <div className="serif tnum" style={{ fontSize: 17, color: 'var(--ink)', marginTop: 1 }}>{moneyK(v)}</div>
          </div>
        ))}
      </div>

      <p style={{ margin: '16px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
        Set just below a <span style={{ color: 'var(--ink)', fontWeight: 600 }}>likely</span> month — so even a lean stretch still leaves the month working.
      </p>
    </div>
  );
}

// ── Pots section ─────────────────────────────────────────────────────────────
// The distribution layer, made visible: each received deposit splits into pots
// that accumulate. Bills are "covered first" (paid monthly, not a growing balance);
// Tax / Zakat / Buffer / Goals accumulate; Spending is the drawable pot.

function PotsSection() {
  const { plan, profile } = usePlan();
  const { allocation, paycheck, pots } = plan;
  const zakatOn = profile.zakatOn && allocation.zakat > 0;

  // Monthly routing target per pot (absolute AED; mirrors deriveRatios, sums to paycheck).
  const goalsTarget = Math.min(allocation.spending, plan.monthlyGoalContrib);
  const spendingTarget = Math.max(
    0,
    paycheck - allocation.rentAndBills - allocation.tax - allocation.zakat - allocation.buffer - goalsTarget,
  );
  const monthlyTargets: Record<PotKind, number> = {
    bills: allocation.rentAndBills,
    tax: allocation.tax,
    zakat: allocation.zakat,
    buffer: allocation.buffer,
    goals: goalsTarget,
    spending: spendingTarget,
  };

  // Full split shown in the proportion bar; Bills is a covered-first line, the rest
  // are accumulating pots (Spending drawable).
  const barKinds = POT_KINDS.filter((k) => {
    if (k === 'zakat') return zakatOn;
    if (k === 'tax') return monthlyTargets.tax > 0;
    if (k === 'goals') return monthlyTargets.goals > 0 || pots.balances.goals > 0;
    return true;
  });
  const accumulating: PotKind[] = ['tax', 'zakat', 'buffer', 'goals'].filter((k) => {
    if (k === 'zakat') return zakatOn;
    if (k === 'tax') return monthlyTargets.tax > 0 || pots.balances.tax > 0;
    if (k === 'goals') return monthlyTargets.goals > 0 || pots.balances.goals > 0;
    return true;
  }) as PotKind[];
  const barTotal = barKinds.reduce((s, k) => s + monthlyTargets[k], 0) || paycheck || 1;

  const hasBigPayments = plan.bigPayments.length > 0;
  const bigNeeded = plan.monthlyBigPaymentReserveNeeded;
  const bigReserve = plan.monthlyBigPaymentReserve;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h2 className="smallcaps" style={{ margin: 0 }}>Your pots</h2>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>split before it lands</span>
      </div>

      {/* proportion bar — the whole split at a glance (decorative; rows below are the data) */}
      <div aria-hidden="true" style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2, marginBottom: 16 }}>
        {barKinds.map((k) => (
          <div key={k} style={{ width: `${(monthlyTargets[k] / barTotal) * 100}%`, background: POT_META[k].color }} />
        ))}
      </div>

      {/* Bills — covered first (monthly, not an accumulating balance) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0',
        borderBottom: '1px solid var(--hairline)', marginBottom: 6,
      }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: POT_META.bills.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14.5, color: 'var(--ink)' }}>Bills</span>
        <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 8 }}>covered first</span>
        <span className="serif tnum" style={{ fontSize: 16.5, color: 'var(--ink)' }}>{money(monthlyTargets.bills)}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/mo</span></span>
      </div>

      {/* Accumulating set-aside pots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {accumulating.map((k) => (
          <Pot key={k} kind={k} balance={pots.balances[k]} monthlyTarget={monthlyTargets[k]} style={{ padding: '7px 0' }} />
        ))}
      </div>

      {/* Spending — the drawable pot, emphasized */}
      <div style={{
        marginTop: 10, padding: '13px 14px', borderRadius: 14,
        background: 'var(--pine-soft)', border: '1px solid var(--hairline)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--pine)', color: 'var(--on-pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--on-pine)' }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>Spending</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Yours to spend · {money(monthlyTargets.spending)}/mo</div>
        </div>
        <div className="serif tnum" style={{ fontSize: 18, color: 'var(--pine)' }}>{money(Math.max(0, pots.balances.spending))}</div>
      </div>

      {/* Honest gap: payments logged but the plan can't fully fund the set-aside */}
      {hasBigPayments && bigNeeded > bigReserve && (
        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 12,
          background: 'var(--clay-soft)', border: '1px solid var(--clay)',
          fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink)',
        }}>
          Your big payments need <strong>{approxAED(bigNeeded)}/mo</strong> set aside to be ready in time.
          {bigReserve > 0
            ? <> Your plan can spare <strong>{money(bigReserve)}</strong> — raise your paycheck or trim fixed costs to close the gap.</>
            : <> There&apos;s nothing free to set aside at this paycheck — raise it, trim fixed costs, or push a due date out.</>}
        </div>
      )}

      <Disclaimer style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--hairline)' }}>
        {zakatOn
          ? 'Pots are set aside in-app, not moved between bank accounts. Tax and Zakat figures are estimates you can refine in Profile — not tax or financial advice.'
          : 'Pots are set aside in-app, not moved between bank accounts. Tax figures are estimates you can refine in Profile — not tax or financial advice.'}
      </Disclaimer>
    </div>
  );
}

// ── Big payments preview ─────────────────────────────────────────────────────

function BigPaymentsForward() {
  const { plan } = usePlan();
  const payments = plan.bigPayments;
  const next = payments.slice(0, 2);
  const total = payments.reduce((s, p) => s + p.amt, 0);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span className="smallcaps">Big payments ahead</span>
        <Link href="/coming" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--pine)', textDecoration: 'none' }}>
          All {payments.length} →
        </Link>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
        Large costs Keel sets aside for before they land — so the gap never catches you out.
      </p>
      {payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)', fontSize: 13.5 }}>
          No big payments logged yet — tap + to add one.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {next.map((p, i) => {
              const st = PAY_STATUS[p.status];
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '11px 0', borderTop: i ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.m} · {money(p.amt)}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Coming up in all</span>
            <span className="serif tnum" style={{ fontSize: 17, color: 'var(--ink)' }}>{money(total)}</span>
          </div>
        </>
      )}
    </Card>
  );
}

// ── HomeForward ──────────────────────────────────────────────────────────────

const D = (i: number): React.CSSProperties => ({ animationDelay: `${i * 80}ms` });

function HomeForward() {
  const { plan, profile } = usePlan();
  const { paycheck, trackedThisMonth } = plan;

  const today = new Date();
  const dayOfMonth = today.getDate();
  const isLastWeek = dayOfMonth >= 24;
  const hasLoggedExpenses = plan.thisMonthExpenses > 0;
  const showPulse = isLastWeek && !hasLoggedExpenses;
  const isEmpty = profile.incomes.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Empty-state CTA — shown when no income data has been added yet */}
      {isEmpty && (
        <Link href="/import" className="rise focus-ring" style={{
          ...D(0),
          display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
          background: 'var(--pine-soft)', borderRadius: 'var(--r-card)',
          padding: '18px var(--pad)', border: '1px solid var(--hairline)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{
            width: 42, height: 42, borderRadius: 12, background: 'var(--pine)',
            color: 'var(--on-pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              Add income to see your paycheck
            </span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              Import a statement or log an invoice to get started.
            </span>
          </span>
          <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M1 1l6 6-6 6" stroke="var(--pine)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          </svg>
        </Link>
      )}
      {/* Hero paycheck */}
      <div className="rise" style={{
        ...D(0),
        background: 'var(--hero-bg)', color: 'var(--hero-ink)',
        borderRadius: 'var(--r-card)', padding: '22px var(--pad) 24px',
        boxShadow: 'var(--shadow)',
      }}>
        <div className="smallcaps" style={{ color: 'var(--hero-ink)', opacity: 0.7 }}>Paycheck</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
          <span className="serif tnum" style={{ fontSize: 54, fontWeight: 500, lineHeight: 0.95, letterSpacing: -1 }}>
            <span style={{ fontSize: 23, fontWeight: 400, opacity: 0.6, marginRight: 8, letterSpacing: 0 }}>AED</span>
            {amt(paycheck)}
          </span>
          <span style={{ fontSize: 17, opacity: 0.7 }}>/mo</span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 14.5, opacity: 0.82 }}>
          What&apos;s left after Keel splits your income — tax, buffer and goals already set aside.
          {plan.range.provisional && (
            <span style={{
              display: 'inline-block', marginLeft: 8, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.04em', padding: '2px 8px', borderRadius: 999,
              background: 'rgba(255,255,255,0.18)', color: 'var(--hero-ink)',
            }}>EARLY ESTIMATE</span>
          )}
        </p>
        {plan.pots.routedThisMonth > 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 12.5, opacity: 0.7 }}>
            {money(plan.pots.routedThisMonth)} routed &amp; split this month
          </p>
        )}
        <Link href="/paycheck" className="focus-ring" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
          color: 'var(--hero-ink)', textDecoration: 'none', fontSize: 13, fontWeight: 700,
          background: 'rgba(244,241,230,0.15)', padding: '9px 15px', borderRadius: 'var(--r-pill)',
          border: '1px solid rgba(244,241,230,0.25)',
        }}>
          Adjust your paycheck
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Top insight from interpretations — severity-ranked, warnings included */}
      {plan.interpretations.topInsight && (
        <div className="rise" style={D(1)}>
          <InsightCard
            insight={plan.interpretations.topInsight}
            level={plan.interpretations.topInsightLevel}
          />
        </div>
      )}

      {/* Month-end pulse check */}
      {showPulse && (
        <div className="rise" style={{ ...D(1.5), background: 'var(--gold-soft)', border: '1px solid var(--gold)', borderRadius: 'var(--r-card)', padding: '14px var(--pad)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--gold)" strokeWidth="1.8"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>Month-end check</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
                You haven&apos;t logged any expenses this month — 60 seconds keeps your plan accurate.
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
                className="focus-ring"
                style={{ background: 'var(--gold-soft)', color: 'var(--ink)', border: '1px solid var(--gold)', borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
              >
                Log expenses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your pots — the split, made visible */}
      <div className="rise" style={D(2)}>
        <Card>
          <PotsSection />
        </Card>
      </div>

      {/* This month row */}
      <div className="rise" style={{ ...D(3), display: 'flex', gap: 10 }}>
        <div style={{
          flex: 1, background: 'var(--surface)', borderRadius: 'var(--r-card)',
          padding: '14px var(--pad)', boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--hairline)',
        }}>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 6 }}>Earned</div>
          <div className="serif tnum" style={{ fontSize: 22, color: 'var(--ink)' }}>
            {trackedThisMonth > 0 ? approxAED(trackedThisMonth) : '—'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>this month so far</div>
        </div>
        <div style={{
          flex: 1, background: 'var(--surface)', borderRadius: 'var(--r-card)',
          padding: '14px var(--pad)', boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--hairline)',
        }}>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 6 }}>Left to spend</div>
          <div className="serif tnum" style={{ fontSize: 22, color: 'var(--pine)' }}>
            {money(Math.max(0, Math.round(plan.discretionary - plan.thisMonthExpenses)))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>after expenses</div>
        </div>
      </div>

      {/* Afford check */}
      <Link className="rise focus-ring" href="/afford" style={{
        ...D(4),
        display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none',
        background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)',
        padding: '15px var(--pad)', border: '1px solid var(--hairline)',
      }}>
        <span style={{
          width: 40, height: 40, borderRadius: 12, background: 'var(--pine-soft)',
          color: 'var(--pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconAfford size={21} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            Thinking about a purchase?
          </span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>
            See if it still leaves your month working.
          </span>
        </span>
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
          <path d="M1 1l6 6-6 6" stroke="var(--pine)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      </Link>
    </div>
  );
}

// ── HomeBack ─────────────────────────────────────────────────────────────────

function HomeBack() {
  const { plan, profile } = usePlan();
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  const cats: [string, number][] = [
    ['Rent & bills', plan.allocation.rentAndBills],
    ...(plan.allocation.tax > 0 ? [['Tax set-aside', plan.allocation.tax] as [string, number]] : []),
    ...(profile.zakatOn && plan.allocation.zakat > 0 ? [['Zakat set-aside', plan.allocation.zakat] as [string, number]] : []),
    ['Runway buffer', plan.allocation.buffer],
    ['Spending', plan.allocation.spending],
  ];
  const total = plan.paycheck;
  const max = Math.max(...cats.map((c) => c[1]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="rise" style={{
        background: 'var(--surface)', borderRadius: 12, padding: '18px var(--pad)',
        border: '1px solid var(--hairline)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: 0.02 }}>How this month split — {currentMonth}</div>
        <div className="tnum" style={{ fontSize: 38, fontWeight: 700, color: 'var(--ink)', marginTop: 4, letterSpacing: -0.5 }}>
          {money(total)}
        </div>
      </div>

      <div className="rise" style={{
        animationDelay: '70ms',
        background: 'var(--surface)', borderRadius: 12, padding: '6px var(--pad) 14px',
        border: '1px solid var(--hairline)',
      }}>
        {cats.map(([n, v], i) => (
          <div
            key={n}
            style={{
              padding: '11px 0',
              borderBottom: i < cats.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13.5, color: 'var(--ink)' }}>
              <span>{n}</span>
              <span className="tnum" style={{ color: 'var(--muted)' }}>{money(v)}</span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${(v / max) * 100}%`, height: '100%',
                background: 'var(--muted)', opacity: 0.5, borderRadius: 3,
              }} />
            </div>
          </div>
        ))}
      </div>

      <p className="rise" style={{
        animationDelay: '140ms', margin: '4px 6px 0',
        fontSize: 13, lineHeight: 1.5, color: 'var(--muted)',
      }}>
        That&apos;s what already happened. Keel is built for what&apos;s next —
        <span style={{ color: 'var(--ink)' }}> swing back to looking forward.</span>
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tense, setTense] = useState<'forward' | 'back'>('forward');
  const back = tense === 'back';

  return (
    <div
      className={`stage${back ? ' back' : ''}`}
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        background: 'var(--bg)',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        transition: 'background 0.5s ease',
      }}
    >
      <div style={{ padding: '20px 18px 0' }}>
        {/* Identity row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, minHeight: 34,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Link href="/profile" aria-label="Your profile" className="focus-ring" style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--pine)', color: 'var(--on-pine)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0,
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: 0.3,
            }}>K</Link>
            <span className="serif" style={{ fontSize: 21, color: 'var(--ink)', letterSpacing: 0.2 }}>Keel</span>
          </span>
        </div>

        {/* Tense toggle */}
        <div style={{ marginBottom: 18 }}>
          <TenseToggle tense={tense} onChange={setTense} />
        </div>
      </div>

      {/* Content */}
      <div key={tense} style={{ padding: '0 18px' }}>
        {back ? <HomeBack /> : <HomeForward />}
      </div>

      <Dock
        active="home"
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
        onAdd={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
        onAssistant={() => window.dispatchEvent(new Event(KEEL_OPEN_ASSISTANT))}
      />
    </div>
  );
}
