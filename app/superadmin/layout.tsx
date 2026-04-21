"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  Bell,
  BarChart3,
  Package,
  ScrollText,
  Newspaper, // Added for Changelogs
  Megaphone, // Added for Platform Updates
  Lightbulb, // Added for Feature Roadmap
  UserPlus, // Leads
  BookOpen, // User Ledger
} from "lucide-react"
import { SuperAdminAuthProvider, useSuperAdminAuth } from "./superadmin-auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// ── Navigation ──

const navItems = [
  { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
  { name: "Tenants", href: "/superadmin/tenants", icon: Building2 },
  { name: "Plans", href: "/superadmin/plans", icon: Package },
  { name: "Users", href: "/superadmin/users", icon: Users },
  { name: "Payments", href: "/superadmin/payments", icon: CreditCard },
  { name: "Sub. Payments", href: "/superadmin/subscription-payments", icon: CreditCard },
  { name: "Leads", href: "/superadmin/leads", icon: UserPlus },
  { name: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
  { name: "Activity", href: "/superadmin/activity", icon: Activity },
  { name: "Audit Log", href: "/superadmin/audit-log", icon: ScrollText },
  { name: "User Ledger", href: "/superadmin/user-ledger", icon: BookOpen },
  // ── Platform Management Section ──
  { name: "Changelogs", href: "/superadmin/changelogs", icon: Megaphone }, // Platform Updates
  { name: "Roadmap", href: "/superadmin/roadmap", icon: Lightbulb }, // Feature Roadmap
  { name: "Settings", href: "/superadmin/settings", icon: Settings },
]

// ── Inner layout (needs auth context) ──

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, logout, loading } = useSuperAdminAuth()

  const isPublicPage = pathname === "/superadmin/login"

  useEffect(() => setMounted(true), [])

  // Public pages render without shell
  if (isPublicPage) return <>{children}</>

  if (!mounted) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Loading Superadmin…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Checking authentication…</p>
        </div>
      </div>
    )
  }

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "SA"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Netily</h1>
            <span className="text-[11px] text-violet-400 font-medium">SUPERADMIN</span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/superadmin"
                ? pathname === "/superadmin"
                : pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom user area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-violet-500/40">
              <AvatarFallback className="bg-violet-700 text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-slate-300" />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-violet-500/50 text-violet-300 hidden sm:flex">
              <Shield className="w-3 h-3 mr-1" />
              Superadmin
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Avatar className="h-7 w-7 mr-2">
                    <AvatarFallback className="bg-violet-700 text-white text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

// ── Root layout ──

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminAuthProvider>
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </SuperAdminAuthProvider>
  )
}