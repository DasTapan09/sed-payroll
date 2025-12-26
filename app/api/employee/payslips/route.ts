import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "employee" || !user.employeeId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payslips = await dataStore.getPayslips()

    const myPayslips = payslips.filter(
      (p) => p.employeeId === user.employeeId
    )

    return NextResponse.json(myPayslips)
  } catch (error) {
    console.error("EMPLOYEE PAYSLIPS ERROR:", error)
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    )
  }
}
