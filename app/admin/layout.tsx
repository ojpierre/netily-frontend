"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Wifi,
  Package,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  User,
  ChevronDown,
  MessageSquare,
  Image,
  Gift,
  Ticket,
  UserPlus,
  Network,
  Gauge,
  TrendingUp,
  Server,
  Box,
  Globe,
  Truck,
  Warehouse,
  Receipt,
  Calendar,
  Banknote,
  QrCode,
  UserCog,
  DollarSign,
  ArrowRightLeft,
  Shield,
  Key,
  Radio,
} from "lucide-react"
import { AdminAuthProvider, useAdminAuth } from "./admin-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrialCountdown, TrialCountdownCompact } from "@/components/trial-countdown"
import { TrialGuard } from "@/components/trial-guard"

// Navigation organized by sections
const navigationSections = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Staff", href: "/admin/staff", icon: UserCog },
      { name: "Plans", href: "/admin/plans", icon: Package },
    ],
  },
  {
    title: "Network",
    items: [
      { name: "OLT Management", href: "/admin/olt", icon: Server },
      { name: "ONU Devices", href: "/admin/onu", icon: Box },
      { name: "Routers", href: "/admin/routers", icon: Wifi },
      { name: "Hotspot", href: "/admin/hotspot", icon: Radio },
      { name: "IPv4 Networks", href: "/admin/networks", icon: Network },
      { name: "VPN", href: "/admin/vpn", icon: Shield },
      { name: "RADIUS", href: "/admin/radius", icon: Key },
      { name: "FUP", href: "/admin/fup", icon: Gauge },
      { name: "Usage", href: "/admin/usage", icon: BarChart3 },
    ],
  },
  {
    title: "Finance",
    items: [
      { name: "Billing Cycles", href: "/admin/billing-cycles", icon: Calendar },
      { name: "Invoices", href: "/admin/invoices", icon: Receipt },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Receipts", href: "/admin/receipts", icon: FileText },
      { name: "Vouchers", href: "/admin/vouchers", icon: QrCode },
      { name: "Payment Methods", href: "/admin/payment-methods", icon: Banknote },
      { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    ],
  },
  {
    title: "Billing & Payouts",
    items: [
      { name: "Subscription", href: "/admin/settings/billing", icon: CreditCard },
      { name: "Payout Settings", href: "/admin/settings/payouts", icon: DollarSign },
      { name: "Settlements", href: "/admin/settings/settlements", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Dispatch", href: "/admin/dispatch", icon: Truck },
      { name: "Inventory", href: "/admin/inventory", icon: Warehouse },
    ],
  },
  {
    title: "Engagement",
    items: [
      { name: "Tickets", href: "/admin/tickets", icon: Ticket },
      { name: "Leads", href: "/admin/leads", icon: UserPlus },
      { name: "Loyalty", href: "/admin/loyalty", icon: Gift },
      { name: "SMS", href: "/admin/sms", icon: MessageSquare },
      { name: "Ads", href: "/admin/ads", icon: Image },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Logs", href: "/admin/logs", icon: FileText },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
]

// Flat navigation for easy iteration
const navigation = navigationSections.flatMap(section => section.items)

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, loading } = useAdminAuth()

  // Check if we're on a public page (login or register)
  const isPublicPage = pathname?.startsWith('/admin/login') || pathname?.startsWith('/admin/register')

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('AdminLayout state:', { loading, user: user?.email || user?.username, isPublicPage, mounted, pathname })
  }, [loading, user, isPublicPage, mounted, pathname])

  // Middleware already handles route protection, so we don't need client-side redirect
  // Just show appropriate UI based on auth state

  // For login page, render without sidebar/header
  if (isPublicPage) {
    return <>{children}</>
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user after loading, middleware will handle redirect
  // Show loading state briefly while middleware redirects
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-500">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" suppressHydrationWarning>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          {!sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                N
              </div>
              <span className="font-bold text-lg">Netily Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-4" : ""}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {sidebarCollapsed && sectionIndex > 0 && (
                <Separator className="my-2 bg-slate-700" />
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                        }`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="font-medium">{item.name}</span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Trial countdown for sidebar (compact) */}
          {!sidebarCollapsed && (
            <div className="lg:hidden">
              <TrialCountdownCompact />
            </div>
          )}
          <Button
            variant="ghost"
            size={sidebarCollapsed ? "icon" : "default"}
            className="w-full text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu className="w-5 h-5" />
            {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        {/* Top navigation bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search users, routers, logs..."
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Trial Countdown */}
            <div className="hidden md:block">
              <TrialCountdown />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
                3
              </Badge>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" alt="Admin" />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user?.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.username || "Admin"}</span>
                    <span className="text-xs text-slate-500">{user?.email || "admin@netily.com"}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <TrialGuard>{children}</TrialGuard>
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
