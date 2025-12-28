// lib/auth.ts
import { redis } from "./redis"
import { getSessionUserId } from "./session"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId()
  if (!userId) return null

  const user = await redis.get<User>(`user:${userId}`)
  if (!user) return null

  return user
}
