import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { addExpenseEntry, getExpenseEntries, deleteExpenseEntry } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const expenses = await getExpenseEntries(session.user.id)
  return NextResponse.json({ expenses: expenses ?? [] })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  if (!body.amount || body.amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
  const expense = await addExpenseEntry({
    userId: session.user.id,
    amount: Number(body.amount),
    category: body.category || "Other",
    note: body.note || null,
    date: body.date || new Date().toISOString().split("T")[0],
  })
  return NextResponse.json({ expense }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await deleteExpenseEntry(id, session.user.id)
  return NextResponse.json({ ok: true })
}
