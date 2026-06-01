'use client';

/**
 * Assistant.tsx — Keel's in-app AI financial adviser.
 * TypeScript port of keel_handoff/design_reference/components/Assistant.jsx.
 *
 * Knows the user's current plan. Streams answers via window.claude?.complete.
 * Falls back to static responses if window.claude unavailable.
 * Refuses specific investment advice (stocks, crypto, ETFs, etc.) with a
 * designed refusal message.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { Plan } from '@/lib/store';
import { IconSpark } from '@/components/keel/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssistantProps {
  open: boolean;
  onClose: () => void;
  plan: Plan;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_MESSAGE = "Hey — I'm your Keel adviser. Ask me anything about your money: your paycheck, what's coming, or your runway.";

const ASST_REFUSAL =
  "That’s outside what I can advise on — I can’t recommend specific investments like stocks or crypto. What I can do is help you keep a healthy buffer and a steady paycheck, so when you do make those calls, it’s with money you can spare.";

const ASST_SUGGESTIONS = [
  "What’s my outlook?",
  "Should I raise my paycheck?",
  "When will I hit my goal?",
  "Can I afford a vacation?",
];

// ── Investment ask guard ──────────────────────────────────────────────────────

function isInvestmentAsk(q: string): boolean {
  return /\b(stock|stocks|shares?|crypto|bitcoin|invest|investing|investment|portfolio|etf|mutual fund|forex|day ?trade|trading)\b/i.test(q);
}

// ── Build system context from live plan ───────────────────────────────────────

function buildContext(plan: Plan): string {
  const { range, paycheck, allocation, runway, outlook, trackedThisMonth } = plan;
  return `You are Keel’s in-app financial adviser for a freelancer with irregular income. Speak warmly, plainly and briefly — 2 to 4 sentences, no jargon, no hype, never scolding. All money is in AED.

The user’s current plan:
- Steady paycheck they pay themselves: AED ${Math.round(paycheck).toLocaleString('en-US')} / month.
- Honest income range: lean AED ${Math.round(range.lean).toLocaleString('en-US')} / likely AED ${Math.round(range.likely).toLocaleString('en-US')} / strong AED ${Math.round(range.strong).toLocaleString('en-US')}. ${range.provisional ? 'Provisional — fewer than 3 months of data.' : 'Based on real history.'}
- Where the paycheck goes: Rent & bills ${Math.round(allocation.rentAndBills).toLocaleString('en-US')}, Tax set-aside ${Math.round(allocation.tax).toLocaleString('en-US')}, Runway buffer ${Math.round(allocation.buffer).toLocaleString('en-US')}, Spending ${Math.round(allocation.spending).toLocaleString('en-US')}.
- Buffer runway: ${runway} months (${Math.round(allocation.rentAndBills * runway).toLocaleString('en-US')} AED saved).
- Income tracked so far this month: AED ${Math.round(trackedThisMonth).toLocaleString('en-US')}.
- Outlook: ${outlook}.

Answer the user’s question using this context. If asked something you can’t know, say so briefly and suggest what would help. Never invent specific numbers beyond what’s given. You do NOT give specific investment advice (which stocks, crypto, funds to buy) — gently decline and steer back to planning, buffer and steady pay.`;
}

// Fallback static responses when window.claude is unavailable
function staticFallback(question: string, plan: Plan): string {
  const q = question.toLowerCase();
  if (q.includes('outlook') || q.includes('track')) {
    return `Your outlook is currently “${plan.outlook}”. ${plan.outlook === 'on track' ? 'Your buffer is healthy and the plan holds.' : plan.outlook === 'strong' ? 'You’re ahead of pace — a great chance to top up your buffer.' : 'Income is light so far, but your buffer keeps the plan whole.'}`;
  }
  if (q.includes('paycheck') || q.includes('raise')) {
    return `Your current paycheck is AED ${Math.round(plan.paycheck).toLocaleString('en-US')} — set just below a likely month so even a lean stretch keeps your plan intact. ${plan.range.provisional ? 'Log a few more months of income to tighten the estimate.' : 'It’s calibrated on your real history.'}`;
  }
  if (q.includes('runway') || q.includes('goal') || q.includes('hit')) {
    return `You’re at ${plan.runway} months of runway. Each month Keel adds AED ${Math.round(plan.allocation.buffer).toLocaleString('en-US')} to your buffer, quietly building toward your target.`;
  }
  if (q.includes('afford') || q.includes('vacation') || q.includes('buy')) {
    return `Check the “Can I afford this?” tool — it weighs any purchase against your spending budget and buffer before you commit.`;
  }
  return `I couldn’t reach the adviser just now — give it another go in a moment.`;
}

// ── Declare global window.claude type extension ───────────────────────────────

declare global {
  interface Window {
    claude?: {
      complete: (opts: {
        messages: { role: string; content: string }[];
      }) => Promise<string>;
    };
  }
}

// ── Assistant component ───────────────────────────────────────────────────────

export function Assistant({ open, onClose, plan }: AssistantProps) {
  const [msgs, setMsgs] = useState<Message[]>([
    { role: 'assistant', content: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, busy, open]);

  // Reset to initial state when sheet opens
  useEffect(() => {
    if (open) {
      setMsgs([{ role: 'assistant', content: INITIAL_MESSAGE }]);
      setInput('');
      setBusy(false);
    }
  }, [open]);

  async function ask(text: string) {
    const q = (text || '').trim();
    if (!q || busy) return;

    const next: Message[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next);
    setInput('');
    setBusy(true);

    // Designed refusal for investment questions
    if (isInvestmentAsk(q)) {
      setTimeout(() => {
        setMsgs(m => [...m, { role: 'assistant', content: ASST_REFUSAL }]);
        setBusy(false);
      }, 350);
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.claude?.complete) {
        const convo = next
          .map(m => (m.role === 'user' ? 'User: ' : 'Adviser: ') + m.content)
          .join('\n');
        const context = buildContext(plan);
        const reply = await window.claude.complete({
          messages: [{
            role: 'user',
            content: context + '\n\nConversation so far:\n' + convo + '\n\nReply as the adviser to the latest user message.',
          }],
        });
        setMsgs(m => [
          ...m,
          { role: 'assistant', content: (reply || '').trim() || "Sorry — I didn’t catch that. Try asking again." },
        ]);
      } else {
        // Fallback to static response
        const reply = staticFallback(q, plan);
        setMsgs(m => [...m, { role: 'assistant', content: reply }]);
      }
    } catch {
      setMsgs(m => [
        ...m,
        { role: 'assistant', content: "I couldn’t reach the adviser just now — give it another go in a moment." },
      ]);
    }

    setBusy(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') ask(input);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(20,25,21,0.4)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: '88%',
          background: 'var(--bg)', borderRadius: '26px 26px 0 0',
          transform: open ? 'translateY(0)' : 'translateY(1000px)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '16px 18px 12px',
          borderBottom: '1px solid var(--hairline)',
        }}>
          <span style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--pine)', color: 'var(--on-pine)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconSpark size={19} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>Keel adviser</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Knows your plan &middot; here to help</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: 'var(--surface-2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', fontSize: 16, fontFamily: 'var(--font-ui)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as 'auto',
            padding: '16px 16px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '84%' }}
            >
              <div style={{
                background: m.role === 'user' ? 'var(--pine)' : 'var(--surface)',
                color: m.role === 'user' ? 'var(--on-pine)' : 'var(--ink)',
                border: m.role === 'user' ? 'none' : '1px solid var(--hairline)',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '11px 14px', fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {busy && (
            <div style={{
              alignSelf: 'flex-start',
              background: 'var(--surface)', border: '1px solid var(--hairline)',
              borderRadius: '16px 16px 16px 4px',
              padding: '12px 16px', color: 'var(--muted)', fontSize: 14,
            }}>
              thinking&hellip;
            </div>
          )}

          {msgs.length === 1 && !busy && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {ASST_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  style={{
                    background: 'var(--pine-soft)', color: 'var(--pine)',
                    border: 'none', borderRadius: 999,
                    padding: '9px 13px', fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ borderTop: '1px solid var(--hairline)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '8px 16px 2px',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
              <circle cx="12" cy="12" r="9.2" fill="none" stroke="var(--muted)" strokeWidth="1.8" />
              <path d="M12 11v5.5" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="7.6" r="1.15" fill="var(--muted)" />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Keel offers general guidance, not financial advice.
            </span>
          </div>
          <div style={{
            display: 'flex', gap: 9, alignItems: 'center',
            padding: '6px 16px', paddingBottom: 22,
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your money…"
              style={{
                flex: 1, border: '1px solid var(--hairline)',
                background: 'var(--surface)', borderRadius: 999,
                padding: '12px 16px', fontSize: 16,
                fontFamily: 'var(--font-ui)', color: 'var(--ink)', outline: 'none',
              }}
            />
            <button
              onClick={() => ask(input)}
              disabled={busy}
              style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                border: 'none', cursor: busy ? 'default' : 'pointer',
                background: 'var(--pine)', color: 'var(--on-pine)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: busy ? 0.5 : 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
