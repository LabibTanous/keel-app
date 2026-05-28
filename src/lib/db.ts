import { Pool } from "pg"

// Parse NUMERIC columns as JS numbers, not strings
import pg from "pg"
pg.types.setTypeParser(pg.types.builtins.NUMERIC, parseFloat)
pg.types.setTypeParser(pg.types.builtins.INT8, parseInt)

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set")
    _pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    })
  }
  return _pool
}

async function query<T = Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T[]> {
  const client = await getPool().connect()
  try {
    const res = await client.query(text, values)
    return res.rows as T[]
  } finally {
    client.release()
  }
}

export async function upsertUser(data: {
  id: string
  email: string
  name: string | null
  image: string | null
}) {
  const rows = await query(
    `INSERT INTO users (id, email, name, image)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           name  = EXCLUDED.name,
           image = EXCLUDED.image,
           updated_at = NOW()
     RETURNING *`,
    [data.id, data.email, data.name, data.image]
  )
  return rows[0]
}

export async function getUser(id: string) {
  const rows = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id])
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
  const rows = await query(
    `UPDATE users
     SET
       region_code         = COALESCE($2, region_code),
       income_type         = COALESCE($3, income_type),
       is_muslim           = COALESCE($4, is_muslim),
       monthly_expenses    = COALESCE($5, monthly_expenses),
       savings_balance     = COALESCE($6, savings_balance),
       onboarding_complete = COALESCE($7, onboarding_complete),
       updated_at          = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.regionCode ?? null,
      data.incomeType ?? null,
      data.isMuslim ?? null,
      data.monthlyExpenses ?? null,
      data.savingsBalance ?? null,
      data.onboardingComplete ?? null,
    ]
  )
  return rows[0] ?? null
}

export async function addIncomeEntry(data: {
  userId: string
  amount: number
  source: string
  note: string | null
  date: string
}) {
  const rows = await query(
    `INSERT INTO income_entries (user_id, amount, source, note, date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.userId, data.amount, data.source, data.note, data.date]
  )
  return rows[0]
}

export async function getIncomeEntries(userId: string, limit = 100) {
  return query(
    `SELECT * FROM income_entries
     WHERE user_id = $1
     ORDER BY date DESC, created_at DESC
     LIMIT $2`,
    [userId, limit]
  )
}

export async function deleteIncomeEntry(id: string, userId: string) {
  await query(
    `DELETE FROM income_entries WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )
}

export async function getReserveBalance(userId: string): Promise<number> {
  const rows = await query(
    `SELECT reserve_balance FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  )
  return Number(rows[0]?.reserve_balance ?? 0)
}

export async function updateReserveBalance(userId: string, amount: number) {
  await query(
    `UPDATE users SET reserve_balance = $2, updated_at = NOW() WHERE id = $1`,
    [userId, amount]
  )
}
