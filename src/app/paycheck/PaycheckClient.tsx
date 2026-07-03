'use client';

/**
 * PaycheckClient.tsx — Set your paycheck screen client component.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/lib/store';
import { money, amt, Card, Cur } from '@/components/keel/ui';
import { PaycheckChart } from '@/components/keel/PaycheckChart';
import type { HistoryEntry } from '@/components/keel/PaycheckChart';
import { groupByMonth, bigPaymentMonthly } from '@/lib/engine';
import { KEEL_OPEN_ADD } from '@/components/keel/GlobalOverlays';

// ── Band classification ──────────────────────────────────────────────────────

interface BandDef {
  key: string;
  label: string;
  color: string;
  tone: 'warn' | 'ok';
  head: string;
  body: string;
}

function getBand(wage: number, essentials: number, likely: number): BandDef {
  if (wage < essentials) {
    return {
      key: 'under', label: 'Below essentials', color: 'var(--clay)', tone: 'warn',
      head: 'This won\'t cover your essentials.',
      body: `Rent and bills alone are about ${money(essentials)}. Pay yourself less than that and most months come up short.`,
    };
  }
  const saferThreshold = essentials + (likely - essentials) * 0.35;
  const balancedThreshold = essentials + (likely - essentials) * 0.7;
  if (wage < saferThreshold) {
    return {
      key: 'safe', label: 'Safer', color: 'var(--mint)', tone: 'ok',
      head: 'Conservative — and very steady.',
      body: 'You\'ll bank more in a likely month and ride out lean stretches without touching the plan.',
    };
  }
  if (wage <= balancedThreshold) {
    return {
      key: 'balanced', label: 'Balanced', color: 'var(--pine)', tone: 'ok',
      head: 'A steady wage with a healthy buffer.',
      body: 'Enough to live on every month, with room left over in likely and strong months to keep your buffer full.',
    };
  }
  if (wage <= likely) {
    return {
      key: 'roomier', label: 'Roomier', color: 'var(--gold)', tone: 'ok',
      head: 'Comfortable — with a thinner cushion.',
      body: 'You\'ll keep more each month, but less goes to your buffer. Fine if your work is fairly reliable.',
    };
  }
  return {
    key: 'stretched', label: 'Stretched', color: 'var(--clay)', tone: 'warn',
    head: 'Above a likely month.',
    body: 'You\'d pay yourself more than you usually earn. A lean stretch could come up short — your buffer drains fast.',
  };
}

// ── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label, value, sub, color,
}: {
  label: string; value: string; sub: string; color?: string;
}) {
  return (
    <div style={{
      flex: 1, background: 'var(--surface)', borderRadius: 16,
      padding: '14px 15px', boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>{label}</div>
      <div className="serif tnum" style={{ fontSize: 24, color: color || 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function PaycheckClient() {
  const router = useRouter();
  const { plan, profile, setPaycheck } = usePlan();

  // Build history from profile incomes (last 12 months, chronological)
  const monthlyMap = groupByMonth(profile.incomes);
  const sortedMonths = Object.keys(monthlyMap).sort();
  const allHistory: HistoryEntry[] = sortedMonths.map((key) => ({
    m: new Date(key + '-01').toLocaleString('en-US', { month: 'short' }),
    v: Math.round(monthlyMap[key]),
  }));

  const maxMonths = Math.min(allHistory.length, 12) || 6;
  const domainMax = Math.max(...allHistory.map((d) => d.v), plan.range.strong) * 1.1;

  const today = new Date();
  const [localWage, setLocalWage] = useState(plan.paycheck);
  // plan.paycheck is 250 on the first render (store starts empty, then hydrates
  // from localStorage/Convex). useState only seeds once, so sync the slider to the
  // suggested paycheck until the user drags it — otherwise it sticks at the minimum.
  const wageTouched = useRef(false);
  useEffect(() => {
    if (!wageTouched.current) setLocalWage(plan.paycheck);
  }, [plan.paycheck]);
  const [displayMonths, setDisplayMonths] = useState(Math.min(6, maxMonths));

  const shownHistory = allHistory.slice(-displayMonths);
  const hasHistory = shownHistory.length > 0;

  const b = getBand(localWage, profile.essentials, plan.range.likely);
  const underCount = shownHistory.filter((d) => d.v < localWage).length;
  const setAside = Math.max(plan.range.likely - localWage, 0);

  const sliderMin = 0;
  const sliderMax = Math.round(plan.range.strong * 1.2 / 250) * 250;
  const pct = sliderMax > sliderMin ? ((localWage - sliderMin) / (sliderMax - sliderMin)) * 100 : 0;
  const sugPct = sliderMax > sliderMin ? ((plan.paycheck - sliderMin) / (sliderMax - sliderMin)) * 100 : 0;

  return (
    <div
      className="stage"
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
        <Link href="/dashboard" aria-label="Back to dashboard" className="focus-ring" style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--hairline)',
        }}>
          <svg width="11" height="18" viewBox="0 0 11 18" fill="none" aria-hidden="true" focusable="false">
            <path d="M9 2 2 9l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="serif" style={{ margin: 0, fontWeight: 500, fontSize: 24, color: 'var(--ink)' }}>Spending pot</h1>
      </div>

      <div style={{ padding: '0 18px 6px', marginTop: -2 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--muted)' }}>
          What&apos;s left each month after Keel splits your income — steady, whatever your work brings in.
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 18px 120px' }}>
        {!hasHistory ? (
          <div className="rise">
            <Card style={{ textAlign: 'center', padding: '34px 22px' }}>
              <div style={{
                height: 96, borderRadius: 14, marginBottom: 18,
                background: 'repeating-linear-gradient(135deg, var(--surface-2) 0 10px, transparent 10px 20px)',
                border: '1px dashed var(--hairline)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)',
              }}>income history</div>
              <div className="serif" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>No income yet</div>
              <p style={{ margin: '0 auto', maxWidth: 240, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
                Add your first payment and Keel will suggest a steady paycheck you can count on.
              </p>
            </Card>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
            {/* Low confidence notice */}
            {plan.range.provisional && (
              <div className="rise" style={{
                background: 'var(--gold-soft)', borderRadius: 'var(--r-card)',
                padding: '14px var(--pad)', display: 'flex', gap: 11, alignItems: 'flex-start',
              }}>
                <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
                  </svg>
                </span>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
                  <b>Provisional</b> — built on just {shownHistory.length} months so far. It&apos;s a safe starting point that <b>sharpens as you log more</b> income.
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="rise">
              <Card>
                <PaycheckChart
                  history={shownHistory}
                  wage={localWage}
                  domainMax={domainMax}
                  underCount={underCount}
                  months={displayMonths}
                  setMonths={setDisplayMonths}
                  maxMonths={maxMonths}
                />
              </Card>
            </div>

            {/* Wage readout + slider */}
            <div className="rise" style={{ animationDelay: '80ms' }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div>
                    <div className="smallcaps">Pay yourself</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                      <span className="serif tnum" style={{
                        fontSize: 42, fontWeight: 500, color: 'var(--ink)',
                        lineHeight: 0.95, letterSpacing: -0.5, whiteSpace: 'nowrap',
                      }}>
                        <span style={{ fontSize: 19, fontWeight: 400, color: 'var(--muted)', marginRight: 6, letterSpacing: 0 }}>AED</span>
                        {amt(localWage)}
                      </span>
                      <span style={{ fontSize: 15, color: 'var(--muted)' }}>/mo</span>
                    </div>
                  </div>
                  <span aria-live="polite" style={{
                    alignSelf: 'center', fontSize: 12.5, fontWeight: 700, color: 'var(--ink)',
                    background: b.color.replace(')', '-soft)'), padding: '5px 12px', borderRadius: 999,
                  }}>{b.label}</span>
                </div>

                {/* Slider */}
                <div style={{ position: 'relative', margin: '24px 0 6px', height: 26, display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    position: 'absolute', left: 0, right: 0,
                    height: 8, borderRadius: 999, background: 'var(--surface-2)',
                  }} />
                  <div style={{
                    position: 'absolute', left: 0, width: `${pct}%`,
                    height: 8, borderRadius: 999, background: b.color, transition: 'background 0.2s ease',
                  }} />
                  <input
                    aria-label="Paycheck amount"
                    aria-valuetext={`AED ${amt(localWage)} per month — ${b.label}`}
                    className="keel-range"
                    type="range"
                    min={sliderMin}
                    max={sliderMax}
                    step={250}
                    value={localWage}
                    onChange={(e) => { wageTouched.current = true; setLocalWage(+e.target.value); }}
                    style={{ position: 'relative', zIndex: 2 }}
                  />
                  {/* Suggested tick */}
                  <div style={{
                    position: 'absolute', left: `${sugPct}%`, top: 16,
                    transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none',
                  }}>
                    <div style={{ width: 2, height: 8, background: 'var(--muted)', margin: '0 auto', opacity: 0.5 }} />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, whiteSpace: 'nowrap' }}>suggested</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginTop: 22 }}>
                  <span>← safer &amp; tighter</span>
                  <span>roomier &amp; riskier →</span>
                </div>
              </Card>
            </div>

            {/* Why this number */}
            <div className="rise" style={{ animationDelay: '120ms' }}>
              <div style={{
                background: 'var(--surface)', borderRadius: 'var(--r-card)',
                padding: '14px var(--pad)', boxShadow: 'var(--shadow-sm)',
                borderLeft: `3px solid ${b.color}`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>{b.head}</div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{b.body}</p>
                {localWage === plan.paycheck && (
                  <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted)', borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
                    {plan.interpretations.paycheckWhy}
                  </p>
                )}
              </div>
            </div>

            {/* Volatility interpretation — shown when income has been choppier lately */}
            {plan.interpretations.volatilityMeaning && (
              <div className="rise" style={{ animationDelay: '140ms' }}>
                <div style={{
                  background: 'var(--gold-soft)', borderRadius: 'var(--r-card)',
                  padding: '13px var(--pad)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--gold)', marginRight: 6 }}>Pattern</span>
                  {plan.interpretations.volatilityMeaning}
                </div>
              </div>
            )}

            {/* Stat tiles */}
            <div className="rise" style={{ animationDelay: '150ms', display: 'flex', gap: 12 }}>
              <StatTile
                label="Saved in a likely month"
                value={money(setAside)}
                sub={setAside > 0 ? 'goes to buffer & taxes' : 'nothing left to save'}
                color={setAside > 0 ? 'var(--mint)' : 'var(--clay)'}
              />
              <StatTile
                label="Months under this pay"
                value={`${underCount} / ${shownHistory.length}`}
                sub={underCount <= shownHistory.length * 0.5 ? 'buffer covers these' : 'buffer leans hard'}
                color={underCount <= shownHistory.length * 0.5 ? 'var(--ink)' : 'var(--clay)'}
              />
            </div>

            {/* Your savings plan — shown when goals or big payments exist */}
            {(plan.monthlyGoalContrib > 0 || plan.monthlyBigPaymentReserve > 0) && (
              <div className="rise" style={{ animationDelay: '195ms' }}>
                <Card style={{ background: 'var(--pine-soft)', boxShadow: 'inset 3px 0 0 var(--pine)' }}>
                  <div className="smallcaps" style={{ color: 'var(--pine)', marginBottom: 12 }}>
                    Set aside from your pots this month
                  </div>

                  {/* Per-goal rows */}
                  {plan.userGoals
                    .filter((g) => g.targetAmt > 0 && g.targetDate)
                    .map((g, i) => {
                      const [y, m] = g.targetDate.split('-').map(Number);
                      const targetMs = new Date(y, m - 1, 1).getTime() - today.getTime();
                      const monthsLeft = Math.max(1, Math.round(targetMs / (1000 * 60 * 60 * 24 * 30.44)));
                      const monthly = Math.round(g.targetAmt / monthsLeft);
                      const targetDateStr = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
                      return (
                        <div
                          key={g.name + '-' + i}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                              Goal: {g.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                              towards {money(g.targetAmt)} by {targetDateStr}
                            </div>
                          </div>
                          <div className="tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--pine)', flexShrink: 0, marginLeft: 12 }}>
                            {money(monthly)}
                          </div>
                        </div>
                      );
                    })}

                  {/* Per-big-payment rows */}
                  {plan.bigPayments.map((bp, i) => {
                    const monthly = bigPaymentMonthly(bp.amt, bp.dueDate, today);
                    const isFirst = plan.userGoals.filter((g) => g.targetAmt > 0 && g.targetDate).length === 0 && i === 0;
                    return (
                      <div
                        key={bp.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          padding: '8px 0', borderTop: isFirst ? 'none' : '1px solid var(--hairline)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                            Big payment: {bp.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                            due {bp.m}
                          </div>
                        </div>
                        <div className="tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--pine)', flexShrink: 0, marginLeft: 12 }}>
                          {money(monthly)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Divider + true spending budget */}
                  <div style={{ borderTop: '2px solid var(--pine)', marginTop: 4, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      True spending budget
                    </span>
                    <span className="serif tnum" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
                      {money(plan.discretionary ?? plan.allocation.spending)}
                    </span>
                  </div>
                </Card>
              </div>
            )}

            {/* Savings card */}
            <div className="rise" style={{ animationDelay: '210ms' }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <span className="smallcaps">Your savings</span>
                  <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>moves with your pay</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <span className="serif tnum" style={{ fontSize: 34, color: 'var(--pine)', lineHeight: 1, transition: 'color 0.2s' }}>
                      <Cur n={profile.bufferBalance + Math.max(plan.range.likely - localWage, 0) * 6} />
                    </span>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>buffer in 6 months</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="serif tnum" style={{ fontSize: 22, color: setAside > 0 ? 'var(--mint)' : 'var(--clay)', lineHeight: 1 }}>
                      {setAside > 0 ? <>+<Cur n={setAside} /></> : <Cur n={0} />}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>/mo at this pay</div>
                  </div>
                </div>
                {(() => {
                  const target = profile.essentials * profile.targetMonths;
                  const add = Math.max(plan.range.likely - localWage, 0);
                  const projected = profile.bufferBalance + add * 6;
                  const pPct = target > 0 ? Math.min(100, Math.round((projected / target) * 100)) : 0;
                  // Clamp: if the buffer already covers the target, runway is "already there"
                  // (never a negative months count).
                  const remainingToTarget = Math.max(0, target - profile.bufferBalance);
                  const alreadyThere = remainingToTarget <= 0;
                  const months = add > 0 ? Math.ceil(remainingToTarget / add) : null;
                  return (
                    <>
                      <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ width: pPct + '%', height: '100%', background: 'var(--pine)', borderRadius: 999 }} />
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
                        {alreadyThere
                          ? <span>You&apos;re <b style={{ color: 'var(--ink)' }}>already at a full {profile.targetMonths}-month runway</b> — your buffer of {money(profile.bufferBalance)} covers it. Anything you save now is extra cushion.</span>
                          : add > 0
                          ? <span>From <b style={{ color: 'var(--ink)' }}>{money(profile.bufferBalance)}</b> today — a full {profile.targetMonths}-month runway in about <b style={{ color: 'var(--ink)' }}>{months} month{months !== 1 ? 's' : ''}</b>. Pay yourself less to get there sooner.</span>
                          : <span>At this pay there&apos;s <b style={{ color: 'var(--clay)' }}>nothing left to save</b> — your buffer holds at {money(profile.bufferBalance)}. Ease the paycheck down to keep building.</span>
                        }
                      </p>
                    </>
                  );
                })()}
              </Card>
            </div>

            {/* Warning card when band is stretched/under */}
            {b.tone === 'warn' && (
              <div className="rise" style={{ animationDelay: '280ms' }}>
                <div style={{
                  background: 'var(--clay-soft)',
                  borderRadius: 'var(--r-card)', padding: 'var(--pad)',
                  borderLeft: `3px solid ${b.color}`,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{b.head}</div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{b.body}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky save bar (no Dock on this screen — matches the design reference, and
          avoids the fixed Dock overlapping/intercepting these buttons) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 40,
        padding: '14px 18px calc(30px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(to top, var(--bg) 62%, transparent)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <button
          type="button"
          onClick={() => setLocalWage(plan.paycheck)}
          disabled={!hasHistory}
          className="focus-ring"
          style={{
            background: 'none', border: 'none', cursor: hasHistory ? 'pointer' : 'default',
            color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
            whiteSpace: 'nowrap', opacity: hasHistory ? 1 : 0.4,
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            if (hasHistory) { setPaycheck(localWage); router.push('/dashboard'); }
            else { window.dispatchEvent(new Event(KEEL_OPEN_ADD)); }
          }}
          className="focus-ring"
          style={{
            flex: 1, padding: '15px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
            background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
            fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
            boxShadow: '0 6px 18px rgba(31,77,58,0.28)',
          }}
        >
          {hasHistory ? 'Save this paycheck' : 'Add your first income'}
        </button>
      </div>
    </div>
  );
}
