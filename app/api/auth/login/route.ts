// app/api/auth/login/route.ts
import { NextResponse } from "next/server"
import { verifyPassword } from "@/lib/password"
import { createSession } from "@/lib/session"
import type { User } from "@/lib/types"
import { redis } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      )
    }

    // 1️⃣ Find userId by email
    const userId = await redis.get<string>(`user:email:${email}`)
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // 2️⃣ Load user (OBJECT, not JSON string)
    const user = await redis.get<User>(`user:${userId}`)
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // 3️⃣ Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // 4️⃣ Create session
    await createSession(user.id)

    return NextResponse.json({
      success: true,
      role: user.role,
    })
  } catch (error) {
    console.error("[LOGIN_ERROR]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
