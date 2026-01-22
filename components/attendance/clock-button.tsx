
"use client"

import { useState } from "react"
import type { Attendance } from "@/lib/types"

export function ClockButton({
  initialRecord,
  onSuccess,
}: {
  initialRecord?: Attendance,
  onSuccess?: () => void
}) {
  const [record, setRecord] = useState<Attendance | undefined>(initialRecord)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error)
        return
      }
      const data = await res.json()
      setRecord(data)
    } catch (err) {
      console.error("Clock action failed", err)
    } finally {
      setLoading(false)
    }
  }

  const isClockedIn =
    record?.checkInTime && !record?.checkOutTime

  const label = isClockedIn ? "Clock out" : "Clock in"

  return (
    <div className="flex items-center gap-4">
      <button
        id="clock-button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
      >
        {loading ? "..." : label}
      </button>

      {record?.checkInTime && (
        <span className="text-xs text-muted-foreground">
          In: {new Date(record.checkInTime).toLocaleTimeString()}
        </span>
      )}

      {record?.checkOutTime && (
        <span className="text-xs text-muted-foreground">
          Out: {new Date(record.checkOutTime).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
