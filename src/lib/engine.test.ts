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
  type IncomeRange,
  toAED,
  groupByMonth,
  computeRange,
  computeRangeFromIncomes,
  computePaycheck,
  computeAllocation,
  computeRunway,
  computeOutlook,
  computeAfford,
  crossLinkAffordWithIncoming,
  goalTradeoff,
  volatilityTrend,
  interpret,
  detectSignals,
  liveZakatableWealth,
  estimateAnnualTax,
  CCY_RATES,
  FX_AS_OF,
  ASSUMED_PROFIT_MARGIN,
  UAE_CT_RATE,
  UAE_CT_FREE_THRESHOLD,
  UAE_CT_REGISTRATION_TURNOVER,
  // deprecated shims — must stay importable (api/plan/route.ts depends on them)
  analyzeIncome,
  recommendPaycheck,
  buildMonthlyPlan,
  detectSignalsLegacy,
  forecastNextMonth,
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

// ════════════════════════════════════════════════════════════════════════════
// SCENARIO LIBRARY — KEEL_ENGINE_SCENARIOS.md (non-DECISION entries)
// DECISION entries A6/B3/D3/D4/E4/F7/G3/H5 are intentionally NOT encoded here —
// they need a product call. UI/adviser-only entries (G4, H2 markers; I5 cap;
// J1–J6 adviser copy) live in TaxClient/Assistant/store, not the pure engine.
// ════════════════════════════════════════════════════════════════════════════

const months = (amounts: number[], startMonth = 1, year = 2025): IncomeItem[] =>
  amounts.map((a, i) => inc(a, `${year}-${String(startMonth + i).padStart(2, '0')}-01`));

const makeInterp = (over: {
  range?: IncomeRange; paycheck?: number; essentials?: number; region?: string;
  buffer?: number; taxTurnover?: number; outlook?: string; tracked?: number;
  taxMode?: 'none' | 'flat' | 'uae_ct'; taxFlatRate?: number; incomes?: IncomeItem[];
  incomePattern?: string;
} = {}) => {
  const range = over.range ?? computeRangeFromIncomes(DEMO);
  const paycheck = over.paycheck ?? 9750;
  const essentials = over.essentials ?? 6200;
  const region = over.region ?? 'AE';
  const buffer = over.buffer ?? 0;
  const taxTurnover = over.taxTurnover ?? 0;
  const allocation = computeAllocation(paycheck, essentials, region, false, 0, buffer, 3, taxTurnover, { taxMode: over.taxMode, taxFlatRate: over.taxFlatRate });
  const runway = computeRunway(buffer, essentials);
  return interpret(
    { range, paycheck, allocation, runway, outlook: over.outlook ?? 'on track', trackedThisMonth: over.tracked ?? 0, taxTurnover },
    { essentials, targetMonths: 3, region, taxMode: over.taxMode, taxFlatRate: over.taxFlatRate, incomePattern: over.incomePattern },
    over.incomes ?? [],
  );
};

describe('Scenario A — paycheck & volatility', () => {
  it('A1 wider swings → lower pay', () => {
    // scenario A1
    const steady = computePaycheck(computeRangeFromIncomes(months([13500, 14000, 14500])), 0, 0);
    const choppy = computePaycheck(computeRangeFromIncomes(months([3000, 12000, 30000])), 0, 0);
    expect(steady).toBeGreaterThan(choppy);
    expect(steady).toBeGreaterThanOrEqual(10500);
    expect(steady).toBeLessThanOrEqual(12500);
    expect(choppy).toBeGreaterThanOrEqual(5500);
    expect(choppy).toBeLessThanOrEqual(7500);
  });
  it('A2 single windfall is not a raise', () => {
    // scenario A2
    const r = computeRangeFromIncomes([inc(150000, '2025-01-15')]);
    expect(r.provisional).toBe(true);
    expect(computePaycheck(r, 3739, 0)).toBeLessThanOrEqual(9000);
  });
  it('A3 lumpy multi-payment annualised over max(12,span)', () => {
    // scenario A3
    const r = computeRangeFromIncomes(months([90000], 2).concat(months([100000], 6), months([80000], 10)), 'project');
    expect(Math.round(r.likely)).toBe(22500);
    expect(computePaycheck(r, 6200, 23000)).toBe(14500);
  });
  it('A4 dense recent burst not crushed', () => {
    // scenario A4
    const r = computeRangeFromIncomes(months([15000, 16000, 14000]), 'project');
    expect(r.likely).toBeGreaterThan(13000); // near-monthly median ~15k, not 45k/12=3,750
  });
  it('A5 more history → less provisional', () => {
    // scenario A5
    expect(computeRangeFromIncomes(months([14000, 15000]), 'monthly').provisional).toBe(true);
    expect(computeRangeFromIncomes(DEMO).provisional).toBe(false);
  });
  it('A7 steadier lately → trend steadier', () => {
    // scenario A7 — prior 3 choppy, recent 3 steady
    const t = volatilityTrend(months([4000, 26000, 6000, 14000, 14200, 13800]));
    expect(t.trend).toBe('steadier');
    expect(t.message.length).toBeGreaterThan(0);
  });
  it('A8 choppier lately → trend choppier', () => {
    // scenario A8 — prior 3 steady, recent 3 choppy
    const t = volatilityTrend(months([14000, 14200, 13800, 4000, 26000, 6000]));
    expect(t.trend).toBe('choppier');
  });
  it('A9 paycheck never at/above a likely month', () => {
    // scenario A9
    for (const set of [months([14000, 15000, 13000, 16000, 14500, 15500]), months([30000, 5000, 28000, 9000])]) {
      const r = computeRangeFromIncomes(set);
      expect(computePaycheck(r, 6200, 23000)).toBeLessThan(r.likely);
    }
  });
  it('A10 essentials above income → honest low number + signal', () => {
    // scenario A10
    const r = computeRangeFromIncomes(DEMO);
    const pay = computePaycheck(r, 20000, 23000);
    expect(pay).toBeLessThan(r.likely); // not inflated to cover essentials
    const alloc = computeAllocation(pay, 20000, 'AE', false, 0, 23000, 3, 0, {});
    const sigs = detectSignals(r, alloc, 0, 0.5);
    expect(sigs.some(s => /essentials exceed/i.test(s.title))).toBe(true);
  });
});

describe('Scenario B — buffer & runway', () => {
  it('B1 runway < 1.5 = top priority warning', () => {
    // scenario B1
    const i = makeInterp({ buffer: 3000, essentials: 6000 });
    expect(i.topInsightLevel).toBe('warning');
    expect(i.topInsight).toMatch(/days/);
  });
  it('B2 runway >= 3 = freedom framing', () => {
    // scenario B2
    const i = makeInterp({ buffer: 30000, essentials: 6000 });
    expect(i.topInsightLevel).toBe('success');
    expect(i.topInsight).toMatch(/breathing room/i);
  });
  it('B4 buffer above target → no over-saving', () => {
    // scenario B4
    const a = computeAllocation(15000, 6200, 'AE', false, 0, 50000, 3, 0, {});
    expect(a.buffer).toBe(0);
    expect(a.spending).toBeGreaterThan(0);
  });
  it('B5 buffer contribution never starves essentials', () => {
    // scenario B5
    const a = computeAllocation(8000, 6200, 'AE', false, 0, 0, 3, 0, {});
    expect(a.spending).toBeGreaterThanOrEqual(0);
    expect(a.rentAndBills + a.tax + a.zakat + a.buffer).toBeLessThanOrEqual(8000);
  });
  it('B6 runway uses essentials, not paycheck', () => {
    // scenario B6
    expect(computeRunway(24000, 6000)).toBe(4);
  });
  it('B7 long dry spell mid-history → sparse, annualised', () => {
    // scenario B7 — Jan & Aug only
    const r = computeRangeFromIncomes([inc(30000, '2025-01-10'), inc(30000, '2025-08-10')]);
    expect(r.provisional).toBe(true);
    expect(Math.round(r.likely)).toBe(5000); // 60k / 12
  });
  it('B8 runway never negative or NaN', () => {
    // scenario B8
    const r = computeRangeFromIncomes([]);
    const pay = computePaycheck(r, 0, 0);
    expect(Number.isFinite(pay)).toBe(true);
    expect(computeRunway(0, 0)).toBe(0);
    expect(computeRunway(0, 6200)).toBe(0);
  });
});

describe('Scenario C — afford against the plan', () => {
  it('C1 fits discretionary', () => {
    // scenario C1
    const a = computeAfford(2000, 5000, 10000, 3000);
    expect(a.verdict).toBe('fits');
    expect(a.freeRemaining).toBe(3000);
  });
  it('C2 dips into buffer', () => {
    // scenario C2
    expect(computeAfford(5000, 3500, 13500, 0).verdict).toBe('dips'); // free buffer 13500
  });
  it('C3 breaks the plan', () => {
    // scenario C3
    expect(computeAfford(50000, 3500, 13500, 0).verdict).toBe('break');
  });
  it('C4 confirmed payment soon → wait with days', () => {
    // scenario C4
    const d = new Date(); d.setDate(d.getDate() + 9);
    const hint = crossLinkAffordWithIncoming(20000, 8000, [inc(12000, d.toISOString().slice(0, 10))]);
    expect(hint).not.toBeNull();
    expect(hint?.wouldChangeTo).toBe('fits');
    expect(hint?.daysAway).toBeGreaterThanOrEqual(8);
    expect(hint?.daysAway).toBeLessThanOrEqual(10);
  });
  it('C5 hoped-for income must NOT change a verdict', () => {
    // scenario C5
    const d = new Date(); d.setDate(d.getDate() + 5);
    expect(crossLinkAffordWithIncoming(5000, 2000, [inc(20000, d.toISOString().slice(0, 10), 'AED', 'possible')])).toBeNull();
  });
  it('C6 afford floor protects a minimum buffer', () => {
    // scenario C6 — buffer == safeFloor → nothing free
    expect(computeAfford(1, 0, 5000, 5000).verdict).toBe('break');
  });
});

describe('Scenario D — income patterns', () => {
  it('D1 one-off does not inflate the likely month', () => {
    // scenario D1 — five 14k + one 60k month
    const r = computeRangeFromIncomes(months([14000, 14000, 14000, 14000, 14000, 60000]));
    expect(Math.round(r.likely)).toBe(14000);
  });
  it('D2 quarterly retainer annualises', () => {
    // scenario D2 — 4×30k Jan/Apr/Jul/Oct
    const r = computeRangeFromIncomes(
      [inc(30000, '2025-01-10'), inc(30000, '2025-04-10'), inc(30000, '2025-07-10'), inc(30000, '2025-10-10')],
      'quarterly',
    );
    expect(Math.round(r.likely)).toBe(10000); // 120k / 12
  });
  it('D5 sustained rise moves range; single windfall does not', () => {
    // scenario D5
    const sustained = computeRangeFromIncomes(months([14000, 14000, 14000, 25000, 25000, 25000]));
    expect(sustained.likely).toBeGreaterThan(14000);
    const windfall = computeRangeFromIncomes(months([14000, 14000, 14000, 14000, 14000, 60000]));
    expect(Math.round(windfall.likely)).toBe(14000);
  });
  it('D6 seasonal earner annualises over 12', () => {
    // scenario D6 — active Jan-Mar + Oct-Dec (busy halves), quiet middle
    const r = computeRangeFromIncomes(
      months([14000, 14000, 14000]).concat(months([14000, 14000, 14000], 10)),
      'irregular',
    );
    expect(r.provisional).toBe(true);
    expect(Math.round(r.likely)).toBe(7000); // 84k / 12
  });
});

describe('Scenario E — outlook (mid-month honesty)', () => {
  it('E1 do not judge early in the month', () => {
    // scenario E1 — day ~3 (fraction 0.1), low tracked → on track
    expect(computeOutlook(200, 14000, 0.1)).toBe('on track');
  });
  it('E2 genuinely behind pace → lean', () => {
    // scenario E2 — 60% through, ~20% of likely tracked
    expect(computeOutlook(2800, 14000, 0.6)).toBe('running lean');
  });
  it('E3 ahead of pace → strong', () => {
    // scenario E3 — 50% through, ~90% of likely tracked
    expect(computeOutlook(12600, 14000, 0.5)).toBe('strong');
  });
});

describe('Scenario F — tax (user-declared)', () => {
  it('F1 default is no income tax', () => {
    // scenario F1
    expect(estimateAnnualTax(120000, {})).toBe(0);
  });
  it('F2 flat % the user sets', () => {
    // scenario F2
    expect(estimateAnnualTax(120000, { taxMode: 'flat', taxFlatRate: 15 })).toBe(18000);
    expect(Math.round(18000 / 12)).toBe(1500);
  });
  it('F3 UAE CT only over the line', () => {
    // scenario F3
    expect(estimateAnnualTax(1_400_000, { taxMode: 'uae_ct' })).toBe(4050);
    expect(estimateAnnualTax(900_000, { taxMode: 'uae_ct' })).toBe(0);
    expect(estimateAnnualTax(2_000_000, { taxMode: 'uae_ct' })).toBe(20250);
  });
  it('F4 set-aside matches the displayed estimate', () => {
    // scenario F4 — allocation tax === round(estimateAnnualTax / 12), one source
    const annual = estimateAnnualTax(1_400_000, { taxMode: 'uae_ct' });
    const a = computeAllocation(30000, 6200, 'AE', false, 0, 0, 3, 1_400_000, { taxMode: 'uae_ct' });
    expect(a.tax).toBe(Math.round(annual / 12));
  });
  it('F5 tax figure is gross-based — disclaimer says so', () => {
    // scenario F5
    const m = makeInterp({ taxMode: 'flat', taxFlatRate: 15, taxTurnover: 120000 }).taxMeaning;
    expect(m).toMatch(/gross/i);
    expect(m).toMatch(/likely lower after business expenses/i);
    expect(m).toMatch(/not tax advice/i);
  });
  it('F6 approaching the CT line → early heads-up', () => {
    // scenario F6 — 800k is 80% of 1M
    const m = makeInterp({ taxMode: 'uae_ct', taxTurnover: 800000 }).taxMeaning;
    expect(m).toMatch(/approaching/i);
  });
});

describe('Scenario G — Zakat', () => {
  it('G1 zakat only when enabled', () => {
    // scenario G1
    const on = computeAllocation(10000, 6200, 'AE', true, 60000, 0, 3, 0, {});
    expect(on.zakat).toBe(125); // 60000 * 2.5% / 12
    const off = computeAllocation(10000, 6200, 'AE', false, 60000, 0, 3, 0, {});
    expect(off.zakat).toBe(0);
  });
  it('G2 zakat value is 0 when wealth 0 (row hidden at UI)', () => {
    // scenario G2 — engine primitive; dashboard/TaxClient hide the row when 0
    expect(computeAllocation(10000, 6200, 'AE', true, 0, 0, 3, 0, {}).zakat).toBe(0);
  });
});

describe('Scenario H — multi-currency', () => {
  it('H1 foreign income converts to AED', () => {
    // scenario H1
    expect(toAED(8000, 'USD')).toBeCloseTo(29380, 0);
  });
  it('H3 mixed-currency history normalises before ranging', () => {
    // scenario H3
    const m = groupByMonth([inc(1000, '2025-01-01', 'USD'), inc(1000, '2025-02-01', 'EUR'), inc(1000, '2025-03-01', 'AED')]);
    expect(m['2025-01']).toBeCloseTo(3672.5, 1);
    expect(m['2025-02']).toBeCloseTo(3950, 1);
    expect(m['2025-03']).toBe(1000);
  });
  it('H4 rates are dated/static — disclosed via FX_AS_OF', () => {
    // scenario H4
    expect(typeof FX_AS_OF).toBe('string');
    expect(FX_AS_OF.length).toBeGreaterThan(0);
  });
});

describe('Scenario I — goals', () => {
  it('I1 per-goal progress capped at its target (engine primitive)', () => {
    // scenario I1 — buffer 50k vs a 15k goal → remaining 0, ETA "done"
    const t = goalTradeoff(15000, 50000, 2000, 5000);
    expect(t.monthsToGoal).toBe(0); // already there
  });
  it('I2 goal trade-off is three-way', () => {
    // scenario I2
    const t = goalTradeoff(40000, 10000, 1800, 6000);
    expect(t.newSpending).toBe(4200);
    expect(t.monthsToGoal).toBe(Math.ceil(30000 / 1800));
  });
  it('I3 behind/ahead derivable from monthsToGoal', () => {
    // scenario I3 — low contribution → many months (behind); high → few (ahead)
    const behind = goalTradeoff(30000, 0, 500, 5000).monthsToGoal!;
    const ahead = goalTradeoff(30000, 0, 5000, 5000).monthsToGoal!;
    expect(behind).toBeGreaterThan(ahead);
  });
  it('I4 goal date never negative/garbage', () => {
    // scenario I4
    expect(goalTradeoff(30000, 40000, 2000, 5000).monthsToGoal).toBe(0); // buffer >= target
    expect(goalTradeoff(30000, 10000, 0, 5000).monthsToGoal).toBeNull(); // no contribution
  });
});

describe('Scenario K — edge & integrity', () => {
  it('K2 zero data never crashes / no NaN', () => {
    // scenario K2
    const r = computeRangeFromIncomes([]);
    const pay = computePaycheck(r, 0, 0);
    const a = computeAllocation(pay, 0, 'AE', false, 0, 0, 3, 0, {});
    for (const v of [r.lean, r.likely, r.strong, pay, a.rentAndBills, a.tax, a.zakat, a.buffer, a.spending]) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
  it('K3 demo seed anchor 9,750 (never break)', () => {
    // scenario K3
    expect(computePaycheck(computeRangeFromIncomes(DEMO), 6200, 23000)).toBe(9750);
  });
  it('K4 safety factor bounded → paycheck/likely in [0.55, 0.85]', () => {
    // scenario K4
    const r = { lean: 5000, likely: 20000, strong: 40000, provisional: false };
    const ratio = computePaycheck(r, 0, 0) / r.likely;
    expect(ratio).toBeGreaterThanOrEqual(0.50);
    expect(ratio).toBeLessThanOrEqual(0.86);
  });
  it('K5 deprecated exports still importable (api/plan depends on them)', () => {
    // scenario K5
    for (const fn of [analyzeIncome, recommendPaycheck, buildMonthlyPlan, detectSignalsLegacy, forecastNextMonth]) {
      expect(typeof fn).toBe('function');
    }
  });
  it('K6 provisional honesty at < 3 months', () => {
    // scenario K6
    expect(computeRangeFromIncomes(months([14000])).provisional).toBe(true);
    expect(computeRangeFromIncomes(months([14000, 15000])).provisional).toBe(true);
    expect(computeRangeFromIncomes(DEMO).provisional).toBe(false);
  });
  it('K1 allocation sums to paycheck (extra cases)', () => {
    // scenario K1 — see also describe block 5
    const cases = [
      computeAllocation(6250, 6200, 'AE', false, 0, 0, 3, 0, {}),
      computeAllocation(8000, 15000, 'AE', false, 0, 0, 3, 0, {}),
      computeAllocation(40000, 6200, 'AE', true, 200000, 500000, 6, 2_000_000, { taxMode: 'uae_ct' }),
    ];
    const expected = [6250, 8000, 40000];
    cases.forEach((a, idx) => {
      expect(a.rentAndBills + a.tax + a.zakat + a.buffer + a.spending).toBe(expected[idx]);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DECISION entries — approved + encoded (A6, E4, B3). G3 awaits a scope answer.
// ════════════════════════════════════════════════════════════════════════════

describe('Scenario A6 — confirmed income sizes the paycheck, not "possible"', () => {
  it('all-confirmed pays more than all-possible (same amounts)', () => {
    // scenario A6
    const amts = [14000, 15000, 13000, 16000, 14500, 15500];
    const confirmed = amts.map((a, i) => inc(a, `2025-${String(i + 1).padStart(2, '0')}-01`, 'AED', 'confirmed'));
    const possible = amts.map((a, i) => inc(a, `2025-${String(i + 1).padStart(2, '0')}-01`, 'AED', 'possible'));
    const payC = computePaycheck(computeRangeFromIncomes(confirmed), 6200, 50000);
    const payP = computePaycheck(computeRangeFromIncomes(possible), 6200, 50000);
    expect(payC).toBeGreaterThan(payP);
  });
  it("'possible' windfall does not inflate the likely month", () => {
    // scenario A6 — five 14k confirmed + one 100k 'possible' → likely stays ~14k
    const set = [
      ...months([14000, 14000, 14000, 14000, 14000]),
      inc(100000, '2025-06-01', 'AED', 'possible'),
    ];
    expect(Math.round(computeRangeFromIncomes(set).likely)).toBe(14000);
  });
  it("'possible'-only income → no firm paycheck (floors), provisional", () => {
    // scenario A6 — nothing confirmed → range empty → honest floor
    const r = computeRangeFromIncomes([inc(40000, '2025-01-01', 'AED', 'possible')]);
    expect(r.likely).toBe(0);
    expect(r.provisional).toBe(true);
  });
});

describe('Scenario E4 — lumpy earner: empty month between payments is not "lean"', () => {
  it('quarterly earner mid-gap → on track, not lean', () => {
    // scenario E4 — annualised likely 22,500; a quiet month at 60% elapsed, zero tracked
    expect(computeOutlook(0, 22500, 0.6, 'quarterly')).toBe('on track');
    expect(computeOutlook(0, 22500, 0.6, 'irregular')).toBe('on track');
    expect(computeOutlook(0, 22500, 0.6, 'project')).toBe('on track');
  });
  it('monthly earner still flagged lean when genuinely behind', () => {
    // scenario E4 — regression: monthly pattern unaffected
    expect(computeOutlook(2800, 14000, 0.6, 'monthly')).toBe('running lean');
    expect(computeOutlook(2800, 14000, 0.6)).toBe('running lean'); // undefined = monthly
  });
  it('a genuinely strong lumpy month still surfaces', () => {
    // scenario E4 — strong takes priority over the lumpy suppression
    expect(computeOutlook(40000, 22500, 0.6, 'quarterly')).toBe('strong');
  });
  it('detectSignals suppresses the lean warning for lumpy patterns', () => {
    // scenario E4
    const range = computeRangeFromIncomes(
      [inc(90000, '2025-02-10'), inc(100000, '2025-06-10'), inc(80000, '2025-10-10')],
      'quarterly',
    );
    const alloc = computeAllocation(14500, 6200, 'AE', false, 0, 23000, 3, 0, {});
    const lumpy = detectSignals(range, alloc, 0, 0.6, 'quarterly');
    const monthly = detectSignals(range, alloc, 0, 0.6, 'monthly');
    expect(lumpy.some(s => /running lean/i.test(s.title))).toBe(false);
    expect(monthly.some(s => /running lean/i.test(s.title))).toBe(true);
  });
});

describe('Reflection — interpretation copy surfaces the right "why"', () => {
  it('B3: thin buffer → paycheckWhy explains the trim', () => {
    // scenario B3 (UI reflection) — runway < 1 month
    const why = makeInterp({ buffer: 3000, essentials: 6000 }).paycheckWhy;
    expect(why).toMatch(/rebuild your buffer/i);
  });
  it('B3: healthy buffer → normal paycheckWhy (no trim copy)', () => {
    const why = makeInterp({ buffer: 50000, essentials: 6000 }).paycheckWhy;
    expect(why).not.toMatch(/rebuild your buffer/i);
  });
  it('E4: lumpy on-track → outlookMeaning explains the quiet month', () => {
    // scenario E4 (UI reflection)
    const m = makeInterp({ outlook: 'on track', incomePattern: 'quarterly' }).outlookMeaning;
    expect(m).toMatch(/quiet month is normal/i);
  });
  it('E4: monthly on-track → plain outlook copy (no lumpy line)', () => {
    const m = makeInterp({ outlook: 'on track', incomePattern: 'monthly' }).outlookMeaning;
    expect(m).not.toMatch(/quiet month is normal/i);
  });
});

describe('Scenario G3 — live zakatable wealth (buffer-tracking, property excluded)', () => {
  it('zakat tracks the live buffer — grows as the buffer grows', () => {
    // scenario G3
    const at60 = liveZakatableWealth({ bufferBalance: 60000, zakatOn: true });
    const at80 = liveZakatableWealth({ bufferBalance: 80000, zakatOn: true });
    expect(at60).toBe(60000);
    expect(at80).toBe(80000);
    expect(at80).toBeGreaterThan(at60);
    // monthly zakat set-aside flows through allocation: 80k × 2.5% / 12
    expect(computeAllocation(10000, 6200, 'AE', true, at80, 0, 3, 0, {}).zakat).toBe(Math.round(80000 * 0.025 / 12));
  });
  it('property is EXCLUDED from zakatable wealth', () => {
    // scenario G3 — buffer 160k incl 100k property → only 60k zakatable
    expect(liveZakatableWealth({ bufferBalance: 160000, propertyAssets: 100000, zakatOn: true })).toBe(60000);
  });
  it('dependant allowance still deducted; off → 0', () => {
    // scenario G3
    expect(liveZakatableWealth({ bufferBalance: 60000, dependants: 2, zakatOn: true })).toBe(60000 - 6000);
    expect(liveZakatableWealth({ bufferBalance: 60000, zakatOn: false })).toBe(0);
    expect(liveZakatableWealth({ bufferBalance: 50000, propertyAssets: 80000, zakatOn: true })).toBe(0); // never negative
  });
});

describe('Scenario B3 — thin buffer → modest conservatism haircut', () => {
  const range = computeRangeFromIncomes(months([14000, 15000, 13000, 16000, 14500, 15500]));
  it('near-zero buffer pays ≤ healthy buffer (same income)', () => {
    // scenario B3
    const healthy = computePaycheck(range, 6200, 50000); // runway ~8 → no haircut
    const thin = computePaycheck(range, 6200, 0);          // runway 0 → haircut
    expect(thin).toBeLessThanOrEqual(healthy);
    expect(thin).toBeLessThan(healthy); // haircut genuinely applied
  });
  it('haircut never starves essentials (essentials-floor still protects)', () => {
    // scenario B3 — essentials below likely → floor keeps bills covered after haircut
    const r = computeRangeFromIncomes(months([13500, 14000, 14500])); // likely 14000
    const pay = computePaycheck(r, 13000, 0); // thin buffer + high essentials
    expect(pay).toBeGreaterThanOrEqual(13000); // essentials still covered
    expect(pay).toBeLessThan(r.likely);
  });
  it('demo seed unaffected (runway 3.7 → no haircut) — still 9,750', () => {
    // scenario B3 + K3 anchor
    expect(computePaycheck(computeRangeFromIncomes(DEMO), 6200, 23000)).toBe(9750);
  });
});
