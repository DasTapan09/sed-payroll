import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import type { SalaryStructure } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { payrollRunId } = await request.json()

    const payrollRun = await dataStore.getPayrollRunById(payrollRunId)
    if (!payrollRun) {
      return NextResponse.json(
        { error: "Payroll run not found" },
        { status: 404 }
      )
    }

    if (payrollRun.status !== "Draft") {
      return NextResponse.json(
        { error: "Payroll already processed" },
        { status: 400 }
      )
    }

    const employees = await dataStore.getEmployees()
    const salaryStructures = await dataStore.getSalaryStructures()

    const structureMap = new Map(
      salaryStructures.map((s) => [s.id, s])
    )

    for (const employee of employees) {
      if (!employee.isActive) continue

      const structure = structureMap.get(employee.salaryStructureId)
      if (!structure) continue

      const grossSalary =
        structure.basicSalary +
        structure.hra +
        structure.specialAllowance +
        structure.bonus +
        structure.variablePay

      const incomeTax = Math.round(grossSalary * 0.1)
      const providentFund = structure.employerPF
      const insurance = structure.insurance

      const totalDeductions =
        incomeTax + providentFund + insurance

      const netSalary = grossSalary - totalDeductions

      const payslip = {
        id: `payslip-${employee.id}-${payrollRun.id}`,
        employeeId: employee.id,
        payrollRunId: payrollRun.id,
        period: payrollRun.period,

        basicSalary: structure.basicSalary,
        hra: structure.hra,
        specialAllowance: structure.specialAllowance,
        bonus: structure.bonus,
        variablePay: structure.variablePay,

        grossSalary,
        incomeTax,
        providentFund,
        insurance,
        loanDeduction: 0,
        totalDeductions,
        netSalary,

        workingDays: 22,
        presentDays: 20,
        leaveDays: 2,
      }

      await dataStore.addPayslip(payslip)
    }

    const updatedRun = await dataStore.updatePayrollRun(payrollRun.id, {
      status: "Processed",
      processedDate: new Date().toISOString(),
      processedBy: "admin",
    })

    await dataStore.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: "admin",
      action: "PROCESS",
      entity: "payroll_run",
      entityId: payrollRun.id,
      changes: updatedRun,
    })

    return NextResponse.json(updatedRun)
  } catch (error) {
    console.error("PROCESS PAYROLL ERROR:", error)
    return NextResponse.json(
      { error: "Failed to process payroll" },
      { status: 500 }
    )
  }
}
