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
import { groupByMonth, computeRange, computePaycheck, computeAllocation } from '@/lib/engine';
import type { Profile, IncomeItem } from '@/lib/engine';
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
  recurring: boolean;
  months?: number;
  dayOfMonth?: number;
  date?: string;
}

interface ObData {
  region: string;
  regionCode: string;
  ccy: string;
  rent: string;
  bills: string;
  savings: string;
  transport: string;
  subscriptions: string;
  otherExpenses: string;
  incomes: IncomeRow[];
  email: string;
  password: string;
  authError: string;
}

const INITIAL_DATA: ObData = {
  region: 'United Arab Emirates',
  regionCode: 'AE',
  ccy: 'AED',
  rent: '',
  bills: '',
  savings: '',
  transport: '',
  subscriptions: '',
  otherExpenses: '',
  incomes: [
    { amt: '', ccy: 'AED', recurring: true, months: 6, dayOfMonth: 1 },
    { amt: '', ccy: 'AED', recurring: true, months: 6, dayOfMonth: 1 },
    { amt: '', ccy: 'AED', recurring: true, months: 6, dayOfMonth: 1 },
  ],
  email: '',
  password: '',
  authError: '',
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
  const total = rent + bills + (parseInt(data.transport.replace(/[^0-9]/g, ''), 10) || 0) + (parseInt(data.subscriptions.replace(/[^0-9]/g, ''), 10) || 0) + (parseInt(data.otherExpenses.replace(/[^0-9]/g, ''), 10) || 0);
  return (
    <div>
      <StepIntro
        title="What does a month cost to keep going?"
        sub="Your essentials — rent and the bills that don't stop. Keel makes sure your paycheck always clears these."
      />
      <ObField label="Rent / housing">
        <ObAmount value={data.rent} onChange={(v) => set({ rent: v })} />
      </ObField>
      <ObField label="Bills & utilities">
        <ObAmount value={data.bills} onChange={(v) => set({ bills: v })} />
      </ObField>
      <ObField label="Transport / commute">
        <ObAmount value={data.transport} onChange={(v) => set({ transport: v })} placeholder="0 (optional)" />
      </ObField>
      <ObField label="Subscriptions">
        <ObAmount value={data.subscriptions} onChange={(v) => set({ subscriptions: v })} placeholder="0 (optional)" />
      </ObField>
      <ObField label="Other fixed costs">
        <ObAmount value={data.otherExpenses} onChange={(v) => set({ otherExpenses: v })} placeholder="0 (optional)" />
      </ObField>
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
  return (
    <div>
      <StepIntro
        title="What's in your buffer today?"
        sub="Whatever you've set aside — it's the cushion Keel plans around. A rough number is fine."
      />
      <ObField label="Savings / buffer">
        <ObAmount value={data.savings} onChange={(v) => set({ savings: v })} />
      </ObField>
      <p style={{ margin: '2px 2px 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        No buffer yet? Leave it at zero — Keel will help you build one from your first steady months.
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
    set({ incomes: [...rows, { amt: '', ccy: 'AED', recurring: true, months: 6, dayOfMonth: 1 }] });
  }

  return (
    <div>
      <StepIntro
        title="Your last few payments"
        sub="Keel reads your real history to suggest a steady wage. Add a few — the more you log, the sharper it gets."
      />
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
                  background: r.recurring ? 'var(--pine)' : 'var(--surface-2)',
                  color: r.recurring ? 'var(--on-pine)' : 'var(--muted)',
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
                  background: !r.recurring ? 'var(--pine)' : 'var(--surface-2)',
                  color: !r.recurring ? 'var(--on-pine)' : 'var(--muted)',
                }}
              >
                One-off
              </button>
            </div>
            {r.recurring ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Paid on the...</div>
                  <input
                    type="number"
                    min={1}
                    max={31}
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
            ) : (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 5 }}>When did you receive it?</div>
                <input
                  type="date"
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

  const incomeItems: IncomeItem[] = expandIncomeRows(data.incomes);

  const essentials =
    (parseInt(data.rent.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.bills.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.transport.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.subscriptions.replace(/[^0-9]/g, ''), 10) || 0) +
    (parseInt(data.otherExpenses.replace(/[^0-9]/g, ''), 10) || 0);
  const bufferBalance = parseInt(data.savings.replace(/[^0-9]/g, ''), 10) || 0;

  const monthly = groupByMonth(incomeItems);
  const range = computeRange(monthly);
  const suggestedPaycheck =
    incomeItems.length > 0
      ? computePaycheck(range, essentials, bufferBalance)
      : 0;

  const previewAlloc = computeAllocation(suggestedPaycheck, essentials, 'AE', false, 0, bufferBalance, 3);

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
            style={{ width: '100%', padding: '13px 14px', borderRadius: 13, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
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
            style={{ width: '100%', padding: '13px 14px', borderRadius: 13, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
          />
        </label>

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

// ── Income row expansion ──────────────────────────────────────────────────────

function expandIncomeRows(rows: IncomeRow[]): IncomeItem[] {
  const today = new Date();
  const items: IncomeItem[] = [];

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
      items.push({
        amount: amt,
        currency: r.ccy,
        date,
        confidence: 'likely',
      });
    }
  }
  return items;
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

type StepProps = { data: ObData; set: (patch: Partial<ObData>) => void };
function ReadyWrapper(props: StepProps) { return <ReadyStep data={props.data} set={props.set} />; }

const OB_STEPS = ['region', 'essentials', 'savings', 'income', 'ready'] as const;
type StepKey = typeof OB_STEPS[number];

export function OnboardingClient(): React.ReactElement {
  const router = useRouter();
  const { setProfile } = usePlan();

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

    const incomeItems: IncomeItem[] = expandIncomeRows(data.incomes);

    const essentials =
      (parseInt(data.rent.replace(/[^0-9]/g, ''), 10) || 0) +
      (parseInt(data.bills.replace(/[^0-9]/g, ''), 10) || 0) +
      (parseInt(data.transport.replace(/[^0-9]/g, ''), 10) || 0) +
      (parseInt(data.subscriptions.replace(/[^0-9]/g, ''), 10) || 0) +
      (parseInt(data.otherExpenses.replace(/[^0-9]/g, ''), 10) || 0);

    const bufferBalance = parseInt(data.savings.replace(/[^0-9]/g, ''), 10) || 0;
    const zakatOn = data.regionCode === 'AE' || data.regionCode === 'SA';
    const profile: Profile = {
      region: data.regionCode,
      currency: data.ccy,
      essentials,
      bufferBalance,
      targetMonths: 3,
      zakatOn,
      zakatableWealth: zakatOn ? bufferBalance : 0,
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
    router.push('/paycheck');
  }

  const ctaLabel = isLast ? 'See your paycheck' : stepIdx === 3 ? 'Build my plan' : 'Continue';

  const StepView: React.ComponentType<StepProps> = {
    region: RegionStep,
    essentials: EssentialsStep,
    savings: SavingsStep,
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
