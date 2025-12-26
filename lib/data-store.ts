import { getRedisClient } from "@/lib/redis"
import type {
  Employee,
  Leave,
  LeaveBalance,
  Attendance,
  PayrollRun,
  Payslip,
  SalaryStructure,
  AuditLog,
  Deduction
} from "@/lib/types"

/**
 * Redis key helpers
 * (explicit instead of abstracted, to match your codebase)
 */
const leaveKey = (id: string) => `leave:${id}`

export const dataStore = {
  /* =======================
   * EMPLOYEES
   * ======================= */


  async getEmployees(): Promise<Employee[]> {
    const redis = await getRedisClient()
    const employees = await redis.hGetAll("payroll:employees")

    return Object.values(employees).map((e) => JSON.parse(e))
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    const redis = await getRedisClient()
    const raw = await redis.hGet("payroll:employees", id)

    return raw ? JSON.parse(raw) : null
  },

  async updateEmployee(id: string, updates: Partial<Employee>) {
    const redis = await getRedisClient()
    const employee = await this.getEmployeeById(id)
    if (!employee) throw new Error("Employee not found")

    const updated = { ...employee, ...updates }
    await redis.hSet(
      "payroll:employees",
      id,
      JSON.stringify(updated)
    )

    return updated
  },
  
  /* =======================
   * LEAVE BALANCE
   * ======================= */


  async getLeaveBalance(employeeId: string): Promise<LeaveBalance> {
  const redis = await getRedisClient()
  const raw = await redis.hGet(
    "payroll:leave_balances",
    employeeId
  )

  if (raw) return JSON.parse(raw)

  return {
    employeeId,
    casual: 0,
    sick: 0,
    paid: 0,
  }
},

async updateLeaveBalance(
  employeeId: string,
  updates: Partial<LeaveBalance>
) {
  const redis = await getRedisClient()
  const current = await this.getLeaveBalance(employeeId)

  const updated = { ...current, ...updates }

  await redis.hSet(
    "payroll:leave_balances",
    employeeId,
    JSON.stringify(updated)
  )

  return updated
},

  async deductLeaveBalance(leave: Leave) {
    const balance = await this.getLeaveBalance(leave.employeeId)

    const key =
      leave.leaveType === "Casual"
        ? "casual"
        : leave.leaveType === "Sick"
        ? "sick"
        : "paid"

    const remaining = Math.max(0, balance[key] - leave.days)

    await this.updateLeaveBalance(leave.employeeId, {
      [key]: remaining,
    })
  },

  /* =======================
   * LEAVES
   * ======================= */

  async getLeaves(): Promise<Leave[]> {
    const redis = await getRedisClient()
    const keys = await redis.keys("leave:*")
    if (keys.length === 0) return []

    const leaves = await redis.mGet(keys)
    return leaves
      .filter(Boolean)
      .map((l) => JSON.parse(l as string))
  },

  async getLeavesByEmployeeId(employeeId: string): Promise<Leave[]> {
    const leaves = await this.getLeaves()
    return leaves.filter((l) => l.employeeId === employeeId)
  },

  async createLeave(leave: Leave) {
    const redis = await getRedisClient()
    await redis.set(leaveKey(leave.id), JSON.stringify(leave))
    return leave
  },

  async updateLeave(id: string, updates: Partial<Leave>) {
    const redis = await getRedisClient()
    const raw = await redis.get(leaveKey(id))
    if (!raw) throw new Error("Leave not found")

    const leave: Leave = JSON.parse(raw)
    const updatedLeave = { ...leave, ...updates }

    // ✅ Deduct balance ONLY on first approval
    if (
      leave.status !== "Approved" &&
      updates.status === "Approved"
    ) {
      await this.deductLeaveBalance(leave)
    }

    await redis.set(
      leaveKey(id),
      JSON.stringify(updatedLeave)
    )

    return updatedLeave
  },

  /* =======================
   * ATTENDANCE
   * ======================= */

  async getAttendance(): Promise<Attendance[]> {
    const redis = await getRedisClient()
    const records = await redis.hGetAll("payroll:attendance")

    return Object.values(records).map((r) =>
      JSON.parse(r)
    )
  },

  async getDeductions(): Promise<Deduction[]> {
  const redis = await getRedisClient()
  const deductions = await redis.hGetAll("payroll:deductions")

  return Object.values(deductions).map((d) =>
    JSON.parse(d)
  )
},


  /* =======================
   * PAYROLL
   * ======================= */

  async getPayrollRuns(): Promise<PayrollRun[]> {
    const redis = await getRedisClient()
    const keys = await redis.keys("payroll-run:*")
    if (keys.length === 0) return []

    const runs = await redis.mGet(keys)
    return runs
      .filter(Boolean)
      .map((r) => JSON.parse(r as string))
  },

  async getPayslips(): Promise<Payslip[]> {
    const redis = await getRedisClient()
    const keys = await redis.keys("payslip:*")
    if (keys.length === 0) return []

    const slips = await redis.mGet(keys)
    return slips
      .filter(Boolean)
      .map((p) => JSON.parse(p as string))
  },

  async addPayrollRun(payrollRun: PayrollRun): Promise<PayrollRun> {
    const redis = await getRedisClient()

    // store as a top-level key to match seed script / getPayrollRuns usage
    await redis.set(`payroll-run:${payrollRun.id}`, JSON.stringify(payrollRun))

    return payrollRun
  },

  async updatePayrollRun(id: string, updates: Partial<PayrollRun>): Promise<PayrollRun> {
    const redis = await getRedisClient()
    const raw = await redis.get(`payroll-run:${id}`)
    if (!raw) throw new Error("Payroll run not found")

    const run: PayrollRun = JSON.parse(raw)
    const updatedRun: PayrollRun = { ...run, ...updates }

    await redis.set(`payroll-run:${id}`, JSON.stringify(updatedRun))

    return updatedRun
  },

  /* =======================
 * SALARY STRUCTURES
 * ======================= */

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    const redis = await getRedisClient()
    const structures = await redis.hGetAll("payroll:salary_structures")

    return Object.values(structures).map((s) =>
      JSON.parse(s)
    )
  },

  async addSalaryStructure(structure: SalaryStructure) {
    const redis = await getRedisClient()

    await redis.hSet(
      "payroll:salary_structures",
      structure.id,
      JSON.stringify(structure)
    )

    return structure
  },

  /* =======================
  * AUDIT LOGS
  * ======================= */

  async addAuditLog(log: AuditLog) {
    const redis = await getRedisClient()
    await redis.set(
      `audit-log:${log.id}`,
      JSON.stringify(log)
    )
    return log
  },

  async getAuditLogs(): Promise<AuditLog[]> {
  const redis = await getRedisClient()
  const keys = await redis.keys("audit-log:*")

  if (keys.length === 0) return []

  const logs = await redis.mGet(keys)

  return logs
    .filter(Boolean)
    .map((l) => JSON.parse(l as string))
    // newest first
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )
  },

  /* =======================
 * PAYROLL PROCESSING
 * ======================= */

async getPayrollRunById(id: string): Promise<PayrollRun | null> {
  const redis = await getRedisClient()
  const raw = await redis.get(`payroll-run:${id}`)
  return raw ? JSON.parse(raw) : null
},

async addPayslip(payslip: Payslip): Promise<Payslip> {
  const redis = await getRedisClient()
  await redis.set(`payslip:${payslip.id}`, JSON.stringify(payslip))
  return payslip
},


}
