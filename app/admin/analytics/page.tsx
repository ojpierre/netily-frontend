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
    <div className="rounded-lg border bg-background px-3 py-2 shadow-xl text-sm min-w-[140px]">
      {label && <p className="font-semibold text-foreground mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground py-0.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color ?? p.fill }} />
          <span className="flex-1">{p.name}:</span>
          <span className="font-semibold text-foreground">{fmt ? fmt(Number(p.value)) : Number(p.value).toLocaleString()}</span>
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

  useEffect(() => {
    if (!fetchedRef.current) { fetchedRef.current = true; fetchData() }
  }, [fetchData])

  useEffect(() => { if (fetchedRef.current) fetchData() }, [timeRange, fetchData])

  const handleRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportAnalyticsReport(timeRange, "csv")
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `reports-${timeRange}.csv`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch { /* silent */ }
  }

  const o = data?.overview
  const f = data?.financial
  const u = data?.users
  const n = data?.network

  // ─── Change badge helper ────────────────────────────────────────────────────
  const ChangeBadge = ({ value }: { value: number }) => {
    const positive = value >= 0
    return (
      <Badge variant="outline" className={positive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
        {positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
        {positive ? "+" : ""}{value}%
      </Badge>
    )
  }

  // ─── Revenue stat card ──────────────────────────────────────────────────────
  const RevenueCard = ({ label, amount, change, extra }: { label: string; amount: number; change: number; extra?: string }) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <ChangeBadge value={change} />
        </div>
        <p className="text-2xl font-bold">{fmtKshFull(amount)}</p>
        {extra && <p className="text-xs text-muted-foreground mt-1">{extra}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>
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
          {/* Revenue cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueCard label="Today's Revenue" amount={o?.today_revenue ?? 0} change={o?.today_change ?? 0} extra="vs yesterday" />
            <RevenueCard label="This Week" amount={o?.week_revenue ?? 0} change={o?.week_change ?? 0} extra="vs last week" />
            <RevenueCard label="This Month" amount={o?.month_revenue ?? 0} change={o?.month_change ?? 0} extra="vs last month" />
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Transactions</p>
                <p className="text-2xl font-bold">{(o?.total_transactions_today ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Today&apos;s transactions</p>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Revenue Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-blue-700">Hourly Income Distribution</CardTitle>
              <CardDescription>Revenue breakdown by hour with peak analysis</CardDescription>
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

            {/* Weekly Income Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-blue-700">Weekly Income</CardTitle>
                    <CardDescription>Daily revenue for the selected week</CardDescription>
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
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                })()}
              </CardContent>
            </Card>

            {/* Monthly Earnings Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-emerald-700">Monthly Earnings</CardTitle>
                    <CardDescription>Revenue per month for the selected year</CardDescription>
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
            {/* User Registrations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-emerald-700">User Registrations</CardTitle>
                <CardDescription>Daily new user registrations (Last {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days)</CardDescription>
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

            {/* Network Data Flow */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-blue-700">Network Data Flow</CardTitle>
                <CardDescription>Interactive download and upload data usage patterns with detailed insights</CardDescription>
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
            {/* Income Comparison */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-blue-700">Income Comparison</CardTitle>
                <CardDescription>Current vs previous period performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { label: "Today", data: f?.income_comparison?.today },
                  { label: "Yesterday", data: f?.income_comparison?.yesterday },
                  { label: "This Week", data: f?.income_comparison?.this_week },
                  { label: "Last Week", data: f?.income_comparison?.last_week },
                ].map(({ label, data }, i) => (
                  <div key={label} className={`flex items-center justify-between py-4 ${i < 3 ? "border-b" : ""}`}>
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-700">{fmtKshFull(data?.amount ?? 0)}</span>
                      <p className="text-xs text-muted-foreground">{data?.transactions ?? 0} transactions</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Monthly Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-orange-700">Monthly Performance</CardTitle>
                <CardDescription>This month vs last month comparison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b bg-blue-50/50 -mx-6 px-6 rounded-t-lg">
                  <span className="text-sm font-medium text-slate-700">This Month</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{fmtKshFull(f?.monthly_performance?.this_month?.amount ?? 0)}</span>
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
                  <ChangeBadge value={f?.monthly_performance?.growth_rate ?? 0} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Revenue Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-amber-700">Hourly Revenue Analysis</CardTitle>
              <CardDescription>Peak revenue hours and patterns with detailed insights</CardDescription>
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
        </TabsContent>

        {/* ════════════════════════════════════════════════
            USERS TAB
           ════════════════════════════════════════════════ */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-emerald-700">User Registration Trends</CardTitle>
              <CardDescription>Daily new user registrations over the last {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days</CardDescription>
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

          {/* Registration Summary */}
          <Card className="max-w-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Registration Summary</CardTitle>
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
        </TabsContent>

        {/* ════════════════════════════════════════════════
            NETWORK TAB
           ════════════════════════════════════════════════ */}
        <TabsContent value="network" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-blue-700">Network Data Usage</CardTitle>
              <CardDescription>Daily Download &amp; Upload Traffic</CardDescription>
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

          {/* Usage Summary + Network Performance */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Usage Summary</CardTitle>
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Network Performance</CardTitle>
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