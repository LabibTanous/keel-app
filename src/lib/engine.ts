/**
 * engine.ts — Keel's pure, deterministic plan engine.
 * NO DB, no network, no side effects. All inputs in; derived values out.
 * Token names and rate map mirror keel-theme.js / ui.jsx (the single sources of truth).
 */

// ── FX ──────────────────────────────────────────────────────────────────────

export const CCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 3.6725,
  EUR: 3.95,
  GBP: 4.62,
  SAR: 0.979,
};

/** Convert any supported currency to AED. */
export function toAED(amount: number, currency: string): number {
  return amount * (CCY_RATES[currency] ?? 1);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface IncomeItem {
  amount: number;
  currency: string;
  date: string;          // ISO 8601 e.g. "2025-06-01"
  confidence: 'confirmed' | 'likely' | 'possible';
}

export interface Profile {
  region: string;          // 'AE' | 'SA' | ...
  currency: string;        // home currency code
  essentials: number;      // monthly fixed costs in home currency
  bufferBalance: number;   // current buffer/savings in home currency
  targetMonths: number;    // target buffer depth (default 3)
  zakatOn: boolean;
  zakatableWealth?: number; // current zakatable wealth (gold, cash, etc.)
  incomes: IncomeItem[];
  paycheckOverride?: number; // user has manually set a paycheck amount
}

export interface IncomeRange {
  lean: number;    // 20th percentile (or min*0.7 if < 3 months)
  likely: number;  // median
  strong: number;  // 80th percentile (or max*1.3 if < 3 months)
  provisional: boolean;
}

export interface Allocation {
  rentAndBills: number;
  tax: number;
  zakat: number;
  buffer: number;
  spending: number;
}

export interface Signal {
  kind: 'warning' | 'tip' | 'success';
  title: string;
  detail: string;
}

export type Outlook = 'running lean' | 'on track' | 'strong';
export type AffordVerdict = 'fits' | 'dips' | 'break';
export type TaxStatus = 'clear' | 'near' | 'over';

export interface AffordResult {
  verdict: AffordVerdict;
  label: string;
  reason: string;
  freeRemaining: number;
}

// ── TAX REGIONS ──────────────────────────────────────────────────────────────

export const TAX_REGIONS: Record<string, {
  vatThreshold: number;
  vatRate: number;
  ctThreshold: number;
  ctRate: number;
  currency: string;
  label: string;
}> = {
  AE: {
    vatThreshold: 375_000,
    vatRate: 0.05,
    ctThreshold: 1_000_000,
    ctRate: 0.09,
    currency: 'AED',
    label: 'UAE',
  },
  SA: {
    vatThreshold: 375_000,
    vatRate: 0.15,
    ctThreshold: Infinity,
    ctRate: 0,
    currency: 'SAR',
    label: 'Saudi Arabia',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

function roundTo250(n: number): number {
  return Math.round(n / 250) * 250;
}

// ── Core computations ────────────────────────────────────────────────────────

/**
 * Group income items by YYYY-MM, converting each to AED first.
 * Returns a record of { 'YYYY-MM': totalAED }.
 */
export function groupByMonth(incomes: IncomeItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const inc of incomes) {
    const key = inc.date.slice(0, 7); // 'YYYY-MM'
    const aed = toAED(inc.amount, inc.currency);
    map[key] = (map[key] ?? 0) + aed;
  }
  return map;
}

/**
 * Compute lean / likely / strong income range from monthly totals.
 * If < 3 months of data, mark provisional and widen the band.
 */
export function computeRange(monthlyTotals: Record<string, number>): IncomeRange {
  const values = Object.values(monthlyTotals).sort((a, b) => a - b);
  const n = values.length;

  if (n === 0) {
    return { lean: 0, likely: 0, strong: 0, provisional: true };
  }

  if (n < 3) {
    const minVal = values[0];
    const maxVal = values[n - 1];
    const likely = values[Math.floor(n / 2)];
    return {
      lean: minVal * 0.7,
      likely,
      strong: maxVal * 1.3,
      provisional: true,
    };
  }

  return {
    lean: percentile(values, 0.2),
    likely: percentile(values, 0.5),
    strong: percentile(values, 0.8),
    provisional: false,
  };
}

/**
 * Recommend a steady paycheck:
 * - <= likely
 * - >= essentials (if possible)
 * - leaves positive buffer contribution
 * - rounded to nearest 250
 */
export function computePaycheck(
  range: IncomeRange,
  essentials: number,
  bufferBalance: number,
): number {
  // Start from likely, step down until buffer contribution is positive
  // Buffer contribution = likely - paycheck > 0 means paycheck < likely
  // We want: paycheck <= likely AND paycheck >= essentials (if feasible)
  const candidate = Math.min(range.likely, range.likely - 1); // just under likely
  // Round down to 250
  let p = roundTo250(Math.floor(candidate / 250) * 250);

  // Ensure positive buffer contribution (paycheck < likely)
  if (p >= range.likely) {
    p = roundTo250(range.likely - 250);
  }

  // Floor at essentials if we have enough room
  if (p < essentials && essentials <= range.likely) {
    p = roundTo250(essentials);
    // Make sure paycheck < likely still
    if (p >= range.likely) {
      p = roundTo250(range.likely - 250);
    }
  }

  // Never go negative
  if (p <= 0) p = roundTo250(essentials > 0 ? essentials : 250);

  return p;
}

/**
 * Compute allocation buckets. Must sum to paycheck.
 */
export function computeAllocation(
  paycheck: number,
  essentials: number,
  region: string,
  zakatOn: boolean,
  zakatableWealth: number,
  bufferBalance: number,
  targetMonths: number,
): Allocation {
  const tax_region = TAX_REGIONS[region];

  // Tax: estimate monthly CT set-aside on annualised paycheck if above threshold
  let tax = 0;
  if (tax_region) {
    const annualised = paycheck * 12;
    if (annualised > tax_region.ctThreshold) {
      tax = Math.round((annualised - tax_region.ctThreshold) * tax_region.ctRate / 12);
    }
  }

  // Zakat: monthly share of annual zakat obligation
  const zakat = zakatOn ? Math.round((zakatableWealth * 0.025) / 12) : 0;

  // Buffer contribution: move toward target
  const targetBuffer = essentials * targetMonths;
  const deficit = Math.max(0, targetBuffer - bufferBalance);
  // Contribute proportionally; don't exceed what's left after essentials+tax+zakat
  const available = paycheck - essentials - tax - zakat;
  const bufferContrib = available > 0 ? Math.round(Math.min(deficit / targetMonths, available)) : 0;

  // Spending = remainder
  const spending = paycheck - essentials - tax - zakat - bufferContrib;

  // Sanity: if spending < 0, reduce buffer contribution
  if (spending < 0) {
    const adjustedBuffer = Math.max(0, bufferContrib + spending);
    return {
      rentAndBills: essentials,
      tax,
      zakat,
      buffer: adjustedBuffer,
      spending: paycheck - essentials - tax - zakat - adjustedBuffer,
    };
  }

  return {
    rentAndBills: essentials,
    tax,
    zakat,
    buffer: bufferContrib,
    spending,
  };
}

/** Runway in months to 1 decimal. */
export function computeRunway(bufferBalance: number, essentials: number): number {
  if (essentials <= 0) return 0;
  return Math.round((bufferBalance / essentials) * 10) / 10;
}

/** Outlook signal based on tracked-this-month vs expected monthly pace. */
export function computeOutlook(trackedThisMonth: number, expectedPace: number): Outlook {
  if (expectedPace <= 0) return 'on track';
  const ratio = trackedThisMonth / expectedPace;
  if (ratio < 0.5) return 'running lean';
  if (ratio > 1.3) return 'strong';
  return 'on track';
}

/**
 * Afford verdict.
 * fits: cost <= spendingLeft
 * dips: cost <= spendingLeft + (bufferBalance - safeFloor)
 * break: otherwise
 */
export function computeAfford(
  cost: number,
  spendingLeft: number,
  bufferBalance: number,
  safeFloor: number,
): AffordResult {
  const freeFromBuffer = Math.max(0, bufferBalance - safeFloor);

  if (cost <= spendingLeft) {
    return {
      verdict: 'fits',
      label: 'Fits the plan',
      reason: `Comes out of this month's free-to-spend. You'd have ${Math.round(spendingLeft - cost).toLocaleString('en-US')} AED left and your plan is untouched.`,
      freeRemaining: spendingLeft - cost,
    };
  }

  if (cost <= spendingLeft + freeFromBuffer) {
    return {
      verdict: 'dips',
      label: 'Possible — dips into buffer',
      reason: `It's ${Math.round(cost - spendingLeft).toLocaleString('en-US')} AED over your free-to-spend, so it'd come partly from your buffer. Doable, but it slows your runway.`,
      freeRemaining: spendingLeft - cost,
    };
  }

  return {
    verdict: 'break',
    label: 'Would break the plan',
    reason: `This exceeds your free-to-spend and safe buffer combined. Worth waiting for a strong month or saving toward it.`,
    freeRemaining: spendingLeft - cost,
  };
}

/** Detect signals from the current plan state. */
export function detectSignals(
  range: IncomeRange,
  allocation: Allocation,
  trackedThisMonth: number,
): Signal[] {
  const out: Signal[] = [];

  if (range.provisional) {
    out.push({
      kind: 'tip',
      title: 'Plan is provisional',
      detail: 'Log at least 3 months of income for a reliable range. Current estimates are widened to be safe.',
    });
  }

  const outlook = computeOutlook(trackedThisMonth, range.likely);
  if (outlook === 'running lean') {
    out.push({
      kind: 'warning',
      title: 'Running lean this month',
      detail: 'Income tracked so far is well below your usual pace. Your paycheck still holds — that\'s what the buffer is for — but ease off non-essentials.',
    });
  }

  if (allocation.spending < 0) {
    out.push({
      kind: 'warning',
      title: 'Essentials exceed paycheck',
      detail: 'Your fixed costs are higher than the paycheck your income can safely sustain. Trimming a fixed cost frees real breathing room.',
    });
  }

  if (outlook === 'strong') {
    out.push({
      kind: 'tip',
      title: 'Strong month — bank it',
      detail: 'You\'re tracking above your usual pace. A great moment to send extra toward the buffer or a goal.',
    });
  }

  if (out.length === 0) {
    out.push({
      kind: 'success',
      title: 'You\'re on track',
      detail: 'Buffer\'s healthy and your plan holds. Nothing to do — let it run.',
    });
  }

  const rank: Record<Signal['kind'], number> = { warning: 0, tip: 1, success: 2 };
  return out.sort((a, b) => rank[a.kind] - rank[b.kind]).slice(0, 4);
}

/** Tax registration status: clear / near / over */
export function statusOf(limit: number, turnover: number): TaxStatus {
  if (turnover >= limit) return 'over';
  if (turnover >= limit * 0.7) return 'near';
  return 'clear';
}

// ── Legacy compatibility shims ────────────────────────────────────────────────
// Kept so existing db.ts / tax-profiles.ts / API routes still compile.

export interface TaxProfile {
  region: string;
  currency: string;
  currencySymbol: string;
  reservePercent: number;
  hasZakat: boolean;
}

/** @deprecated — use Profile instead */
export interface UserProfile {
  region: string;
  monthlyEssentials: number;
  currentSavings: number;
  payZakat?: boolean;
  goalName?: string;
  goalTarget?: number;
  goalCurrent?: number;
  goalMonthly?: number;
}

/** @deprecated — use IncomeItem instead */
export interface IncomeEntry {
  amount: number;
  date: string;
  source?: string;
}

/** @deprecated — use groupByMonth + computeRange instead */
export function analyzeIncome(
  entries: IncomeEntry[],
  _lookbackMonths = 6,
): {
  monthsAnalyzed: number;
  monthlyTotals: { month: string; total: number }[];
  average: number;
  median: number;
  floor: number;
  ceiling: number;
  min: number;
  max: number;
  stdDev: number;
  volatility: number;
} {
  // Convert legacy IncomeEntry to IncomeItem (no currency, assume AED)
  const items: IncomeItem[] = entries.map(e => ({
    amount: e.amount,
    currency: 'AED',
    date: e.date,
    confidence: 'confirmed' as const,
  }));
  const monthly = groupByMonth(items);
  const sorted = Object.values(monthly).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return { monthsAnalyzed: 0, monthlyTotals: [], average: 0, median: 0, floor: 0, ceiling: 0, min: 0, max: 0, stdDev: 0, volatility: 0 };
  }
  const average = sorted.reduce((s, x) => s + x, 0) / n;
  const variance = sorted.reduce((s, x) => s + (x - average) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  function pct(arr: number[], p: number) {
    const idx = (arr.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return arr[lo];
    return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
  }
  return {
    monthsAnalyzed: n,
    monthlyTotals: Object.entries(monthly)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    average: Math.round(average),
    median: Math.round(pct(sorted, 0.5)),
    floor: Math.round(pct(sorted, 0.25)),
    ceiling: Math.round(pct(sorted, 0.75)),
    min: sorted[0],
    max: sorted[n - 1],
    stdDev: Math.round(stdDev),
    volatility: average > 0 ? stdDev / average : 0,
  };
}

/** @deprecated — use computePaycheck instead */
export function recommendPaycheck(
  stats: ReturnType<typeof analyzeIncome>,
  profile: UserProfile,
  startingBuffer = 0,
): { amount: number; safetyFactor: number; confidence: string; coversEssentials: boolean; minProjectedBuffer: number; rationale: string } {
  if (stats.monthsAnalyzed === 0) {
    return { amount: 0, safetyFactor: 0, confidence: 'low', coversEssentials: false, minProjectedBuffer: startingBuffer, rationale: 'Not enough income history.' };
  }
  const safetyFactor = Math.min(0.85, Math.max(0.55, 0.85 - stats.volatility * 0.35));
  const amount = Math.round(stats.median * safetyFactor / 250) * 250;
  return { amount, safetyFactor, confidence: stats.monthsAnalyzed >= 6 ? 'high' : stats.monthsAnalyzed >= 3 ? 'medium' : 'low', coversEssentials: amount >= profile.monthlyEssentials, minProjectedBuffer: startingBuffer, rationale: `Suggested paycheck: ${amount}` };
}

/** @deprecated — use computeAllocation / computeRange / computePaycheck instead */
export function buildMonthlyPlan(
  stats: ReturnType<typeof analyzeIncome>,
  profile: UserProfile,
  tax: TaxProfile,
  paycheck: number,
): {
  paycheck: number;
  forecast: { likely: number; low: number; high: number; typicalLow: number; typicalHigh: number };
  offTheTop: { tax: number; zakat: number; goal: number };
  paycheckBreakdown: { essentials: number; freeToSpend: number };
  bufferBalance: number;
  runwayMonths: number;
} {
  const taxReserve = Math.round(stats.median * (tax.reservePercent / 100));
  const zakat = profile.payZakat && tax.hasZakat ? Math.round(stats.median * 0.025) : 0;
  const goal = profile.goalMonthly ?? 0;
  const essentials = Math.min(profile.monthlyEssentials, paycheck);
  const freeToSpend = Math.max(0, paycheck - essentials);
  return {
    paycheck,
    forecast: { likely: stats.median, low: stats.min, high: stats.max, typicalLow: stats.floor, typicalHigh: stats.ceiling },
    offTheTop: { tax: taxReserve, zakat, goal },
    paycheckBreakdown: { essentials, freeToSpend },
    bufferBalance: profile.currentSavings,
    runwayMonths: profile.monthlyEssentials > 0 ? Math.round((profile.currentSavings / profile.monthlyEssentials) * 10) / 10 : 0,
  };
}

/** @deprecated — use detectSignals (new signature) */
export function detectSignalsLegacy(
  stats: ReturnType<typeof analyzeIncome>,
  plan: ReturnType<typeof buildMonthlyPlan>,
  currentMonthIncome: number,
  profile: UserProfile,
): Signal[] {
  const out: Signal[] = [];
  if (plan.runwayMonths < 1.5) out.push({ kind: 'warning', title: 'Runway is short', detail: `About ${plan.runwayMonths} months of essentials covered.` });
  if (currentMonthIncome > 0 && currentMonthIncome < stats.average * 0.5) out.push({ kind: 'warning', title: 'Running lean', detail: 'Well below your usual pace.' });
  if (profile.monthlyEssentials > plan.paycheck) out.push({ kind: 'warning', title: 'Fixed costs are high', detail: 'Essentials exceed paycheck.' });
  if (currentMonthIncome > stats.average * 1.4) out.push({ kind: 'tip', title: 'Strong month', detail: 'Bank the extra.' });
  if (out.length === 0 && plan.runwayMonths >= 3) out.push({ kind: 'success', title: "You're on track", detail: "Nothing to do — let it run." });
  return out.sort((a, b) => ({ warning: 0, tip: 1, success: 2 }[a.kind] - { warning: 0, tip: 1, success: 2 }[b.kind])).slice(0, 4);
}

/** @deprecated */
export function forecastNextMonth(stats: ReturnType<typeof analyzeIncome>) {
  return { likely: stats.median, low: stats.min, high: stats.max, typicalLow: stats.floor, typicalHigh: stats.ceiling };
}
