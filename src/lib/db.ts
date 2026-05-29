import { getSupabase } from "./supabase"

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
  }
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.regionCode !== undefined) update.region_code = data.regionCode
  if (data.incomeType !== undefined) update.income_type = data.incomeType
  if (data.isMuslim !== undefined) update.is_muslim = data.isMuslim
  if (data.monthlyExpenses !== undefined) update.monthly_expenses = data.monthlyExpenses
  if (data.savingsBalance !== undefined) update.savings_balance = data.savingsBalance
  if (data.onboardingComplete !== undefined) update.onboarding_complete = data.onboardingComplete

  const { data: row, error } = await getSupabase()
    .from("keel_users")
    .update(update)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function addIncomeEntry(data: {
  userId: string
  amount: number
  source: string
  note: string | null
  date: string
}) {
  const { data: row, error } = await getSupabase()
    .from("keel_income_entries")
    .insert({
      user_id: data.userId,
      amount: data.amount,
      source: data.source,
      note: data.note,
      date: data.date,
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
