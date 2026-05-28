import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.")
  console.error("Set it in your .env.local file or shell before running this script.")
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function main() {
  console.log("Running Keel database migration...")

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id                  TEXT PRIMARY KEY,
      email               TEXT NOT NULL UNIQUE,
      name                TEXT,
      image               TEXT,
      region_code         TEXT NOT NULL DEFAULT 'US',
      income_type         TEXT NOT NULL DEFAULT 'freelancer',
      is_muslim           BOOLEAN NOT NULL DEFAULT FALSE,
      monthly_expenses    NUMERIC(12, 2) NOT NULL DEFAULT 0,
      savings_balance     NUMERIC(12, 2) NOT NULL DEFAULT 0,
      reserve_balance     NUMERIC(12, 2) NOT NULL DEFAULT 0,
      onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log("✓ users table")

  await sql`
    CREATE TABLE IF NOT EXISTS income_entries (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount     NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      source     TEXT NOT NULL DEFAULT '',
      note       TEXT,
      date       DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log("✓ income_entries table")

  await sql`CREATE INDEX IF NOT EXISTS idx_income_entries_user_date ON income_entries(user_id, date DESC)`
  console.log("✓ indexes")

  console.log("\nDatabase migration complete.")
}

main().catch((err) => {
  console.error("Migration failed:", err.message)
  process.exit(1)
})
