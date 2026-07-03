'use client';

/**
 * AddFlow.tsx — Global "+" action sheet.
 * TypeScript port of keel_handoff/design_reference/components/AddFlow.jsx.
 *
 * Step 1: choose what you're adding (income, received, expense, payment, goal).
 * Step 2: a form appropriate to that type.
 * On confirm for income/received types: calls store.addIncome and closes.
 */

import React, { useState, useRef, CSSProperties, useCallback } from 'react';
import { usePlan } from '@/lib/store';
import type { ExpenseItem } from '@/lib/store';
import { toAED, splitDeposit } from '@/lib/engine';
import type { IncomeItem, PotSplit } from '@/lib/engine';
import type { BigPayment } from '@/lib/demo-seed';
import { Segmented, approxAED, fmtFx, SplitFlow } from '@/components/keel/ui';
import { IconAfford } from '@/components/keel/icons';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type AddTypeKey = 'income' | 'received' | 'expense' | 'payment' | 'goal';

interface AddTypeEntry {
  key: AddTypeKey;
  label: string;
  desc: string;
  color: string;
}

interface AddFlowProps {
  open: boolean;
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ADD_TYPES: AddTypeEntry[] = [
  { key: 'income',   label: 'Expected income', desc: 'An invoice, gig or payment',  color: 'var(--mint)' },
  { key: 'received', label: 'Money received',  desc: "A payment that's landed",      color: 'var(--pine)' },
  { key: 'expense',  label: 'An expense',      desc: 'Something you spent',          color: 'var(--clay)' },
  { key: 'payment',  label: 'Big payment',     desc: 'A large cost coming up',       color: 'var(--gold)' },
  { key: 'goal',     label: 'New goal',        desc: 'Something to save toward',     color: 'var(--pine)' },
];

const STEP_TITLES: Record<AddTypeKey, string> = {
  income:   'Expecting money',
  received: 'Money received',
  expense:  'Log an expense',
  payment:  'A big payment ahead',
  goal:     'Start a goal',
};

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13, boxSizing: 'border-box',
  border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)',
  fontFamily: 'var(--font-ui)', fontSize: 16, outline: 'none',
};

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>{label}</div>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />;
}

// ── AddForm ───────────────────────────────────────────────────────────────────

interface FormConfig {
  title: string;
  cta: string;
  fields: [string, string][];
  segLabel: string | null;
  seg: { value: string; label: string }[] | null;
  note: string | null;
}

type FormConfigs = Record<AddTypeKey, FormConfig>;

const FORM_CONFIGS: FormConfigs = {
  income: {
    title: 'Expecting money',
    cta: 'Track this income',
    fields: [['Source', 'e.g. Northwind Studio'], ['Amount', '0'], ['Expected', 'Jun 30']],
    segLabel: 'How sure are you?',
    seg: [{ value: 'confirmed', label: 'Confirmed' }, { value: 'likely', label: 'Likely' }, { value: 'unconfirmed', label: 'Unsure' }],
    note: "Tracked now — you decide later if it counts toward your plan.",
  },
  received: {
    title: 'Money received',
    cta: 'Log received payment',
    fields: [['Source', 'e.g. Atlas Co'], ['Amount', '0'], ['Date received', 'Today']],
    segLabel: null,
    seg: null,
    note: "It lands and splits into your pots — tax, buffer and goals set aside automatically.",
  },
  expense: {
    title: 'Log an expense',
    cta: 'Add expense',
    fields: [['What for', 'e.g. Software'], ['Amount', 'AED 0'], ['Date', 'Today']],
    segLabel: 'Type',
    seg: [{ value: 'oneoff', label: 'One-off' }, { value: 'recurring', label: 'Recurring' }],
    note: null,
  },
  payment: {
    title: 'A big payment ahead',
    cta: 'Add to timeline',
    fields: [['What for', 'e.g. Car insurance'], ['Amount', 'AED 0'], ['Due', 'Jul 15']],
    segLabel: 'Set aside for it?',
    seg: [{ value: 'on', label: 'Automatically' }, { value: 'off', label: 'Not yet' }],
    note: "Keel will quietly set money aside before it lands.",
  },
  goal: {
    title: 'Start a goal',
    cta: 'Start saving',
    fields: [['Name it', 'e.g. House down payment'], ['Target', 'AED 0'], ['By when', 'Optional']],
    segLabel: null,
    seg: null,
    note: "Keel charts a calm path from your buffer.",
  },
};

// Map form confidence value → engine confidence value
function toEngineConfidence(seg: string): IncomeItem['confidence'] {
  if (seg === 'confirmed') return 'confirmed';
  if (seg === 'likely') return 'likely';
  return 'possible';
}

interface AddFormProps {
  type: AddTypeKey;
  onDone: () => void;
}

function AddForm({ type, onDone }: AddFormProps) {
  const { addIncome, addBigPayment, addExpense, plan } = usePlan();
  const cfg = FORM_CONFIGS[type];

  // After a RECEIVED deposit lands, show it splitting into pots before closing.
  const [routed, setRouted] = useState<{ split: PotSplit; amountAED: number; ccy: string; srcAmount: number } | null>(null);

  const defaultSeg =
    type === 'income' ? 'likely' :
    type === 'expense' ? 'oneoff' : 'on';

  const today = new Date().toISOString().slice(0, 10);

  const [seg, setSeg] = useState(defaultSeg);
  const [ccy, setCcy] = useState('AED');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(today);
  const [paymentName, setPaymentName] = useState('');
  const [paymentDue, setPaymentDue] = useState(today);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  const handleReceiptScan = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanLoading(true);
    setScanError('');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const res = await fetch('/api/scan-receipt', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
          });
          const data = await res.json();
          if (data.error) {
            setScanError("Couldn't read receipt — enter manually.");
          } else {
            if (data.amount) setAmount(String(data.amount));
            if (data.merchant) setSource(data.merchant);
            if (data.date) setDate(data.date);
            if (data.currency) setCcy(data.currency);
          }
        } catch {
          setScanError("Scan failed — enter manually.");
        } finally {
          setScanLoading(false);
        }
      };
      reader.onerror = () => {
        setScanError("Scan failed — enter manually.");
        setScanLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setScanError("Scan failed — enter manually.");
      setScanLoading(false);
    }
  }, []);

  const amtNum = parseInt(String(amount).replace(/[^0-9]/g, ''), 10) || 0;

  function handleConfirm() {
    // For income/received: wire into store
    if (type === 'income' || type === 'received') {
      if (amtNum > 0) {
        const confidence: IncomeItem['confidence'] = type === 'received' ? 'confirmed' : toEngineConfidence(seg);
        const item: IncomeItem = {
          amount: amtNum,
          currency: ccy,
          date: date || today,
          confidence,
        };
        addIncome(item);
        // Confirmed = received → it routes and splits. Show the split, then close.
        // Ratios come from the plan as it stands pre-deposit (matches the store's
        // pre-append routing), so the deposit doesn't distort its own split.
        if (confidence === 'confirmed') {
          const amountAED = toAED(amtNum, ccy);
          setRouted({ split: splitDeposit(amountAED, plan.pots.ratios), amountAED, ccy, srcAmount: amtNum });
          return; // hold the sheet open on the split view
        }
      }
    }
    // For expense: wire into store
    if (type === 'expense') {
      if (amtNum > 0) {
        const item: ExpenseItem = {
          amount: amtNum,
          currency: ccy,
          date: date || today,
          category: source || undefined,
        };
        addExpense(item);
      }
    }
    // For big payment: wire into store
    if (type === 'payment') {
      const parsedAmt = parseInt(String(amount).replace(/[^0-9]/g, ''), 10) || 0;
      if (parsedAmt > 0 && paymentName) {
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const dueDate = paymentDue ? new Date(paymentDue + 'T00:00:00') : new Date();
        const m = MONTHS[dueDate.getMonth()];
        const pos = (dueDate.getMonth() + dueDate.getDate() / 31) / 12;
        const bp: BigPayment = {
          id: Date.now().toString(),
          m,
          pos: Math.min(Math.max(pos, 0), 1),
          name: paymentName,
          amt: parsedAmt,
          status: seg === 'on' ? 'saving' : 'soon',
        };
        addBigPayment(bp);
      }
    }
    onDone();
  }

  // Split confirmation view — the routing moment.
  if (routed) {
    return (
      <div>
        <SplitFlow amount={routed.amountAED} split={routed.split} ccy={routed.ccy} srcAmount={routed.srcAmount} />
        <button
          type="button"
          onClick={onDone}
          style={{
            width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer', marginTop: 20,
            background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
            fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div>
      {type === 'expense' && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            background: 'var(--surface-2)', borderRadius: 12, padding: '10px 14px',
            fontSize: 13.5, color: 'var(--muted)', fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            {scanLoading ? 'Scanning…' : 'Scan a receipt'}
            <input type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }}
              onChange={handleReceiptScan}
            />
          </label>
          {scanError && <div style={{ fontSize: 12, color: 'var(--clay)', marginTop: 4 }}>{scanError}</div>}
        </div>
      )}
      {cfg.fields.map(([l, ph]) => {
        // Expense-specific fields
        if (type === 'expense' && l === 'What for') {
          return (
            <Field key={l} label={l}>
              <TextInput
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={ph}
              />
            </Field>
          );
        }
        if (type === 'expense' && l === 'Amount') {
          return (
            <Field key={l} label={l}>
              <TextInput
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                inputMode="numeric"
                placeholder={ph}
              />
            </Field>
          );
        }
        if (type === 'expense' && l === 'Date') {
          return (
            <Field key={l} label={l}>
              <input
                aria-label="Expense date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </Field>
          );
        }
        // Income/received amounts: show currency picker + live AED conversion
        if ((type === 'income' || type === 'received') && l === 'Amount') {
          return (
            <Field key={l} label={l}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  aria-label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                  inputMode="numeric"
                  placeholder={ph}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <select
                    value={ccy}
                    onChange={(e) => setCcy(e.target.value)}
                    style={{
                      ...inputStyle,
                      width: 'auto',
                      paddingRight: 32,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {['AED', 'USD', 'EUR', 'GBP', 'SAR'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <svg
                    width="10" height="6" viewBox="0 0 10 6"
                    style={{ position: 'absolute', right: 13, top: '50%', marginTop: -3, pointerEvents: 'none' }}
                  >
                    <path d="M1 1l4 4 4-4" stroke="var(--muted)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {ccy !== 'AED' && (
                <div style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 2px 0' }}>
                  {amtNum > 0 ? approxAED(toAED(amtNum, ccy)) : '≈ AED —'}{' '}
                  {type === 'received' ? 'recorded' : 'in your plan'}, at today&apos;s rate
                </div>
              )}
            </Field>
          );
        }
        // Source field
        if ((type === 'income' || type === 'received') && l === 'Source') {
          return (
            <Field key={l} label={l}>
              <TextInput
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={ph}
              />
            </Field>
          );
        }
        // Date field for income/received — native date picker
        if ((type === 'income' || type === 'received') && (l === 'Expected' || l === 'Date received')) {
          return (
            <Field key={l} label={l}>
              <input
                aria-label={l}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </Field>
          );
        }
        // Big payment fields
        if (type === 'payment' && l === 'What for') {
          return (
            <Field key={l} label={l}>
              <TextInput
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
                placeholder={ph}
              />
            </Field>
          );
        }
        if (type === 'payment' && l === 'Amount') {
          return (
            <Field key={l} label={l}>
              <TextInput
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                inputMode="numeric"
                placeholder={ph}
              />
            </Field>
          );
        }
        if (type === 'payment' && l === 'Due') {
          return (
            <Field key={l} label={l}>
              <input
                aria-label="Due date"
                type="date"
                value={paymentDue}
                onChange={(e) => setPaymentDue(e.target.value)}
                style={inputStyle}
              />
            </Field>
          );
        }
        return (
          <Field key={l} label={l}>
            <TextInput placeholder={ph} />
          </Field>
        );
      })}

      {cfg.seg && cfg.segLabel && (
        <Field label={cfg.segLabel}>
          <Segmented value={seg} onChange={setSeg} options={cfg.seg} />
        </Field>
      )}

      {cfg.note && (
        <p style={{ margin: '4px 2px 16px', fontSize: 12.5, lineHeight: 1.45, color: 'var(--muted)' }}>
          {cfg.note}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        style={{
          width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer',
          background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
          fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
        }}
      >
        {cfg.cta}
      </button>
    </div>
  );
}

// ── AddFlow ───────────────────────────────────────────────────────────────────

export function AddFlow({ open, onClose }: AddFlowProps) {
  const [step, setStep] = useState<'choose' | AddTypeKey>('choose');
  const prevOpen = useRef(open);

  // Reset to choose step when the sheet transitions from closed → open
  if (!prevOpen.current && open) {
    setStep('choose');
  }
  prevOpen.current = open;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(20,25,21,0.32)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
          border: 'none', cursor: 'pointer', width: '100%', height: '100%', padding: 0,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--bg)', borderRadius: '26px 26px 0 0',
          padding: '12px 18px 28px',
          transform: open ? 'translateY(0)' : 'translateY(900px)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
          maxHeight: '88%', overflowY: 'auto',
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 38, height: 4, borderRadius: 4,
            background: 'var(--hairline)', margin: '0 auto 16px',
          }}
        />

        {step === 'choose' ? (
          <div>
            <div className="serif" style={{ fontSize: 23, color: 'var(--ink)', marginBottom: 3 }}>
              Add to your picture
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--muted)' }}>
              What&apos;s coming in, going out, or worth saving for?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ADD_TYPES.map(t => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setStep(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left',
                    background: 'var(--surface)', border: '1px solid var(--hairline)',
                    borderRadius: 16, padding: '14px 15px', cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: t.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>
                      {t.label}
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>
                      {t.desc}
                    </span>
                  </span>
                  <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
                    <path d="M1 1l6 6-6 6" stroke="var(--muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Before you buy divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 2px 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Before you buy
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
            </div>

            <Link
              href="/afford"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none',
                background: 'var(--pine-soft)', border: '1px solid var(--hairline)',
                borderRadius: 16, padding: '14px 15px', fontFamily: 'var(--font-ui)',
              }}
            >
              <span style={{
                width: 34, height: 34, borderRadius: 10, background: 'var(--pine)',
                color: 'var(--on-pine)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <IconAfford size={19} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>
                  Can I afford this?
                </span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>
                  Check a purchase against your plan
                </span>
              </span>
              <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
                <path d="M1 1l6 6-6 6" stroke="var(--pine)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div>
            {/* Back + title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setStep('choose')}
                aria-label="Back"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: '1px solid var(--hairline)', background: 'var(--surface)',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                  <path d="M7 2 2 7.5 7 13" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="serif" style={{ fontSize: 21, color: 'var(--ink)' }}>
                {STEP_TITLES[step as AddTypeKey]}
              </div>
            </div>

            <AddForm type={step as AddTypeKey} onDone={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
