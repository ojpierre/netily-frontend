"use client"

// Reports page building blocks: headline KPI tiles, Plan Performance, Top customers and
// Network Data Flow. Everything is drawn from the shadcn theme tokens (--primary, --chart-*,
// --card, --muted, --border) so the cards follow whichever colour theme and light/dark mode
// the tenant picked in Settings → Appearance.

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Cable,
  Crown,
  Gauge,
  Layers,
  Medal,
  Receipt,
  Wifi,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ─── helpers ──────────────────────────────────────────────────────────────────

const ksh = (n: number) => `Ksh ${Math.round(n).toLocaleString()}`
const kshShort = (n: number) => {
  if (n >= 1_000_000) return `Ksh ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 10_000) return `Ksh ${Math.round(n / 1_000)}K`
  return ksh(n)
}

/** GB in → a readable size (MB under 1 GB, TB above 1024 GB). */
export const fmtSize = (gb: number) => {
  if (!gb) return "0 MB"
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`
  if (gb >= 1) return `${gb.toFixed(gb >= 100 ? 0 : 1)} GB`
  return `${Math.max(1, Math.round(gb * 1024))} MB`
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/** Animates a number from its previous value to the new one (instant under reduced motion). */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(0)
  useEffect(() => {
    if (prefersReducedMotion()) { setValue(target); fromRef.current = target; return }
    const from = fromRef.current
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); fromRef.current = target }
  }, [target, duration])
  return value
}

function SectionTitle({ icon, title, description, right }: { icon: React.ReactNode; title: string; description?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
        <div>
          <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
          {description && <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>}
        </div>
      </div>
      {right}
    </div>
  )
}

function Empty({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
      <BarChart3 className="h-9 w-9 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── KPI tiles ────────────────────────────────────────────────────────────────

export type KpiTileProps = {
  label: string
  value: number
  /** money tiles show "Ksh" as a quiet prefix so the figure itself dominates */
  money?: boolean
  change?: number
  changeLabel?: string
  footnote?: string
  icon: React.ReactNode
  trend?: number[]
  trendLabel?: string
  /** the lead tile is filled with the theme colour */
  lead?: boolean
}

function Sparkline({ data, lead }: { data: number[]; lead?: boolean }) {
  const rows = data.map((v, i) => ({ i, v }))
  const id = lead ? "spark-lead" : "spark"
  const stroke = lead ? "var(--primary-foreground)" : "var(--primary)"
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={lead ? 0.35 : 0.22} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} fill={`url(#${id})`} dot={false} isAnimationActive={!prefersReducedMotion()} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function KpiTile({ label, value, money, change, changeLabel, footnote, icon, trend, trendLabel, lead }: KpiTileProps) {
  const shown = useCountUp(value)
  const positive = (change ?? 0) >= 0
  const hasTrend = !!trend && trend.length > 1 && trend.some((v) => v > 0)
  return (
    <Card
      className={`group relative overflow-hidden rounded-2xl p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        lead
          ? "border-transparent bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "bg-gradient-to-br from-primary/[0.07] via-card to-card"
      }`}
    >
      {/* soft glow */}
      <div aria-hidden="true" className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-2xl ${lead ? "bg-primary-foreground/15" : "bg-primary/10"}`} />
      <CardContent className="relative flex h-full flex-col p-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${lead ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary"}`}>{icon}</span>
          <p className={`text-xs font-semibold uppercase leading-tight tracking-wider ${lead ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
        </div>

        <p className="mt-4 flex items-baseline gap-1.5 leading-none" aria-label={money ? ksh(value) : value.toLocaleString()}>
          {money && <span className={`text-base font-semibold ${lead ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Ksh</span>}
          <span className="text-[2.15rem] font-extrabold tracking-tight tabular-nums sm:text-[2.5rem]">{Math.round(shown).toLocaleString()}</span>
        </p>

        <div className={`mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${lead ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
          {change !== undefined && (
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                lead
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : positive
                  ? "bg-success/12 text-success"
                  : "bg-destructive/12 text-destructive"
              }`}
              title={changeLabel}
            >
              {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {positive ? "+" : ""}
              {change}%
            </span>
          )}
          <span>
            {changeLabel}
            {footnote ? <span className="font-semibold">{changeLabel ? " · " : ""}{footnote}</span> : null}
          </span>
        </div>

        <div className="mt-auto pt-3" aria-hidden={!hasTrend}>
          {hasTrend ? (
            <>
              <Sparkline data={trend!} lead={lead} />
              {trendLabel && <p className={`mt-1 text-[10px] uppercase tracking-wider ${lead ? "text-primary-foreground/60" : "text-muted-foreground/80"}`}>{trendLabel}</p>}
            </>
          ) : (
            <div className="h-[44px]" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Plan Performance ─────────────────────────────────────────────────────────

export type PlanRow = {
  plan_type: string
  connection_type: string
  name: string
  base_price: number
  total_revenue: number
  total_transactions: number
}

type PlanFilter = "all" | "pppoe" | "hotspot"
type PlanSort = "revenue" | "transactions" | "price"

// Revenue share strip: fixed order of the theme's chart tokens; anything past 5 folds into "Other"
const SHARE_FILLS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-5", "bg-chart-4"]

export function PlanPerformanceCard({ plans }: { plans: PlanRow[] }) {
  const [filter, setFilter] = useState<PlanFilter>("all")
  const [sort, setSort] = useState<PlanSort>("revenue")
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo(() => {
    const list = plans.filter((p) => (filter === "all" ? true : filter === "hotspot" ? p.plan_type === "hotspot" : p.plan_type !== "hotspot"))
    const key = sort === "revenue" ? "total_revenue" : sort === "transactions" ? "total_transactions" : "base_price"
    return [...list].sort((a, b) => (b[key] as number) - (a[key] as number))
  }, [plans, filter, sort])

  const totals = useMemo(() => {
    const revenue = rows.reduce((s, p) => s + p.total_revenue, 0)
    const tx = rows.reduce((s, p) => s + p.total_transactions, 0)
    const selling = rows.filter((p) => p.total_revenue > 0).length
    return { revenue, tx, selling, avg: tx ? revenue / tx : 0 }
  }, [rows])

  const share = useMemo(() => {
    const byRev = [...rows].filter((p) => p.total_revenue > 0).sort((a, b) => b.total_revenue - a.total_revenue)
    const top = byRev.slice(0, 5).map((p, i) => ({ name: p.name, value: p.total_revenue, fill: SHARE_FILLS[i] }))
    const other = byRev.slice(5).reduce((s, p) => s + p.total_revenue, 0)
    if (other > 0) top.push({ name: "Other plans", value: other, fill: "bg-muted-foreground/30" })
    return top
  }, [rows])

  const maxRevenue = Math.max(1, ...rows.map((p) => p.total_revenue))
  const visible = showAll ? rows : rows.slice(0, 8)

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="gap-4 pb-4">
        <SectionTitle
          icon={<Layers className="h-4.5 w-4.5" />}
          title="Plan Performance"
          description="Lifetime revenue and sales for every active plan"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="Plan type" value={filter} onChange={(v) => { setFilter(v); setShowAll(false) }} options={[{ value: "all", label: "All" }, { value: "pppoe", label: "PPPoE" }, { value: "hotspot", label: "Hotspot" }]} />
              <Segmented label="Sort by" value={sort} onChange={setSort} options={[{ value: "revenue", label: "Revenue" }, { value: "transactions", label: "Sales" }, { value: "price", label: "Price" }]} />
            </div>
          }
        />

        {/* Headline figures */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Lifetime revenue", value: kshShort(totals.revenue), icon: <Receipt className="h-4 w-4" /> },
            { label: "Transactions", value: totals.tx.toLocaleString(), icon: <BarChart3 className="h-4 w-4" /> },
            { label: "Avg per sale", value: kshShort(totals.avg), icon: <Gauge className="h-4 w-4" /> },
            { label: "Plans selling", value: `${totals.selling} / ${rows.length}`, icon: <Layers className="h-4 w-4" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-muted/30 px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className="text-primary">{s.icon}</span>
                {s.label}
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight tabular-nums text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue share strip */}
        {share.length > 0 && (
          <div>
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Revenue share by plan">
              {share.map((s) => (
                <div key={s.name} className={`${s.fill} h-full first:rounded-l-full last:rounded-r-full`} style={{ width: `${(s.value / Math.max(totals.revenue, 1)) * 100}%` }} title={`${s.name}: ${ksh(s.value)}`} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {share.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.fill}`} />
                  <span className="max-w-[140px] truncate text-foreground">{s.name}</span>
                  <span className="tabular-nums">{Math.round((s.value / Math.max(totals.revenue, 1)) * 100)}%</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-0 pb-2">
        {!rows.length ? (
          <div className="px-6 pb-4"><Empty label="No plans in this view" hint="Active plans appear here once they exist." /></div>
        ) : (
          <>
            {/* column labels (desktop) */}
            <div className="hidden grid-cols-[2rem_minmax(0,1fr)_7rem_6rem_8rem] items-center gap-4 border-y bg-muted/30 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
              <span>#</span>
              <span>Plan</span>
              <span className="text-right">Price</span>
              <span className="text-right">Sales</span>
              <span className="text-right">Revenue</span>
            </div>
            <ul className="divide-y">
              {visible.map((p, i) => {
                const isHotspot = p.plan_type === "hotspot"
                const pct = (p.total_revenue / maxRevenue) * 100
                const sharePct = totals.revenue ? (p.total_revenue / totals.revenue) * 100 : 0
                const idle = p.total_revenue <= 0
                return (
                  <li key={`${p.plan_type}-${p.name}-${i}`} className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-6 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[2rem_minmax(0,1fr)_7rem_6rem_8rem] ${idle ? "opacity-70" : ""}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold tabular-nums ${i === 0 && sort === "revenue" && !idle ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {isHotspot ? <Wifi className="h-3 w-3" /> : <Cable className="h-3 w-3" />}
                          {isHotspot ? "Hotspot" : p.connection_type || "PPPoE"}
                        </span>
                        {idle && <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">No sales yet</span>}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">{sharePct >= 0.5 ? `${Math.round(sharePct)}%` : "–"}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground md:hidden">
                        {ksh(p.base_price)} · {p.total_transactions.toLocaleString()} sales
                      </p>
                    </div>
                    <span className="hidden text-right text-sm tabular-nums text-muted-foreground md:block">{ksh(p.base_price)}</span>
                    <span className="hidden text-right text-sm font-semibold tabular-nums text-foreground md:block">{p.total_transactions.toLocaleString()}</span>
                    <span className={`text-right text-sm font-bold tabular-nums ${idle ? "text-muted-foreground" : "text-foreground"}`}>{ksh(p.total_revenue)}</span>
                  </li>
                )
              })}
            </ul>
            {rows.length > 8 && (
              <div className="border-t px-6 pt-2">
                <button type="button" onClick={() => setShowAll((v) => !v)} className="rounded-md px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {showAll ? "Show top 8" : `Show all ${rows.length} plans`}
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Top customers ────────────────────────────────────────────────────────────

export type TopCustomer = {
  type: string
  display_name: string
  identifier?: string
  total_amount: number
  tx_count: number
  last_payment_date?: string | null
}

const initials = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"

const ago = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return "Paid today"
  if (days === 1) return "Paid yesterday"
  if (days < 30) return `Paid ${days}d ago`
  if (days < 365) return `Paid ${Math.floor(days / 30)}mo ago`
  return `Paid ${Math.floor(days / 365)}y ago`
}

function TypeTag({ type, onPrimary }: { type: string; onPrimary?: boolean }) {
  const hotspot = type === "HOTSPOT"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${onPrimary ? "bg-primary-foreground/15 text-primary-foreground" : "border text-muted-foreground"}`}>
      {hotspot ? <Wifi className="h-3 w-3" /> : <Cable className="h-3 w-3" />}
      {hotspot ? "Hotspot" : "PPPoE"}
    </span>
  )
}

// Podium medals: rank is carried by the number and label too, never colour alone
const MEDAL = ["text-amber-400", "text-slate-400", "text-orange-500"]
const PODIUM_LABEL = ["Most valuable", "Runner-up", "Third place"]

export function TopCustomersCard({ customers }: { customers: TopCustomer[] }) {
  const total = customers.reduce((s, c) => s + c.total_amount, 0)
  const max = Math.max(1, ...customers.map((c) => c.total_amount))
  const podium = customers.slice(0, 3)
  const rest = customers.slice(3, 10)
  // visual order on wide screens: 2nd, 1st, 3rd
  const podiumOrder = ["sm:order-2", "sm:order-1", "sm:order-3"]

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="pb-4">
        <SectionTitle
          icon={<Crown className="h-4.5 w-4.5" />}
          title="Top 10 Most Impactful Customers"
          description="Ranked by lifetime spend, PPPoE and Hotspot combined"
          right={
            total > 0 ? (
              <div className="rounded-xl border bg-muted/30 px-3 py-1.5 text-right">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Top 10 combined</p>
                <p className="text-sm font-bold tabular-nums text-foreground">{ksh(total)}</p>
              </div>
            ) : null
          }
        />
      </CardHeader>
      <CardContent className="space-y-5">
        {!customers.length ? (
          <Empty label="No customer payments yet" hint="Customers appear here once they have completed payments." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
              {podium.map((c, i) => {
                const first = i === 0
                const last = ago(c.last_payment_date)
                return (
                  <div
                    key={`${c.display_name}-${i}`}
                    className={`relative flex flex-col items-center rounded-2xl border px-4 text-center transition-shadow hover:shadow-md ${podiumOrder[i]} ${
                      first
                        ? "border-transparent bg-primary py-6 text-primary-foreground shadow-lg shadow-primary/25 sm:py-8"
                        : "bg-gradient-to-b from-primary/[0.06] to-card py-5"
                    }`}
                  >
                    <span className={`absolute left-3 top-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${first ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      <Medal className={`h-3.5 w-3.5 ${MEDAL[i]}`} aria-hidden="true" />#{i + 1}
                    </span>
                    <span
                      className={`grid place-items-center rounded-full font-bold ${
                        first ? "h-16 w-16 bg-primary-foreground text-xl text-primary ring-4 ring-primary-foreground/25" : "h-12 w-12 bg-primary/10 text-base text-primary"
                      }`}
                      aria-hidden="true"
                    >
                      {initials(c.display_name)}
                    </span>
                    <p className={`mt-3 w-full truncate font-semibold ${first ? "text-base" : "text-sm text-foreground"}`} title={c.display_name}>{c.display_name}</p>
                    <p className={`text-[11px] ${first ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{PODIUM_LABEL[i]}</p>
                    <p className={`mt-3 font-extrabold tracking-tight tabular-nums ${first ? "text-3xl" : "text-xl text-foreground"}`}>
                      <span className={`mr-1 text-xs font-semibold ${first ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Ksh</span>
                      {Math.round(c.total_amount).toLocaleString()}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                      <TypeTag type={c.type} onPrimary={first} />
                      <span className={`text-[11px] ${first ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{c.tx_count} payments</span>
                    </div>
                    {last && <p className={`mt-1 text-[10px] ${first ? "text-primary-foreground/60" : "text-muted-foreground/80"}`}>{last}</p>}
                  </div>
                )
              })}
            </div>

            {rest.length > 0 && (
              <ol className="divide-y rounded-xl border" start={4}>
                {rest.map((c, j) => {
                  const rank = j + 4
                  const last = ago(c.last_payment_date)
                  return (
                    <li key={`${c.display_name}-${rank}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                      <span className="w-5 text-center text-xs font-bold tabular-nums text-muted-foreground">{rank}</span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground" aria-hidden="true">{initials(c.display_name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{c.display_name}</p>
                          <TypeTag type={c.type} />
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${(c.total_amount / max) * 100}%` }} />
                          </div>
                          <span className="hidden whitespace-nowrap text-[10px] text-muted-foreground sm:inline">
                            {c.tx_count} payments{last ? ` · ${last}` : ""}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-right text-sm font-bold tabular-nums text-foreground">{ksh(c.total_amount)}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Network Data Flow ────────────────────────────────────────────────────────

export type FlowRow = { date: string; upload: number; download: number }

function FlowTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[160px] rounded-xl border bg-popover px-3.5 py-2.5 text-sm text-popover-foreground shadow-xl">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.stroke }} />
          <span className="flex-1 text-xs text-muted-foreground">{p.name}</span>
          <span className="text-xs font-bold tabular-nums">{fmtSize(Number(p.value))}</span>
        </div>
      ))}
    </div>
  )
}

const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

export function DataFlowCard({ rows, height = 220, updatedAt, compact }: { rows?: FlowRow[]; height?: number; updatedAt?: Date | null; compact?: boolean }) {
  const data = rows || []
  const down = data.reduce((s, r) => s + (r.download || 0), 0)
  const up = data.reduce((s, r) => s + (r.upload || 0), 0)
  const peak = data.reduce<FlowRow | null>((best, r) => (!best || r.download + r.upload > best.download + best.upload ? r : best), null)
  const hasData = down + up > 0
  const gradId = compact ? "flow-down-c" : "flow-down"

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="gap-4 pb-3">
        <SectionTitle
          icon={<Gauge className="h-4.5 w-4.5" />}
          title="Network Data Flow"
          description="Daily download and upload across PPPoE and Hotspot sessions"
          right={
            updatedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Live · {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : null
          }
        />
        {hasData && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Download", value: fmtSize(down), icon: <ArrowDown className="h-3.5 w-3.5" />, swatch: "bg-chart-1" },
              { label: "Upload", value: fmtSize(up), icon: <ArrowUp className="h-3.5 w-3.5" />, swatch: "bg-chart-2" },
              { label: "Busiest day", value: peak ? shortDate(peak.date) : "–", icon: <BarChart3 className="h-3.5 w-3.5" />, swatch: "" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-muted/30 px-3 py-2">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {s.swatch ? <span className={`h-2 w-2 rounded-full ${s.swatch}`} /> : null}
                  {s.icon}
                  {s.label}
                </p>
                <p className={`mt-0.5 font-bold tabular-nums text-foreground ${compact ? "text-base" : "text-lg"}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div style={{ minHeight: height }} className="flex items-center">
            <div className="w-full">
              <Empty label="No traffic recorded for this period" hint="Usage appears as your routers send RADIUS accounting for PPPoE and Hotspot sessions." />
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tickFormatter={(v) => fmtSize(Number(v))} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={(p: any) => <FlowTooltip {...p} label={p.label ? shortDate(String(p.label)) : undefined} />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="download" name="Download" stroke="var(--chart-1)" strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
              {/* Upload is dashed so the two series never rely on colour alone */}
              <Area type="monotone" dataKey="upload" name="Upload" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
