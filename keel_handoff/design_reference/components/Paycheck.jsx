// Paycheck.jsx — "Set your paycheck": the intellectual heart.
// Drag the wage; the history line, trade-offs and honest warnings update live.
const { useState: usePay } = React;

const PAY_HISTORY = [
  { m: 'Jun', v: 12000 }, { m: 'Jul', v: 21000 }, { m: 'Aug', v: 10000 },
  { m: 'Sep', v: 19000 }, { m: 'Oct', v: 11500 }, { m: 'Nov', v: 17000 },
  { m: 'Dec', v: 9000 }, { m: 'Jan', v: 14500 }, { m: 'Feb', v: 22500 },
  { m: 'Mar', v: 10500 }, { m: 'Apr', v: 16500 }, { m: 'May', v: 13000 },
];
const DOMAIN_MAX = 24000;
const SUGGESTED = 14000;
const ESSENTIALS = 9500;    // rent + bills floor
const LIKELY = 16000;      // a likely month

// classify the chosen wage into an honest band
function band(w) {
  if (w < ESSENTIALS) return {
    key: 'under', label: 'Below essentials', color: 'var(--clay)', tone: 'warn',
    head: 'This won\'t cover your essentials.',
    body: 'Rent and bills alone are about ' + money(ESSENTIALS) + '. Pay yourself less than that and most months come up short.',
  };
  if (w < 13000) return {
    key: 'safe', label: 'Safer', color: 'var(--mint)', tone: 'ok',
    head: 'Conservative — and very steady.',
    body: 'You\'ll bank more in a likely month and ride out lean stretches without touching the plan.',
  };
  if (w <= 15000) return {
    key: 'balanced', label: 'Balanced', color: 'var(--pine)', tone: 'ok',
    head: 'A steady wage with a healthy buffer.',
    body: 'Enough to live on every month, with room left over in likely and strong months to keep your buffer full.',
  };
  if (w <= LIKELY) return {
    key: 'roomier', label: 'Roomier', color: 'var(--gold)', tone: 'ok',
    head: 'Comfortable — with a thinner cushion.',
    body: 'You\'ll keep more each month, but less goes to your buffer. Fine if your work is fairly reliable.',
  };
  return {
    key: 'stretched', label: 'Stretched', color: 'var(--clay)', tone: 'warn',
    head: 'Above a likely month.',
    body: 'You\'d pay yourself more than you usually earn. A lean stretch could come up short — your buffer drains fast.',
  };
}

function StatTile({ label, value, sub, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 16, padding: '14px 15px', boxShadow: 'var(--shadow-sm)' }}>
      <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>{label}</div>
      <div className="serif tnum" style={{ fontSize: 24, color: color || 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function SavingsCard({ wage }) {
  const balance = 23000, target = 42000;        // buffer now / full 3-month runway
  const add = Math.max(LIKELY - wage, 0);       // saved in a likely month at this pay
  const horizon = 6;
  const projected = balance + add * horizon;    // where the buffer lands in 6 months
  const months = add > 0 ? Math.ceil((target - balance) / add) : null;
  const pPct = Math.min(100, Math.round((projected / target) * 100));
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span className="smallcaps">Your savings</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>moves with your pay</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span className="serif tnum" style={{ fontSize: 34, color: 'var(--pine)', lineHeight: 1, transition: 'color 0.2s' }}><Cur n={projected} /></span>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>buffer in 6 months</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="serif tnum" style={{ fontSize: 22, color: add > 0 ? 'var(--mint)' : 'var(--clay)', lineHeight: 1 }}>
            {add > 0 ? <React.Fragment>+<Cur n={add} /></React.Fragment> : <Cur n={0} />}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>/mo at this pay</div>
        </div>
      </div>
      {/* buffer progress toward full runway */}
      <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: pPct + '%', height: '100%', background: 'var(--pine)', borderRadius: 999 }} />
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
        {add > 0
          ? <span>From <b style={{ color: 'var(--ink)' }}>{money(balance)}</b> today — a full 3-month runway in about <b style={{ color: 'var(--ink)' }}>{months} month{months > 1 ? 's' : ''}</b>. Pay yourself less to get there sooner.</span>
          : <span>At this pay there's <b style={{ color: 'var(--clay)' }}>nothing left to save</b> — your buffer holds at {money(balance)}. Ease the paycheck down to keep building.</span>}
      </p>
    </Card>
  );
}

function PaycheckScreen({ wage, setWage, hasHistory, confidence = 'high' }) {
  const histLen = confidence === 'low' ? 3 : PAY_HISTORY.length;
  const [months, setMonths] = usePay(histLen);
  React.useEffect(() => { setMonths(histLen); }, [histLen]);
  const effMonths = Math.min(months, histLen);
  const shown = PAY_HISTORY.slice(-effMonths);
  const b = band(wage);
  const underCount = shown.filter(d => d.v < wage).length;
  const setAside = Math.max(LIKELY - wage, 0);
  const min = 8000, max = 20000;
  const pct = ((wage - min) / (max - min)) * 100;
  const sugPct = ((SUGGESTED - min) / (max - min)) * 100;

  if (!hasHistory) {
    return <div style={{ paddingTop: 6 }}><PaycheckEmpty /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
      {/* low-confidence: honest, calm — not alarming */}
      {confidence === 'low' && (
        <div className="rise" style={{ background: 'var(--gold-soft)', borderRadius: 'var(--r-card)', padding: '14px var(--pad)', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8"/><path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7.6" r="1.15" fill="currentColor"/></svg>
          </span>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
            <b>Provisional</b> — built on just {histLen} months so far. It's a safe starting point that <b>sharpens as you log more</b> income.
          </div>
        </div>
      )}

      <div className="rise"><Card><PaycheckChart history={shown} wage={wage} domainMax={DOMAIN_MAX} underCount={underCount} months={effMonths} setMonths={setMonths} maxMonths={histLen} /></Card></div>

      {/* wage readout + slider */}
      <div className="rise" style={{ animationDelay: '80ms' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div className="smallcaps">Pay yourself</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                <span className="serif tnum" style={{ fontSize: 42, fontWeight: 500, color: 'var(--ink)', lineHeight: 0.95, letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 19, fontWeight: 400, color: 'var(--muted)', marginRight: 6, letterSpacing: 0 }}>AED</span>{amt(wage)}
                </span>
                <span style={{ fontSize: 15, color: 'var(--muted)' }}>/mo</span>
              </div>
            </div>
            <span style={{
              alignSelf: 'center', fontSize: 12.5, fontWeight: 700, color: 'var(--on-pine)',
              background: b.color, padding: '5px 12px', borderRadius: 999,
            }}>{b.label}</span>
          </div>

          {/* slider */}
          <div style={{ position: 'relative', margin: '24px 0 6px', height: 26, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 8, borderRadius: 999, background: 'var(--surface-2)' }} />
            <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 8, borderRadius: 999, background: b.color, transition: 'background 0.2s ease' }} />
            <input className="keel-range" type="range" min={min} max={max} step={50}
              value={wage} onChange={(e) => setWage(+e.target.value)}
              disabled={!hasHistory}
              style={{ '--thumb': b.color, position: 'relative', zIndex: 2 }} />
            {/* suggested tick */}
            <div style={{ position: 'absolute', left: `${sugPct}%`, top: 16, transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
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

      {/* live trade-offs */}
      <div className="rise" style={{ animationDelay: '150ms', display: 'flex', gap: 12 }}>
        <StatTile label="Saved in a likely month" value={money(setAside)}
          sub={setAside > 0 ? 'goes to buffer & taxes' : 'nothing left to save'}
          color={setAside > 0 ? 'var(--mint)' : 'var(--clay)'} />
        <StatTile label="Months under this pay" value={underCount + ' / ' + effMonths}
          sub={underCount <= effMonths * 0.5 ? 'buffer covers these' : 'buffer leans hard'}
          color={underCount <= effMonths * 0.5 ? 'var(--ink)' : 'var(--clay)'} />
      </div>

      {/* live savings — how the buffer grows at this pay */}
      <div className="rise" style={{ animationDelay: '210ms' }}>
        <SavingsCard wage={wage} />
      </div>

      {/* honest insight — only when there's a real warning */}
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
  );
}

function PaycheckEmpty() {
  return (
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
          Add your first payment or connect an account, and Keel will suggest a steady paycheck you can count on.
        </p>
      </Card>
    </div>
  );
}
Object.assign(window, { PaycheckScreen, PaycheckEmpty, SUGGESTED });
