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
    const rawLikely = values[Math.floor(n / 2)];
    // Single data point: spread over 3-month runway. Two points: 1.5× runway.
    const stretchFactor = n === 1 ? 3 : 1.5;
    const likely = rawLikely / stretchFactor;
    return {
      lean: minVal * 0.7 / stretchFactor,
      likely,
      strong: maxVal * 1.3 / stretchFactor,
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
 * Recommend a steady paycheck scaled by income volatility.
 * Wider lean→strong spread = more volatile = more conservative payout.
 * Safety factor: steady (~0.85 of likely) down to choppy (~0.55 of likely).
 */
export function computePaycheck(
  range: IncomeRange,
  essentials: number,
  bufferBalance: number,
): number {
  if (range.likely <= 0) {
    return roundTo250(essentials > 0 ? essentials : 250);
  }

  // Volatility = how wide the lean→strong band is relative to the likely month.
  const spread = Math.max(0, range.strong - range.lean);
  const volatility = spread / range.likely;

  // Safety factor: steady income pays ~0.85 of likely; very choppy ~0.55.
  const safetyFactor = Math.min(0.85, Math.max(0.55, 0.85 - volatility * 0.35));

  let p = roundTo250(range.likely * safetyFactor);

  // Never pay at or above a likely month — buffer contribution must be positive.
  if (p >= range.likely) p = roundTo250(range.likely - 250);

  // Floor at essentials ONLY if essentials fit under a likely month.
  // If essentials > likely, return the honest lower number; screen surfaces the state.
  if (p < essentials && essentials < range.likely) {
    p = roundTo250(essentials);
    if (p >= range.likely) p = roundTo250(range.likely - 250);
  }

  if (p <= 0) p = roundTo250(essentials > 0 ? essentials : 250);
  return p;
}

/**
 * Compute allocation buckets. Must sum to paycheck.
 * taxTurnover: YTD revenue used to check VAT threshold proximity.
 * When near/over VAT threshold, tax set-aside rises to pre-fund the obligation.
 */
export function computeAllocation(
  paycheck: number,
  essentials: number,
  region: string,
  zakatOn: boolean,
  zakatableWealth: number,
  bufferBalance: number,
  targetMonths: number,
  taxTurnover = 0,
): Allocation {
  const tax_region = TAX_REGIONS[region];

  // Tax: estimate monthly CT set-aside on annualised paycheck if above threshold
  let tax = 0;
  if (tax_region) {
    const annualised = paycheck * 12;
    if (annualised > tax_region.ctThreshold) {
      tax = Math.round((annualised - tax_region.ctThreshold) * tax_region.ctRate / 12);
    }
    // VAT reserve: when approaching or over VAT registration line, set aside a monthly
    // buffer (vatRate × paycheck) so the obligation never arrives as a surprise.
    // This actively reshapes the allocation and lowers free spending — by design.
    if (statusOf(tax_region.vatThreshold, taxTurnover) !== 'clear') {
      tax += Math.round(paycheck * tax_region.vatRate);
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

/**
 * Outlook based on tracked-so-far vs the share of a likely month that "should"
 * have arrived by this point. fractionElapsed is 0..1 (day / days-in-month).
 */
export function computeOutlook(
  trackedThisMonth: number,
  likelyMonth: number,
  fractionElapsed: number,
): Outlook {
  if (likelyMonth <= 0) return 'on track';
  const expectedByNow = likelyMonth * Math.min(1, Math.max(0, fractionElapsed));
  if (expectedByNow <= 0) return 'on track'; // very start of month — don't judge yet
  const ratio = trackedThisMonth / expectedByNow;
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
      reason: `Comes out of your discretionary budget — after goals and reserves are already set aside. You'd have ${Math.round(spendingLeft - cost).toLocaleString('en-US')} AED left and your plan is untouched.`,
      freeRemaining: spendingLeft - cost,
    };
  }

  if (cost <= spendingLeft + freeFromBuffer) {
    return {
      verdict: 'dips',
      label: 'Possible — dips into buffer',
      reason: `It's ${Math.round(cost - spendingLeft).toLocaleString('en-US')} AED over your discretionary budget, so it'd come partly from your buffer. Doable, but it slows your runway.`,
      freeRemaining: spendingLeft - cost,
    };
  }

  return {
    verdict: 'break',
    label: 'Would break the plan',
    reason: `This exceeds your discretionary budget and safe buffer combined. Worth waiting for a strong month or saving toward it.`,
    freeRemaining: spendingLeft - cost,
  };
}

// ── Cross-link functions ──────────────────────────────────────────────────────

export interface IncomingPaymentHint {
  amount: number;
  currency: string;
  daysAway: number;
  wouldChangeTo: 'fits' | null;
}

/**
 * Checks if a confirmed income landing within 14 days would change a dips/break verdict to fits.
 */
export function crossLinkAffordWithIncoming(
  cost: number,
  spendingLeft: number,
  incomes: IncomeItem[],
): IncomingPaymentHint | null {
  const todayStr = new Date().toISOString().slice(0, 10);
  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + 14);
  const horizonStr = horizonDate.toISOString().slice(0, 10);

  const upcoming = incomes
    .filter(i => i.confidence === 'confirmed' && i.date >= todayStr && i.date <= horizonStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const DAY_MS = 1000 * 60 * 60 * 24;

  for (const inc of upcoming) {
    const aed = toAED(inc.amount, inc.currency);
    if (spendingLeft + aed >= cost) {
      const incDate = new Date(inc.date);
      const today = new Date(todayStr);
      const daysAway = Math.round((incDate.getTime() - today.getTime()) / DAY_MS);
      return { amount: inc.amount, currency: inc.currency, daysAway, wouldChangeTo: 'fits' };
    }
  }

  return null;
}

export interface GoalTradeoff {
  requiredMonthly: number;
  newSpending: number;
  monthsToGoal: number | null;
  feasible: boolean;
}

/**
 * Computes how a monthly goal contribution affects spending and time to goal.
 */
export function goalTradeoff(
  target: number,
  currentBuffer: number,
  contribution: number,
  currentSpending: number,
): GoalTradeoff {
  const remaining = Math.max(0, target - currentBuffer);
  const monthsToGoal = contribution > 0 ? Math.ceil(remaining / contribution) : null;
  const newSpending = Math.max(0, currentSpending - contribution);
  const feasible = newSpending >= 0;
  return { requiredMonthly: contribution, newSpending, monthsToGoal, feasible };
}

/**
 * Computes volatility trend across recent vs prior months.
 */
export function volatilityTrend(
  incomes: IncomeItem[],
): { recentVolatility: number; priorVolatility: number; trend: 'choppier' | 'steadier' | 'stable'; message: string } {
  const monthly = groupByMonth(incomes);
  const keys = Object.keys(monthly).sort();

  if (keys.length < 4) {
    return { recentVolatility: 0, priorVolatility: 0, trend: 'stable', message: '' };
  }

  function cv(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, x) => s + x, 0) / values.length;
    if (mean <= 0) return 0;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  const recentValues = keys.slice(-3).map(k => monthly[k]);
  const priorValues = keys.slice(-6, -3).map(k => monthly[k]);

  const recentCV = cv(recentValues);
  const priorCV = cv(priorValues);
  const delta = recentCV - priorCV;

  let trend: 'choppier' | 'steadier' | 'stable';
  let message: string;

  if (delta > 0.1) {
    trend = 'choppier';
    message = "Your income has been swingier lately — that's why your safe pay is more cautious now.";
  } else if (delta < -0.1) {
    trend = 'steadier';
    message = "Your income has been more consistent lately — your safe pay could grow with it.";
  } else {
    trend = 'stable';
    message = '';
  }

  return { recentVolatility: recentCV, priorVolatility: priorCV, trend, message };
}

// ── Interpret ─────────────────────────────────────────────────────────────────

export interface Interpretations {
  paycheckWhy: string;
  runwayMeaning: string;
  outlookMeaning: string;
  taxMeaning: string;
  spendingMeaning: string;
  volatilityMeaning: string;
  topInsight: string;
  topInsightLevel: 'warning' | 'tip' | 'success';
}

export function interpret(
  planData: {
    range: IncomeRange;
    paycheck: number;
    allocation: Allocation;
    runway: number;
    outlook: string;
    trackedThisMonth: number;
    taxTurnover: number;
  },
  profileData: {
    essentials: number;
    targetMonths: number;
    region: string;
  },
  incomes: IncomeItem[],
): Interpretations {
  const { range, paycheck, allocation, runway, outlook, taxTurnover } = planData;
  const { essentials, region } = profileData;

  // paycheckWhy
  const paycheckWhy = range.provisional
    ? 'An early estimate — log more months of income and this sharpens.'
    : `Set below your likely month (AED ${Math.round(range.likely).toLocaleString('en-US')}) so fat months refill the buffer that carries the lean ones.`;

  // runwayMeaning
  let runwayMeaning: string;
  if (runway < 1.5) {
    const days = Math.round(runway * 30);
    runwayMeaning = `If work stopped, you've got about ${days} days. Building this cushion matters more than anything else right now.`;
  } else if (runway >= 3) {
    runwayMeaning = "You've got real breathing room — enough to ride out a dry spell or say no to bad work.";
  } else {
    const months = Math.round(runway * 10) / 10;
    runwayMeaning = `About ${months} months of essentials covered — a decent buffer, with room to grow.`;
  }

  // outlookMeaning
  let outlookMeaning: string;
  if (outlook === 'running lean') {
    outlookMeaning = "Income is light so far — but your buffer keeps the plan whole. Nothing needs to change yet.";
  } else if (outlook === 'strong') {
    outlookMeaning = "You're ahead this month. A good moment to bank the extra rather than let it drift into spending.";
  } else {
    outlookMeaning = "On track so far. Keep an eye on what's coming in.";
  }

  // taxMeaning
  let taxMeaning = '';
  const taxRegion = TAX_REGIONS[region];
  if (taxRegion) {
    const vatPct = (taxTurnover / taxRegion.vatThreshold) * 100;
    if (vatPct >= 100) {
      taxMeaning = "You've crossed the VAT registration line — action needed.";
    } else if (vatPct >= 70) {
      taxMeaning = `You're approaching the VAT threshold (${Math.round(vatPct)}% there) — nothing due yet, just so it doesn't surprise you.`;
    }
  }

  // spendingMeaning
  let spendingMeaning = '';
  if (allocation.spending <= 0) {
    spendingMeaning = "After essentials and tax set-aside, there's little left to spend freely — worth looking at fixed costs.";
  } else if (allocation.spending < essentials * 0.3) {
    spendingMeaning = "Free spending is tight this month.";
  }

  // volatilityMeaning
  const volatilityMeaning = volatilityTrend(incomes).message;

  // topInsight + topInsightLevel
  let topInsight = '';
  let topInsightLevel: 'warning' | 'tip' | 'success' = 'success';

  const volTrend = volatilityTrend(incomes).trend;

  if (runway < 1.5) {
    topInsight = runwayMeaning;
    topInsightLevel = 'warning';
  } else if (allocation.spending <= 0) {
    topInsight = spendingMeaning;
    topInsightLevel = 'warning';
  } else if (taxMeaning.includes('crossed')) {
    topInsight = taxMeaning;
    topInsightLevel = 'warning';
  } else if (volTrend === 'choppier') {
    topInsight = volatilityMeaning;
    topInsightLevel = 'tip';
  } else if (taxMeaning) {
    topInsight = taxMeaning;
    topInsightLevel = 'tip';
  } else if (outlook === 'strong') {
    topInsight = outlookMeaning;
    topInsightLevel = 'tip';
  } else if (runway >= 3) {
    topInsight = runwayMeaning;
    topInsightLevel = 'success';
  } else {
    topInsight = outlookMeaning;
    topInsightLevel = 'success';
  }

  return {
    paycheckWhy,
    runwayMeaning,
    outlookMeaning,
    taxMeaning,
    spendingMeaning,
    volatilityMeaning,
    topInsight,
    topInsightLevel,
  };
}

/** Detect signals from the current plan state. */
export function detectSignals(
  range: IncomeRange,
  allocation: Allocation,
  trackedThisMonth: number,
  fractionElapsed: number,
): Signal[] {
  const out: Signal[] = [];

  if (range.provisional) {
    out.push({
      kind: 'tip',
      title: 'Plan is provisional',
      detail: 'Log at least 3 months of income for a reliable range. Current estimates are widened to be safe.',
    });
  }

  const outlook = computeOutlook(trackedThisMonth, range.likely, fractionElapsed);
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
