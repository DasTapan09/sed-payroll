// app/api/attendance/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import type { Attendance } from "@/lib/types"
import { randomUUID } from "crypto"
import { redis } from "@/lib/redis"

/**
 * GET /api/attendance
 *
 * Admin:
 *   - Can fetch all attendance
 *   - Or filter by ?employeeId=
 *
 * Employee:
 *   - Can fetch ONLY their own attendance
 */
export async function GET(req: Request) {
  const user = await getCurrentUser()

  // 🔐 Admin only
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  const url = new URL(req.url)

  const employeeFilter =
    url.searchParams.get("employeeId")

  const startDate = url.searchParams.get("startDate")
  const endDate = url.searchParams.get("endDate")

  const records =
    await redis.hgetall<Record<string, Attendance>>(
      "payroll:attendance"
    )

  let attendance = records ? Object.values(records) : []

  if (employeeFilter) {
    attendance = attendance.filter(
      (a) => a.employeeId === employeeFilter
    )
  }

  if (startDate && endDate) {
    attendance = attendance.filter(
      (a) => a.date >= startDate && a.date <= endDate
    )
  }

  return NextResponse.json(attendance)
}

/**
 * POST /api/attendance
 *
 * Admin:
 *   - Can create attendance for any employee
 *
 * Employee:
 *   - Can create attendance ONLY for themselves
 *   - employeeId from client is IGNORED
 */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  const employeeId =
    user.role === "admin"
      ? body.employeeId
      : user.employeeId

  if (!employeeId) {
    return NextResponse.json(
      { error: "employeeId is required" },
      { status: 400 }
    )
  }

  const attendance: Attendance = {
    id: randomUUID(),
    employeeId,
    date: body.date,
    status: body.status,
    overtimeHours: body.overtimeHours ?? 0,
    notes: body.notes,
  }

  await redis.hset("payroll:attendance", {
    [attendance.id]: attendance,
  })

  return NextResponse.json(attendance, { status: 201 })
}
