import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { addIncomeEntry, getIncomeEntries } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const entries = await getIncomeEntries(session.user.id)
  return NextResponse.json({ entries })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
  }
  const entry = await addIncomeEntry({
    userId: session.user.id,
    amount: Number(body.amount),
    source: body.source || "Income",
    note: body.note || null,
    date: body.date || new Date().toISOString().split("T")[0],
  })
  return NextResponse.json({ entry }, { status: 201 })
}
