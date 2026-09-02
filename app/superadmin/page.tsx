"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  UserPlus,
  CheckCircle2,
  Clock,
  Ban,
  Mail,
  BarChart3,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  superadminApi,
  type DashboardKPI,
  type ActivityItem,
  type Tenant,
  type PaymentSummary,
  type SubscriptionPayment,
  type RevenueTrendItem,
  type LeadItem,
  type LeadStats,
  type TenantSubscriptionHealth,
} from "@/lib/superadmin-api"

type HealthFilter = "all" | "active" | "trial" | "expired" | "inactive" | "suspended"

export default function SuperAdminDashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [recentPayments, setRecentPayments] = useState<SubscriptionPayment[]>([])
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([])
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null)
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all")
  const [loading, setLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setDashboardError("")
    try {
      const [dashData, actData, tenantData, paySummary, payData, trendData, leadsData, leadStatsData] = await Promise.allSettled([
        superadminApi.getDashboard(),
        superadminApi.getActivity(10),
        superadminApi.getTenants({ ordering: "-created_at" }),
        superadminApi.getPaymentSummary(),
        superadminApi.getPayments({ page_size: "5", ordering: "-created_at" }),
        superadminApi.getRevenueTrend(6),
        superadminApi.getLeads({ page_size: "5" }),
        superadminApi.getLeadStats(),
      ])

      if (dashData.status === "fulfilled") {
        setKpi(dashData.value)
      } else {
        console.error("Dashboard KPI fetch error:", dashData.reason)
        setKpi(null)
        setDashboardError("Platform KPI totals could not be loaded. Other dashboard sections are still available.")
      }

      if (actData.status === "fulfilled") setActivity(actData.value)
      else setActivity([])

      if (tenantData.status === "fulfilled") setTenants(tenantData.value.slice(0, 5))
      else setTenants([])

      setPaymentSummary(paySummary.status === "fulfilled" ? paySummary.value : null)
      setRecentPayments(payData.status === "fulfilled" ? ((payData.value as any).results || []) : [])
      setRevenueTrend(trendData.status === "fulfilled" ? trendData.value as RevenueTrendItem[] : [])
      setLeads(leadsData.status === "fulfilled" ? ((leadsData.value as any).results || []) : [])
      setLeadStats(leadStatsData.status === "fulfilled" ? leadStatsData.value as LeadStats : null)
    } catch (err) {
      console.error("Dashboard fetch error:", err)
      setDashboardError("Dashboard data could not be loaded. Please refresh or check the API logs.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
      case "trial":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Trial</Badge>
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>
      case "past_due":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Ban className="w-3 h-3 mr-1" />Past due</Badge>
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Ban className="w-3 h-3 mr-1" />Expired</Badge>
      case "trial_expired":
        return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30"><Clock className="w-3 h-3 mr-1" />Trial expired</Badge>
      case "inactive":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
      default:
        return <Badge variant="outline" className="text-slate-400">{s}</Badge>
    }
  }

  const kes = (v: number | string) => `KES ${Number(v || 0).toLocaleString()}`
  const healthRows = kpi?.tenant_subscription_health || []
  const expiredRows = healthRows.filter((tenant) => ["expired", "past_due", "trial_expired"].includes(tenant.status))
  const filteredHealthRows = healthRows.filter((tenant) => {
    if (healthFilter === "all") return true
    if (healthFilter === "expired") return ["expired", "past_due", "trial_expired"].includes(tenant.status)
    if (healthFilter === "inactive") return ["inactive", "cancelled"].includes(tenant.status)
    return tenant.status === healthFilter
  })
  const healthSummary = [
    {
      key: "active" as const,
      label: "Active subscriptions",
      value: kpi?.active_tenants ?? 0,
      helper: "Paid and currently unlocked",
      color: "emerald" as const,
      icon: CheckCircle2,
    },
    {
      key: "trial" as const,
      label: "Active trials",
      value: kpi?.trial_tenants ?? 0,
      helper: "Still inside trial window",
      color: "amber" as const,
      icon: Clock,
    },
    {
      key: "expired" as const,
      label: "Expired / overdue",
      value: kpi?.expired_tenants ?? expiredRows.length,
      helper: "Needs renewal follow-up",
      color: "red" as const,
      icon: Ban,
    },
    {
      key: "inactive" as const,
      label: "Inactive",
      value: kpi?.inactive_tenants ?? 0,
      helper: "Cancelled or inactive records",
      color: "slate" as const,
      icon: XCircle,
    },
  ]

  const healthBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">Active</Badge>
      case "trial":
        return <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400">Trial</Badge>
      case "past_due":
        return <Badge className="border-red-500/30 bg-red-500/20 text-red-400">Past due</Badge>
      case "trial_expired":
        return <Badge className="border-orange-500/30 bg-orange-500/20 text-orange-300">Trial expired</Badge>
      case "expired":
        return <Badge className="border-red-500/30 bg-red-500/20 text-red-400">Expired</Badge>
      case "suspended":
        return <Badge className="border-red-500/30 bg-red-500/20 text-red-400">Suspended</Badge>
      case "cancelled":
      case "inactive":
        return <Badge className="border-slate-500/30 bg-slate-500/20 text-slate-400">Inactive</Badge>
      default:
        return <Badge variant="outline" className="border-slate-600 text-slate-400">{status || "Unknown"}</Badge>
    }
  }

  const relativeExpiry = (tenant: TenantSubscriptionHealth) => {
    if (tenant.days_left === null || tenant.days_left === undefined) return "No billing date"
    if (tenant.days_left < 0) return `${Math.abs(tenant.days_left)}d overdue`
    if (tenant.days_left === 0) return "Due today"
    return `${tenant.days_left}d left`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time metrics across all Netily tenants</p>
      </div>

      {dashboardError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {dashboardError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tenants"
          value={kpi?.total_tenants ?? 0}
          icon={Building2}
          color="violet"
          sub={`${kpi?.active_tenants ?? 0} active · ${kpi?.trial_tenants ?? 0} trial`}
        />
        <KPICard
          title="Platform Users"
          value={kpi?.total_users ?? 0}
          icon={Users}
          color="blue"
          sub={`${kpi?.recent_signups ?? 0} new this month`}
        />
        <KPICard
          title="Total Revenue"
          value={kes(kpi?.total_revenue ?? 0)}
          icon={CreditCard}
          color="emerald"
          sub="All-time subscription payments"
        />
        <KPICard
          title="MRR"
          value={kes(kpi?.mrr ?? 0)}
          icon={TrendingUp}
          color="amber"
          sub="Monthly recurring revenue"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {healthSummary.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setHealthFilter((current) => current === item.key ? "all" : item.key)}
            className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${
              healthFilter === item.key
                ? "border-violet-400 bg-violet-500/15 shadow-lg shadow-violet-950/20"
                : "border-slate-800 bg-slate-900 hover:border-slate-700"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
              </div>
              <div className={`rounded-lg p-2 ${healthIconClass(item.color)}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Subscription Health</CardTitle>
              <CardDescription className="text-slate-400">
                {healthFilter === "all" ? "Active, trial, overdue, and inactive tenant accounts" : `${filteredHealthRows.length} tenant records in this view`}
              </CardDescription>
            </div>
            {healthFilter !== "all" && (
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={() => setHealthFilter("all")}>
                Clear filter
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredHealthRows.map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/superadmin/tenants/${tenant.id}`}
                  className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4 transition hover:border-slate-700 hover:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{tenant.company_name}</p>
                      {healthBadge(tenant.status)}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{tenant.subdomain}.netily.co.ke · {tenant.company_email || "No email"}</p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
                    <div>
                      <p className="text-xs text-slate-500">MRR</p>
                      <p className="text-sm font-bold text-emerald-400">{kes(tenant.mrr)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Billing</p>
                      <p className={`text-sm font-semibold ${tenant.days_left !== null && tenant.days_left < 0 ? "text-red-400" : "text-slate-300"}`}>
                        {relativeExpiry(tenant)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-500" />
                  </div>
                </Link>
              ))}
              {filteredHealthRows.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">No tenants match this subscription view.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Revenue Trend
                </CardTitle>
                <CardDescription className="text-slate-400">Last 6 months</CardDescription>
              </div>
              {paymentSummary && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">This Month</p>
                  <p className="text-lg font-bold text-emerald-400">{kes(paymentSummary.this_month)}</p>
                  {paymentSummary.pct_change !== undefined && (
                    <p className={`text-xs ${Number(paymentSummary.pct_change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {Number(paymentSummary.pct_change) >= 0 ? '+' : ''}{paymentSummary.pct_change}% vs last month
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {revenueTrend.length > 0 ? (
              <div className="flex items-end gap-2 h-40">
                {revenueTrend.map((item, i) => {
                  const max = Math.max(...revenueTrend.map(r => Number(r.revenue || 0)), 1)
                  const height = (Number(item.revenue || 0) / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400">{kes(item.revenue)}</span>
                      <div
                        className="w-full rounded-t-md bg-emerald-500/30 border border-emerald-500/50 transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-[10px] text-slate-500">{item.month}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No revenue data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments & Leads Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Recent Payments
              </CardTitle>
              <CardDescription className="text-slate-400">
                {paymentSummary ? `${kes(paymentSummary.total)} total revenue` : 'Subscription payments'}
              </CardDescription>
            </div>
            <Link href="/superadmin/payments">
              <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-white">{p.company_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{p.plan_name} · {p.method || 'M-Pesa'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{kes(p.amount)}</p>
                    <p className="text-[10px] text-slate-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No payments yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Leads
              </CardTitle>
              <CardDescription className="text-slate-400">
                {leadStats ? `${leadStats.total} total · ${leadStats.this_month} this month` : 'Landing page submissions'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {/* Lead stats mini cards */}
            {leadStats && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-400">{leadStats.last_7_days}</p>
                  <p className="text-[10px] text-slate-500">Last 7 days</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-violet-400">{leadStats.last_30_days}</p>
                  <p className="text-[10px] text-slate-500">Last 30 days</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-emerald-400">{leadStats.total}</p>
                  <p className="text-[10px] text-slate-500">All time</p>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {leads.map((l) => (
                <div key={l.id} className="flex items-start justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{l.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <p className="text-xs text-slate-400 truncate">{l.email}</p>
                    </div>
                    {l.lead_source && (
                      <p className="mt-1 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                        {l.lead_source}
                      </p>
                    )}
                    {l.company_name && (
                      <p className="text-xs text-slate-500 mt-0.5">{l.company_name}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {new Date(l.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No leads yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants & Activity Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Tenants */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Tenants</CardTitle>
              <CardDescription className="text-slate-400">Latest ISPs on the platform</CardDescription>
            </div>
            <Link href="/superadmin/tenants">
              <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenants.map((t) => (
                <Link
                  key={t.id}
                  href={`/superadmin/tenants/${t.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{t.company_name}</p>
                    <p className="text-xs text-slate-500">{t.subdomain} · {t.company_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(t.status)}
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
              {tenants.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No tenants yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Activity</CardTitle>
              <CardDescription className="text-slate-400">Recent platform events</CardDescription>
            </div>
            <Link href="/superadmin/activity">
              <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${a.type === "login" ? "bg-blue-400" : "bg-emerald-400"}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">{a.detail}</p>
                    <p className="text-[10px] text-slate-500">
                      {a.actor} · {a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Sub-components ──

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: "violet" | "blue" | "emerald" | "amber"
  sub?: string
}) {
  const colors = {
    violet: "bg-violet-500/20 text-violet-400",
    blue: "bg-blue-500/20 text-blue-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
  }
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function healthIconClass(color: "emerald" | "amber" | "red" | "slate") {
  const colors = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
    red: "bg-red-500/20 text-red-400",
    slate: "bg-slate-500/20 text-slate-400",
  }
  return colors[color]
}
