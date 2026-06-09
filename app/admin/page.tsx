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

      // Update live data separately
      if (sessionsRes.status === "fulfilled") {
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {user?.first_name || user?.username || "Admin"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Row 1: Key Metrics ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Customers - UPDATED DESCRIPTION */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(core?.total_customers ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">All PPPoE/Static users</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Customers - UPDATED TITLE & DESCRIPTION */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {((activeSubscriptions.pppoe?.length || 0) + (activeSubscriptions.hotspot?.length || 0) || core?.active_customers || 0).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span>Customers with active sub</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expired Customers - Uses fast single endpoint - NOW CLICKABLE */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
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
                <div className="text-2xl font-bold text-red-600">
                  {expiredCount.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span>Requires renewal</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Online / Active — clean ratio number + progress bar (REMOVED "Active subs" legend) */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/admin/users?tab=online-sessions')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online / Active</CardTitle>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (() => {
              const onlineCount = onlineTotal || onlineSessions.length
              const pppoe = activeSubscriptions.pppoe?.length || 0
              const hotspot = activeSubscriptions.hotspot?.length || 0
              const activeCount = pppoe + hotspot
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
                    <div className="flex justify-between text-xs text-slate-400">
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

                  {/* Legend - REMOVED "Active subs" */}
                  <div className="flex gap-3 pt-0.5">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      PPPoE: {pppoe}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                      Hotspot: {hotspot}
                    </span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 2: Network & Revenue ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Router Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-600" />
                Router Fleet
              </CardTitle>
              <Link href="/admin/routers">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
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
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {routers?.online_routers ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Offline</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {routers?.offline_routers ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">Warning / Maintenance</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {(routers?.warning_routers ?? 0) + (routers?.maintenance_routers ?? 0)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Routers</span>
                    <span className="font-semibold">{routers?.total_routers ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-500">Connected Users</span>
                    <span className="font-semibold">{routers?.total_connected_users ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Card — full-bleed tinted rows */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Revenue
              </CardTitle>
              <Link href="/admin/payments">
                <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-slate-600 px-2">
                  View all →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Today */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-blue-400 uppercase">Today</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatKSh(data.reports?.overview?.today_revenue ?? payments?.amount_today)}
                    </p>
                  </div>
                  {(data.reports?.overview?.today_change ?? 0) !== 0 && (
                    <ChangeBadge value={data.reports?.overview?.today_change ?? 0} />
                  )}
                </div>

                {/* This week */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-green-500 uppercase">This week</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatKSh(data.reports?.overview?.week_revenue ?? 0)}
                    </p>
                  </div>
                  {(data.reports?.overview?.week_change ?? 0) !== 0 && (
                    <ChangeBadge value={data.reports?.overview?.week_change ?? 0} />
                  )}
                </div>

                {/* This month */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-amber-500 uppercase">This month</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatKSh(data.reports?.overview?.month_revenue ?? payments?.amount_this_month)}
                    </p>
                  </div>
                  {(data.reports?.overview?.month_change ?? 0) !== 0 && (
                    <ChangeBadge value={data.reports?.overview?.month_change ?? 0} />
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Transactions today</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {data.reports?.overview?.total_transactions_today ?? payments?.payments_today ?? 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-600" />
                Support Tickets
              </CardTitle>
              <Link href="/admin/tickets">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
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
                <div className="pt-2 border-t flex items-center justify-between text-sm">
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
      <div className="grid gap-4 md:grid-cols-2">

        {/* Weekly Income Chart */}
        <Card>
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
        <Card>
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

      {/* ─── Row 3: Quick Actions & Recent Activity ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Manage Users</span>
                </Button>
              </Link>
              <Link href="/admin/routers">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-xs">Manage Routers</span>
                </Button>
              </Link>
              <Link href="/admin/payments">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">View Payments</span>
                </Button>
              </Link>
              <Link href="/admin/tickets">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                  <Ticket className="w-5 h-5 text-amber-600" />
                  <span className="text-xs">Support Tickets</span>
                </Button>
              </Link>
              <Link href="/admin/plans">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                  <BarChart3 className="w-5 h-5 text-cyan-600" />
                  <span className="text-xs">Manage Plans</span>
                </Button>
              </Link>
              <Link href="/admin/invoices">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-xs">Invoices</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
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
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
            <Link href="/admin/logs" className="w-full">
              <Button variant="ghost" size="sm" className="w-full text-slate-500">
                View all activity
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}