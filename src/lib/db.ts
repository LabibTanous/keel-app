import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL environment variable is not set")
  return neon(url)
}

export async function upsertUser(data: {
  id: string
  email: string
  name: string | null
  image: string | null
}) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO users (id, email, name, image)
    VALUES (${data.id}, ${data.email}, ${data.name}, ${data.image})
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          name  = EXCLUDED.name,
          image = EXCLUDED.image,
          updated_at = NOW()
    RETURNING *
  `
  return rows[0]
}

export async function getUser(id: string) {
  const sql = getSql()
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`
  return rows[0] ?? null
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
  const sql = getSql()
  const rows = await sql`
    UPDATE users
    SET
      region_code         = COALESCE(${data.regionCode ?? null}, region_code),
      income_type         = COALESCE(${data.incomeType ?? null}, income_type),
      is_muslim           = COALESCE(${data.isMuslim ?? null}, is_muslim),
      monthly_expenses    = COALESCE(${data.monthlyExpenses ?? null}, monthly_expenses),
      savings_balance     = COALESCE(${data.savingsBalance ?? null}, savings_balance),
      onboarding_complete = COALESCE(${data.onboardingComplete ?? null}, onboarding_complete),
      updated_at          = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function addIncomeEntry(data: {
  userId: string
  amount: number
  source: string
  note: string | null
  date: string
}) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO income_entries (user_id, amount, source, note, date)
    VALUES (${data.userId}, ${data.amount}, ${data.source}, ${data.note}, ${data.date})
    RETURNING *
  `
  return rows[0]
}

export async function getIncomeEntries(userId: string, limit = 100) {
  const sql = getSql()
  return sql`
    SELECT * FROM income_entries
    WHERE user_id = ${userId}
    ORDER BY date DESC, created_at DESC
    LIMIT ${limit}
  `
}

export async function deleteIncomeEntry(id: string, userId: string) {
  const sql = getSql()
  await sql`DELETE FROM income_entries WHERE id = ${id} AND user_id = ${userId}`
}

export async function getReserveBalance(userId: string): Promise<number> {
  const sql = getSql()
  const rows = await sql`SELECT reserve_balance FROM users WHERE id = ${userId} LIMIT 1`
  return Number(rows[0]?.reserve_balance ?? 0)
}

export async function updateReserveBalance(userId: string, amount: number) {
  const sql = getSql()
  await sql`
    UPDATE users SET reserve_balance = ${amount}, updated_at = NOW()
    WHERE id = ${userId}
  `
}
