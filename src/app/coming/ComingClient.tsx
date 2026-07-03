'use client';

import React, { useState, useEffect } from 'react';
import { usePlan } from '@/lib/store';
import { toAED, bigPaymentMonthly, monthsUntilDue } from '@/lib/engine';
import { PAY_STATUS, Card, Disclaimer, Segmented, money, fmtFx, approxAED, Cur } from '@/components/keel/ui';
import type { IncomeItem } from '@/lib/engine';
import type { BigPayment } from '@/lib/demo-seed';
import { Dock } from '@/components/keel/Dock';
import { KEEL_OPEN_ADD } from '@/components/keel/GlobalOverlays';

// ── Confidence pill ────────────────────────────────────────────────────────────

const CONF: Record<string, { label: string; color: string }> = {
  confirmed:   { label: 'Confirmed',   color: 'var(--mint)' },
  likely:      { label: 'Likely',      color: 'var(--gold)' },
  possible:    { label: 'Unconfirmed', color: 'var(--clay)' },
};

function ConfPill({ conf }: { conf: string }) {
  const c = CONF[conf] ?? CONF.possible;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  );
}

// ── Count Toggle (reused from Dock pattern) ───────────────────────────────────

function CountToggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} role="switch" aria-checked={on} aria-label={label} className="focus-ring" style={{
      width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: on ? 'var(--pine)' : 'var(--surface-2)', position: 'relative',
      transition: 'background 0.3s ease', flexShrink: 0,
      boxShadow: on ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
    }}>
      <span className="keel-thumb" style={{
        position: 'absolute', top: 3, left: 3, width: 21, height: 21, borderRadius: '50%',
        background: on ? 'var(--on-pine)' : 'var(--surface)', boxShadow: 'var(--shadow-sm)',
        transform: on ? 'translateX(19px)' : 'translateX(0)',
        transition: 'transform 0.32s cubic-bezier(0.5,1.3,0.5,1)',
        display: 'block',
      }} />
    </button>
  );
}

// ── Timeline item ──────────────────────────────────────────────────────────────

interface TimelineItemData {
  id: string;
  date: string;
  who: string;
  note: string;
  amt: number;
  ccy: string;
  conf: string;
}

interface TimelineItemProps {
  item: TimelineItemData;
  counted: boolean;
  onToggle: () => void;
  received: boolean;
  historical?: boolean;
  onReceive: () => void;
  last?: boolean;
}

function TimelineItem({ item, counted, onToggle, received, historical = false, onReceive, last = false }: TimelineItemProps) {
  const isReceived = historical || received;
  const warn = !isReceived && counted && item.conf !== 'confirmed';
  const amtColor = isReceived ? 'var(--mint)' : counted ? 'var(--pine)' : 'var(--ink)';
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {/* rail */}
      <div style={{ position: 'relative', width: 14, flexShrink: 0 }}>
        {!last && <div style={{ position: 'absolute', left: 6, top: 18, bottom: -18, width: 2, background: 'var(--hairline)' }} />}
        <div style={{
          width: 14, height: 14, borderRadius: '50%', marginTop: 4,
          background: isReceived ? 'var(--mint)' : counted ? 'var(--pine)' : 'var(--surface)',
          border: isReceived || counted ? 'none' : '2px solid var(--hairline)',
          boxShadow: isReceived ? '0 0 0 3px var(--mint-soft)' : counted ? '0 0 0 3px var(--pine-soft)' : 'none',
          transition: 'all 0.3s ease',
        }} />
      </div>
      {/* card */}
      <div style={{ flex: 1, paddingBottom: 18 }}>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, letterSpacing: 0.2, marginBottom: 6 }}>{item.date}</div>
        <div style={{
          background: 'var(--surface)', borderRadius: 16, padding: '14px 15px',
          boxShadow: 'var(--shadow-sm)',
          borderLeft: `3px solid ${isReceived ? 'var(--mint)' : counted ? 'var(--pine)' : 'transparent'}`,
          transition: 'border-color 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', paddingTop: 2 }}>{item.who}</span>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="serif tnum" style={{ fontSize: 19, color: amtColor, whiteSpace: 'nowrap' }}>
                {item.ccy === 'AED'
                  ? <Cur n={item.amt} />
                  : (
                    <>
                      {fmtFx(item.amt, item.ccy)}
                      <span style={{ fontSize: '0.52em', fontWeight: 600, color: 'var(--muted)', marginLeft: 4, letterSpacing: 0.3 }}>{item.ccy}</span>
                    </>
                  )}
              </div>
              {item.ccy !== 'AED' && (
                <div className="tnum" style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{approxAED(toAED(item.amt, item.ccy))}</div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{item.note}</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }}>
            {isReceived ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--mint)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path d="M5 12.5l4.5 4.5L19 7" stroke="var(--mint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Received
              </span>
            ) : <ConfPill conf={item.conf} />}
            {!isReceived && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: counted ? 'var(--pine)' : 'var(--muted)' }}>
                  {counted ? 'In the plan' : 'Count it'}
                </span>
                <CountToggle on={counted} onClick={onToggle} label={`Count ${item.who}, ${item.date}, in your plan`} />
              </div>
            )}
            {isReceived && !historical && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>in your history</span>
            )}
          </div>

          {item.conf === 'possible' && !isReceived && (
            <div style={{ marginTop: 9, fontSize: 11.5, lineHeight: 1.4, color: 'var(--muted)', fontStyle: 'italic' }}>
              Tracked only — hoped-for money doesn&apos;t size your safe paycheck until it&apos;s confirmed.
            </div>
          )}

          {warn && (
            <div role="status" style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span aria-hidden="true" style={{ color: 'var(--clay)', fontSize: 13, lineHeight: 1.3 }}>⚠</span>
              <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--clay)' }}>
                You&apos;re counting money that isn&apos;t confirmed — a no-show would leave your plan short.
              </span>
            </div>
          )}

          {!isReceived && (
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--hairline)' }}>
              <button type="button" onClick={onReceive} className="focus-ring" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--pine)', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
                padding: '10px 0', margin: '-10px 0',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path d="M5 12.5l4.5 4.5L19 7" stroke="var(--pine)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                It landed — mark as received
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Big payment row ────────────────────────────────────────────────────────────

function BigPaymentRow({ payment, last }: { payment: BigPayment; last: boolean }) {
  const ps = PAY_STATUS[payment.status];
  const now = new Date();
  const perMonth = bigPaymentMonthly(payment.amt, payment.dueDate, now);
  const months = monthsUntilDue(payment.dueDate, now);
  // The save rate Keel teaches: set this aside each month to be ready in time.
  const plan = months <= 1
    ? `Due ${payment.m} — set aside ≈${money(payment.amt)} now`
    : `Set aside ≈${money(perMonth)}/mo · ready by ${payment.m}`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 0',
      borderTop: last ? 'none' : '1px solid var(--hairline)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{payment.name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--pine)', marginTop: 3, fontWeight: 500 }}>{plan}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="serif tnum" style={{ fontSize: 17, color: 'var(--ink)' }}>
          <Cur n={payment.amt} />
        </div>
        <span style={{
          display: 'inline-block', fontSize: 11.5, fontWeight: 600, color: ps.color,
          marginTop: 2,
        }}>{ps.label}</span>
      </div>
    </div>
  );
}

// ── Build timeline items from store incomes ───────────────────────────────────

function incomeToTimeline(inc: IncomeItem, index: number): TimelineItemData {
  const d = new Date(inc.date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const label = `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
  return {
    id: `inc-${index}`,
    date: label,
    who: 'Income payment',
    note: `${inc.currency} · ${(CONF[inc.confidence] ?? CONF.possible).label}`,
    amt: inc.amount,
    ccy: inc.currency,
    conf: inc.confidence,
  };
}

// ── Approx marker ─────────────────────────────────────────────────────────────

function Approx({ on }: { on: boolean }) {
  if (!on) return null;
  return <span style={{ fontSize: '0.5em', fontWeight: 400, marginRight: 3, verticalAlign: 'middle' }}>≈</span>;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ComingClient() {
  const { profile, plan, addIncome, setTracked } = usePlan();
  const [view, setView] = useState('expected');

  // Build timeline items from profile incomes
  const allItems: TimelineItemData[] = profile.incomes.map((inc, i) => incomeToTimeline(inc, i));
  // Persisted across page leaves (localStorage) so the Count-it / Received toggles stick.
  const COUNTED_KEY = 'keel_coming_counted';
  const RECEIVED_KEY = 'keel_coming_received';
  function loadMap(key: string): Record<string, boolean> | null {
    if (typeof window === 'undefined') return null;
    try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as Record<string, boolean> : null; }
    catch { return null; }
  }

  const [counted, setCounted] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    // Default "Count it" to ON for confirmed items, OFF for others
    profile.incomes.forEach((inc, i) => { init[`inc-${i}`] = inc.confidence === 'confirmed'; });
    return { ...init, ...(loadMap(COUNTED_KEY) ?? {}) };
  });
  // Pre-populate received state: confirmed items from current or past months are already received
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [received, setReceived] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    profile.incomes.forEach((inc, i) => {
      if (inc.confidence === 'confirmed' && inc.date <= currentMonth + '-31') {
        init[`inc-${i}`] = true;
      }
    });
    return { ...init, ...(loadMap(RECEIVED_KEY) ?? {}) };
  });

  // Persist both maps whenever they change.
  useEffect(() => {
    try { window.localStorage.setItem(COUNTED_KEY, JSON.stringify(counted)); } catch { /* ignore */ }
  }, [counted]);
  useEffect(() => {
    try { window.localStorage.setItem(RECEIVED_KEY, JSON.stringify(received)); } catch { /* ignore */ }
  }, [received]);

  const aedOf = (it: TimelineItemData) => toAED(it.amt, it.ccy);

  // Toggle "Count it" — updates global plan store so home/paycheck/goals all reflect the change
  const toggle = (id: string) => {
    const newCounted = { ...counted, [id]: !counted[id] };
    setCounted(newCounted);
    const newTotal = allItems
      .filter(i => !received[i.id] && newCounted[i.id])
      .reduce((s, i) => s + toAED(i.amt, i.ccy), 0);
    setTracked(newTotal);
  };

  // "Mark as received" — adds income to the store with today's date + confirmed confidence.
  const markReceived = (id: string) => {
    const idx = parseInt(id.replace('inc-', ''), 10);
    const inc = profile.incomes[idx];
    if (!inc) {
      setReceived(r => ({ ...r, [id]: true }));
      return;
    }
    // addIncome appends, so the new entry's timeline id is deterministic. Mark BOTH the
    // original expected row and the freshly-appended confirmed row received, so the new
    // one doesn't reappear as a duplicate "Expected" row.
    const newId = 'inc-' + profile.incomes.length;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    addIncome({ amount: inc.amount, currency: inc.currency, date: today, confidence: 'confirmed' });
    const newReceived = { ...received, [id]: true, [newId]: true };
    setReceived(newReceived);
    // Overwrite the tracked total (the reducer bumped it for the new confirmed income)
    // with the single source of truth: counted, not-yet-received expected items only.
    // The received money now flows through the plan as real logged income instead.
    const newTotal = allItems
      .filter(i => i.id !== id && !newReceived[i.id] && counted[i.id])
      .reduce((s, i) => s + toAED(i.amt, i.ccy), 0);
    setTracked(newTotal);
  };

  // Recurring confirmed items (from paycheck-type income set up in onboarding) are
  // already factored into the paycheck calculation — exclude them from the Expected
  // and In-plan views to avoid double-counting.
  //
  // This dedup only makes sense for a *monthly* salary cadence: repeated equal amounts
  // are a recurring paycheck. For quarterly/project/irregular freelancers, distinct
  // project payments may coincidentally share an amount (false positive) or recur
  // legitimately, and every payment should stay visible in the timeline. So we only
  // apply the heuristic for 'monthly' (or undefined, for backward compatibility).
  const applyRecurringDedup = profile.incomePattern === undefined || profile.incomePattern === 'monthly';

  const recurringConfirmedAmounts = (() => {
    if (!applyRecurringDedup) return new Set<number>();
    const counts: Record<number, number> = {};
    profile.incomes.forEach((inc) => {
      if (inc.confidence === 'confirmed') {
        counts[inc.amount] = (counts[inc.amount] ?? 0) + 1;
      }
    });
    // An amount that appears 3+ times with 'confirmed' confidence is almost certainly
    // a recurring paycheck entry rather than a one-off confirmed payment.
    return new Set(
      Object.entries(counts)
        .filter(([, cnt]) => cnt >= 3)
        .map(([amt]) => Number(amt))
    );
  })();

  const isRecurringSalary = (it: TimelineItemData) =>
    it.conf === 'confirmed' && recurringConfirmedAmounts.has(it.amt);

  const expectedItems = allItems.filter(i => !received[i.id] && !isRecurringSalary(i));
  const countedItems = expectedItems.filter(i => counted[i.id]);
  const countedTotal = countedItems.reduce((s, i) => s + aedOf(i), 0);
  const expectedTotal = expectedItems.reduce((s, i) => s + aedOf(i), 0);
  const countedForeign = countedItems.some(i => i.ccy !== 'AED');
  const anyForeign = expectedItems.some(i => i.ccy !== 'AED');

  // "received" view = items marked received
  const receivedFromExpected = allItems.filter(i => received[i.id]);
  const receivedItems = receivedFromExpected;
  const receivedTotal = receivedItems.reduce((s, i) => s + aedOf(i), 0);
  const receivedForeign = receivedItems.some(i => i.ccy !== 'AED');

  const list = view === 'plan' ? countedItems : view === 'received' ? receivedItems : expectedItems;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '60px 18px 132px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', margin: '6px 0 22px' }}>
          <h1 className="serif" style={{ margin: 0, fontWeight: 500, fontSize: 33, color: 'var(--ink)', lineHeight: 1.05 }}>What&apos;s coming</h1>
          <p style={{ margin: '9px auto 0', maxWidth: 280, fontSize: 13.5, lineHeight: 1.45, color: 'var(--muted)' }}>
            Money you expect — track it freely, count it only when you&apos;re sure.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary card */}
          <div className="rise">
            <Card>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="smallcaps" style={{ fontSize: 10.5, minHeight: 30 }}>Counted in<br />your plan</div>
                  <div className="serif tnum" style={{ fontSize: 32, color: 'var(--pine)', lineHeight: 1, marginTop: 6 }}>
                    <Approx on={countedForeign} /><Cur n={countedTotal} />
                  </div>
                </div>
                <div style={{ width: 1, background: 'var(--hairline)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="smallcaps" style={{ fontSize: 10.5, minHeight: 30 }}>If it<br />all lands</div>
                  <div className="serif tnum" style={{ fontSize: 32, color: 'var(--muted)', lineHeight: 1, marginTop: 6 }}>
                    <Approx on={anyForeign} /><Cur n={expectedTotal} />
                  </div>
                </div>
              </div>
              <p style={{ margin: '15px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
                Keel plans only with money you&apos;ve <span style={{ color: 'var(--ink)', fontWeight: 600 }}>counted</span> — so a no-show never breaks your month.
              </p>
              {anyForeign && (
                <Disclaimer style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--hairline)' }}>
                  Foreign amounts converted at today&apos;s rate — approximate, not a locked figure.
                </Disclaimer>
              )}
            </Card>
          </div>

          {/* Segmented control */}
          <div className="rise" style={{ animationDelay: '70ms' }}>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'expected', label: 'Expected' },
                { value: 'plan', label: 'In plan' },
                { value: 'received', label: 'Received' },
              ]}
            />
          </div>

          {/* Received total line */}
          {view === 'received' && receivedItems.length > 0 && (
            <div className="rise" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Landed recently</span>
              <span className="serif tnum" style={{ fontSize: 19, color: 'var(--mint)' }}>
                <Approx on={receivedForeign} /><Cur n={receivedTotal} />
              </span>
            </div>
          )}

          {/* Timeline */}
          <div className="rise" style={{ animationDelay: '140ms' }}>
            {list.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '30px 22px' }}>
                <div className="serif" style={{ fontSize: 19, color: 'var(--ink)', marginBottom: 5 }}>
                  {view === 'received' ? 'Nothing logged yet' : view === 'plan' ? 'Nothing counted yet' : 'Nothing expected'}
                </div>
                <p style={{ margin: '0 auto', maxWidth: 240, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {view === 'received'
                    ? 'When a payment lands, mark it received — it builds the history your paycheck is read from.'
                    : view === 'plan'
                    ? "Switch on the payments you're sure about and they'll show up in your plan."
                    : 'Add an invoice or gig you\'re expecting and it\'ll appear here.'}
                </p>
              </Card>
            ) : (
              <div style={{ paddingTop: 4 }}>
                {list.map((it, i) => {
                  const historical = view === 'received';
                  return (
                    <TimelineItem
                      key={it.id}
                      item={it}
                      counted={!!counted[it.id]}
                      onToggle={() => toggle(it.id)}
                      received={view === 'received'}
                      historical={historical}
                      onReceive={() => markReceived(it.id)}
                      last={i === list.length - 1}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Big payments section */}
          {view !== 'received' && (
            <div className="rise" style={{ animationDelay: '200ms' }}>
              <h2 className="smallcaps" style={{ margin: '4px 6px 11px' }}>Upcoming big payments</h2>
              {plan.bigPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)', fontSize: 13.5 }}>
                  No big payments logged yet — tap + to add one.
                </div>
              ) : (
                <>
                  <Card style={{ padding: '2px var(--pad)' }}>
                    {plan.bigPayments.map((bp, i) => (
                      <BigPaymentRow key={bp.id} payment={bp} last={i === 0} />
                    ))}
                  </Card>
                  <Disclaimer style={{ margin: '11px 6px 0' }}>
                    Big payment amounts are estimates — adjust them as you get firmer numbers.
                  </Disclaimer>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Dock
        active="coming"
        onAdd={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
      />
    </div>
  );
}
