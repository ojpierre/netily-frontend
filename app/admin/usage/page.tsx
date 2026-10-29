"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  TrendingDown,
  TrendingUp,
  Wifi,
} from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

type RangeKey = "24h" | "7d" | "30d"

interface UsageAnalytics {
  range: RangeKey
  granularity: "hour" | "day"
  summary: {
    total: number
    download: number
    upload: number
    active_sessions: number
    unique_users: number
    avg_per_user: number
    peak_hour: number | null
    changes: { total: number | null; download: number | null; upload: number | null }
  }
  series: { label: string; download: number; upload: number }[]
  plans: { name: string; bytes: number; percent: number }[]
}

interface Consumer {
  username: string
  name: string
  code: string
  type: "pppoe" | "hotspot"
  plan: string
  download: number
  upload: number
  total: number
  sessions: number
  online: boolean
  uptime_seconds: number | null
  last_seen: string | null
}

interface ConsumersResponse {
  count: number
  page: number
  page_size: number
  total_pages: number
  results: Consumer[]
}

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
]
const PAGE_SIZE = 10
const REFRESH_MS = 60_000

// ───────────── formatting ─────────────
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"]
function fmtParts(bytes: number) {
  let v = bytes || 0
  let i = 0
  while (v >= 1024 && i < UNITS.length - 1) {
    v /= 1024
    i++
  }
  return { value: i === 0 ? String(Math.round(v)) : v.toFixed(v >= 100 ? 0 : 2), unit: UNITS[i] }
}
const fmtBytes = (b: number) => {
  const p = fmtParts(b)
  return `${p.value} ${p.unit}`
}
function fmtDuration(sec: number | null) {
  if (!sec || sec < 0) return "—"
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?"

// ───────────── small UI pieces ─────────────
function Change({ value, inverted = false }: { value: number | null | undefined; inverted?: boolean }) {
  if (value === null || value === undefined) return null
  const up = value >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${inverted ? "" : up ? "text-success" : "text-destructive"}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value)}%
      <span className={`font-normal ${inverted ? "opacity-80" : "text-slate-500"}`}>vs last period</span>
    </span>
  )
}

function TrafficChart({
  series,
  mode,
}: {
  series: UsageAnalytics["series"]
  mode: "both" | "download" | "upload"
}) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 800, H = 260, padL = 56, padR = 12, padT = 12, padB = 28
  const n = series.length
  const pick = (p: UsageAnalytics["series"][number]) =>
    mode === "download" ? [p.download] : mode === "upload" ? [p.upload] : [p.download, p.upload]
  const max = Math.max(1, ...series.flatMap(pick)) * 1.1
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const x = (i: number) => padL + (n <= 1 ? 0 : (i * innerW) / (n - 1))
  const y = (v: number) => padT + (1 - v / max) * innerH
  const line = (key: "download" | "upload") =>
    series.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ")
  const area = (key: "download" | "upload") =>
    `${line(key)} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const labelEvery = Math.max(1, Math.ceil(n / 6))
  const showDl = mode !== "upload"
  const showUl = mode !== "download"

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((vx - padL) / innerW) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, idx)))
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="stroke-slate-200" strokeDasharray="2 4" />
            <text x={padL - 8} y={y(t) + 3} textAnchor="end" className="fill-slate-500" fontSize="10">
              {fmtBytes(t)}
            </text>
          </g>
        ))}
        {series.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-500" fontSize="10">
              {p.label}
            </text>
          ) : null
        )}
        {showDl && (
          <>
            <path d={area("download")} className="fill-primary" fillOpacity={0.12} />
            <path d={line("download")} className="stroke-primary" fill="none" strokeWidth={2} strokeLinejoin="round" />
          </>
        )}
        {showUl && (
          <path d={line("upload")} className="stroke-success" fill="none" strokeWidth={2} strokeLinejoin="round" />
        )}
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={y(0)} className="stroke-slate-300" />
            {showDl && <circle cx={x(hover)} cy={y(series[hover].download)} r={4} className="fill-primary" />}
            {showUl && <circle cx={x(hover)} cy={y(series[hover].upload)} r={4} className="fill-success" />}
          </>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border bg-card px-3 py-2 text-xs shadow-md"
          style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}
        >
          <p className="font-medium mb-1">{series[hover].label}</p>
          {showDl && <p className="text-primary">Download: {fmtBytes(series[hover].download)}</p>}
          {showUl && <p className="text-success">Upload: {fmtBytes(series[hover].upload)}</p>}
        </div>
      )}
    </div>
  )
}

const PLAN_STROKE = ["stroke-primary", "stroke-success", "stroke-purple-500", "stroke-amber-500", "stroke-slate-400"]
const PLAN_BG = ["bg-primary", "bg-success", "bg-purple-500", "bg-amber-500", "bg-slate-400"]

function PlanDonut({ plans, total }: { plans: UsageAnalytics["plans"]; total: number }) {
  const r = 54
  const C = 2 * Math.PI * r
  let acc = 0
  const parts = fmtParts(total)
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" strokeWidth="16" className="stroke-slate-100" />
          {plans.map((p, i) => {
            const len = (p.percent / 100) * C
            const el = (
              <circle
                key={p.name}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                strokeWidth="16"
                strokeDasharray={`${Math.max(0, len - 1)} ${C - Math.max(0, len - 1)}`}
                strokeDashoffset={-acc}
                className={PLAN_STROKE[i % PLAN_STROKE.length]}
              />
            )
            acc += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none">{parts.value}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{parts.unit} total</span>
        </div>
      </div>
      <ul className="flex-1 w-full space-y-2">
        {plans.map((p, i) => (
          <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${PLAN_BG[i % PLAN_BG.length]}`} />
              <span className="truncate">{p.name}</span>
            </span>
            <span className="text-xs text-slate-500 shrink-0">
              {fmtBytes(p.bytes)} · {p.percent}%
            </span>
          </li>
        ))}
        {plans.length === 0 && <li className="text-sm text-slate-500">No traffic in this period</li>}
      </ul>
    </div>
  )
}

// ───────────── page ─────────────
export default function UsagePage() {
  const [range, setRange] = useState<RangeKey>("7d")
  const [mode, setMode] = useState<"both" | "download" | "upload">("both")

  const [data, setData] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [consumers, setConsumers] = useState<ConsumersResponse | null>(null)
  const [consLoading, setConsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const aReq = useRef(0)
  const cReq = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [range, debouncedSearch])

  const loadAnalytics = useCallback(
    async (silent = false) => {
      const id = ++aReq.current
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      try {
        const res = await adminApi.getRadiusUsageAnalytics<UsageAnalytics>(range)
        if (id === aReq.current) setData(res)
      } catch (e: any) {
        if (!silent && id === aReq.current) setError(e?.message || "Failed to load usage analytics.")
      } finally {
        if (!silent && id === aReq.current) setLoading(false)
      }
    },
    [range]
  )

  const loadConsumers = useCallback(
    async (silent = false) => {
      const id = ++cReq.current
      if (!silent) setConsLoading(true)
      try {
        const res = await adminApi.getRadiusUsageConsumers<ConsumersResponse>({
          range,
          page,
          page_size: PAGE_SIZE,
          q: debouncedSearch || undefined,
        })
        if (id === cReq.current) setConsumers(res)
      } catch {
        /* keep previous rows; the analytics error banner covers hard failures */
      } finally {
        if (!silent && id === cReq.current) setConsLoading(false)
      }
    },
    [range, page, debouncedSearch]
  )

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  useEffect(() => {
    loadConsumers()
  }, [loadConsumers])

  // Silent auto-refresh (paused while the tab is hidden)
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return
      loadAnalytics(true)
      loadConsumers(true)
    }, REFRESH_MS)
    return () => clearInterval(t)
  }, [loadAnalytics, loadConsumers])

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Subscriber Usage</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => loadAnalytics()}>Retry</Button>
      </div>
    )
  }

  const s = data?.summary
  const peak = s?.peak_hour
  const totalPages = consumers?.total_pages ?? 1
  const subtitleUnit = data?.granularity === "hour" ? "Hourly" : "Daily"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriber Usage</h1>
          <p className="text-slate-500 mt-1">
            Monitor bandwidth consumption, active RADIUS sessions, and subscriber patterns across your network.
          </p>
        </div>
        <div className="inline-flex rounded-lg border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                range === r.key ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-primary text-primary-foreground border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider opacity-90">Total traffic</CardTitle>
            <Activity className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            {loading || !s ? (
              <Skeleton className="h-9 w-28 bg-white/30" />
            ) : (
              <>
                <div className="text-3xl font-bold">{fmtBytes(s.total)}</div>
                <div className="mt-2">
                  <Change value={s.changes.total} inverted />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">Download</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading || !s ? (
              <Skeleton className="h-9 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold">{fmtBytes(s.download)}</div>
                <div className="mt-2">
                  <Change value={s.changes.download} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">Upload</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loading || !s ? (
              <Skeleton className="h-9 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold">{fmtBytes(s.upload)}</div>
                <div className="mt-2">
                  <Change value={s.changes.upload} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">Active sessions</CardTitle>
            <Wifi className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loading || !s ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{s.active_sessions.toLocaleString()}</div>
                <p className="mt-2 text-xs text-slate-500">
                  Online now · {s.unique_users.toLocaleString()} active subscribers in period
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart + plan split */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Traffic over time</CardTitle>
              <CardDescription>{subtitleUnit} bandwidth consumption from RADIUS accounting records</CardDescription>
            </div>
            <div className="inline-flex rounded-lg border bg-card p-1 shrink-0">
              {(["both", "download", "upload"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${
                    mode === m ? "bg-slate-100 text-foreground font-medium" : "text-slate-500 hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <>
                <TrafficChart series={data.series} mode={mode} />
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Download
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success" /> Upload
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage by plan</CardTitle>
            <CardDescription>Traffic distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading || !data ? (
              <Skeleton className="h-[160px] w-full" />
            ) : (
              <PlanDonut plans={data.plans} total={data.summary.total} />
            )}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Avg / user</p>
                {loading || !s ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{fmtBytes(s.avg_per_user)}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Peak hour</p>
                {loading || !s ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold">
                    {peak === null || peak === undefined ? "—" : `${String(peak).padStart(2, "0")}:00`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top consumers */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Top consumers
              <Badge variant="outline" className="bg-success/15 text-success border-success/20 text-[10px]">
                LIVE
              </Badge>
            </CardTitle>
            <CardDescription>Subscribers ranked by total data consumed in the selected period</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search name, phone, code, username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {consLoading && !consumers ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !consumers || consumers.results.length === 0 ? (
            <div className="text-center py-12">
              <HardDriveEmpty />
              <p className="text-slate-600 font-medium">No usage found</p>
              <p className="text-slate-500 text-sm mt-1">Try a different period or search term</p>
            </div>
          ) : (
            <>
              <div className={`rounded-lg border overflow-x-auto transition-opacity ${consLoading ? "opacity-60" : ""}`}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscriber</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Download</TableHead>
                      <TableHead>Upload</TableHead>
                      <TableHead>Total usage</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumers.results.map((c) => (
                      <TableRow key={c.username}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {initials(c.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              <p className="text-[11px] font-mono text-slate-500 truncate">
                                {c.type === "hotspot" ? `HOTSPOT · ${c.username}` : c.code}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.plan}</TableCell>
                        <TableCell className="text-sm font-mono">{fmtBytes(c.download)}</TableCell>
                        <TableCell className="text-sm font-mono">{fmtBytes(c.upload)}</TableCell>
                        <TableCell className="text-sm font-mono font-bold text-primary">{fmtBytes(c.total)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {c.online ? fmtDuration(c.uptime_seconds) : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              c.online
                                ? "bg-success/15 text-success border-success/20"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }
                          >
                            {c.online ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-slate-500">
                  Showing {(consumers.page - 1) * consumers.page_size + 1}–
                  {(consumers.page - 1) * consumers.page_size + consumers.results.length} of{" "}
                  {consumers.count.toLocaleString()} subscribers
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HardDriveEmpty() {
  return <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
}