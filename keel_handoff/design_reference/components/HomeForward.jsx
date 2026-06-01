// HomeForward — the forward plan. Warm, alive, the real Keel.
// money / moneyK / Card come from ui.jsx (loaded first).

// ---- Honest income range: paycheck set below a likely month ----
function RangeBand({ lean, likely, strong, paycheck, tracking, trackColor }) {
  const lo = lean - 200, hi = strong + 200, span = hi - lo;
  const pct = (v) => `${((v - lo) / span) * 100}%`;
  const b1 = (lean + likely) / 2, b2 = (likely + strong) / 2;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
        <span className="smallcaps">This month's range</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>income, honestly</span>
      </div>
      {/* paycheck pin sits above the band */}
      <div style={{ position: 'relative', height: 34 }}>
        <div style={{ position: 'absolute', left: pct(paycheck), transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pine)', letterSpacing: 0.2 }}>
            Paycheck {money(paycheck)}
          </div>
          <div style={{ width: 2, height: 12, background: 'var(--pine)', margin: '4px auto 0', borderRadius: 2 }} />
        </div>
      </div>
      {/* the band */}
      <div style={{ position: 'relative', height: 16, borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: pct(b1), background: 'var(--clay-soft)' }} />
        <div style={{ width: `calc(${pct(b2)} - ${pct(b1)})`, background: 'var(--pine-soft)' }} />
        <div style={{ flex: 1, background: 'var(--gold-soft)' }} />
        {/* paycheck line through band */}
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: pct(paycheck), width: 2.5, background: 'var(--pine)', borderRadius: 2 }} />
      </div>
      {/* "so far this month" tracking marker — honest, forward */}
      {tracking != null && (
        <div style={{ position: 'relative', height: 22, marginTop: 5 }}>
          <div style={{ position: 'absolute', left: pct(tracking), transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', transition: 'left 0.6s cubic-bezier(0.5,1.1,0.5,1)' }}>
            <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `6px solid ${trackColor || 'var(--mint)'}` }} />
            <div style={{ fontSize: 10.5, fontWeight: 600, color: trackColor || 'var(--mint)', marginTop: 3 }}>{moneyK(tracking)} so far</div>
          </div>
        </div>
      )}
      {/* zone labels */}
      <div style={{ display: 'flex', marginTop: 12 }}>
        {[['Lean', lean, 'var(--clay)'], ['Likely', likely, 'var(--ink)'], ['Strong', strong, 'var(--gold)']].map(([l, v, c], i) => (
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

// ---- Allocation flow: money assigned to jobs before it arrives ----
function Allocation({ paycheck, zakat }) {
  // Buckets sum to the paycheck. Enabling Zakat carves its set-aside out of
  // discretionary spending — the wage itself is untouched (engine owns that).
  const buckets = zakat ? [
    ['Rent & bills', 6200, 'var(--pine)'],
    ['Tax set-aside', 1200, 'var(--gold)'],
    ['Zakat set-aside', 150, 'var(--zakat)'],
    ['Runway buffer', 1800, 'var(--mint)'],
    ['Spending', 4650, 'var(--clay)'],
  ] : [
    ['Rent & bills', 6200, 'var(--pine)'],
    ['Tax set-aside', 1200, 'var(--gold)'],
    ['Runway buffer', 1800, 'var(--mint)'],
    ['Spending', 4800, 'var(--clay)'],
  ];
  const total = buckets.reduce((s, b) => s + b[1], 0);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span className="smallcaps">Where it goes</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>assigned before it arrives</span>
      </div>
      <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2, marginBottom: 18 }}>
        {buckets.map(([n, v, c]) => (
          <div key={n} style={{ width: `${(v/total)*100}%`, background: c }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {buckets.map(([n, v, c]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: c, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14.5, color: 'var(--ink)' }}>{n}</span>
            <span className="serif tnum" style={{ fontSize: 16.5, color: 'var(--ink)' }}>{money(v)}</span>
          </div>
        ))}
      </div>
      <Disclaimer style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--hairline)' }}>
        {zakat
          ? 'Tax and Zakat set-asides are estimates you can refine in Profile — not tax or financial advice.'
          : 'Tax set-aside is an estimate you can refine in Profile — not tax or financial advice.'}
      </Disclaimer>
    </div>
  );
}

// ---- B1: signal / heads-up — the thing a spreadsheet can't do. Renders the
// full sentence with warmth or caution, not just a one-word pill. ----
function Signal({ signal }) {
  const filled = signal.tone === 'warn' || signal.tone === 'good';
  return (
    <div style={{
      background: signal.soft, borderRadius: 'var(--r-card)', padding: '16px var(--pad)',
      boxShadow: 'var(--shadow-sm)',
      border: signal.tone === 'calm' ? '1px solid var(--hairline)' : 'none',
      display: 'flex', gap: 13, alignItems: 'flex-start',
    }}>
      <span style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: filled ? signal.accent : 'var(--pine-soft)',
        color: filled ? '#fff' : 'var(--pine)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
          <path d="M16.2 7.8a6 6 0 0 1 0 8.4M19 5a10 10 0 0 1 0 14M7.8 16.2a6 6 0 0 1 0-8.4M5 19a10 10 0 0 1 0-14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="smallcaps" style={{ color: signal.accent, marginBottom: 5 }}>{signal.lead}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)' }}>{signal.text}</div>
      </div>
    </div>
  );
}

// ---- B3: big payments on the forward view — outflows + inflows on one picture ----
function BigPaymentsForward() {
  const next = BIG_PAYMENTS.slice(0, 2);
  const total = BIG_PAYMENTS.reduce((s, p) => s + p.amt, 0);
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span className="smallcaps">Big payments ahead</span>
        <a href="keel-goal.html" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--pine)', textDecoration: 'none' }}>All {BIG_PAYMENTS.length} →</a>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
        Large costs Keel sets aside for before they land — so the gap never catches you out.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {next.map((p, i) => {
          const st = PAY_STATUS[p.status];
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
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
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Coming up in all</span>
        <span className="serif tnum" style={{ fontSize: 17, color: 'var(--ink)' }}>{money(total)}</span>
      </div>
    </Card>
  );
}

function HomeForward({ data }) {
  const { lean, likely, strong, paycheck, tracking, trackColor, signal, zakat } = data;
  const D = (i) => ({ animationDelay: `${i * 80}ms` });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* hero paycheck — the forward number */}
      <div className="rise" style={{ ...D(0),
        background: 'var(--hero-bg)', color: 'var(--hero-ink)',
        borderRadius: 'var(--r-card)', padding: '22px var(--pad) 24px',
        boxShadow: 'var(--shadow)',
      }}>
        <div className="smallcaps" style={{ color: 'var(--hero-ink)', opacity: 0.7 }}>Paycheck</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
          <span className="serif tnum" style={{ fontSize: 54, fontWeight: 500, lineHeight: 0.95, letterSpacing: -1 }}>
            <span style={{ fontSize: 23, fontWeight: 400, opacity: 0.6, marginRight: 8, letterSpacing: 0 }}>AED</span>{amt(paycheck)}
          </span>
          <span style={{ fontSize: 17, opacity: 0.7 }}>/mo</span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 14.5, opacity: 0.82 }}>
          Already planned for June.
        </p>
        <a href="keel-paycheck.html" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
          color: 'var(--hero-ink)', textDecoration: 'none', fontSize: 13, fontWeight: 700,
          background: 'rgba(244,241,230,0.15)', padding: '9px 15px', borderRadius: 'var(--r-pill)',
          border: '1px solid rgba(244,241,230,0.25)',
        }}>Adjust your paycheck <IconForward size={14} /></a>
      </div>

      {/* the heads-up signal — hero capability, right under the number */}
      {signal && <div className="rise" style={D(1)}><Signal signal={signal} /></div>}

      <div className="rise" style={D(2)}><Card><RangeBand lean={lean} likely={likely} strong={strong} paycheck={paycheck} tracking={tracking} trackColor={trackColor} /></Card></div>
      <div className="rise" style={D(3)}><Card><Allocation paycheck={paycheck} zakat={zakat} /></Card></div>
      <div className="rise" style={D(4)}><BigPaymentsForward /></div>

      {/* afford check — a forward-looking action, reachable in one tap */}
      <a className="rise" href="keel-afford.html" style={{ ...D(5),
        display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none',
        background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)',
        padding: '15px var(--pad)', border: '1px solid var(--hairline)',
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--pine-soft)', color: 'var(--pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconAfford size={21} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Thinking about a purchase?</span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>See if it still leaves your month working.</span>
        </span>
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}><path d="M1 1l6 6-6 6" stroke="var(--pine)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" /></svg>
      </a>
    </div>
  );
}
Object.assign(window, { HomeForward });
