"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, MotionConfig } from "framer-motion"
import { MjengoFooter } from "@/components/mjengo-footer"
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
  ChevronRight,
  Bell,
  BarChart3,
  Package,
  ScrollText,
  FileText,
  Megaphone,
  Lightbulb,
  UserPlus,
  UserCog,
  BookOpen,
  Headphones,
  MessageSquareText,
  Gift,
  Server,
  GraduationCap,
  ShoppingBag,
  Palette,
  Landmark,
  Wallet,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react"
import { SuperAdminAuthProvider, useSuperAdminAuth } from "./superadmin-auth-context"
import { Button } from "@/components/ui/button"
import { SessionInactivityGuard } from "@/components/session-inactivity-guard"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { safeStorage } from "@/lib/safe-storage"

// ── Navigation ──

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  /** Other routes that should keep this item highlighted (pages reached from it). */
  alsoActiveFor?: string[]
}

type NavSection = { title: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
      { name: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
      { name: "Server Stats", href: "/superadmin/server-stats", icon: Server },
    ],
  },
  {
    title: "Tenants",
    items: [
      { name: "Tenants", href: "/superadmin/tenants", icon: Building2 },
      { name: "Plans", href: "/superadmin/plans", icon: Package },
      { name: "Users", href: "/superadmin/users", icon: Users },
      { name: "User Ledger", href: "/superadmin/user-ledger", icon: BookOpen },
    ],
  },
  {
    title: "Billing & Revenue",
    items: [
      { name: "Payments", href: "/superadmin/payments", icon: CreditCard },
      { name: "Subscription Payments", href: "/superadmin/subscription-payments", icon: Wallet },
      { name: "Subscription Invoices", href: "/superadmin/subscription-invoices", icon: FileText },
      { name: "Subscription Reminders", href: "/superadmin/subscription-reminders", icon: Bell },
      {
        name: "Financial Reports",
        href: "/superadmin/financial-reports",
        icon: Landmark,
        alsoActiveFor: ["/superadmin/expenditure", "/superadmin/expenditure-2"],
      },
    ],
  },
  {
    title: "Growth",
    items: [
      { name: "Leads", href: "/superadmin/leads", icon: UserPlus },
      { name: "Referrals", href: "/superadmin/referrals", icon: Gift },
      { name: "Shop", href: "/superadmin/shop", icon: ShoppingBag },
      { name: "Academy", href: "/superadmin/academy", icon: GraduationCap },
    ],
  },
  {
    title: "Support & Messaging",
    items: [
      { name: "Live Chat", href: "/superadmin/support-chat", icon: Headphones },
      { name: "SMS", href: "/superadmin/sms", icon: MessageSquareText },
      { name: "Support Execs", href: "/superadmin/support", icon: UserCog },
    ],
  },
  {
    title: "Platform",
    items: [
      { name: "Changelogs", href: "/superadmin/changelogs", icon: Megaphone },
      { name: "Roadmap", href: "/superadmin/roadmap", icon: Lightbulb },
      { name: "Activity", href: "/superadmin/activity", icon: Activity },
      { name: "Audit Log", href: "/superadmin/audit-log", icon: ScrollText },
      { name: "Settings", href: "/superadmin/settings", icon: Settings },
    ],
  },
]

const COLLAPSED_KEY = "netily-superadmin-sidebar-collapsed"
const CLOSED_SECTIONS_KEY = "netily-superadmin-sidebar-closed-sections"

/** Exact route or a sub-route; "/superadmin/support" must not match "/superadmin/support-chat". */
function routeMatches(pathname: string, href: string) {
  if (href === "/superadmin") return pathname === "/superadmin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isItemActive(pathname: string, item: NavItem) {
  return routeMatches(pathname, item.href) || (item.alsoActiveFor ?? []).some((href) => routeMatches(pathname, href))
}

// ── Inner layout (needs auth context) ──

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [closedSections, setClosedSections] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname() || ""
  const { user, logout, loading } = useSuperAdminAuth()

  const isPublicPage = pathname === "/superadmin/login"

  useEffect(() => {
    setMounted(true)
    setCollapsed(safeStorage.get(COLLAPSED_KEY) === "1")
    try {
      const saved = JSON.parse(safeStorage.get(CLOSED_SECTIONS_KEY) || "[]")
      if (Array.isArray(saved)) setClosedSections(saved.filter((value) => typeof value === "string"))
    } catch {}
  }, [])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen])

  const activeSection = useMemo(
    () => navSections.find((section) => section.items.some((item) => isItemActive(pathname, item))),
    [pathname],
  )
  const activeItem = activeSection?.items.find((item) => isItemActive(pathname, item))

  const trimmedQuery = query.trim().toLowerCase()
  const visibleSections = useMemo(() => {
    if (!trimmedQuery) return navSections
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.name.toLowerCase().includes(trimmedQuery) || section.title.toLowerCase().includes(trimmedQuery),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [trimmedQuery])

  // Public pages render without shell
  if (isPublicPage) return <>{children}</>

  if (!mounted) return null

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">{loading ? "Loading Superadmin…" : "Checking authentication…"}</p>
        </div>
      </div>
    )
  }

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "SA"
  // The collapsed rail only applies on desktop; the mobile drawer is always full width.
  const rail = collapsed && !sidebarOpen

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    if (next) safeStorage.set(COLLAPSED_KEY, "1")
    else safeStorage.remove(COLLAPSED_KEY)
  }

  const setSectionOpen = (title: string, open: boolean) => {
    setClosedSections((current) => {
      const next = open ? current.filter((value) => value !== title) : [...new Set([...current, title])]
      safeStorage.set(CLOSED_SECTIONS_KEY, JSON.stringify(next))
      return next
    })
  }

  const expandAndSearch = () => {
    setCollapsed(false)
    safeStorage.remove(COLLAPSED_KEY)
    window.setTimeout(() => searchRef.current?.focus(), 60)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Floating sidebar */}
        <aside
          aria-label="Superadmin navigation"
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-[transform,width] duration-200 lg:inset-y-4 lg:left-4 lg:translate-x-0 lg:rounded-2xl lg:border ${
            rail ? "lg:w-16" : "lg:w-64"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Brand */}
          <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 ${rail ? "lg:justify-center lg:px-0" : ""} px-4`}>
            <Link href="/superadmin" className="flex min-w-0 items-center gap-3" title="Superadmin dashboard">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 shadow-lg shadow-violet-900/40">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className={rail ? "lg:hidden" : ""}>
                <p className="text-base font-bold leading-none text-white">Netily</p>
                <span className="text-[10px] font-semibold tracking-[0.18em] text-violet-400">SUPERADMIN</span>
              </div>
            </Link>
            <button
              type="button"
              className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Page search */}
          <div className={`shrink-0 px-3 pt-3 ${rail ? "lg:px-2" : ""}`}>
            {rail ? (
              <button
                type="button"
                onClick={expandAndSearch}
                className="hidden h-10 w-full items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:flex"
                title="Search pages"
                aria-label="Search pages"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            ) : null}
            <div className={`relative ${rail ? "lg:hidden" : ""}`}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setQuery("")
                }}
                placeholder="Search pages"
                aria-label="Search pages"
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>

          {/* Nav sections */}
          <nav className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 ${rail ? "lg:px-2" : ""} [scrollbar-width:thin] [scrollbar-color:rgb(51_65_85)_transparent]`}>
            {visibleSections.length === 0 && (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-medium text-slate-300">No pages match “{query.trim()}”</p>
                <button type="button" onClick={() => setQuery("")} className="mt-2 text-xs font-semibold text-violet-400 hover:text-violet-300">
                  Clear search
                </button>
              </div>
            )}

            {visibleSections.map((section, sectionIndex) => {
              const isActiveSection = section.title === activeSection?.title
              // Searching, the rail, and the current section are always open.
              const open = Boolean(trimmedQuery) || rail || isActiveSection || !closedSections.includes(section.title)
              return (
                <Collapsible
                  key={section.title}
                  open={open}
                  onOpenChange={(next) => {
                    if (trimmedQuery || rail || isActiveSection) return
                    setSectionOpen(section.title, next)
                  }}
                  className={sectionIndex > 0 ? "mt-4" : ""}
                >
                  {rail ? (
                    sectionIndex > 0 && <div className="mx-2 mb-3 hidden h-px bg-slate-800 lg:block" />
                  ) : null}
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        isActiveSection ? "text-violet-300" : "text-slate-500 hover:bg-slate-800/70 hover:text-slate-200"
                      } ${rail ? "lg:hidden" : ""}`}
                      aria-label={`${section.title} section`}
                    >
                      <span>{section.title}</span>
                      {!isActiveSection && !trimmedQuery && (
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isItemActive(pathname, item)
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              title={rail ? item.name : undefined}
                              className={`relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 ${
                                rail ? "lg:justify-center lg:px-0" : ""
                              } ${active ? "text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="superadmin-active-nav"
                                  className="absolute inset-0 rounded-lg bg-violet-600 shadow-lg shadow-violet-900/40"
                                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                />
                              )}
                              <item.icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
                              <span className={`relative z-10 truncate ${rail ? "lg:hidden" : ""}`}>{item.name}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </nav>

          {/* Footer: account + collapse */}
          <div className={`shrink-0 space-y-2 border-t border-slate-800 p-3 ${rail ? "lg:px-2" : ""}`}>
            <div className={`flex items-center gap-3 rounded-xl px-1 py-1 ${rail ? "lg:justify-center lg:px-0" : ""}`}>
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-violet-500/40" title={rail ? `${user.first_name} ${user.last_name}` : undefined}>
                <AvatarFallback className="bg-violet-700 text-xs text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className={`min-w-0 flex-1 ${rail ? "lg:hidden" : ""}`}>
                <p className="truncate text-sm font-medium text-white">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ${collapsed ? "lg:pl-24" : "lg:pl-72"}`}>
          {/* Floating top bar. Fixed (not sticky) so it stays put when menus lock page scroll. */}
          <header
            className={`fixed inset-x-0 top-0 z-40 flex h-14 min-w-0 items-center gap-2 border-b border-slate-800 bg-slate-900/85 px-3 shadow-lg shadow-black/20 backdrop-blur-xl transition-[left] duration-200 sm:h-16 sm:px-4 lg:right-6 lg:top-4 lg:rounded-2xl lg:border lg:px-5 ${
              collapsed ? "lg:left-24" : "lg:left-72"
            }`}
          >
            <button
              type="button"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Where am I */}
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex min-w-0 items-center gap-1.5 text-sm">
                {activeSection && activeSection.title !== "Overview" && (
                  <>
                    <li className="hidden shrink-0 text-slate-500 sm:block">{activeSection.title}</li>
                    <li className="hidden shrink-0 text-slate-600 sm:block" aria-hidden="true">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </li>
                  </>
                )}
                <li className="truncate font-semibold text-white">{activeItem?.name ?? "Superadmin"}</li>
              </ol>
            </nav>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button asChild variant="ghost" className="h-10 min-w-10 gap-2 px-2.5 text-slate-200 hover:bg-slate-800 hover:text-white">
                <Link href="/admin/brand-guide" aria-label="Open brand guide" title="Brand guide">
                  <Palette className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden xl:inline">Brand guide</span>
                </Link>
              </Button>
              <Button asChild className="h-10 min-w-10 gap-2 bg-violet-600 px-3 text-white hover:bg-violet-500">
                <Link href="/admin/selfie" aria-label="Register a new tenant" title="Register tenant">
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">Register tenant</span>
                </Link>
              </Button>
              <Badge variant="outline" className="hidden border-violet-500/50 text-violet-300 xl:flex">
                <Shield className="mr-1 h-3 w-3" />
                Superadmin
              </Badge>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 gap-1.5 px-1.5 text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Open account menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-violet-700 text-[11px] text-white">{initials}</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">{user.first_name} {user.last_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/superadmin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="min-w-0 flex-1 px-4 pb-6 pt-20 sm:pt-24 md:px-6 lg:pb-8 lg:pl-0 lg:pr-6 lg:pt-28">
            {children}
            <MjengoFooter />
          </main>
          <SessionInactivityGuard onLogout={logout} areaLabel="superadmin dashboard" />
        </div>
      </div>
    </MotionConfig>
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
