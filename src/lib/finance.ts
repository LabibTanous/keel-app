import type { IncomeEntry } from "@/types"

export function rollingAverage(entries: IncomeEntry[], months = 6): number {
  if (entries.length === 0) return 0
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const recent = sorted.filter((e) => new Date(e.date) >= cutoff)
  if (recent.length === 0) return 0
  const total = recent.reduce((sum, e) => sum + e.amount, 0)
  return total / months
}

export function currentMonthTotal(entries: IncomeEntry[]): number {
  const now = new Date()
  return entries
    .filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, e) => sum + e.amount, 0)
}

export function runwayMonths(
  savingsBalance: number,
  monthlyExpenses: number
): number {
  if (monthlyExpenses <= 0) return 999
  return savingsBalance / monthlyExpenses
}

export function incomeMode(
  currentMonth: number,
  average: number
): "lean" | "normal" | "flush" {
  if (average === 0) return "normal"
  const ratio = currentMonth / average
  if (ratio < 0.7) return "lean"
  if (ratio > 1.3) return "flush"
  return "normal"
}

export function safeBudget(average: number, reservePercent: number): number {
  return average * (1 - reservePercent / 100)
}

export function groupByMonth(entries: IncomeEntry[]): Record<string, number> {
  return entries.reduce(
    (acc, e) => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      acc[key] = (acc[key] ?? 0) + e.amount
      return acc
    },
    {} as Record<string, number>
  )
}

export function formatCurrency(
  amount: number,
  symbol: string,
  currency: string
): string {
  const n = amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  if (symbol === currency) return `${symbol} ${n}`
  return `${symbol}${n}`
}

export function canIAffordThis(
  cost: number,
  savingsBalance: number,
  monthlyExpenses: number,
  reserveBalance: number
): {
  verdict: "yes" | "maybe" | "no"
  reason: string
  runwayAfter: number
} {
  const available = savingsBalance - reserveBalance
  const runwayAfter = (available - cost) / Math.max(monthlyExpenses, 1)

  if (available < cost) {
    return {
      verdict: "no",
      reason: "Not enough in your available balance (excluding tax reserve).",
      runwayAfter: 0,
    }
  }
  if (runwayAfter < 1.5) {
    return {
      verdict: "maybe",
      reason: "You can technically afford it, but it would leave less than 1.5 months runway.",
      runwayAfter,
    }
  }
  return {
    verdict: "yes",
    reason: `You can afford this and still have ${runwayAfter.toFixed(1)} months of runway.`,
    runwayAfter,
  }
}
