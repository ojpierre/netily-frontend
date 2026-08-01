"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MjengoFooter } from "@/components/mjengo-footer"
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
  Megaphone,
  MessageSquareText,
  Sparkles,
  Map as MapIcon,
  Download,   // ← ADDED
} from "lucide-react"
import { AdminAuthProvider, useAdminAuth } from "./admin-auth-context"
import { PageTransition, AnimatedNavItem } from "@/components/page-transition"
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
import { ThemeToggle } from "@/components/theme-toggle"
import { RoleGuard } from "@/components/role-guard"
import { NetilySupportChat } from "@/components/netily-support-chat"
import { usePwaInstall } from "@/hooks/use-pwa-install"   // ← ADDED
import { toast } from "sonner"                            // ← ADDED
import {
  ADMIN_ROLES,
  ENGAGEMENT_ROLES,
  FINANCE_ROLES,
  NETWORK_ROLES,
  OPERATIONS_ROLES,
  SUPPORT_ROLES,
  USER_MANAGEMENT_ROLES,
  canAccess,
  getAccessRuleForPath,
  setRoleAccessPolicies,
  type AccessRule,
} from "@/lib/rbac"

type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
} & AccessRule

type NavigationSection = {
  title: string
  items: NavigationItem[]
} & AccessRule

// Navigation organized by sections
const navigationSections: NavigationSection[] = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Users", href: "/admin/users", icon: Users, allowedRoles: USER_MANAGEMENT_ROLES },
      { name: "Staff", href: "/admin/staff", icon: UserCog, allowedRoles: ADMIN_ROLES },
      { name: "Plans", href: "/admin/plans", icon: Package, allowedRoles: ADMIN_ROLES },
    ],
  },
  {
    title: "Network",
    allowedRoles: NETWORK_ROLES,
    allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
    items: [
      { name: "OLT Management", href: "/admin/olt", icon: Server },
      { name: "ONU Devices", href: "/admin/onu", icon: Box },
      { name: "Routers", href: "/admin/routers", icon: Wifi },
      { name: "IPv4 Networks", href: "/admin/networks", icon: Network },
      { name: "RADIUS", href: "/admin/radius", icon: Key },
      { name: "FUP", href: "/admin/fup", icon: Gauge },
      { name: "Usage", href: "/admin/usage", icon: BarChart3 },
      { name: "Fiber Map", href: "/admin/network-map", icon: MapIcon },
    ],
  },
  {
    title: "Finance",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    items: [
      { name: "Invoices", href: "/admin/invoices", icon: Receipt },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Receipts", href: "/admin/receipts", icon: FileText },
      { name: "Vouchers", href: "/admin/vouchers", icon: QrCode },
      { name: "Payment Methods", href: "/admin/payment-methods", icon: Banknote },
      { name: "Reports", href: "/admin/analytics", icon: TrendingUp },
    ],
  },
  {
    title: "Billing & Payouts",
    allowedRoles: FINANCE_ROLES,
    allowedDepartments: ["finance", "accounting", "billing", "accounts"],
    items: [
      { name: "Subscription", href: "/admin/settings/billing", icon: CreditCard },
    ],
  },
  {
    title: "Operations",
    allowedRoles: OPERATIONS_ROLES,
    items: [
      { name: "Dispatch", href: "/admin/dispatch", icon: Truck },
      { name: "Inventory", href: "/admin/inventory", icon: Warehouse },
    ],
  },
  {
    title: "Engagement",
    items: [
      { name: "Tickets", href: "/admin/tickets", icon: Ticket, allowedRoles: [...SUPPORT_ROLES, "technician"] },
      { name: "Leads", href: "/admin/leads", icon: UserPlus, allowedRoles: ENGAGEMENT_ROLES },
      { name: "Loyalty", href: "/admin/loyalty", icon: Gift, allowedRoles: ENGAGEMENT_ROLES },
      { name: "SMS", href: "/admin/sms", icon: MessageSquare, allowedRoles: [...ENGAGEMENT_ROLES, "accountant"] },
      { name: "Ads", href: "/admin/ads", icon: Image, allowedRoles: ENGAGEMENT_ROLES },
    ],
  },
  {
    title: "System",
    allowedRoles: ADMIN_ROLES,
    items: [
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Logs", href: "/admin/logs", icon: FileText },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
]

// Bottom navigation items for Community features
const bottomNavItems = [
  { name: "What's New", href: "/admin/whats-new", icon: Sparkles },
  { name: "Community Board", href: "/admin/community", icon: MessageSquareText },
]

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("Netily Admin")
  const [accessPolicyVersion, setAccessPolicyVersion] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, loading } = useAdminAuth()

  // ── PWA Install hook ──
  const { canInstall, promptInstall } = usePwaInstall()

  // ── Register manifest + service worker ──
  useEffect(() => {
    if (typeof window === "undefined") return

    // Inject manifest link
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link")
      link.rel = "manifest"
      link.href = "/api/manifest"
      document.head.appendChild(link)
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silently fail – PWA is still functional without SW registration
      })
    }
  }, [])

  // Check if we're on a public/special page handled outside tenant admin auth.
  const isPublicPage = pathname?.startsWith('/admin/login') || pathname?.startsWith('/admin/selfie')

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load tenant branding for the sidebar header and keep localStorage in sync.
  useEffect(() => {
    const saved = localStorage.getItem("netily_company_logo")
    if (saved) setCompanyLogo(saved)
    const savedName = localStorage.getItem("netily_company_name")
    if (savedName) setCompanyName(savedName)

    const fetchBranding = async () => {
      try {
        const { adminApi } = await import("@/lib/admin-api")
        const branding = await adminApi.getTenantBranding()
        const logoUrl = branding.logo_url || branding.logo || ""
        if (logoUrl) {
          setCompanyLogo(logoUrl)
          localStorage.setItem("netily_company_logo", logoUrl)
        }
        if (branding.name) {
          setCompanyName(branding.name)
          localStorage.setItem("netily_company_name", branding.name)
        }
      } catch {
        // Branding is decorative; auth/navigation should never depend on it.
      }
    }
    if (user && !isPublicPage) fetchBranding()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "netily_company_logo") setCompanyLogo(e.newValue || "")
      if (e.key === "netily_company_name") setCompanyName(e.newValue || "Netily Admin")
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [user, isPublicPage])

  // Fetch unread notification count
  useEffect(() => {
    if (!mounted || !user) return
    const notificationsRule = getAccessRuleForPath("/admin/notifications")
    if (notificationsRule && !canAccess(user, notificationsRule)) {
      setUnreadNotifCount(0)
      return
    }
    const fetchCount = async () => {
      try {
        const { adminApi } = await import("@/lib/admin-api")
        const count = await adminApi.getUnreadNotificationCount()
        setUnreadNotifCount(count)
      } catch {
        // silently ignore
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60_000)
    return () => clearInterval(interval)
  }, [mounted, user, accessPolicyVersion])

  useEffect(() => {
    if (!mounted || !user || isPublicPage) return
    const loadRoleAccess = async () => {
      try {
        const { adminApi } = await import("@/lib/admin-api")
        const policy = await adminApi.getMyRoleAccessPolicy()
        setRoleAccessPolicies(policy.is_unrestricted ? [] : [policy])
        setAccessPolicyVersion((value) => value + 1)
      } catch {
        // Fall back to built-in RBAC map if the policy endpoint is unavailable.
      }
    }
    loadRoleAccess()
    window.addEventListener("netily-role-access-updated", loadRoleAccess)
    return () => window.removeEventListener("netily-role-access-updated", loadRoleAccess)
  }, [mounted, user, isPublicPage])

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log('AdminLayout state:', { loading, user: user?.email || user?.username, isPublicPage, mounted, pathname })
    }
  }, [loading, user, isPublicPage, mounted, pathname])

  // FORCE REDIRECT IF NO USER FOUND
  useEffect(() => {
    if (!loading && !user && !isPublicPage && mounted) {
      console.log('AdminLayout: No user found, forcing redirect to login')
      router.push("/admin/login")
    }
  }, [loading, user, isPublicPage, mounted, router])

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user after loading, show redirecting message
  // The useEffect above will handle the actual redirect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="animate-pulse font-medium text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const filteredSections = navigationSections
    .map((section) => {
      const items = section.items.filter((item) => {
        const inheritedRule = {
          ...item,
          allowedRoles: item.allowedRoles || section.allowedRoles,
          allowedDepartments: item.allowedDepartments || section.allowedDepartments,
        }
        return canAccess(user, inheritedRule)
      })
      return { ...section, items }
    })
    .filter((section) => section.items.length > 0)
  const routeAccessRule = getAccessRuleForPath(pathname)

  // ── Install App handler ──
  const handleInstallApp = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      toast.success("App installed! You can now launch it from your desktop or start menu.")
    }
  }

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          {!sidebarCollapsed && (
            <Link href="/admin" className="flex min-w-0 items-center gap-2">
              {companyLogo ? (
                <img src={companyLogo} alt="Company Logo" className="h-8 w-8 shrink-0 rounded-lg object-contain bg-white border border-slate-200" />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-sm">
                  N
                </div>
              )}
              <span className="block w-40 whitespace-normal wrap-break-word text-sm font-bold leading-tight text-foreground tracking-tight">
                {companyName}
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 overflow-y-auto py-4 px-2">
          {filteredSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-5" : ""}>
              {!sidebarCollapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {section.title}
                </p>
              )}
              {sidebarCollapsed && sectionIndex > 0 && (
                <Separator className="my-2 bg-border" />
              )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                    return (
                      <AnimatedNavItem key={item.name} isActive={isActive}>
                        <Link
                          href={item.href}
                          className={`relative flex items-center gap-3 overflow-hidden px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                            isActive
                              ? "text-white shadow-sm"
                              : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="admin-active-nav"
                              className="absolute inset-0 rounded-lg bg-primary"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            />
                          )}
                          <item.icon className="relative z-10 w-[18px] h-[18px] shrink-0" />
                          {!sidebarCollapsed && (
                            <span className="relative z-10 font-medium">{item.name}</span>
                          )}
                        </Link>
                      </AnimatedNavItem>
                    )
                  })}
                </ul>
            </div>
          ))}

          {/* Bottom navigation items (Community features) - always at the bottom */}
          <Separator className="my-4 bg-border" />
          <div>
            {!sidebarCollapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Netily Community
              </p>
            )}
            <ul className="space-y-0.5">
              {bottomNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <AnimatedNavItem key={item.name} isActive={isActive}>
                    <Link
                      href={item.href}
                      className={`relative flex items-center gap-3 overflow-hidden px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                        isActive
                          ? "text-white shadow-sm"
                          : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="admin-active-nav"
                          className="absolute inset-0 rounded-lg bg-primary"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <item.icon className="relative z-10 w-[18px] h-[18px] shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="relative z-10 font-medium">{item.name}</span>
                      )}
                    </Link>
                  </AnimatedNavItem>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Trial countdown for sidebar (compact) */}
          {!sidebarCollapsed && (
            <div className="lg:hidden">
              <TrialCountdownCompact />
            </div>
          )}
          <Button
            variant="ghost"
            size={sidebarCollapsed ? "icon" : "default"}
            className="w-full text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-4 backdrop-blur lg:px-6">
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users, routers, logs..."
                className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Trial Countdown */}
            <div className="hidden md:block">
              <TrialCountdown />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <Link href="/admin/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-white text-xs">
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" alt="Admin" />
                    <AvatarFallback className="bg-primary text-white">
                      {user?.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.username || "Admin"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email || "admin@netily.com"}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* ── Install App (conditional) ── */}
                {canInstall && (
                  <>
                    <DropdownMenuItem onClick={handleInstallApp}>
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <PageTransition>
            <TrialGuard>
              {routeAccessRule ? (
                <RoleGuard
                  areaLabel={routeAccessRule.label}
                  pathPrefix={routeAccessRule.pathPrefix}
                  allowedRoles={routeAccessRule.allowedRoles}
                  allowedDepartments={routeAccessRule.allowedDepartments}
                >
                  {children}
                </RoleGuard>
              ) : (
                children
              )}
            </TrialGuard>
            <MjengoFooter />
          </PageTransition>
        </main>
        <NetilySupportChat />
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