'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlan } from '@/lib/store';
import { computeAfford, crossLinkAffordWithIncoming } from '@/lib/engine';
import type { IncomingPaymentHint } from '@/lib/engine';
import { Card, Disclaimer, money, moneyK, amt, Cur, fmtFx } from '@/components/keel/ui';
import { IconAfford } from '@/components/keel/icons';
import { Dock } from '@/components/keel/Dock';
import { KEEL_OPEN_ADD, KEEL_OPEN_ASSISTANT } from '@/components/keel/GlobalOverlays';

// ── Example purchases shown in empty state ────────────────────────────────────

const AFFORD_EXAMPLES = [
  { item: 'a flight home',      amt: 2400  },
  { item: 'a new camera',       amt: 8000  },
  { item: 'a MacBook + lens kit', amt: 20000 },
];

// ── Tier visual icon paths ─────────────────────────────────────────────────────

const TIER_ICON_PATH: Record<'fits' | 'dips' | 'break', React.ReactNode> = {
  fits:  <path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  dips:  <path d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  break: <path d="M3.5 9h6.5l1.5 3M20.5 15H14l-1.5-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
};

const TIER_STYLE: Record<'fits' | 'dips' | 'break', { color: string; soft: string }> = {
  fits:  { color: 'var(--mint)', soft: 'var(--mint-soft)' },
  dips:  { color: 'var(--gold)', soft: 'var(--gold-soft)' },
  break: { color: 'var(--clay)', soft: 'var(--clay-soft)' },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function slipMonths(cost: number, spendingLeft: number, monthlyToBuffer: number): number {
  const fromBuffer = Math.max(0, cost - spendingLeft);
  return monthlyToBuffer > 0 ? fromBuffer / monthlyToBuffer : 0;
}

function slipText(m: number): string | null {
  if (m <= 0) return null;
  const weeks = Math.max(1, Math.round(m * 4.3));
  if (m < 1) return `about ${weeks} week${weeks !== 1 ? 's' : ''}`;
  const months = Math.round(m);
  return `about ${months} month${months !== 1 ? 's' : ''}`;
}

// ── MiniBar ───────────────────────────────────────────────────────────────────

interface Segment { w: number; c: string; o?: number }

function MiniBar({ segments, height = 10 }: { segments: Segment[]; height?: number }) {
  return (
    <div style={{ display: 'flex', height, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-2)' }}>
      {segments.map((s, i) => s.w > 0 && (
        <div key={i} style={{ width: s.w + '%', background: s.c, opacity: s.o ?? 1, transition: 'width 0.4s cubic-bezier(.4,1,.5,1)' }} />
      ))}
    </div>
  );
}

// ── Amount Input ───────────────────────────────────────────────────────────────

interface AmountInputProps {
  amount: number;
  item: string;
  setAmount: (n: number) => void;
  setItem: (s: string) => void;
  onClear: () => void;
}

function AmountInput({ amount, item, setAmount, setItem, onClear }: AmountInputProps) {
  return (
    <Card style={{ padding: '18px var(--pad) 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="smallcaps">What are you weighing up?</span>
        {amount > 0 && (
          <button type="button" onClick={onClear} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
            fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, padding: 0,
          }}>Clear</button>
        )}
      </div>
      <input
        aria-label="Item name"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        placeholder="A camera, a flight home, new gear…"
        className="focus-ring"
        style={{
          width: '100%', border: 'none', background: 'none', boxSizing: 'border-box',
          fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', padding: '2px 0 12px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderTop: '1px solid var(--hairline)', paddingTop: 14 }}>
        <span style={{ fontSize: 22, fontWeight: 400, color: 'var(--muted)', letterSpacing: 0 }}>AED</span>
        <input
          aria-label="Amount"
          inputMode="numeric"
          value={amount ? amount.toLocaleString('en-US') : ''}
          onChange={(e) => setAmount(parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0)}
          placeholder="0"
          className="serif tnum focus-ring"
          style={{
            flex: 1, minWidth: 0, border: 'none', background: 'none',
            fontSize: 50, fontWeight: 500, color: 'var(--ink)', letterSpacing: -1, lineHeight: 1,
            padding: 0, width: '100%',
          }}
        />
      </div>
    </Card>
  );
}

// ── Empty prompt ──────────────────────────────────────────────────────────────

function AffordPrompt({ onPick }: { onPick: (ex: { item: string; amt: number }) => void }) {
  return (
    <div>
      <Card style={{ textAlign: 'center', padding: '26px 22px 24px' }}>
        <span style={{
          width: 52, height: 52, borderRadius: 16, background: 'var(--pine-soft)', color: 'var(--pine)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <IconAfford size={26} />
        </span>
        <div className="serif" style={{ fontSize: 21, color: 'var(--ink)', marginBottom: 8 }}>Before you buy</div>
        <p style={{ margin: '0 auto', maxWidth: 270, fontSize: 13.5, lineHeight: 1.55, color: 'var(--muted)' }}>
          Type an amount above. Keel checks it against your plan — not just your balance — and tells you honestly whether it still leaves the month working.
        </p>
      </Card>
      <div style={{ marginTop: 18 }}>
        <div className="smallcaps" style={{ margin: '0 6px 11px' }}>Try one</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {AFFORD_EXAMPLES.map((ex) => (
            <button type="button" key={ex.item} onClick={() => onPick(ex)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer',
              background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '13px 15px',
              fontFamily: 'var(--font-ui)',
            }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--pine-soft)', color: 'var(--pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconAfford size={18} />
              </span>
              <span style={{ flex: 1, fontSize: 14.5, color: 'var(--ink)', textTransform: 'capitalize' }}>{ex.item}</span>
              <span className="serif tnum" style={{ fontSize: 16.5, color: 'var(--ink)' }}><Cur n={ex.amt} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Verdict card ──────────────────────────────────────────────────────────────

interface VerdictProps {
  verdict: 'fits' | 'dips' | 'break';
  label: string;
  reason: string;
  item: string;
}

function VerdictCard({ verdict, label, reason, item }: VerdictProps) {
  const T = TIER_STYLE[verdict];
  const named = item.trim();
  return (
    <div style={{
      background: T.soft, borderRadius: 'var(--r-card)', padding: '20px var(--pad)',
      boxShadow: 'var(--shadow-sm)', transition: 'background 0.35s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
        <span style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: T.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.35s ease',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24">{TIER_ICON_PATH[verdict]}</svg>
        </span>
        <div>
          {named && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 2 }}>{named.charAt(0).toUpperCase() + named.slice(1)}</div>}
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>{label}</div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>{reason}</p>
    </div>
  );
}

// ── Effect on Plan ─────────────────────────────────────────────────────────────

interface EffectProps {
  cost: number;
  spendingLeft: number;
  bufferBalance: number;
  safeFloor: number;
  verdict: 'fits' | 'dips' | 'break';
  monthlyBuffer?: number;
}

function EffectOnPlan({ cost, spendingLeft, bufferBalance, safeFloor, verdict, monthlyBuffer = 0 }: EffectProps) {
  const T = TIER_STYLE[verdict];
  const runwayTarget = safeFloor * 4.4;
  const fromBuffer = Math.max(0, cost - spendingLeft);
  const fromSpending = Math.min(Math.max(cost, 0), spendingLeft);
  const newBuffer = bufferBalance - fromBuffer;
  const newSpendingLeft = Math.max(0, spendingLeft - cost);
  const spendingTotal = spendingLeft;
  const bufferColor = verdict === 'fits' ? 'var(--ink)' : verdict === 'dips' ? 'var(--gold)' : 'var(--clay)';

  const spendSegs: Segment[] = [
    { w: (fromSpending / Math.max(spendingTotal, 1)) * 100, c: T.color },
  ];
  const bufFill = Math.max(0, (newBuffer / Math.max(runwayTarget, 1)) * 100);
  const floorPct = (safeFloor / Math.max(runwayTarget, 1)) * 100;

  const slip = slipMonths(cost, spendingLeft, monthlyBuffer);

  return (
    <Card>
      <div className="smallcaps" style={{ marginBottom: 16 }}>What it does to your month</div>

      {/* left to spend */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>Left to spend this month</span>
          <span>
            <span className="serif tnum" style={{ fontSize: 18, color: verdict === 'fits' ? 'var(--ink)' : 'var(--clay)' }}>{money(newSpendingLeft)}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>was {money(spendingLeft)}</span>
          </span>
        </div>
        <MiniBar segments={spendSegs} />
        {fromBuffer > 0 && (
          <div style={{ fontSize: 12, color: 'var(--clay)', marginTop: 8, fontWeight: 600 }}>
            + {money(fromBuffer)} pulled from your buffer
          </div>
        )}
      </div>

      {/* runway buffer */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>Runway buffer</span>
          <span>
            <span className="serif tnum" style={{ fontSize: 18, color: bufferColor, transition: 'color 0.35s ease' }}>{money(newBuffer)}</span>
            {fromBuffer > 0 && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>was {money(bufferBalance)}</span>}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <MiniBar segments={[{ w: bufFill, c: bufferColor }]} />
          <div style={{ position: 'absolute', top: -3, bottom: -3, left: floorPct + '%', width: 2, background: 'var(--ink)', opacity: 0.35, borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11.5, color: 'var(--muted)' }}>
          <span>safe month · {moneyK(safeFloor)}</span>
          <span>full runway · {moneyK(runwayTarget)}</span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
          {verdict === 'fits' && <span>Untouched — your full runway still lands on schedule.</span>}
          {verdict === 'dips' && slip && <span>Still above a safe month. Full runway slips <b style={{ color: 'var(--ink)' }}>{slipText(slip)}</b>.</span>}
          {verdict === 'break' && <span>This would drop you <b style={{ color: 'var(--clay)' }}>below a safe month</b> — worth rebuilding the buffer first.</span>}
        </p>
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AffordClient() {
  const { plan, profile } = usePlan();
  const [amount, setAmount] = useState(0);
  const [item, setItem] = useState('');

  const spendingLeft = plan.allocation.spending;
  const bufferBalance = profile.bufferBalance;
  const safeFloor = profile.essentials;

  const onPick = (ex: { item: string; amt: number }) => {
    setItem(ex.item);
    setAmount(ex.amt);
  };
  const onClear = () => { setAmount(0); setItem(''); };

  const result = amount > 0
    ? computeAfford(amount, spendingLeft, bufferBalance, safeFloor)
    : null;

  const hint: IncomingPaymentHint | null =
    (amount > 0 && result && (result.verdict === 'dips' || result.verdict === 'break'))
      ? crossLinkAffordWithIncoming(amount, spendingLeft, profile.incomes)
      : null;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
          <Link href="/dashboard" style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--hairline)',
          }}>
            <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
              <path d="M9 2 2 9l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="serif" style={{ fontSize: 24, color: 'var(--ink)' }}>Can I afford this?</div>
        </div>
        <div style={{ padding: '0 18px 6px', marginTop: -2 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--muted)' }}>
            Not "is the money in my account?" — but "does this still leave the month working?"
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 18px 140px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="rise">
            <AmountInput amount={amount} item={item} setAmount={setAmount} setItem={setItem} onClear={onClear} />
          </div>

          {result ? (
            <>
              <div className="rise" style={{ animationDelay: '80ms' }}>
                <VerdictCard
                  verdict={result.verdict}
                  label={result.label}
                  reason={result.reason}
                  item={item}
                />
              </div>
              {hint && (
                <div className="rise" style={{ animationDelay: '180ms' }}>
                  <div style={{
                    background: 'var(--pine-soft)', borderRadius: 'var(--r-card)',
                    padding: '14px var(--pad)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--pine)', marginRight: 6 }}>Coming soon</span>
                    Not right now — but a confirmed {fmtFx(hint.amount, hint.currency)} lands in {hint.daysAway} day{hint.daysAway !== 1 ? 's' : ''}. After that, this fits.
                  </div>
                </div>
              )}
              <div className="rise" style={{ animationDelay: '150ms' }}>
                <EffectOnPlan
                  cost={amount}
                  spendingLeft={spendingLeft}
                  bufferBalance={bufferBalance}
                  safeFloor={safeFloor}
                  verdict={result.verdict}
                  monthlyBuffer={plan.allocation.buffer}
                />
              </div>
              <div className="rise" style={{ animationDelay: '210ms' }}>
                <p style={{ margin: '2px 8px 0', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', textAlign: 'center' }}>
                  Checked against your plan — what&apos;s left to spend and your buffer — not just your bank balance.
                </p>
              </div>
              <div className="rise" style={{ animationDelay: '240ms' }}>
                <Disclaimer style={{ margin: '0 8px' }}>Estimate — not financial advice.</Disclaimer>
              </div>
            </>
          ) : (
            <div className="rise" style={{ animationDelay: '80ms' }}>
              <AffordPrompt onPick={onPick} />
            </div>
          )}
        </div>
      </div>

      {/* No active tab — accessed from home card */}
      <Dock
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
        onAdd={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
        onAssistant={() => window.dispatchEvent(new Event(KEEL_OPEN_ASSISTANT))}
      />
    </div>
  );
}
