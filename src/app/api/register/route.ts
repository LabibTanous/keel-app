import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getConvexClient } from "@/lib/convex-client"
import { api } from "../../../../convex/_generated/api"

export async function POST(request: Request) {
  try {
    const { email, password, userId } = await request.json()
    if (!email || !password || !userId) {
      return NextResponse.json({ error: "email, password and userId required" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }
    const client = getConvexClient()
    // Check email not already registered
    const existing = await client.query(api.users.getUserByEmail, { email: email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    await client.mutation(api.users.createUserWithPassword, {
      userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      name: null,
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[POST /api/register]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
