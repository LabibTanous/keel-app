import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAllUserData, saveFullProfile, saveGoals, saveBigPayments, saveExpenses } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await getAllUserData(session.user.id)
  return NextResponse.json(data ?? { profileJson: null, goalsJson: null, bigPaymentsJson: null, expensesJson: null })
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()

    const ops: Promise<void>[] = []

    if (typeof body.profileJson === "string") {
      ops.push(saveFullProfile(session.user.id, body.profileJson))
    }
    if (typeof body.goalsJson === "string") {
      ops.push(saveGoals(session.user.id, body.goalsJson))
    }
    if (typeof body.bigPaymentsJson === "string") {
      ops.push(saveBigPayments(session.user.id, body.bigPaymentsJson))
    }
    if (typeof body.expensesJson === "string") {
      ops.push(saveExpenses(session.user.id, body.expensesJson))
    }

    if (ops.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    await Promise.all(ops)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[PATCH /api/user] error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
