import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUser, getIncomeEntries } from "@/lib/db"
import DashboardClient from "./DashboardClient"
import { rollingAverage, currentMonthTotal, runwayMonths, incomeMode, safeBudget, groupByMonth } from "@/lib/finance"
import { calculateReserve } from "@/lib/tax-profiles"
import type { IncomeEntry } from "@/types"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const [rawUser, entries] = await Promise.all([
    getUser(session.user.id),
    getIncomeEntries(session.user.id),
  ])

  if (!rawUser) redirect("/")

  // Cast DB row to typed shape
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

  const avg = rollingAverage(typedEntries, 6)
  const currentMonth = currentMonthTotal(typedEntries)
  const { reservePercent, reserveAmount: rawReserve } = calculateReserve(
    avg,
    user.region_code ?? "US",
    user.is_muslim ?? false
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

  return (
    <DashboardClient
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        regionCode: user.region_code ?? "US",
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
      }}
    />
  )
}
