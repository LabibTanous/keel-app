/**
 * engine.test.ts — committed verification suite for Keel's plan engine.
 * Run: npm test  (vitest). Pure-function tests, no DB/network.
 *
 * This is the project's correctness finish line. Every row of the agreed
 * Verification Matrix is encoded here. Web-researched financial facts carry a
 * `// source:` comment. Fix the ENGINE to pass — never weaken a test.
 */
import { describe, it, expect } from 'vitest';
import {
  type IncomeItem,
  toAED,
  groupByMonth,
  computeRangeFromIncomes,
  computePaycheck,
  computeAllocation,
  computeRunway,
  computeAfford,
  crossLinkAffordWithIncoming,
  goalTradeoff,
  estimateAnnualTax,
  CCY_RATES,
  ASSUMED_PROFIT_MARGIN,
  UAE_CT_RATE,
  UAE_CT_FREE_THRESHOLD,
  UAE_CT_REGISTRATION_TURNOVER,
} from './engine';

// ── helpers ───────────────────────────────────────────────────────────────────
const inc = (
  amount: number,
  date: string,
  currency = 'AED',
  confidence: IncomeItem['confidence'] = 'confirmed',
): IncomeItem => ({ amount, currency, date, confidence });

const DEMO: IncomeItem[] = [
  inc(12000, '2025-01-01'), inc(21000, '2025-02-01'), inc(10000, '2025-03-01'),
  inc(19000, '2025-04-01'), inc(11500, '2025-05-01'), inc(17000, '2025-06-01'),
];
const DEMO_ESSENTIALS = 6200;
const DEMO_BUFFER = 23000;

const allocSum = (a: { rentAndBills: number; tax: number; zakat: number; buffer: number; spending: number }) =>
  a.rentAndBills + a.tax + a.zakat + a.buffer + a.spending;

// ── 1. Demo seed regression anchor ─────────────────────────────────────────────
describe('1. demo seed (regression anchor — must never break)', () => {
  it('6 monthly AED incomes, essentials 6,200 → paycheck 9,750', () => {
    const range = computeRangeFromIncomes(DEMO);
    expect(Math.round(range.likely)).toBe(14500);
    expect(computePaycheck(range, DEMO_ESSENTIALS, DEMO_BUFFER)).toBe(9750);
    expect(range.provisional).toBe(false);
  });
});

// ── 2. Single large payment → annualised, not read as a monthly wage ────────────
describe('2. single payment 150k', () => {
  it('annualises over 12 → low paycheck (~8k), provisional', () => {
    const range = computeRangeFromIncomes([inc(150000, '2025-01-15')]);
    expect(range.provisional).toBe(true);
    expect(Math.round(range.likely)).toBe(12500); // 150000 / 12
    const pay = computePaycheck(range, 3739, 0);
    expect(pay).toBeGreaterThanOrEqual(7000);
    expect(pay).toBeLessThanOrEqual(9000);
  });
  it("declaring 'monthly' trusts the user (treated as recurring)", () => {
    const range = computeRangeFromIncomes([inc(150000, '2025-01-15')], 'monthly');
    expect(Math.round(range.likely)).toBe(50000); // single-point /3 stretch
  });
});

// ── 3. Lumpy multi-payment → annualised over max(12, span) ──────────────────────
describe('3. lumpy 90k/100k/80k over Feb–Oct (project)', () => {
  const range = computeRangeFromIncomes(
    [inc(90000, '2025-02-10'), inc(100000, '2025-06-10'), inc(80000, '2025-10-10')],
    'project',
  );
  it('likely ≈ 22,500 (270k / 12), provisional', () => {
    expect(Math.round(range.likely)).toBe(22500);
    expect(range.provisional).toBe(true);
  });
  it('paycheck ≈ 14,500', () => {
    expect(computePaycheck(range, DEMO_ESSENTIALS, DEMO_BUFFER)).toBe(14500);
  });
});

// ── 4. Dense recent burst is NOT crushed ────────────────────────────────────────
describe('4. dense burst (3 consecutive months, tagged project)', () => {
  it('treated near-monthly, not thinly annualised', () => {
    const range = computeRangeFromIncomes(
      [inc(30000, '2025-01-10'), inc(32000, '2025-02-10'), inc(28000, '2025-03-10')],
      'project',
    );
    expect(range.likely).toBeGreaterThanOrEqual(28000);
    expect(range.likely).toBeLessThanOrEqual(32000);
  });
});

// ── 5. Allocation always sums exactly to paycheck ───────────────────────────────
describe('5. allocation sums exactly to paycheck', () => {
  const cases: Array<[string, number, ReturnType<typeof computeAllocation>]> = [
    ['zero income (floor paycheck)', 6250, computeAllocation(6250, 6200, 'AE', false, 0, 0, 3, 0, {})],
    ['essentials > paycheck', 8000, computeAllocation(8000, 15000, 'AE', false, 0, 0, 3, 0, {})],
    ['high buffer (no deficit)', 10000, computeAllocation(10000, 6200, 'AE', false, 0, 500000, 3, 0, {})],
    ['zero buffer', 10000, computeAllocation(10000, 6200, 'AE', false, 0, 0, 3, 0, {})],
    ['with uae_ct tax', 30000, computeAllocation(30000, 6200, 'AE', false, 0, 0, 3, 1400000, { taxMode: 'uae_ct' })],
    ['with zakat', 10000, computeAllocation(10000, 6200, 'AE', true, 100000, 0, 3, 0, {})],
    ['with flat tax', 20000, computeAllocation(20000, 6200, 'AE', false, 0, 0, 3, 120000, { taxMode: 'flat', taxFlatRate: 15 })],
  ];
  for (const [name, paycheck, a] of cases) {
    it(`sums to paycheck — ${name}`, () => {
      expect(allocSum(a)).toBe(paycheck);
      expect(a.rentAndBills).toBeGreaterThanOrEqual(0);
      expect(a.tax).toBeGreaterThanOrEqual(0);
      expect(a.zakat).toBeGreaterThanOrEqual(0);
      expect(a.buffer).toBeGreaterThanOrEqual(0);
    });
  }
});

// ── 6. Tax modes (user-defined) ─────────────────────────────────────────────────
describe('6. estimateAnnualTax by mode', () => {
  it("'none' → 0", () => {
    expect(estimateAnnualTax(120000, { taxMode: 'none' })).toBe(0);
    expect(estimateAnnualTax(5_000_000, {})).toBe(0); // default mode none
  });
  it("'flat' 15% on 120k → 18,000/yr (1,500/mo)", () => {
    expect(estimateAnnualTax(120000, { taxMode: 'flat', taxFlatRate: 15 })).toBe(18000);
    expect(Math.round(estimateAnnualTax(120000, { taxMode: 'flat', taxFlatRate: 15 }) / 12)).toBe(1500);
  });
  it("'flat' 0% → 0", () => {
    expect(estimateAnnualTax(120000, { taxMode: 'flat', taxFlatRate: 0 })).toBe(0);
  });
  it("'uae_ct' 1.4M turnover → ≈4,050/yr", () => {
    expect(estimateAnnualTax(1_400_000, { taxMode: 'uae_ct' })).toBe(4050);
  });
  it("'uae_ct' under AED 1M turnover → 0 (below registration line)", () => {
    expect(estimateAnnualTax(800_000, { taxMode: 'uae_ct' })).toBe(0);
  });
  it("'uae_ct' 2M turnover → (600k-375k)×9% = 20,250", () => {
    expect(estimateAnnualTax(2_000_000, { taxMode: 'uae_ct' })).toBe(20250);
  });
});

// ── 7. Runway / provisional / volatility safety factor ──────────────────────────
describe('7. runway, provisional, safety factor', () => {
  it('runway never negative', () => {
    expect(computeRunway(0, 6200)).toBe(0);
    expect(computeRunway(50000, 6200)).toBeGreaterThan(0);
    expect(computeRunway(100, 0)).toBe(0); // guard essentials<=0
  });
  it('provisional true with < 3 months, false with established monthly', () => {
    expect(computeRangeFromIncomes([inc(20000, '2025-01-01')], 'monthly').provisional).toBe(true);
    expect(computeRangeFromIncomes([inc(20000, '2025-01-01'), inc(20000, '2025-02-01')], 'monthly').provisional).toBe(true);
    expect(computeRangeFromIncomes(DEMO).provisional).toBe(false);
  });
  it('paycheck safety factor stays within 0.55–0.85 of likely', () => {
    const steady = computePaycheck({ lean: 18000, likely: 20000, strong: 22000, provisional: false }, 0, 0);
    expect(steady / 20000).toBeGreaterThanOrEqual(0.70);
    expect(steady / 20000).toBeLessThanOrEqual(0.86);
    const choppy = computePaycheck({ lean: 5000, likely: 20000, strong: 40000, provisional: false }, 0, 0);
    expect(choppy / 20000).toBeGreaterThanOrEqual(0.50);
    expect(choppy / 20000).toBeLessThanOrEqual(0.60);
  });
});

// ── 8. Afford verdicts — exact boundaries against the plan ──────────────────────
describe('8. afford fits/dips/break (plan, not bank balance)', () => {
  it('fits when cost ≤ discretionary', () => {
    expect(computeAfford(1000, 2000, 5000, 3000).verdict).toBe('fits');
    expect(computeAfford(2000, 2000, 5000, 3000).verdict).toBe('fits'); // exact boundary
  });
  it('dips when cost ≤ discretionary + free buffer', () => {
    expect(computeAfford(2500, 2000, 5000, 3000).verdict).toBe('dips');
    expect(computeAfford(4000, 2000, 5000, 3000).verdict).toBe('dips'); // exact boundary
  });
  it('break when cost exceeds both', () => {
    expect(computeAfford(4001, 2000, 5000, 3000).verdict).toBe('break');
  });
});

// ── 9. Multi-currency conversion via dated rates ────────────────────────────────
describe('9. multi-currency → AED', () => {
  it('toAED uses the rate table', () => {
    expect(toAED(8000, 'USD')).toBeCloseTo(8000 * CCY_RATES.USD, 2);
    expect(toAED(1000, 'EUR')).toBeCloseTo(3950, 2);
    expect(toAED(1000, 'GBP')).toBeCloseTo(4620, 2);
    expect(toAED(1000, 'SAR')).toBeCloseTo(979, 2);
    expect(toAED(1000, 'AED')).toBe(1000);
  });
  it('groupByMonth converts foreign income to AED', () => {
    const m = groupByMonth([inc(8000, '2025-03-01', 'USD')]);
    expect(m['2025-03']).toBeCloseTo(8000 * CCY_RATES.USD, 2);
  });
});

// ── 10. Cross-links + goal trade-off ────────────────────────────────────────────
describe('10. cross-links and goal trade-off', () => {
  const isoIn = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  it('confirmed payment within 14 days flips a break verdict', () => {
    const hint = crossLinkAffordWithIncoming(5000, 2000, [inc(4000, isoIn(7))]);
    expect(hint).not.toBeNull();
    expect(hint?.wouldChangeTo).toBe('fits');
  });
  it('payment beyond 14 days does not flip', () => {
    expect(crossLinkAffordWithIncoming(5000, 2000, [inc(4000, isoIn(30))])).toBeNull();
  });
  it('goalTradeoff computes months and reduced spending', () => {
    const t = goalTradeoff(30000, 10000, 2000, 5000);
    expect(t.monthsToGoal).toBe(10); // (30000-10000)/2000
    expect(t.newSpending).toBe(3000);
    expect(t.feasible).toBe(true);
  });
  it('goalTradeoff with zero contribution → no ETA', () => {
    expect(goalTradeoff(30000, 10000, 0, 5000).monthsToGoal).toBeNull();
  });
});

// ── RESEARCH-GATE tests (web-sourced financial facts) ──────────────────────────
describe('research: UAE Corporate Tax constants', () => {
  // source: UAE Federal Decree-Law No. 47 of 2022 + FTA — 0% up to AED 375,000
  // taxable income, 9% above; sole proprietors/freelancers with turnover > AED 1M
  // must register. https://uaelegislation.gov.ae/en/legislations/1614 ,
  // https://www.cleartax.com/ae/corporate-tax-in-uae
  it('rate 9%, free threshold AED 375k, registration line AED 1M', () => {
    expect(UAE_CT_RATE).toBe(0.09);
    expect(UAE_CT_FREE_THRESHOLD).toBe(375_000);
    expect(UAE_CT_REGISTRATION_TURNOVER).toBe(1_000_000);
    expect(ASSUMED_PROFIT_MARGIN).toBeGreaterThan(0);
    expect(ASSUMED_PROFIT_MARGIN).toBeLessThan(1);
  });
  it('9% applies only to profit above 375k (marginal, not flat)', () => {
    expect(estimateAnnualTax(1_250_000, { taxMode: 'uae_ct' })).toBe(0); // profit 375k = threshold
    expect(estimateAnnualTax(2_000_000, { taxMode: 'uae_ct' })).toBe(20250);
  });
});

describe('research: emergency-fund / runway norm', () => {
  // source: CFPB — a healthy emergency fund covers 3–6 months of expenses; for
  // irregular/self-employed income aim higher and average receipts over 6–12 months.
  // https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/
  it('an N-month buffer reads as N months of runway', () => {
    const essentials = 6200;
    expect(computeRunway(essentials * 3, essentials)).toBe(3);
    expect(computeRunway(essentials * 6, essentials)).toBe(6);
  });
  it('irregular income is annualised over at least 12 months (CFPB: average over 6–12mo)', () => {
    const range = computeRangeFromIncomes(
      [inc(60000, '2025-01-10'), inc(60000, '2025-06-10'), inc(60000, '2025-11-10')],
      'irregular',
    );
    expect(Math.round(range.likely)).toBe(15000); // 180k / 12, never /3
    expect(range.provisional).toBe(true);
  });
});
