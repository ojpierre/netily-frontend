// app/admin/routers/[id]/components/router-reachability-chart.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Activity, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ActivityHeatmap, type HeatDay } from "@/components/ui/activity-heatmap"
import { adminApi } from "@/lib/admin-api"
import type { RouterReachabilityDay, RouterReachabilityResponse } from "@/lib/types"

interface RouterReachabilityChartProps {
  routerId: number
  isDemo?: boolean
}

export function RouterReachabilityChart({ routerId, isDemo = false }: RouterReachabilityChartProps) {
  const [data, setData] = useState<RouterReachabilityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 600))
        const days: RouterReachabilityDay[] = Array.from({ length: 91 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (90 - i))
          const rand = Math.random()
          const uptime = rand > 0.92 ? 40 + Math.random() * 40 : rand > 0.85 ? 90 + Math.random() * 9 : 100
          return {
            date: d.toISOString().split("T")[0],
            uptime_pct: Math.round(uptime * 100) / 100,
            incident_count: uptime < 100 ? 1 : 0,
            incidents: uptime < 100 ? [{ start: d.toISOString(), end: d.toISOString(), duration_minutes: Math.round((100 - uptime) * 14.4) }] : [],
          }
        })
        setData({
          router_id: routerId,
          days,
          summary: {
            total_incidents: days.filter((d) => d.incident_count > 0).length,
            total_downtime_minutes: days.reduce((a, d) => a + (d.incidents[0]?.duration_minutes || 0), 0),
            overall_uptime_pct: 98.4,
            period_days: 90,
          },
        })
      } else {
        const result = await adminApi.getRouterReachability(routerId, 90)
        setData(result)
      }
    } catch (err) {
      console.error("Failed to fetch reachability data:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [routerId, isDemo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // One value per day: minutes of downtime (0 = fully reachable).
  const heatData = useMemo<HeatDay[]>(
    () =>
      (data?.days ?? []).map((d) => {
        const logged = (d.incidents ?? []).reduce((a, i) => a + (i.duration_minutes || 0), 0)
        const derived = Math.round(Math.max(0, 100 - d.uptime_pct) * 14.4)
        return { date: d.date, value: logged > 0 ? logged : derived }
      }),
    [data],
  )

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-slate-200/60 dark:border-slate-800">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const summary = data?.summary
  const uptimeColor =
    (summary?.overall_uptime_pct ?? 100) >= 99.5
      ? "text-emerald-600 dark:text-emerald-400"
      : (summary?.overall_uptime_pct ?? 100) >= 97
      ? "text-warning dark:text-warning"
      : "text-destructive dark:text-destructive"

  return (
    <Card className="relative overflow-hidden rounded-2xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-80" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Reachability History</CardTitle>
              <CardDescription className="text-xs">
                Last {summary?.period_days ?? 90} days. Darker means more downtime.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-lg font-extrabold leading-none ${uptimeColor}`}>
                {summary?.overall_uptime_pct?.toFixed(2) ?? "100.00"}%
              </p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Uptime</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold leading-none text-foreground">{summary?.total_incidents ?? 0}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Incidents</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true)
                fetchData()
              }}
              disabled={isRefreshing}
              className="rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-2">
        {heatData.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">No reachability data recorded yet</div>
        ) : (
          <ActivityHeatmap
            data={heatData}
            weeks={14}
            color="#ef4444"
            unit="min of downtime"
            ariaLabel="Router downtime by day, last 90 days"
          />
        )}
      </CardContent>
    </Card>
  )
}