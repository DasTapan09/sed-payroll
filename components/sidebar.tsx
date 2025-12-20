"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, DollarSign, Calendar, FileText, BarChart3, Settings, Clock } from "lucide-react"
import { LogoutButton } from "./logout-button"

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, id: "nav-dashboard" },
  { name: "Employees", href: "/employees", icon: Users, id: "nav-employees" },
  { name: "Attendance", href: "/attendance", icon: Clock, id: "nav-attendance" },
  { name: "Leaves", href: "/leaves", icon: Calendar, id: "nav-leaves" },
  { name: "Payroll", href: "/payroll", icon: DollarSign, id: "nav-payroll" },
  { name: "Payslips", href: "/payslips", icon: FileText, id: "nav-payslips" },
  { name: "Reports", href: "/reports", icon: BarChart3, id: "nav-reports" },
  { name: "Settings", href: "/settings", icon: Settings, id: "nav-settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <DollarSign className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold text-foreground">SedPay</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              id={item.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">AD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@company.com</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}
