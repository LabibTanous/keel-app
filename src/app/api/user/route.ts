import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getFullProfile, saveFullProfile } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const profileJson = await getFullProfile(session.user.id)
  return NextResponse.json({ profileJson: profileJson ?? null })
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    if (typeof body.profileJson !== "string") {
      return NextResponse.json({ error: "profileJson must be a string" }, { status: 400 })
    }
    await saveFullProfile(session.user.id, body.profileJson)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[PATCH /api/user] error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
