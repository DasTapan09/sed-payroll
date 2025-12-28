// app/api/payslips/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import type { Payslip } from "@/lib/types"
import { redis } from "@/lib/redis"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const keys = await redis.keys("payslip:*")
  if (keys.length === 0) {
    return NextResponse.json([])
  }

  // Fetch all payslips as objects
  const payslips = await redis.mget<Payslip[]>(keys)

  const results = (payslips.filter(Boolean) as Payslip[]).filter(
    (p) =>
      user.role === "admin" ||
      p.employeeId === user.employeeId
  )

  return NextResponse.json(results)
}
