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
import { RevenueStatCard } from "@/components/ui/revenue-stat-card"
import type {
  DashboardStats,
  RouterDashboardStats,
  PaymentDashboardStats,
  SupportTicketStats,
} from "@/lib/types"

// ──────────────────────────────────────
// TYPES
// ──────────────────────────────────────

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

const dashboardCardClass =
  "border border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:shadow-md backdrop-blur supports-[backdrop-filter]:bg-card/90"

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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [weekView, setWeekView] = useState<"this" | "last">("this")
  // FIX: Default to "this" (current year) instead of "last"
  const [yearView, setYearView] = useState<"this" | "last">("this")
  
  // ─── ANIMATION RETRIGGER KEY ───
  const [greetKey, setGreetKey] = useState(0)
  
  // State for live online sessions and active subscriptions
  const [onlineSessions, setOnlineSessions] = useState<any[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<{ pppoe: any[]; hotspot: any[]; total: number }>({ 
    pppoe: [], 
    hotspot: [], 
    total: 0 
  })
  const [onlineTotal, setOnlineTotal] = useState(0)

  // ─── FAST PATH: top-4-card stats, loaded independently of the heavy dashboard fetch ───
  const [quickStats, setQuickStats] = useState<{
    total_customers: number
    active_subscriptions: { pppoe: number; hotspot: number; total: number }
    expired_customers: number
    online_count: number
    routers: RouterDashboardStats
    revenue: { today: number; today_change: number; week: number; month: number; month_change: number; transactions_today: number }
    tickets: { total: number; open: number; in_progress: number; resolved: number; avg_response_time: string }
    recent_activity: ActivityItem[]
    overview: {
      today_revenue: number
      today_change: number
      week_revenue: number
      week_change: number 
      month_revenue: number
      month_change: number
      total_transactions_today: number
      weekly_income: any[]
      last_week_income: any[]
      monthly_earnings: any[]
      last_year_earnings: any[]
    }
  } | null>(null)
  const quickStatsLoading = quickStats === null

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

  // ─── FAST PATH: fetch quick stats independently ───
  const fetchQuickStats = useCallback(async () => {
    try {
      const data = await adminApi.getUnifiedDashboard()
      setQuickStats(data)
    } catch (err) {
      console.warn("Quick stats fetch failed:", err)
    }
  }, [])

  // ─── TRIMMED: fetchDashboardData - only what's NOT in quickStats ───
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)

      // Only fetch data that's NOT in quickStats
      const [sessionsRes, activeSubsRes] = await Promise.allSettled([
        adminApi.getOnlineSessions(1, 1),
        adminApi.getActiveSubscriptions?.(),
      ])

      // Update live data separately
      if (sessionsRes.status === "fulfilled") {
        setOnlineSessions(sessionsRes.value?.sessions || [])
        setOnlineTotal(sessionsRes.value?.total || sessionsRes.value?.sessions?.length || 0)
      }
      if (activeSubsRes.status === "fulfilled") {
        const subs = activeSubsRes.value || { pppoe: [], hotspot: [], total: 0 }
        setActiveSubscriptions(subs)
      }

      // ─── SMS attention data (unchanged) ──────────────────────
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
        console.warn('SMS attention data fetch failed:', smsErr)
      }

    } catch (err: any) {
      console.error("Dashboard fetch error:", err)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // ─── HANDLE REFRESH ─────────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true)
    setGreetKey((k) => k + 1) // Retrigger the hello animation
    fetchQuickStats()
    fetchDashboardData()
  }

  // ─── INITIAL FETCH ──────────────────────────────────────────
  useEffect(() => {
    // Fetch quick stats first (fast path)
    fetchQuickStats()
    // Then fetch the rest of the dashboard
    fetchDashboardData()
    // Play animation on mount
    setGreetKey((k) => k + 1)
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchQuickStats()
      fetchDashboardData()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchQuickStats, fetchDashboardData])

  if (error && !quickStats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Overview of your ISP operations</p>
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
      {/* Apple-style keyframes */}
      <style>{`
        @keyframes appleHelloIn {
          0% {
            opacity: 0;
            transform: scale(0.85);
            filter: blur(6px);
          }
          55% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
        }

        @keyframes appleFadeUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .apple-hello-word {
          display: inline-block;
          animation: appleHelloIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .apple-hello-sub {
          animation: appleFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
        }
      `}</style>

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

      {/* ─── Apple-Style Greeting Hero Card (Theme-Aware) ─── */}
      <div
        key={greetKey}
        className="relative overflow-hidden rounded-2xl p-10 md:p-14 shadow-sm flex flex-col items-center justify-center text-center min-h-[260px] border border-border/60 bg-card"
      >
        {/* Subtle Apple-style radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--foreground) 6%, transparent) 0%, transparent 60%)",
          }}
        />

        <div className="relative">
          <p className="apple-hello-sub text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground/70 mb-3">
            {getShiftLabel()}
          </p>

          <h1
            className="font-semibold text-foreground leading-none"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              letterSpacing: "-0.03em",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
            }}
          >
            <span className="apple-hello-word" style={{ animationDelay: "0.05s" }}>
              {getGreeting()},
            </span>{" "}
            <span
              className="apple-hello-word text-foreground/90"
              style={{ animationDelay: "0.2s" }}
            >
              {user?.first_name || user?.username || "there"}.
            </span>
          </h1>

          {(() => {
            const items = getAttentionItems(
              quickStats?.routers?.offline_routers ?? 0,
              smsAttention.balance,
              smsAttention.configured,
              smsAttention.lowBalance,
              quickStats?.tickets?.open ?? 0,
              quickStats?.expired_customers ?? 0
            )
            return (
              <p className="apple-hello-sub mt-4 text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                {items.length > 0
                  ? `${items.join(" · ")} — a few things need a minute.`
                  : `Everything looks clean today.`}
              </p>
            )
          })()}

          <p className="apple-hello-sub mt-2 text-xs text-muted-foreground/60 tracking-wide">
            {new Date().toLocaleDateString("en-KE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* Refresh button - positioned top-right */}
        <div className="absolute top-5 right-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ─── Row 1: Key Metrics ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative">
        {/* Total Customers */}
        <Card className={dashboardCardClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {quickStatsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-[28px] font-bold leading-none tracking-[-0.04em] text-foreground tabular-nums">
                  {(quickStats?.total_customers ?? 0).toLocaleString()}
                </div>
                <p className="mt-2 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">All PPPoE/Static users</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Subscriptions - FIXED: only count active (non-expired) hotspot subscribers */}
        <Card className={dashboardCardClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {quickStatsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-[28px] font-bold tabular-nums tracking-[-0.04em] text-green-600 dark:text-green-400 leading-none">
                  {(quickStats?.active_subscriptions.total ?? activeSubscriptionsCount).toLocaleString()}
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span>Active PPPoE + Hotspot</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expired Customers - Clickable */}
        <Card
          className={`${dashboardCardClass} cursor-pointer hover:-translate-y-0.5`}
          onClick={() => router.push('/admin/users?status=expired')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {quickStatsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-[28px] font-bold tabular-nums tracking-[-0.04em] text-red-600 dark:text-red-400 leading-none">
                  {(quickStats?.expired_customers ?? 0).toLocaleString()}
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span>Requires renewal</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Online / Active - FIXED: uses activeSubscriptionsCount for denominator */}
        <Card
          className={`${dashboardCardClass} cursor-pointer hover:-translate-y-0.5`}
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
            {quickStatsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (() => {
              const onlineCount = quickStats?.online_count ?? effectiveOnlineCount
              const activeCount = quickStats?.active_subscriptions.total ?? activeSubscriptionsCount
              const pct = activeCount > 0 ? Math.round((onlineCount / activeCount) * 100) : 0

              return (
                <div className="space-y-3 pt-1">
                  {/* Big ratio number */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold text-foreground leading-none">
                      {onlineCount}
                    </span>
                    <span className="text-xl text-muted-foreground/40">/</span>
                    <span className="text-xl font-medium leading-none text-muted-foreground">
                      {activeCount}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium tracking-[0.02em] text-muted-foreground">
                      <span>Online now</span>
                      <span>{pct}% connected</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-3 pt-0.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      PPPoE: {quickStats?.active_subscriptions.pppoe ?? (activeSubscriptions.pppoe?.length || 0)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                      Hotspot: {quickStats?.active_subscriptions.hotspot ?? (activeSubscriptions.hotspot || []).filter(h => 
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
        {/* Router Status - UPDATED with refined CardContent */}
        <Card className={dashboardCardClass}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
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
            <style>{`
              @keyframes routerSlideUp {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            {quickStatsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (() => {
              const rt = quickStats?.routers
              const commentary = getRouterStatuscommentary(
                rt?.online_routers ?? 0,
                rt?.offline_routers ?? 0,
                rt?.warning_routers ?? 0,
                rt?.total_routers ?? 0
              )

              const urgencyStyle = {
                good:     { bar: "#3d7a5f", bg: "rgba(61,122,95,0.07)",    text: "#2a5c42",  sub: "#3d7a5f"  },
                warn:     { bar: "#c5840a", bg: "rgba(197,132,10,0.07)",   text: "#7a5008",  sub: "#c5840a"  },
                critical: { bar: "#c0392b", bg: "rgba(192,57,43,0.07)",    text: "#8b2219",  sub: "#c0392b"  },
              }[commentary.urgency]

              const flagged = (rt?.warning_routers ?? 0) + (rt?.maintenance_routers ?? 0)

              return (
                <div
                  className="space-y-4"
                  style={{ animation: "routerSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
                >
                  {/* Status banner — left accent bar style */}
                  <div
                    className="flex gap-3 rounded-xl p-3"
                    style={{ background: urgencyStyle.bg }}
                  >
                    <div
                      className="w-0.5 rounded-full shrink-0 self-stretch"
                      style={{ background: urgencyStyle.bar }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug" style={{ color: urgencyStyle.text }}>
                        {commentary.headline}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: urgencyStyle.sub }}>
                        {commentary.subtext}
                      </p>
                    </div>
                  </div>

                  {/* Stat numbers — no boxes, divided by hairlines */}
                  <div className="grid grid-cols-3 divide-x divide-border/50">
                    {[
                      { label: "Online",  value: rt?.online_routers  ?? 0, color: "#3d7a5f", delay: "0s"    },
                      { label: "Offline", value: rt?.offline_routers ?? 0, color: "#c0392b", delay: "0.05s" },
                      { label: "Flagged", value: flagged,                  color: "#c5840a", delay: "0.1s"  },
                    ].map(({ label, value, color, delay }) => (
                      <div
                        key={label}
                        className="text-center py-1"
                        style={{ animation: `routerSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay} both` }}
                      >
                        <p
                          className="text-2xl font-extrabold tabular-nums leading-none"
                          style={{ color }}
                        >
                          {value}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span>{rt?.total_routers ?? 0} total routers</span>
                    <span>{rt?.total_connected_users ?? 0} users connected</span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Revenue Card - UPDATED with RevenueStatCard component with staggered delays */}
        <Card className={dashboardCardClass}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Revenue
              </CardTitle>
              {canOpenRoute("/admin/payments") && (
                <Link href="/admin/payments">
                  <Button variant="ghost" size="sm" className="px-2 text-xs text-muted-foreground hover:text-foreground">
                    View all →
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {quickStatsLoading ? (
              <div className="grid grid-cols-1 gap-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : (() => {
              const ov = quickStats?.overview
              const todayRev = parseFloat(String(ov?.today_revenue ?? 0))
              const weekRev = parseFloat(String(ov?.week_revenue ?? 0))
              const monthRev = parseFloat(String(ov?.month_revenue ?? 0))

              // Sparkline sources: reuse chart data already fetched — no extra calls
              const weeklySpark = (ov?.weekly_income ?? []).map(d => ({ amount: d.amount }))
              const monthlySpark = (ov?.monthly_earnings ?? []).map(d => ({ amount: d.amount }))
              // "Today" spark: last 2 points of the week series (yesterday → today) padded for shape
              const todaySpark = weeklySpark.length >= 2 ? weeklySpark.slice(-2) : weeklySpark

              return (
                <div className="grid grid-cols-1 gap-3">
                  <RevenueStatCard
                    label="Today"
                    value={todayRev}
                    deltaPct={ov?.today_change}
                    color="#d97234"
                    sparklineData={todaySpark.length ? todaySpark : [{ amount: 0 }, { amount: todayRev }]}
                    animationDelay={0}
                  />
                  <RevenueStatCard
                    label="This Week"
                    value={weekRev}
                    deltaPct={ov?.week_change}
                    color="#3d7a5f"
                    sparklineData={weeklySpark.length ? weeklySpark : [{ amount: 0 }, { amount: weekRev }]}
                    animationDelay={0.1}
                  />
                  <RevenueStatCard
                    label="This Month"
                    value={monthRev}
                    deltaPct={ov?.month_change}
                    color="currentColor"
                    sparklineData={monthlySpark.length ? monthlySpark : [{ amount: 0 }, { amount: monthRev }]}
                    animationDelay={0.2}
                  />

                  <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">
                    <span>Transactions today</span>
                    <span className="font-medium text-foreground">
                      {ov?.total_transactions_today ?? 0}
                    </span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Support Tickets - UPDATED with refined CardContent */}
        <Card className={dashboardCardClass}>
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
            <style>{`
              @keyframes ticketFadeUp {
                from { opacity: 0; transform: translateY(6px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            {quickStatsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (() => {
              const tk = quickStats?.tickets
              const total  = tk?.total      ?? 0
              const open   = tk?.open       ?? 0
              const prog   = tk?.in_progress ?? 0
              const resolved = tk?.resolved ?? 0

              // Proportion bar segments
              const safeDenom = total || 1
              const segments = [
                { pct: (open     / safeDenom) * 100, color: "#c0392b" },
                { pct: (prog     / safeDenom) * 100, color: "#c5840a" },
                { pct: (resolved / safeDenom) * 100, color: "#3d7a5f" },
              ]

              const rows = [
                { label: "Open",        value: open,     color: "#c0392b", delay: "0s"    },
                { label: "In Progress", value: prog,     color: "#c5840a", delay: "0.06s" },
                { label: "Resolved",    value: resolved, color: "#3d7a5f", delay: "0.12s" },
                { label: "Total",       value: total,    color: "#6366f1", delay: "0.18s" },
              ]

              return (
                <div
                  className="space-y-4"
                  style={{ animation: "ticketFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
                >
                  {/* Hero total + proportion bar */}
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.11em] mb-1"
                      style={{ color: "#8a8274" }}
                    >
                      All tickets
                    </p>
                    <p
                      className="text-4xl font-extrabold tabular-nums leading-none"
                      style={{ color: "#6366f1", letterSpacing: "-0.02em" }}
                    >
                      {total}
                    </p>

                    {/* Segmented proportion bar */}
                    <div className="mt-3 flex h-1 rounded-full overflow-hidden gap-px">
                      {total === 0 ? (
                        <div className="flex-1 rounded-full bg-border" />
                      ) : segments.map((s, i) => (
                        s.pct > 0 && (
                          <div
                            key={i}
                            className="h-full rounded-sm transition-all duration-700"
                            style={{ width: `${s.pct}%`, background: s.color }}
                          />
                        )
                      ))}
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-0 divide-y divide-border/50">
                    {rows.map(({ label, value, color, delay }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between py-2.5"
                        style={{ animation: `ticketFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay} both` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <span className="text-sm text-muted-foreground">{label}</span>
                        </div>
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer: avg response */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Avg Response
                    </div>
                    <span className="font-medium text-foreground">{tk?.avg_response_time ?? "—"}</span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 2.5: Weekly Income & Monthly Earnings ─── */}
      <div className="grid gap-4 md:grid-cols-2 relative">

        {/* Weekly Income Chart */}
        <Card className={dashboardCardClass}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Weekly Income
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {weekView === "this" ? "This week · daily breakdown" : "Last week · daily breakdown"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setWeekView("this")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    weekView === "this"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  This week
                </button>
                <button
                  onClick={() => setWeekView("last")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    weekView === "last"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Last week
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {quickStatsLoading ? (
              <div className="h-[220px] flex items-center justify-center">
                <NetilyLoader size={32} className="opacity-50" />
              </div>
            ) : !(weekView === "this"
                ? quickStats?.overview?.weekly_income
                : quickStats?.overview?.last_week_income
              )?.length ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart3 className="w-10 h-10 opacity-30" />
                <p className="text-sm">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    weekView === "this"
                      ? quickStats?.overview?.weekly_income
                      : quickStats?.overview?.last_week_income
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
        <Card className={dashboardCardClass}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Monthly Earnings
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {yearView === "this" ? `${new Date().getFullYear()} · month by month` : `${new Date().getFullYear() - 1} · month by month`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setYearView("this")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    yearView === "this"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {new Date().getFullYear()}
                </button>
                <button
                  onClick={() => setYearView("last")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    yearView === "last"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {new Date().getFullYear() - 1}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {quickStatsLoading ? (
              <div className="h-[220px] flex items-center justify-center">
                <NetilyLoader size={32} className="opacity-50" />
              </div>
            ) : !(yearView === "this"
                ? quickStats?.overview?.monthly_earnings
                : quickStats?.overview?.last_year_earnings
              )?.length ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart3 className="w-10 h-10 opacity-30" />
                <p className="text-sm">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    yearView === "this"
                      ? quickStats?.overview?.monthly_earnings
                      : quickStats?.overview?.last_year_earnings
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
        <Card className={dashboardCardClass}>
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
                <div className="col-span-2 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Your staff role has no quick actions assigned yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className={dashboardCardClass}>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest system events from audit log</CardDescription>
          </CardHeader>
          <CardContent>
            {quickStatsLoading ? (
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
            ) : (quickStats?.recent_activity ?? []).length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {(quickStats?.recent_activity ?? []).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-bold text-primary">
                        {(activity.user__email || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.user__email || "System"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.action} — {activity.object_repr || activity.model_name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
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
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
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