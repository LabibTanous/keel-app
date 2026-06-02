import { NextResponse } from "next/server"
import { getUserByLogToken, addIncomeEntry } from "@/lib/db"

// GET /api/quick-log?token=xxx&amount=5000&source=Client&date=2026-05-29
// Used by iOS Shortcuts / automation. Token is per-user, shown in dashboard settings.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const amount = Number(searchParams.get("amount") ?? 0)
  const source = searchParams.get("source") || "Income"
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })
  if (!amount || amount <= 0) return NextResponse.json({ error: "amount must be positive" }, { status: 400 })

  const user = await getUserByLogToken(token)
  if (!user) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  await addIncomeEntry({
    userId: user.userId,
    amount,
    source,
    note: null,
    date,
  })

  return NextResponse.json({ ok: true, logged: { amount, source, date } })
}
