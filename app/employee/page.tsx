// app/employee/page.tsx
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Attendance, Payslip } from "@/lib/types"
import { redis } from "@/lib/redis"

export default async function EmployeeDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "employee") redirect("/")

  /* ======================
   * Attendance Summary
   * ====================== */

  const attendanceMap =
    await redis.hgetall<Record<string, Attendance>>(
      "payroll:attendance"
    )

  let presentDays = 0
  let absentDays = 0

  if (attendanceMap) {
    for (const record of Object.values(attendanceMap)) {
      if (record.employeeId !== user.employeeId) continue

      if (record.status === "Present") presentDays++
      if (record.status === "Absent") absentDays++
    }
  }

  /* ======================
   * Last Payslip
   * ====================== */

  const payslipKeys = await redis.keys("payslip:*")
  let lastPayslip: Payslip | null = null

  if (payslipKeys.length > 0) {
    const payslips = await redis.mget<Payslip[]>(payslipKeys)

    for (const p of payslips.filter(Boolean) as Payslip[]) {
      if (p.employeeId !== user.employeeId) continue

      if (!lastPayslip || p.period > lastPayslip.period) {
        lastPayslip = p
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Present days: <strong>{presentDays}</strong>
            </p>
            <p className="text-sm">
              Absent days: <strong>{absentDays}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Last Payslip */}
        <Card>
          <CardHeader>
            <CardTitle>Last Payslip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lastPayslip ? (
              <>
                <p className="text-sm">
                  Period: <strong>{lastPayslip.period}</strong>
                </p>
                <p className="text-sm">
                  Net Salary:{" "}
                  <strong>₹{lastPayslip.netSalary}</strong>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payslip available yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
