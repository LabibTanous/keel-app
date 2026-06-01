import { getSupabase } from "./supabase"
import type { UserProfile as EngineUserProfile, IncomeEntry as EngineIncomeEntry } from "./engine"

// ─── Row → Engine mappers ────────────────────────────────────────────────────

export function rowToUserProfile(row: Record<string, unknown>): EngineUserProfile {
  return {
    region: (row.region_code as string) ?? 'AE',
    monthlyEssentials: Number(row.monthly_expenses ?? 0),
    currentSavings: Number(row.savings_balance ?? 0),
    payZakat: (row.is_muslim as boolean) ?? false,
    goalName: (row.goal_name as string) ?? undefined,
    goalTarget: row.goal_target != null ? Number(row.goal_target) : undefined,
    goalCurrent: row.goal_current != null ? Number(row.goal_current) : undefined,
    goalMonthly: row.goal_monthly != null ? Number(row.goal_monthly) : undefined,
  };
}

export function rowToIncomeEntry(row: Record<string, unknown>): EngineIncomeEntry {
  return {
    amount: Number(row.amount),
    date: row.date as string,
    source: (row.source as string) ?? undefined,
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(data: {
  id: string
  email: string
  name: string | null
  image: string | null
}) {
  const { data: row, error } = await getSupabase()
    .from("keel_users")
    .upsert(
      { id: data.id, email: data.email, name: data.name, image: data.image, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select()
    .single()
  if (error) throw error
  return row
}

export async function getUser(id: string) {
  const { data, error } = await getSupabase()
    .from("keel_users")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateUserProfile(
  id: string,
  data: {
    regionCode?: string
    incomeType?: string
    isMuslim?: boolean
    monthlyExpenses?: number
    savingsBalance?: number
    onboardingComplete?: boolean
    paycheckAmount?: number
  }
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.regionCode !== undefined) update.region_code = data.regionCode
  if (data.incomeType !== undefined) update.income_type = data.incomeType
  if (data.isMuslim !== undefined) update.is_muslim = data.isMuslim
  if (data.monthlyExpenses !== undefined) update.monthly_expenses = data.monthlyExpenses
  if (data.savingsBalance !== undefined) update.savings_balance = data.savingsBalance
  if (data.onboardingComplete !== undefined) update.onboarding_complete = data.onboardingComplete
  if (data.paycheckAmount !== undefined) update.paycheck_amount = data.paycheckAmount

  const { data: row, error } = await getSupabase()
    .from("keel_users")
    .update(update)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function getOrSetPaycheck(userId: string, amount?: number): Promise<number | null> {
  if (amount !== undefined) {
    await getSupabase()
      .from("keel_users")
      .update({ paycheck_amount: amount, updated_at: new Date().toISOString() })
      .eq("id", userId)
    return amount
  }
  const { data, error } = await getSupabase()
    .from("keel_users")
    .select("paycheck_amount")
    .eq("id", userId)
    .maybeSingle()
  if (error) throw error
  return data?.paycheck_amount != null ? Number(data.paycheck_amount) : null
}

export async function updateGoal(
  userId: string,
  goalData: { goalName?: string; goalTarget?: number; goalCurrent?: number; goalMonthly?: number }
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (goalData.goalName !== undefined) update.goal_name = goalData.goalName
  if (goalData.goalTarget !== undefined) update.goal_target = goalData.goalTarget
  if (goalData.goalCurrent !== undefined) update.goal_current = goalData.goalCurrent
  if (goalData.goalMonthly !== undefined) update.goal_monthly = goalData.goalMonthly

  const { data: row, error } = await getSupabase()
    .from("keel_users")
    .update(update)
    .eq("id", userId)
    .select()
    .single()
  if (error) throw error
  return row
}

// ─── Income entries ───────────────────────────────────────────────────────────

export async function addIncomeEntry(data: {
  userId: string
  amount: number
  source: string
  note: string | null
  date: string
  currency?: string
}) {
  const { data: row, error } = await getSupabase()
    .from("keel_income_entries")
    .insert({
      user_id: data.userId,
      amount: data.amount,
      source: data.source,
      note: data.note,
      date: data.date,
      currency: data.currency ?? 'AED',
    })
    .select()
    .single()
  if (error) throw error
  return row
}

export async function getIncomeEntries(userId: string, limit = 100) {
  const { data, error } = await getSupabase()
    .from("keel_income_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function deleteIncomeEntry(id: string, userId: string) {
  const { error } = await getSupabase()
    .from("keel_income_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
  if (error) throw error
}

// ─── Reserve / buffer ─────────────────────────────────────────────────────────

export async function getReserveBalance(userId: string): Promise<number> {
  const { data, error } = await getSupabase()
    .from("keel_users")
    .select("reserve_balance")
    .eq("id", userId)
    .maybeSingle()
  if (error) throw error
  return Number(data?.reserve_balance ?? 0)
}

export async function updateReserveBalance(userId: string, amount: number) {
  const { error } = await getSupabase()
    .from("keel_users")
    .update({ reserve_balance: amount, updated_at: new Date().toISOString() })
    .eq("id", userId)
  if (error) throw error
}

// ─── iOS Shortcut log token ───────────────────────────────────────────────────

export async function getOrCreateLogToken(userId: string): Promise<string> {
  const { data, error } = await getSupabase()
    .from("keel_users")
    .select("log_token")
    .eq("id", userId)
    .single()
  if (error) throw error
  if (data?.log_token) return data.log_token
  const token = crypto.randomUUID()
  await getSupabase()
    .from("keel_users")
    .update({ log_token: token })
    .eq("id", userId)
  return token
}
