import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params   // ✅ unwrap params

    const user = await getCurrentUser()

    if (!user || user.role !== "employee" || !user.employeeId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payslips = await dataStore.getPayslips()

    const payslip = payslips.find((p) => p.id === id)

    if (!payslip) {
      return NextResponse.json(
        { error: "Payslip not found" },
        { status: 404 }
      )
    }

    // 🔒 security check
    if (payslip.employeeId !== user.employeeId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json(payslip)
  } catch (error) {
    console.error("PAYSLIP DETAIL ERROR:", error)
    return NextResponse.json(
      { error: "Failed to fetch payslip" },
      { status: 500 }
    )
  }
}
