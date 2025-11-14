"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/auth-context"
import { LogOut, BarChart3, CreditCard, FileText, User, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/recharge", label: "Recharge", icon: CreditCard },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/usage-history", label: "Usage History", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Notifications", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: User },
  { href: "/dashboard/support", label: "Support", icon: MessageSquare },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-blue-900 text-white p-6 overflow-y-auto">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="font-bold text-blue-900">N</span>
          </div>
          <span className="text-xl font-bold">Netily</span>
        </Link>

        <div className="mb-8 pb-8 border-b border-blue-800">
          <p className="text-blue-100 text-sm">Welcome</p>
          <p className="text-white font-semibold">{user.name}</p>
          <p className="text-blue-100 text-sm">{user.email}</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <button
          onClick={() => {
            logout()
            router.push("/")
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors mt-8"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Netily Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-600">{user.name}</span>
              <Button
                variant="outline"
                onClick={() => {
                  logout()
                  router.push("/")
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
