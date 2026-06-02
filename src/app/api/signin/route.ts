import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getConvexClient } from "@/lib/convex-client"
import { api } from "../../../../convex/_generated/api"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 })
    }
    const client = getConvexClient()
    const user = await client.query(api.users.getUserByEmail, { email: email.toLowerCase().trim() })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 })
    }
    return NextResponse.json({ userId: user.userId, email: user.email })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[POST /api/signin]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
