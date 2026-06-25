"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  Wifi,
  WifiOff,
  Server,
  AlertTriangle,
  Ticket,
  Clock,
  RefreshCw,
  ChevronRight,
  Zap,
  Shield,
  CreditCard,
  BarChart3,
} from "lucide-react"
import { NetilyLoader } from "@/components/ui/netily-loader"
import { FadeIn } from "@/components/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useAdminAuth } from "./admin-auth-context"
import { adminApi } from "@/lib/admin-api"
import { canAccess, getAccessRuleForPath } from "@/lib/rbac"
import type {
  DashboardStats,
  RouterDashboardStats,
  PaymentDashboardStats,
  SupportTicketStats,
} from "@/lib/types"

// ──────────────────────────────────────
// TYPES
// ──────────────────────────────────────

interface DashboardData {
  core: DashboardStats | null
  routers: RouterDashboardStats | null
  payments: PaymentDashboardStats | null
  tickets: SupportTicketStats | null
  recentActivity: ActivityItem[]
  reports: any | null
}

interface ActivityItem {
  id: number
  user__email: string
  action: string
  model_name: string
  object_repr: string
  timestamp: string
}

// ──────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────

// Helper: format currency
function formatKSh(amount: number | string | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount || 0
  return `KSh ${num.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Helper: relative time
function timeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays}d ago`
}

// ChangeBadge component for revenue changes
function ChangeBadge({ value }: { value: number }) {
  const isPositive = value > 0
  const absValue = Math.abs(value)
  return (
    <Badge
      variant="secondary"
      className={`text-xs ${isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
    >
      {isPositive ? "+" : "-"}{absValue}%
    </Badge>
  )
}

// ─── Conversational Helpers ───

// Dynamic greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  if (hour < 21) return "Good evening"
  return "Still up?"
}

// Get shift label
function getShiftLabel(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "MORNING SHIFT"
  if (hour < 17) return "AFTERNOON SHIFT"
  if (hour < 21) return "EVENING SHIFT"
  return "LATE NIGHT"
}

// Human-sounding router status commentary
function getRouterStatuscommentary(online: number, offline: number, warning: number, total: number): {
  headline: string
  subtext: string
  urgency: "good" | "warn" | "critical"
} {
  if (total === 0) return { headline: "No routers added yet.", subtext: "Add your first router to get started.", urgency: "warn" }
  if (offline === 0 && warning === 0) return { headline: "All routers healthy.", subtext: `${online} of ${total} online and running clean.`, urgency: "good" }
  if (offline >= Math.ceil(total / 2)) return { headline: `${offline} router${offline > 1 ? "s" : ""} down.`, subtext: "More than half your fleet is offline — needs urgent attention.", urgency: "critical" }
  if (offline > 0 && warning > 0) return { headline: `${offline} offline · ${warning} with warnings.`, subtext: "A few things need your attention.", urgency: "warn" }
  if (offline > 0) return { headline: `${offline} router${offline > 1 ? "s are" : " is"} offline.`, subtext: "Worth checking before it affects your customers.", urgency: "warn" }
  if (warning > 0) return { headline: `${warning} router${warning > 1 ? "s" : ""} flagged a warning.`, subtext: "Not critical yet, but keep an eye on it.", urgency: "warn" }
  return { headline: "Everything looks good.", subtext: `${online} routers online, no issues flagged.`, urgency: "good" }
}

// Dynamic revenue commentary
function getRevenueCommentary(
  todayRevenue: number,
  weekRevenue: number,
  monthRevenue: number,
  todayChange: number
): { message: string; tone: "positive" | "neutral" | "low" } {
  if (todayRevenue === 0) return { message: "No revenue recorded yet today. Payments usually pick up later in the day.", tone: "neutral" }
  if (todayChange > 20) return { message: `Today's revenue is up ${todayChange}% — strong day so far.`, tone: "positive" }
  if (todayChange > 0) return { message: `Slight uptick from yesterday. Consistent is good.`, tone: "positive" }
  if (todayChange < -30) return { message: `Today looks quieter than usual. Worth monitoring.`, tone: "low" }
  if (todayChange < 0) return { message: `A little slower than yesterday, but the month is still tracking.`, tone: "neutral" }
  return { message: `Revenue is steady. Nothing alarming, nothing to celebrate yet.`, tone: "neutral" }
}

// Get attention items for the greeting card – UPDATED with SMS parameters
function getAttentionItems(
  offlineRouters: number,
  smsBalance: number | null,
  smsConfigure: boolean,
  smsLow: boolean,
  openTickets: number,
  expiredCount: number
): string[] {
  const items: string[] = []
  if (offlineRouters > 0) items.push(`${offlineRouters} router${offlineRouters > 1 ? "s" : ""} offline`)
  if (!smsConfigure) items.push("SMS not configured")
  else if (smsLow) items.push(`SMS balance low${smsBalance !== null ? ` (${smsBalance})` : ""}`)
  if (openTickets > 3) items.push(`${openTickets} open tickets`)
  if (expiredCount > 20) items.push(`${expiredCount} expired subscriptions`)
  return items
}

// ──────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData>({
    core: null,
    routers: null,
    payments: null,
    tickets: null,
    recentActivity: [],
    reports: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [weekView, setWeekView] = useState<"this" | "last">("this")
  const [yearView, setYearView] = useState<"this" | "last">("last")
  
  // State for live online sessions and active subscriptions
  const [onlineSessions, setOnlineSessions] = useState<any[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<{ pppoe: any[]; hotspot: any[]; total: number }>({ 
    pppoe: [], 
    hotspot: [], 
    total: 0 
  })
  const [onlineTotal, setOnlineTotal] = useState(0)

  // State for expired customers count (derived from RADIUS credentials)
  const [expiredCount, setExpiredCount] = useState<number>(0)

  // ─── NEW: SMS attention state ───
  const [smsAttention, setSmsAttention] = useState<{ configured: boolean; lowBalance: boolean; balance: number | null }>({
    configured: false,
    lowBalance: false,
    balance: null,
  })
  
  // Derived: active subscriptions count (only active/non-expired)
  const activeSubscriptionsCount = React.useMemo(() => {
    const pppoeCount = activeSubscriptions.pppoe?.length || 0
    
    // Only count active (non-expired) hotspot subscribers
    const hotspotActiveCount = (activeSubscriptions.hotspot || []).filter(h => 
      h.is_active_sub ?? (h.subscription_status === 'active' && h.expiry_date && new Date(h.expiry_date) > new Date())
    ).length || 0
    
    return pppoeCount + hotspotActiveCount
  }, [activeSubscriptions])
  
  // Derived: online count with active filtering
  const effectiveOnlineCount = React.useMemo(() => {
    return onlineTotal || onlineSessions.length
  }, [onlineTotal, onlineSessions])
  
  const canOpenRoute = (href: string) => canAccess(user, getAccessRuleForPath(href))
  const quickActions = [
    { href: "/admin/users", label: "Manage Users", icon: Users, className: "text-blue-600" },
    { href: "/admin/routers", label: "Manage Routers", icon: Wifi, className: "text-green-600" },
    { href: "/admin/payments", label: "View Payments", icon: CreditCard, className: "text-purple-600" },
    { href: "/admin/tickets", label: "Support Tickets", icon: Ticket, className: "text-amber-600" },
    { href: "/admin/plans", label: "Manage Plans", icon: BarChart3, className: "text-cyan-600" },
    { href: "/admin/invoices", label: "Invoices", icon: DollarSign, className: "text-green-600" },
  ].filter((item) => canOpenRoute(item.href))

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)

      // Fetch all dashboard data in parallel (excluding expired count which uses single endpoint)
      const [coreRes, routerRes, paymentRes, ticketRes, reportsRes, sessionsRes, activeSubsRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getRouterDashboardStats(),
        adminApi.getPaymentDashboardStats(),
        adminApi.getTicketStats(),
        adminApi.getReportsData("30d"),
        adminApi.getOnlineSessions(1, 1),  // ← page=1, pageSize=1 — just need the total count
        adminApi.getActiveSubscriptions?.(),
      ])

      setData({
        core: coreRes.status === "fulfilled" ? coreRes.value : null,
        routers: routerRes.status === "fulfilled" ? routerRes.value : null,
        payments: paymentRes.status === "fulfilled" ? paymentRes.value : null,
        tickets: ticketRes.status === "fulfilled" ? ticketRes.value : null,
        recentActivity:
          coreRes.status === "fulfilled" && (coreRes.value as any)?.recent_activity
            ? (coreRes.value as any).recent_activity
            : [],
        reports: reportsRes.status === "fulfilled" ? reportsRes.value : null,
      })

      // Update live data separately
      if (sessionsRes.status === "fulfilled") {
        // Use response.total (all active sessions), not sessions.length (just page 1)
        setOnlineSessions(sessionsRes.value?.sessions || [])
        setOnlineTotal(sessionsRes.value?.total || sessionsRes.value?.sessions?.length || 0)
      }
      if (activeSubsRes.status === "fulfilled") {
        const subs = activeSubsRes.value || { pppoe: [], hotspot: [], total: 0 }
        setActiveSubscriptions(subs)
      }

      // ─────────────────────────────────────────────────────────────
      // FAST EXPIRED COUNT – single API call
      // Uses the new /radius/credentials/expired_count/ endpoint
      // ─────────────────────────────────────────────────────────────
      let expiredViaRadius = 0
      try {
        expiredViaRadius = await adminApi.getExpiredRADIUSCount()
      } catch (radiusErr) {
        console.warn('Failed to fetch expired RADIUS count:', radiusErr)
        // Fallback to core stats if available
        if (coreRes.status === "fulfilled") {
          expiredViaRadius = (coreRes.value?.expired_customers || 0)
        }
      }
      
      setExpiredCount(expiredViaRadius)

      // ─── NEW: Fetch SMS data ──────────────────────────────
      try {
        const [notifSettings, gatewayConfigs, smsWallet, smsBalance] = await Promise.all([
          adminApi.getSMSNotificationSettings().catch(() => null),
          adminApi.getSMSGatewayConfigs().catch(() => []),
          adminApi.getSMSWallet().catch(() => null),
          adminApi.getSMSBalance().catch(() => null),
        ])

        const gws = Array.isArray(gatewayConfigs) ? gatewayConfigs : []
        const useInbuilt = notifSettings?.use_inbuilt_system ?? false
        const hasCustomGateway = gws.some(g => g.is_active && !g.use_inbuilt_system && g.api_key)
        const configured = useInbuilt || hasCustomGateway

        let balance: number | null = null
        let lowBalance = false

        if (useInbuilt) {
          const units = Number(smsWallet?.sms_units ?? 0)
          balance = units
          lowBalance = units < 10
        } else if (hasCustomGateway) {
          const raw = Number(smsBalance?.balance ?? 0)
          balance = raw
          lowBalance = raw < 10
        }

        setSmsAttention({ configured, lowBalance, balance })
      } catch (smsErr) {
        // non-critical — don't block dashboard
        console.warn('SMS attention data fetch failed:', smsErr)
      }
      // ─── End SMS fetch ────────────────────────────────────

    } catch (err: any) {
      console.error("Dashboard fetch error:", err)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  // Derive stats from data
  const core = data.core
  const routers = data.routers
  const payments = data.payments
  const tickets = data.tickets

  if (error && !core) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your ISP operations</p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Refined radial gradient bloom background */}
      <div
        className="absolute inset-0 -mx-6 -mt-6 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 0%, rgba(99,102,241,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 0%, rgba(16,185,129,0.05) 0%, transparent 70%)
          `,
        }}
      />

      {/* ─── Greeting Hero Card ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-orange-100 dark:border-slate-800 p-6 shadow-sm">
        {/* Subtle decorative blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-100/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            {/* Shift label + online status */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">{getShiftLabel()}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {(routers?.online_routers ?? 0)} ONLINE RIGHT NOW
              </span>
            </div>

            {/* Greeting */}
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {getGreeting()},{" "}
              <span className="text-orange-500 italic font-extrabold">
                {user?.first_name || user?.username || "there"}.
              </span>
            </h1>

            {/* Attention items + contextual subtext – UPDATED call */}
            {(() => {
              const items = getAttentionItems(
                routers?.offline_routers ?? 0,
                smsAttention.balance,
                smsAttention.configured,
                smsAttention.lowBalance,
                tickets?.open ?? 0,
                expiredCount
              )
              return items.length > 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mt-1">
                  {items.join(" · ")} — a few things need a minute.
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Everything looks clean. Have a good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}.
                </p>
              )
            })()}

            {/* Day context */}
            <p className="text-xs text-slate-400 italic mt-2 flex items-center gap-1.5">
              {new Date().getHours() >= 6 && new Date().getHours() < 20 ? "☀️" : "🌙"}
              {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>

          {/* Right side: quick refresh */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="rounded-xl bg-white/70 dark:bg-slate-800 border-orange-200 dark:border-slate-700">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Needs Attention Banner (updated condition and pills) ── */}
        {!loading && ((routers?.offline_routers ?? 0) > 0 || !smsAttention.configured || smsAttention.lowBalance || (tickets?.open ?? 0) > 3 || expiredCount > 20) && (
          <div className="relative mt-4 pt-4 border-t border-orange-100 dark:border-slate-700">
            <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase mb-2">NEEDS YOUR ATTENTION</p>
            <div className="flex flex-wrap gap-2">
              {/* Offline routers pills (max 3) */}
              {Array.from({ length: Math.min(routers?.offline_routers ?? 0, 3) }).map((_, i) => (
                <Link key={i} href="/admin/routers?status=offline">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    Router offline
                  </div>
                </Link>
              ))}

              {/* SMS not configured */}
              {!smsAttention.configured && (
                <Link href="/admin/sms?tab=gateway">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    SMS not configured
                  </div>
                </Link>
              )}

              {/* SMS balance low */}
              {smsAttention.configured && smsAttention.lowBalance && (
                <Link href="/admin/sms?tab=wallet">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-xs font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-100 transition-colors cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                    SMS balance low{smsAttention.balance !== null ? ` (${smsAttention.balance})` : ""}
                  </div>
                </Link>
              )}

              {/* Open tickets */}
              {(tickets?.open ?? 0) > 3 && (
                <Link href="/admin/tickets?status=open">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    {tickets?.open} open tickets
                  </div>
                </Link>
              )}

              {/* Expired subscriptions */}
              {expiredCount > 20 && (
                <Link href="/admin/users?status=expired">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                    {expiredCount} expired subs
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Row 1: Key Metrics ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative">
        {/* Total Customers */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-[28px] font-bold tabular-nums tracking-[-0.04em] text-slate-900 dark:text-slate-50 leading-none">
                  {(core?.total_customers ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium tracking-[0.02em]">All PPPoE/Static users</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Subscriptions - FIXED: only count active (non-expired) hotspot subscribers */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-[28px] font-bold tabular-nums tracking-[-0.04em] text-green-600 dark:text-green-400 leading-none">
                  {activeSubscriptionsCount.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium tracking-[0.02em] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span>Active PPPoE + Hotspot</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expired Customers - Clickable */}
        <Card
          className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900 cursor-pointer hover:-translate-y-0.5"
          onClick={() => router.push('/admin/users?status=expired')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-[28px] font-bold tabular-nums tracking-[-0.04em] text-red-600 dark:text-red-400 leading-none">
                  {expiredCount.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium tracking-[0.02em] flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span>Requires renewal</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Online / Active - FIXED: uses activeSubscriptionsCount for denominator */}
        <Card
          className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900 cursor-pointer hover:-translate-y-0.5"
          onClick={() => router.push('/admin/users?tab=online-sessions')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online / Active</CardTitle>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-[0.08em] uppercase">
                Live
              </span>
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (() => {
              const onlineCount = effectiveOnlineCount
              const activeCount = activeSubscriptionsCount
              const pct = activeCount > 0 ? Math.round((onlineCount / activeCount) * 100) : 0

              return (
                <div className="space-y-3 pt-1">
                  {/* Big ratio number */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold text-slate-900 dark:text-slate-100 leading-none">
                      {onlineCount}
                    </span>
                    <span className="text-xl text-slate-300">/</span>
                    <span className="text-xl font-medium text-slate-500 leading-none">
                      {activeCount}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium tracking-[0.02em]">
                      <span>Online now</span>
                      <span>{pct}% connected</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-3 pt-0.5">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium tracking-[0.02em]">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      PPPoE: {activeSubscriptions.pppoe?.length || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium tracking-[0.02em]">
                      <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                      Hotspot: {(activeSubscriptions.hotspot || []).filter(h => 
                        h.is_active_sub ?? (h.subscription_status === 'active' && h.expiry_date && new Date(h.expiry_date) > new Date())
                      ).length}
                    </span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 2: Network & Revenue ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative">
        {/* Router Status - Human language */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-600" />
                Router Fleet
              </CardTitle>
              {canOpenRoute("/admin/routers") && (
                <Link href="/admin/routers">
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (() => {
              const commentary = getRouterStatuscommentary(
                routers?.online_routers ?? 0,
                routers?.offline_routers ?? 0,
                routers?.warning_routers ?? 0,
                routers?.total_routers ?? 0
              )
              return (
                <div className="space-y-4">
                  {/* Human headline */}
                  <div className={`p-3 rounded-xl ${
                    commentary.urgency === "good" ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900" :
                    commentary.urgency === "critical" ? "bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900" :
                    "bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900"
                  }`}>
                    <p className={`text-sm font-semibold ${
                      commentary.urgency === "good" ? "text-emerald-800 dark:text-emerald-300" :
                      commentary.urgency === "critical" ? "text-red-800 dark:text-red-300" :
                      "text-amber-800 dark:text-amber-300"
                    }`}>{commentary.headline}</p>
                    <p className={`text-xs mt-0.5 ${
                      commentary.urgency === "good" ? "text-emerald-600 dark:text-emerald-400" :
                      commentary.urgency === "critical" ? "text-red-600 dark:text-red-400" :
                      "text-amber-600 dark:text-amber-400"
                    }`}>{commentary.subtext}</p>
                  </div>

                  {/* Status pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xl font-bold text-emerald-600">{routers?.online_routers ?? 0}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">Online</span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xl font-bold text-red-600">{routers?.offline_routers ?? 0}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">Offline</span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xl font-bold text-amber-600">{(routers?.warning_routers ?? 0) + (routers?.maintenance_routers ?? 0)}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">Flagged</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-slate-500">{routers?.total_routers ?? 0} total routers</span>
                    <span className="text-xs text-slate-400">{routers?.total_connected_users ?? 0} users connected</span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Revenue Card - Human language */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Revenue
              </CardTitle>
              {canOpenRoute("/admin/payments") && (
                <Link href="/admin/payments">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-slate-600 px-2">
                    View all →
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (() => {
              const todayRev = parseFloat(String(data.reports?.overview?.today_revenue ?? payments?.amount_today ?? 0))
              const weekRev = parseFloat(String(data.reports?.overview?.week_revenue ?? 0))
              const monthRev = parseFloat(String(data.reports?.overview?.month_revenue ?? payments?.amount_this_month ?? 0))
              const todayChange = data.reports?.overview?.today_change ?? 0
              const commentary = getRevenueCommentary(todayRev, weekRev, monthRev, todayChange)
              return (
                <div className="space-y-2">
                  {/* Human revenue commentary */}
                  <p className={`text-xs px-1 pb-1 ${
                    commentary.tone === "positive" ? "text-emerald-600 dark:text-emerald-400" :
                    commentary.tone === "low" ? "text-amber-600 dark:text-amber-400" :
                    "text-slate-500 dark:text-slate-400"
                  }`}>
                    {commentary.message}
                  </p>

                  {/* Today */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] text-blue-400 uppercase">Today</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatKSh(todayRev)}
                      </p>
                    </div>
                    {todayChange !== 0 && <ChangeBadge value={todayChange} />}
                  </div>

                  {/* This week */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] text-green-500 uppercase">This week</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatKSh(weekRev)}
                      </p>
                    </div>
                    {(data.reports?.overview?.week_change ?? 0) !== 0 && (
                      <ChangeBadge value={data.reports?.overview?.week_change ?? 0} />
                    )}
                  </div>

                  {/* This month */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] text-amber-500 uppercase">This month</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatKSh(monthRev)}
                      </p>
                    </div>
                    {(data.reports?.overview?.month_change ?? 0) !== 0 && (
                      <ChangeBadge value={data.reports?.overview?.month_change ?? 0} />
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium tracking-[0.02em] pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Transactions today</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {data.reports?.overview?.total_transactions_today ?? payments?.payments_today ?? 0}
                    </span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-600" />
                Support Tickets
              </CardTitle>
              {canOpenRoute("/admin/tickets") && (
                <Link href="/admin/tickets">
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{tickets?.open ?? 0}</p>
                    <p className="text-xs text-slate-500">Open</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600">{tickets?.in_progress ?? 0}</p>
                    <p className="text-xs text-slate-500">In Progress</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{tickets?.resolved ?? 0}</p>
                    <p className="text-xs text-slate-500">Resolved</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{tickets?.total ?? 0}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    Avg Response
                  </div>
                  <span className="font-medium">{tickets?.avg_response_time ?? "—"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 2.5: Weekly Income & Monthly Earnings ─── */}
      <div className="grid gap-4 md:grid-cols-2 relative">

        {/* Weekly Income Chart */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  Weekly Income
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {weekView === "this" ? "This week · daily breakdown" : "Last week · daily breakdown"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setWeekView("this")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    weekView === "this"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  This week
                </button>
                <button
                  onClick={() => setWeekView("last")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    weekView === "last"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Last week
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <NetilyLoader size={32} className="opacity-50" />
              </div>
            ) : !(weekView === "this"
                ? data.reports?.overview?.weekly_income
                : data.reports?.overview?.last_week_income
              )?.length ? (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400">
                <BarChart3 className="w-10 h-10 opacity-30" />
                <p className="text-sm">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    weekView === "this"
                      ? data.reports?.overview?.weekly_income
                      : data.reports?.overview?.last_week_income
                  }
                  barSize={28}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}

                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    domain={([dataMin, dataMax]: [number, number]) => {
                      const padding = (dataMax - dataMin) * 0.25
                      return [0, Math.ceil((dataMax + padding) / 1000) * 1000]
                    }}
                  />
                  <Tooltip
                    cursor={false}
                    formatter={(value: number) => [`KSh ${value.toLocaleString("en-KE")}`, "Income"]}
                    contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                  <Bar
                    dataKey="amount"
                    name="Income"
                    fill={weekView === "this" ? "#3b82f6" : "#8b5cf6"}
                    radius={[4, 4, 0, 0]}
                    label={{
                      position: "top",
                      fontSize: 10,
                      fill: "#64748b",
                      formatter: (v: number) => {
                        if (!v || v === 0) return ""
                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                        if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
                        return `${v}`
                      },
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Earnings Chart */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  Monthly Earnings
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {yearView === "this" ? `${new Date().getFullYear()} · month by month` : `${new Date().getFullYear() - 1} · month by month`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setYearView("this")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    yearView === "this"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {new Date().getFullYear()}
                </button>
                <button
                  onClick={() => setYearView("last")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    yearView === "last"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {new Date().getFullYear() - 1}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <NetilyLoader size={32} className="opacity-50" />
              </div>
            ) : !(yearView === "this"
                ? data.reports?.overview?.monthly_earnings
                : data.reports?.overview?.last_year_earnings
              )?.length ? (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400">
                <BarChart3 className="w-10 h-10 opacity-30" />
                <p className="text-sm">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    yearView === "this"
                      ? data.reports?.overview?.monthly_earnings
                      : data.reports?.overview?.last_year_earnings
                  }
                  barSize={18}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}

                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    domain={([dataMin, dataMax]: [number, number]) => {
                      const padding = (dataMax - dataMin) * 0.25
                      return [0, Math.ceil((dataMax + padding) / 1000) * 1000]
                    }}
                  />
                  <Tooltip
                    cursor={false}
                    formatter={(value: number) => [`KSh ${value.toLocaleString("en-KE")}`, "Earnings"]}
                    contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                  <Bar
                    dataKey="amount"
                    name="Earnings"
                    fill={yearView === "this" ? "#10b981" : "#f59e0b"}
                    radius={[4, 4, 0, 0]}
                    label={{
                      position: "top",
                      fontSize: 10,
                      fill: "#64748b",
                      formatter: (v: number) => {
                        if (!v || v === 0) return ""
                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                        if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
                        return `${v}`
                      },
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ─── Row 3: Quick Actions & Recent Activity ─── */}
      <div className="grid gap-4 md:grid-cols-2 relative">
        {/* Quick Actions */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.length ? quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.href} href={action.href}>
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <Icon className={`w-5 h-5 ${action.className}`} />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  </Link>
                )
              }) : (
                <div className="col-span-2 rounded-xl border border-dashed p-4 text-center text-sm text-slate-500">
                  Your staff role has no quick actions assigned yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest system events from audit log</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {(activity.user__email || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {activity.user__email || "System"}
                      </p>
                      <p className="text-xs text-slate-600">
                        {activity.action} — {activity.object_repr || activity.model_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {timeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            {canOpenRoute("/admin/logs") && (
              <Link href="/admin/logs" className="w-full">
                <Button variant="ghost" size="sm" className="w-full text-slate-500">
                  View all activity
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}