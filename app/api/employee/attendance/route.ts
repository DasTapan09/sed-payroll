import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { dataStore } from "@/lib/data-store"

/**
 * GET /api/employee/attendance
 * Employee only – returns own attendance
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    // 🔐 Employee only + must have employeeId
    if (!user || user.role !== "employee" || !user.employeeId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

  const records = await dataStore.getAttendance()

    const attendances = records.filter(
    (r) => r.employeeId === user.employeeId
    )

    // newest first
    attendances.sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json(attendances)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    )
  }
}
