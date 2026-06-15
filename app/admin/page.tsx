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

// Helper: dynamic greeting based on time of day
function getGreeting(firstName?: string): { greeting: string; emoji: string } {
  const hour = new Date().getHours()
  const name = firstName ? `, ${firstName}` : ""
  
  if (hour >= 5 && hour < 12) {
    return { greeting: `Good morning${name}`, emoji: "☀️" }
  } else if (hour >= 12 && hour < 17) {
    return { greeting: `Good afternoon${name}`, emoji: "🌤️" }
  } else if (hour >= 17 && hour < 21) {
    return { greeting: `Good evening${name}`, emoji: "🌆" }
  } else {
    return { greeting: `Burning the midnight oil${name}`, emoji: "🌙" }
  }
}

// ChangeBadge component for revenue changes
function ChangeBadge({ value }: { value: number }) {
  const isPositive = value > 0
  const absValue = Math.abs(value)
  return (
    <Badge
      variant="secondary"
      className={`text-xs ${isPositive ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"}`}
    >
      {isPositive ? "+" : "-"}{absValue}%
    </Badge>
  )
}

// ──────────────────────────────────────
// PREMIUM COMPONENTS
// ──────────────────────────────────────

// Live Clock Component
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = time.getHours().toString().padStart(2, "0")
  const mm = time.getMinutes().toString().padStart(2, "0")
  const ss = time.getSeconds().toString().padStart(2, "0")
  const date = time.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })

  return (
    <div className="hidden md:flex flex-col items-end text-right mr-2">
      <span className="text-lg font-mono font-semibold tracking-widest text-slate-700 dark:text-slate-200 tabular-nums leading-none">
        {hh}
        <span className="animate-pulse text-slate-400">:</span>
        {mm}
        <span className="text-slate-400 text-sm ml-0.5">{ss}</span>
      </span>
      <span className="text-[10px] text-slate-400 tracking-wide mt-0.5">{date}</span>
    </div>
  )
}

// Count-up Animation Hook
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target && target !== 0) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { 
        setValue(target)
        clearInterval(timer)
      } else {
        setValue(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

// Section Divider Component
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-300 dark:text-slate-600 select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
    </div>
  )
}

// Premium Metric Card Component (reusable)
function PremiumMetricCard({ 
  title, 
  value, 
  icon: Icon, 
  accentColor, 
  description, 
  loading,
  onClick,
  trend
}: { 
  title: string
  value: number
  icon: any
  accentColor: "blue" | "emerald" | "red" | "violet"
  description: string
  loading: boolean
  onClick?: () => void
  trend?: "up" | "down"
}) {
  const displayValue = useCountUp(value)
  
  const colorConfig = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      hoverBg: "group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60",
      text: "text-blue-600 dark:text-blue-400",
      bar: "from-blue-500 via-blue-400 to-transparent",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      hoverBg: "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/60",
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "from-emerald-500 via-emerald-400 to-transparent",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/40",
      hoverBg: "group-hover:bg-red-100 dark:group-hover:bg-red-950/60",
      text: "text-red-600 dark:text-red-400",
      bar: "from-red-500 via-red-400 to-transparent",
    },
    violet: {
      bg: "bg-violet-50 dark:bg-violet-950/40",
      hoverBg: "group-hover:bg-violet-100 dark:group-hover:bg-violet-950/60",
      text: "text-violet-600 dark:text-violet-400",
      bar: "from-violet-500 via-violet-400 to-transparent",
    },
  }
  
  const config = colorConfig[accentColor]
  
  return (
    <Card 
      className={`relative overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-${onClick ? 'pointer' : 'default'}`}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.bar}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
        <CardTitle className="text-sm font-medium tracking-tight text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${config.bg} ${config.hoverBg} transition-colors`}>
          <Icon className={`h-4 w-4 ${config.text}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {displayValue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
              {trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
              <span>{description}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────
// MAIN COMPONENT
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
  const canOpenRoute = (href: string) => canAccess(user, getAccessRuleForPath(href))
  const quickActions = [
    { href: "/admin/users", label: "Manage Users", icon: Users, color: "blue" },
    { href: "/admin/routers", label: "Manage Routers", icon: Wifi, color: "green" },
    { href: "/admin/payments", label: "View Payments", icon: CreditCard, color: "purple" },
    { href: "/admin/tickets", label: "Support Tickets", icon: Ticket, color: "amber" },
    { href: "/admin/plans", label: "Manage Plans", icon: BarChart3, color: "cyan" },
    { href: "/admin/invoices", label: "Invoices", icon: DollarSign, color: "green" },
  ].filter((item) => canOpenRoute(item.href))

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)

      const [coreRes, routerRes, paymentRes, ticketRes, reportsRes, sessionsRes, activeSubsRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getRouterDashboardStats(),
        adminApi.getPaymentDashboardStats(),
        adminApi.getTicketStats(),
        adminApi.getReportsData("30d"),
        adminApi.getOnlineSessions(),
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

      if (sessionsRes.status === "fulfilled") {
        setOnlineSessions(sessionsRes.value?.sessions || [])
        setOnlineTotal(sessionsRes.value?.total || sessionsRes.value?.sessions?.length || 0)
      }
      if (activeSubsRes.status === "fulfilled") {
        const subs = activeSubsRes.value || { pppoe: [], hotspot: [], total: 0 }
        setActiveSubscriptions(subs)
      }

      let expiredViaRadius = 0
      try {
        expiredViaRadius = await adminApi.getExpiredRADIUSCount()
      } catch (radiusErr) {
        console.warn('Failed to fetch expired RADIUS count:', radiusErr)
        if (coreRes.status === "fulfilled") {
          expiredViaRadius = (coreRes.value?.expired_customers || 0)
        }
      }
      
      setExpiredCount(expiredViaRadius)
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
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  const core = data.core
  const routers = data.routers
  const payments = data.payments
  const tickets = data.tickets

  if (error && !core) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-1.5 text-sm">
            <span>⚠️</span>
            <span>Overview of your ISP operations</span>
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    )
  }

  const activeCount = (activeSubscriptions.pppoe?.length || 0) + (activeSubscriptions.hotspot?.length || 0)
  const onlineCount = onlineTotal || onlineSessions.length

  return (
    <div className="space-y-6">
      {/* Global shimmer animation styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Premium Header with dot-grid background */}
      <div className="relative flex items-center justify-between pb-6 mb-2">
        {/* Subtle dot-grid background texture */}
        <div
          className="absolute inset-0 -mx-6 -mt-6 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative">
          {/* Animated gradient "Dashboard" title */}
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #475569 50%, #0f172a 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 4s linear infinite",
            }}
          >
            Dashboard
          </h1>

          {/* Dynamic greeting with status pulse */}
          {(() => {
            const { greeting, emoji } = getGreeting(user?.first_name || user?.username)
            return (
              <p className="text-slate-400 mt-1.5 flex items-center gap-2 text-sm font-medium">
                <span className="text-base leading-none">{emoji}</span>
                <span>{greeting}</span>
                <span className="inline-flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
                    Systems live
                  </span>
                </span>
              </p>
            )
          })()}
        </div>

        <div className="relative flex gap-2 items-center">
          <LiveClock />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Row 1: Key Metrics (Premium Cards) ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumMetricCard
          title="Total Customers"
          value={core?.total_customers ?? 0}
          icon={Users}
          accentColor="blue"
          description="All PPPoE / Static users"
          loading={loading}
        />

        <PremiumMetricCard
          title="Active Subscriptions"
          value={activeCount || core?.active_customers || 0}
          icon={UserCheck}
          accentColor="emerald"
          description="Customers with active sub"
          loading={loading}
          trend="up"
        />

        <PremiumMetricCard
          title="Expired"
          value={expiredCount}
          icon={UserX}
          accentColor="red"
          description="Requires renewal"
          loading={loading}
          trend="down"
          onClick={() => router.push('/admin/users?status=expired')}
        />

        <Card 
          className="relative overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          onClick={() => router.push('/admin/users?tab=online-sessions')}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-violet-400 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
            <CardTitle className="text-sm font-medium tracking-tight text-slate-600 dark:text-slate-400">
              Online / Active
            </CardTitle>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="relative inline-flex">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (() => {
              const pct = activeCount > 0 ? Math.round((onlineCount / activeCount) * 100) : 0
              return (
                <div className="space-y-3 pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold text-slate-900 dark:text-slate-100 leading-none tabular-nums tracking-tight">
                      {onlineCount}
                    </span>
                    <span className="text-xl text-slate-300">/</span>
                    <span className="text-xl font-medium text-slate-500 leading-none tabular-nums tracking-tight">
                      {activeCount}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Online now</span>
                      <span>{pct}% connected</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-0.5">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      PPPoE: {activeSubscriptions.pppoe?.length || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                      Hotspot: {activeSubscriptions.hotspot?.length || 0}
                    </span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      <SectionDivider label="Network & Revenue" />

      {/* ─── Row 2: Network & Revenue ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Router Status */}
        <Card className="ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 tracking-tight">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Server className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                Router Fleet
              </CardTitle>
              {canOpenRoute("/admin/routers") && (
                <Link href="/admin/routers">
                  <Button variant="ghost" size="sm" className="rounded-full">
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
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums tracking-tight text-green-600">
                    {routers?.online_routers ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Offline</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums tracking-tight text-red-600">
                    {routers?.offline_routers ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">Warning / Maintenance</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums tracking-tight text-amber-600">
                    {(routers?.warning_routers ?? 0) + (routers?.maintenance_routers ?? 0)}
                  </span>
                </div>
                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Routers</span>
                    <span className="font-semibold tabular-nums tracking-tight">{routers?.total_routers ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-500">Connected Users</span>
                    <span className="font-semibold tabular-nums tracking-tight">{routers?.total_connected_users ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Card - Premium Stacked Design */}
        <Card className="ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 tracking-tight">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Revenue
              </CardTitle>
              {canOpenRoute("/admin/payments") && (
                <Link href="/admin/payments">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-slate-600 rounded-full">
                    View all →
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-1">
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : (
              <>
                {[
                  { label: "Today", value: data.reports?.overview?.today_revenue ?? payments?.amount_today, change: data.reports?.overview?.today_change, color: "blue" },
                  { label: "This week", value: data.reports?.overview?.week_revenue ?? 0, change: data.reports?.overview?.week_change, color: "emerald" },
                  { label: "This month", value: data.reports?.overview?.month_revenue ?? payments?.amount_this_month, change: data.reports?.overview?.month_change, color: "amber" },
                ].map(({ label, value, change, color }) => (
                  <div key={label}
                    className={`group flex items-center justify-between px-3 py-3 rounded-xl border border-transparent hover:border-${color}-100 dark:hover:border-${color}-900/30 hover:bg-${color}-50/50 dark:hover:bg-${color}-950/20 transition-all duration-200 cursor-default`}
                  >
                    <div>
                      <p className={`text-[10px] font-bold tracking-[0.12em] uppercase text-${color}-500 dark:text-${color}-400`}>
                        {label}
                      </p>
                      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums tracking-tight">
                        {formatKSh(value)}
                      </p>
                    </div>
                    {change !== undefined && change !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${change > 0 ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"}`}>
                        {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(change)}%
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 px-1">
                  <span>Transactions today</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                    {data.reports?.overview?.total_transactions_today ?? payments?.payments_today ?? 0}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card className="ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 tracking-tight">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40">
                  <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                Support Tickets
              </CardTitle>
              {canOpenRoute("/admin/tickets") && (
                <Link href="/admin/tickets">
                  <Button variant="ghost" size="sm" className="rounded-full">
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
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-center">
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-red-600">{tickets?.open ?? 0}</p>
                    <p className="text-xs text-slate-500">Open</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center">
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-amber-600">{tickets?.in_progress ?? 0}</p>
                    <p className="text-xs text-slate-500">In Progress</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-center">
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-green-600">{tickets?.resolved ?? 0}</p>
                    <p className="text-xs text-slate-500">Resolved</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-blue-600">{tickets?.total ?? 0}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    Avg Response
                  </div>
                  <span className="font-medium tabular-nums tracking-tight">{tickets?.avg_response_time ?? "—"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SectionDivider label="Earnings Trend" />

      {/* ─── Row 3: Weekly Income & Monthly Earnings ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Income Chart */}
        <Card className="ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
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
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
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
                  cursor="default"
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
        <Card className="ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
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
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
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
                  cursor="default"
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

      <SectionDivider label="Operations" />

      {/* ─── Row 4: Quick Actions & Recent Activity ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions - Premium Icon Cards */}
        <Card className="ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 tracking-tight">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.length ? quickActions.map((action) => {
                const Icon = action.icon
                const colorClasses: Record<string, string> = {
                  blue: "hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800",
                  green: "hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-200 dark:hover:border-green-800",
                  purple: "hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:border-purple-800",
                  amber: "hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-200 dark:hover:border-amber-800",
                  cyan: "hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-200 dark:hover:border-cyan-800",
                }
                const textColors: Record<string, string> = {
                  blue: "text-blue-600 dark:text-blue-400",
                  green: "text-green-600 dark:text-green-400",
                  purple: "text-purple-600 dark:text-purple-400",
                  amber: "text-amber-600 dark:text-amber-400",
                  cyan: "text-cyan-600 dark:text-cyan-400",
                }
                return (
                  <Link key={action.href} href={action.href}>
                    <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${colorClasses[action.color] ?? ""}`}>
                      <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 ${textColors[action.color] ?? "text-slate-600"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight">
                        {action.label}
                      </span>
                    </div>
                  </Link>
                )
              }) : (
                <div className="col-span-3 rounded-xl border border-dashed p-4 text-center text-sm text-slate-500">
                  Your staff role has no quick actions assigned yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-base tracking-tight">Recent Activity</CardTitle>
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
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {(activity.user__email || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {activity.user__email || "System"}
                      </p>
                      <p className="text-xs text-slate-500">
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
                <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:shadow-sm transition-all duration-200 rounded-full">
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