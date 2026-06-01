// Import.jsx — onboarding / data setup. Two ways to build the full picture:
//   1) Upload bank statements → auto-categorize → review the unsure ones
//   2) Enter it manually through a structured list
// Reachable from Profile (and conceptually the sign-up flow).
const { useState: useImp, useEffect: useImpEffect, useRef: useImpRef } = React;

const REVIEW_TX = [
  { id: 1, who: 'Stripe transfer', amt: 9000,  date: 'May 3',  guess: 'Income' },
  { id: 2, who: 'WeWork',          amt: -1150, date: 'May 5',  guess: 'Rent & bills' },
  { id: 3, who: 'Adobe',           amt: -200,  date: 'May 7',  guess: 'Software' },
  { id: 4, who: 'Venmo — Jordan',  amt: -450,  date: 'May 12', guess: null },
  { id: 5, who: 'Amazon',          amt: -320,  date: 'May 18', guess: null },
];
const CATS = ['Income', 'Rent & bills', 'Food', 'Software', 'Transport', 'Other'];

function ImpHeader({ title, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
      <button onClick={onBack} style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--hairline)',
        background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none"><path d="M9 2 2 9l7 7" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="serif" style={{ fontSize: 23, color: 'var(--ink)' }}>{title}</div>
    </div>
  );
}

// ---- 1. choose method ----
function ChooseStep({ go }) {
  const opt = (key, title, desc, rec) => (
    <button onClick={() => go(key)} style={{
      width: '100%', textAlign: 'left', background: 'var(--surface)', cursor: 'pointer',
      border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '18px', position: 'relative',
      fontFamily: 'var(--font-ui)', display: 'block',
    }}>
      {rec && <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--on-pine)', background: 'var(--pine)', padding: '3px 9px', borderRadius: 999 }}>Fastest</span>}
      <div className="serif" style={{ fontSize: 19, color: 'var(--ink)', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.45, maxWidth: 280 }}>{desc}</div>
    </button>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <p style={{ margin: '0 0 4px', fontSize: 14.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        Keel works best when it can see your real money. Two ways to set that up:
      </p>
      {opt('upload', 'Upload bank statements', "Drop a statement from your bank app — Keel reads the transactions and sorts them for you. Add as many months as you like.", true)}
      {opt('manual', 'Enter it manually', "Walk through your income, fixed costs and subscriptions in a simple list.")}
    </div>
  );
}

// ---- 2a. upload ----
function UploadStep({ months, addMonth, onAnalyze }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        border: '1.5px dashed var(--hairline)', borderRadius: 'var(--r-card)', background: 'var(--surface)',
        padding: '30px 20px', textAlign: 'center',
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--pine-soft)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M7 9l5-5 5 5M5 18v2h14v-2" stroke="var(--pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Drop a statement here</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>PDF or CSV from your bank app</div>
      </div>

      <div>
        <div className="smallcaps" style={{ marginBottom: 10 }}>Statements added</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {months.map(m => (
            <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--ink)', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 999, padding: '7px 13px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mint)' }} />{m}
            </span>
          ))}
          <button onClick={addMonth} style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)', background: 'var(--pine-soft)', border: 'none', borderRadius: 999, padding: '7px 13px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>+ Add month</button>
        </div>
      </div>

      <button onClick={onAnalyze} style={{
        width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer', marginTop: 4,
        background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
      }}>Read {months.length} statement{months.length > 1 ? 's' : ''}</button>
    </div>
  );
}

// processing — JS-driven progress (CSS animations are unreliable here)
function ProcessingStep({ pct }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 10px' }}>
      <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>Reading your statements…</div>
      <p style={{ margin: '0 0 26px', fontSize: 13.5, color: 'var(--muted)' }}>Finding transactions and sorting them into categories.</p>
      <div style={{ height: 10, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', maxWidth: 260, margin: '0 auto' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--pine)', borderRadius: 999 }} />
      </div>
      <div className="tnum" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 12 }}>{Math.round(pct * 1.42)} transactions scanned</div>
    </div>
  );
}

// ---- 2a-review. categorize the unsure ones ----
function ReviewStep({ onDone }) {
  const [i, setI] = useImp(0);
  const [cat, setCat] = useImp(REVIEW_TX[0].guess);
  const [recurring, setRecurring] = useImp(false);
  const tx = REVIEW_TX[i];
  const advance = () => {
    if (i + 1 >= REVIEW_TX.length) { onDone(); return; }
    const n = REVIEW_TX[i + 1];
    setI(i + 1); setCat(n.guess); setRecurring(false);
  };
  return (
    <div>
      <div style={{ background: 'var(--pine-soft)', borderRadius: 16, padding: '13px 15px', marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>
          <b>142 transactions</b> found · <b>128</b> sorted automatically.
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>A few need your call:</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="smallcaps">Review · {i + 1} of {REVIEW_TX.length}</span>
        <button onClick={advance} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Skip</button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 600, color: 'var(--ink)' }}>{tx.who}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{tx.date}</div>
          </div>
          <div className="serif tnum" style={{ fontSize: 22, color: tx.amt > 0 ? 'var(--mint)' : 'var(--ink)' }}>
            {tx.amt > 0 ? '+' : '−'}{money(Math.abs(tx.amt))}
          </div>
        </div>

        <div className="smallcaps" style={{ fontSize: 10.5, margin: '18px 0 9px' }}>What kind of transaction?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 999, padding: '8px 13px',
              border: '1px solid ' + (cat === c ? 'var(--pine)' : 'var(--hairline)'),
              background: cat === c ? 'var(--pine)' : 'var(--surface)',
              color: cat === c ? 'var(--on-pine)' : 'var(--ink)', fontFamily: 'var(--font-ui)',
            }}>{c}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
          <div>
            <div style={{ fontSize: 14.5, color: 'var(--ink)' }}>Happens every month?</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Helps Keel plan ahead</div>
          </div>
          <Switch on={recurring} onClick={() => setRecurring(!recurring)} />
        </div>
      </Card>

      <button onClick={advance} disabled={!cat} style={{
        width: '100%', padding: '15px', borderRadius: 14, marginTop: 14,
        cursor: cat ? 'pointer' : 'default', opacity: cat ? 1 : 0.5,
        background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
      }}>{i + 1 >= REVIEW_TX.length ? 'Finish' : 'Save & next'}</button>
    </div>
  );
}

// ---- 2b. manual ----
function ManualStep({ onDone }) {
  const group = (header, rows) => (
    <div style={{ marginBottom: 18 }}>
      <div className="smallcaps" style={{ margin: '0 4px 9px' }}>{header}</div>
      <Card style={{ padding: '2px var(--pad)' }}>
        {rows.map((r, i) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '12px 0', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
            <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)' }}>{r}</span>
            <input placeholder="$0" style={{ width: 90, textAlign: 'right', border: 'none', background: 'none', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', outline: 'none' }} />
          </div>
        ))}
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--pine)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 0 }}>+ Add another</button>
        </div>
      </Card>
    </div>
  );
  return (
    <div>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
        Fill in what you know — you can always refine it later.
      </p>
      {group('Typical income', ['Main client work', 'Side gigs'])}
      {group('Fixed monthly costs', ['Rent', 'Utilities', 'Phone & internet'])}
      {group('Subscriptions', ['Software & tools', 'Streaming'])}
      {group('Set aside', ['Taxes (%)', 'Savings'])}
      <button onClick={onDone} style={{
        width: '100%', padding: '15px', borderRadius: 14, marginTop: 4, cursor: 'pointer',
        background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
      }}>Save my picture</button>
    </div>
  );
}

function DoneStep({ onClose }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 14px' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--pine)', color: 'var(--on-pine)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="serif" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>Your picture's ready</div>
      <p style={{ margin: '0 auto 24px', maxWidth: 260, fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>
        Keel now sees your income, costs and what's coming. Your steady paycheck is ready to set.
      </p>
      <a href="keel-paycheck.html" style={{
        display: 'inline-block', padding: '14px 26px', borderRadius: 999, textDecoration: 'none',
        background: 'var(--pine)', color: 'var(--on-pine)', fontSize: 15, fontWeight: 700,
      }}>Set your paycheck</a>
    </div>
  );
}

Object.assign(window, { ChooseStep, UploadStep, ProcessingStep, ReviewStep, ManualStep, DoneStep, ImpHeader });
