'use client';

/**
 * Assistant.tsx — Keel's in-app AI financial adviser.
 * TypeScript port of keel_handoff/design_reference/components/Assistant.jsx.
 *
 * Knows the user's current plan. Calls /api/assistant (Anthropic server-side).
 * Falls back to static responses if the API key is not configured.
 * Refuses specific investment advice (stocks, crypto, ETFs, etc.) with a
 * designed refusal message.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { Plan } from '@/lib/store';
import { usePlan } from '@/lib/store';
import { IconSpark } from '@/components/keel/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssistantProps {
  open: boolean;
  onClose: () => void;
  plan: Plan;
}

interface Message {
  id: string;
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

// Only refuse specific stock/crypto pick requests, not general investment questions
function isSpecificInvestmentPick(q: string): boolean {
  return /\b(should I buy|should i sell|buy bitcoin|buy tesla|buy apple|buy amazon|which stock|which crypto|pick a stock|recommend a stock|recommend a fund|best etf|best crypto)\b/i.test(q);
}

// ── Build system context from live plan ───────────────────────────────────────

function buildContext(plan: Plan): string {
  const { range, paycheck, allocation, runway, outlook, trackedThisMonth, interpretations, volatilityTrend: volTrend } = plan;
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

  const lines: string[] = [
    "You are Keel’s in-app financial adviser for a freelancer with irregular income.",
    "Coaching stance: reflect what the numbers mean, don’t direct or lecture. Be warm and brief — 2 to 4 sentences. No jargon, no hype, never scolding. All money is in AED.",
    "You know the user’s full financial profile — reference actual numbers when answering.",
    "You CAN discuss general investment strategies (broad asset classes, diversification principles, emergency fund sizing, general allocation frameworks) — just not specific stock picks, individual crypto coins, or active trading advice.",
    "When answering spending or saving questions, factor in the user’s actual goals and upcoming payments.",
    "",
    "The user’s current plan:",
    `- Steady paycheck they pay themselves: AED ${fmt(paycheck)} / month.`,
    `- Why this paycheck: ${interpretations.paycheckWhy}`,
    `- Honest income range: lean AED ${fmt(range.lean)} / likely AED ${fmt(range.likely)} / strong AED ${fmt(range.strong)}. ${range.provisional ? "Provisional — fewer than 3 months of data." : "Based on real history."}`,
    `- Where the paycheck goes: Rent & bills ${fmt(allocation.rentAndBills)}, Tax set-aside ${fmt(allocation.tax)}, Runway buffer ${fmt(allocation.buffer)}, Spending ${fmt(allocation.spending)}.`,
    `- Buffer runway: ${runway} months. ${interpretations.runwayMeaning}`,
    `- Income tracked so far this month: AED ${fmt(trackedThisMonth)}.`,
    `- Outlook: ${outlook}. ${interpretations.outlookMeaning}`,
  ];

  if (volTrend.trend !== "stable") {
    lines.push(`- Income pattern: ${volTrend.message}`);
  }

  if (interpretations.taxMeaning) {
    lines.push(`- Tax note: ${interpretations.taxMeaning}`);
  }

  if (interpretations.spendingMeaning) {
    lines.push(`- Spending note: ${interpretations.spendingMeaning}`);
  }

  if (interpretations.topInsight) {
    lines.push(`- Most important right now: ${interpretations.topInsight}`);
  }

  // Goal / trajectory — so AI can reason across saving and spending in the same answer
  if (plan.goalTarget > 0) {
    const g = plan.goalInfo;
    const monthsStr = g.monthsToGoal !== null ? `${g.monthsToGoal} months` : "already at target";
    lines.push(`- Runway goal: AED ${fmt(plan.goalTarget)} target. Contributing AED ${fmt(g.requiredMonthly)}/mo — reaches goal in ${monthsStr}. Spending after buffer contribution: AED ${fmt(plan.allocation.spending)}/mo.`);
  }

  // User goals
  if (plan.userGoals && plan.userGoals.length > 0) {
    lines.push(`\nUSER GOALS:`);
    for (const g of plan.userGoals) {
      let goalLine = `- ${g.name}`;
      if (g.targetAmt > 0) goalLine += `: target AED ${g.targetAmt.toLocaleString()}`;
      if (g.targetDate) goalLine += ` by ${g.targetDate}`;
      lines.push(goalLine);
    }
  }

  // Monthly goal allocations
  if (plan.monthlyGoalContrib > 0) {
    lines.push(`- Monthly goal contributions: AED ${fmt(plan.monthlyGoalContrib)}`);
  }
  if (plan.monthlyBigPaymentReserve > 0) {
    lines.push(`- Monthly big payment reserves: AED ${fmt(plan.monthlyBigPaymentReserve)}`);
  }
  if (plan.discretionary !== undefined) {
    lines.push(`- True discretionary spending (after goals/reserves): AED ${fmt(plan.discretionary)}`);
  }

  // Big payments
  if (plan.bigPayments && plan.bigPayments.length > 0) {
    lines.push(`\nUPCOMING BIG PAYMENTS:`);
    for (const bp of plan.bigPayments) {
      lines.push(`- ${bp.name}: AED ${bp.amt.toLocaleString()} (${bp.m})`);
    }
  }

  if (range.provisional) {
    lines.push(`- Income data is provisional (fewer than 3 months of history). Hedge any estimates — the numbers sharpen as more income is logged.`);
  }

  lines.push("");
  lines.push("When the user asks a cross-cutting question (e.g. \"can I afford X and still hit my goal?\"), reason across the full connected plan — paycheck, runway, spending, goal trajectory, outlook, and any upcoming income — before answering.");
  lines.push("Answer the user’s question using this context. If asked something you can’t know, say so briefly and suggest what would help. Never invent specific numbers beyond what’s given.");
  lines.push("Hard boundary: you do NOT recommend specific stocks, crypto coins, or active trading strategies. You CAN discuss general investment principles (asset classes, diversification, when to start investing relative to emergency fund size). Gently decline only when asked for specific picks.");

  return lines.join("\n");
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

// ── Assistant component ───────────────────────────────────────────────────────

export function Assistant({ open, onClose, plan }: AssistantProps) {
  const { addIncome, addExpense } = usePlan();
  const [msgs, setMsgs] = useState<Message[]>([
    { id: 'init', role: 'assistant', content: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(open);

  // Reset inline at render time when open transitions false→true (avoids extra useEffect render)
  if (prevOpenRef.current !== open) {
    prevOpenRef.current = open;
    if (open) {
      setMsgs([{ id: 'init', role: 'assistant', content: INITIAL_MESSAGE }]);
      setInput('');
      setBusy(false);
    }
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, busy, open]);

  async function ask(text: string) {
    const q = (text || '').trim();
    if (!q || busy) return;

    const next: Message[] = [...msgs, { id: `u-${Date.now()}`, role: 'user', content: q }];
    setMsgs(next);
    setInput('');
    setBusy(true);

    // Designed refusal only for specific stock/crypto pick requests
    if (isSpecificInvestmentPick(q)) {
      setTimeout(() => {
        setMsgs(m => [...m, { id: `a-${Date.now()}`, role: 'assistant', content: ASST_REFUSAL }]);
        setBusy(false);
      }, 350);
      return;
    }

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ system: buildContext(plan), conversation: next }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = (data.reply || "").trim();
        if (data.action) {
          const a = data.action;
          const today = new Date().toISOString().slice(0, 10);
          if (a.type === 'expense') {
            addExpense({ amount: a.amount, currency: a.currency || 'AED', date: a.date || today, category: a.category });
          } else if (a.type === 'income_received') {
            addIncome({ amount: a.amount, currency: a.currency || 'AED', date: a.date || today, confidence: 'confirmed' });
          } else if (a.type === 'income_expected') {
            addIncome({ amount: a.amount, currency: a.currency || 'AED', date: a.date || today, confidence: 'likely' });
          }
        }
        setMsgs(m => [...m, { id: `a-${Date.now()}`, role: "assistant", content: reply || staticFallback(q, plan) }]);
      } else {
        setMsgs(m => [...m, { id: `a-${Date.now()}`, role: "assistant", content: staticFallback(q, plan) }]);
      }
    } catch {
      setMsgs(m => [...m, { id: `a-${Date.now()}`, role: "assistant", content: staticFallback(q, plan) }]);
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
      <button
        type="button"
        aria-label="Close adviser"
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(20,25,21,0.4)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
          border: 'none', cursor: 'pointer', width: '100%', height: '100%', padding: 0,
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
            type="button"
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
          {msgs.map((m) => (
            <div
              key={m.id}
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
                  type="button"
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
              aria-label="Ask about your money"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your money…"
              className="focus-ring"
              style={{
                flex: 1, border: '1px solid var(--hairline)',
                background: 'var(--surface)', borderRadius: 999,
                padding: '12px 16px', fontSize: 16,
                fontFamily: 'var(--font-ui)', color: 'var(--ink)',
              }}
            />
            <button
              type="button"
              onClick={() => ask(input)}
              aria-label="Send"
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
