'use client';

/**
 * GoalClient.tsx — Goals screen client component.
 */

import React, { useState } from 'react';
import { usePlan } from '@/lib/store';
import type { UserGoal } from '@/lib/store';
import { goalTradeoff } from '@/lib/engine';
import { PAY_STATUS, money, moneyK, Card, Cur } from '@/components/keel/ui';
import { GoalChart } from '@/components/keel/GoalChart';
import { IconCalendar } from '@/components/keel/icons';
import { Dock } from '@/components/keel/Dock';
import { KEEL_OPEN_ADD, KEEL_OPEN_ASSISTANT } from '@/components/keel/GlobalOverlays';

// ── Goal hero ────────────────────────────────────────────────────────────────

function computeProjectedLabel(saved: number, target: number, monthly: number): string {
  if (saved >= target) return '';
  if (monthly <= 0) return '';
  const monthsLeft = Math.ceil((target - saved) / monthly);
  const projected = new Date();
  projected.setMonth(projected.getMonth() + monthsLeft);
  return projected.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function GoalHero({ saved, target, monthly, behind, goalName, provisional }: {
  saved: number; target: number; monthly: number; behind: boolean; goalName: string; provisional?: boolean;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const projLabel = computeProjectedLabel(saved, target, monthly)
    ? `≈ ${computeProjectedLabel(saved, target, monthly)}`
    : (behind ? '≈ –' : 'Done');

  return (
    <Card style={{ padding: '20px var(--pad) 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="smallcaps">Your goal</div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginTop: 3 }}>{goalName}</div>
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
        {saved >= target
          ? "You're already at your target — buffer is full."
          : monthly > 0
            ? <>Adding <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{money(monthly)}/mo</span> from your buffer.
              {behind
                ? ' A couple of lean months pushed your date back — nudge the amount up to catch it.'
                : ` Keep this up and you reach a full runway by ${computeProjectedLabel(saved, target, monthly)}.`}
            </>
            : 'Set a monthly buffer contribution to see your projected date.'}
      </p>
      {provisional && saved < target && monthly > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)', fontStyle: 'italic' }}>
          This date is an early estimate — it sharpens as you log more months of income.
        </p>
      )}
    </Card>
  );
}

// ── Big payments timeline ────────────────────────────────────────────────────

function BigPaymentsTimeline() {
  const { plan } = usePlan();
  const payments = plan.bigPayments;

  if (payments.length === 0) {
    return (
      <Card>
        <div style={{ marginBottom: 4 }}>
          <span className="smallcaps">Big payments ahead</span>
        </div>
        <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)', fontSize: 13.5 }}>
          No big payments logged yet — tap + to add one.
        </div>
      </Card>
    );
  }

  const maxAmt = Math.max(...payments.map((p) => p.amt));
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
        {payments.map((p) => {
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
        {payments.map((p, i) => {
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

const GOAL_OPTIONS = [
  'Emergency fund',
  'Home / property',
  'Vacation',
  'Car',
  'Education',
  'New business',
  'Retirement',
  'Other',
];

// ── Page ─────────────────────────────────────────────────────────────────────

export function GoalClient() {
  const { plan, profile, setUserGoals } = usePlan();
  const [editing, setEditing] = useState(false);
  const [editGoal, setEditGoal] = useState<UserGoal | null>(null);

  const { userGoals } = plan;
  const primaryGoal = userGoals && userGoals.length > 0 ? userGoals[0] : null;
  const additionalGoals = userGoals && userGoals.length > 1 ? userGoals.slice(1) : [];

  // Use primary goal's target amount if provided, otherwise fall back to essentials * targetMonths
  const target = primaryGoal && primaryGoal.targetAmt > 0
    ? primaryGoal.targetAmt
    : profile.essentials * profile.targetMonths;
  const goalName = primaryGoal ? primaryGoal.name : 'Three-month runway';
  // Per-goal saved: apportion the shared buffer to THIS goal (by its share of all
  // goal targets), capped at its target — so a 50k buffer against a 15k goal reads
  // "15,000 of 15,000", not "50,000 of 15,000".
  let saved: number;
  if (primaryGoal && primaryGoal.targetAmt > 0) {
    const totalGoalTarget = userGoals.reduce((s, g) => s + Math.max(0, g.targetAmt), 0);
    const share = totalGoalTarget > 0 ? primaryGoal.targetAmt / totalGoalTarget : 1;
    saved = Math.min(target, Math.round(profile.bufferBalance * share));
  } else {
    // Runway fallback goal: the buffer IS the runway, but never overshoot the target.
    saved = Math.min(profile.bufferBalance, target);
  }
  const monthly = plan.allocation.buffer;
  const behind = saved < target * 0.5;

  const targetAmount = profile.essentials * profile.targetMonths;
  const tradeoff = goalTradeoff(targetAmount, profile.bufferBalance, plan.allocation.buffer, plan.allocation.spending);

  function startEdit() {
    setEditGoal(
      primaryGoal
        ? { ...primaryGoal }
        : { name: 'Three-month runway', custom: '', targetAmt: target, targetDate: '' }
    );
    setEditing(true);
  }

  function saveEdit() {
    if (!editGoal) return;
    const updated: UserGoal[] = [editGoal, ...additionalGoals];
    setUserGoals(updated);
    setEditing(false);
    setEditGoal(null);
  }

  function cancelEdit() {
    setEditing(false);
    setEditGoal(null);
  }

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
          <div className="serif" style={{ fontSize: 33, color: 'var(--ink)', lineHeight: 1.05 }}>Goals</div>
          <p style={{ margin: '9px auto 0', maxWidth: 280, fontSize: 13.5, lineHeight: 1.45, color: 'var(--muted)' }}>
            Your goals and big costs ahead.
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
              goalName={goalName}
              provisional={plan.range.provisional}
            />

            {/* Edit goal inline form */}
            {editing && editGoal ? (
              <div style={{
                marginTop: 10,
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                borderRadius: 16,
                padding: '16px 15px',
              }}>
                <div className="smallcaps" style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 12 }}>Edit goal</div>

                {/* Goal name */}
                <div style={{ marginBottom: 10 }}>
                  <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 6 }}>Goal name</div>
                  <select
                    value={editGoal.name}
                    onChange={(e) => setEditGoal({ ...editGoal, name: e.target.value, custom: '' })}
                    style={{
                      width: '100%', padding: '10px 13px', borderRadius: 10, marginBottom: 0,
                      border: 'none', background: 'var(--surface-2)',
                      fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)',
                      cursor: 'pointer', appearance: 'none',
                    }}
                  >
                    {GOAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {editGoal.name === 'Other' && (
                    <input
                      type="text"
                      aria-label="Custom goal name"
                      value={editGoal.custom}
                      onChange={(e) => setEditGoal({ ...editGoal, custom: e.target.value })}
                      placeholder="Describe your goal"
                      style={{
                        width: '100%', marginTop: 8, padding: '10px 13px', borderRadius: 10,
                        border: 'none', background: 'var(--surface-2)',
                        fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>

                {/* Target amount */}
                <div style={{ marginBottom: 10 }}>
                  <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 6 }}>Target amount</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--surface-2)', borderRadius: 10, padding: '0 13px',
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--muted)', flexShrink: 0 }}>AED</span>
                    <input
                      aria-label="Target amount"
                      inputMode="numeric"
                      value={editGoal.targetAmt > 0 ? String(editGoal.targetAmt) : ''}
                      onChange={(e) => setEditGoal({ ...editGoal, targetAmt: parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0 })}
                      placeholder="0"
                      style={{
                        flex: 1, minWidth: 0, border: 'none', background: 'none',
                        fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--ink)',
                        padding: '12px 0',
                      }}
                    />
                  </div>
                </div>

                {/* Target date */}
                <div style={{ marginBottom: 14 }}>
                  <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 6 }}>Target date</div>
                  <input
                    type="month"
                    aria-label="Target date"
                    value={editGoal.targetDate}
                    onChange={(e) => setEditGoal({ ...editGoal, targetDate: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 13px', borderRadius: 10,
                      border: 'none', background: 'var(--surface-2)',
                      fontFamily: 'var(--font-ui)', fontSize: 14, color: editGoal.targetDate ? 'var(--ink)' : 'var(--muted)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={saveEdit}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 999, border: 'none',
                      background: 'var(--pine)', color: 'var(--on-pine)',
                      fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >Save</button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 999,
                      border: '1px solid var(--hairline)', background: 'var(--surface)',
                      fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
                      color: 'var(--muted)', cursor: 'pointer',
                    }}
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={startEdit}
                  style={{
                    background: 'var(--surface-2)', border: 'none', borderRadius: 999,
                    padding: '7px 14px', fontFamily: 'var(--font-ui)', fontSize: 12.5,
                    fontWeight: 600, color: 'var(--muted)', cursor: 'pointer',
                  }}
                >Edit goal</button>
              </div>
            )}
            {additionalGoals.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="smallcaps" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>Other goals</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {additionalGoals.map((g, i) => (
                    <div
                      key={g.name + '-' + i}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--surface)', borderRadius: 12,
                        padding: '10px 13px', border: '1px solid var(--hairline)',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{g.name}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'right' }}>
                        {g.targetAmt > 0 && <span>AED {g.targetAmt.toLocaleString()}</span>}
                        {g.targetAmt > 0 && g.targetDate && <span> · </span>}
                        {g.targetDate && <span>{g.targetDate}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tradeoff.monthsToGoal !== null && (
              <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
                Putting <b style={{ color: 'var(--ink)' }}>AED {Math.round(plan.allocation.buffer).toLocaleString('en-US')}/mo</b> toward your runway buffer — full {profile.targetMonths}-month target in about <b style={{ color: 'var(--ink)' }}>{tradeoff.monthsToGoal} month{tradeoff.monthsToGoal !== 1 ? 's' : ''}</b>. That leaves <b style={{ color: 'var(--ink)' }}>AED {Math.round(plan.allocation.spending).toLocaleString('en-US')}/mo</b> to spend freely — comfortable, or want to push the date and spend more now?
              </p>
            )}
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
