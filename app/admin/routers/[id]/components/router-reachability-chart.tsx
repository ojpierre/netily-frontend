// app/admin/routers/[id]/components/router-reachability-chart.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Activity, AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { adminApi } from "@/lib/admin-api"
import type { RouterReachabilityDay, RouterReachabilityResponse } from "@/lib/types"

interface RouterReachabilityChartProps {
  routerId: number
  isDemo?: boolean
}

function levelFromUptime(pct: number): number {
  if (pct >= 99.9) return 4
  if (pct >= 99) return 3
  if (pct >= 90) return 2
  if (pct >= 50) return 1
  return 0
}

const LEVEL_CLASSES = [
  "bg-red-500/80 dark:bg-red-500/70",
  "bg-orange-400/80 dark:bg-orange-400/70",
  "bg-amber-300/80 dark:bg-amber-400/60",
  "bg-emerald-400/70 dark:bg-emerald-500/50",
  "bg-emerald-500 dark:bg-emerald-500/80",
]

function formatDuration(minutes: number): string {
  if (minutes < 1) return "<1 min"
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function RouterReachabilityChart({ routerId, isDemo = false }: RouterReachabilityChartProps) {
  const [data, setData] = useState<RouterReachabilityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hovered, setHovered] = useState<RouterReachabilityDay | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)

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

  const weeks = useMemo(() => {
    if (!data || data.days.length === 0) return []
    const firstDate = new Date(data.days[0].date)
    const leadingBlanks = firstDate.getDay()
    const cells: (RouterReachabilityDay | null)[] = [...Array(leadingBlanks).fill(null), ...data.days]
    const weekCols: (RouterReachabilityDay | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) weekCols.push(cells.slice(i, i + 7))
    return weekCols
  }, [data])

  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = []
    let lastMonth = -1
    weeks.forEach((week, i) => {
      const firstReal = week.find((d) => d !== null)
      if (!firstReal) return
      const month = new Date(firstReal.date).getMonth()
      if (month !== lastMonth) {
        labels.push({ index: i, label: new Date(firstReal.date).toLocaleDateString("en-US", { month: "short" }) })
        lastMonth = month
      }
    })
    return labels
  }, [weeks])

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
      <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 85% -10%, rgba(16,185,129,0.15), transparent 60%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-80" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Reachability History</CardTitle>
              <CardDescription className="text-xs">Last {summary?.period_days ?? 90} days — hover a day for details</CardDescription>
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
            <Button variant="outline" size="sm" onClick={() => { setIsRefreshing(true); fetchData() }} disabled={isRefreshing} className="rounded-xl">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-2">
        {weeks.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">No reachability data recorded yet</div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              <div className="flex gap-[3px] mb-1.5 pl-6">
                {weeks.map((_, i) => {
                  const label = monthLabels.find((m) => m.index === i)
                  return <div key={i} className="w-[11px] text-[10px] text-slate-400 font-medium">{label ? label.label : ""}</div>
                })}
              </div>
              <div className="flex gap-[3px]">
                <div className="flex flex-col gap-[3px] pr-1.5 justify-between">
                  {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                    <div key={i} className="h-[11px] text-[9px] text-slate-400 leading-[11px]">{label}</div>
                  ))}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => {
                      if (!day) return <div key={di} className="w-[11px] h-[11px] rounded-[2px]" />
                      const level = levelFromUptime(day.uptime_pct)
                      const cls = day.uptime_pct >= 100 && day.incident_count === 0 ? LEVEL_CLASSES[4] : LEVEL_CLASSES[level]
                      return (
                        <div
                          key={di}
                          className={`w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-transform hover:scale-125 hover:ring-2 hover:ring-primary/40 ${cls}`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setHoverPos({ x: rect.left + rect.width / 2, y: rect.top })
                            setHovered(day)
                          }}
                          onMouseLeave={() => setHovered(null)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3 pl-6 text-[10px] text-slate-400">
                <span>Less reliable</span>
                {LEVEL_CLASSES.map((cls, i) => <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${cls}`} />)}
                <span>Fully reachable</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {hovered && hoverPos && (
        <div className="fixed z-50 pointer-events-none" style={{ left: hoverPos.x, top: hoverPos.y - 8, transform: "translate(-50%, -100%)" }}>
          <div className="rounded-xl bg-slate-900 dark:bg-slate-950 text-white shadow-2xl px-3.5 py-2.5 min-w-[200px] max-w-[260px] border border-slate-700/50">
            <p className="text-xs font-semibold">
              {new Date(hovered.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className={`text-[11px] mt-0.5 ${hovered.uptime_pct >= 99.9 ? "text-emerald-400" : hovered.uptime_pct >= 90 ? "text-amber-400" : "text-red-400"}`}>
              {hovered.uptime_pct.toFixed(1)}% reachable
            </p>
            {hovered.incidents.length > 0 ? (
              <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 space-y-1">
                {hovered.incidents.slice(0, 4).map((inc, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                    <AlertTriangle className="w-2.5 h-2.5 text-warning shrink-0" />
                    <span>{new Date(inc.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — down for {formatDuration(inc.duration_minutes)}</span>
                  </div>
                ))}
                {hovered.incidents.length > 4 && <p className="text-[10px] text-slate-400">+{hovered.incidents.length - 4} more</p>}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">No outages this day</p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}