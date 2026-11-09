"use client"

import React, { useCallback, useEffect, useId, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Building2, CreditCard, Loader2, Save, MoreHorizontal, ExternalLink,
  Pause, Play, Trash2, LogIn, MapPin, Globe, Wifi, Users, TrendingUp, TrendingDown,
  Wallet, Sparkles, CheckCircle2, Radio, Signal, Package, ScrollText, Settings2,
  RefreshCw, Gauge, Receipt, Router as RouterIcon, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  superadminApi, type Tenant, type TenantStats, type TenantUpdatePayload, type TenantInsights,
} from "@/lib/superadmin-api"
import { TenantBillingTab } from "./components/tenant-billing-tab"
import { RoutersTab, AuditTab } from "./components/tenant-data-tabs"
import { StaffTab } from "./components/tenant-staff-tab"

const HARD_DELETE_STEPS = [
  "Verify confirmation and protect system schemas",
  "Delete subscription payments and company subscription",
  "Remove tenant users, domains, company, and tenant records",
  "Clean router indexes and RADIUS tenant configuration",
  "Drop the tenant database schema",
  "Return to the tenant list",
]

// ───────── formatting ─────────
const num = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n)
function money(n: number, cur = "KSh") {
  if (n >= 1e6) return `${cur} ${(n / 1e6).toFixed(n >= 1e7 ? 2 : 3)}M`
  return `${cur} ${num(n)}`
}
const short = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2).replace(/\.?0+$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(Math.round(n))
const fdate = (d?: string | null, o: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-KE", o) : "—"

const card = "rounded-2xl border border-[#e8e2d9] bg-[#fcfaf7] text-[#23251d]"
const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-[#8a8577]"

// ───────── small components ─────────
function Delta({ v, suffix = "", invert = false }: { v: number | null | undefined; suffix?: string; invert?: boolean }) {
  if (v === null || v === undefined) return <span className="text-xs text-[#8a8577]">—</span>
  const good = invert ? v <= 0 : v >= 0
  const Icon = v >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold ${good ? "text-emerald-600" : "text-red-500"}`}>
      <Icon className="h-3 w-3" />{v >= 0 ? "+" : ""}{v}%{suffix}
    </span>
  )
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

function AreaChart({ points, split, dark = false }: {
  points: { label: string; value: number }[]; split?: number; dark?: boolean
}) {
  const gid = useId().replace(/:/g, "")
  const W = 800, H = 230, P = 6
  const max = niceMax(Math.max(...points.map((p) => p.value), 1))
  const x = (i: number) => (points.length < 2 ? W / 2 : P + (i * (W - 2 * P)) / (points.length - 1))
  const y = (v: number) => H - P - (v / max) * (H - 2 * P)
  const pts = points.map((p, i) => [x(i), y(p.value)] as const)
  const path = (a: readonly (readonly [number, number])[]) =>
    a.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ")
  const cut = split ?? points.length - 1
  const actual = pts.slice(0, cut + 1)
  const proj = pts.slice(cut)
  const area = `${path(actual)} L${actual[actual.length - 1]?.[0] ?? 0},${H} L${actual[0]?.[0] ?? 0},${H} Z`
  const ticks = [0, 1, 2, 3, 4]

  if (!points.length) return <p className="py-16 text-center text-sm text-[#8a8577]">No data yet</p>
  return (
    <div className="grid grid-cols-[40px_1fr] gap-2">
      <div className="flex h-[230px] flex-col-reverse justify-between font-mono text-[10px] text-[#8a8577]">
        {ticks.map((t) => <span key={t}>{short((max * t) / 4)}</span>)}
      </div>
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[230px] w-full overflow-visible">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9702f" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#d9702f" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1="0" x2={W} y1={y((max * t) / 4)} y2={y((max * t) / 4)}
              stroke="#e8e2d9" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          ))}
          {split !== undefined && (
            <line x1={x(cut)} x2={x(cut)} y1="0" y2={H} stroke="#bdb6a8" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          )}
          <path d={area} fill={`url(#${gid})`} />
          <path d={path(actual)} fill="none" stroke="#d9702f" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          {split !== undefined && proj.length > 1 && (
            <path d={path(proj)} fill="none" stroke="#d9702f" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-[#d9702f]">
          {points.map((p, i) => <span key={i}>{p.label}</span>)}
        </div>
      </div>
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r, arc = c * 0.75
  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      <svg viewBox="0 0 140 140" className="h-full w-full" style={{ transform: "rotate(135deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e8e2d9" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#d9702f" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * arc} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold">{score}</span>
        <span className={label}>growth score</span>
      </div>
    </div>
  )
}

function Segmented<T extends string | number>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { v: T; l: string }[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-[#e8e2d9] bg-[#f3efe9] p-0.5">
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${value === o.v ? "bg-white shadow-sm text-[#23251d]" : "text-[#8a8577] hover:text-[#23251d]"}`}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

const HEALTH = {
  healthy: ["Healthy tenant", "bg-emerald-100 text-emerald-700", "bg-emerald-500"],
  watch: ["On trial / watch", "bg-amber-100 text-amber-700", "bg-amber-500"],
  at_risk: ["At risk", "bg-red-100 text-red-700", "bg-red-500"],
} as const

// ───────── page ─────────
export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [stats, setStats] = useState<TenantStats | null>(null)
  const [ins, setIns] = useState<TenantInsights | null>(null)
  const [insErr, setInsErr] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState("overview")
  const [mode, setMode] = useState<"combined" | "hotspot" | "pppoe">("combined")
  const [range, setRange] = useState<6 | 12>(12)

  // settings form
  const [saving, setSaving] = useState(false)
  const [fStatus, setFStatus] = useState("")
  const [maxUsers, setMaxUsers] = useState(10)
  const [maxCustomers, setMaxCustomers] = useState(100)
  const [rate, setRate] = useState("")
  const [cycle, setCycle] = useState("monthly")
  const [expiry, setExpiry] = useState("")

  // dialogs
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [delText, setDelText] = useState("")
  const [delStep, setDelStep] = useState(0)
  const [delErr, setDelErr] = useState("")
  const [delDone, setDelDone] = useState(false)
  const [impersonating, setImpersonating] = useState(false)

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    const [t, s, i] = await Promise.allSettled([
      superadminApi.getTenant(id),
      superadminApi.getTenantStats(id),
      superadminApi.getTenantInsights(id, refresh),
    ])
    if (t.status === "rejected") {
      toast.error(t.reason?.message || "Failed to load tenant")
    } else {
      const v = t.value
      setTenant(v)
      setFStatus(v.status); setMaxUsers(v.max_users); setMaxCustomers(v.max_customers)
      setRate(v.monthly_rate); setCycle(v.billing_cycle); setExpiry(v.subscription_expiry || "")
    }
    if (s.status === "fulfilled") setStats(s.value)
    if (i.status === "fulfilled") { setIns(i.value); setInsErr("") }
    else setInsErr(i.reason?.message || "Insights unavailable")
    setLoading(false); setRefreshing(false)
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!confirmDelete) { setDelText(""); setDelStep(0); setDelErr(""); setDelDone(false) }
  }, [confirmDelete])

  const chartPoints = useMemo(() => {
    if (!ins) return []
    return ins.monthly.slice(-range).map((m) => ({
      label: m.label,
      value: mode === "combined" ? m.total : mode === "hotspot" ? m.hotspot : m.pppoe,
    }))
  }, [ins, mode, range])

  const projPoints = useMemo(() => {
    if (!ins || !ins.projection.actual.length) return { pts: [], split: 0 }
    const a = ins.projection.actual
    return { pts: [...a, ...ins.projection.projected], split: a.length - 1 }
  }, [ins])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: TenantUpdatePayload = {
        status: fStatus, max_users: maxUsers, max_customers: maxCustomers,
        monthly_rate: rate, billing_cycle: cycle,
      }
      if (expiry) payload.subscription_expiry = expiry
      await superadminApi.updateTenant(id, payload)
      toast.success("Tenant updated")
      load(true)
    } catch (e: any) { toast.error(e.message || "Failed to update") }
    finally { setSaving(false) }
  }

  const toggleSuspend = async (suspend: boolean) => {
    if (!tenant) return
    const prev = tenant
    setTenant({ ...tenant, status: suspend ? "suspended" : "active" })
    try {
      const updated = suspend ? await superadminApi.suspendTenant(id) : await superadminApi.activateTenant(id)
      setTenant((c) => (c ? { ...c, ...updated } : updated))
      setFStatus(updated.status)
      toast.success(suspend ? "Tenant suspended" : "Tenant unsuspended")
    } catch (e: any) {
      setTenant(prev); toast.error(e.message || "Action failed")
    }
  }

  const handleDelete = async () => {
    setDeleting(true); setDelStep(0); setDelErr(""); setDelDone(false)
    const timer = window.setInterval(() => setDelStep((s) => Math.min(s + 1, HARD_DELETE_STEPS.length - 2)), 700)
    try {
      await superadminApi.hardDeleteTenant(id, delText)
      window.clearInterval(timer)
      setDelStep(HARD_DELETE_STEPS.length - 1); setDelDone(true)
      toast.success("Tenant permanently deleted")
      window.setTimeout(() => router.push("/superadmin/tenants"), 800)
    } catch (e: any) {
      window.clearInterval(timer); setDelErr(e.message || "Delete failed"); toast.error(e.message || "Delete failed")
    } finally { setDeleting(false) }
  }

  const handleImpersonate = async () => {
    setImpersonating(true)
    try {
      const r = await superadminApi.impersonateTenant(id)
      try {
        const host = new URL(r.panel_url).hostname
        localStorage.setItem(`adminToken:${host}`, r.access)
        localStorage.setItem(`adminRefreshToken:${host}`, r.refresh)
      } catch {
        localStorage.setItem("adminToken", r.access); localStorage.setItem("adminRefreshToken", r.refresh)
      }
      window.open(r.panel_url, "_blank")
      toast.success(`Impersonating ${r.tenant.company_name}`)
    } catch (e: any) { toast.error(e.message || "Impersonation failed") }
    finally { setImpersonating(false) }
  }

  if (loading || !tenant) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-[#d9702f]" /></div>
  }

  const cur = ins?.currency === "KES" || !ins ? "KSh" : ins.currency
  const initials = tenant.company_name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  const health = HEALTH[ins?.tenant.health || "watch"]
  const delMatch = delText.trim() === tenant.company_name.trim()
  const sub = ins?.subscription
  const company = tenant.company
  const monthName = ins?.monthly.length
    ? new Date(ins.monthly[ins.monthly.length - 1].key + "-01").toLocaleString("en", { month: "long" }).toUpperCase()
    : "THIS MONTH"

  const tabCls = "data-[state=active]:bg-white data-[state=active]:text-[#23251d] data-[state=active]:shadow-sm"
  const tabIcon = "mr-1.5 h-4 w-4"

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-[#23251d]">
      {/* ───── Header ───── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e8e2d9] pb-6">
        <div className="flex items-start gap-4">
          <Link href="/superadmin/tenants">
            <Button variant="ghost" size="icon" className="mt-1"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${health[1]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${health[2]}`} />{health[0]}
              </span>
              {ins && (
                <span className={label}>
                  {ins.tenant.code} • joined {fdate(ins.tenant.joined_at, { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              )}
              <span className={`${label} rounded bg-[#f0ebe3] px-1.5 py-0.5`}>{tenant.status}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a2d24] text-lg font-semibold text-white">{initials}</div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">{tenant.company_name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8a8577]">
                  {ins?.tenant.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ins.tenant.location}</span>}
                  <span className="flex items-center gap-1"><Wifi className="h-3 w-3" />{num(ins?.tenant.active_subscribers ?? stats?.customers_active ?? 0)} active subscribers</span>
                  <a href={`https://${tenant.subdomain}.netily.co.ke`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[#d9702f] hover:underline">
                    <Globe className="h-3 w-3" />{ins?.tenant.website || `${tenant.subdomain}.netily.co.ke`}<ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTab("billing")}>
            <CreditCard className="mr-2 h-4 w-4" />Manage subscription
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="mr-1 h-4 w-4" />More</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleImpersonate} disabled={impersonating}>
                <LogIn className="mr-2 h-4 w-4" />Access panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`https://${tenant.subdomain}.netily.co.ke/admin`, "_blank")}>
                <ExternalLink className="mr-2 h-4 w-4" />Open admin panel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {tenant.status !== "suspended" ? (
                <DropdownMenuItem className="text-amber-600" onClick={() => toggleSuspend(true)}>
                  <Pause className="mr-2 h-4 w-4" />Suspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-emerald-600" onClick={() => toggleSuspend(false)}>
                  <Play className="mr-2 h-4 w-4" />Unsuspend
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" />Delete permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto bg-[#f0ebe3] p-1">
          <TabsTrigger value="overview" className={tabCls}><Building2 className={tabIcon} />Overview</TabsTrigger>
          <TabsTrigger value="billing" className={tabCls}><CreditCard className={tabIcon} />Billing</TabsTrigger>
          <TabsTrigger value="settings" className={tabCls}><Settings2 className={tabIcon} />Settings</TabsTrigger>
          <TabsTrigger value="routers" className={tabCls}><Wifi className={tabIcon} />Routers</TabsTrigger>
          <TabsTrigger value="staff" className={tabCls}><Users className={tabIcon} />Staff</TabsTrigger>
          <TabsTrigger value="audit" className={tabCls}><ScrollText className={tabIcon} />Audit log</TabsTrigger>
        </TabsList>

        {/* ═════════ OVERVIEW ═════════ */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {!ins ? (
            <div className={`${card} p-8 text-center text-sm text-[#8a8577]`}>
              Revenue insights unavailable{insErr ? `: ${insErr}` : ""}.
              <Button variant="link" onClick={() => load(true)}>Retry</Button>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-[#2a2d24] p-5 text-white">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Total revenue • {monthName}</span>
                    <Wallet className="h-4 w-4 text-[#d9702f]" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{money(ins.revenue.current_month, cur)}</p>
                  <p className="mt-2 text-[11px] text-white/60">
                    <Delta v={ins.revenue.mom_pct} /> vs last month
                  </p>
                </div>
                <div className={`${card} p-5`}>
                  <div className="flex items-start justify-between">
                    <span className={label}>PPPoE revenue</span><RouterIcon className="h-4 w-4 text-[#d9702f]" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{money(ins.revenue.pppoe, cur)}</p>
                  <p className="mt-2 text-[11px] text-[#8a8577]"><Delta v={ins.revenue.pppoe_mom_pct} /> {ins.revenue.pppoe_share}% of revenue</p>
                </div>
                <div className={`${card} p-5`}>
                  <div className="flex items-start justify-between">
                    <span className={label}>Hotspot revenue</span><Wifi className="h-4 w-4 text-[#d9702f]" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{money(ins.revenue.hotspot, cur)}</p>
                  <p className="mt-2 text-[11px] text-[#8a8577]"><Delta v={ins.revenue.hotspot_mom_pct} /> {ins.revenue.hotspot_share}% of revenue</p>
                </div>
                <div className={`${card} p-5`}>
                  <div className="flex items-start justify-between">
                    <span className={label}>Annual run rate</span><TrendingUp className="h-4 w-4 text-[#d9702f]" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{money(ins.revenue.run_rate, cur)}</p>
                  <p className="mt-2 text-[11px] text-[#8a8577]"><Delta v={ins.revenue.yoy_pct} /> year over year</p>
                </div>
              </div>

              {/* Growth chart + signal */}
              <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                <div className={`${card} p-5`}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        Revenue growth
                        {ins.revenue.yoy_pct !== null && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700">
                            {ins.revenue.yoy_pct >= 0 ? "+" : ""}{ins.revenue.yoy_pct}% / 12M
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[#8a8577]">Monthly collections from PPPoE and hotspot services</p>
                    </div>
                    <div className="flex gap-2">
                      <Segmented value={mode} onChange={setMode} options={[
                        { v: "combined", l: "Combined" }, { v: "hotspot", l: "Hotspot" }, { v: "pppoe", l: "PPPoE" }]} />
                      <Segmented value={range} onChange={setRange} options={[{ v: 6, l: "6M" }, { v: 12, l: "12M" }]} />
                    </div>
                  </div>
                  <AreaChart points={chartPoints} />
                  <div className="mt-4 flex items-center justify-between border-t border-[#e8e2d9] pt-3 text-[11px] text-[#8a8577]">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d9702f]" />Total revenue</span>
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2a2d24]" />PPPoE</span>
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e6a56d]" />Hotspot</span>
                    </div>
                    <span className="font-mono uppercase">Revenue shown in {cur}</span>
                  </div>
                </div>

                <div className={`${card} p-5`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Scaling signal</h3>
                      <p className="text-xs text-[#8a8577]">Tenant growth health</p>
                    </div>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700">{ins.signal.badge}</span>
                  </div>
                  <div className="mt-4"><ScoreRing score={ins.signal.score} /></div>
                  <p className="mt-3 text-center text-sm font-medium">{ins.signal.label}</p>
                  <p className="mt-1 px-2 text-center text-[11px] text-[#8a8577]">{ins.signal.summary}</p>
                  <div className="mt-4 space-y-2.5 border-t border-[#e8e2d9] pt-4 text-xs">
                    {([
                      ["Revenue growth", <Delta key="a" v={ins.signal.revenue_growth_yoy} suffix=" YoY" />],
                      ["Subscriber growth", <Delta key="b" v={ins.signal.subscriber_growth_yoy} suffix=" YoY" />],
                      ["ARPU movement", <Delta key="c" v={ins.signal.arpu_change_pct} />],
                      ["Churn rate", <span key="d" className="font-mono text-[11px]">{ins.signal.churn_rate ?? "—"}{ins.signal.churn_rate !== null ? "%" : ""}</span>],
                    ] as [string, React.ReactNode][]).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between"><span className="text-[#8a8577]">{k}</span>{v}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Projection + subscription */}
              <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
                <div className={`${card} p-5`}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold">Revenue projection <Sparkles className="h-4 w-4 text-[#d9702f]" /></h3>
                      <p className="text-xs text-[#8a8577]">Five-month forecast based on current growth trend</p>
                    </div>
                    {ins.projection.forecast_value != null && (
                      <div className="text-right">
                        <p className={label}>{ins.projection.forecast_label} forecast</p>
                        <p className="text-sm font-semibold">{money(ins.projection.forecast_value, cur)}</p>
                      </div>
                    )}
                  </div>
                  {projPoints.pts.length ? (
                    <AreaChart points={projPoints.pts} split={projPoints.split} />
                  ) : (
                    <p className="py-16 text-center text-sm text-[#8a8577]">Needs at least 3 months of revenue history to forecast.</p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-[#e8e2d9] pt-3 text-[11px] text-[#8a8577]">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2a2d24]" />Actual</span>
                      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d9702f]" />Projected</span>
                    </div>
                    <span className="font-mono uppercase">{ins.projection.confidence}% confidence</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl bg-[#2a2d24] text-white">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d9702f]">Netily subscription</p>
                        <h3 className="mt-2 text-xl font-semibold">{sub?.exists ? sub.plan_name : "No subscription"}</h3>
                        <p className="text-xs text-white/50">
                          {sub?.exists
                            ? sub.max_subscribers ? `Up to ${num(sub.max_subscribers)} managed subscribers` : sub.plan_description || "Unlimited subscribers"
                            : "This tenant has no plan yet"}
                        </p>
                      </div>
                      <CreditCard className="h-5 w-5 text-[#d9702f]" />
                    </div>
                    {sub?.exists && (
                      <>
                        <div className="mt-5 flex items-end justify-between">
                          <p className="text-3xl font-semibold">{money(sub.price || 0, cur)}<span className="ml-1 text-xs font-normal text-white/50">/ {sub.billing_period === "yearly" ? "year" : "month"}{sub.is_metered ? " (est.)" : ""}</span></p>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] ${sub.status === "active" ? "bg-emerald-500/20 text-emerald-300" : sub.status === "trialing" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                            {sub.status === "active" && <CheckCircle2 className="h-3 w-3" />}{sub.status === "active" ? "Paid" : sub.status}
                          </span>
                        </div>
                        {!!sub.max_subscribers && (
                          <div className="mt-4">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-[#d9702f]"
                                style={{ width: `${Math.min(100, (ins.tenant.active_subscribers / sub.max_subscribers) * 100)}%` }} />
                            </div>
                            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-white/40">
                              <span>{num(ins.tenant.active_subscribers)} / {num(sub.max_subscribers)} subscribers</span>
                              <span>{Math.round((ins.tenant.active_subscribers / sub.max_subscribers) * 100)}%</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {sub?.exists && (
                    <>
                      <div className="grid grid-cols-2 border-y border-white/10">
                        <div className="border-r border-white/10 p-5">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Lifetime paid</p>
                          <p className="mt-1 text-lg font-semibold">{money(sub.lifetime_paid || 0, cur)}</p>
                        </div>
                        <div className="p-5">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Next billing</p>
                          <p className="mt-1 text-lg font-semibold">{fdate(sub.next_billing, { day: "2-digit", month: "short" })}</p>
                        </div>
                      </div>
                      <div className="space-y-2 p-5 text-xs">
                        <div className="flex justify-between"><span className="text-white/50">Payment reliability</span>
                          <span className="font-mono text-emerald-300">{sub.reliability_pct != null ? `${sub.reliability_pct}% paid cycles` : "—"}</span></div>
                        <div className="flex justify-between"><span className="text-white/50">Revenue / subscription cost</span>
                          <span className="font-mono">{sub.revenue_multiple != null ? `${sub.revenue_multiple}×` : "—"}</span></div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment history */}
              <div className={card}>
                <div className="flex items-start justify-between p-5">
                  <div>
                    <h3 className="text-lg font-semibold">Subscription payment history</h3>
                    <p className="text-xs text-[#8a8577]">Payments made by {tenant.company_name} to Netily</p>
                  </div>
                  <button onClick={() => setTab("billing")} className="text-xs font-medium text-[#d9702f] hover:underline">View billing →</button>
                </div>
                {sub?.payments?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-y border-[#e8e2d9] bg-[#f6f2eb] text-left ${label}`}>
                          {["Reference", "Billing period", "Plan", "Paid on", "Amount", "Status"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eee8df]">
                        {sub.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="px-5 py-3"><span className="flex items-center gap-3"><Receipt className="h-4 w-4 text-[#8a8577]" /><span className="font-mono text-xs text-[#2a6f8f]">{p.reference}</span></span></td>
                            <td className="px-5 py-3 text-xs">{p.period_start ? fdate(p.period_start, { month: "long", year: "numeric" }) : "—"}</td>
                            <td className="px-5 py-3 text-xs">{p.plan_name}</td>
                            <td className="px-5 py-3 font-mono text-xs">{fdate(p.paid_on)}</td>
                            <td className="px-5 py-3 font-mono text-xs font-semibold">{cur} {num(p.amount)}</td>
                            <td className="px-5 py-3"><span className="flex items-center gap-1.5 text-xs"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Paid</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="border-t border-[#e8e2d9] py-10 text-center text-sm text-[#8a8577]">No completed subscription payments yet</p>
                )}
              </div>

              {/* Bottom stat strip */}
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: Users, l: "Active subscribers", v: num(ins.stats.active_subscribers), d: <span className="text-[11px] text-[#8a8577]">+{ins.stats.new_this_month} this month</span> },
                  { icon: Gauge, l: "Average revenue / user", v: `${cur} ${num(ins.stats.arpu)}`, d: <Delta v={ins.stats.arpu_change_pct} suffix=" MoM" /> },
                  { icon: TrendingDown, l: "Monthly churn", v: ins.stats.churn_rate != null ? `${ins.stats.churn_rate}%` : "—", d: <span className="text-[11px] text-[#8a8577]">terminated services</span> },
                ].map((s) => (
                  <div key={s.l} className={`${card} flex items-center gap-4 p-4`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6e6d9]"><s.icon className="h-5 w-5 text-[#d9702f]" /></div>
                    <div className="flex-1"><p className={label}>{s.l}</p><p className="text-2xl font-semibold">{s.v}</p></div>
                    {s.d}
                  </div>
                ))}
              </div>

              {/* Operations (from existing stats endpoint) */}
              {stats && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {[
                    ["Customers", stats.customers, `${stats.customers_active ?? 0} active`],
                    ["Routers", stats.routers, `${stats.routers_online ?? 0} online`],
                    ["PPPoE users", stats.pppoe_users ?? 0, `${stats.pppoe_active ?? 0} active`],
                    ["Hotspot users", stats.hotspot_users ?? 0, `${stats.hotspot_active ?? 0} active`],
                    ["Invoices", stats.invoices, ""],
                    ["Equipment", stats.equipment_items ?? 0, `${stats.equipment_in_use ?? 0} in use`],
                    ["Open tickets", stats.support_tickets_open ?? 0, ""],
                  ].map(([l, v, s]) => (
                    <div key={String(l)} className={`${card} p-3 text-center`}>
                      <p className="text-xl font-semibold">{num(Number(v))}</p>
                      <p className="text-xs text-[#8a8577]">{l}</p>
                      {s ? <p className="text-[10px] text-[#a39d8e]">{s}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ═════════ BILLING ═════════ */}
        <TabsContent value="billing" className="mt-6"><TenantBillingTab tenant={tenant} /></TabsContent>

        {/* ═════════ SETTINGS ═════════ */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`${card} space-y-3 p-5 text-sm`}>
              <h3 className="flex items-center gap-2 text-base font-semibold"><Building2 className="h-5 w-5 text-[#d9702f]" />Company details</h3>
              {company ? ([
                ["Name", company.name], ["Email", company.email], ["Phone", company.phone_number],
                ["Location", `${company.city}${company.county ? ", " + company.county : ""}`],
                ["Website", company.website || "—"], ["Reg #", company.registration_number || "—"],
                ["Tax PIN", company.tax_pin || "—"], ["Created", new Date(company.created_at).toLocaleString()],
                ["Schema", tenant.schema_name],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex gap-3"><span className="w-24 shrink-0 text-[#8a8577]">{k}</span><span className="break-all">{v}</span></div>
              )) : <p className="text-[#8a8577]">Company details not available</p>}
              <div className="border-t border-[#e8e2d9] pt-3">
                <p className={`${label} mb-2`}>Domains</p>
                {tenant.domains?.length ? tenant.domains.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1">
                    <code className="text-xs text-[#d9702f]">{d.domain}</code>
                    {d.is_primary && <span className="rounded bg-[#f6e6d9] px-1.5 py-0.5 text-[10px] text-[#d9702f]">Primary</span>}
                  </div>
                )) : <p className="text-xs text-[#8a8577]">No domains configured</p>}
              </div>
            </div>

            <div className={`${card} space-y-4 p-5`}>
              <div>
                <h3 className="text-base font-semibold">Tenant settings</h3>
                <p className="text-xs text-[#8a8577]">Adjust limits, billing, and status</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Status</Label>
                  <Select value={fStatus} onValueChange={setFStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["trial", "active", "suspended", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Billing cycle</Label>
                  <Select value={cycle} onValueChange={setCycle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["monthly", "quarterly", "yearly"].map((s) => <SelectItem key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Max users</Label><Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Max customers</Label><Input type="number" value={maxCustomers} onChange={(e) => setMaxCustomers(Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Monthly rate (KES)</Label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Subscription expiry</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
              </div>
              <p className="text-xs text-[#8a8577]">Only override the expiry date if you intentionally need to differ from the subscription-derived date.</p>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-[#d9702f] text-white hover:bg-[#c4621f]">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="routers" className="mt-6"><RoutersTab tenantId={id} icon={<Wifi className="h-5 w-5 text-emerald-600" />} /></TabsContent>
        <TabsContent value="staff" className="mt-6"><StaffTab tenantId={id} /></TabsContent>
        <TabsContent value="audit" className="mt-6"><AuditTab tenantId={id} icon={<ScrollText className="h-5 w-5 text-violet-600" />} /></TabsContent>
      </Tabs>

      {/* ───── Delete dialog ───── */}
      <AlertDialog open={confirmDelete} onOpenChange={(o) => { if (!deleting) setConfirmDelete(o) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Permanently delete tenant?</AlertDialogTitle></AlertDialogHeader>
          <div className="space-y-4 text-sm">
            <p>This will <b className="text-red-600">permanently delete</b> <b>{tenant.company_name}</b>: subscription records, users, domains, router/RADIUS indexes, tenant and company records, then drops the schema. This cannot be undone.</p>
            <div className="space-y-2">
              <Label>Type <b>{tenant.company_name}</b> to confirm</Label>
              <Input value={delText} onChange={(e) => setDelText(e.target.value)} placeholder={tenant.company_name} disabled={deleting || delDone} />
            </div>
            {(deleting || delDone || delErr) && (
              <div className="rounded-xl border p-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full transition-all ${delErr ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.round(((delStep + 1) / HARD_DELETE_STEPS.length) * 100)}%` }} />
                </div>
                <ul className="mt-3 space-y-1.5 text-xs">
                  {HARD_DELETE_STEPS.map((s, i) => (
                    <li key={s} className={`flex items-center gap-2 ${delDone || i <= delStep ? "" : "text-muted-foreground"}`}>
                      {!delDone && !delErr && i === delStep ? <Loader2 className="h-3 w-3 animate-spin" /> : delDone || i < delStep ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <span className="h-3 w-3" />}
                      {s}
                    </li>
                  ))}
                </ul>
                {delErr && <p className="mt-2 text-xs text-red-600">{delErr}</p>}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting || delDone || !delMatch} className="bg-red-600 text-white hover:bg-red-500">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{delDone ? "Deleted" : deleting ? "Deleting…" : "Delete now"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}