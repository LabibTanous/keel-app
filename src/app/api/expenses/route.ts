import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSupabase } from "@/lib/supabase"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data, error } = await getSupabase()
    .from("keel_expense_entries")
    .select("*")
    .eq("user_id", session.user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expenses: data ?? [] })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  if (!body.amount || body.amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
  const { data, error } = await getSupabase()
    .from("keel_expense_entries")
    .insert({
      user_id: session.user.id,
      amount: Number(body.amount),
      category: body.category || "Other",
      note: body.note || null,
      date: body.date || new Date().toISOString().split("T")[0],
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { error } = await getSupabase()
    .from("keel_expense_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
