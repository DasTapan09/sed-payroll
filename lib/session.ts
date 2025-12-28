import crypto from "crypto"
import { cookies } from "next/headers"
import { redis } from "./redis"

const SESSION_COOKIE_NAME = "auth_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export async function createSession(userId: string) {

  const token = crypto.randomBytes(32).toString("hex")

  await redis.set(`session:${token}`, userId, {
    ex: SESSION_TTL_SECONDS,
  })

  // ✅ cookies() is async in route handlers
  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })

  return token
}

export async function getSessionUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  return redis.get(`session:${token}`)
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return

  await redis.del(`session:${token}`)

  cookieStore.delete(SESSION_COOKIE_NAME)
}
