export interface IncomeEntry {
  amount: number;
  date: string;
  source?: string;
}

export interface TaxProfile {
  region: string;
  currency: string;
  currencySymbol: string;
  reservePercent: number;
  hasZakat: boolean;
}

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

export interface IncomeStats {
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
}

export interface PaycheckRecommendation {
  amount: number;
  safetyFactor: number;
  confidence: 'low' | 'medium' | 'high';
  coversEssentials: boolean;
  minProjectedBuffer: number;
  rationale: string;
}

export interface Forecast {
  likely: number;
  low: number;
  high: number;
  typicalLow: number;
  typicalHigh: number;
}

export interface PaymentAllocation {
  gross: number;
  tax: number;
  zakat: number;
  available: number;
}

export interface MonthlyPlan {
  paycheck: number;
  forecast: Forecast;
  offTheTop: { tax: number; zakat: number; goal: number };
  paycheckBreakdown: { essentials: number; freeToSpend: number };
  bufferBalance: number;
  runwayMonths: number;
}

export interface AffordResult {
  verdict: 'fits' | 'tight' | 'breaks';
  label: string;
  reason: string;
  freeRemaining: number;
}

export interface Signal {
  kind: 'warning' | 'tip' | 'success';
  title: string;
  detail: string;
}

const round = (n: number) => Math.round(n);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthLabel(key: string): string {
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const m = parseInt(key.slice(5, 7), 10);
  return names[m - 1] ?? key;
}

export function groupByMonth(entries: IncomeEntry[]): { month: string; total: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    const k = monthKey(e.date);
    map.set(k, (map.get(k) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function analyzeIncome(entries: IncomeEntry[], lookbackMonths = 6): IncomeStats {
  const all = groupByMonth(entries);
  const recent = all.slice(-lookbackMonths);
  const totals = recent.map(r => r.total);
  const n = totals.length;
  if (n === 0) {
    return { monthsAnalyzed: 0, monthlyTotals: [], average: 0, median: 0, floor: 0, ceiling: 0, min: 0, max: 0, stdDev: 0, volatility: 0 };
  }
  const sorted = [...totals].sort((a, b) => a - b);
  const average = totals.reduce((s, x) => s + x, 0) / n;
  const variance = totals.reduce((s, x) => s + (x - average) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  return {
    monthsAnalyzed: n,
    monthlyTotals: recent,
    average: round(average),
    median: round(percentile(sorted, 0.5)),
    floor: round(percentile(sorted, 0.25)),
    ceiling: round(percentile(sorted, 0.75)),
    min: sorted[0],
    max: sorted[n - 1],
    stdDev: round(stdDev),
    volatility: average > 0 ? stdDev / average : 0,
  };
}

export function recommendPaycheck(stats: IncomeStats, profile: UserProfile, startingBuffer = 0): PaycheckRecommendation {
  if (stats.monthsAnalyzed === 0) {
    return { amount: 0, safetyFactor: 0, confidence: 'low', coversEssentials: false, minProjectedBuffer: startingBuffer, rationale: 'Not enough income history yet. Log a few payments and Keel will propose a safe paycheck.' };
  }
  const safetyFactor = clamp(0.85 - stats.volatility * 0.35, 0.55, 0.85);
  const amount = roundTo(stats.median * safetyFactor, 250);
  const sim = simulateBuffer(stats.monthlyTotals, amount, startingBuffer);
  const minBuffer = Math.min(...sim.map(s => s.buffer));
  const coversEssentials = amount >= profile.monthlyEssentials;
  let confidence: PaycheckRecommendation['confidence'] = 'low';
  if (stats.monthsAnalyzed >= 6 && stats.volatility < 0.4) confidence = 'high';
  else if (stats.monthsAnalyzed >= 3) confidence = 'medium';
  let rationale = `Based on ${stats.monthsAnalyzed} months, your typical (median) month is ${stats.median.toLocaleString()}. Keel suggests paying yourself ${amount.toLocaleString()} — ${Math.round(safetyFactor * 100)}% of that — so fat months refill the buffer that carries the lean ones.`;
  if (!coversEssentials) {
    rationale += ` ⚠ This is below your stated essentials (${profile.monthlyEssentials.toLocaleString()}). Your income may be too low or too volatile to cover essentials from a steady wage yet.`;
  }
  if (minBuffer < 0) {
    rationale += ` Note: across your history the buffer dips to ${minBuffer.toLocaleString()} at its lowest.`;
  }
  return { amount, safetyFactor, confidence, coversEssentials, minProjectedBuffer: round(minBuffer), rationale };
}

export function simulateBuffer(monthlyTotals: { month: string; total: number }[], paycheck: number, startingBuffer = 0): { month: string; income: number; paycheck: number; buffer: number }[] {
  let bal = startingBuffer;
  return monthlyTotals.map(m => {
    bal += m.total - paycheck;
    return { month: m.month, income: m.total, paycheck, buffer: round(bal) };
  });
}

export function forecastNextMonth(stats: IncomeStats): Forecast {
  return { likely: stats.median, low: stats.min, high: stats.max, typicalLow: stats.floor, typicalHigh: stats.ceiling };
}

export function allocatePayment(amount: number, tax: TaxProfile, payZakat: boolean): PaymentAllocation {
  const taxReserve = round(amount * (tax.reservePercent / 100));
  const zakat = payZakat && tax.hasZakat ? round(amount * 0.025) : 0;
  return { gross: amount, tax: taxReserve, zakat, available: amount - taxReserve - zakat };
}

export function buildMonthlyPlan(stats: IncomeStats, profile: UserProfile, tax: TaxProfile, paycheck: number): MonthlyPlan {
  const forecast = forecastNextMonth(stats);
  const taxReserve = round(forecast.likely * (tax.reservePercent / 100));
  const zakat = profile.payZakat && tax.hasZakat ? round(forecast.likely * 0.025) : 0;
  const goal = profile.goalMonthly ?? 0;
  const essentials = Math.min(profile.monthlyEssentials, paycheck);
  const freeToSpend = Math.max(0, paycheck - essentials);
  return {
    paycheck,
    forecast,
    offTheTop: { tax: taxReserve, zakat, goal },
    paycheckBreakdown: { essentials, freeToSpend },
    bufferBalance: profile.currentSavings,
    runwayMonths: runwayMonths(profile.currentSavings, profile.monthlyEssentials),
  };
}

export function runwayMonths(savings: number, monthlyExpenses: number): number {
  if (monthlyExpenses <= 0) return Infinity;
  return Math.round((savings / monthlyExpenses) * 10) / 10;
}

export function canAfford(cost: number, freeToSpend: number, buffer: number): AffordResult {
  if (cost <= freeToSpend) {
    return { verdict: 'fits', label: 'Fits the plan', reason: `Comes out of this month's free-to-spend. You'd have ${(freeToSpend - cost).toLocaleString()} left and your plan is untouched.`, freeRemaining: freeToSpend - cost };
  }
  if (cost <= freeToSpend + buffer) {
    return { verdict: 'tight', label: 'Possible — dips into buffer', reason: `It's ${(cost - freeToSpend).toLocaleString()} over your free-to-spend, so it'd come from your buffer. Doable, but it slows your goal.`, freeRemaining: freeToSpend - cost };
  }
  return { verdict: 'breaks', label: 'Would break the plan', reason: `This is more than your free-to-spend and buffer can absorb. Worth waiting for a strong month.`, freeRemaining: freeToSpend - cost };
}

export function detectSignals(stats: IncomeStats, plan: MonthlyPlan, currentMonthIncome: number, profile: UserProfile): Signal[] {
  const out: Signal[] = [];
  if (plan.runwayMonths < 1.5) {
    out.push({ kind: 'warning', title: 'Runway is short', detail: `If income stopped, you'd have about ${plan.runwayMonths} months of essentials covered. Building the buffer should come first.` });
  }
  if (currentMonthIncome > 0 && currentMonthIncome < stats.average * 0.5) {
    out.push({ kind: 'warning', title: 'This month is running lean', detail: `You're well below your usual. Your steady paycheck still holds — that's what the buffer is for — but ease off non-essentials.` });
  }
  if (profile.monthlyEssentials > plan.paycheck) {
    out.push({ kind: 'warning', title: 'Fixed costs are high', detail: `Your essentials are larger than the paycheck your income can safely sustain. Trimming a fixed cost frees real breathing room.` });
  }
  if (currentMonthIncome > stats.average * 1.4) {
    out.push({ kind: 'tip', title: 'Strong month — bank it', detail: `You're well above average. A good moment to send extra toward your goal instead of letting it leak into spending.` });
  }
  if (out.length === 0 && plan.runwayMonths >= 3) {
    out.push({ kind: 'success', title: "You're on track", detail: `Buffer's healthy and your plan holds. Nothing to do — let it run.` });
  }
  const rank = { warning: 0, tip: 1, success: 2 } as const;
  return out.sort((a, b) => rank[a.kind] - rank[b.kind]).slice(0, 4);
}
