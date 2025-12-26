"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Payslip } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [payslip, setPayslip] = useState<Payslip | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const res = await fetch(`/api/employee/payslips/${id}`)
        if (!res.ok) throw new Error()

        const data = await res.json()
        setPayslip(data)
      } catch {
        toast({
          title: "Error",
          description: "Unable to load payslip",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPayslip()
  }, [id])

  if (loading) {
    return <p className="p-8 text-muted-foreground">Loading payslip…</p>
  }

  if (!payslip) {
    return <p className="p-8 text-muted-foreground">Payslip not found.</p>
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Payslip — {payslip.period}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Earnings */}
          <section>
            <h3 className="font-semibold mb-2">Earnings</h3>
            <div className="space-y-1 text-sm">
              <Row label="Basic Salary" value={payslip.basicSalary} />
              <Row label="HRA" value={payslip.hra} />
              <Row label="Special Allowance" value={payslip.specialAllowance} />
              <Row label="Bonus" value={payslip.bonus} />
              <Row label="Variable Pay" value={payslip.variablePay} />
            </div>
          </section>

          <Separator />

          {/* Deductions */}
          <section>
            <h3 className="font-semibold mb-2">Deductions</h3>
            <div className="space-y-1 text-sm">
              <Row label="Income Tax" value={payslip.incomeTax} />
              <Row label="Provident Fund" value={payslip.providentFund} />
              <Row label="Insurance" value={payslip.insurance} />
              <Row label="Loan Deduction" value={payslip.loanDeduction} />
            </div>
          </section>

          <Separator />

          {/* Summary */}
          <section className="space-y-1 text-sm font-medium">
            <Row label="Gross Salary" value={payslip.grossSalary} />
            <Row label="Total Deductions" value={payslip.totalDeductions} />
            <Row label="Net Salary" value={payslip.netSalary} bold />
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: number
  bold?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={bold ? "font-semibold" : ""}>
        ${value.toLocaleString()}
      </span>
    </div>
  )
}
