import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUser, getIncomeEntries, rowToUserProfile, rowToIncomeEntry } from '@/lib/db';
import { getTaxProfile } from '@/lib/tax-profiles';
import {
  analyzeIncome,
  recommendPaycheck,
  buildMonthlyPlan,
  detectSignals,
  forecastNextMonth,
} from '@/lib/engine';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const [userRow, incomeRows] = await Promise.all([
    getUser(userId),
    getIncomeEntries(userId),
  ]);

  if (!userRow) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const profile = rowToUserProfile(userRow as Record<string, unknown>);
  const entries = (incomeRows as Record<string, unknown>[]).map(rowToIncomeEntry);
  const tax = getTaxProfile(profile.region);

  const stats = analyzeIncome(entries, 6);
  const recommendation = recommendPaycheck(stats, profile, profile.currentSavings);
  const paycheck = (userRow as Record<string, unknown>).paycheck_amount != null
    ? Number((userRow as Record<string, unknown>).paycheck_amount)
    : recommendation.amount;
  const plan = buildMonthlyPlan(stats, profile, tax, paycheck);

  // Current month income: sum entries from this calendar month
  const nowPrefix = new Date().toISOString().slice(0, 7);
  const currentMonthIncome = entries
    .filter(e => e.date.startsWith(nowPrefix))
    .reduce((s, e) => s + e.amount, 0);

  const signals = detectSignals(stats, plan, currentMonthIncome, profile);
  const forecast = forecastNextMonth(stats);

  return NextResponse.json({ stats, recommendation, plan, signals, forecast, paycheck, tax });
}
