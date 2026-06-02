'use client';

/**
 * OnboardingClient.tsx — 5-step onboarding wizard client component.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { usePlan } from '@/lib/store';
import { computePlan } from '@/lib/store';
import type { UserGoal } from '@/lib/store';
import { groupByMonth, computeRange, computePaycheck, computeAllocation } from '@/lib/engine';
import type { Profile, IncomeItem } from '@/lib/engine';
import type { BigPayment } from '@/lib/demo-seed';
import { Card } from '@/components/keel/ui';
import { Cur } from '@/components/keel/ui';

// ── Region data ──────────────────────────────────────────────────────────────

const ONBOARD_REGIONS = [
  { name: 'United Arab Emirates', code: 'AE', ccy: 'AED', enables: 'VAT & Corporate Tax lines · Zakat' },
  { name: 'Saudi Arabia',         code: 'SA', ccy: 'SAR', enables: 'VAT · Zakat' },
  { name: 'Qatar',                code: 'QA', ccy: 'QAR', enables: 'Zakat' },
  { name: 'Kuwait',               code: 'KW', ccy: 'KWD', enables: 'Zakat' },
  { name: 'Egypt',                code: 'EG', ccy: 'EGP', enables: 'VAT' },
  { name: 'Jordan',               code: 'JO', ccy: 'JOD', enables: 'Sales tax' },
] as const;

type RegionEntry = typeof ONBOARD_REGIONS[number];

// ── Local onboarding state (kept local until step 5 commits) ─────────────────

interface IncomeRow {
  amt: string;
  ccy: string;
  recurring: boolean | null;
  incomeType?: string;
  months?: number;
  dayOfMonth?: number;
  date?: string;
}

interface ObBigPayment {
  name: string;
  amt: string;
  dueDate: string;
}

interface ObSubscription {
  name: string;
  amt: string;
  billingDay: string;
}

interface ObGoal {
  name: string;
  custom: string;
  targetAmt: string;
  targetDate: string;
}

interface ObData {
  region: string;
  regionCode: string;
  ccy: string;
  rent: string;
  rentDueDay: string;
  bills: string;
  billsDueDay: string;
  savingsCash: string;
  savingsInvestments: string;
  savingsProperty: string;
  savingsOther: string;
  transport: string;
  subscriptionsList: ObSubscription[];
  otherExpenses: string;
  incomes: IncomeRow[];
  goals: ObGoal[];
  bigPayments: ObBigPayment[];
  email: string;
  password: string;
  authError: string;
  incomePattern: 'monthly' | 'quarterly' | 'project' | 'irregular' | '';
  targetMonths: number;
  vatRegistered: boolean | null;
  annualRevenue: string;
  employmentType: 'sole_trader' | 'company' | 'employed_freelance' | 'employed' | '';
  multiCurrency: boolean | null;
  dependants: number;
}

const INITIAL_DATA: ObData = {
  region: 'United Arab Emirates',
  regionCode: 'AE',
  ccy: 'AED',
  rent: '',
  rentDueDay: '1',
  bills: '',
  billsDueDay: '1',
  savingsCash: '',
  savingsInvestments: '',
  savingsProperty: '',
  savingsOther: '',
  transport: '',
  subscriptionsList: [],
  otherExpenses: '',
  incomes: [
    { amt: '', ccy: 'AED', recurring: null, months: 6, dayOfMonth: 1 },
  ],
  goals: [],
  bigPayments: [],
  email: '',
  password: '',
  authError: '',
  incomePattern: '',
  targetMonths: 3,
  vatRegistered: null,
  annualRevenue: '',
  employmentType: '',
  multiCurrency: null,
  dependants: 0,
};

// ── Shared input styles ──────────────────────────────────────────────────────

const obInput: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 13,
  boxSizing: 'border-box',
  border: '1px solid var(--hairline)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-ui)',
  fontSize: 16,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIntro({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        className="serif"
        style={{ fontSize: 27, lineHeight: 1.12, color: 'var(--ink)', letterSpacing: -0.3 }}
      >
        {title}
      </div>
      {sub && (
        <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function ObField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function ObAmount({
  value,
  onChange,
  ccy,
  onCcy,
  placeholder = '0',
}: {
  value: string;
  onChange: (v: string) => void;
  ccy?: string;
  onCcy?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          ...obInput,
          padding: '0 14px',
        }}
      >
        {!onCcy && (
          <span style={{ fontSize: 14, color: 'var(--muted)', flexShrink: 0 }}>AED</span>
        )}
        <input
          aria-label="Amount"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9,]/g, ''))}
          className="focus-ring"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            background: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 16,
            color: 'var(--ink)',
            padding: '13px 0',
          }}
        />
      </div>
      {onCcy && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={ccy}
            onChange={(e) => onCcy(e.target.value)}
            style={{
              ...obInput,
              width: 'auto',
              paddingRight: 32,
              appearance: 'none',
              WebkitAppearance: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {['AED', 'USD', 'EUR', 'GBP', 'SAR'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            style={{
              position: 'absolute',
              right: 13,
              top: '50%',
              marginTop: -3,
              pointerEvents: 'none',
            }}
          >
            <path
              d="M1 1l4 4 4-4"
              stroke="var(--muted)"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Region ────────────────────────────────────────────────────────────

function RegionStep({
  data,
  set,
}: {
  data: ObData;
  set: (patch: Partial<ObData>) => void;
}) {
  return (
    <div>
      <StepIntro
        title="Where are you based?"
        sub="This sets your currency, which tax lines Keel watches, and whether Zakat applies."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {ONBOARD_REGIONS.map((r: RegionEntry) => {
          const on = r.name === data.region;
          return (
            <button
              type="button"
              key={r.name}
              onClick={() => set({ region: r.name, regionCode: r.code, ccy: r.ccy })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                background: on ? 'var(--pine-soft)' : 'var(--surface)',
                fontFamily: 'var(--font-ui)',
                border: '1px solid ' + (on ? 'var(--pine)' : 'var(--hairline)'),
                borderRadius: 14,
                padding: '14px 15px',
              }}
            >
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 15.5,
                    fontWeight: 600,
                    color: on ? 'var(--pine)' : 'var(--ink)',
                  }}
                >
                  {r.name}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    color: 'var(--muted)',
                    marginTop: 1,
                  }}
                >
                  {r.ccy} · {r.enables}
                </span>
              </span>
              {on && (
                <svg width="16" height="13" viewBox="0 0 14 11" fill="none">
                  <path
                    d="M1 6l4 4 8-9"
                    stroke="var(--pine)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 10 }}>How do you work?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { v: 'sole_trader', label: 'Sole trader' },
            { v: 'company', label: 'Company / LLC' },
            { v: 'employed_freelance', label: 'Employed + freelancing' },
            { v: 'employed', label: 'Employed only' },
          ].map(({ v, label }) => (
            <button key={v} type="button"
              onClick={() => set({ employmentType: v as ObData['employmentType'] })}
              style={{
                padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                background: data.employmentType === v ? 'var(--pine)' : 'var(--surface-2)',
                color: data.employmentType === v ? 'var(--on-pine)' : 'var(--muted)',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 10 }}>Dependants (spouse, children)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button type="button"
            onClick={() => set({ dependants: Math.max(0, data.dependants - 1) })}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>−</button>
          <span className="serif" style={{ fontSize: 28, color: 'var(--ink)', minWidth: 30, textAlign: 'center' }}>{data.dependants}</span>
          <button type="button"
            onClick={() => set({ dependants: Math.min(10, data.dependants + 1) })}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>+</button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>people relying on your income</span>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Essentials ────────────────────────────────────────────────────────

function EssentialsStep({
  data,
  set,
}: {
  data: ObData;
  set: (patch: Partial<ObData>) => void;
}) {
  const rent = parseInt(data.rent.replace(/[^0-9]/g, ''), 10) || 0;
  const bills = parseInt(data.bills.replace(/[^0-9]/g, ''), 10) || 0;
  const transport = parseInt(data.transport.replace(/[^0-9]/g, ''), 10) || 0;
  const subTotal = data.subscriptionsList.reduce((s, r) => s + (parseInt(r.amt.replace(/[^0-9]/g, ''), 10) || 0), 0);
  const other = parseInt(data.otherExpenses.replace(/[^0-9]/g, ''), 10) || 0;
  const total = rent + bills + transport + subTotal + other;

  function addSub() {
    set({ subscriptionsList: [...data.subscriptionsList, { name: '', amt: '', billingDay: '1' }] });
  }
  function updateSub(i: number, patch: Partial<ObSubscription>) {
    set({ subscriptionsList: data.subscriptionsList.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  }
  function removeSub(i: number) {
    set({ subscriptionsList: data.subscriptionsList.filter((_, j) => j !== i) });
  }

  const dayInput = (value: string, onChange: (v: string) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Due on the</span>
      <input
        type="number" min={1} max={31}
        aria-label="Day of month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 52, border: 'none', background: 'var(--surface-2)', borderRadius: 8,
          padding: '7px 10px', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink)',
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>of each month</span>
    </div>
  );

  return (
    <div>
      <StepIntro
        title="What does a month cost to keep going?"
        sub="Your essentials — the bills that don't stop. Keel always makes sure your paycheck clears these first."
      />

      <ObField label="Rent / housing">
        <ObAmount value={data.rent} onChange={(v) => set({ rent: v })} />
        {rent > 0 && dayInput(data.rentDueDay, (v) => set({ rentDueDay: v }))}
      </ObField>

      <ObField label="Bills & utilities">
        <ObAmount value={data.bills} onChange={(v) => set({ bills: v })} />
        {bills > 0 && dayInput(data.billsDueDay, (v) => set({ billsDueDay: v }))}
      </ObField>

      <ObField label="Transport / commute">
        <ObAmount value={data.transport} onChange={(v) => set({ transport: v })} placeholder="0 (optional)" />
      </ObField>

      {/* Subscriptions — dynamic list */}
      <div style={{ marginBottom: 14 }}>
        <div className="smallcaps" style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 8 }}>Subscriptions</div>

        {/* Quick-add chips */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Tap to add common ones:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {UAE_SUBS.filter(s => !data.subscriptionsList.some(r => r.name === s.name)).map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => set({ subscriptionsList: [...data.subscriptionsList, { name: s.name, amt: s.amt, billingDay: '1' }] })}
                style={{
                  padding: '5px 12px', borderRadius: 999, border: '1px solid var(--hairline)',
                  background: 'var(--surface)', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)',
                }}
              >{s.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>AED {s.amt}</span></button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.subscriptionsList.map((r, i) => (
            <div key={r.name + '-' + i} style={{
              background: 'var(--surface)', border: '1px solid var(--hairline)',
              borderRadius: 14, padding: '12px 13px',
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  aria-label="Subscription name"
                  value={r.name}
                  onChange={(e) => updateSub(i, { name: e.target.value })}
                  placeholder="e.g. Netflix, Spotify…"
                  style={{
                    flex: 1, border: 'none', background: 'var(--surface-2)', borderRadius: 8,
                    padding: '9px 12px', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--ink)',
                  }}
                />
                <button
                  type="button" onClick={() => removeSub(i)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: 'none',
                    background: 'var(--surface-2)', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--muted)', fontSize: 15, marginTop: 4,
                  }}
                >×</button>
              </div>
              <ObAmount value={r.amt} onChange={(v) => updateSub(i, { amt: v })} ccy={data.ccy} placeholder="Amount / month" />
              {dayInput(r.billingDay, (v) => updateSub(i, { billingDay: v }))}
            </div>
          ))}
        </div>
        <button
          type="button" onClick={addSub}
          style={{
            marginTop: 8, background: 'var(--pine-soft)', color: 'var(--pine)',
            border: 'none', borderRadius: 999, padding: '8px 14px',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}
        >+ Add subscription</button>
      </div>

      <ObField label="Other fixed costs">
        <ObAmount value={data.otherExpenses} onChange={(v) => set({ otherExpenses: v })} placeholder="0 (optional)" />
      </ObField>

      {(data.regionCode === 'AE' || data.regionCode === 'SA') && (
        <div style={{ marginBottom: 14 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 10 }}>VAT registration</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: data.vatRegistered === true ? 10 : 0 }}>
            {[{ v: false, label: 'Not registered' }, { v: true, label: 'VAT registered' }].map(({ v, label }) => (
              <button key={String(v)} type="button"
                onClick={() => set({ vatRegistered: v })}
                style={{
                  padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                  background: data.vatRegistered === v ? 'var(--pine)' : 'var(--surface-2)',
                  color: data.vatRegistered === v ? 'var(--on-pine)' : 'var(--muted)',
                }}
              >{label}</button>
            ))}
          </div>
          {data.vatRegistered === false && (
            <p style={{ margin: '6px 2px 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Keel will track your revenue toward the AED 375,000 threshold.
            </p>
          )}
          {data.vatRegistered === true && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Est. annual revenue (for VAT filing)</div>
              <ObAmount value={data.annualRevenue} onChange={(v) => set({ annualRevenue: v })} ccy={data.ccy} placeholder="0 (optional)" />
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        background: 'var(--surface)', border: '1px solid var(--hairline)',
        borderRadius: 14, padding: '14px 16px', marginTop: 4,
      }}>
        <span style={{ fontSize: 14, color: 'var(--ink)' }}>Essentials a month</span>
        <span className="serif tnum" style={{ fontSize: 22, color: 'var(--pine)' }}>
          <Cur n={total} />
        </span>
      </div>
    </div>
  );
}

// ── Step 3: Buffer ────────────────────────────────────────────────────────────

function SavingsStep({
  data,
  set,
}: {
  data: ObData;
  set: (patch: Partial<ObData>) => void;
}) {
  const total =
    (parseInt(data.savingsCash.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.savingsInvestments.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.savingsProperty.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.savingsOther.replace(/[^0-9]/g, ''), 10) || 0);

  return (
    <div>
      <StepIntro
        title="What do you have set aside?"
        sub="Include cash, investments, or any assets you could draw on. Rough numbers are fine."
      />
      <ObField label="Cash & bank accounts">
        <ObAmount value={data.savingsCash} onChange={(v) => set({ savingsCash: v })} ccy={data.ccy} placeholder="0" />
      </ObField>
      <ObField label="Investments (stocks, crypto, funds)">
        <ObAmount value={data.savingsInvestments} onChange={(v) => set({ savingsInvestments: v })} ccy={data.ccy} placeholder="0 (optional)" />
      </ObField>
      <ObField label="Property / asset value">
        <ObAmount value={data.savingsProperty} onChange={(v) => set({ savingsProperty: v })} ccy={data.ccy} placeholder="0 (optional)" />
      </ObField>
      <ObField label="Other">
        <ObAmount value={data.savingsOther} onChange={(v) => set({ savingsOther: v })} ccy={data.ccy} placeholder="0 (optional)" />
      </ObField>

      <div style={{ marginBottom: 14 }}>
        <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 6 }}>How many months cushion do you want?</div>
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>Keel keeps this as your safety net before you touch spending.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 6, 12, 18].map((m) => (
            <button key={m} type="button"
              onClick={() => set({ targetMonths: m })}
              style={{
                padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                background: data.targetMonths === m ? 'var(--pine)' : 'var(--surface-2)',
                color: data.targetMonths === m ? 'var(--on-pine)' : 'var(--muted)',
              }}
            >{m} mo</button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 16px',
          marginTop: 4,
        }}
      >
        <span style={{ fontSize: 14, color: 'var(--ink)' }}>Total buffer</span>
        <span className="serif tnum" style={{ fontSize: 22, color: 'var(--pine)' }}>
          <Cur n={total} />
        </span>
      </div>
      <p style={{ margin: '8px 2px 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        Nothing yet? Leave it all at zero — Keel will help you build a buffer from your first steady months.
      </p>
    </div>
  );
}

// ── Step: Goals ────────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  'Emergency fund',
  'Home / property',
  'Vacation',
  'Car',
  'Education',
  'New business',
  'Retirement',
  'Other',
];

function GoalsStep({
  data,
  set,
}: {
  data: ObData;
  set: (patch: Partial<ObData>) => void;
}) {
  function addGoal() {
    set({ goals: [...data.goals, { name: '', custom: '', targetAmt: '', targetDate: '' }] });
  }

  function updateGoal(i: number, patch: Partial<ObGoal>) {
    set({ goals: data.goals.map((g, j) => (j === i ? { ...g, ...patch } : g)) });
  }

  function removeGoal(i: number) {
    set({ goals: data.goals.filter((_, j) => j !== i) });
  }

  return (
    <div>
      <StepIntro
        title="What are you saving toward?"
        sub="Add as many goals as you like — Keel plans a monthly contribution for each."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
        {data.goals.map((g, i) => (
          <div
            key={g.name + '-' + i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: 16,
              padding: '14px 14px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="smallcaps" style={{ fontSize: 10.5, color: 'var(--muted)' }}>Goal {i + 1}</div>
              <button
                type="button"
                onClick={() => removeGoal(i)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', border: 'none',
                  background: 'var(--surface-2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--muted)', fontSize: 14, lineHeight: 1,
                }}
              >×</button>
            </div>

            {/* Goal name dropdown */}
            <select
              value={g.name}
              onChange={(e) => updateGoal(i, { name: e.target.value, custom: '' })}
              style={{
                width: '100%', padding: '10px 13px', borderRadius: 10, marginBottom: 8,
                border: 'none', background: 'var(--surface-2)',
                fontFamily: 'var(--font-ui)', fontSize: 14, color: g.name ? 'var(--ink)' : 'var(--muted)',
                cursor: 'pointer', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 13px center',
              }}
            >
              <option value="">What are you saving for?</option>
              {GOAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Custom label if "Other" */}
            {g.name === 'Other' && (
              <input
                type="text"
                aria-label="Custom goal name"
                value={g.custom}
                onChange={(e) => updateGoal(i, { custom: e.target.value })}
                placeholder="Describe your goal"
                style={{
                  width: '100%', padding: '10px 13px', borderRadius: 10, marginBottom: 8,
                  border: 'none', background: 'var(--surface-2)',
                  fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {/* Target amount */}
            <ObAmount
              value={g.targetAmt}
              onChange={(v) => updateGoal(i, { targetAmt: v })}
              ccy={data.ccy}
              placeholder="Target amount (optional)"
            />

            {/* Target date */}
            <input
              type="month"
              aria-label="Target date"
              value={g.targetDate}
              onChange={(e) => updateGoal(i, { targetDate: e.target.value })}
              style={{
                width: '100%', marginTop: 8, padding: '10px 13px', borderRadius: 10,
                border: 'none', background: 'var(--surface-2)',
                fontFamily: 'var(--font-ui)', fontSize: 14, color: g.targetDate ? 'var(--ink)' : 'var(--muted)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addGoal}
        style={{
          background: 'var(--pine-soft)', color: 'var(--pine)', border: 'none',
          borderRadius: 999, padding: '9px 15px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--font-ui)',
        }}
      >
        + Add a goal
      </button>

      <p style={{ margin: '12px 2px 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        No goals yet? Skip — Keel will suggest one after your first full month.
      </p>
    </div>
  );
}

// ── Step: Upcoming big payments ────────────────────────────────────────────────

const UPCOMING_SUGGESTIONS = ['School fees', 'Car service', 'Travel', 'Insurance', 'Equipment'];

// ── UAE common subscriptions for quick-add chips ──────────────────────────────

const UAE_SUBS = [
  { name: 'Netflix', amt: '50' },
  { name: 'Spotify', amt: '20' },
  { name: 'Shahid', amt: '20' },
  { name: 'Disney+', amt: '35' },
  { name: 'Apple TV+', amt: '25' },
  { name: 'YouTube Premium', amt: '25' },
  { name: 'Adobe CC', amt: '250' },
  { name: 'Microsoft 365', amt: '40' },
  { name: 'iCloud+', amt: '15' },
  { name: 'Anghami', amt: '15' },
  { name: 'Talabat Pro', amt: '49' },
  { name: 'ChatGPT Plus', amt: '70' },
];

function UpcomingStep({
  data,
  set,
}: {
  data: ObData;
  set: (patch: Partial<ObData>) => void;
}) {
  function addRow() {
    set({ bigPayments: [...data.bigPayments, { name: '', amt: '', dueDate: '' }] });
  }

  function updateRow(i: number, patch: Partial<ObBigPayment>) {
    set({
      bigPayments: data.bigPayments.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    });
  }

  function removeRow(i: number) {
    set({ bigPayments: data.bigPayments.filter((_, j) => j !== i) });
  }

  return (
    <div>
      <StepIntro
        title="Any big payments coming up?"
        sub="School fees, insurance, travel — costs that hit hard. Keel sets aside a little each month so they don't sting."
      />

      {data.bigPayments.length === 0 && (
        <p style={{ margin: '0 2px 16px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Common examples: {UPCOMING_SUGGESTIONS.join(', ')}.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {data.bigPayments.map((r, i) => (
          <div key={r.name + '-' + i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                aria-label="Payment name"
                value={r.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                placeholder="What is it?"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'var(--surface-2)',
                  borderRadius: 10,
                  padding: '10px 13px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                  marginBottom: 6,
                }}
              />
              <ObAmount
                value={r.amt}
                onChange={(v) => updateRow(i, { amt: v })}
                ccy={data.ccy}
                placeholder="Amount"
              />
              <input
                type="month"
                aria-label="Due date"
                value={r.dueDate}
                onChange={(e) => updateRow(i, { dueDate: e.target.value })}
                style={{
                  width: '100%', marginTop: 6, padding: '10px 13px', borderRadius: 10,
                  border: 'none', background: 'var(--surface-2)',
                  fontFamily: 'var(--font-ui)', fontSize: 13.5,
                  color: r.dueDate ? 'var(--ink)' : 'var(--muted)',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove"
              style={{
                marginTop: 6,
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--surface-2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--muted)',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        style={{
          background: 'var(--pine-soft)',
          color: 'var(--pine)',
          border: 'none',
          borderRadius: 999,
          padding: '9px 15px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
        }}
      >
        + Add a payment
      </button>

      <p style={{ margin: '12px 2px 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        Nothing coming up? Skip — you can add these from your dashboard anytime.
      </p>
    </div>
  );
}

// ── Step 4: Seed income ───────────────────────────────────────────────────────

function SeedIncomeStep({
  data,
  set,
}: {
  data: ObData;
  set: (patch: Partial<ObData>) => void;
}) {
  const rows = data.incomes;

  function update(i: number, patch: Partial<IncomeRow>) {
    set({ incomes: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  }

  function add() {
    set({ incomes: [...rows, { amt: '', ccy: 'AED', recurring: null, months: 6, dayOfMonth: 1 }] });
  }

  return (
    <div>
      <StepIntro
        title="Your last few payments"
        sub="Keel reads your real history to suggest a steady wage. Add a few — the more you log, the sharper it gets."
      />

      <div style={{ marginBottom: 20 }}>
        <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 10 }}>How do you typically get paid?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { v: 'monthly', label: 'Regular monthly' },
            { v: 'quarterly', label: 'Quarterly' },
            { v: 'project', label: 'Per project' },
            { v: 'irregular', label: 'Irregular / varies' },
          ].map(({ v, label }) => (
            <button key={v} type="button"
              onClick={() => set({ incomePattern: v as ObData['incomePattern'] })}
              style={{
                padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                background: data.incomePattern === v ? 'var(--pine)' : 'var(--surface-2)',
                color: data.incomePattern === v ? 'var(--on-pine)' : 'var(--muted)',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 10 }}>Do you regularly earn in other currencies?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: true, label: 'Yes — USD/EUR/GBP' }, { v: false, label: 'AED only' }].map(({ v, label }) => (
            <button key={String(v)} type="button"
              onClick={() => set({ multiCurrency: v })}
              style={{
                padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                background: data.multiCurrency === v ? 'var(--pine)' : 'var(--surface-2)',
                color: data.multiCurrency === v ? 'var(--on-pine)' : 'var(--muted)',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r, i) => (
          <div key={`income-row-${r.ccy}-${i}`}>
            <ObAmount
              value={r.amt}
              onChange={(v) => update(i, { amt: v })}
              ccy={r.ccy}
              onCcy={(v) => update(i, { ccy: v })}
              placeholder="Amount"
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => update(i, { recurring: true })}
                style={{
                  padding: '5px 13px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: r.recurring === true ? 'var(--pine)' : 'var(--surface-2)',
                  color: r.recurring === true ? 'var(--on-pine)' : 'var(--muted)',
                }}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => update(i, { recurring: false })}
                style={{
                  padding: '5px 13px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: r.recurring === false ? 'var(--pine)' : 'var(--surface-2)',
                  color: r.recurring === false ? 'var(--on-pine)' : 'var(--muted)',
                }}
              >
                One-off
              </button>
            </div>
            {r.recurring === true && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 5 }}>Income type</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {['Salary', 'Retainer', 'Project', 'Bonus'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update(i, { incomeType: t })}
                        style={{
                          padding: '4px 11px', borderRadius: 999, border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
                          background: r.incomeType === t ? 'var(--pine)' : 'var(--surface-2)',
                          color: r.incomeType === t ? 'var(--on-pine)' : 'var(--muted)',
                        }}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 5 }}>How many months?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[3, 6, 12, 18].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => update(i, { months: m })}
                        style={{
                          padding: '4px 11px',
                          borderRadius: 999,
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-ui)',
                          fontSize: 12,
                          fontWeight: 600,
                          background: (r.months ?? 6) === m ? 'var(--pine)' : 'var(--surface-2)',
                          color: (r.months ?? 6) === m ? 'var(--on-pine)' : 'var(--muted)',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Paid on the…</div>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    aria-label="Day of month"
                    value={r.dayOfMonth ?? 1}
                    placeholder="1"
                    onChange={(e) => update(i, { dayOfMonth: parseInt(e.target.value, 10) || 1 })}
                    style={{
                      width: 56,
                      border: 'none',
                      background: 'var(--surface-2)',
                      borderRadius: 10,
                      padding: '9px 12px',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 14,
                      color: 'var(--ink)',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>th of each month</div>
                </div>
              </div>
            )}
            {r.recurring === false && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 5 }}>When did you receive it?</div>
                <input
                  type="date"
                  aria-label="Date received"
                  value={r.date ?? ''}
                  onChange={(e) => update(i, { date: e.target.value })}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'var(--surface-2)',
                    borderRadius: 10,
                    padding: '9px 12px',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 14,
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        style={{
          marginTop: 12,
          background: 'var(--pine-soft)',
          color: 'var(--pine)',
          border: 'none',
          borderRadius: 999,
          padding: '9px 15px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
        }}
      >
        + Add another payment
      </button>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          margin: '22px 2px 14px',
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          or
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
      </div>
      <Link
        href="/import"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          borderRadius: 14,
          padding: '14px 15px',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4M7 9l5-5 5 5M5 18v2h14v-2"
              stroke="var(--pine)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>
            Import bank statement
          </span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>
            Upload a CSV from your bank
          </span>
        </span>
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
          <path
            d="M1 1l6 6-6 6"
            stroke="var(--muted)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        </svg>
      </Link>
    </div>
  );
}

// ── Step 5: Ready ─────────────────────────────────────────────────────────────

function ReadyStep({ data, set }: { data: ObData; set: (patch: Partial<ObData>) => void }) {
  const filled = data.incomes.filter(
    (r) => parseInt(r.amt.replace(/[^0-9]/g, ''), 10) > 0,
  ).length;
  const provisional = filled < 3;

  const incomeItems: IncomeItem[] = expandIncomeRows(data.incomes, data.incomePattern);

  const essentials =
    (parseInt(data.rent.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.bills.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.transport.replace(/[^0-9]/g, ''), 10) || 0) +
    data.subscriptionsList.reduce((s, r) => s + (parseInt(r.amt.replace(/[^0-9]/g, ''), 10) || 0), 0) +
    (parseInt(data.otherExpenses.replace(/[^0-9]/g, ''), 10) || 0);
  const bufferBalance = computeBufferBalance(data);

  const monthly = groupByMonth(incomeItems);
  const range = computeRange(monthly);
  const suggestedPaycheck =
    incomeItems.length > 0
      ? computePaycheck(range, essentials, bufferBalance)
      : 0;

  const previewAlloc = computeAllocation(suggestedPaycheck, essentials, data.regionCode || 'AE', false, 0, bufferBalance, data.targetMonths);

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Account creation */}
      <div style={{ marginBottom: 28 }}>
        <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>
          Create your account
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted)' }}>
          Save your plan — sign in from any device.
        </p>

        {/* Email */}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>Email</div>
          <input
            aria-label="Email"
            type="email"
            value={data.email}
            onChange={(e) => set({ email: e.target.value, authError: '' })}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 13, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 16, boxSizing: 'border-box' }}
          />
        </label>

        {/* Password */}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>Password</div>
          <input
            aria-label="Password"
            type="password"
            value={data.password}
            onChange={(e) => set({ password: e.target.value, authError: '' })}
            placeholder="6+ characters"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 13, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 16, boxSizing: 'border-box' }}
          />
        </label>

        {/* Password strength */}
        {data.password.length > 0 && (() => {
          const p = data.password;
          let score = 0;
          if (p.length >= 8) score++;
          if (p.length >= 12) score++;
          if (/[A-Z]/.test(p)) score++;
          if (/[0-9]/.test(p)) score++;
          if (/[^A-Za-z0-9]/.test(p)) score++;
          const level = score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : 'Strong';
          const color = score <= 1 ? '#C0392B' : score <= 3 ? '#E67E22' : '#27AE60';
          const pct = Math.min(100, (score / 5) * 100);
          return (
            <div style={{ marginTop: -4, marginBottom: 8 }}>
              <div style={{ height: 4, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width 0.3s, background 0.3s' }} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color, marginTop: 4 }}>{level}</div>
            </div>
          );
        })()}

        {data.authError && (
          <div style={{ fontSize: 13, color: 'var(--clay)', marginTop: -4 }}>{data.authError}</div>
        )}
      </div>

      {/* Plan preview */}
      <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'var(--pine)',
          color: 'var(--on-pine)',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        className="serif"
        style={{ fontSize: 25, color: 'var(--ink)', marginBottom: 8 }}
      >
        Your picture&apos;s ready
      </div>
      <p
        style={{
          margin: '0 auto 20px',
          maxWidth: 280,
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--muted)',
        }}
      >
        From what you&apos;ve entered, Keel has a steady paycheck to start you off.
      </p>
      <Card style={{ textAlign: 'left', padding: '18px var(--pad)' }}>
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.03em',
              background: provisional ? 'var(--gold-soft)' : 'var(--pine-soft)',
              color: provisional ? 'var(--gold)' : 'var(--pine)',
            }}
          >
            {provisional ? 'Provisional estimate' : 'Calibrated to your history'}
          </span>
        </div>
        <div className="smallcaps">
          {provisional ? 'Provisional paycheck' : 'Suggested paycheck'}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            margin: '7px 0 0',
          }}
        >
          <span
            className="serif tnum"
            style={{ fontSize: 38, fontWeight: 500, color: 'var(--ink)', lineHeight: 1 }}
          >
            <Cur n={suggestedPaycheck} />
          </span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>/mo</span>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
          {provisional
            ? 'An early estimate — it sharpens as you log more income.'
            : `Set below your likely month (AED ${Math.round(range.likely).toLocaleString('en-US')}) so good months refill the buffer that carries the lean ones.`}
        </p>
        {suggestedPaycheck > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Rent & bills', val: previewAlloc.rentAndBills },
              { label: 'Runway buffer', val: previewAlloc.buffer },
              { label: 'Spending', val: previewAlloc.spending },
            ].map(({ label, val }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  className="smallcaps"
                  style={{ fontSize: 10.5, color: 'var(--muted)' }}
                >
                  {label}
                </span>
                <span
                  className="tnum"
                  style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}
                >
                  AED {Math.round(val).toLocaleString('en-US')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      {suggestedPaycheck < essentials && essentials > 0 && (
        <div
          style={{
            marginTop: 14,
            background: 'var(--clay-soft)',
            borderRadius: 'var(--r-card)',
            padding: '14px 16px',
            textAlign: 'left',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
            Your current essentials (AED {essentials.toLocaleString('en-US')}) are higher than income can comfortably sustain at this pace. Keel&apos;s showing you the honest number — it improves as income grows or costs come down.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

// ── Buffer balance helper ─────────────────────────────────────────────────────

function computeBufferBalance(data: ObData): number {
  return (
    (parseInt(data.savingsCash.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.savingsInvestments.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.savingsProperty.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.savingsOther.replace(/[^0-9]/g, ''), 10) || 0)
  );
}

// ── Income row expansion ──────────────────────────────────────────────────────

function expandIncomeRows(rows: IncomeRow[], incomePattern: ObData['incomePattern'] = ''): IncomeItem[] {
  const today = new Date();
  const items: IncomeItem[] = [];

  // Monthly pattern with just 1-2 data points can be treated as confirmed
  // Irregular/project patterns stay provisional even with multiple data points
  const patternBoostsConfidence = incomePattern === 'monthly';

  for (const r of rows) {
    const amt = parseFloat(r.amt.replace(/[^0-9.]/g, ''));
    if (!amt || isNaN(amt)) continue;

    if (r.recurring) {
      const months = r.months ?? 6;
      const day = r.dayOfMonth ?? 1;
      for (let m = 0; m < months; m++) {
        const d = new Date(today.getFullYear(), today.getMonth() - m, Math.min(day, 28));
        items.push({
          amount: amt,
          currency: r.ccy,
          date: d.toISOString().slice(0, 10),
          confidence: 'confirmed',
        });
      }
    } else {
      const date = r.date || today.toISOString().slice(0, 10);
      // Monthly-pattern one-offs get a confidence boost
      const confidence: IncomeItem['confidence'] = patternBoostsConfidence ? 'confirmed' : 'likely';
      items.push({
        amount: amt,
        currency: r.ccy,
        date,
        confidence,
      });
    }
  }
  return items;
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

type StepProps = { data: ObData; set: (patch: Partial<ObData>) => void };
function ReadyWrapper(props: StepProps) { return <ReadyStep data={props.data} set={props.set} />; }

const OB_STEPS = ['region', 'income', 'essentials', 'savings', 'goals', 'upcoming', 'ready'] as const;
type StepKey = typeof OB_STEPS[number];

export function OnboardingClient(): React.ReactElement {
  const router = useRouter();
  const { setProfile, addBigPayment, setUserGoals } = usePlan();

  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<ObData>(INITIAL_DATA);

  function set(patch: Partial<ObData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  const step: StepKey = OB_STEPS[stepIdx];
  const isLast = stepIdx === OB_STEPS.length - 1;
  const pct = ((stepIdx + 1) / OB_STEPS.length) * 100;

  function back() {
    if (stepIdx === 0) {
      router.push('/');
    } else {
      setStepIdx((i) => i - 1);
    }
  }

  function next() {
    if (isLast) {
      commitAndNavigate().catch((err) => console.error('[onboarding] commitAndNavigate error:', err));
      return;
    }
    setStepIdx((i) => i + 1);
  }

  async function commitAndNavigate() {
    // Validate email + password
    const email = data.email.trim().toLowerCase();
    const password = data.password;
    if (!email) {
      set({ authError: 'Please enter your email address.' });
      return;
    }
    if (!email.includes('@')) {
      set({ authError: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      set({ authError: 'Password must be at least 6 characters.' });
      return;
    }

    const incomeItems: IncomeItem[] = expandIncomeRows(data.incomes, data.incomePattern);

    const essentials =
      (parseInt(data.rent.replace(/[^0-9]/g, ''), 10) || 0) +
      (parseInt(data.bills.replace(/[^0-9]/g, ''), 10) || 0) +
      (parseInt(data.transport.replace(/[^0-9]/g, ''), 10) || 0) +
      data.subscriptionsList.reduce((s, r) => s + (parseInt(r.amt.replace(/[^0-9]/g, ''), 10) || 0), 0) +
      (parseInt(data.otherExpenses.replace(/[^0-9]/g, ''), 10) || 0);

    const bufferBalance = computeBufferBalance(data);
    const zakatOn = data.regionCode === 'AE' || data.regionCode === 'SA';

    // Zakat nisab adjustment: dependants reduce the zakatable portion slightly
    // Each dependant represents ~AED 3,000/year in personal allowance
    const dependantAllowance = data.dependants * 3000;
    const zakatableWealth = zakatOn ? Math.max(0, bufferBalance - dependantAllowance) : 0;

    const profile: Profile = {
      region: data.regionCode,
      currency: data.ccy,
      essentials,
      bufferBalance,
      targetMonths: data.targetMonths,
      zakatOn,
      zakatableWealth,
      incomes: incomeItems,
    };

    const userId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);

    // Register account
    const regRes = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userId }),
    });
    if (!regRes.ok) {
      const regData = await regRes.json();
      set({ authError: regData.error || 'Registration failed. Please try again.' });
      return;
    }

    // Sign in via NextAuth email-password provider
    await signIn('email-password', { email, password, redirect: false });

    setProfile(profile);

    // Store user goals from onboarding
    const userGoals: UserGoal[] = data.goals
      .filter((g) => g.name)
      .map((g) => ({
        name: g.name === 'Other' ? g.custom || 'Custom goal' : g.name,
        custom: g.custom,
        targetAmt: parseInt(g.targetAmt.replace(/[^0-9]/g, ''), 10) || 0,
        targetDate: g.targetDate,
      }));
    if (userGoals.length > 0) {
      setUserGoals(userGoals);
    }

    // Build big payments list before adding to store so we can persist them too
    const bigPaymentItems: { id: string; m: string; pos: number; name: string; amt: number; status: 'saving' } [] = [];
    for (const bp of data.bigPayments) {
      const amt = parseInt(bp.amt.replace(/[^0-9]/g, ''), 10);
      if (bp.name.trim() && amt > 0) {
        const dueMon = bp.dueDate
          ? new Date(bp.dueDate + '-01').toLocaleString('en', { month: 'short' })
          : 'Soon';
        bigPaymentItems.push({
          id: `ob-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          m: dueMon,
          pos: 0.5,
          name: bp.name.trim(),
          amt,
          status: 'saving',
        });
      }
    }
    for (const bp of bigPaymentItems) {
      addBigPayment(bp);
    }

    // Persist goals and big payments to Convex (best-effort, non-blocking)
    const persistPayload: Record<string, string> = {};
    if (userGoals.length > 0) {
      persistPayload.goalsJson = JSON.stringify(userGoals);
    }
    if (bigPaymentItems.length > 0) {
      persistPayload.bigPaymentsJson = JSON.stringify(bigPaymentItems);
    }
    if (Object.keys(persistPayload).length > 0) {
      fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persistPayload),
      }).catch(() => {}); // Best-effort — don't block navigation on failure
    }

    router.push('/paycheck');
  }

  const ctaLabel = isLast ? 'See your paycheck' : step === 'upcoming' ? 'Build my plan' : 'Continue';

  const StepView: React.ComponentType<StepProps> = {
    region: RegionStep,
    essentials: EssentialsStep,
    savings: SavingsStep,
    goals: GoalsStep,
    upcoming: UpcomingStep,
    income: SeedIncomeStep,
    ready: ReadyWrapper,
  }[step] as React.ComponentType<StepProps>;

  return (
    <div
      data-theme="light"
      style={{
        position: 'relative',
        height: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 480,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      {/* Header: back arrow + progress bar + step counter */}
      <div
        style={{
          padding: '20px 18px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            flexShrink: 0,
            border: '1px solid var(--hairline)',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
            <path
              d="M9 2 2 9l7 7"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'var(--surface-2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: pct + '%',
                height: '100%',
                background: 'var(--pine)',
                borderRadius: 999,
                transition: 'width 0.4s cubic-bezier(.4,1,.5,1)',
              }}
            />
          </div>
        </div>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--muted)',
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {stepIdx + 1} / {OB_STEPS.length}
        </span>
      </div>

      {/* Scrollable step body */}
      <div
        key={step}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          padding: '18px 18px 120px',
        }}
      >
        <div className="rise">
          <StepView data={data} set={set} />
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          padding: '14px 18px 30px',
          background: 'linear-gradient(to top, var(--bg) 64%, transparent)',
        }}
      >
        <button
          type="button"
          onClick={next}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--r-pill)',
            cursor: 'pointer',
            background: 'var(--pine)',
            color: 'var(--on-pine)',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 16,
            fontWeight: 700,
            boxShadow: '0 6px 18px rgba(31,77,58,0.28)',
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
