export interface UserProfile {
  id: string
  email: string
  name: string | null
  image: string | null
  regionCode: string
  incomeType: IncomeType
  isMuslim: boolean
  monthlyExpenses: number
  savingsBalance: number
  onboardingComplete: boolean
  createdAt: Date
  updatedAt: Date
}

export type IncomeType =
  | "freelancer"
  | "gig_worker"
  | "creator"
  | "consultant"
  | "business_owner"
  | "mixed"

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  freelancer: "Freelancer",
  gig_worker: "Gig Worker",
  creator: "Content Creator",
  consultant: "Consultant",
  business_owner: "Business Owner",
  mixed: "Multiple Income Streams",
}

export interface IncomeEntry {
  id: string
  userId: string
  amount: number
  source: string
  note: string | null
  date: string
  createdAt: Date
}

export type IncomeModeType = "lean" | "normal" | "flush"

export interface DashboardData {
  currentMonthIncome: number
  rollingAverage: number
  safeBudget: number
  reservePercent: number
  reserveBalance: number
  runwayMonths: number
  mode: IncomeModeType
  recentEntries: IncomeEntry[]
  monthlyChart: { month: string; amount: number }[]
}
