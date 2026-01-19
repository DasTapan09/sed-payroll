import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import type { Employee } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    const user = await getCurrentUser()

    // 🔐 Admin only
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const employees = await dataStore.getEmployees()
    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 🔍 DUPLICATE CHECKS
    const emailExists = await redis.get(
      `employee:email:${body.email}`
    )
    if (emailExists) {
      return NextResponse.json(
        { error: "Employee with this email already exists" },
        { status: 409 }
      )
    }

    const empIdExists = await redis.get(
      `employee:employeeId:${body.employeeId}`
    )
    if (empIdExists) {
      return NextResponse.json(
        { error: "Employee with this employeeId already exists" },
        { status: 409 }
      )
    }

    const phoneExists = await redis.get(
  `employee:phone:${body.phone}`
    )
    if (phoneExists) {
      return NextResponse.json(
        { error: "Employee with this phone number already exists" },
        { status: 409 }
      )
    }

    const taxIdExists = await redis.get(
      `employee:taxId:${body.taxId}`
    )

    if (taxIdExists) {
      return NextResponse.json(
        { error: "Employee with this tax ID already exists" },
        { status: 409 }
      )
    }

    // ✅ CREATE
    const employee: Employee = {
      id: `emp-${Date.now()}`,
      ...body,
    }

    const created = await dataStore.addEmployee(employee)

    // 🔗 CREATE INDEXES
    await redis.set(
      `employee:email:${employee.email}`,
      employee.id
    )
    await redis.set(
      `employee:employeeId:${employee.employeeId}`,
      employee.id
    )

    await redis.set(
      `employee:phone:${employee.phone}`,
      employee.id
    )

    await redis.set(
      `employee:taxId:${employee.taxId}`,
      employee.id
    )


    await dataStore.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      action: "CREATE",
      entity: "employee",
      entityId: employee.id,
      changes: employee,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    )
  }
}