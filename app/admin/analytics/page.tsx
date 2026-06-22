"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  BarChart3,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { adminApi } from "@/lib/admin-api"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

// ─── Chart constants ──────────────────────────────────────────────────────────
const C = {
  blue: "#3b82f6",
  green: "#22c55e",
  amber: "#f59e0b",
  orange: "#f97316",
  purple: "#8b5cf6",
  red: "#ef4444",
  emerald: "#10b981",
  slate: "#94a3b8",
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, fmt }: { active?: boolean; payload?: any[]; label?: string; fmt?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border-0 bg-slate-900 dark:bg-slate-800 px-3.5 py-2.5 shadow-2xl text-sm min-w-[150px]">
      {label && <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color ?? p.fill }} />
          <span className="flex-1 text-slate-300 text-[11px]">{p.name}</span>
          <span className="font-bold text-white text-xs">{fmt ? fmt(Number(p.value)) : Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ label = "No data for this period" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <BarChart3 className="w-10 h-10 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtKsh = (n: number) => {
  if (n >= 1_000_000) return `Ksh ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Ksh ${(n / 1_000).toFixed(0)}K`
  return `Ksh ${Math.round(n).toLocaleString()}`
}

const fmtKshFull = (n: number) => `Ksh ${Math.round(n).toLocaleString()}`

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportsData {
  overview: {
    today_revenue: number
    today_change: number
    week_revenue: number
    week_change: number
    month_revenue: number
    month_change: number
    total_transactions_today: number
    hourly_revenue: { hour: string; peak_hours: number; business_hours: number; off_hours: number }[]
    user_registrations: { date: string; count: number }[]
    network_data_flow: { date: string; upload: number; download: number }[]
    weekly_income: { day: string; amount: number }[]
    last_week_income: { day: string; amount: number }[]
    monthly_earnings: { month: string; amount: number }[]
    last_year_earnings: { month: string; amount: number }[]
  }
  financial: {
    income_comparison: {
      today: { amount: number; transactions: number }
      yesterday: { amount: number; transactions: number }
      this_week: { amount: number; transactions: number }
      last_week: { amount: number; transactions: number }
    }
    monthly_performance: {
      this_month: { amount: number; transactions: number }
      last_month: { amount: number; transactions: number }
      growth_rate: number
    }
    hourly_revenue: { hour: string; peak_hours: number; business_hours: number; off_hours: number }[]
  }
  users: {
    registration_trends: { date: string; count: number }[]
    summary: { total_registrations: number; avg_per_day: number; peak_day: string }
  }
  network: {
    daily_usage: { date: string; upload: number; download: number }[]
    usage_summary: { total_upload: number; total_download: number; total_usage: number }
    performance: { peak_usage_day: string; avg_daily_usage: string; download_upload_ratio: string }
  }
  top_customers: {
    type: string
    display_name: string
    identifier: string
    total_amount: number
    tx_count: number
  }[]
  plan_analytics: {
    plan_type: string
    connection_type: string
    name: string
    base_price: number
    total_revenue: number
    total_transactions: number
  }[]
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<ReportsData | null>(null)
  const [weekView, setWeekView] = useState<"this" | "last">("this")
  const [yearView, setYearView] = useState<"this" | "last">("this")
  
  // ── Router Daily Revenue State ──
  const [routerRevData, setRouterRevData] = useState<any>(null)
  const [selectedRouter, setSelectedRouter] = useState<string | number>("")
  const [routerTimeRange, setRouterTimeRange] = useState("30d")
  const [routerDropdownOpen, setRouterDropdownOpen] = useState(false)
  const routerFetchedRef = useRef(false)
  
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!adminApi.getAdminToken()) { setLoading(false); return }
    try {
      const res = await adminApi.getReportsData(timeRange)
      setData(res)
    } catch (err) {
      console.error("Failed to fetch reports data:", err)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  // ── Fetch Router Revenue ──
  const fetchRouterRevenue = useCallback(async (trRange: string, routerId?: string | number) => {
    try {
      const res = await adminApi.getRouterDailyRevenue(trRange, routerId)
      setRouterRevData(res)
      if (!routerId && res.routers?.length) {
        setSelectedRouter(res.routers[0].id)
      }
    } catch (err) {
      console.error("Failed to fetch router revenue:", err)
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) { fetchedRef.current = true; fetchData() }
  }, [fetchData])

  useEffect(() => { if (fetchedRef.current) fetchData() }, [timeRange, fetchData])

  // Fetch router revenue on mount
  useEffect(() => {
    if (!routerFetchedRef.current) {
      routerFetchedRef.current = true
      fetchRouterRevenue(routerTimeRange, selectedRouter || undefined)
    }
  }, []) // eslint-disable-line

  // Click outside handler for router dropdown - FIXED
  useEffect(() => {
    if (!routerDropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside the dropdown container
      if (!target.closest('.router-dropdown-container')) {
        setRouterDropdownOpen(false)
      }
    }
    // Use mousedown to catch the event before click
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [routerDropdownOpen])

  const handleRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportAnalyticsReport(timeRange, "csv")
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `reports-${timeRange}.csv`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch { /* silent */ }
  }

  const handleRouterChange = (routerId: string | number) => {
    setSelectedRouter(routerId)
    fetchRouterRevenue(routerTimeRange, routerId)
    setRouterDropdownOpen(false)
  }

  const handleRouterTimeRangeChange = (tr: string) => {
    setRouterTimeRange(tr)
    fetchRouterRevenue(tr, selectedRouter || undefined)
  }

  const o = data?.overview
  const f = data?.financial
  const u = data?.users
  const n = data?.network

  // ─── Premium Revenue Stat Card ─────────────────────────────────────────────
  const RevenueCard = ({ label, amount, change, extra, accent = "bg-blue-500" }: { 
    label: string; amount: number; change: number; extra?: string; accent?: string 
  }) => {
    const positive = change >= 0
    return (
      <Card className={`relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow`}>
        <div className={`absolute inset-0 opacity-5 ${accent}`} />
        <div className={`absolute top-0 left-0 w-1 h-full ${accent}`} />
        <CardContent className="p-5 pl-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${positive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
              {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {positive ? "+" : ""}{change}%
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{fmtKshFull(amount)}</p>
          {extra && <p className="text-[11px] text-muted-foreground mt-1">{extra}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports &amp; Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Comprehensive insights into your ISP operations and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange(timeRange === "30d" ? "90d" : timeRange === "90d" ? "7d" : "30d")}>
            <Calendar className="w-4 h-4 mr-1.5" />
            Last {timeRange === "7d" ? "7 Days" : timeRange === "30d" ? "30 Days" : "90 Days"}
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Financial
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-1.5">
            <Wifi className="w-4 h-4" /> Network
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════
            OVERVIEW TAB
           ════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Premium Revenue cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueCard label="Today's Revenue" amount={o?.today_revenue ?? 0} change={o?.today_change ?? 0} extra="vs yesterday" accent="bg-blue-500" />
            <RevenueCard label="This Week" amount={o?.week_revenue ?? 0} change={o?.week_change ?? 0} extra="vs last week" accent="bg-violet-500" />
            <RevenueCard label="This Month" amount={o?.month_revenue ?? 0} change={o?.month_change ?? 0} extra="vs last month" accent="bg-emerald-500" />
            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 opacity-5 bg-orange-500" />
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
              <CardContent className="p-5 pl-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transactions Today</p>
                  <Activity className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{(o?.total_transactions_today ?? 0).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Completed payments</p>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Revenue Distribution - Premium */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Hourly Income Distribution</CardTitle>
                  <CardDescription className="text-[11px]">Revenue breakdown by hour with peak analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!o?.hourly_revenue?.length ? <div className="h-[260px] flex items-center justify-center"><EmptyChart /></div> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={o.hourly_revenue} barSize={14} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tickFormatter={fmtKsh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                    <Tooltip content={(p) => <ChartTooltip {...p} fmt={fmtKshFull} />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="peak_hours" name="Peak Hours" stackId="a" fill={C.orange} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="business_hours" name="Business Hours" stackId="a" fill={C.blue} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="off_hours" name="Off Hours" stackId="a" fill={C.purple} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Weekly Income & Monthly Earnings */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Weekly Income Chart - Premium */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Weekly Income</CardTitle>
                      <CardDescription className="text-[11px]">Daily revenue for the selected week</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    <button
                      onClick={() => setWeekView("this")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        weekView === "this"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setWeekView("last")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        weekView === "last"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Last Week
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const weekData = weekView === "this" ? o?.weekly_income : o?.last_week_income
                  return !weekData?.length
                    ? <div className="h-[220px] flex items-center justify-center"><EmptyChart /></div>
                    : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weekData} barSize={32} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmtKsh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                          <Tooltip content={(p) => <ChartTooltip {...p} fmt={fmtKshFull} />} />
                          <Bar
                            dataKey="amount"
                            name="Income"
                            fill={weekView === "this" ? C.blue : C.purple}
                            radius={[4, 4, 0, 0]}
                            label={{
                              position: "top",
                              fontSize: 10,
                              fill: "#64748b",
                              formatter: (v: number) => v > 0 ? (v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v}`) : "",
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                })()}
              </CardContent>
            </Card>

            {/* Monthly Earnings Chart - Premium */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Monthly Earnings</CardTitle>
                      <CardDescription className="text-[11px]">Revenue per month for the selected year</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    <button
                      onClick={() => setYearView("this")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        yearView === "this"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      This Year
                    </button>
                    <button
                      onClick={() => setYearView("last")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        yearView === "last"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Last Year
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const monthData = yearView === "this" ? o?.monthly_earnings : o?.last_year_earnings
                  return !monthData?.length
                    ? <div className="h-[220px] flex items-center justify-center"><EmptyChart /></div>
                    : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthData} barSize={22} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmtKsh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                          <Tooltip content={(p) => <ChartTooltip {...p} fmt={fmtKshFull} />} />
                          <Bar
                            dataKey="amount"
                            name="Earnings"
                            fill={yearView === "this" ? C.emerald : C.amber}
                            radius={[4, 4, 0, 0]}
                            label={{
                              position: "top",
                              fontSize: 10,
                              fill: "#64748b",
                              formatter: (v: number) => v > 0 ? (v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v}`) : "",
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                })()}
              </CardContent>
            </Card>

          </div>

          {/* User Registrations & Network Data Flow side by side */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* User Registrations - Premium */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">User Registrations</CardTitle>
                    <CardDescription className="text-[11px]">Daily new user registrations (Last {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!u?.registration_trends?.length ? <div className="h-[220px] flex items-center justify-center"><EmptyChart /></div> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={u.registration_trends} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.emerald} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(1, Math.floor((u.registration_trends.length) / 8))} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={(p) => <ChartTooltip {...p} />} />
                      <Area type="monotone" dataKey="count" name="Registrations" stroke={C.emerald} strokeWidth={2} fill="url(#regGrad)" dot={{ r: 3, fill: C.emerald, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Network Data Flow - Premium */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-violet-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Network Data Flow</CardTitle>
                    <CardDescription className="text-[11px]">Interactive download and upload data usage patterns</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!o?.network_data_flow?.length ? <div className="h-[220px] flex items-center justify-center"><EmptyChart /></div> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={o.network_data_flow} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.green} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.blue} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(1, Math.floor((o.network_data_flow.length) / 8))} />
                      <YAxis tickFormatter={(v) => `${v} GB`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                      <Tooltip content={(p) => <ChartTooltip {...p} fmt={(v) => `${v.toFixed(1)} GB`} />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="upload" name="Upload" stroke={C.blue} strokeWidth={2} fill="url(#ulGrad)" dot={false} />
                      <Area type="monotone" dataKey="download" name="Download" stroke={C.green} strokeWidth={2} fill="url(#dlGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════
            FINANCIAL TAB
           ════════════════════════════════════════════════ */}
        <TabsContent value="financial" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Income Comparison - Premium */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Income Comparison</CardTitle>
                    <CardDescription className="text-[11px]">Current vs previous period performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {[
                  { label: "Today", data: f?.income_comparison?.today, accent: "bg-blue-500" },
                  { label: "Yesterday", data: f?.income_comparison?.yesterday, accent: "bg-slate-300" },
                  { label: "This Week", data: f?.income_comparison?.this_week, accent: "bg-violet-500" },
                  { label: "Last Week", data: f?.income_comparison?.last_week, accent: "bg-slate-300" },
                ].map(({ label, data, accent }, i, arr) => (
                  <div key={label} className={`flex items-center gap-3 px-5 py-3.5 ${i < arr.length - 1 ? "border-b" : ""} hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors`}>
                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${accent}`} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">{label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{fmtKshFull(data?.amount ?? 0)}</span>
                      <p className="text-[10px] text-muted-foreground">{data?.transactions ?? 0} txns</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Monthly Performance - Premium */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-amber-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Monthly Performance</CardTitle>
                    <CardDescription className="text-[11px]">This month vs last month comparison</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b bg-blue-50/50 -mx-6 px-6 rounded-t-lg">
                  <span className="text-sm font-medium text-slate-700">This Month</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{fmtKshFull(f?.monthly_performance?.this_month?.amount ?? 0)}</span>
                    <p className="text-xs text-muted-foreground">{f?.monthly_performance?.this_month?.transactions ?? 0} transactions</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-b">
                  <span className="text-sm font-medium text-slate-700">Last Month</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{fmtKshFull(f?.monthly_performance?.last_month?.amount ?? 0)}</span>
                    <p className="text-xs text-muted-foreground">{f?.monthly_performance?.last_month?.transactions ?? 0} transactions</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-slate-700">Growth Rate</span>
                  <Badge variant="outline" className={(f?.monthly_performance?.growth_rate ?? 0) >= 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                    {(f?.monthly_performance?.growth_rate ?? 0) >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {(f?.monthly_performance?.growth_rate ?? 0) >= 0 ? "+" : ""}{f?.monthly_performance?.growth_rate ?? 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Revenue Analysis - Premium */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-amber-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Hourly Revenue Analysis</CardTitle>
                  <CardDescription className="text-[11px]">Peak revenue hours and patterns with detailed insights</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!f?.hourly_revenue?.length ? <div className="h-[320px] flex items-center justify-center"><EmptyChart /></div> : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={f.hourly_revenue} barSize={20} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtKsh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                    <Tooltip content={(p) => <ChartTooltip {...p} fmt={fmtKshFull} />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="peak_hours" name="Peak Hours" stackId="a" fill={C.orange} />
                    <Bar dataKey="business_hours" name="Business Hours" stackId="a" fill={C.blue} />
                    <Bar dataKey="off_hours" name="Off Hours" stackId="a" fill={C.purple} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ── Plan Transaction & Revenue Analytics ── */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-teal-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-500" /> Plan Performance
                  </CardTitle>
                  <CardDescription className="text-[11px]">All active plans — total transactions &amp; lifetime revenue generated</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!data?.plan_analytics?.length ? (
                <EmptyChart label="No plan data yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Plan</th>
                        <th className="pb-2 pr-4 font-medium">Type</th>
                        <th className="pb-2 pr-4 font-medium text-right">Base Price</th>
                        <th className="pb-2 pr-4 font-medium text-right">Transactions</th>
                        <th className="pb-2 font-medium text-right">Lifetime Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.plan_analytics.map((p, i) => {
                        const isHotspot = p.plan_type === "hotspot"
                        const maxRev = Math.max(...data.plan_analytics.map((x) => x.total_revenue), 1)
                        const barPct = Math.round((p.total_revenue / maxRev) * 100)
                        return (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 pr-4 font-medium text-slate-800 max-w-[200px]">
                              <p className="truncate">{p.name}</p>
                              <div
                                className="mt-1 h-1 rounded-full bg-teal-500 opacity-60"
                                style={{ width: `${barPct}%` }}
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant="outline"
                                className={
                                  isHotspot
                                    ? "text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                                    : "text-[10px] bg-purple-50 text-purple-700 border-purple-200"
                                }
                              >
                                {isHotspot ? "📶 Hotspot" : "🔌 " + p.connection_type}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-right text-slate-600">
                              {fmtKshFull(p.base_price)}
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <span className="font-semibold text-slate-800">
                                {p.total_transactions.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <span className={`font-bold ${p.total_revenue > 0 ? "text-teal-700" : "text-slate-400"}`}>
                                {fmtKshFull(p.total_revenue)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Per-Router Daily Hotspot Revenue with Premium Dropdown ── */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-blue-500" /> Daily Hotspot Revenue by Router
                    </CardTitle>
                    <CardDescription className="text-[11px]">Select a router to see its daily revenue trend</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Premium Router Selector - with container class for click-outside detection */}
                  <div className="relative router-dropdown-container">
                    <button
                      onClick={() => setRouterDropdownOpen(!routerDropdownOpen)}
                      className="flex items-center gap-2 text-xs border rounded-lg px-3 py-1.5 bg-background hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all min-w-[140px] justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        <Wifi className="w-3 h-3 text-blue-500" />
                        <span className="font-medium truncate max-w-[110px]">
                          {routerRevData?.routers?.find((r: any) => String(r.id) === String(selectedRouter))?.name || "Select Router"}
                        </span>
                      </div>
                      <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${routerDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {routerDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-xl border bg-background shadow-xl overflow-hidden">
                        <div className="px-3 py-2 border-b">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Select Router</p>
                        </div>
                        {routerRevData?.routers?.map((r: any) => {
                          const isSelected = String(r.id) === String(selectedRouter)
                          return (
                            <button
                              key={r.id}
                              onClick={() => { handleRouterChange(r.id); setRouterDropdownOpen(false) }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-950 ${isSelected ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}
                            >
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? "bg-blue-500" : "bg-slate-300"}`} />
                              <span className="font-medium truncate">{r.name}</span>
                              {isSelected && (
                                <svg className="w-3 h-3 text-blue-500 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Time range selector */}
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    {["7d", "30d", "90d"].map((tr) => (
                      <button
                        key={tr}
                        onClick={() => handleRouterTimeRangeChange(tr)}
                        className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                          routerTimeRange === tr
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {tr === "7d" ? "7D" : tr === "30d" ? "30D" : "90D"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Summary row */}
              {routerRevData?.summary && (
                <div className="flex gap-6 mt-2 pt-2 border-t">
                  {[
                    { label: "Total", value: fmtKshFull(routerRevData.summary.total_revenue) },
                    { label: "Avg/Day", value: fmtKshFull(routerRevData.summary.avg_daily) },
                    { label: "Peak Day", value: routerRevData.summary.peak_day },
                    { label: "Peak Amount", value: fmtKshFull(routerRevData.summary.peak_amount) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!routerRevData?.daily_revenue?.length ? (
                <div className="h-[260px] flex items-center justify-center">
                  <EmptyChart label="No hotspot revenue data for this router" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={routerRevData.daily_revenue}
                    barSize={routerTimeRange === "90d" ? 4 : routerTimeRange === "30d" ? 8 : 16}
                    margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.max(1, Math.floor((routerRevData.daily_revenue.length) / 10))}
                    />
                    <YAxis
                      tickFormatter={fmtKsh}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={65}
                    />
                    <Tooltip content={(p) => <ChartTooltip {...p} fmt={fmtKshFull} />} />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill={C.blue}
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════
            USERS TAB
           ════════════════════════════════════════════════ */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">User Registration Trends</CardTitle>
                  <CardDescription className="text-[11px]">Daily new user registrations over the last {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!u?.registration_trends?.length ? <div className="h-[340px] flex items-center justify-center"><EmptyChart /></div> : (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={u.registration_trends} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="userTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.emerald} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(1, Math.floor((u.registration_trends.length) / 10))} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                    <Tooltip content={(p) => <ChartTooltip {...p} />} />
                    <Area type="monotone" dataKey="count" name="Registrations" stroke={C.emerald} strokeWidth={2.5} fill="url(#userTrendGrad)" dot={{ r: 3, fill: "#fff", stroke: C.emerald, strokeWidth: 2 }} activeDot={{ r: 5, fill: C.emerald }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Registration Summary - Premium */}
          <Card className="max-w-lg border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Registration Summary</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { label: "Total Registrations", value: u?.summary?.total_registrations ?? 0, color: "text-blue-600" },
                { label: "Average per Day", value: u?.summary?.avg_per_day ?? 0, color: "text-blue-600" },
                { label: "Peak Day", value: u?.summary?.peak_day ?? "-", color: "text-orange-600" },
              ].map(({ label, value, color }, i) => (
                <div key={label} className={`flex items-center justify-between py-3.5 ${i < 2 ? "border-b" : ""}`}>
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{typeof value === "number" ? value.toLocaleString() : value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Top 10 Impactful Customers ── */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-violet-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-500" /> Top 10 Most Impactful Customers
                  </CardTitle>
                  <CardDescription className="text-[11px]">Ranked by lifetime spend — PPPoE &amp; Hotspot combined</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!data?.top_customers?.length ? (
                <EmptyChart label="No customer data yet" />
              ) : (
                <div className="space-y-2">
                  {data.top_customers.map((c, i) => {
                    const rank = i + 1
                    const badgeConfig =
                      rank === 1
                        ? { label: "👑 Most Valuable", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" }
                        : rank === 2
                        ? { label: "🥈 Elite Client", cls: "bg-slate-100 text-slate-700 border-slate-300" }
                        : rank === 3
                        ? { label: "🥉 Top Performer", cls: "bg-orange-100 text-orange-700 border-orange-300" }
                        : rank <= 5
                        ? { label: "⭐ High Value", cls: "bg-blue-50 text-blue-700 border-blue-200" }
                        : { label: c.type === "HOTSPOT" ? "📶 Hotspot Pro" : "🔌 PPPoE Client", cls: "bg-gray-50 text-gray-600 border-gray-200" }

                    const isTop3 = rank <= 3
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-all ${
                          isTop3
                            ? "bg-gradient-to-r from-violet-50 to-white border-violet-200 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {/* Rank */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            rank === 1
                              ? "bg-yellow-400 text-yellow-900"
                              : rank === 2
                              ? "bg-slate-300 text-slate-800"
                              : rank === 3
                              ? "bg-orange-300 text-orange-900"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {rank}
                        </div>

                        {/* Name + badge */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${isTop3 ? "text-slate-900 dark:text-white text-base" : "text-slate-700 dark:text-slate-300 text-sm"}`}>
                            {c.display_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badgeConfig.cls}`}>
                              {badgeConfig.label}
                            </Badge>
                            {c.identifier && (
                              <span className="text-[10px] text-muted-foreground truncate">{c.identifier}</span>
                            )}
                          </div>
                        </div>

                        {/* Transactions */}
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-xs text-muted-foreground">{c.tx_count} transactions</p>
                        </div>

                        {/* Amount */}
                        <div className={`text-right shrink-0 ${isTop3 ? "min-w-[110px]" : "min-w-[90px]"}`}>
                          <p className={`font-bold ${isTop3 ? "text-violet-700 text-base" : "text-slate-700 text-sm"}`}>
                            {fmtKshFull(c.total_amount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">lifetime</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════
            NETWORK TAB
           ════════════════════════════════════════════════ */}
        <TabsContent value="network" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Network Data Usage</CardTitle>
                  <CardDescription className="text-[11px]">Daily Download &amp; Upload Traffic</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!n?.daily_usage?.length ? <div className="h-[340px] flex items-center justify-center"><EmptyChart /></div> : (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={n.daily_usage} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="netDl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="netUl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(1, Math.floor((n.daily_usage.length) / 10))} />
                    <YAxis tickFormatter={(v) => `${v} GB`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip content={(p) => <ChartTooltip {...p} fmt={(v) => `${v.toFixed(1)} GB`} />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className="text-xs">{v} <span className="text-muted-foreground">✧ Hover for details</span></span>} />
                    <Area type="monotone" dataKey="upload" name="Upload" stroke={C.blue} strokeWidth={2} fill="url(#netUl)" dot={false} />
                    <Area type="monotone" dataKey="download" name="Download" stroke={C.green} strokeWidth={2} fill="url(#netDl)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Usage Summary + Network Performance - Premium */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Usage Summary</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { label: "Total Upload", value: `${(n?.usage_summary?.total_upload ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} GB`, color: "text-emerald-600" },
                  { label: "Total Download", value: `${(n?.usage_summary?.total_download ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} GB`, color: "text-emerald-600" },
                  { label: "Total Usage", value: `${(n?.usage_summary?.total_usage ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} GB`, color: "text-emerald-600" },
                ].map(({ label, value, color }, i) => (
                  <div key={label} className={`flex items-center justify-between py-3.5 ${i < 2 ? "border-b" : ""}`}>
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-violet-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Network Performance</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { label: "Peak Usage Day", value: n?.performance?.peak_usage_day ?? "-", color: "text-emerald-600" },
                  { label: "Average Daily Usage", value: n?.performance?.avg_daily_usage ?? "-", color: "text-emerald-600" },
                  { label: "Download/Upload Ratio", value: n?.performance?.download_upload_ratio ?? "-", color: "text-emerald-600" },
                ].map(({ label, value, color }, i) => (
                  <div key={label} className={`flex items-center justify-between py-3.5 ${i < 2 ? "border-b" : ""}`}>
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}