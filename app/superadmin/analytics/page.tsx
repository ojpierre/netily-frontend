"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Building2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  superadminApi,
  type RevenueTrendItem,
  type TenantGrowthItem,
  type ChurnMetrics,
  type PlanDistribution,
  type TopTenant,
} from "@/lib/superadmin-api"

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueTrendItem[]>([])
  const [growth, setGrowth] = useState<TenantGrowthItem[]>([])
  const [churn, setChurn] = useState<ChurnMetrics | null>(null)
  const [planDist, setPlanDist] = useState<PlanDistribution[]>([])
  const [topTenants, setTopTenants] = useState<TopTenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [r, g, c, p, t] = await Promise.all([
        superadminApi.getRevenueTrend(),
        superadminApi.getTenantGrowth(),
        superadminApi.getChurnMetrics(),
        superadminApi.getPlanDistribution(),
        superadminApi.getTopTenants("revenue", 5),
      ])
      setRevenue(r)
      setGrowth(g)
      setChurn(c)
      setPlanDist(p)
      setTopTenants(t)
    } catch (err: any) {
      toast.error(err.message || "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const kes = (n: number) =>
    n.toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    })

  const maxRev = Math.max(...revenue.map((r) => r.revenue), 1)
  const maxGrowth = Math.max(...growth.map((g) => g.new_tenants), 1)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-400" />
            Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform-wide performance metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          className="border-slate-700 text-slate-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Churn summary cards */}
      {churn && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Active Tenants" value={churn.active} icon={Building2} color="emerald" />
          <MetricCard label="Trial" value={churn.trial} icon={Users} color="blue" />
          <MetricCard label="Churn Rate" value={`${churn.churn_rate}%`} icon={AlertTriangle} color="red" />
          <MetricCard
            label="Trial Conversion"
            value={`${churn.conversion_rate}%`}
            icon={TrendingUp}
            color="violet"
          />
        </div>
      )}

      {/* Revenue Trend */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Monthly Revenue (Last 12 months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenue.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No revenue data available</p>
          ) : (
            <div className="space-y-1">
              {revenue.map((r) => (
                <div key={r.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-16 shrink-0">{r.month}</span>
                  <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/50 rounded transition-all"
                      style={{ width: `${(r.revenue / maxRev) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-300 w-24 text-right">{kes(r.revenue)}</span>
                  <span className="text-[10px] text-slate-500 w-8 text-right">{r.count}tx</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenant Growth */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Tenant Growth (Last 12 months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {growth.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No growth data</p>
          ) : (
            <div className="space-y-1">
              {growth.map((g) => (
                <div key={g.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-16 shrink-0">{g.month}</span>
                  <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-violet-500/50 rounded transition-all"
                      style={{ width: `${(g.new_tenants / maxGrowth) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-300 w-12 text-right">+{g.new_tenants}</span>
                  <span className="text-[10px] text-slate-500 w-12 text-right">{g.cumulative} total</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Plan Distribution */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {planDist.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No plans configured</p>
            ) : (
              <div className="space-y-3">
                {planDist.map((p) => (
                  <div key={p.plan_code} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{p.plan_name}</p>
                      <p className="text-xs text-slate-500">{kes(p.price_monthly)}/mo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{p.subscriber_count} subscribers</p>
                      <p className="text-xs text-emerald-400">{kes(p.monthly_revenue)} MRR</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tenants */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Top Tenants by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topTenants.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tenant data</p>
            ) : (
              <div className="space-y-3">
                {topTenants.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-violet-400 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{t.company_name}</p>
                      <p className="text-xs text-slate-500">{t.subdomain}</p>
                    </div>
                    <Badge
                      className={
                        t.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }
                    >
                      {t.status}
                    </Badge>
                    <span className="text-sm text-white font-medium">{kes(t.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    red: "bg-red-500/10 text-red-400",
    violet: "bg-violet-500/10 text-violet-400",
    amber: "bg-amber-500/10 text-amber-400",
  }
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
