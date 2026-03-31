"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Wifi,
  Globe,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Clock,
  Zap,
  CreditCard,
  UserPlus,
  UserMinus,
  Percent,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminApi } from "@/lib/admin-api"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type {
  AnalyticsDashboard,
  RevenueData,
  UserGrowthData,
  PlanPerformance,
  LocationAnalytics,
  RouterAnalytics,
  PaymentMethodAnalytics,
  PaymentStats,
  UserTypeDistribution,
  RevenueByType,
  RevenueForecast,
  RevenueTargetProgress,
  NetworkStats,
} from "@/lib/types"

// ─── Chart palette ───────────────────────────────────────────────────────────
const C = {
  blue:    "#3b82f6",
  violet:  "#8b5cf6",
  emerald: "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
  orange:  "#f97316",
  slate:   "#94a3b8",
  indigo:  "#6366f1",
}
const PIE_COLORS = [C.blue, C.violet, C.orange, C.emerald, C.amber, C.indigo]

// ─── Custom tooltip (matches shadcn theme) ────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
  fmt,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  fmt?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-xl text-sm min-w-[140px]">
      {label && <p className="font-semibold text-foreground mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground py-0.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ background: p.color ?? p.fill }}
          />
          <span className="flex-1">{p.name}:</span>
          <span className="font-semibold text-foreground">
            {fmt ? fmt(Number(p.value)) : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Donut label ──────────────────────────────────────────────────────────────
const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Empty chart placeholder ──────────────────────────────────────────────────
function EmptyChart({ label = "No data for this period" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <BarChart3 className="w-10 h-10 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

// ==========================================
// EMPTY DEFAULTS (used until API loads)
// ==========================================
const emptyPaymentStats: PaymentStats = {
  success_rate: 0,
  failure_rate: 0,
  total_transactions: 0,
  average_transaction: 0,
  highest_transaction: 0,
  collection_rate: 0,
}

const emptyUserDistribution: UserTypeDistribution = {
  hotspot_users: 0,
  pppoe_users: 0,
  static_users: 0,
  hotspot_percentage: 0,
  pppoe_percentage: 0,
  static_percentage: 0,
}

const emptyRevenueByType: RevenueByType = {
  hotspot_revenue: 0,
  pppoe_revenue: 0,
  static_revenue: 0,
  hotspot_percentage: 0,
  pppoe_percentage: 0,
  static_percentage: 0,
}

const emptyNetworkStats: NetworkStats = {
  avg_uptime: 0,
  active_routers: 0,
  avg_bandwidth: 0,
  warning_count: 0,
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Data states — empty until API loads
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [planDistribution, setPlanDistribution] = useState<(PlanPerformance & { color?: string })[]>([])
  const [topLocations, setTopLocations] = useState<LocationAnalytics[]>([])
  const [routerPerformance, setRouterPerformance] = useState<RouterAnalytics[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAnalytics[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentStats>(emptyPaymentStats)
  const [userDistribution, setUserDistribution] = useState<UserTypeDistribution>(emptyUserDistribution)
  const [revenueByType, setRevenueByType] = useState<RevenueByType>(emptyRevenueByType)
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast[]>([])
  const [networkStats, setNetworkStats] = useState<NetworkStats>(emptyNetworkStats)
  
  const fetchedRef = useRef(false)

  // Plan color mapping for API data
  const getPlanColor = (type: string, index: number) => {
    const colors: Record<string, string[]> = {
      hotspot: ["bg-blue-500", "bg-blue-400", "bg-blue-300"],
      pppoe: ["bg-purple-500", "bg-purple-400", "bg-purple-300"],
      static: ["bg-orange-500", "bg-orange-400", "bg-orange-300"],
    }
    return colors[type]?.[index % 3] || "bg-gray-500"
  }

  const fetchAnalytics = useCallback(async () => {
    if (!adminApi.getAdminToken()) {
      setLoading(false)
      return
    }

    try {
      // Try to fetch complete dashboard data first
      try {
        const dashboard = await adminApi.getAnalyticsDashboard(timeRange)
        if (dashboard) {
          setRevenueData(dashboard.revenue_data || [])
          setUserGrowthData(dashboard.user_growth_data || [])
          setPlanDistribution(
            dashboard.plan_performance?.map((p, idx) => ({
              ...p,
              color: getPlanColor(p.type, idx),
            })) || []
          )
          setTopLocations(dashboard.location_analytics || [])
          setRouterPerformance(dashboard.router_analytics || [])
          setPaymentMethods(dashboard.payment_methods || [])
          setPaymentStats(dashboard.payment_stats || emptyPaymentStats)
          setUserDistribution(dashboard.user_distribution || emptyUserDistribution)
          setRevenueByType(dashboard.revenue_by_type || emptyRevenueByType)
          setRevenueForecast(dashboard.revenue_forecast || [])
          setNetworkStats(dashboard.network_stats || emptyNetworkStats)
          return
        }
      } catch {
        // If dashboard endpoint fails, try individual endpoints
        console.log("Dashboard endpoint unavailable, trying individual endpoints...")
      }

      // Fetch individual endpoints with fallbacks
      const [
        revenueRes,
        userGrowthRes,
        planPerfRes,
        locationRes,
        routerRes,
        paymentMethodsRes,
        paymentStatsRes,
        userDistRes,
        revTypeRes,
        forecastRes,
        networkRes,
      ] = await Promise.allSettled([
        adminApi.getRevenueData(timeRange),
        adminApi.getUserGrowthData(timeRange),
        adminApi.getPlanPerformance(timeRange),
        adminApi.getLocationAnalytics(timeRange),
        adminApi.getRouterAnalytics(timeRange),
        adminApi.getPaymentMethodAnalytics(timeRange),
        adminApi.getPaymentStats(timeRange),
        adminApi.getUserTypeDistribution(timeRange),
        adminApi.getRevenueByType(timeRange),
        adminApi.getRevenueForecast(),
        adminApi.getNetworkStats(),
      ])

      if (revenueRes.status === "fulfilled") setRevenueData(revenueRes.value)
      if (userGrowthRes.status === "fulfilled") setUserGrowthData(userGrowthRes.value)
      if (planPerfRes.status === "fulfilled") {
        setPlanDistribution(
          planPerfRes.value.map((p, idx) => ({
            ...p,
            color: getPlanColor(p.type, idx),
          }))
        )
      }
      if (locationRes.status === "fulfilled") setTopLocations(locationRes.value)
      if (routerRes.status === "fulfilled") setRouterPerformance(routerRes.value)
      if (paymentMethodsRes.status === "fulfilled") setPaymentMethods(paymentMethodsRes.value)
      if (paymentStatsRes.status === "fulfilled") setPaymentStats(paymentStatsRes.value)
      if (userDistRes.status === "fulfilled") setUserDistribution(userDistRes.value)
      if (revTypeRes.status === "fulfilled") setRevenueByType(revTypeRes.value)
      if (forecastRes.status === "fulfilled") setRevenueForecast(forecastRes.value)
      if (networkRes.status === "fulfilled") setNetworkStats(networkRes.value)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchAnalytics()
    }
  }, [fetchAnalytics])

  // Refetch when time range changes
  useEffect(() => {
    if (fetchedRef.current) {
      fetchAnalytics()
    }
  }, [timeRange, fetchAnalytics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportAnalyticsReport(timeRange, 'csv')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${timeRange}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export failed:", error)
      // Fallback: export current data as JSON
      const exportData = {
        timeRange,
        revenueData,
        userGrowthData,
        planDistribution,
        topLocations,
        routerPerformance,
        paymentMethods,
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${timeRange}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  // Calculate totals from current data
  const totalRevenue = revenueData.reduce((acc, d) => acc + d.revenue, 0)
  const totalTarget = revenueData.reduce((acc, d) => acc + d.target, 0)
  const totalUsers = planDistribution.reduce((acc, p) => acc + p.users, 0)
  const totalNewUsers = userGrowthData.reduce((acc, d) => acc + d.new_users, 0)
  const totalChurn = userGrowthData.reduce((acc, d) => acc + d.churn, 0)
  const churnRate = ((totalChurn / totalUsers) * 100).toFixed(1)
  const avgRevenuePerUser = Math.round(totalRevenue / totalUsers)
  const conversionRate = 23.5

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`
    return `KES ${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1">Business intelligence and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12.5%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-500">Total Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                8.3%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Active Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                15%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{totalNewUsers}</p>
            <p className="text-xs text-slate-500">New Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(avgRevenuePerUser)}</p>
            <p className="text-xs text-slate-500">ARPU</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserMinus className="w-5 h-5 text-red-600" />
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                2.1%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{churnRate}%</p>
            <p className="text-xs text-slate-500">Churn Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                3.2%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-slate-500">Lead Conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Revenue Chart Placeholder */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue vs target</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <EmptyChart />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                      <defs>
                        <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.blue} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grad-tgt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.slate} stopOpacity={0.12} />
                          <stop offset="95%" stopColor={C.slate} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tickFormatter={(v) => formatCurrency(v)}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={72}
                      />
                      <Tooltip content={(p) => <ChartTooltip {...p} fmt={formatCurrency} />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke={C.blue}
                        strokeWidth={2.5}
                        fill="url(#grad-rev)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        name="Target"
                        stroke={C.slate}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        fill="url(#grad-tgt)"
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue Target */}
            <Card>
              <CardHeader>
                <CardTitle>Target Progress</CardTitle>
                <CardDescription>Q2 2024 Revenue Goal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-slate-500">of {formatCurrency(totalTarget)} target</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round((totalRevenue / totalTarget) * 100)}%</span>
                  </div>
                  <Progress value={(totalRevenue / totalTarget) * 100} className="h-3" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monthly Average</span>
                    <span className="font-medium">{formatCurrency(totalRevenue / 6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Best Month</span>
                    <span className="font-medium text-green-600">{formatCurrency(1780000)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Projected Annual</span>
                    <span className="font-medium">{formatCurrency(totalRevenue * 2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Locations */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Location</CardTitle>
              <CardDescription>Top performing areas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLocations.map((loc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell>{loc.users.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(loc.revenue)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loc.growth > 10 ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {loc.growth}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(loc.revenue / totalRevenue) * 100} className="h-2 w-20" />
                          <span className="text-xs text-slate-500">{((loc.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* User Growth Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New users vs churn over time</CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowthData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <EmptyChart />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={userGrowthData} barSize={18} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={(p) => <ChartTooltip {...p} />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="new_users" name="New Users" fill={C.emerald} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="churn" name="Churned" fill={C.red} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">{totalNewUsers}</p>
                      <p className="text-sm text-green-600">New Users</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserMinus className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-700">{totalChurn}</p>
                      <p className="text-sm text-red-600">Churned</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-700">+{totalNewUsers - totalChurn}</p>
                      <p className="text-sm text-blue-600">Net Growth</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Type Distribution */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Wifi className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">1,479</p>
                    <p className="text-slate-500">Hotspot Users</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>% of Total</span>
                    <span className="font-medium">62%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Globe className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">635</p>
                    <p className="text-slate-500">PPPoE Users</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>% of Total</span>
                    <span className="font-medium">27%</span>
                  </div>
                  <Progress value={27} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Server className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">123</p>
                    <p className="text-slate-500">Static IP Users</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>% of Total</span>
                    <span className="font-medium">11%</span>
                  </div>
                  <Progress value={11} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Donut chart */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Subscriber share by plan type</CardDescription>
              </CardHeader>
              <CardContent>
                {planDistribution.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center">
                    <EmptyChart />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        dataKey="users"
                        nameKey="name"
                        innerRadius="42%"
                        outerRadius="68%"
                        paddingAngle={3}
                        labelLine={false}
                        label={renderDonutLabel}
                      >
                        {planDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={(p) => <ChartTooltip {...p} />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Plan revenue breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
                <CardDescription>Users and revenue per plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planDistribution.map((plan, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm font-medium">{plan.name}</span>
                          <span className="text-sm text-slate-500">{plan.users} users</span>
                        </div>
                        <Progress value={totalUsers ? (plan.users / totalUsers) * 100 : 0} className="h-2" />
                      </div>
                      <span className="text-sm font-semibold w-24 text-right">{formatCurrency(plan.revenue)}</span>
                    </div>
                  ))}
                  {planDistribution.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No plan data available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan detail table */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>ARPU</TableHead>
                    <TableHead>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planDistribution.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No plan data for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    planDistribution.map((plan, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              plan.type === "hotspot"
                                ? "bg-blue-100 text-blue-700"
                                : plan.type === "pppoe"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-orange-100 text-orange-700"
                            }
                          >
                            {plan.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{plan.users.toLocaleString()}</TableCell>
                        <TableCell>{formatCurrency(plan.revenue)}</TableCell>
                        <TableCell>
                          {plan.users > 0 ? formatCurrency(Math.round(plan.revenue / plan.users)) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={totalUsers ? (plan.users / totalUsers) * 100 : 0}
                              className="h-2 w-16"
                            />
                            <span className="text-xs">
                              {totalUsers ? ((plan.users / totalUsers) * 100).toFixed(1) : "0"}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">99.5%</p>
                    <p className="text-xs text-slate-500">Avg Uptime</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Server className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-xs text-slate-500">Active Routers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">72%</p>
                    <p className="text-xs text-slate-500">Avg Bandwidth</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">2</p>
                    <p className="text-xs text-slate-500">Warnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Router Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Router Performance</CardTitle>
              <CardDescription>Health status and metrics for all routers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Router</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Bandwidth</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerPerformance.map((router, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{router.name}</TableCell>
                      <TableCell>{router.users}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={router.uptime >= 99 ? "text-green-600" : "text-amber-600"}>
                            {router.uptime}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={router.bandwidth} 
                            className={`h-2 w-20 ${router.bandwidth > 80 ? "[&>div]:bg-amber-500" : ""}`} 
                          />
                          <span className="text-xs text-slate-500">{router.bandwidth}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          router.status === "healthy" 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }>
                          {router.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Methods Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Transaction volume by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center">
                    <EmptyChart label="No transaction data" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(220, paymentMethods.length * 52)}>
                    <BarChart
                      data={paymentMethods}
                      layout="vertical"
                      barSize={20}
                      margin={{ top: 4, right: 60, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatCurrency(v)}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="method"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip content={(p) => <ChartTooltip {...p} fmt={formatCurrency} />} />
                      <Bar dataKey="amount" name="Amount" fill={C.indigo} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Payment Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Successful</p>
                    <p className="text-2xl font-bold text-green-700">98.5%</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">Failed</p>
                    <p className="text-2xl font-bold text-red-700">1.5%</p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Transactions</span>
                    <span className="font-medium">6,180</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Transaction</span>
                    <span className="font-medium">KES 1,250</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Highest Transaction</span>
                    <span className="font-medium">KES 8,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Collection Rate</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>Projected revenue for next 3 months based on current trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">July 2024</p>
                  <p className="text-3xl font-bold text-blue-700">{formatCurrency(1900000)}</p>
                  <Badge variant="outline" className="mt-2 bg-white text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +6.7%
                  </Badge>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1">August 2024</p>
                  <p className="text-3xl font-bold text-purple-700">{formatCurrency(2050000)}</p>
                  <Badge variant="outline" className="mt-2 bg-white text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +7.9%
                  </Badge>
                </div>
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-600 mb-1">September 2024</p>
                  <p className="text-3xl font-bold text-emerald-700">{formatCurrency(2200000)}</p>
                  <Badge variant="outline" className="mt-2 bg-white text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +7.3%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
