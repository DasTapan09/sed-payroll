import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getCurrentUser } from "@/lib/auth"
import { dataStore } from "@/lib/data-store"
import type { Leave } from "@/lib/types"

/**
 * GET /api/leaves
 * - Employee: only their leaves
 * - Admin: all leaves
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    if (user.role === "admin") {
      const leaves = await dataStore.getLeaves()
      return NextResponse.json(leaves)
    }

    if (user.role === "employee" && user.employeeId) {
      const leaves = await dataStore.getLeavesByEmployeeId(
        user.employeeId
      )
      return NextResponse.json(leaves)
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaves" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leaves
 * Employee requests a leave
 */
export async function POST(req: Request) {
  const user = await getCurrentUser()

  // 🔐 Employee only
  if (!user || user.role !== "employee" || !user.employeeId) {
    return NextResponse.json(
      { error: "Only employees can request leave" },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { leaveType, startDate, endDate, reason } = body

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 400 }
      )
    }

    // 🔁 Overlapping leave check
    const existingLeaves =
      await dataStore.getLeavesByEmployeeId(user.employeeId)

    const hasOverlap = existingLeaves.some((leave) => {
      if (leave.status === "Rejected") return false

      return (
        leave.startDate <= endDate &&
        leave.endDate >= startDate
      )
    })

    if (hasOverlap) {
      return NextResponse.json(
        {
          error:
            "You already have a leave request overlapping this date range",
        },
        { status: 409 }
      )
    }

    const days =
      Math.floor(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1

    const leave: Leave = {
      id: randomUUID(),
      employeeId: user.employeeId,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      status: "Pending",
    }

    await dataStore.createLeave(leave)

    return NextResponse.json(leave, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/leaves
 * Admin approves / rejects a leave
 */
export async function PUT(req: Request) {
  const user = await getCurrentUser()

  // 🔐 Admin only
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing leave id or status" },
        { status: 400 }
      )
    }

    const updatedLeave = await dataStore.updateLeave(id, {
      status,
    })

    return NextResponse.json(updatedLeave)
  } catch {
    return NextResponse.json(
      { error: "Failed to update leave status" },
      { status: 500 }
    )
  }
}
