"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Payslip } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function EmployeePayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const router = useRouter()

  const fetchPayslips = async () => {
    try {
      const res = await fetch("/api/employee/payslips")
      if (!res.ok) throw new Error("Failed")

      const data = await res.json()
      setPayslips(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load payslips",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayslips()
  }, [])

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>My Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading payslips...</p>
          ) : payslips.length === 0 ? (
            <p className="text-muted-foreground">
              No payslips available yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow 
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/employee/payslips/${p.id}`)}
                  >
                    <TableCell className="font-medium">
                      {p.period}
                    </TableCell>
                    <TableCell>
                      ${p.grossSalary.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ${p.totalDeductions.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ${p.netSalary.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        Available
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
