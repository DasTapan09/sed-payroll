// app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import type { User } from "@/lib/types"
import { redis } from "@/lib/redis"

const SESSION_COOKIE_NAME = "auth_session"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json(
      { error: "Unauthenticated" },
      { status: 401 }
    )
  }

  // session:<token> → userId (STRING)
  const userId = await redis.get<string>(`session:${token}`)
  if (!userId) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    )
  }

  // user:<id> → User (OBJECT)
  const user = await redis.get<User>(`user:${userId}`)
  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 401 }
    )
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId ?? null,
  })
}
