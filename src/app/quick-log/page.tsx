'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlan } from '@/lib/store';
import type { ExpenseItem } from '@/lib/store';
import type { IncomeItem } from '@/lib/engine';

function QuickLogForm() {
  const router = useRouter();
  const params = useSearchParams();
  const type = (params.get('type') || 'expense') as 'expense' | 'income';
  const { addExpense, addIncome } = usePlan();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit() {
    const amt = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!amt) return;
    if (type === 'expense') {
      const item: ExpenseItem = { amount: amt, currency: 'AED', date: today, category: note || 'other' };
      addExpense(item);
    } else {
      const item: IncomeItem = { amount: amt, currency: 'AED', date: today, confidence: 'confirmed' };
      addIncome(item);
    }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1200);
  }

  if (done) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F4F1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#1F4D3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#F4F1E6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1F4D3A' }}>Logged</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F4F1E6', display: 'flex', flexDirection: 'column', padding: '60px 20px 40px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1a1a1a', marginBottom: 6 }}>
        {type === 'expense' ? 'Log an expense' : 'Log income received'}
      </div>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
        {type === 'expense' ? 'What did you spend?' : 'How much came in?'}
      </p>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0ddd4', padding: '18px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 15, color: '#888', fontWeight: 600 }}>AED</span>
        <input
          autoFocus
          inputMode="numeric"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
          placeholder="0"
          style={{ flex: 1, border: 'none', background: 'none', fontSize: 32, fontFamily: 'Georgia, serif', color: '#1a1a1a', outline: 'none' }}
        />
      </div>

      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={type === 'expense' ? 'What was it? (optional)' : 'From who? (optional)'}
        style={{ width: '100%', background: '#fff', border: '1px solid #e0ddd4', borderRadius: 14, padding: '14px 16px', fontSize: 15, color: '#1a1a1a', outline: 'none', marginBottom: 24, boxSizing: 'border-box' }}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!amount}
        style={{ width: '100%', padding: 16, borderRadius: 999, border: 'none', cursor: amount ? 'pointer' : 'default', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, background: amount ? '#1F4D3A' : '#ccc', color: '#F4F1E6' }}
      >
        {type === 'expense' ? 'Log expense' : 'Log income'}
      </button>

      <button type="button" onClick={() => router.back()} style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}>
        Cancel
      </button>
    </div>
  );
}

export default function QuickLogPage() {
  return (
    <Suspense>
      <QuickLogForm />
    </Suspense>
  );
}
