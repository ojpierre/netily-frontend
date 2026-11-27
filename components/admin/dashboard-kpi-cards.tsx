"use client"

/*
 * The four headline cards on the tenant dashboard: Customers, Active subscriptions,
 * Expired and Online now. Each card leads with one big figure and one small,
 * honest visual that explains it (a ring, a split bar, a share bar, a gauge).
 * Colours come from the theme tokens (--primary, --chart-*, --success,
 * --destructive) so the cards follow every colour theme and dark mode.
 */

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, RefreshCcw, UserCheck, Users, Wifi } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface DashboardKpiData {
  totalCustomers: number
  active: { pppoe: number; hotspot: number; total: number }
  expired: number
  online: number
}

/** Counts up to `target` once, respecting reduced motion. */
function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(run ? 0 : target)
  const from = useRef(0)
  useEffect(() => {
    if (!run) { setValue(target); return }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target); from.current = target; return
    }
    const start = performance.now()
    const begin = from.current
    const duration = 900
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(begin + (target - begin) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, run])
  return value
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0)

function KpiShell({
  href, label, icon, accent, children, footer, ariaLabel,
}: {
  href: string
  label: string
  icon: ReactNode
  accent: string
  children: ReactNode
  footer: ReactNode
  ariaLabel: string
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex min-h-[188px] flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
      style={{ ["--kpi" as string]: accent }}
    >
      {/* accent edge and soft wash in the card's colour */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-[var(--kpi)] opacity-90" />
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[var(--kpi)] opacity-[0.07] blur-2xl transition-opacity group-hover:opacity-[0.12]" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--kpi)_14%,transparent)] text-[var(--kpi)]">{icon}</span>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" aria-hidden />
      </div>
      <div className="relative mt-4 flex flex-1 items-end justify-between gap-3">{children}</div>
      <div className="relative mt-4 text-[11.5px] font-medium text-muted-foreground">{footer}</div>
    </Link>
  )
}

function BigNumber({ value, className }: { value: number; className?: string }) {
  return <span className={cn("text-[clamp(2.25rem,3.6vw,2.9rem)] font-bold leading-none tracking-tight tabular-nums text-foreground", className)}>{value.toLocaleString()}</span>
}

/** Ring showing a share, drawn with SVG strokes. */
function Ring({ value, label }: { value: number; label: string }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid h-[68px] w-[68px] shrink-0 place-items-center" role="img" aria-label={label}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="var(--kpi)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute text-[13px] font-semibold tabular-nums text-foreground">{value}%</span>
    </div>
  )
}

/** Half-circle gauge for the share of active subscribers online. */
function Gauge({ value, label }: { value: number; label: string }) {
  const r = 30
  const half = Math.PI * r
  return (
    <div className="relative h-[52px] w-[84px] shrink-0" role="img" aria-label={label}>
      <svg viewBox="0 0 72 40" className="h-full w-full">
        <path d="M6 36 A30 30 0 0 1 66 36" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-muted" />
        <path
          d="M6 36 A30 30 0 0 1 66 36" fill="none" stroke="var(--kpi)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={half} strokeDashoffset={half * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute inset-x-0 bottom-0 text-center text-[13px] font-semibold tabular-nums text-foreground">{value}%</span>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="flex min-h-[188px] flex-col rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5"><Skeleton className="h-8 w-8 rounded-lg bg-muted" /><Skeleton className="h-4 w-28 bg-muted" /></div>
      <div className="mt-auto flex items-end justify-between"><Skeleton className="h-11 w-28 bg-muted" /><Skeleton className="h-14 w-14 rounded-full bg-muted" /></div>
      <Skeleton className="mt-4 h-3 w-40 bg-muted" />
    </div>
  )
}

export function DashboardKpiCards({ data, loading }: { data: DashboardKpiData | null; loading: boolean }) {
  const ready = !loading && !!data
  const total = useCountUp(data?.totalCustomers ?? 0, ready)
  const active = useCountUp(data?.active.total ?? 0, ready)
  const expired = useCountUp(data?.expired ?? 0, ready)
  const online = useCountUp(data?.online ?? 0, ready)

  if (!ready || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading key figures">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  const pppoeShare = pct(data.active.pppoe, data.active.total)
  const pppoeActiveOfBase = pct(data.active.pppoe, data.totalCustomers)
  const expiredOfBase = pct(data.expired, data.totalCustomers)
  const onlineShare = pct(data.online, data.active.total)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1 — Customers */}
      <KpiShell
        href="/admin/users"
        label="Customers"
        icon={<Users className="h-4 w-4" />}
        accent="var(--primary)"
        ariaLabel={`${data.totalCustomers.toLocaleString()} customers, ${pppoeActiveOfBase}% on an active PPPoE plan. Open customers.`}
        footer={<>PPPoE and static accounts · <span className="text-foreground">{pppoeActiveOfBase}% active</span></>}
      >
        <BigNumber value={total} />
        <Ring value={pppoeActiveOfBase} label={`${pppoeActiveOfBase}% of customers have an active PPPoE plan`} />
      </KpiShell>

      {/* 2 — Active subscriptions */}
      <KpiShell
        href="/admin/users"
        label="Active subscriptions"
        icon={<UserCheck className="h-4 w-4" />}
        accent="var(--success, #16a34a)"
        ariaLabel={`${data.active.total.toLocaleString()} active subscriptions: ${data.active.pppoe} PPPoE and ${data.active.hotspot} hotspot.`}
        footer={
          <div className="space-y-2">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`PPPoE ${pppoeShare}%, hotspot ${100 - pppoeShare}%`}>
              <span className="h-full bg-[var(--chart-1)] transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${data.active.total ? pppoeShare : 0}%` }} />
              <span className="h-full bg-[var(--chart-2)] transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${data.active.total ? 100 - pppoeShare : 0}%` }} />
            </div>
            <div className="flex justify-between gap-2">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />PPPoE <b className="font-semibold text-foreground tabular-nums">{data.active.pppoe.toLocaleString()}</b></span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--chart-2)]" />Hotspot <b className="font-semibold text-foreground tabular-nums">{data.active.hotspot.toLocaleString()}</b></span>
            </div>
          </div>
        }
      >
        <BigNumber value={active} />
      </KpiShell>

      {/* 3 — Expired: framed as a renewal opportunity */}
      <KpiShell
        href="/admin/users?status=expired"
        label="Expired"
        icon={<RefreshCcw className="h-4 w-4" />}
        accent={data.expired > 0 ? "var(--destructive)" : "var(--success, #16a34a)"}
        ariaLabel={`${data.expired.toLocaleString()} expired customers waiting to renew. Open the expired list.`}
        footer={
          data.expired > 0
            ? <span className="inline-flex items-center gap-1 font-semibold text-[var(--kpi)]">Win them back: view the renewal list <ArrowUpRight className="h-3 w-3" aria-hidden /></span>
            : <span>Everyone is paid up. Nice work.</span>
        }
      >
        <BigNumber value={expired} className={data.expired > 0 ? "text-[var(--kpi)]" : undefined} />
        <div className="w-24 shrink-0 text-right">
          <p className="text-[11px] text-muted-foreground">of your base</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{expiredOfBase}%</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-[var(--kpi)] transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${expiredOfBase}%` }} />
          </div>
        </div>
      </KpiShell>

      {/* 4 — Online now */}
      <KpiShell
        href="/admin/users?tab=online-sessions"
        label="Online now"
        icon={<Wifi className="h-4 w-4" />}
        accent="var(--chart-2)"
        ariaLabel={`${data.online.toLocaleString()} of ${data.active.total.toLocaleString()} active subscribers online now, ${onlineShare}%. Open live sessions.`}
        footer={
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live · of {data.active.total.toLocaleString()} active subscribers
          </span>
        }
      >
        <div className="flex items-baseline gap-1.5">
          <BigNumber value={online} />
          <span className="text-lg font-medium tabular-nums text-muted-foreground">/ {data.active.total.toLocaleString()}</span>
        </div>
        <Gauge value={onlineShare} label={`${onlineShare}% of active subscribers are online`} />
      </KpiShell>
    </div>
  )
}
