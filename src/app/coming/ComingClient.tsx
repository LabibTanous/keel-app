'use client';

import React, { useState } from 'react';
import { usePlan } from '@/lib/store';
import { toAED } from '@/lib/engine';
import { PAY_STATUS, Card, Disclaimer, Segmented, money, fmtFx, approxAED, Cur } from '@/components/keel/ui';
import type { IncomeItem } from '@/lib/engine';
import type { BigPayment } from '@/lib/demo-seed';
import { Dock } from '@/components/keel/Dock';

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

function CountToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={on ? 'Toggle off' : 'Toggle on'} aria-pressed={on} style={{
      width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: on ? 'var(--pine)' : 'var(--surface-2)', position: 'relative',
      transition: 'background 0.3s ease', flexShrink: 0,
      boxShadow: on ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
    }}>
      <span style={{
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                <CountToggle on={counted} onClick={onToggle} />
              </div>
            )}
            {isReceived && !historical && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>in your history</span>
            )}
          </div>

          {warn && (
            <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--clay)', fontSize: 13, lineHeight: 1.3 }}>⚠</span>
              <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--clay)' }}>
                You&apos;re counting money that isn&apos;t confirmed — a no-show would leave your plan short.
              </span>
            </div>
          )}

          {!isReceived && (
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--hairline)' }}>
              <button type="button" onClick={onReceive} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--pine)', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, padding: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 0',
      borderTop: last ? 'none' : '1px solid var(--hairline)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{payment.name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{payment.m}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
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
    note: `${inc.currency} · ${inc.confidence}`,
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
  const { profile, plan, addIncome } = usePlan();
  const [view, setView] = useState('expected');

  // Build timeline items from profile incomes
  const allItems: TimelineItemData[] = profile.incomes.map((inc, i) => incomeToTimeline(inc, i));
  const [counted, setCounted] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    profile.incomes.forEach((_inc, i) => { init[`inc-${i}`] = false; });
    return init;
  });
  const [received, setReceived] = useState<Record<string, boolean>>({});

  const aedOf = (it: TimelineItemData) => toAED(it.amt, it.ccy);

  // Toggle "Count it" — local view only (plan reads current-month incomes automatically)
  const toggle = (id: string) => setCounted(c => ({ ...c, [id]: !c[id] }));

  // "Mark as received" — adds income to the store with today's date + confirmed confidence.
  const markReceived = (id: string) => {
    const idx = parseInt(id.replace('inc-', ''), 10);
    const inc = profile.incomes[idx];
    if (inc) {
      const today = new Date().toISOString().slice(0, 10);
      addIncome({ amount: inc.amount, currency: inc.currency, date: today, confidence: 'confirmed' });
    }
    setReceived(r => ({ ...r, [id]: true }));
  };

  // Recurring confirmed items (from paycheck-type income set up in onboarding) are
  // already factored into the paycheck calculation — exclude them from the Expected
  // and In-plan views to avoid double-counting.
  const recurringConfirmedAmounts = (() => {
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
          <div className="serif" style={{ fontSize: 33, color: 'var(--ink)', lineHeight: 1.05 }}>What&apos;s coming</div>
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
              <div className="smallcaps" style={{ margin: '4px 6px 11px' }}>Upcoming big payments</div>
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
        onAdd={() => {}}
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
      />
    </div>
  );
}
