// scripts/seed-redis.ts
import { randomUUID } from "crypto"
import "dotenv/config"

import { hashPassword } from "../lib/password"
import { redis } from "@/lib/redis"

import type {
  User,
  Employee,
  SalaryStructure,
  Attendance,
  Deduction,
  LeaveBalance,
} from "../lib/types"

/* --------------------------------------------------
 * Helpers
 * -------------------------------------------------- */

async function clearByPattern(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
    console.log(`[v0] Deleted ${keys.length} keys for pattern ${pattern}`)
  }
}

async function clearAllUsers() {
  console.log("[v0] Clearing existing users...")
  await clearByPattern("user:*")
}

/* --------------------------------------------------
 * Seed
 * -------------------------------------------------- */

async function seedRedisData() {
  console.log("[v0] Starting Redis data seeding...")

  try {
    /* ---------- CLEANUP ---------- */

    await clearAllUsers()

    console.log("[v0] Clearing existing payroll data...")
    await redis.del(
      "payroll:employees",
      "payroll:salary_structures",
      "payroll:attendance",
      "payroll:leave_balances",
      "payroll:deductions",
      "payroll:payroll_runs",
      "payroll:payslips",
      "payroll:audit_logs",
    )

    await clearByPattern("leave:*")
    await clearByPattern("session:*")

    /* ---------- SALARY STRUCTURES ---------- */

    console.log("[v0] Seeding salary structures...")
    const salaryStructures: SalaryStructure[] = [
      {
        id: "sal-1",
        name: "Junior Level",
        basicSalary: 30000,
        hra: 12000,
        specialAllowance: 8000,
        bonus: 0,
        variablePay: 0,
        employerPF: 3600,
        insurance: 500,
        effectiveFrom: "2024-01-01",
      },
      {
        id: "sal-2",
        name: "Mid Level",
        basicSalary: 50000,
        hra: 20000,
        specialAllowance: 15000,
        bonus: 5000,
        variablePay: 0,
        employerPF: 6000,
        insurance: 1000,
        effectiveFrom: "2024-01-01",
      },
      {
        id: "sal-3",
        name: "Senior Level",
        basicSalary: 80000,
        hra: 32000,
        specialAllowance: 28000,
        bonus: 10000,
        variablePay: 5000,
        employerPF: 9600,
        insurance: 2000,
        effectiveFrom: "2024-01-01",
      },
    ]

    for (const structure of salaryStructures) {
      await redis.hset("payroll:salary_structures", {
        [structure.id]: structure,
      })
    }

    /* ---------- EMPLOYEES ---------- */

    console.log("[v0] Seeding employees...")
    const employees: Employee[] = [
      {
        id: "emp-1",
        employeeId: "EMP001",
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        phone: "+1-555-0101",
        dateOfJoining: "2022-01-15",
        department: "Engineering",
        designation: "Senior Software Engineer",
        employmentType: "Full-time",
        bankAccount: "1234567890",
        ifscCode: "BANK0001234",
        taxId: "TAX123456",
        salaryStructureId: "sal-3",
        isActive: true,
      },
      {
        id: "emp-2",
        employeeId: "EMP002",
        name: "Michael Chen",
        email: "michael.chen@company.com",
        phone: "+1-555-0102",
        dateOfJoining: "2023-03-20",
        department: "Engineering",
        designation: "Software Engineer",
        employmentType: "Full-time",
        bankAccount: "2345678901",
        ifscCode: "BANK0001234",
        taxId: "TAX234567",
        salaryStructureId: "sal-2",
        isActive: true,
      },
      {
        id: "emp-3",
        employeeId: "EMP003",
        name: "Emily Rodriguez",
        email: "emily.rodriguez@company.com",
        phone: "+1-555-0103",
        dateOfJoining: "2023-06-10",
        department: "Human Resources",
        designation: "HR Manager",
        employmentType: "Full-time",
        bankAccount: "3456789012",
        ifscCode: "BANK0001234",
        taxId: "TAX345678",
        salaryStructureId: "sal-2",
        isActive: true,
      },
      {
        id: "emp-4",
        employeeId: "EMP004",
        name: "James Wilson",
        email: "james.wilson@company.com",
        phone: "+1-555-0104",
        dateOfJoining: "2024-01-05",
        department: "Marketing",
        designation: "Marketing Specialist",
        employmentType: "Full-time",
        bankAccount: "4567890123",
        ifscCode: "BANK0001234",
        taxId: "TAX456789",
        salaryStructureId: "sal-1",
        isActive: true,
      },
      {
        id: "emp-5",
        employeeId: "EMP005",
        name: "Lisa Anderson",
        email: "lisa.anderson@company.com",
        phone: "+1-555-0105",
        dateOfJoining: "2022-08-12",
        department: "Finance",
        designation: "Senior Accountant",
        employmentType: "Full-time",
        bankAccount: "5678901234",
        ifscCode: "BANK0001234",
        taxId: "TAX567890",
        salaryStructureId: "sal-2",
        isActive: true,
      },
      {
        id: "emp-6",
        employeeId: "EMP006",
        name: "David Kim",
        email: "david.kim@company.com",
        phone: "+1-555-0106",
        dateOfJoining: "2024-02-01",
        department: "Engineering",
        designation: "Junior Developer",
        employmentType: "Contract",
        bankAccount: "6789012345",
        ifscCode: "BANK0001234",
        taxId: "TAX678901",
        salaryStructureId: "sal-1",
        isActive: true,
      },
    ]

    for (const employee of employees) {
      await redis.hset("payroll:employees", {
        [employee.id]: employee,
      })

      const balance: LeaveBalance = {
        employeeId: employee.id,
        casual: 10,
        sick: 7,
        paid: 15,
      }

      await redis.hset("payroll:leave_balances", {
        [employee.id]: balance,
      })
    }

    await seedUsers(employees)

    /* ---------- ATTENDANCE ---------- */

    console.log("[v0] Seeding attendance...")
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    for (const emp of employees) {
      for (let day = 1; day <= today.getDate(); day++) {
        const date = new Date(year, month, day)
        if (date.getDay() === 0 || date.getDay() === 6) continue

        const att: Attendance = {
          id: `att-${emp.id}-${date.toISOString().split("T")[0]}`,
          employeeId: emp.id,
          date: date.toISOString().split("T")[0],
          status: Math.random() > 0.1 ? "Present" : "Absent",
          overtimeHours: Math.random() > 0.8 ? 2 : 0,
        }

        await redis.hset("payroll:attendance", {
          [att.id]: att,
        })
      }
    }

    /* ---------- DEDUCTIONS ---------- */

    console.log("[v0] Seeding deductions...")
    const deductions: Deduction[] = [
      { id: "ded-1", name: "Income Tax", type: "percentage", value: 10, applicableToAll: true },
      { id: "ded-2", name: "Provident Fund", type: "percentage", value: 12, applicableToAll: true },
      { id: "ded-3", name: "Health Insurance", type: "fixed", value: 500, applicableToAll: true },
    ]

    for (const d of deductions) {
      await redis.hset("payroll:deductions", {
        [d.id]: d,
      })
    }

    console.log("[v0] ✅ Redis seeding completed successfully")
  } catch (err) {
    console.error("[v0] ❌ Seed failed:", err)
    throw err
  }
}

/* --------------------------------------------------
 * Users
 * -------------------------------------------------- */

async function seedUsers(employees: Employee[]) {
  console.log("[v0] Seeding users...")

  // Admin
  const admin: User = {
    id: randomUUID(),
    email: "admin@demo.com",
    passwordHash: await hashPassword("admin123"),
    role: "admin",
  }

  await redis.set(`user:${admin.id}`, admin)
  await redis.set(`user:email:${admin.email}`, admin.id)

  console.log("✔ Admin → admin@demo.com / admin123")

  // Employees
  for (let i = 0; i < 2; i++) {
    const emp = employees[i]

    const user: User = {
      id: randomUUID(),
      email: `emp${i + 1}@demo.com`,
      passwordHash: await hashPassword("emp123"),
      role: "employee",
      employeeId: emp.id,
    }

    await redis.set(`user:${user.id}`, user)
    await redis.set(`user:email:${user.email}`, user.id)

    console.log(`✔ Employee → ${user.email} / emp123`)
  }
}

/* --------------------------------------------------
 * Run
 * -------------------------------------------------- */

seedRedisData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
