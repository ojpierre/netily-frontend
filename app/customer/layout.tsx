"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Wifi,
  Receipt,
  HelpCircle,
  Package,
  ChevronLeft,
  Gift,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { customerApi } from "@/lib/customer-api"
import { PortalThemeProvider, usePortalTheme } from "@/components/customer-portal/portal-theme-provider"

const navItems = [
  { name: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { name: "Plans", href: "/customer/plans", icon: Package },
  { name: "Payments", href: "/customer/payments", icon: CreditCard },
  { name: "Invoices", href: "/customer/invoices", icon: FileText },
  { name: "Usage", href: "/customer/usage", icon: BarChart3 },
  { name: "Receipts", href: "/customer/receipts", icon: Receipt },
  { name: "Rewards", href: "/customer/rewards", icon: Gift },
  { name: "Profile", href: "/customer/profile", icon: User },
  { name: "Support", href: "/customer/support", icon: HelpCircle },
]

const headerIconButton = "shrink-0 text-current hover:bg-black/10 hover:text-current dark:hover:bg-white/10"

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalThemeProvider>
      <CustomerPortalShell>{children}</CustomerPortalShell>
    </PortalThemeProvider>
  )
}

function CustomerPortalShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { applyServerTheme, forcedMode } = usePortalTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("My Account")

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  // Fetch company branding
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await customerApi.getPlans()
        applyServerTheme(res.portal_theme ?? res.branding?.portal_theme)
        if (res.branding) {
          if (res.branding.logo_url) setCompanyLogo(res.branding.logo_url)
          if (res.branding.company_name) setCompanyName(res.branding.company_name)
        }
      } catch {
        // Non-critical — fallback to defaults
      }
    }
    fetchBranding()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Don't wrap login/verify pages in portal layout
  if (
    pathname.startsWith("/customer/login") ||
    pathname.startsWith("/customer/verify")
  ) {
    return <>{children}</>
  }

  const handleLogout = () => {
    localStorage.removeItem("customerToken")
    localStorage.removeItem("customerRefreshToken")
    router.push("/customer/login")
  }

  return (
    <div className="portal-canvas min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Header */}
      <header className="portal-header sticky top-0 z-40 lg:hidden bg-sidebar border-b border-sidebar-border">
        {/* FIX: Changed h-14 to min-h-14 and added py-2 for wrapping */}
        <div className="flex min-h-14 items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className={headerIconButton}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Link href="/customer/dashboard" className="flex items-center gap-2 min-w-0 flex-1">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-8 h-8 rounded-lg object-contain shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
              )}
              {/* FIX: Replace truncate with wrap-friendly classes */}
              <span className="font-bold text-base text-current leading-tight break-words line-clamp-2 min-w-0">
                {companyName}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!forcedMode && <ThemeToggle className={headerIconButton} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Log out"
              className={headerIconButton}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`portal-sidebar fixed top-0 left-0 z-50 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${sidebarCollapsed ? "lg:w-[68px]" : "lg:w-60"} w-64`}
      >
        {/* Sidebar Header */}
        {/* FIX: Changed h-14 to min-h-14 and added py-2 for wrapping */}
        <div className="portal-header flex min-h-14 items-center justify-between px-4 py-2 border-b border-sidebar-border shrink-0">
          {!sidebarCollapsed && (
            <Link href="/customer/dashboard" className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-8 h-8 rounded-lg object-contain shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
              )}
              {/* FIX: Replace truncate with wrap-friendly classes */}
              <span className="font-bold text-base text-current leading-tight break-words line-clamp-2 min-w-0">
                {companyName}
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/customer/dashboard" className="mx-auto">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-8 h-8 rounded-lg object-contain" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
              )}
            </Link>
          )}
          {/* Close on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className={`lg:hidden ${headerIconButton}`}
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/customer/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                title={sidebarCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary font-semibold"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/70"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-1 shrink-0">
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
            {!forcedMode && <ThemeToggle />}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex text-sidebar-foreground hover:text-foreground"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full text-sidebar-foreground hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-red-950/30 ${
              sidebarCollapsed ? "justify-center px-0" : "justify-start"
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 lg:ml-60 ${
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-60"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}