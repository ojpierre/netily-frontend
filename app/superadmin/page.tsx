"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Loader2,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Mail,
  Phone,
  BarChart3,
  FileText,
  ChevronRight,
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
  type PlanDistribution,
  type LeadItem,
  type LeadStats,
} from "@/lib/superadmin-api"

export default function SuperAdminDashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [recentPayments, setRecentPayments] = useState<SubscriptionPayment[]>([])
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([])
  const [planDist, setPlanDist] = useState<PlanDistribution[]>([])
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashData, actData, tenantData, paySummary, payData, trendData, planData, leadsData, leadStatsData] = await Promise.all([
        superadminApi.getDashboard(),
        superadminApi.getActivity(10),
        superadminApi.getTenants({ ordering: "-created_at" }),
        superadminApi.getPaymentSummary().catch(() => null),
        superadminApi.getPayments({ page_size: "5", ordering: "-created_at" }).catch(() => ({ results: [] })),
        superadminApi.getRevenueTrend(6).catch(() => []),
        superadminApi.getPlanDistribution().catch(() => []),
        superadminApi.getLeads({ page_size: "5" }).catch(() => ({ results: [] })),
        superadminApi.getLeadStats().catch(() => null),
      ])
      setKpi(dashData)
      setActivity(actData)
      setTenants(tenantData.slice(0, 5))
      setPaymentSummary(paySummary)
      setRecentPayments((payData as any).results || [])
      setRevenueTrend(trendData as RevenueTrendItem[])
      setPlanDist(planData as PlanDistribution[])
      setLeads((leadsData as any).results || [])
      setLeadStats(leadStatsData as LeadStats | null)
    } catch (err) {
      console.error("Dashboard fetch error:", err)
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
      default:
        return <Badge variant="outline" className="text-slate-400">{s}</Badge>
    }
  }

  const kes = (v: number | string) => `KES ${Number(v || 0).toLocaleString()}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time metrics across all Netily tenants</p>
      </div>

      {/* KPI Cards */}
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

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Active" value={kpi?.active_tenants ?? 0} className="text-emerald-400" />
        <MiniStat label="Trial" value={kpi?.trial_tenants ?? 0} className="text-amber-400" />
        <MiniStat label="Suspended" value={kpi?.suspended_tenants ?? 0} className="text-red-400" />
        <MiniStat label="Recent Signups" value={kpi?.recent_signups ?? 0} className="text-blue-400" />
      </div>

      {/* Revenue Analytics Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
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

        {/* Plan Distribution */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              Plan Distribution
            </CardTitle>
            <CardDescription className="text-slate-400">Subscribers by plan</CardDescription>
          </CardHeader>
          <CardContent>
            {planDist.length > 0 ? (
              <div className="space-y-3">
                {planDist.map((p, i) => {
                  const total = planDist.reduce((s, d) => s + (d.count || 0), 0) || 1
                  const pct = Math.round(((p.count || 0) / total) * 100)
                  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500']
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{p.plan_name || p.name}</span>
                        <span className="text-slate-400">{p.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[i % colors.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No plan data yet</p>
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

function MiniStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
      <p className={`text-xl font-bold ${className}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
