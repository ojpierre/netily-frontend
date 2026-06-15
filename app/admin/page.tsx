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
  Loader2,
  Wifi,
  Server,
  Ticket,
  Clock,
  RefreshCw,
  ChevronRight,
  Zap,
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

// Helper: dynamic greeting - clean, no emoji parade
function getGreeting(firstName?: string): string {
  const hour = new Date().getHours()
  const name = firstName ? `, ${firstName}` : ""
  
  if (hour >= 5 && hour < 12) return `Good morning${name}`
  if (hour >= 12 && hour < 17) return `Good afternoon${name}`
  if (hour >= 17 && hour < 21) return `Good evening${name}`
  return `Working late${name}`
}

// ChangeBadge component for revenue changes
function ChangeBadge({ value }: { value: number }) {
  const isPositive = value > 0
  const absValue = Math.abs(value)
  return (
    <Badge
      variant="secondary"
      className={`text-[10px] font-medium px-1.5 py-0 ${isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"}`}
    >
      {isPositive ? "+" : "-"}{absValue}%
    </Badge>
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
  
  const [onlineSessions, setOnlineSessions] = useState<any[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<{ pppoe: any[]; hotspot: any[]; total: number }>({ 
    pppoe: [], 
    hotspot: [], 
    total: 0 
  })
  const [onlineTotal, setOnlineTotal] = useState(0)
  const [expiredCount, setExpiredCount] = useState<number>(0)
  
  const canOpenRoute = (href: string) => canAccess(user, getAccessRuleForPath(href))
  
  const quickActions = [
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/routers", label: "Routers", icon: Wifi },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/tickets", label: "Tickets", icon: Ticket },
    { href: "/admin/plans", label: "Plans", icon: BarChart3 },
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
  const activeCount = (activeSubscriptions.pppoe?.length || 0) + (activeSubscriptions.hotspot?.length || 0)
  const onlineCount = onlineTotal || onlineSessions.length

  if (error && !core) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Overview of your ISP operations</p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header — clean, just the essentials */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {getGreeting(user?.first_name || user?.username)}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats Row — borderless, numbers breathe */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
        {[
          { label: "Total customers", value: core?.total_customers ?? 0, sub: "All accounts" },
          { label: "Active", value: activeCount || core?.active_customers || 0, sub: "Subscribed", positive: true },
          { label: "Expired", value: expiredCount, sub: "Need renewal", negative: true },
          { label: "Online now", value: onlineCount, sub: `of ${activeCount} active` },
        ].map(({ label, value, sub, positive, negative }) => (
          <div key={label} className="px-4 md:px-6 py-4 md:py-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
            <p className={`text-2xl md:text-3xl font-semibold tabular-nums tracking-tight ${
              positive ? "text-emerald-600 dark:text-emerald-500" : 
              negative ? "text-red-500 dark:text-red-400" : 
              "text-slate-900 dark:text-white"
            }`}>
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Network & Revenue */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        
        {/* Router Status */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
                Router Fleet
              </CardTitle>
              {canOpenRoute("/admin/routers") && (
                <Link href="/admin/routers">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Online</span>
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                    {routers?.online_routers ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Offline</span>
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                    {routers?.offline_routers ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Warning</span>
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                    {(routers?.warning_routers ?? 0) + (routers?.maintenance_routers ?? 0)}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-400">
                  <span>Total routers</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{routers?.total_routers ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
                Revenue
              </CardTitle>
              {canOpenRoute("/admin/payments") && (
                <Link href="/admin/payments">
                  <span className="text-xs text-slate-400 hover:text-slate-600">View all →</span>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Today</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatKSh(data.reports?.overview?.today_revenue ?? payments?.amount_today)}
                    </p>
                    {(data.reports?.overview?.today_change ?? 0) !== 0 && (
                      <ChangeBadge value={data.reports?.overview?.today_change ?? 0} />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">This week</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatKSh(data.reports?.overview?.week_revenue ?? 0)}
                    </p>
                    {(data.reports?.overview?.week_change ?? 0) !== 0 && (
                      <ChangeBadge value={data.reports?.overview?.week_change ?? 0} />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">This month</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatKSh(data.reports?.overview?.month_revenue ?? payments?.amount_this_month)}
                    </p>
                    {(data.reports?.overview?.month_change ?? 0) !== 0 && (
                      <ChangeBadge value={data.reports?.overview?.month_change ?? 0} />
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-400">
                  <span>Transactions today</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                    {data.reports?.overview?.total_transactions_today ?? payments?.payments_today ?? 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
                Support Tickets
              </CardTitle>
              {canOpenRoute("/admin/tickets") && (
                <Link href="/admin/tickets">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Open</span>
                  <span className="text-lg font-semibold text-red-500 dark:text-red-400 tabular-nums">{tickets?.open ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">In Progress</span>
                  <span className="text-lg font-semibold text-amber-500 dark:text-amber-400 tabular-nums">{tickets?.in_progress ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Resolved</span>
                  <span className="text-lg font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums">{tickets?.resolved ?? 0}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-400">
                  <span>Avg response time</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{tickets?.avg_response_time ?? "—"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        
        {/* Weekly Income Chart */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 px-5 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
                  Weekly Income
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  {weekView === "this" ? "This week" : "Last week"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setWeekView("this")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    weekView === "this"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  This week
                </button>
                <button
                  onClick={() => setWeekView("last")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    weekView === "last"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Last week
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : !(weekView === "this"
                ? data.reports?.overview?.weekly_income
                : data.reports?.overview?.last_week_income
              )?.length ? (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400">
                <BarChart3 className="w-8 h-8 opacity-30" />
                <p className="text-sm">No data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    weekView === "this"
                      ? data.reports?.overview?.weekly_income
                      : data.reports?.overview?.last_week_income
                  }
                  barSize={32}
                  margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value: number) => [`KSh ${value.toLocaleString("en-KE")}`, "Income"]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  />
                  <Bar
                    dataKey="amount"
                    fill={weekView === "this" ? "#3b82f6" : "#8b5cf6"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Earnings Chart */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 px-5 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
                  Monthly Earnings
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  {yearView === "this" ? new Date().getFullYear() : new Date().getFullYear() - 1}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setYearView("this")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    yearView === "this"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {new Date().getFullYear()}
                </button>
                <button
                  onClick={() => setYearView("last")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    yearView === "last"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {new Date().getFullYear() - 1}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : !(yearView === "this"
                ? data.reports?.overview?.monthly_earnings
                : data.reports?.overview?.last_year_earnings
              )?.length ? (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400">
                <BarChart3 className="w-8 h-8 opacity-30" />
                <p className="text-sm">No data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    yearView === "this"
                      ? data.reports?.overview?.monthly_earnings
                      : data.reports?.overview?.last_year_earnings
                  }
                  barSize={20}
                  margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value: number) => [`KSh ${value.toLocaleString("en-KE")}`, "Earnings"]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  />
                  <Bar
                    dataKey="amount"
                    fill={yearView === "this" ? "#10b981" : "#f59e0b"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Quick Actions */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-2">
              {quickActions.length ? quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.href} href={action.href}>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
                      <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {action.label}
                      </span>
                    </div>
                  </Link>
                )
              }) : (
                <div className="col-span-3 text-center text-sm text-slate-500 py-6">
                  No quick actions available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-2xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {data.recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {(activity.user__email || "S").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {activity.user__email || "System"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.action} · {activity.object_repr || activity.model_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {timeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {canOpenRoute("/admin/logs") && data.recentActivity.length > 0 && (
            <CardFooter className="px-5 pb-5 pt-0">
              <Link href="/admin/logs" className="w-full">
                <Button variant="ghost" size="sm" className="w-full text-slate-500 text-xs">
                  View all activity
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}