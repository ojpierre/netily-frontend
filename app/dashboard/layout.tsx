"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/app/auth-context"
import { Button } from "@/components/ui/button"
import { PageTransition, AnimatedNavItem } from "@/components/page-transition"
import {
  LayoutDashboard,
  User,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Zap,
  Gift,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/recharge", label: "Recharge", icon: CreditCard },
  { href: "/dashboard/usage-history", label: "Usage History", icon: BarChart3 },
  { href: "/dashboard/loyalty", label: "Loyalty Rewards", icon: Gift },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Mock user for demo mode
  const currentUser = user || {
    full_name: "Demo User",
    email: "demo@netily.com"
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">Netily</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">Netily</span>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{currentUser.full_name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          {!user && (
            <div className="mt-3 p-2 bg-primary/10 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-primary dark:text-primary/60">Demo Mode Active</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <AnimatedNavItem key={item.href} isActive={isActive}>
                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`relative flex items-center gap-3 overflow-hidden px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "text-white font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="dashboard-active-nav"
                        className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon className="relative z-10 w-5 h-5" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </AnimatedNavItem>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          {user ? (
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive/10 dark:hover:bg-red-950 hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          ) : (
            <Link href="/customer/login">
              <Button className="w-full">
                Login to Account
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  )
}
