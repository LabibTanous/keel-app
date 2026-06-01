// Assistant.jsx — Keel's in-app AI financial adviser. Knows the user's plan
// and answers in plain language via window.claude.complete.
const { useState: useAsst, useRef: useAsstRef, useEffect: useAsstEffect } = React;

const KEEL_CONTEXT = `You are Keel's in-app financial adviser for a freelance creative based in the UAE with irregular income. Speak warmly, plainly and briefly — 2 to 4 sentences, no jargon, no hype, never scolding. All money is in AED.

The user's current plan:
- Steady paycheck they pay themselves: AED 14,000 / month.
- Honest income range this month: lean AED 9,000 / likely AED 16,000 / strong AED 23,000. The paycheck sits safely below a likely month.
- Where the paycheck goes: Rent & bills 6,200, Tax set-aside 1,200, Runway buffer 1,800, Spending 4,800.
- Savings buffer today: AED 23,000, building toward a full 3-month runway of AED 42,000, adding about 1,800 / month.
- Expected income coming in: an Atlas Co retainer (confirmed), a Northwind invoice, a podcast gig, a marketplace payout.
- Big payments ahead: quarterly taxes ~10,500 (Jul), software ~2,000 (Sep), health insurance ~4,800 (Nov), new laptop ~9,000 (Dec).
- Outlook: on track.

Answer the user's question using this context. If asked something you can't know, say so briefly and suggest what would help. Never invent specific numbers beyond what's given. You do NOT give specific investment advice (which stocks, crypto, funds to buy) — gently decline and steer back to planning, buffer and steady pay.`;

// Designed refusal — shown when asked for specific investment advice. The real
// classification is Claude Code's job; this client-side guard just makes the
// designed message reliably reviewable.
const ASST_REFUSAL = "That's outside what I can advise on \u2014 I can't recommend specific investments like stocks or crypto. What I can do is help you keep a healthy buffer and a steady paycheck, so when you do make those calls, it's with money you can spare.";
const isInvestmentAsk = (q) => /\b(stock|stocks|shares?|crypto|bitcoin|invest|investing|investment|portfolio|etf|mutual fund|forex|day ?trade|trading)\b/i.test(q);

const ASST_SUGGESTIONS = [
  'Can I afford a 9,000 laptop in December?',
  'How long until my runway is full?',
  'What if next month comes in lean?',
  'What stock should I buy?',
];

function Assistant({ open, onClose }) {
  const [msgs, setMsgs] = useAsst([{ role: 'assistant', content: "Hey — I'm your Keel adviser. Ask me anything about your money: your paycheck, what's coming, or your runway." }]);
  const [input, setInput] = useAsst('');
  const [busy, setBusy] = useAsst(false);
  const scrollRef = useAsstRef(null);
  useAsstEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, busy, open]);

  const ask = async (text) => {
    const q = (text || '').trim();
    if (!q || busy) return;
    const next = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setInput(''); setBusy(true);
    // gently decline specific investment advice (license-clean)
    if (isInvestmentAsk(q)) {
      setTimeout(() => { setMsgs(m => [...m, { role: 'assistant', content: ASST_REFUSAL }]); setBusy(false); }, 350);
      return;
    }
    try {
      const convo = next.map(m => (m.role === 'user' ? 'User: ' : 'Adviser: ') + m.content).join('\n');
      const reply = await window.claude.complete({
        messages: [{ role: 'user', content: KEEL_CONTEXT + '\n\nConversation so far:\n' + convo + '\n\nReply as the adviser to the latest user message.' }],
      });
      setMsgs(m => [...m, { role: 'assistant', content: (reply || '').trim() || "Sorry — I didn't catch that. Try asking again." }]);
    } catch (e) {
      setMsgs(m => [...m, { role: 'assistant', content: "I couldn't reach the adviser just now — give it another go in a moment." }]);
    }
    setBusy(false);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,25,21,0.4)', opacity: open ? 1 : 0 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '88%',
        background: 'var(--bg)', borderRadius: '26px 26px 0 0',
        transform: open ? 'translateY(0)' : 'translateY(1000px)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 18px 12px', borderBottom: '1px solid var(--hairline)' }}>
          <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--pine)', color: 'var(--on-pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconSpark size={19} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>Keel adviser</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Knows your plan · here to help</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 16 }}>✕</button>
        </div>

        {/* messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '84%' }}>
              <div style={{
                background: m.role === 'user' ? 'var(--pine)' : 'var(--surface)',
                color: m.role === 'user' ? 'var(--on-pine)' : 'var(--ink)',
                border: m.role === 'user' ? 'none' : '1px solid var(--hairline)',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '11px 14px', fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>{m.content}</div>
            </div>
          ))}
          {busy && (
            <div style={{ alignSelf: 'flex-start', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', color: 'var(--muted)', fontSize: 14 }}>thinking…</div>
          )}
          {msgs.length === 1 && !busy && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {ASST_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => ask(s)} style={{
                  background: 'var(--pine-soft)', color: 'var(--pine)', border: 'none', borderRadius: 999,
                  padding: '9px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left',
                }}>{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* input */}
        <div style={{ borderTop: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 16px 2px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" style={{ opacity: 0.5 }}><circle cx="12" cy="12" r="9.2" fill="none" stroke="var(--muted)" strokeWidth="1.8" /><path d="M12 11v5.5" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="7.6" r="1.15" fill="var(--muted)" /></svg>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Keel offers general guidance, not financial advice.</span>
          </div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '6px 16px', paddingBottom: 22 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(input); }}
              placeholder="Ask about your money…" style={{
                flex: 1, border: '1px solid var(--hairline)', background: 'var(--surface)', borderRadius: 999,
                padding: '12px 16px', fontSize: 16, fontFamily: 'var(--font-ui)', color: 'var(--ink)', outline: 'none',
              }} />
            <button onClick={() => ask(input)} disabled={busy} style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: 'pointer',
              background: 'var(--pine)', color: 'var(--on-pine)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.5 : 1,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Assistant });
