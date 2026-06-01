// AddFlow.jsx — the global "+" action. Step 1: choose what you're adding.
// Step 2: a form appropriate to that function. Used by every screen's dock.
const { useState: useAdd, useEffect: useAddEffect } = React;

const ADD_TYPES = [
  { key: 'income',  label: 'Expected income', desc: 'An invoice, gig or payment', color: 'var(--mint)' },
  { key: 'received', label: 'Money received',  desc: "A payment that's landed",   color: 'var(--pine)' },
  { key: 'expense', label: 'An expense',       desc: 'Something you spent',        color: 'var(--clay)' },
  { key: 'payment', label: 'Big payment',      desc: 'A large cost coming up',     color: 'var(--gold)' },
  { key: 'goal',    label: 'New goal',         desc: 'Something to save toward',   color: 'var(--pine)' },
];

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>{label}</div>
      {children}
    </label>
  );
}
const inputStyle = {
  width: '100%', padding: '13px 14px', borderRadius: 13, boxSizing: 'border-box',
  border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)',
  fontFamily: 'var(--font-ui)', fontSize: 16, outline: 'none',
};
function TextInput(props) { return <input {...props} style={inputStyle} />; }

function AddForm({ type, onDone }) {
  const [seg, setSeg] = useAdd(type === 'income' ? 'likely' : type === 'expense' ? 'oneoff' : 'on');
  const [ccy, setCcy] = useAdd('AED');
  const [amount, setAmount] = useAdd('');
  const cfg = {
    income: {
      title: 'Expecting money', cta: 'Track this income',
      fields: [['Source', 'e.g. Northwind Studio'], ['Amount', '0'], ['Expected', 'Jun 30']],
      segLabel: 'How sure are you?',
      seg: [{ value: 'confirmed', label: 'Confirmed' }, { value: 'likely', label: 'Likely' }, { value: 'unconfirmed', label: 'Unsure' }],
      note: "Tracked now — you decide later if it counts toward your plan.",
    },
    received: {
      title: 'Money received', cta: 'Log received payment',
      fields: [['Source', 'e.g. Atlas Co'], ['Amount', '0'], ['Date received', 'Today']],
      segLabel: null, seg: null,
      note: "Adds to your real history — what your steady paycheck is built from.",
    },
    expense: {
      title: 'Log an expense', cta: 'Add expense',
      fields: [['What for', 'e.g. Software'], ['Amount', 'AED 0'], ['Date', 'Today']],
      segLabel: 'Type',
      seg: [{ value: 'oneoff', label: 'One-off' }, { value: 'recurring', label: 'Recurring' }],
      note: null,
    },
    payment: {
      title: 'A big payment ahead', cta: 'Add to timeline',
      fields: [['What for', 'e.g. Quarterly taxes'], ['Amount', 'AED 0'], ['Due', 'Jul 15']],
      segLabel: 'Set aside for it?',
      seg: [{ value: 'on', label: 'Automatically' }, { value: 'off', label: 'Not yet' }],
      note: "Keel will quietly set money aside before it lands.",
    },
    goal: {
      title: 'Start a goal', cta: 'Start saving',
      fields: [['Name it', 'e.g. Three-month runway'], ['Target', 'AED 0'], ['By when', 'Optional']],
      segLabel: null, seg: null,
      note: "Keel charts a calm path from your buffer.",
    },
  }[type];

  const amtNum = parseInt(String(amount).replace(/[^0-9]/g, ''), 10) || 0;

  return (
    <div>
      {cfg.fields.map(([l, ph]) => {
        // income amounts can be in a foreign currency — show the picker + live ≈AED
        if ((type === 'income' || type === 'received') && l === 'Amount') {
          return (
            <Field key={l} label={l}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ''))} inputMode="numeric" placeholder={ph} style={{ ...inputStyle, flex: 1 }} />
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <select value={ccy} onChange={(e) => setCcy(e.target.value)} style={{
                    ...inputStyle, width: 'auto', paddingRight: 32, appearance: 'none', WebkitAppearance: 'none',
                    fontWeight: 700, cursor: 'pointer',
                  }}>
                    {['AED', 'USD', 'EUR', 'GBP', 'SAR'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg width="10" height="6" viewBox="0 0 10 6" style={{ position: 'absolute', right: 13, top: '50%', marginTop: -3, pointerEvents: 'none' }}><path d="M1 1l4 4 4-4" stroke="var(--muted)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
              {ccy !== 'AED' && (
                <div style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 2px 0' }}>
                  {amtNum > 0 ? approxAED(toAED(amtNum, ccy)) : '≈ AED —'} {type === 'received' ? 'recorded' : 'in your plan'}, at today's rate
                </div>
              )}
            </Field>
          );
        }
        return <Field key={l} label={l}><TextInput placeholder={ph} /></Field>;
      })}
      {cfg.seg && (
        <Field label={cfg.segLabel}>
          <Segmented value={seg} onChange={setSeg} options={cfg.seg} />
        </Field>
      )}
      {cfg.note && (
        <p style={{ margin: '4px 2px 16px', fontSize: 12.5, lineHeight: 1.45, color: 'var(--muted)' }}>{cfg.note}</p>
      )}
      <button onClick={onDone} style={{
        width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer',
        background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
      }}>{cfg.cta}</button>
    </div>
  );
}

function AddFlow({ open, onClose }) {
  const [step, setStep] = useAdd('choose');
  useAddEffect(() => { if (open) setStep('choose'); }, [open]);
  const current = ADD_TYPES.find(t => t.key === step);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,25,21,0.32)', opacity: open ? 1 : 0 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--bg)', borderRadius: '26px 26px 0 0', padding: '12px 18px 28px',
        transform: open ? 'translateY(0)' : 'translateY(900px)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        maxHeight: '88%', overflowY: 'auto',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--hairline)', margin: '0 auto 16px' }} />

        {step === 'choose' ? (
          <div>
            <div className="serif" style={{ fontSize: 23, color: 'var(--ink)', marginBottom: 3 }}>Add to your picture</div>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--muted)' }}>What's coming in, going out, or worth saving for?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ADD_TYPES.map(t => (
                <button key={t.key} onClick={() => setStep(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left',
                  background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 16,
                  padding: '14px 15px', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: t.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>{t.label}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{t.desc}</span>
                  </span>
                  <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}><path d="M1 1l6 6-6 6" stroke="var(--muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" /></svg>
                </button>
              ))}
            </div>
            {/* a tool, not an entry — weigh a purchase against the plan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 2px 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--muted)' }}>Before you buy</span>
              <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
            </div>
            <a href="keel-afford.html" style={{
              display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none',
              background: 'var(--pine-soft)', border: '1px solid var(--hairline)', borderRadius: 16,
              padding: '14px 15px', fontFamily: 'var(--font-ui)',
            }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--pine)', color: 'var(--on-pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconAfford size={19} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>Can I afford this?</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>Check a purchase against your plan</span>
              </span>
              <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}><path d="M1 1l6 6-6 6" stroke="var(--pine)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" /></svg>
            </a>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <button onClick={() => setStep('choose')} style={{
                width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--hairline)',
                background: 'var(--surface)', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="9" height="15" viewBox="0 0 9 15" fill="none"><path d="M7 2 2 7.5 7 13" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="serif" style={{ fontSize: 21, color: 'var(--ink)' }}>{({ income: 'Expecting money', received: 'Money received', expense: 'Log an expense', payment: 'A big payment ahead', goal: 'Start a goal' })[step]}</div>
            </div>
            <AddForm type={step} onDone={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AddFlow });
