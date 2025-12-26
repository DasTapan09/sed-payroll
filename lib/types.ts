export type EmploymentType = "Full-time" | "Contract" | "Part-time"
export type LeaveType = "Casual" | "Sick" | "Paid" | "Unpaid"
export type AttendanceStatus = "Present" | "Absent" | "Half-day" | "WFH"
export type UserRole = "admin" | "employee"
export type PayrollStatus = "Draft" | "Processed" | "Locked"

export interface User {
  id: string
  email: string
  passwordHash: string
  role: UserRole
  employeeId?: string
}

export interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  phone: string
  dateOfJoining: string
  department: string
  designation: string
  employmentType: EmploymentType
  bankAccount: string
  ifscCode: string
  taxId: string
  salaryStructureId: string
  isActive: boolean
}

export interface SalaryStructure {
  id: string
  name: string
  basicSalary: number
  hra: number
  specialAllowance: number
  bonus: number
  variablePay: number
  employerPF: number
  insurance: number
  effectiveFrom: string
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  status: AttendanceStatus
  overtimeHours: number
  notes?: string
  checkInTime?: string
  checkOutTime?: string
}

export interface Leave {
  id: string
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: "Pending" | "Approved" | "Rejected"
  approvedBy?: string
}

export interface LeaveBalance {
  employeeId: string
  casual: number
  sick: number
  paid: number
}

export interface Deduction {
  id: string
  name: string
  type: "percentage" | "fixed"
  value: number
  applicableToAll: boolean
}

export interface PayrollRun {
  id: string
  period: string
  startDate: string
  endDate: string
  status: PayrollStatus
  processedDate?: string
  processedBy?: string
}

export interface Payslip {
  id: string
  employeeId: string
  payrollRunId: string
  period: string
  basicSalary: number
  hra: number
  specialAllowance: number
  bonus: number
  variablePay: number
  grossSalary: number
  incomeTax: number
  providentFund: number
  insurance: number
  loanDeduction: number
  totalDeductions: number
  netSalary: number
  workingDays: number
  presentDays: number
  leaveDays: number
}

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  action: string
  entity: string
  entityId: string
  changes: Record<string, any>
}
