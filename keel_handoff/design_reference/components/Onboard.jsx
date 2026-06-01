// Onboard.jsx — the real, data-collecting setup wizard. One calm decision per
// step: region → monthly essentials → buffer → seed income → land on a
// (provisional) paycheck suggestion. The promo slides are a brief intro before
// this; the data this collects is what actually feeds the plan.
//
// NOTE: the final step shows a PROVISIONAL suggestion only — the real engine
// computes the wage. We present it as "a starting point that sharpens as you
// log more" and hand straight to the paycheck screen; no number is hand-tuned.

const ONBOARD_REGIONS = [
  { name: 'United Arab Emirates', ccy: 'AED', enables: 'VAT & Corporate Tax lines · Zakat' },
  { name: 'Saudi Arabia',         ccy: 'SAR', enables: 'VAT · Zakat' },
  { name: 'Qatar',                ccy: 'QAR', enables: 'Zakat' },
  { name: 'Kuwait',               ccy: 'KWD', enables: 'Zakat' },
  { name: 'Egypt',                ccy: 'EGP', enables: 'VAT' },
  { name: 'Jordan',               ccy: 'JOD', enables: 'Sales tax' },
];

const obInput = {
  width: '100%', padding: '13px 14px', borderRadius: 13, boxSizing: 'border-box',
  border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)',
  fontFamily: 'var(--font-ui)', fontSize: 16, outline: 'none',
};
function ObField({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>{label}</div>
      {children}
    </label>
  );
}
function ObAmount({ value, onChange, ccy, onCcy, placeholder = '0' }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, ...obInput, padding: '0 14px' }}>
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>{!onCcy ? 'AED' : ''}</span>
        <input inputMode="numeric" value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9,]/g, ''))}
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--ink)', padding: '13px 0' }} />
      </div>
      {onCcy && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select value={ccy} onChange={(e) => onCcy(e.target.value)} style={{ ...obInput, width: 'auto', paddingRight: 32, appearance: 'none', WebkitAppearance: 'none', fontWeight: 700, cursor: 'pointer' }}>
            {['AED', 'USD', 'EUR', 'GBP', 'SAR'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <svg width="10" height="6" viewBox="0 0 10 6" style={{ position: 'absolute', right: 13, top: '50%', marginTop: -3, pointerEvents: 'none' }}><path d="M1 1l4 4 4-4" stroke="var(--muted)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
    </div>
  );
}

function StepIntro({ title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="serif" style={{ fontSize: 27, lineHeight: 1.12, color: 'var(--ink)', letterSpacing: -0.3 }}>{title}</div>
      {sub && <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.5, color: 'var(--muted)' }}>{sub}</p>}
    </div>
  );
}

// ── 1. region ──────────────────────────────────────────────────────────────
function RegionStep({ data, set }) {
  const sel = ONBOARD_REGIONS.find(r => r.name === data.region);
  return (
    <div>
      <StepIntro title="Where are you based?" sub="This sets your currency, which tax lines Keel watches, and whether Zakat applies." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {ONBOARD_REGIONS.map(r => {
          const on = r.name === data.region;
          return (
            <button key={r.name} onClick={() => set({ region: r.name, ccy: r.ccy })} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer',
              background: on ? 'var(--pine-soft)' : 'var(--surface)', fontFamily: 'var(--font-ui)',
              border: '1px solid ' + (on ? 'var(--pine)' : 'var(--hairline)'), borderRadius: 14, padding: '14px 15px',
            }}>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: on ? 'var(--pine)' : 'var(--ink)' }}>{r.name}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{r.ccy} · {r.enables}</span>
              </span>
              {on && <svg width="16" height="13" viewBox="0 0 14 11" fill="none"><path d="M1 6l4 4 8-9" stroke="var(--pine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. essentials ──────────────────────────────────────────────────────────
function EssentialsStep({ data, set }) {
  const rent = parseInt(String(data.rent).replace(/[^0-9]/g, ''), 10) || 0;
  const bills = parseInt(String(data.bills).replace(/[^0-9]/g, ''), 10) || 0;
  const total = rent + bills;
  return (
    <div>
      <StepIntro title="What does a month cost to keep going?" sub="Your essentials — rent and the bills that don't stop. Keel makes sure your paycheck always clears these." />
      <ObField label="Rent / housing"><ObAmount value={data.rent} onChange={(v) => set({ rent: v })} /></ObField>
      <ObField label="Bills & utilities"><ObAmount value={data.bills} onChange={(v) => set({ bills: v })} /></ObField>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '14px 16px', marginTop: 4 }}>
        <span style={{ fontSize: 14, color: 'var(--ink)' }}>Essentials a month</span>
        <span className="serif tnum" style={{ fontSize: 22, color: 'var(--pine)' }}><Cur n={total} /></span>
      </div>
    </div>
  );
}

// ── 3. buffer ──────────────────────────────────────────────────────────────
function SavingsStep({ data, set }) {
  return (
    <div>
      <StepIntro title="What's in your buffer today?" sub="Whatever you've set aside — it's the cushion Keel plans around. A rough number is fine." />
      <ObField label="Savings / buffer"><ObAmount value={data.savings} onChange={(v) => set({ savings: v })} /></ObField>
      <p style={{ margin: '2px 2px 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        No buffer yet? Leave it at zero — Keel will help you build one from your first steady months.
      </p>
    </div>
  );
}

// ── 4. seed income ─────────────────────────────────────────────────────────
function SeedIncomeStep({ data, set }) {
  const rows = data.incomes;
  const update = (i, patch) => set({ incomes: rows.map((r, j) => j === i ? { ...r, ...patch } : r) });
  const add = () => set({ incomes: [...rows, { amt: '', ccy: 'AED', when: '' }] });
  return (
    <div>
      <StepIntro title="Your last few payments" sub="Keel reads your real history to suggest a steady wage. Add a few — the more you log, the sharper it gets." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><ObAmount value={r.amt} onChange={(v) => update(i, { amt: v })} ccy={r.ccy} onCcy={(v) => update(i, { ccy: v })} placeholder="Amount" /></div>
          </div>
        ))}
      </div>
      <button onClick={add} style={{ marginTop: 12, background: 'var(--pine-soft)', color: 'var(--pine)', border: 'none', borderRadius: 999, padding: '9px 15px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>+ Add another payment</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 2px 14px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--muted)' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
      </div>
      <a href="keel-import.html" style={{
        display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
        background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '14px 15px',
      }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M7 9l5-5 5 5M5 18v2h14v-2" stroke="var(--pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>Connect a bank or import</span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>Let Keel read your statements instead</span>
        </span>
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}><path d="M1 1l6 6-6 6" stroke="var(--muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" /></svg>
      </a>
    </div>
  );
}

// ── 5. ready (provisional suggestion) ──────────────────────────────────────
function ReadyStep({ data }) {
  const filled = data.incomes.filter(r => parseInt(String(r.amt).replace(/[^0-9]/g, ''), 10) > 0).length;
  const provisional = filled < 3; // few payments → low-confidence, honest
  return (
    <div style={{ textAlign: 'center', paddingTop: 8 }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--pine)', color: 'var(--on-pine)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="serif" style={{ fontSize: 25, color: 'var(--ink)', marginBottom: 8 }}>Your picture's ready</div>
      <p style={{ margin: '0 auto 20px', maxWidth: 280, fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>
        From what you've entered, Keel has a steady paycheck to start you off.
      </p>
      <Card style={{ textAlign: 'left', padding: '18px var(--pad)' }}>
        <div className="smallcaps">{provisional ? 'Provisional paycheck' : 'Suggested paycheck'}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '7px 0 0' }}>
          <span className="serif tnum" style={{ fontSize: 38, fontWeight: 500, color: 'var(--ink)', lineHeight: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 400, color: 'var(--muted)', marginRight: 6 }}>AED</span>14,000
          </span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>/mo</span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
          {provisional
            ? <span>A starting point from just a few payments — it'll <b style={{ color: 'var(--ink)' }}>sharpen as you log more</b>. You can adjust it any time.</span>
            : <span>Set just below a likely month, so a lean stretch still leaves you whole. You can fine-tune it next.</span>}
        </p>
      </Card>
    </div>
  );
}

Object.assign(window, { ONBOARD_REGIONS, RegionStep, EssentialsStep, SavingsStep, SeedIncomeStep, ReadyStep });
