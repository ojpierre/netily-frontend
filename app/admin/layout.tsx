"use client"

import React, { useState, useEffect, useCallback } from "react"
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
  ChevronRight,
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
  ShieldAlert,
  ArrowUpRight,
  Loader2,
  Download,   // ← ADDED
} from "lucide-react"
import { AdminAuthProvider, useAdminAuth } from "./admin-auth-context"
import { PageTransition, AnimatedNavItem } from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import type { BillingCycleBreakdown, CompanySubscription, Customer, Invoice, Lead, Payment, Router, SupportTicket, UsageStats } from "@/lib/types"

type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
} & AccessRule

type NavigationSection = {
  title: string
  items: NavigationItem[]
} & AccessRule

type AdminSearchCategory = "Pages" | "Customers" | "Network" | "Finance" | "Support" | "Leads"

type AdminSearchResult = {
  id: string
  title: string
  subtitle: string
  href: string
  category: AdminSearchCategory
  icon: React.ComponentType<{ className?: string }>
  keywords?: string[]
}

const SEARCH_MIN_CHARS = 2
const SEARCH_RESULT_LIMIT = 5
const SIDEBAR_BREADCRUMB_MIN_ITEMS = 5

const searchText = (value: unknown) => String(value || "").toLowerCase()

const compactSearchParts = (...values: unknown[]) =>
  values
    .map((value) => String(value || "").trim())
    .filter(Boolean)

const resultList = <T,>(response: T[] | { results?: T[] } | null | undefined): T[] => {
  if (!response) return []
  if (Array.isArray(response)) return response
  return Array.isArray(response.results) ? response.results : []
}

const matchesSearch = (result: AdminSearchResult, query: string) => {
  const haystack = [
    result.title,
    result.subtitle,
    result.category,
    ...(result.keywords || []),
  ].map(searchText).join(" ")
  return haystack.includes(searchText(query))
}

const detailSearchUrl = (href: string, query: string) => {
  const trimmed = query.trim()
  if (!trimmed) return href
  return `${href}?search=${encodeURIComponent(trimmed)}`
}

const sidebarSectionId = (title: string) =>
  `admin-sidebar-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

// Navigation organized by sections
const navigationSections: NavigationSection[] = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard, pathPrefix: "/admin", allowedRoles: [...OPERATIONS_ROLES, ...NETWORK_ROLES, ...FINANCE_ROLES] },
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
      { name: "AP Map", href: "/admin/access-points", icon: Radio },
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

const kes = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`
  return digits
}

function invoiceIsSettled(status: string | undefined, balance: unknown) {
  return String(status || "").toLowerCase() === "paid" && Number(balance || 0) <= 0
}

const RENEW_NOW_WINDOW_DAYS = 5

function calendarDaysUntil(value?: string | null) {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  return Math.ceil((targetDay - startOfToday) / 86400000)
}

function getRenewalDueDate(subscription: CompanySubscription | null, usage: UsageStats | null) {
  return usage?.billing_cycle_end || subscription?.current_period_end || null
}

function getRenewalEligibility(
  outstandingCycle: BillingCycleBreakdown | null,
  subscription: CompanySubscription | null,
  usage: UsageStats | null,
) {
  const outstandingBalance = Number(outstandingCycle?.invoice_balance || 0)
  if (outstandingBalance > 0) return { eligible: true, daysToDue: 0 }

  const daysToDue = calendarDaysUntil(getRenewalDueDate(subscription, usage))
  return {
    eligible: daysToDue !== null && daysToDue >= 0 && daysToDue <= RENEW_NOW_WINDOW_DAYS,
    daysToDue,
  }
}

function SidebarRenewNow({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [cycle, setCycle] = useState<BillingCycleBreakdown | null>(null)
  const [eligible, setEligible] = useState(false)
  const [summaryLoaded, setSummaryLoaded] = useState(false)
  const [daysToDue, setDaysToDue] = useState<number | null>(null)
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [statusText, setStatusText] = useState("")
  const [paymentState, setPaymentState] = useState<"idle" | "checking" | "success" | "timeout" | "failed">("idle")

  const cycleBalance = Number(cycle?.invoice_balance || 0)
  const estimateTotal = Number(
    usage?.invoice_total_estimate ||
    usage?.total_estimate ||
    subscription?.plan?.base_license_fee ||
    subscription?.plan?.price_monthly ||
    500,
  )
  const payableAmount = cycleBalance > 0 ? cycleBalance : estimateTotal

  const invoiceNumber = cycle?.invoice_number || usage?.invoice_number || ""
  const isPaid = !!cycle && invoiceIsSettled(cycle.invoice_status || "", cycle.invoice_balance)

  const loadBillingSummary = useCallback(async ({ showErrors = false } = {}) => {
    setLoadingData(true)
    try {
      const { adminApi } = await import("@/lib/admin-api")
      adminApi.invalidateSubscriptionCache()
      const [subData, usageData, breakdowns] = await Promise.all([
        adminApi.getCurrentSubscription(),
        adminApi.getUsageStats(),
        adminApi.getBillingCycleBreakdowns(6).catch(() => ({ count: 0, results: [] })),
      ])
      const cycles = (breakdowns?.results || []) as BillingCycleBreakdown[]
      const outstanding = cycles.find((item) => Number(item.invoice_balance || 0) > 0) || null
      const renewal = getRenewalEligibility(outstanding, subData, usageData)

      setSubscription(subData)
      setUsage(usageData)
      setCycle(outstanding)
      setEligible(renewal.eligible)
      setDaysToDue(renewal.daysToDue)
      if (!renewal.eligible) setOpen(false)
    } catch {
      if (showErrors) toast.error("Could not load subscription billing details.")
      setEligible(false)
    } finally {
      setSummaryLoaded(true)
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    loadBillingSummary()
  }, [loadBillingSummary])

  useEffect(() => {
    if (!open) return
    loadBillingSummary({ showErrors: true })
  }, [loadBillingSummary, open])

  useEffect(() => {
    if (!pendingPaymentId) return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 6
    const poll = async () => {
      if (cancelled) return
      attempts += 1
      try {
        const { adminApi } = await import("@/lib/admin-api")
        const result = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)
        if (cancelled) return
        if (result.status === "completed") {
          adminApi.invalidateSubscriptionCache()
          setPendingPaymentId(null)
          setPaymentState("success")
          setStatusText("Payment confirmed. Refreshing your billing access...")
          toast.success(result.message || "Payment confirmed. Your subscription billing has been updated.")
          await loadBillingSummary()
          window.setTimeout(() => window.location.reload(), 1200)
          return
        }
        if (result.status === "failed" || result.status === "cancelled") {
          setPendingPaymentId(null)
          setPaymentState("failed")
          setStatusText(result.message || "Payment was not completed. Please try again.")
          toast.error(result.message || "Payment was not completed. Please try again.")
          return
        }
        setPaymentState("checking")
        setStatusText(attempts <= 1 ? "Waiting for M-Pesa confirmation..." : "Still checking M-Pesa confirmation...")
      } catch {
        setPaymentState("checking")
        setStatusText("Still checking payment status...")
      }
      if (attempts < maxAttempts) window.setTimeout(poll, 5000)
      else {
        setPaymentState("timeout")
        setStatusText("We could not confirm this within 30 seconds. If you entered your PIN, tap Check status before sending another STK.")
        toast.info("Payment is not confirmed yet. Check status in a moment or send a new STK.")
      }
    }
    window.setTimeout(poll, 4000)
    return () => { cancelled = true }
  }, [pendingPaymentId])

  const pay = async () => {
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone || normalizedPhone.length < 12) {
      toast.error("Enter a valid M-Pesa phone number.")
      return
    }
    if (!subscription?.plan?.code) {
      toast.error("Subscription plan is still loading. Please try again.")
      return
    }
    if (!payableAmount || payableAmount <= 0 || isPaid) {
      toast.info("There is no outstanding subscription amount to pay right now.")
      return
    }

    setLoading(true)
    try {
      const { adminApi } = await import("@/lib/admin-api")
      const response = await adminApi.initiateSubscriptionPayment({
        plan_id: subscription.plan.code,
        payment_method: "mpesa_stk",
        phone_number: normalizedPhone,
        billing_period: subscription.billing_period || "monthly",
        amount: payableAmount,
      })
      setPendingPaymentId(response.payment_id)
      setPaymentState("checking")
      setStatusText("STK sent. Enter your M-Pesa PIN to complete renewal.")
      toast.success("STK Push sent. Check your phone.")
    } catch (error: any) {
      toast.error(error?.message || "Could not initiate renewal payment.")
    } finally {
      setLoading(false)
    }
  }

  const checkPendingPayment = async () => {
    if (!pendingPaymentId) return
    setPaymentState("checking")
    setStatusText("Checking M-Pesa confirmation...")
    try {
      const { adminApi } = await import("@/lib/admin-api")
      const result = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)
      if (result.status === "completed") {
        adminApi.invalidateSubscriptionCache()
        setPendingPaymentId(null)
        setPaymentState("success")
        setStatusText("Payment confirmed. Refreshing your billing access...")
        toast.success(result.message || "Payment confirmed. Your subscription billing has been updated.")
        await loadBillingSummary()
        window.setTimeout(() => window.location.reload(), 1200)
        return
      }
      if (result.status === "failed" || result.status === "cancelled") {
        setPendingPaymentId(null)
        setPaymentState("failed")
        setStatusText(result.message || "Payment was not completed. Please try again.")
        toast.error(result.message || "Payment was not completed. Please try again.")
        return
      }
      setPaymentState("timeout")
      setStatusText("M-Pesa has not confirmed this payment yet. If no money left the phone, you can send a new STK.")
    } catch {
      setPaymentState("timeout")
      setStatusText("We could not reach billing status right now. Try Check status again in a moment.")
    }
  }

  const resetPendingPayment = () => {
    setPendingPaymentId(null)
    setPaymentState("idle")
    setStatusText("")
  }

  if (!summaryLoaded || !eligible) return null

  return (
    <>
      <Button
        type="button"
        variant={collapsed ? "ghost" : "default"}
        size={collapsed ? "icon" : "default"}
        className={collapsed ? "w-full" : "w-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"}
        onClick={() => setOpen(true)}
        title="Renew now"
      >
        <CreditCard className="h-5 w-5" />
        {!collapsed && <span className="ml-2">Renew now</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Renew subscription early</DialogTitle>
            <DialogDescription>
              Review the current Netily bill, then enter the M-Pesa number to receive an STK push.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              {loadingData ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading billing breakdown...
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-semibold">{invoiceNumber || "Current cycle estimate"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={isPaid ? "default" : "secondary"}>{isPaid ? "Paid" : "Unpaid / upcoming"}</Badge>
                  </div>
                  {daysToDue !== null && !cycle && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Due window</span>
                      <span className="font-semibold">
                        {daysToDue === 0 ? "Due today" : `${daysToDue} day${daysToDue === 1 ? "" : "s"} left`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Amount to pay</span>
                    <span className="text-lg font-black text-primary">{kes(payableAmount)}</span>
                  </div>
                  <Separator />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Payments are confirmed by M-Pesa before the subscription is marked paid. If you pay early, the active billing cycle remains intact.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sidebar-renew-phone">M-Pesa phone number</Label>
              <Input
                id="sidebar-renew-phone"
                inputMode="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={13}
              />
            </div>

            {statusText && (
              <div className={`space-y-3 rounded-xl border p-3 text-sm font-medium ${
                  paymentState === "success"
                    ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300"
                    : paymentState === "failed"
                      ? "border-destructive/20 bg-destructive/10 text-destructive"
                      : paymentState === "timeout"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-primary/20 bg-primary/10 text-primary"
                }`}>
                <div>
                  {paymentState === "checking" && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
                  {statusText}
                </div>
                {paymentState === "timeout" && pendingPaymentId && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" size="sm" className="flex-1" onClick={checkPendingPayment}>
                      Check status
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="flex-1" onClick={resetPendingPayment}>
                      Send new STK
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button className="w-full" disabled={loading || loadingData || !!pendingPaymentId || isPaid} onClick={pay}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              {isPaid ? "Invoice already paid" : `Send STK Push - ${kes(payableAmount)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("Netily Admin")
  const [accessPolicyVersion, setAccessPolicyVersion] = useState(0)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recordResults, setRecordResults] = useState<AdminSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [openSidebarSections, setOpenSidebarSections] = useState<Record<string, boolean>>({})
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

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  // Check if we're on a public/special page handled outside tenant admin auth.
  const isPublicPage = pathname?.startsWith('/admin/login') || pathname?.startsWith('/admin/selfie')

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const host = window.location.hostname.toLowerCase()
    setIsDemoMode(host === "demo.netily.co.ke" || host.startsWith("demo."))
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleDemoBlocked = (event: Event) => {
      const message = event instanceof CustomEvent ? event.detail?.message : undefined
      toast.warning("Demo mode is active", {
        id: "netily-demo-mode-blocked",
        description: message || "Changes are disabled in this workspace.",
      })
    }
    window.addEventListener("netily-demo-mode-blocked", handleDemoBlocked)
    return () => window.removeEventListener("netily-demo-mode-blocked", handleDemoBlocked)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleStaffAccessBlocked = (event: Event) => {
      const message = event instanceof CustomEvent ? event.detail?.message : undefined
      toast.warning("Action not allowed", {
        id: "netily-staff-access-blocked",
        description: message || "Your staff access does not include this action.",
      })
    }
    window.addEventListener("netily-staff-access-blocked", handleStaffAccessBlocked)
    return () => window.removeEventListener("netily-staff-access-blocked", handleStaffAccessBlocked)
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

  useEffect(() => {
    if (!mounted || !user || isPublicPage || !searchOpen) {
      setRecordResults([])
      setSearchLoading(false)
      return
    }

    const query = searchQuery.trim()
    if (query.length < SEARCH_MIN_CHARS) {
      setRecordResults([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const { adminApi } = await import("@/lib/admin-api")
        const searchParams = { search: query, page_size: String(SEARCH_RESULT_LIMIT) }
        const financeRule: AccessRule = {
          allowedRoles: FINANCE_ROLES,
          allowedDepartments: ["finance", "accounting", "billing", "accounts"],
        }
        const networkRule: AccessRule = {
          allowedRoles: NETWORK_ROLES,
          allowedDepartments: ["network", "it", "technical", "engineering", "noc"],
        }

        const [
          customersResponse,
          routersResponse,
          invoicesResponse,
          paymentsResponse,
          ticketsResponse,
          leadsResponse,
        ] = await Promise.allSettled([
          canAccess(user, { allowedRoles: USER_MANAGEMENT_ROLES })
            ? adminApi.getCustomers(searchParams)
            : Promise.resolve({ results: [] }),
          canAccess(user, networkRule)
            ? adminApi.getRouters(searchParams)
            : Promise.resolve({ results: [] }),
          canAccess(user, financeRule)
            ? adminApi.getInvoices(searchParams)
            : Promise.resolve({ results: [] }),
          canAccess(user, financeRule)
            ? adminApi.getPayments(searchParams)
            : Promise.resolve({ results: [] }),
          canAccess(user, { allowedRoles: [...SUPPORT_ROLES, "technician"] })
            ? adminApi.getTickets(searchParams)
            : Promise.resolve({ results: [] }),
          canAccess(user, { allowedRoles: ENGAGEMENT_ROLES })
            ? adminApi.getLeads(searchParams)
            : Promise.resolve({ results: [] }),
        ])

        if (cancelled) return

        const fulfilled = <T,>(response: PromiseSettledResult<T>) =>
          response.status === "fulfilled" ? response.value : null

        const customers = resultList<Customer>(fulfilled(customersResponse)).map((customer) => ({
          id: `customer-${customer.id}`,
          title: customer.full_name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.customer_number,
          subtitle: compactSearchParts(customer.customer_number, customer.phone, customer.email, customer.status).join(" - "),
          href: `/admin/users/${customer.id}`,
          category: "Customers" as const,
          icon: Users,
          keywords: compactSearchParts(customer.first_name, customer.last_name, customer.billing_account_number, customer.id_number),
        }))

        const routers = resultList<Router>(fulfilled(routersResponse)).map((routerItem) => ({
          id: `router-${routerItem.id}`,
          title: routerItem.name || routerItem.ip_address,
          subtitle: compactSearchParts(routerItem.ip_address, routerItem.location, routerItem.status).join(" - "),
          href: `/admin/routers/${routerItem.id}`,
          category: "Network" as const,
          icon: Wifi,
          keywords: compactSearchParts(routerItem.mac_address, routerItem.model, routerItem.dns_name, routerItem.hotspot_name),
        }))

        const invoices = resultList<Invoice>(fulfilled(invoicesResponse)).map((invoice) => ({
          id: `invoice-${invoice.id}`,
          title: invoice.invoice_number,
          subtitle: compactSearchParts(invoice.customer_name, `KES ${invoice.total_amount || invoice.amount}`, invoice.status).join(" - "),
          href: detailSearchUrl("/admin/invoices", invoice.invoice_number || query),
          category: "Finance" as const,
          icon: Receipt,
          keywords: compactSearchParts(invoice.customer_name, invoice.status, invoice.category),
        }))

        const payments = resultList<Payment>(fulfilled(paymentsResponse)).map((payment) => {
          const reference = payment.reference_number || payment.reference || payment.transaction_id || payment.mpesa_receipt || payment.payment_number
          return {
            id: `payment-${payment.id}`,
            title: reference || payment.payment_number,
            subtitle: compactSearchParts(payment.customer_name, `KES ${payment.amount}`, payment.payment_method_name || payment.payment_method).join(" - "),
            href: detailSearchUrl("/admin/payments", reference || query),
            category: "Finance" as const,
            icon: CreditCard,
            keywords: compactSearchParts(payment.payment_number, payment.invoice_number, payment.payer_name, payment.payer_phone, payment.service_type),
          }
        })

        const tickets = resultList<SupportTicket>(fulfilled(ticketsResponse)).map((ticket) => ({
          id: `ticket-${ticket.id}`,
          title: ticket.subject || ticket.ticket_number,
          subtitle: compactSearchParts(ticket.ticket_number, ticket.customer_name, ticket.priority, ticket.status).join(" - "),
          href: `/admin/tickets/${ticket.id}`,
          category: "Support" as const,
          icon: Ticket,
          keywords: compactSearchParts(ticket.description, ticket.customer_email, ticket.customer_phone, ticket.category),
        }))

        const leads = resultList<Lead>(fulfilled(leadsResponse)).map((lead) => ({
          id: `lead-${lead.id}`,
          title: lead.full_name,
          subtitle: compactSearchParts(lead.company, lead.phone, lead.email, lead.status).join(" - "),
          href: `/admin/leads/${lead.id}`,
          category: "Leads" as const,
          icon: UserPlus,
          keywords: compactSearchParts(lead.source, lead.notes),
        }))

        setRecordResults([...customers, ...routers, ...invoices, ...payments, ...tickets, ...leads])
      } catch {
        if (!cancelled) {
          setRecordResults([])
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [mounted, user, isPublicPage, searchOpen, searchQuery, accessPolicyVersion])

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
  const isNavItemActive = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(href))
  const activeSection = filteredSections.find((section) => section.items.some((item) => isNavItemActive(item.href))) || filteredSections[0]
  const activeNavItem = activeSection?.items.find((item) => isNavItemActive(item.href))
  const breadcrumbSections = filteredSections.filter((section) => section.items.length >= SIDEBAR_BREADCRUMB_MIN_ITEMS)
  const routeAccessRule = getAccessRuleForPath(pathname)
  const trimmedSearchQuery = searchQuery.trim()
  const allPageResults: AdminSearchResult[] = [
    ...filteredSections.flatMap((section) =>
      section.items.map((item) => ({
        id: `page-${item.href}`,
        title: item.name,
        subtitle: `${section.title} page`,
        href: item.href,
        category: "Pages" as const,
        icon: item.icon,
        keywords: [section.title, item.href],
      }))
    ),
    ...bottomNavItems.map((item) => ({
      id: `page-${item.href}`,
      title: item.name,
      subtitle: "Netily Community page",
      href: item.href,
      category: "Pages" as const,
      icon: item.icon,
      keywords: ["community", item.href],
    })),
  ]
  const pageResults = trimmedSearchQuery
    ? allPageResults.filter((result) => matchesSearch(result, trimmedSearchQuery)).slice(0, 8)
    : allPageResults.slice(0, 8)
  const groupedRecordResults = recordResults.reduce<Record<AdminSearchCategory, AdminSearchResult[]>>(
    (groups, result) => {
      groups[result.category] = [...(groups[result.category] || []), result]
      return groups
    },
    { Pages: [], Customers: [], Network: [], Finance: [], Support: [], Leads: [] }
  )
  const hasSearchResults = pageResults.length > 0 || recordResults.length > 0

  const handleSearchNavigate = (href: string) => {
    setSearchOpen(false)
    setSearchQuery("")
    setRecordResults([])
    router.push(href)
  }

  const handleSidebarSectionJump = (sectionTitle: string) => {
    setOpenSidebarSections((current) => ({ ...current, [sectionTitle]: true }))
    const target = document.getElementById(sidebarSectionId(sectionTitle))
    window.setTimeout(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }), 40)
  }

  // ── Install App handler ──
  const handleInstallApp = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      toast.success("App installed! You can now launch it from your desktop or start menu.")
    }
  }

  return (
    <div className="netily-admin-shell min-h-screen bg-background" suppressHydrationWarning>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card/95 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 dark:shadow-black/35 lg:inset-y-4 lg:left-4 lg:rounded-2xl lg:border ${
          sidebarCollapsed ? "w-16" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800 lg:h-[4.25rem]">
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
          {!sidebarCollapsed && breadcrumbSections.length > 0 && (
            <div className="sticky top-0 z-20 mb-4 rounded-xl border border-border bg-card/95 p-2 shadow-sm backdrop-blur">
              <div role="navigation" aria-label="Sidebar section breadcrumb" className="mb-2">
                <ol className="flex min-w-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <li className="shrink-0">Admin</li>
                  <li className="shrink-0 text-muted-foreground/60">
                    <ChevronRight className="h-3 w-3" />
                  </li>
                  <li className="truncate text-foreground">{activeSection?.title || "Dashboard"}</li>
                  {activeNavItem && (
                    <>
                      <li className="shrink-0 text-muted-foreground/60">
                        <ChevronRight className="h-3 w-3" />
                      </li>
                      <li className="truncate text-primary">{activeNavItem.name}</li>
                    </>
                  )}
                </ol>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {breadcrumbSections.map((section) => {
                  const isSectionActive = section.title === activeSection?.title
                  return (
                    <button
                      key={section.title}
                      type="button"
                      onClick={() => handleSidebarSectionJump(section.title)}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                        isSectionActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {section.title}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {filteredSections.map((section, sectionIndex) => (
            <Collapsible
              key={section.title}
              open={
                sidebarCollapsed ||
                section.items.length < SIDEBAR_BREADCRUMB_MIN_ITEMS ||
                section.title === activeSection?.title ||
                openSidebarSections[section.title] === true
              }
              onOpenChange={(open) => {
                if (section.items.length < SIDEBAR_BREADCRUMB_MIN_ITEMS || section.title === activeSection?.title) return
                setOpenSidebarSections((current) => ({ ...current, [section.title]: open }))
              }}
              id={sidebarSectionId(section.title)}
              className={sectionIndex > 0 ? "scroll-mt-24 mt-5" : "scroll-mt-24"}
            >
              {!sidebarCollapsed && section.items.length >= SIDEBAR_BREADCRUMB_MIN_ITEMS && (
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="mb-1.5 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        section.title === activeSection?.title || openSidebarSections[section.title] === true ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
              )}
              {!sidebarCollapsed && section.items.length < SIDEBAR_BREADCRUMB_MIN_ITEMS && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {section.title}
                </p>
              )}
              {sidebarCollapsed && sectionIndex > 0 && <Separator className="my-2 bg-border" />}
              <CollapsibleContent>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = isNavItemActive(item.href)
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
              </CollapsibleContent>
            </Collapsible>
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
        <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
          <SidebarRenewNow collapsed={sidebarCollapsed} />

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
        className={`min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
        }`}
      >
        {/* Top navigation bar */}
        <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center gap-2 border-b border-border bg-card/95 px-2 shadow-sm backdrop-blur-xl sm:h-16 sm:px-4 lg:top-4 lg:mx-6 lg:rounded-2xl lg:border lg:px-6 lg:shadow-xl lg:shadow-black/5 dark:lg:shadow-black/25">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="min-w-0 flex-1 sm:max-w-md">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 sm:h-10 sm:px-3"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate sm:hidden">Search...</span>
              <span className="hidden min-w-0 flex-1 truncate sm:block">Search pages, customers, routers...</span>
              <kbd className="hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Trial Countdown */}
            <div className="hidden md:block">
              <TrialCountdown />
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden h-9 shrink-0 border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary sm:inline-flex"
            >
              <Link href="/customer/login">
                <Globe className="mr-2 h-4 w-4" />
                <span className="hidden xl:inline">Customer Portal</span>
                <span className="xl:hidden">Portal</span>
              </Link>
            </Button>

            {/* Theme Toggle */}
            <div className="hidden min-[380px]:block">
              <ThemeToggle />
            </div>

            {/* Notifications */}
            <Link href="/admin/notifications">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
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
                <Button variant="ghost" className="flex h-9 shrink-0 items-center gap-1 px-1 sm:gap-2 sm:px-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src="" alt="Admin" />
                    <AvatarFallback className="bg-primary text-white">
                      {user?.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.username || "Admin"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email || "admin@netily.com"}</span>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
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
                <DropdownMenuItem onClick={() => router.push("/customer/login")}>
                  <Globe className="w-4 h-4 mr-2" />
                  Customer Portal
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
        <main className="min-w-0 overflow-x-hidden p-3 sm:p-4 lg:p-6 lg:pt-10">
          {isDemoMode && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold">Demo mode is active</p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-200">
                  You can browse every page, but changes are disabled in this workspace.
                </p>
              </div>
            </div>
          )}
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
        <CommandDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          title="Search admin workspace"
          description="Search pages and tenant records"
          className="max-w-2xl"
        >
          <CommandInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search customer name, phone, router, invoice, ticket..."
          />
          <CommandList className="max-h-[70vh]">
            <CommandEmpty>
              <div className="px-4 py-6 text-center">
                <p className="font-medium text-foreground">
                  {trimmedSearchQuery.length < SEARCH_MIN_CHARS
                    ? "Start with a page name or type at least 2 characters."
                    : "No matching results found."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a customer phone, router IP, payment reference, invoice number, or ticket subject.
                </p>
              </div>
            </CommandEmpty>

            {pageResults.length > 0 && (
              <CommandGroup heading={trimmedSearchQuery ? "Pages" : "Quick navigation"}>
                {pageResults.map((result) => {
                  const Icon = result.icon
                  return (
                    <CommandItem
                      key={result.id}
                      value={[result.title, result.subtitle, ...(result.keywords || [])].join(" ")}
                      onSelect={() => handleSearchNavigate(result.href)}
                      className="cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{result.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                      </div>
                      <CommandShortcut>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {searchLoading && (
              <>
                {pageResults.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Searching records">
                  <CommandItem disabled value="Searching records">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Checking customers, routers, finance, support, and leads...</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}

            {(["Customers", "Network", "Finance", "Support", "Leads"] as AdminSearchCategory[]).map((category) => {
              const results = groupedRecordResults[category]
              if (!results?.length) return null
              return (
                <React.Fragment key={category}>
                  {(pageResults.length > 0 || category !== "Customers") && <CommandSeparator />}
                  <CommandGroup heading={category}>
                    {results.map((result) => {
                      const Icon = result.icon
                      return (
                        <CommandItem
                          key={result.id}
                          value={[result.title, result.subtitle, ...(result.keywords || [])].join(" ")}
                          onSelect={() => handleSearchNavigate(result.href)}
                          className="cursor-pointer"
                        >
                          <Icon className="h-4 w-4" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{result.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                          </div>
                          <CommandShortcut>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </CommandShortcut>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </React.Fragment>
              )
            })}

            {!searchLoading && !hasSearchResults && trimmedSearchQuery.length >= SEARCH_MIN_CHARS && (
              <CommandGroup heading="Search tips">
                <CommandItem disabled value="Search tips">
                  <Search className="h-4 w-4" />
                  <span className="text-muted-foreground">Search works best with exact phone numbers, account codes, references, or names.</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
          <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span>Use arrows to move, Enter to open, Esc to close.</span>
            <span className="hidden sm:inline">Ctrl K</span>
          </div>
        </CommandDialog>
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
