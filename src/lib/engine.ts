/**
 * engine.ts — Keel's pure, deterministic plan engine.
 * NO DB, no network, no side effects. NO demo/sample data.
 * Financial constants (FX, tax brackets, thresholds) are real facts, dated where stale-able.
 */

// ── FX ──────────────────────────────────────────────────────────────────────

/** Static FX rates to AED. Stale-able — refresh periodically. */
export const FX_AS_OF = '2026-01';
export const CCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 3.6725,
  EUR: 3.95,
  GBP: 4.62,
  SAR: 0.979,
  EGP: 0.075,   // ≈ AED per EGP (for converting AED turnover → EGP for tax brackets)
  JOD: 5.18,    // ≈ AED per JOD
};

export function toAED(amount: number, currency: string): number {
  return amount * (CCY_RATES[currency] ?? 1);
}
/** Convert an AED amount into another currency (for local tax-bracket math). */
export function fromAED(amountAED: number, currency: string): number {
  return amountAED / (CCY_RATES[currency] ?? 1);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface IncomeItem {
  amount: number;
  currency: string;
  date: string;          // ISO 8601
  confidence: 'confirmed' | 'likely' | 'possible';
}

export interface Profile {
  region: string;          // 'AE' | 'SA' | 'QA' | 'KW' | 'EG' | 'JO'
  currency: string;
  essentials: number;      // monthly fixed costs, AED
  bufferBalance: number;   // AED
  targetMonths: number;
  zakatOn: boolean;
  zakatableWealth?: number; // legacy onboarding snapshot (AED) — store re-derives live (G3)
  propertyAssets?: number;  // illiquid property value (AED) — EXCLUDED from zakatable wealth (G3)
  incomes: IncomeItem[];
  paycheckOverride?: number;
  incomePattern?: 'monthly' | 'quarterly' | 'project' | 'irregular';
  employmentType?: 'sole_trader' | 'company' | 'employed_freelance' | 'employed';
  multiCurrency?: boolean;
  annualRevenue?: number;  // self-reported annual revenue, AED
  dependants?: number;
  // ── User-defined tax (region no longer auto-taxes) ──────────────────────────
  taxMode?: 'none' | 'flat' | 'uae_ct'; // default 'none'
  taxFlatRate?: number;     // percent, e.g. 15 (flat mode)
  taxLocationLabel?: string; // display only — where they pay tax; not used for math
}

export interface IncomeRange {
  lean: number;
  likely: number;
  strong: number;
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

// ── TAX REGIONS (no VAT — personal income tax model) ─────────────────────────
// GCC: no personal income tax. UAE: Corporate Tax on business profit only.
// Egypt/Jordan: progressive personal income tax on net professional income.

export type TaxKind = 'none' | 'uae_ct' | 'progressive';

export const TAX_REGIONS: Record<string, {
  kind: TaxKind;
  currency: string;
  label: string;
}> = {
  AE: { kind: 'uae_ct',      currency: 'AED', label: 'UAE' },
  SA: { kind: 'none',        currency: 'SAR', label: 'Saudi Arabia' },
  QA: { kind: 'none',        currency: 'QAR', label: 'Qatar' },
  KW: { kind: 'none',        currency: 'KWD', label: 'Kuwait' },
  EG: { kind: 'progressive', currency: 'EGP', label: 'Egypt' },
  JO: { kind: 'progressive', currency: 'JOD', label: 'Jordan' },
};

// UAE Corporate Tax — 9% on profit above AED 375k. Turnover→profit margin proxy.
export const ASSUMED_PROFIT_MARGIN = 0.30;
export const UAE_CT_FREE_THRESHOLD = 375_000; // AED profit at 0%
export const UAE_CT_RATE = 0.09;
export const UAE_CT_REGISTRATION_TURNOVER = 1_000_000; // AED turnover → must register

// Progressive bracket type: marginal rate applied to the slice up to `upTo` (local currency).
export interface Bracket { upTo: number; rate: number; }

// ── DORMANT progressive brackets (Egypt/Jordan 2025) ─────────────────────────
// Region no longer auto-applies these. Kept for a future explicit "progressive"
// tax mode / region preset. NOT fired by estimateAnnualTax today. Do not delete.
export const EGYPT_EXEMPTION_EGP = 20_000;
export const EGYPT_BRACKETS: Bracket[] = [
  { upTo: 40_000, rate: 0 },
  { upTo: 55_000, rate: 0.10 },
  { upTo: 70_000, rate: 0.15 },
  { upTo: 200_000, rate: 0.20 },
  { upTo: 400_000, rate: 0.225 },
  { upTo: 1_200_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.275 },
];
export const JORDAN_EXEMPTION_JOD = 9_000;
export const JORDAN_BRACKETS: Bracket[] = [
  { upTo: 5_000, rate: 0.05 },
  { upTo: 10_000, rate: 0.10 },
  { upTo: 15_000, rate: 0.15 },
  { upTo: 20_000, rate: 0.20 },
  { upTo: 1_000_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.30 },
];
export const JORDAN_NATIONAL_CONTRIB_THRESHOLD_JOD = 200_000;
export const JORDAN_NATIONAL_CONTRIB_RATE = 0.01;

/** Apply progressive brackets to a taxable amount (in the bracket currency).
 *  DORMANT helper — exported, retained for a future explicit progressive mode. */
export function applyBrackets(taxable: number, brackets: Bracket[]): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (taxable <= lower) break;
    const sliceTop = Math.min(taxable, b.upTo);
    tax += (sliceTop - lower) * b.rate;
    lower = b.upTo;
  }
  return tax;
}

/** Profile fields that drive the tax estimate (region no longer auto-taxes). */
export type TaxConfig = Pick<Profile, 'taxMode' | 'taxFlatRate'>;

/**
 * Estimated ANNUAL tax in AED, driven by what the USER told us (not region).
 * SINGLE SOURCE OF TRUTH — used by computeAllocation (÷12) and the Tax screen.
 * Rough estimate only, never advice.
 *   'none'   → 0 (honest default — most Gulf freelancers owe no personal income tax)
 *   'flat'   → turnover × (taxFlatRate / 100)
 *   'uae_ct' → 9% on profit above AED 375k (profit = turnover × 0.30), only once
 *              turnover ≥ AED 1M (registration line)
 */
export function estimateAnnualTax(turnoverAED: number, tax: TaxConfig): number {
  if (turnoverAED <= 0) return 0;
  const mode = tax.taxMode ?? 'none';

  if (mode === 'flat') {
    const rate = Math.max(0, tax.taxFlatRate ?? 0);
    return turnoverAED * (rate / 100);
  }

  if (mode === 'uae_ct') {
    if (turnoverAED < UAE_CT_REGISTRATION_TURNOVER) return 0;
    const profit = turnoverAED * ASSUMED_PROFIT_MARGIN;
    return Math.max(0, profit - UAE_CT_FREE_THRESHOLD) * UAE_CT_RATE;
  }

  return 0; // 'none'
}

/** Does this region require any tax set-aside at all? (false for GCC non-UAE) */
export function regionHasTax(region: string): boolean {
  const r = TAX_REGIONS[region];
  if (!r) return false;
  return r.kind !== 'none';
}

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

function monthSpan(firstKey: string, lastKey: string): number {
  const [fy, fm] = firstKey.split('-').map(Number);
  const [ly, lm] = lastKey.split('-').map(Number);
  return Math.max(1, (ly * 12 + lm) - (fy * 12 + fm) + 1);
}

// ── Core computations ────────────────────────────────────────────────────────

export function groupByMonth(incomes: IncomeItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const inc of incomes) {
    const key = inc.date.slice(0, 7);
    const aed = toAED(inc.amount, inc.currency);
    map[key] = (map[key] ?? 0) + aed;
  }
  return map;
}

export function computeRange(monthlyTotals: Record<string, number>): IncomeRange {
  const values = Object.values(monthlyTotals).sort((a, b) => a - b);
  const n = values.length;

  if (n === 0) return { lean: 0, likely: 0, strong: 0, provisional: true };

  if (n < 3) {
    const minVal = values[0];
    const maxVal = values[n - 1];
    const rawLikely = values[Math.floor(n / 2)];
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
 * Income range honest about lumpy / project-based earners.
 * Lumpy → spread total income across a FULL YEAR (or the observed span if longer),
 * provisional always. Monthly earners delegate to computeRange unchanged.
 *
 * Guard: a recent dense burst (e.g. 3 consecutive active months) is NOT treated as
 * lumpy even if tagged 'project' — only genuinely sparse activity annualises, so a
 * freelancer mid-busy-stretch isn't crushed to a near-zero paycheck.
 */
export function computeRangeFromIncomes(
  incomes: IncomeItem[],
  incomePattern?: string,
): IncomeRange {
  // scenario A6: 'possible' income is speculative — it still shows in Coming, but it
  // must NOT size the safe paycheck. Range is built from confirmed + likely only.
  const ranged = incomes.filter(i => i.confidence !== 'possible');
  const monthly = groupByMonth(ranged);
  const activeKeys = Object.keys(monthly).sort();

  if (activeKeys.length === 0) return { lean: 0, likely: 0, strong: 0, provisional: true };

  const elapsedMonths = monthSpan(activeKeys[0], activeKeys[activeKeys.length - 1]);
  const activeMonths = activeKeys.length;
  const density = activeMonths / elapsedMonths;

  const isMonthly = incomePattern === 'monthly';
  const taggedLumpy = incomePattern === 'project' || incomePattern === 'irregular' || incomePattern === 'quarterly';
  const sparseActivity = elapsedMonths >= 3 && density < 0.6;
  // Too few months to trust as a steady monthly cadence (and not declared monthly).
  // A single AED 150k payment with low bills must NOT be read as ~50k/mo income —
  // one payment is not proof of a monthly wage. Spread it over the year (honest,
  // lower number wins). The user can declare 'monthly' to override, or log more
  // months to sharpen it.
  const tooFewToTrust = activeMonths < 3 && !isMonthly;
  // Recent dense burst: 2–3 CONSECUTIVE active months — a genuine busy stretch, kept
  // on the monthly path so a freelancer mid-busy-stretch isn't crushed. Requires
  // activeMonths >= 2 (a single month is never a "burst").
  const denseRecentBurst = density >= 0.999 && activeMonths >= 2 && activeMonths <= 3;

  if ((taggedLumpy || sparseActivity || tooFewToTrust) && !denseRecentBurst) {
    const total = activeKeys.reduce((s, k) => s + monthly[k], 0);
    const divisor = Math.max(12, elapsedMonths);
    const spreadMonthly = total / divisor;
    return {
      lean: spreadMonthly * 0.7,
      likely: spreadMonthly,
      strong: spreadMonthly * 1.3,
      provisional: true,
    };
  }

  return computeRange(monthly);
}

export function computePaycheck(
  range: IncomeRange,
  essentials: number,
  bufferBalance: number,
): number {
  if (range.likely <= 0) return roundTo250(essentials > 0 ? essentials : 250);

  const spread = Math.max(0, range.strong - range.lean);
  const volatility = spread / range.likely;
  const safetyFactor = Math.min(0.85, Math.max(0.55, 0.85 - volatility * 0.35));

  let p = roundTo250(range.likely * safetyFactor);

  // scenario B3: thin-buffer conservatism. With under a month of runway, a bad month
  // can't be absorbed — trim ~10% so pay leans safer. Applied BEFORE the floors so the
  // essentials-floor still protects bill coverage, and never breaks the demo anchor
  // (demo runway 3.7 → no haircut).
  if (essentials > 0 && bufferBalance / essentials < 1) {
    p = roundTo250(p * 0.9);
  }

  if (p >= range.likely) p = roundTo250(range.likely - 250);

  if (p < essentials && essentials < range.likely) {
    p = roundTo250(essentials);
    if (p >= range.likely) p = roundTo250(range.likely - 250);
  }

  if (p <= 0) p = roundTo250(essentials > 0 ? essentials : 250);
  return p;
}

/**
 * Allocation buckets. Sum to paycheck.
 * Tax = monthly share of estimateAnnualTax() (÷12), driven by the user's tax
 * config (taxMode/taxFlatRate), NOT the region. No VAT. Default mode 'none' → 0.
 * `_region` is retained (positional) for caller compatibility but no longer taxes.
 */
export function computeAllocation(
  paycheck: number,
  essentials: number,
  _region: string,
  zakatOn: boolean,
  zakatableWealth: number,
  bufferBalance: number,
  targetMonths: number,
  taxTurnover = 0,
  taxConfig: TaxConfig = {},
): Allocation {
  const tax = taxTurnover > 0 ? Math.round(estimateAnnualTax(taxTurnover, taxConfig) / 12) : 0;

  const zakat = zakatOn ? Math.round((zakatableWealth * 0.025) / 12) : 0;

  const targetBuffer = essentials * targetMonths;
  const deficit = Math.max(0, targetBuffer - bufferBalance);
  const available = paycheck - essentials - tax - zakat;
  const bufferContrib = available > 0 ? Math.round(Math.min(deficit / targetMonths, available)) : 0;

  const spending = paycheck - essentials - tax - zakat - bufferContrib;

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

  return { rentAndBills: essentials, tax, zakat, buffer: bufferContrib, spending };
}

export function computeRunway(bufferBalance: number, essentials: number): number {
  if (essentials <= 0) return 0;
  return Math.round((bufferBalance / essentials) * 10) / 10;
}

/**
 * scenario G3 — live zakatable wealth, re-derived each compute (not a frozen
 * onboarding snapshot). Tracks the buffer as it grows. EXCLUDES illiquid property;
 * subtracts the dependant allowance. Estimate only — never advice.
 *   zakatable = max(0, bufferBalance − propertyAssets − dependants × 3,000)
 */
export function liveZakatableWealth(
  profile: Pick<Profile, 'bufferBalance' | 'propertyAssets' | 'dependants' | 'zakatOn'>,
): number {
  if (!profile.zakatOn) return 0;
  const property = profile.propertyAssets ?? 0;
  const allowance = (profile.dependants ?? 0) * 3000;
  return Math.max(0, profile.bufferBalance - property - allowance);
}

export function computeOutlook(
  trackedThisMonth: number,
  likelyMonth: number,
  fractionElapsed: number,
  incomePattern?: string,
): Outlook {
  if (likelyMonth <= 0) return 'on track';
  // Don't judge early in the month. Freelancers are paid mid/late month, so a quiet
  // first quarter is normal — crying "running lean" on day 3 is a false alarm.
  if (fractionElapsed < 0.25) return 'on track'; // scenario E1
  const expectedByNow = likelyMonth * Math.min(1, Math.max(0, fractionElapsed));
  if (expectedByNow <= 0) return 'on track';
  const ratio = trackedThisMonth / expectedByNow;
  // scenario E4: lumpy earners (project/irregular/quarterly) get paid in bursts, so a
  // known-empty month between payments is NORMAL — never flag it "running lean". The
  // 'likely' for these is an annualised figure, so monthly proration would false-alarm.
  // A genuinely strong month can still surface.
  const lumpy = incomePattern === 'project' || incomePattern === 'irregular' || incomePattern === 'quarterly';
  if (ratio > 1.3) return 'strong';
  if (lumpy) return 'on track';
  if (ratio < 0.5) return 'running lean';
  return 'on track';
}

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

export function volatilityTrend(
  incomes: IncomeItem[],
): { recentVolatility: number; priorVolatility: number; trend: 'choppier' | 'steadier' | 'stable'; message: string } {
  const monthly = groupByMonth(incomes);
  const keys = Object.keys(monthly).sort();

  if (keys.length < 4) return { recentVolatility: 0, priorVolatility: 0, trend: 'stable', message: '' };

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
    taxMode?: 'none' | 'flat' | 'uae_ct';
    taxFlatRate?: number;
  },
  incomes: IncomeItem[],
): Interpretations {
  const { range, allocation, runway, outlook, taxTurnover } = planData;
  const { essentials, taxMode, taxFlatRate } = profileData;

  const paycheckWhy = range.provisional
    ? 'An early estimate — log more months of income and this sharpens.'
    : `Set below your likely month (AED ${Math.round(range.likely).toLocaleString('en-US')}) so fat months refill the buffer that carries the lean ones.`;

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

  let outlookMeaning: string;
  if (outlook === 'running lean') {
    outlookMeaning = "Income is light so far — but your buffer keeps the plan whole. Nothing needs to change yet.";
  } else if (outlook === 'strong') {
    outlookMeaning = "You're ahead this month. A good moment to bank the extra rather than let it drift into spending.";
  } else {
    outlookMeaning = "On track so far. Keep an eye on what's coming in.";
  }

  // taxMeaning — driven by the user's tax choice, not the region.
  let taxMeaning = '';
  const mode = taxMode ?? 'none';
  if (mode === 'uae_ct') {
    if (taxTurnover >= UAE_CT_REGISTRATION_TURNOVER) {
      taxMeaning = "You've crossed the AED 1M turnover line — Corporate Tax registration applies.";
    } else if (taxTurnover >= UAE_CT_REGISTRATION_TURNOVER * 0.7) {
      taxMeaning = `You're approaching the AED 1M Corporate Tax line (${Math.round((taxTurnover / UAE_CT_REGISTRATION_TURNOVER) * 100)}% there) — nothing due yet, just so it doesn't surprise you.`;
    }
  } else if (mode === 'flat') {
    const annual = estimateAnnualTax(taxTurnover, { taxMode, taxFlatRate });
    if (annual > 0) {
      // Flat estimate is on GROSS income — flag that actual tax is likely lower after
      // deductible business expenses (scenario F5).
      taxMeaning = `Estimated ≈ AED ${Math.round(annual).toLocaleString('en-US')}/yr at the ${taxFlatRate ?? 0}% rate you set, on your gross income — your actual tax is likely lower after business expenses. An estimate, not tax advice.`;
    }
  }
  // mode 'none' → no tax surfaced (honest default).

  let spendingMeaning = '';
  if (allocation.spending <= 0) {
    spendingMeaning = "After essentials and tax set-aside, there's little left to spend freely — worth looking at fixed costs.";
  } else if (allocation.spending < essentials * 0.3) {
    spendingMeaning = "Free spending is tight this month.";
  }

  const volatilityMeaning = volatilityTrend(incomes).message;

  let topInsight = '';
  let topInsightLevel: 'warning' | 'tip' | 'success' = 'success';
  const volTrend = volatilityTrend(incomes).trend;

  if (runway < 1.5) {
    topInsight = runwayMeaning; topInsightLevel = 'warning';
  } else if (allocation.spending <= 0) {
    topInsight = spendingMeaning; topInsightLevel = 'warning';
  } else if (taxMeaning.includes('crossed')) {
    topInsight = taxMeaning; topInsightLevel = 'warning';
  } else if (volTrend === 'choppier') {
    topInsight = volatilityMeaning; topInsightLevel = 'tip';
  } else if (taxMeaning) {
    topInsight = taxMeaning; topInsightLevel = 'tip';
  } else if (outlook === 'strong') {
    topInsight = outlookMeaning; topInsightLevel = 'tip';
  } else if (runway >= 3) {
    topInsight = runwayMeaning; topInsightLevel = 'success';
  } else {
    topInsight = outlookMeaning; topInsightLevel = 'success';
  }

  return {
    paycheckWhy, runwayMeaning, outlookMeaning, taxMeaning,
    spendingMeaning, volatilityMeaning, topInsight, topInsightLevel,
  };
}

export function detectSignals(
  range: IncomeRange,
  allocation: Allocation,
  trackedThisMonth: number,
  fractionElapsed: number,
  incomePattern?: string,
): Signal[] {
  const out: Signal[] = [];

  if (range.provisional) {
    out.push({ kind: 'tip', title: 'Plan is provisional', detail: 'Log at least 3 months of income for a reliable range. Current estimates are widened to be safe.' });
  }

  const outlook = computeOutlook(trackedThisMonth, range.likely, fractionElapsed, incomePattern);
  if (outlook === 'running lean') {
    out.push({ kind: 'warning', title: 'Running lean this month', detail: 'Income tracked so far is well below your usual pace. Your paycheck still holds — that\'s what the buffer is for — but ease off non-essentials.' });
  }

  if (allocation.spending < 0) {
    out.push({ kind: 'warning', title: 'Essentials exceed paycheck', detail: 'Your fixed costs are higher than the paycheck your income can safely sustain. Trimming a fixed cost frees real breathing room.' });
  }

  if (outlook === 'strong') {
    out.push({ kind: 'tip', title: 'Strong month — bank it', detail: 'You\'re tracking above your usual pace. A great moment to send extra toward the buffer or a goal.' });
  }

  if (out.length === 0) {
    out.push({ kind: 'success', title: 'You\'re on track', detail: 'Buffer\'s healthy and your plan holds. Nothing to do — let it run.' });
  }

  const rank: Record<Signal['kind'], number> = { warning: 0, tip: 1, success: 2 };
  return out.sort((a, b) => rank[a.kind] - rank[b.kind]).slice(0, 4);
}

/** Generic threshold status, still used by some screens. */
export function statusOf(limit: number, turnover: number): TaxStatus {
  if (turnover >= limit) return 'over';
  if (turnover >= limit * 0.7) return 'near';
  return 'clear';
}

// ── Legacy compatibility shims (kept — still imported by db.ts / api routes) ──

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
  const items: IncomeItem[] = entries.map(e => ({
    amount: e.amount, currency: 'AED', date: e.date, confidence: 'confirmed' as const,
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
    monthlyTotals: Object.entries(monthly).map(([month, total]) => ({ month, total })).sort((a, b) => a.month.localeCompare(b.month)),
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
