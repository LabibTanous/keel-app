'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/lib/store';
import type { IncomeItem } from '@/lib/engine';
import { Card, Switch, money, fmtFx, approxAED } from '@/components/keel/ui';
import { toAED } from '@/lib/engine';
import { Dock } from '@/components/keel/Dock';
import { KEEL_OPEN_ADD, KEEL_OPEN_ASSISTANT } from '@/components/keel/GlobalOverlays';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'choose' | 'upload' | 'review' | 'manual' | 'done';

const TITLES: Record<Step, string> = {
  choose: 'Build your picture',
  upload: 'Upload statements',
  review: 'Quick review',
  manual: 'Enter your data',
  done:   'All set',
};

interface ParsedTx {
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'unknown';
  category?: string;
}

const CATS = ['Income', 'Rent & bills', 'Food', 'Software', 'Transport', 'Other'];

// ── Header ─────────────────────────────────────────────────────────────────────

function ImpHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 18px 14px' }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--hairline)',
          background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
          <path d="M9 2 2 9l7 7" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="serif" style={{ fontSize: 23, color: 'var(--ink)' }}>{title}</div>
    </div>
  );
}

// ── Step: Choose method ────────────────────────────────────────────────────────

function ChooseStep({ go }: { go: (s: Step) => void }) {
  const opt = (key: Step, title: string, desc: string, rec?: boolean) => (
    <button
      key={key}
      type="button"
      onClick={() => go(key)}
      style={{
        width: '100%', textAlign: 'left', background: 'var(--surface)', cursor: 'pointer',
        border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '18px', position: 'relative',
        fontFamily: 'var(--font-ui)', display: 'block',
      }}
    >
      {rec && (
        <span style={{
          position: 'absolute', top: 16, right: 16, fontSize: 10.5, fontWeight: 700,
          letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--on-pine)',
          background: 'var(--pine)', padding: '3px 9px', borderRadius: 999,
        }}>Fastest</span>
      )}
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
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)', padding: '18px', opacity: 0.7,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
          <div className="serif" style={{ fontSize: 19, color: 'var(--ink)' }}>Forward bank statements</div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--on-pine)', background: 'var(--pine)', padding: '2px 8px', borderRadius: 999 }}>Soon</span>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.45 }}>
          Forward any bank statement email to <strong>statements@keel.app</strong> — we&apos;ll read it automatically.
        </div>
      </div>
    </div>
  );
}

// ── Step: Upload ───────────────────────────────────────────────────────────────

function UploadStep({ onTransactionsParsed }: { onTransactionsParsed: (txs: ParsedTx[]) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setError('');
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/parse-statement', { method: 'POST', body: fd });
      const data = await res.json() as { error?: string; transactions?: ParsedTx[] };
      if (data.error === 'pdf_requires_anthropic_key') {
        setError('PDF parsing requires setup — try uploading a CSV export from your bank app instead.');
        return;
      }
      if (!data.transactions?.length) {
        setError("Couldn't read transactions from this file — try a CSV export instead.");
        return;
      }
      onTransactionsParsed(data.transactions);
    } catch {
      setError('Upload failed — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--pine)' : 'var(--hairline)'}`,
          borderRadius: 'var(--r-card)',
          background: dragging ? 'var(--pine-soft)' : 'var(--surface)',
          padding: '30px 20px', textAlign: 'center', cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          aria-label="Upload bank statement"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div style={{
          width: 46, height: 46, borderRadius: 14, background: 'var(--pine-soft)', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 16V4M7 9l5-5 5 5M5 18v2h14v-2" stroke="var(--pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {file ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--pine)' }}>{file.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>Tap to choose a different file</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Drop a statement here</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>PDF or CSV from your bank app</div>
          </>
        )}
      </div>

      {error && (
        <div style={{
          fontSize: 13, color: 'var(--clay)', padding: '10px 12px',
          background: 'rgba(200,80,60,0.07)', borderRadius: 10,
        }}>{error}</div>
      )}

      <button
        type="button"
        onClick={analyze}
        disabled={!file || loading}
        style={{
          width: '100%', padding: '15px', borderRadius: 14,
          cursor: file && !loading ? 'pointer' : 'default', marginTop: 4,
          background: file && !loading ? 'var(--pine)' : 'var(--surface-2)',
          color: file && !loading ? 'var(--on-pine)' : 'var(--muted)',
          border: 'none', fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
        }}
      >
        {loading ? 'Reading…' : file ? `Read ${file.name}` : 'Select a file first'}
      </button>
    </div>
  );
}

// ── Step: Review ───────────────────────────────────────────────────────────────

function ReviewStep({ transactions, onDone }: { transactions: ParsedTx[]; onDone: () => void }) {
  const { addIncome, addExpense } = usePlan();
  const [i, setI] = useState(0);
  const [cat, setCat] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);

  // Set default category when transaction changes
  useEffect(() => {
    if (!transactions.length) return;
    const tx = transactions[i];
    setCat(tx.type === 'income' ? 'Income' : tx.category ?? null);
    setRecurring(false);
  }, [i, transactions]);

  if (!transactions.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 10px' }}>
        <div className="serif" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>No transactions to review</div>
        <button type="button" onClick={onDone} style={{
          marginTop: 16, padding: '14px 28px', borderRadius: 999, cursor: 'pointer',
          background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
          fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 700,
        }}>Done</button>
      </div>
    );
  }

  const tx = transactions[i];
  const isLast = i + 1 >= transactions.length;

  function saveCurrent() {
    if (!cat) return;
    if (cat === 'Income') {
      addIncome({ amount: Math.abs(tx.amount), currency: tx.currency, date: tx.date, confidence: 'confirmed' });
    } else {
      addExpense({ amount: Math.abs(tx.amount), currency: tx.currency, date: tx.date, category: cat });
    }
    if (isLast) { onDone(); return; }
    setI(prev => prev + 1);
  }

  function skip() {
    if (isLast) { onDone(); return; }
    setI(prev => prev + 1);
  }

  // Format date for display
  const displayDate = (() => {
    try {
      return new Date(tx.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return tx.date;
    }
  })();

  return (
    <div>
      <div style={{ background: 'var(--pine-soft)', borderRadius: 16, padding: '13px 15px', marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>
          <b>{transactions.length} transactions</b> found from your statement.
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Confirm each one — skip anything that looks wrong.</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="smallcaps">Review · {i + 1} of {transactions.length}</span>
        <button type="button" onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Skip</button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 600, color: 'var(--ink)' }}>{tx.description}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{displayDate}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="serif tnum" style={{ fontSize: 22, color: tx.amount > 0 ? 'var(--mint)' : 'var(--ink)' }}>
              {tx.amount > 0 ? '+' : '−'}{tx.currency === 'AED' ? money(Math.abs(tx.amount)) : fmtFx(Math.abs(tx.amount), tx.currency)}
            </div>
            {tx.currency !== 'AED' && (
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                {approxAED(toAED(Math.abs(tx.amount), tx.currency))}
              </div>
            )}
          </div>
        </div>

        <div className="smallcaps" style={{ fontSize: 10.5, margin: '18px 0 9px' }}>What kind of transaction?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATS.map(c => (
            <button type="button" key={c} onClick={() => setCat(c)} style={{
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
          <Switch on={recurring} onClick={() => setRecurring(r => !r)} />
        </div>
      </Card>

      <button type="button" onClick={saveCurrent} disabled={!cat} style={{
        width: '100%', padding: '15px', borderRadius: 14, marginTop: 14,
        cursor: cat ? 'pointer' : 'default', opacity: cat ? 1 : 0.5,
        background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
      }}>{isLast ? 'Finish' : 'Save & next'}</button>
    </div>
  );
}

// ── Step: Manual entry ─────────────────────────────────────────────────────────

// Manual entry is grouped. Income rows feed addIncome; fixed-cost + subscription
// rows roll up into the profile's monthly `essentials` figure.
const MANUAL_GROUPS = [
  { header: 'Typical income',      kind: 'income' as const,     rows: ['Main client work', 'Side gigs'] },
  { header: 'Fixed monthly costs', kind: 'essential' as const,  rows: ['Rent', 'Utilities', 'Phone & internet'] },
  { header: 'Subscriptions',       kind: 'essential' as const,  rows: ['Software & tools', 'Streaming'] },
  { header: 'Set aside',           kind: 'ignore' as const,     rows: ['Taxes (%)', 'Savings'] },
];

function ManualStep({ onDone }: { onDone: () => void }) {
  const { addIncome, setProfile, profile } = usePlan();
  // Per-row amounts keyed as "<groupIndex>-<rowIndex>".
  const [values, setValues] = useState<Record<string, string>>({});
  // Extra custom rows appended per group via "+ Add another".
  const [extraRows, setExtraRows] = useState<Record<number, string[]>>({});

  const setValue = (key: string, raw: string) =>
    setValues(prev => ({ ...prev, [key]: raw }));

  const addRow = (groupIdx: number) =>
    setExtraRows(prev => {
      const current = prev[groupIdx] ?? [];
      return { ...prev, [groupIdx]: [...current, `Other ${current.length + 1}`] };
    });

  const save = () => {
    const today = new Date().toISOString().slice(0, 10);
    let incomeTotal = 0;
    let essentialsTotal = 0;

    MANUAL_GROUPS.forEach((g, gi) => {
      const allRows = [...g.rows, ...(extraRows[gi] ?? [])];
      allRows.forEach((_, ri) => {
        const n = parseFloat(values[`${gi}-${ri}`] ?? '');
        if (!n || isNaN(n) || n <= 0) return;
        if (g.kind === 'income') incomeTotal += n;
        else if (g.kind === 'essential') essentialsTotal += n;
      });
    });

    if (incomeTotal > 0) {
      addIncome({ amount: incomeTotal, currency: 'AED', date: today, confidence: 'confirmed' });
    }
    if (essentialsTotal > 0) {
      setProfile({ ...profile, essentials: profile.essentials + essentialsTotal });
    }
    onDone();
  };

  const group = (g: (typeof MANUAL_GROUPS)[number], gi: number) => {
    const allRows = [...g.rows, ...(extraRows[gi] ?? [])];
    return (
      <div key={g.header} style={{ marginBottom: 18 }}>
        <div className="smallcaps" style={{ margin: '0 4px 9px' }}>{g.header}</div>
        <Card style={{ padding: '2px var(--pad)' }}>
          {allRows.map((r, idx) => {
            const key = `${gi}-${idx}`;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '12px 0', borderTop: idx ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)' }}>{r}</span>
                <input
                  aria-label={`${r} amount`}
                  type="number"
                  inputMode="decimal"
                  value={values[key] ?? ''}
                  onChange={e => setValue(key, e.target.value)}
                  placeholder="0"
                  className="focus-ring"
                  style={{ width: 90, textAlign: 'right', border: 'none', background: 'none', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)' }}
                />
              </div>
            );
          })}
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
            <button type="button" onClick={() => addRow(gi)} style={{ background: 'none', border: 'none', color: 'var(--pine)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 0 }}>
              + Add another
            </button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
        Fill in what you know — you can always refine it later.
      </p>
      {MANUAL_GROUPS.map((g, gi) => group(g, gi))}
      <button type="button" onClick={save} style={{
        width: '100%', padding: '15px', borderRadius: 14, marginTop: 4, cursor: 'pointer',
        background: 'var(--pine)', color: 'var(--on-pine)', border: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 15.5, fontWeight: 700,
      }}>Save my picture</button>
    </div>
  );
}

// ── Step: Add income form ──────────────────────────────────────────────────────

function AddIncomeForm({ onAdd }: { onAdd: (i: IncomeItem) => void }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [conf, setConf] = useState<'confirmed' | 'likely' | 'possible'>('confirmed');

  const submit = () => {
    const n = parseFloat(amount);
    if (!n || isNaN(n)) return;
    onAdd({ amount: n, currency, date, confidence: conf });
    setAmount('');
  };

  return (
    <Card>
      <div className="smallcaps" style={{ marginBottom: 14 }}>Add income entry</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Amount</div>
          <input
            aria-label="Amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="focus-ring"
            style={{
              width: '100%', border: '1px solid var(--hairline)', background: 'var(--surface-2)',
              borderRadius: 10, padding: '10px 12px', fontFamily: 'var(--font-ui)', fontSize: 16,
              color: 'var(--ink)',
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Currency</div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              border: '1px solid var(--hairline)', background: 'var(--surface-2)',
              borderRadius: 10, padding: '10px 12px', fontFamily: 'var(--font-ui)', fontSize: 15,
              color: 'var(--ink)', cursor: 'pointer',
            }}
          >
            <option>AED</option>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>SAR</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Date</div>
        <input
          aria-label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="focus-ring"
          style={{
            width: '100%', border: '1px solid var(--hairline)', background: 'var(--surface-2)',
            borderRadius: 10, padding: '10px 12px', fontFamily: 'var(--font-ui)', fontSize: 15,
            color: 'var(--ink)',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Confidence</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['confirmed', 'likely', 'possible'] as const).map(c => (
            <button
              type="button"
              key={c}
              onClick={() => setConf(c)}
              style={{
                flex: 1, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: 999, padding: '8px 6px',
                border: '1px solid ' + (conf === c ? 'var(--pine)' : 'var(--hairline)'),
                background: conf === c ? 'var(--pine)' : 'var(--surface)',
                color: conf === c ? 'var(--on-pine)' : 'var(--ink)', fontFamily: 'var(--font-ui)',
                textTransform: 'capitalize',
              }}
            >{c}</button>
          ))}
        </div>
      </div>

      <button type="button" onClick={submit} style={{
        width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
        background: amount ? 'var(--pine)' : 'var(--surface-2)',
        color: amount ? 'var(--on-pine)' : 'var(--muted)', border: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 700,
      }}>Add income</button>
    </Card>
  );
}

// ── Step: Done ────────────────────────────────────────────────────────────────

function DoneStep() {
  return (
    <div style={{ textAlign: 'center', padding: '36px 14px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'var(--pine)', color: 'var(--on-pine)',
        margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="serif" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>Your picture&apos;s ready</div>
      <p style={{ margin: '0 auto 24px', maxWidth: 260, fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>
        Keel now sees your income, costs and what&apos;s coming. Your steady paycheck is ready to set.
      </p>
      <Link href="/paycheck" style={{
        display: 'inline-block', padding: '14px 26px', borderRadius: 999, textDecoration: 'none',
        background: 'var(--pine)', color: 'var(--on-pine)', fontSize: 15, fontWeight: 700,
      }}>Set your paycheck</Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ImportClient() {
  const router = useRouter();
  const { addIncome } = usePlan();
  const [step, setStep] = useState<Step>('choose');
  const [parsedTxs, setParsedTxs] = useState<ParsedTx[]>([]);

  const handleTransactionsParsed = (txs: ParsedTx[]) => {
    setParsedTxs(txs);
    setStep('review');
  };

  const back = () => {
    if (step === 'done') router.push('/dashboard');
    else if (step === 'choose') router.back();
    else if (step === 'review') setStep('upload');
    else setStep('choose');
  };

  const handleAddIncome = (item: IncomeItem) => {
    addIncome(item);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <ImpHeader title={TITLES[step]} onBack={back} />

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '4px 18px 100px' }}>
        {step === 'choose' && <ChooseStep go={setStep} />}
        {step === 'upload' && <UploadStep onTransactionsParsed={handleTransactionsParsed} />}
        {step === 'review' && <ReviewStep transactions={parsedTxs} onDone={() => setStep('done')} />}
        {step === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <ManualStep onDone={() => setStep('done')} />
            <div className="smallcaps" style={{ margin: '4px 6px 0' }}>Or add income entry directly</div>
            <AddIncomeForm onAdd={handleAddIncome} />
          </div>
        )}
        {step === 'done' && <DoneStep />}
      </div>

      <Dock
        links={{ home: '/dashboard', coming: '/coming', goal: '/goal' }}
        onAdd={() => window.dispatchEvent(new Event(KEEL_OPEN_ADD))}
        onAssistant={() => window.dispatchEvent(new Event(KEEL_OPEN_ASSISTANT))}
      />
    </div>
  );
}
