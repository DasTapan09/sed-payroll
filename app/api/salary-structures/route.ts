import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { getCurrentUser } from "@/lib/auth"
import type { SalaryStructure } from "@/lib/types"

/**
 * GET /api/salary-structures
 * Admin only
 */
export async function GET() {
  const user = await getCurrentUser()

  // 🔐 Admin only
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  try {
    const structures = await dataStore.getSalaryStructures()
    return NextResponse.json(structures)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch salary structures" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/salary-structures
 * Admin only
 */
export async function POST(request: Request) {
  const user = await getCurrentUser()

  // 🔐 Admin only
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    const structure: SalaryStructure = {
      id: `sal-${Date.now()}`,
      ...body,
    }

    const created = await dataStore.addSalaryStructure(structure)

    await dataStore.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id, // 👈 real admin user
      action: "CREATE",
      entity: "salary_structure",
      entityId: structure.id,
      changes: structure,
    })

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Failed to create salary structure" },
      { status: 500 }
    )
  }
}
