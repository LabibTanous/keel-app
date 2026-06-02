import { NextResponse } from "next/server"
import { getConvexClient } from "@/lib/convex-client"
import { api } from "../../../../convex/_generated/api"

export async function POST(request: Request) {
  try {
    const { logToken } = await request.json()
    if (!logToken || typeof logToken !== "string") {
      return NextResponse.json({ error: "logToken required" }, { status: 400 })
    }

    const client = getConvexClient()
    const user = await client.query(api.users.getUserByLogToken, { logToken: logToken.trim() })
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json({ userId: user.userId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[POST /api/signin]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
