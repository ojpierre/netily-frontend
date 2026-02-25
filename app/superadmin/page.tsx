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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { superadminApi, type DashboardKPI, type ActivityItem, type Tenant } from "@/lib/superadmin-api"

export default function SuperAdminDashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashData, actData, tenantData] = await Promise.all([
        superadminApi.getDashboard(),
        superadminApi.getActivity(10),
        superadminApi.getTenants({ ordering: "-created_at" }),
      ])
      setKpi(dashData)
      setActivity(actData)
      setTenants(tenantData.slice(0, 5))
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
          value={`KES ${Number(kpi?.total_revenue ?? 0).toLocaleString()}`}
          icon={CreditCard}
          color="emerald"
          sub="All-time subscription payments"
        />
        <KPICard
          title="MRR"
          value={`KES ${Number(kpi?.mrr ?? 0).toLocaleString()}`}
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
