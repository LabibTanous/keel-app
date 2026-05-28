import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUser, updateUserProfile } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(session.user.id)
  return NextResponse.json({ user })
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const user = await updateUserProfile(session.user.id, body)
    return NextResponse.json({ user })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[PATCH /api/user] error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
