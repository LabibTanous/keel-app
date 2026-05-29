import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUser, getIncomeEntries, getOrCreateLogToken } from "@/lib/db"
import DashboardClient from "./DashboardClient"
import { rollingAverage, currentMonthTotal, runwayMonths, incomeMode, safeBudget, groupByMonth } from "@/lib/finance"
import { calculateReserve, TAX_PROFILES } from "@/lib/tax-profiles"
import { generateAdvice } from "@/lib/advice"
import type { IncomeEntry } from "@/types"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const [rawUser, entries, logToken] = await Promise.all([
    getUser(session.user.id),
    getIncomeEntries(session.user.id),
    getOrCreateLogToken(session.user.id),
  ])

  if (!rawUser) redirect("/")

  const user = rawUser as {
    id: string
    name: string | null
    email: string
    image: string | null
    region_code: string | null
    income_type: string | null
    is_muslim: boolean | null
    monthly_expenses: number | string | null
    savings_balance: number | string | null
    onboarding_complete: boolean | null
  }

  if (!user.onboarding_complete) redirect("/onboarding")

  const typedEntries = entries as unknown as IncomeEntry[]
  const regionCode = user.region_code ?? "AE"

  const avg = rollingAverage(typedEntries, 6)
  const currentMonth = currentMonthTotal(typedEntries)
  const { reservePercent, reserveAmount: rawReserve } = calculateReserve(
    avg, regionCode, user.is_muslim ?? false
  )
  const reserveBalance = rawReserve * 6
  const runway = runwayMonths(
    Number(user.savings_balance ?? 0),
    Number(user.monthly_expenses ?? 1)
  )
  const mode = incomeMode(currentMonth, avg)
  const safe = safeBudget(avg, reservePercent)

  const monthlyChart = Object.entries(groupByMonth(typedEntries))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }))

  // Source breakdown — top income sources
  const sourceMap: Record<string, number> = {}
  for (const e of typedEntries) {
    sourceMap[e.source] = (sourceMap[e.source] ?? 0) + Number(e.amount)
  }
  const sourceBreakdown = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([source, amount]) => ({ source, amount }))

  // Generate advice
  const profile = TAX_PROFILES[regionCode]
  const advice = generateAdvice({
    runwayMonths: runway,
    rollingAverage: avg,
    currentMonthIncome: currentMonth,
    reservePercent,
    reserveBalance,
    monthlyExpenses: Number(user.monthly_expenses ?? 0),
    savingsBalance: Number(user.savings_balance ?? 0),
    incomeEntryCount: typedEntries.length,
    incomeType: user.income_type ?? "freelancer",
    isMuslim: user.is_muslim ?? false,
    hasZakat: profile?.hasZakat ?? false,
  })

  return (
    <DashboardClient
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        regionCode,
        incomeType: user.income_type ?? "freelancer",
        isMuslim: user.is_muslim ?? false,
        monthlyExpenses: Number(user.monthly_expenses ?? 0),
        savingsBalance: Number(user.savings_balance ?? 0),
      }}
      dashboardData={{
        currentMonthIncome: currentMonth,
        rollingAverage: avg,
        safeBudget: safe,
        reservePercent,
        reserveBalance,
        runwayMonths: runway,
        mode,
        recentEntries: typedEntries.slice(0, 10),
        monthlyChart,
        sourceBreakdown,
        advice,
      }}
      logToken={logToken}
    />
  )
}
