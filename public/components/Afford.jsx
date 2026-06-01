// Afford.jsx — "Can I afford this?" Keel's honest purchase check.
// The whole point: not "is the money in my account?" but "does this still
// leave the month working?" Everything is read against the PLAN — what's left
// to spend this month and the runway buffer — never the raw bank balance.
//
// NOTE: these are plan figures (spending allocation, buffer), NOT the paycheck
// engine. The suggested wage / band thresholds are computed elsewhere and must
// not be hand-tuned here. This screen only reasons about spending + buffer.
const { useState: useAfford, useEffect: useAffordEffect, useRef: useAffordRef } = React;

const AFFORD_PLAN = {
  spendingTotal: 4800,   // this month's spending allocation
  spent: 1600,           // already spent so far this month
  buffer: 23000,         // runway buffer today
  safeFloor: 9500,       // one month of essentials — the line you don't cross
  monthlyToBuffer: 1800, // added to the buffer in a likely month
};

// example purchases — tappable in the empty state, one per honest tier
const AFFORD_EXAMPLES = [
  { item: 'a flight home', amt: 2400 },
  { item: 'a new camera',  amt: 8000 },
  { item: 'a MacBook + lens kit', amt: 20000 },
];

function assessAfford(x) {
  const P = AFFORD_PLAN;
  const spendingLeft = P.spendingTotal - P.spent;          // 3,200
  const fromSpending = Math.min(Math.max(x, 0), spendingLeft);
  const fromBuffer   = Math.max(0, x - spendingLeft);
  const newSpendingLeft = Math.max(0, spendingLeft - x);
  const newBuffer = P.buffer - fromBuffer;
  const freeBuffer = P.buffer - P.safeFloor;               // 13,500 spare above a safe month
  const safeCeiling = spendingLeft + freeBuffer;           // 16,700 — most you can spend & keep the month working
  let tier;
  if (x <= 0) tier = 'empty';
  else if (fromBuffer === 0) tier = 'fits';
  else if (newBuffer >= P.safeFloor) tier = 'dips';
  else tier = 'break';
  const slipMonths = fromBuffer / P.monthlyToBuffer;
  return { spendingLeft, fromSpending, fromBuffer, newSpendingLeft, newBuffer, freeBuffer, safeCeiling, tier, slipMonths };
}

function slipText(m) {
  if (m <= 0) return null;
  const weeks = Math.max(1, Math.round(m * 4.3));
  if (m < 1) return `about ${weeks} week${weeks !== 1 ? 's' : ''}`;
  const months = Math.round(m);
  return `about ${months} month${months !== 1 ? 's' : ''}`;
}

// tier visual + copy
const TIER_ICON = {
  fits:  <path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  dips:  <path d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  break: <path d="M3.5 9h6.5l1.5 3M20.5 15H14l-1.5-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
};
const TIER = {
  fits:  { label: 'Fits the plan',               color: 'var(--mint)', soft: 'var(--mint-soft)' },
  dips:  { label: 'Possible — dips into buffer', color: 'var(--gold)', soft: 'var(--gold-soft)' },
  break: { label: 'Would break the plan',        color: 'var(--clay)', soft: 'var(--clay-soft)' },
};

// ── amount input ─────────────────────────────────────────────────────────
function AmountInput({ amount, item, setAmount, setItem, onClear }) {
  return (
    <Card style={{ padding: '18px var(--pad) 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="smallcaps">What are you weighing up?</span>
        {amount > 0 && (
          <button onClick={onClear} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
            fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, padding: 0,
          }}>Clear</button>
        )}
      </div>
      <input
        value={item} onChange={(e) => setItem(e.target.value)}
        placeholder="A camera, a flight home, new gear…"
        style={{
          width: '100%', border: 'none', background: 'none', outline: 'none', boxSizing: 'border-box',
          fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', padding: '2px 0 12px',
        }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderTop: '1px solid var(--hairline)', paddingTop: 14 }}>
        <span style={{ fontSize: 22, fontWeight: 400, color: 'var(--muted)', letterSpacing: 0 }}>AED</span>
        <input
          inputMode="numeric" value={amount ? amount.toLocaleString('en-US') : ''}
          onChange={(e) => setAmount(parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0)}
          placeholder="0"
          className="serif tnum"
          style={{
            flex: 1, minWidth: 0, border: 'none', background: 'none', outline: 'none',
            fontSize: 50, fontWeight: 500, color: 'var(--ink)', letterSpacing: -1, lineHeight: 1,
            padding: 0, width: '100%',
          }} />
      </div>
    </Card>
  );
}

// ── the verdict ──────────────────────────────────────────────────────────
function Verdict({ a, item }) {
  const T = TIER[a.tier];
  const named = item ? item.trim() : '';
  const reason = {
    fits: <span>Comes straight out of what's left to spend this month — <b style={{ color: 'var(--ink)' }}>{money(a.newSpendingLeft)}</b> still stays. Your buffer and runway don't move.</span>,
    dips: <span>More than you've left to spend, so <b style={{ color: 'var(--ink)' }}>{money(a.fromBuffer)}</b> would come from your buffer. You'd still hold a safe month — your full runway just slips <b style={{ color: 'var(--ink)' }}>{slipText(a.slipMonths)}</b>.</span>,
    break: <span>This pulls your buffer below a safe month ({money(AFFORD_PLAN.safeFloor)}). A lean stretch after it could leave essentials short. You could spend up to <b style={{ color: 'var(--ink)' }}>{money(a.safeCeiling)}</b> and still keep the month working.</span>,
  }[a.tier];
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
          <svg width="24" height="24" viewBox="0 0 24 24">{TIER_ICON[a.tier]}</svg>
        </span>
        <div>
          {named && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 2 }}>{named.charAt(0).toUpperCase() + named.slice(1)}</div>}
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>{T.label}</div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>{reason}</p>
    </div>
  );
}

// ── effect on the month ──────────────────────────────────────────────────
function MiniBar({ segments, height = 10 }) {
  return (
    <div style={{ display: 'flex', height, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-2)' }}>
      {segments.map((s, i) => s.w > 0 && (
        <div key={i} style={{ width: s.w + '%', background: s.c, opacity: s.o ?? 1, transition: 'width 0.4s cubic-bezier(.4,1,.5,1)' }} />
      ))}
    </div>
  );
}

function EffectOnPlan({ a }) {
  const P = AFFORD_PLAN;
  const T = TIER[a.tier];
  const bufferColor = a.tier === 'fits' ? 'var(--ink)' : a.tier === 'dips' ? 'var(--gold)' : 'var(--clay)';
  const runwayTarget = 42000;
  // spending bar — out of the full monthly spending allocation
  const spendSegs = [
    { w: (P.spent / P.spendingTotal) * 100, c: 'var(--muted)', o: 0.4 },
    { w: (a.fromSpending / P.spendingTotal) * 100, c: T.color },
  ];
  // buffer bar — out of the full runway target, with a safe-floor marker
  const bufFill = Math.max(0, (a.newBuffer / runwayTarget) * 100);
  const floorPct = (P.safeFloor / runwayTarget) * 100;
  return (
    <Card>
      <div className="smallcaps" style={{ marginBottom: 16 }}>What it does to your month</div>

      {/* left to spend */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>Left to spend this month</span>
          <span>
            <span className="serif tnum" style={{ fontSize: 18, color: a.tier === 'fits' ? 'var(--ink)' : 'var(--clay)' }}>{money(a.newSpendingLeft)}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>was {money(a.spendingLeft)}</span>
          </span>
        </div>
        <MiniBar segments={spendSegs} />
        {a.fromBuffer > 0 && (
          <div style={{ fontSize: 12, color: 'var(--clay)', marginTop: 8, fontWeight: 600 }}>
            + {money(a.fromBuffer)} pulled from your buffer
          </div>
        )}
      </div>

      {/* runway buffer */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>Runway buffer</span>
          <span>
            <span className="serif tnum" style={{ fontSize: 18, color: bufferColor, transition: 'color 0.35s ease' }}>{money(a.newBuffer)}</span>
            {a.fromBuffer > 0 && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>was {money(P.buffer)}</span>}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <MiniBar segments={[{ w: bufFill, c: bufferColor }]} />
          {/* safe-month floor marker */}
          <div style={{ position: 'absolute', top: -3, bottom: -3, left: floorPct + '%', width: 2, background: 'var(--ink)', opacity: 0.35, borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11.5, color: 'var(--muted)' }}>
          <span>safe month · {moneyK(P.safeFloor)}</span>
          <span>full runway · {moneyK(runwayTarget)}</span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
          {a.tier === 'fits' && <span>Untouched — your full runway still lands on schedule.</span>}
          {a.tier === 'dips' && <span>Still above a safe month. Full runway slips <b style={{ color: 'var(--ink)' }}>{slipText(a.slipMonths)}</b>.</span>}
          {a.tier === 'break' && <span>This would drop you <b style={{ color: 'var(--clay)' }}>below a safe month</b> — worth rebuilding the buffer first.</span>}
        </p>
      </div>
    </Card>
  );
}

function Footnote() {
  return (
    <p style={{ margin: '2px 8px 0', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', textAlign: 'center' }}>
      Checked against your plan — what's left to spend and your buffer — not just your bank balance.
    </p>
  );
}

// ── empty prompt (no amount yet) ──────────────────────────────────────────
function AffordPrompt({ onPick }) {
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
            <button key={ex.item} onClick={() => onPick(ex)} style={{
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

// ── loading skeleton ──────────────────────────────────────────────────────
function Sk({ w, h = 14, r = 7, mb = 0, style }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'var(--surface-2)', marginBottom: mb, ...style }} />;
}
function AffordSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: '20px var(--pad)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
          <Sk w={44} h={44} r={22} />
          <Sk w={150} h={20} />
        </div>
        <Sk w="100%" mb={8} /><Sk w="80%" />
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)', padding: 'var(--pad)' }}>
        <Sk w={120} h={11} mb={18} />
        <Sk w="100%" h={10} r={999} mb={8} /><Sk w="55%" mb={20} />
        <Sk w="100%" h={10} r={999} mb={8} /><Sk w="65%" />
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Checking against your plan…</div>
    </div>
  );
}

function AffordScreen({ amount, item, setAmount, setItem, loading }) {
  const a = assessAfford(amount);
  const onPick = (ex) => { setItem(ex.item); setAmount(ex.amt); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="rise"><AmountInput amount={amount} item={item} setAmount={setAmount} setItem={setItem} onClear={() => { setAmount(0); setItem(''); }} /></div>
      {loading ? (
        <div className="rise" style={{ animationDelay: '80ms' }}><AffordSkeleton /></div>
      ) : amount > 0 ? (
        <React.Fragment>
          <div className="rise" style={{ animationDelay: '80ms' }}><Verdict a={a} item={item} /></div>
          <div className="rise" style={{ animationDelay: '150ms' }}><EffectOnPlan a={a} /></div>
          <div className="rise" style={{ animationDelay: '210ms' }}><Footnote /></div>
        </React.Fragment>
      ) : (
        <div className="rise" style={{ animationDelay: '80ms' }}><AffordPrompt onPick={onPick} /></div>
      )}
    </div>
  );
}

Object.assign(window, { AffordScreen, assessAfford });
