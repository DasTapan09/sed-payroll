"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmployeeFormDialog } from "@/components/employee-form-dialog"
import type { Employee, SalaryStructure } from "@/lib/types"
import { Search, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      const data = await response.json()
      console.log(data)
      setEmployees(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSalaryStructures = async () => {
    try {
      const response = await fetch("/api/salary-structures")
      const data = await response.json()
      setSalaryStructures(data)
    } catch (error) {
      console.error("Failed to fetch salary structures:", error)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchSalaryStructures()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast({
        title: "Employee deleted",
        description: "Employee has been removed successfully.",
      })

      fetchEmployees()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      })
    }
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between px-8">
            <h1 className="text-2xl font-bold text-foreground">Employees</h1>
            <EmployeeFormDialog salaryStructures={salaryStructures} onSuccess={fetchEmployees} />
          </div>
        </div>
        <div className="p-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Directory</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search-employees"
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <p className="text-muted-foreground">Loading employees...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No employees found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id} id={`employee-row-${employee.id}`}>
                          <TableCell className="font-medium">{employee.employeeId}</TableCell>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.designation}</TableCell>
                          <TableCell>
                            <Badge variant={employee.employmentType === "Full-time" ? "default" : "secondary"}>
                              {employee.employmentType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.isActive ? "default" : "secondary"}>
                              {employee.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <EmployeeFormDialog
                                salaryStructures={salaryStructures}
                                onSuccess={fetchEmployees}
                                employee={employee}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(employee.id)}
                                id={`delete-employee-${employee.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
