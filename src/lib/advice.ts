export interface Advice {
  id: string
  type: "warning" | "tip" | "info" | "success"
  title: string
  body: string
  action?: string
}

interface AdviceInput {
  runwayMonths: number
  rollingAverage: number
  currentMonthIncome: number
  reservePercent: number
  reserveBalance: number
  monthlyExpenses: number
  savingsBalance: number
  incomeEntryCount: number
  incomeType: string
  isMuslim: boolean
  hasZakat: boolean
}

export function generateAdvice(d: AdviceInput): Advice[] {
  const advice: Advice[] = []

  // Runway warnings
  if (d.runwayMonths < 1) {
    advice.push({
      id: "runway-critical",
      type: "warning",
      title: "Critical — runway under 1 month",
      body: "Your savings won't cover next month's expenses. Prioritise any paid work and pause non-essential spending immediately.",
    })
  } else if (d.runwayMonths < 2) {
    advice.push({
      id: "runway-low",
      type: "warning",
      title: "Low runway — act now",
      body: `${d.runwayMonths.toFixed(1)} months of runway is uncomfortably thin. Aim for 3+ months. Can you invoice a client early or reduce expenses this month?`,
    })
  } else if (d.runwayMonths >= 6) {
    advice.push({
      id: "runway-great",
      type: "success",
      title: "Strong cushion",
      body: `${d.runwayMonths.toFixed(0)} months of runway. Consider putting the excess in a high-yield savings account instead of letting it sit idle.`,
    })
  }

  // Lean month advice
  if (d.rollingAverage > 0 && d.currentMonthIncome < d.rollingAverage * 0.5) {
    advice.push({
      id: "lean-month",
      type: "warning",
      title: "Lean month — 50% below your average",
      body: "You're well below your rolling average. Protect the reserve jar — don't dip into it for lifestyle spending. This is what it's there for.",
    })
  }

  // No income logged
  if (d.incomeEntryCount === 0) {
    advice.push({
      id: "no-income",
      type: "info",
      title: "Log your income to unlock insights",
      body: "Add your first payment and Keel starts tracking your rolling average, safe budget, and tax reserve automatically.",
      action: "log-income",
    })
  }

  // Flush month — save the surplus
  if (d.rollingAverage > 0 && d.currentMonthIncome > d.rollingAverage * 1.5) {
    advice.push({
      id: "flush-save",
      type: "tip",
      title: "Flush month — save the surplus",
      body: `You earned ${Math.round((d.currentMonthIncome / d.rollingAverage - 1) * 100)}% above average. Move the excess to savings before lifestyle creep absorbs it.`,
    })
  }

  // Tax reserve low
  if (d.rollingAverage > 0 && d.reserveBalance < d.rollingAverage * d.reservePercent / 100 * 3) {
    advice.push({
      id: "reserve-low",
      type: "tip",
      title: "Build your tax reserve",
      body: `Aim to have 3–6 months of tax reserve set aside. Your reserve jar currently covers less than 3 months at your rate.`,
    })
  }

  // Zakat reminder
  if (d.isMuslim && d.hasZakat && d.savingsBalance > 0) {
    advice.push({
      id: "zakat",
      type: "info",
      title: "Zakat check",
      body: "Zakat is due if your savings have been above nisab for a full lunar year. Your reserve jar includes 2.5% automatically — verify your total holdings annually.",
    })
  }

  // High monthly expenses vs income
  if (d.rollingAverage > 0 && d.monthlyExpenses > d.rollingAverage * 0.8) {
    advice.push({
      id: "expenses-high",
      type: "warning",
      title: "Expenses are 80%+ of average income",
      body: "Your fixed expenses leave very little margin. One lean month and you're at risk. Look for one expense to cut or defer.",
    })
  }

  // Irregular income tip
  if (d.incomeType === "gig_worker" || d.incomeType === "freelancer") {
    if (d.incomeEntryCount > 0 && d.incomeEntryCount < 5) {
      advice.push({
        id: "log-regularly",
        type: "tip",
        title: "Log income as you receive it",
        body: "The more consistent you are, the more accurate your rolling average gets. Log every transfer, invoice paid, or gig payout — even small ones.",
      })
    }
  }

  // Positive milestone
  if (d.runwayMonths >= 3 && d.reserveBalance > 0 && d.rollingAverage > 0) {
    advice.push({
      id: "on-track",
      type: "success",
      title: "You're on track",
      body: "Runway healthy, reserve building, budget set. Keep logging income consistently to improve the accuracy of your rolling average.",
    })
  }

  // Return top 4, prioritise warnings first
  const sorted = [...advice].sort((a, b) => {
    const order = { warning: 0, tip: 1, info: 2, success: 3 }
    return order[a.type] - order[b.type]
  })

  return sorted.slice(0, 4)
}
