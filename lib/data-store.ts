// lib/data-store.ts
import { redis } from "@/lib/redis"
import type {
  Employee,
  Leave,
  LeaveBalance,
  Attendance,
  PayrollRun,
  Payslip,
  SalaryStructure,
  AuditLog,
  Deduction,
} from "@/lib/types"

/**
 * Redis key helpers
 */
const leaveKey = (id: string) => `leave:${id}`

export const dataStore = {
  /* =======================
   * EMPLOYEES
   * ======================= */

  async getEmployees(): Promise<Employee[]> {
    const employees =
      await redis.hgetall<Record<string, Employee>>(
        "payroll:employees"
      )

    if (!employees) return []
    return Object.values(employees)
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    return (
      await redis.hget<Employee>(
        "payroll:employees",
        id
      )
    ) ?? null
  },

  async updateEmployee(
    id: string,
    updates: Partial<Employee>
  ): Promise<Employee> {
    const employee = await this.getEmployeeById(id)
    if (!employee) throw new Error("Employee not found")

    const updated = { ...employee, ...updates }

    await redis.hset("payroll:employees", {
      [id]: updated,
    })

    return updated
  },

  /* =======================
   * LEAVE BALANCE
   * ======================= */

  async getLeaveBalance(
    employeeId: string
  ): Promise<LeaveBalance> {
    return (
      await redis.hget<LeaveBalance>(
        "payroll:leave_balances",
        employeeId
      )
    ) ?? {
      employeeId,
      casual: 0,
      sick: 0,
      paid: 0,
    }
  },

  async updateLeaveBalance(
    employeeId: string,
    updates: Partial<LeaveBalance>
  ): Promise<LeaveBalance> {
    const current = await this.getLeaveBalance(employeeId)
    const updated = { ...current, ...updates }

    await redis.hset("payroll:leave_balances", {
      [employeeId]: updated,
    })

    return updated
  },

  async deductLeaveBalance(leave: Leave) {
    const balance = await this.getLeaveBalance(
      leave.employeeId
    )

    const key =
      leave.leaveType === "Casual"
        ? "casual"
        : leave.leaveType === "Sick"
        ? "sick"
        : "paid"

    await this.updateLeaveBalance(
      leave.employeeId,
      {
        [key]: Math.max(
          0,
          balance[key] - leave.days
        ),
      }
    )
  },

  /* =======================
   * LEAVES
   * ======================= */

  async getLeaves(): Promise<Leave[]> {
    const keys = await redis.keys("leave:*")
    if (keys.length === 0) return []

    const leaves = await redis.mget<Leave[]>(keys)
    return leaves.filter(Boolean) as Leave[]
  },

  async getLeavesByEmployeeId(
    employeeId: string
  ): Promise<Leave[]> {
    const leaves = await this.getLeaves()
    return leaves.filter(
      (l) => l.employeeId === employeeId
    )
  },

  async createLeave(leave: Leave): Promise<Leave> {
    await redis.set(leaveKey(leave.id), leave)
    return leave
  },

  async updateLeave(
    id: string,
    updates: Partial<Leave>
  ): Promise<Leave> {
    const leave = await redis.get<Leave>(
      leaveKey(id)
    )
    if (!leave) throw new Error("Leave not found")

    if (
      leave.status !== "Approved" &&
      updates.status === "Approved"
    ) {
      await this.deductLeaveBalance(leave)
    }

    const updated = { ...leave, ...updates }
    await redis.set(leaveKey(id), updated)

    return updated
  },

  /* =======================
   * ATTENDANCE
   * ======================= */

  async getAttendance(): Promise<Attendance[]> {
    const records =
      await redis.hgetall<Record<string, Attendance>>(
        "payroll:attendance"
      )

    if (!records) return []
    return Object.values(records)
  },

  /* =======================
   * DEDUCTIONS
   * ======================= */

  async getDeductions(): Promise<Deduction[]> {
    const deductions =
      await redis.hgetall<Record<string, Deduction>>(
        "payroll:deductions"
      )

    if (!deductions) return []
    return Object.values(deductions)
  },

  /* =======================
   * PAYROLL
   * ======================= */

  async getPayrollRuns(): Promise<PayrollRun[]> {
    const keys = await redis.keys("payroll-run:*")
    if (keys.length === 0) return []

    const runs = await redis.mget<PayrollRun[]>(keys)
    return runs.filter(Boolean) as PayrollRun[]
  },

  async getPayrollRunById(
    id: string
  ): Promise<PayrollRun | null> {
    return (
      await redis.get<PayrollRun>(
        `payroll-run:${id}`
      )
    ) ?? null
  },

  async addPayrollRun(
    payrollRun: PayrollRun
  ): Promise<PayrollRun> {
    await redis.set(
      `payroll-run:${payrollRun.id}`,
      payrollRun
    )
    return payrollRun
  },

  async updatePayrollRun(
    id: string,
    updates: Partial<PayrollRun>
  ): Promise<PayrollRun> {
    const run = await this.getPayrollRunById(id)
    if (!run) throw new Error("Payroll run not found")

    const updated = { ...run, ...updates }
    await redis.set(
      `payroll-run:${id}`,
      updated
    )

    return updated
  },

  /* =======================
   * PAYSLIPS
   * ======================= */

  async getPayslips(): Promise<Payslip[]> {
    const keys = await redis.keys("payslip:*")
    if (keys.length === 0) return []

    const slips = await redis.mget<Payslip[]>(keys)
    return slips.filter(Boolean) as Payslip[]
  },

  async addPayslip(
    payslip: Payslip
  ): Promise<Payslip> {
    await redis.set(
      `payslip:${payslip.id}`,
      payslip
    )
    return payslip
  },

  /* =======================
   * SALARY STRUCTURES
   * ======================= */

  async getSalaryStructures(): Promise<
    SalaryStructure[]
  > {
    const structures =
      await redis.hgetall<
        Record<string, SalaryStructure>
      >("payroll:salary_structures")

    if (!structures) return []
    return Object.values(structures)
  },

  async addSalaryStructure(
    structure: SalaryStructure
  ): Promise<SalaryStructure> {
    await redis.hset(
      "payroll:salary_structures",
      { [structure.id]: structure }
    )
    return structure
  },

  /* =======================
   * AUDIT LOGS
   * ======================= */

  async addAuditLog(
    log: AuditLog
  ): Promise<AuditLog> {
    await redis.set(
      `audit-log:${log.id}`,
      log
    )
    return log
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const keys = await redis.keys("audit-log:*")
    if (keys.length === 0) return []

    const logs = await redis.mget<AuditLog[]>(keys)

    return (logs.filter(Boolean) as AuditLog[]).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )
  },
}
