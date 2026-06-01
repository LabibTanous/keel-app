// Goal.jsx — a named goal with a calm climbing trajectory, PLUS a timeline of
// big upcoming payments (outflows) so Keel sees the whole financial picture.
// BIG_PAYMENTS / PAY_STATUS now live in ui.jsx (shared with the forward Home).
const GOAL = { name: 'Three-month runway', target: 42000, saved: 23000, monthly: 1800 };

function GoalHero({ behind }) {
  const pct = Math.round((GOAL.saved / GOAL.target) * 100);
  const projLabel = behind ? '≈ Aug 2027' : '≈ May 2027';
  return (
    <Card style={{ padding: '20px var(--pad) 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="smallcaps">Your goal</div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginTop: 3 }}>{GOAL.name}</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
          color: 'var(--ink)', background: 'var(--surface-2)', padding: '6px 11px', borderRadius: 999,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: behind ? 'var(--clay)' : 'var(--mint)' }} />
          {behind ? 'A bit behind' : 'On track'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '16px 0 4px' }}>
        <span className="serif tnum" style={{ fontSize: 44, fontWeight: 500, color: 'var(--ink)', lineHeight: 0.95, letterSpacing: -0.5 }}><Cur n={GOAL.saved} /></span>
        <span style={{ fontSize: 14.5, color: 'var(--muted)' }}>of {money(GOAL.target)}</span>
      </div>
      {/* progress */}
      <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', margin: '10px 0 18px' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--pine)', borderRadius: 999 }} />
      </div>

      <GoalChart saved={GOAL.saved} target={GOAL.target} projLabel={projLabel} behind={behind} />

      <p style={{ margin: '16px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        Adding <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{money(GOAL.monthly)}/mo</span> from your buffer.
        {behind
          ? ' A couple of lean months pushed your date back — nudge the amount up to catch it.'
          : ' Keep this up and you reach a full runway by spring.'}
      </p>
    </Card>
  );
}

// Big upcoming payments on a horizontal timeline — the outflow side of the
// picture. Dots sized by amount; the list shows what's set aside already.
function BigPaymentsTimeline() {
  const maxAmt = Math.max(...BIG_PAYMENTS.map(p => p.amt));
  const r = (a) => 6 + (a / maxAmt) * 8;
  return (
    <Card>
      <div style={{ marginBottom: 4 }}>
        <span className="smallcaps">Big payments ahead</span>
      </div>
      <p style={{ margin: '0 0 22px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
        The full picture — large costs Keel sets aside for before they land.
      </p>

      {/* horizontal timeline */}
      <div style={{ position: 'relative', height: 58, margin: '0 4px 8px' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 28, height: 2, background: 'var(--hairline)', borderRadius: 2 }} />
        {BIG_PAYMENTS.map(p => {
          const c = PAY_STATUS[p.status].color;
          const rad = r(p.amt);
          return (
            <div key={p.id} style={{ position: 'absolute', left: `${p.pos * 100}%`, top: 0, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
              <div className="tnum" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink)' }}>{moneyK(p.amt)}</div>
              <div style={{ height: 6 }} />
              <div style={{ width: rad * 2, height: rad * 2, borderRadius: '50%', background: c, margin: '0 auto', border: '2px solid var(--surface)', boxShadow: 'var(--shadow-sm)' }} />
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5, fontWeight: 600 }}>{p.m}</div>
            </div>
          );
        })}
      </div>

      {/* list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 8 }}>
        {BIG_PAYMENTS.map((p, i) => {
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
    </Card>
  );
}

// Smart tax entry — surfaces the threshold-aware calendar near Big payments.
// Hidden entirely when nothing applies (honest: no empty feature).
function TaxEntry({ status }) {
  if (!status || status === 'none') return null;
  const cfg = {
    approaching: { color: 'var(--gold)', soft: 'var(--gold-soft)', head: 'Approaching the VAT line', sub: "Near AED 375k turnover — an early heads-up. Nothing's due yet." },
    due:         { color: 'var(--clay)', soft: 'var(--clay-soft)', head: 'A tax line needs action', sub: 'Keel flagged it early, so there’s time to sort it calmly.' },
    clear:       { color: 'var(--pine)', soft: 'var(--surface)',   head: 'Tax & registrations', sub: 'Nothing due — Keel is watching the lines for you.' },
  }[status];
  return (
    <a href="keel-tax.html" style={{
      display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none',
      background: cfg.soft, borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-sm)',
      padding: '15px var(--pad)', border: '1px solid var(--hairline)',
    }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: cfg.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IconCalendar size={21} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{cfg.head}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{cfg.sub}</span>
      </span>
      <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}><path d="M1 1l6 6-6 6" stroke={cfg.color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" /></svg>
    </a>
  );
}

function GoalScreen({ behind, taxStatus }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="rise"><GoalHero behind={behind} /></div>
      <div className="rise" style={{ animationDelay: '90ms' }}><BigPaymentsTimeline /></div>
      <div className="rise" style={{ animationDelay: '150ms' }}><TaxEntry status={taxStatus} /></div>
    </div>
  );
}

function GoalEmpty() {
  return (
    <div className="rise" style={{ paddingTop: 8 }}>
      <Card style={{ textAlign: 'center', padding: '34px 22px' }}>
        <div style={{
          height: 96, borderRadius: 14, marginBottom: 18,
          background: 'repeating-linear-gradient(135deg, var(--surface-2) 0 10px, transparent 10px 20px)',
          border: '1px dashed var(--hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)',
        }}>goal trajectory</div>
        <div className="serif" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>No goal yet</div>
        <p style={{ margin: '0 auto', maxWidth: 250, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          Name something you're saving toward — a tax bill, a runway, a big buy — and Keel will chart a calm path to it.
        </p>
      </Card>
    </div>
  );
}

Object.assign(window, { GoalScreen, GoalEmpty });
