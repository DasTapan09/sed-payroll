import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import type { Payslip } from "@/lib/types"
import { redis } from "@/lib/redis"

/**
 * GET /api/payslips
 * Admin only
 */
export async function GET() {
  const user = await getCurrentUser()

  // 🔐 Admin only
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  const keys = await redis.keys("payslip:*")
  if (keys.length === 0) {
    return NextResponse.json([])
  }

  // Fetch all payslips as objects
  const payslips = await redis.mget<Payslip[]>(keys)

  const results = payslips.filter(Boolean) as Payslip[]

  return NextResponse.json(results)
}
