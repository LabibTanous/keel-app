import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUser, getIncomeEntries, getOrCreateLogToken, rowToUserProfile, rowToIncomeEntry } from "@/lib/db"
import { getTaxProfile } from "@/lib/tax-profiles"
import {
  analyzeIncome,
  recommendPaycheck,
  buildMonthlyPlan,
  detectSignals,
  forecastNextMonth,
} from "@/lib/engine"
import DashboardShell from "./DashboardShell"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const userId = session.user.id
  const [rawUser, incomeRows, logToken] = await Promise.all([
    getUser(userId),
    getIncomeEntries(userId),
    getOrCreateLogToken(userId),
  ])

  if (!rawUser) redirect("/")

  const user = rawUser as Record<string, unknown>
  if (!user.onboarding_complete) redirect("/onboarding")

  const profile = rowToUserProfile(user)
  const entries = (incomeRows as Record<string, unknown>[]).map(rowToIncomeEntry)
  const tax = getTaxProfile(profile.region)

  const stats = analyzeIncome(entries, 6)
  const recommendation = recommendPaycheck(stats, profile, profile.currentSavings)
  const paycheck = user.paycheck_amount != null
    ? Number(user.paycheck_amount)
    : recommendation.amount

  const plan = buildMonthlyPlan(stats, profile, tax, paycheck)

  const nowPrefix = new Date().toISOString().slice(0, 7)
  const currentMonthIncome = entries
    .filter(e => e.date.startsWith(nowPrefix))
    .reduce((s, e) => s + e.amount, 0)

  const signals = detectSignals(stats, plan, currentMonthIncome, profile)
  const forecast = forecastNextMonth(stats)

  // Recent entries for back-view (typed for client)
  const recentEntries = (incomeRows as Record<string, unknown>[]).slice(0, 15).map(r => ({
    id: r.id as string,
    source: (r.source as string) ?? "Income",
    amount: Number(r.amount),
    date: r.date as string,
  }))

  return (
    <DashboardShell
      user={{
        name: (user.name as string) ?? null,
        email: user.email as string,
        image: (user.image as string) ?? null,
        regionCode: profile.region,
        isMuslim: profile.payZakat ?? false,
        monthlyExpenses: profile.monthlyEssentials,
        savingsBalance: profile.currentSavings,
      }}
      plan={{ stats, recommendation, plan, signals, forecast, paycheck }}
      tax={tax}
      recentEntries={recentEntries}
      logToken={logToken}
    />
  )
}
