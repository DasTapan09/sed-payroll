import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRedisClient } from "@/lib/redis"
import type { Attendance } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClockButton } from "@/components/attendance/clock-button"

export default async function EmployeeAttendancePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "employee") redirect("/")

  const redis = await getRedisClient()

  // ✅ Read from the same source as seed & admin
  const raw = await redis.hGetAll("payroll:attendance")

  const records: Attendance[] = Object.values(raw)
    .map((v) => JSON.parse(v) as Attendance)
    .filter((r) => r.employeeId === user.employeeId)

  // newest first
  records.sort((a, b) => b.date.localeCompare(a.date))
  const today = new Date().toISOString().split("T")[0]
  const todayRecord = records.find((r) => r.date === today)


  return (
    <Card>
      <CardHeader>
        <CardTitle>My Attendance</CardTitle>
        <ClockButton initialRecord={todayRecord} />
      </CardHeader>
      <CardContent>
        {todayRecord && (
          <div className="mb-4 rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">
              Today’s Attendance
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-medium">{todayRecord.status}</span>
              </div>

              <div>
                <span className="text-muted-foreground">Check in:</span>{" "}
                <span className="font-medium">
                  {todayRecord.checkInTime
                    ? new Date(todayRecord.checkInTime).toLocaleTimeString()
                    : "-"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground">Check out:</span>{" "}
                <span className="font-medium">
                  {todayRecord.checkOutTime
                    ? new Date(todayRecord.checkOutTime).toLocaleTimeString()
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Overtime (hrs)</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{r.overtimeHours}</TableCell>
                <TableCell>{r.notes ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {records.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No attendance records found.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
