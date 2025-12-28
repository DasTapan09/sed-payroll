// app/api/attendance/clock/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import type { Attendance } from "@/lib/types"
import { redis } from "@/lib/redis"

export async function POST() {
  const user = await getCurrentUser()

  // 🔐 Only logged-in employees
  if (!user || user.role !== "employee" || !user.employeeId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const today = new Date().toISOString().split("T")[0]
  const now = new Date().toISOString()

  // Fetch all attendance (object-only)
  const records =
    await redis.hgetall<Record<string, Attendance>>(
      "payroll:attendance"
    )

  const attendanceList = records
    ? Object.values(records)
    : []

  const existing = attendanceList.find(
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

    await redis.hset("payroll:attendance", {
      [attendance.id]: attendance,
    })

    return NextResponse.json(attendance, {
      status: 201,
    })
  }

  // 2️⃣ Clocked in but not out → CLOCK OUT
  if (existing.checkInTime && !existing.checkOutTime) {
    const updated: Attendance = {
      ...existing,
      checkOutTime: now,
    }

    await redis.hset("payroll:attendance", {
      [updated.id]: updated,
    })

    return NextResponse.json(updated)
  }

  // 3️⃣ Already clocked out → NO-OP
  return NextResponse.json(existing)
}
