'use client';

/**
 * goal/page.tsx — Saving goal screen.
 * Port of Goal.jsx + GoalApp.jsx. No iOS frame.
 */

import React from 'react';
import { usePlan } from '@/lib/store';
import { BIG_PAYMENTS, PAY_STATUS, money, moneyK, Card, Cur } from '@/components/keel/ui';
import { GoalChart } from '@/components/keel/GoalChart';
import { IconCalendar } from '@/components/keel/icons';
import { Dock } from '@/components/keel/Dock';
import { KEEL_OPEN_ADD, KEEL_OPEN_ASSISTANT } from '@/components/keel/GlobalOverlays';

// ── Goal hero ────────────────────────────────────────────────────────────────

function GoalHero({ saved, target, monthly, behind }: {
  saved: number; target: number; monthly: number; behind: boolean;
}) {
  const pct = Math.min(100, Math.round((saved / target) * 100));
  const projLabel = behind ? '≈ Aug 2027' : '≈ May 2027';

  return (
    <Card style={{ padding: '20px var(--pad) 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="smallcaps">Your goal</div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginTop: 3 }}>Three-month runway</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
          color: 'var(--ink)', background: 'var(--surface-2)',
          padding: '6px 11px', borderRadius: 999,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: behind ? 'var(--clay)' : 'var(--mint)' }} />
          {behind ? 'A bit behind' : 'On track'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '16px 0 4px' }}>
        <span className="serif tnum" style={{ fontSize: 44, fontWeight: 500, color: 'var(--ink)', lineHeight: 0.95, letterSpacing: -0.5 }}>
          <Cur n={saved} />
        </span>
        <span style={{ fontSize: 14.5, color: 'var(--muted)' }}>of {money(target)}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', margin: '10px 0 18px' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--pine)', borderRadius: 999 }} />
      </div>

      <GoalChart
        saved={saved}
        target={target}
        projLabel={projLabel}
        behind={behind}
      />

      <p style={{ margin: '16px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        Adding <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{money(monthly)}/mo</span> from your buffer.
        {behind
          ? ' A couple of lean months pushed your date back — nudge the amount up to catch it.'
          : ' Keep this up and you reach a full runway by spring.'}
      </p>
    </Card>
  );
}

// ── Big payments timeline ────────────────────────────────────────────────────

function BigPaymentsTimeline() {
  const maxAmt = Math.max(...BIG_PAYMENTS.map((p) => p.amt));
  const r = (a: number) => 6 + (a / maxAmt) * 8;

  return (
    <Card>
      <div style={{ marginBottom: 4 }}>
        <span className="smallcaps">Big payments ahead</span>
      </div>
      <p style={{ margin: '0 0 22px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
        The full picture — large costs Keel sets aside for before they land.
      </p>

      {/* Horizontal timeline */}
      <div style={{ position: 'relative', height: 58, margin: '0 4px 8px' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 28,
          height: 2, background: 'var(--hairline)', borderRadius: 2,
        }} />
        {BIG_PAYMENTS.map((p) => {
          const c = PAY_STATUS[p.status].color;
          const rad = r(p.amt);
          return (
            <div
              key={p.id}
              style={{
                position: 'absolute', left: `${p.pos * 100}%`, top: 0,
                transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap',
              }}
            >
              <div className="tnum" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink)' }}>
                {moneyK(p.amt)}
              </div>
              <div style={{ height: 6 }} />
              <div style={{
                width: rad * 2, height: rad * 2, borderRadius: '50%',
                background: c, margin: '0 auto',
                border: '2px solid var(--surface)', boxShadow: 'var(--shadow-sm)',
              }} />
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5, fontWeight: 600 }}>{p.m}</div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 8 }}>
        {BIG_PAYMENTS.map((p, i) => {
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
    </Card>
  );
}

// ── Stats row ────────────────────────────────────────────────────────────────

function StatsRow({
  bufferToday, runwayMonths, target,
}: {
  bufferToday: number; runwayMonths: number; target: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{
        flex: 1, background: 'var(--surface)', borderRadius: 16,
        padding: '14px 13px', boxShadow: 'var(--shadow-sm)',
      }}>
        <div className="smallcaps" style={{ fontSize: 10, marginBottom: 6 }}>Buffer today</div>
        <div className="serif tnum" style={{ fontSize: 20, color: 'var(--pine)', lineHeight: 1 }}>
          <Cur n={bufferToday} />
        </div>
      </div>
      <div style={{
        flex: 1, background: 'var(--surface)', borderRadius: 16,
        padding: '14px 13px', boxShadow: 'var(--shadow-sm)',
      }}>
        <div className="smallcaps" style={{ fontSize: 10, marginBottom: 6 }}>Runway</div>
        <div className="serif tnum" style={{ fontSize: 20, color: 'var(--ink)', lineHeight: 1 }}>
          {runwayMonths} mo
        </div>
      </div>
      <div style={{
        flex: 1, background: 'var(--surface)', borderRadius: 16,
        padding: '14px 13px', boxShadow: 'var(--shadow-sm)',
      }}>
        <div className="smallcaps" style={{ fontSize: 10, marginBottom: 6 }}>Target</div>
        <div className="serif tnum" style={{ fontSize: 20, color: 'var(--gold)', lineHeight: 1 }}>
          <Cur n={target} />
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GoalPage() {
  const { plan, profile } = usePlan();

  const target = profile.essentials * profile.targetMonths;
  const saved = profile.bufferBalance;
  const monthly = plan.allocation.buffer;
  const behind = saved < target * 0.5;

  return (
    <div
      className="stage"
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        background: 'var(--bg)',
        paddingBottom: 80,
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '60px 18px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', margin: '6px 0 22px' }}>
          <div className="serif" style={{ fontSize: 33, color: 'var(--ink)', lineHeight: 1.05 }}>Saving</div>
          <p style={{ margin: '9px auto 0', maxWidth: 280, fontSize: 13.5, lineHeight: 1.45, color: 'var(--muted)' }}>
            What you&apos;re climbing toward — and the big costs on the way.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stats row */}
          <StatsRow
            bufferToday={saved}
            runwayMonths={plan.runway}
            target={target}
          />

          {/* Goal hero */}
          <div className="rise">
            <GoalHero
              saved={saved}
              target={target}
              monthly={monthly}
              behind={behind}
            />
          </div>

          {/* Big payments timeline */}
          <div className="rise" style={{ animationDelay: '90ms' }}>
            <BigPaymentsTimeline />
          </div>

          {/* Tax heads-up (if near threshold) */}
          {plan.taxTurnover > 0 && (
            <div className="rise" style={{ animationDelay: '150ms' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none',
                background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)',
                padding: '15px var(--pad)', border: '1px solid var(--hairline)',
              }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'var(--pine)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <IconCalendar size={21} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Tax &amp; registrations</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>
                    Nothing due — Keel is watching the lines for you.
                  </span>
                </span>
                <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
                  <path d="M1 1l6 6-6 6" stroke="var(--pine)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dock
        active="goal"
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
        onAdd={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
        onAssistant={() => window.dispatchEvent(new Event(KEEL_OPEN_ASSISTANT))}
      />
    </div>
  );
}
