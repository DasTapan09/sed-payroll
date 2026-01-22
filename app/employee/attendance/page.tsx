"use client"

import { useEffect, useState } from "react"
import type { Attendance } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ClockButton } from "@/components/attendance/clock-button"
import { useToast } from "@/hooks/use-toast"

export default function EmployeeAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/employee/attendance")

      if (!res.ok) {
        throw new Error("Failed to fetch attendance")
      }

      const data = await res.json()
      setAttendance(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [])

  const today = new Date().toISOString().split("T")[0]
  const todayRecord = attendance.find(
    (r) => r.date === today
  )

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Attendance</CardTitle>
          <ClockButton
            initialRecord={todayRecord}
            onSuccess={fetchAttendance}
          />
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading attendance…
            </p>
          ) : (
            <>
              {todayRecord && (
                <div className="mb-6 rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium">
                    Today’s Attendance
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Status:
                      </span>{" "}
                      <span className="font-medium">
                        {todayRecord.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Check in:
                      </span>{" "}
                      <span className="font-medium">
                        {todayRecord.checkInTime
                          ? new Date(
                              todayRecord.checkInTime
                            ).toLocaleTimeString()
                          : "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Check out:
                      </span>{" "}
                      <span className="font-medium">
                        {todayRecord.checkOutTime
                          ? new Date(
                              todayRecord.checkOutTime
                            ).toLocaleTimeString()
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
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {new Date(r.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>
                          {r.overtimeHours > 0
                            ? `${r.overtimeHours}h`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {r.notes ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
