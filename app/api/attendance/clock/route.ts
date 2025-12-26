import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getRedisClient } from "@/lib/redis"
import type { Attendance } from "@/lib/types"

export async function POST() {
  const user = await getCurrentUser()

  // 🔐 Only logged-in employees
  if (!user || user.role !== "employee" || !user.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const redis = await getRedisClient()

  const today = new Date().toISOString().split("T")[0]
  const now = new Date().toISOString()

  // Fetch all attendance (same as admin logic)
  const raw = await redis.hGetAll("payroll:attendance")

  const existing = Object.values(raw)
    .map((v) => JSON.parse(v) as Attendance)
    .find(
      (a) =>
        a.employeeId === user.employeeId &&
        a.date === today
    )

  // 1️⃣ No record → CLOCK IN
  if (!existing) {
    const attendance: Attendance = {
      id: `att-${user.employeeId}-${today}`,
      employeeId: user.employeeId,
      date: today,
      status: "Present",
      overtimeHours: 0,
      checkInTime: now,
    }

    await redis.hSet(
      "payroll:attendance",
      attendance.id,
      JSON.stringify(attendance)
    )

    return NextResponse.json(attendance, { status: 201 })
  }

  // 2️⃣ Clocked in but not out → CLOCK OUT
  if (existing.checkInTime && !existing.checkOutTime) {
    existing.checkOutTime = now

    await redis.hSet(
      "payroll:attendance",
      existing.id,
      JSON.stringify(existing)
    )

    return NextResponse.json(existing)
  }

  // 3️⃣ Already clocked out → NO-OP
  return NextResponse.json(existing)
}
