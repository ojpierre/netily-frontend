"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Check, Users, Wifi, TrendingUp, Zap, Shield, Star } from "lucide-react"
import type { GeoInfo } from "@/hooks/use-geo"

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────
interface PlanEstimate {
  plan_id: number
  plan_name: string
  plan_code: string
  tagline: string
  is_metered: boolean
  is_popular: boolean
  base_fee: number
  pppoe_unit_price: number
  pppoe_min_clients: number
  hotspot_share_pct: number
  input_pppoe_clients: number
  billable_pppoe_clients: number
  pppoe_charge: number
  input_hotspot_revenue: number
  hotspot_share: number
  estimated_monthly: number
  price_yearly: number
  max_subscribers: number | null
  max_routers: number | null
  max_staff: number | null
  features: string[]
}

type CalcResult = PlanEstimate[]

// ──────────────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────────────
const API_ENDPOINT = "/api/billing-calculator"

// Plain number formatter (used for non-currency values like client counts)
function fmt(n: number) {
  return n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Currency formatter: converts KES amount → local currency, prefixes with symbol
// The API always returns amounts in KES; we convert for display only.
const KES_FALLBACK: GeoInfo = {
  countryCode: "KE",
  countryName: "Kenya",
  currency: "KES",
  currencySymbol: "KSh",
  rateFromKES: 1,
  paymentCopy: "M-Pesa",
  flag: "🇰🇪",
}

function fmtCurrency(kesAmount: number, geo: GeoInfo): string {
  const local = Math.round(kesAmount * geo.rateFromKES)
  return `${geo.currencySymbol} ${local.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ──────────────────────────────────────────────────────
// Custom range slider (styled)
// ──────────────────────────────────────────────────────
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  icon: Icon,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  formatValue: (v: number) => string
  icon: React.ElementType
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {label}
        </div>
        <span className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-lg tabular-nums">
          {formatValue(value)}
        </span>
      </div>
      <div className="relative h-2 flex items-center">
        {/* Track */}
        <div className="absolute inset-0 rounded-full bg-slate-200" />
        {/* Filled */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-600"
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────
// Plan code → visual config map
// ──────────────────────────────────────────────────────
const PLAN_STYLES: Record<
  string,
  { badge: string; badgeText: string; color: string; accent: string; icon: React.ElementType }
> = {
  metered: {
    badge: "bg-blue-50 text-blue-700 border border-blue-100",
    badgeText: "Pay As You Grow",
    color: "border-blue-200",
    accent: "text-blue-600",
    icon: Zap,
  },
  starter: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    badgeText: "Flat Monthly",
    color: "border-slate-200",
    accent: "text-emerald-600",
    icon: Star,
  },
  professional: {
    badge: "bg-violet-50 text-violet-700 border border-violet-100",
    badgeText: "Most Popular",
    color: "border-violet-300",
    accent: "text-violet-600",
    icon: TrendingUp,
  },
  enterprise: {
    badge: "bg-amber-50 text-amber-700 border border-amber-100",
    badgeText: "Enterprise",
    color: "border-amber-200",
    accent: "text-amber-600",
    icon: Shield,
  },
}

function defaultStyle(code: string) {
  return (
    PLAN_STYLES[code] ?? {
      badge: "bg-slate-100 text-slate-600 border border-slate-200",
      badgeText: code,
      color: "border-slate-200",
      accent: "text-slate-600",
      icon: Zap,
    }
  )
}

// ──────────────────────────────────────────────────────
// Single plan card
// ──────────────────────────────────────────────────────
function PlanCard({
  plan,
  onGetStarted,
  highlighted,
  geo,
}: {
  plan: PlanEstimate
  onGetStarted: () => void
  highlighted: boolean
  geo: GeoInfo
}) {
  const style = defaultStyle(plan.plan_code)
  const Icon = style.icon

  // Cost rows — amounts are in KES from API, converted to local currency for display
  const rows = [
    ...(plan.is_metered
      ? [
          { label: "Base license fee", value: `${fmtCurrency(plan.base_fee, geo)}/mo` },
          {
            label: `${fmt(plan.billable_pppoe_clients)} PPPoE clients × ${fmtCurrency(plan.pppoe_unit_price, geo)}`,
            value: fmtCurrency(plan.pppoe_charge, geo),
          },
          ...(plan.hotspot_share > 0
            ? [
                {
                  label: `${plan.hotspot_share_pct}% hotspot share on ${fmtCurrency(plan.input_hotspot_revenue, geo)}`,
                  value: fmtCurrency(plan.hotspot_share, geo),
                },
              ]
            : []),
        ]
      : [{ label: "Flat monthly fee", value: `${fmtCurrency(plan.base_fee, geo)}/mo` }]),
  ]

  return (
    <motion.div
      layout
      className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg ${
        highlighted ? "border-blue-600 shadow-blue-100 shadow-lg" : style.color
      }`}
    >
      {/* Popular badge */}
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow">
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 ${style.badge}`}>
            <Icon className="w-3 h-3" />
            {style.badgeText}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.plan_name}</h3>
          {plan.tagline && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{plan.tagline}</p>}
        </div>
      </div>

      {/* Estimated cost */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-extrabold ${style.accent}`}>
            {fmtCurrency(plan.estimated_monthly, geo)}
          </span>
          <span className="text-slate-500 text-sm font-medium">/mo</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Based on your inputs</p>
      </div>

      {/* Cost breakdown */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-5 space-y-2">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cost breakdown</p>
        {rows.map((row, i) => (
          <div key={i} className="flex items-start justify-between gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
            <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{row.value}</span>
          </div>
        ))}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Total</span>
          <span className={`font-bold ${style.accent}`}>{fmtCurrency(plan.estimated_monthly, geo)}/mo</span>
        </div>
      </div>

      {/* Features */}
      {plan.features?.length > 0 && (
        <ul className="space-y-2 mb-6 flex-1">
          {plan.features.slice(0, 5).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
              <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${style.accent}`} />
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <button
        onClick={onGetStarted}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          highlighted
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            : "border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
      >
        Start Free Trial
      </button>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────
export function BillingCalculator({
  onGetStarted,
  onContactSales,
  geo: geoProp,
}: {
  onGetStarted: () => void
  onContactSales?: () => void
  geo?: GeoInfo
}) {
  const geo = geoProp ?? KES_FALLBACK
  const [pppoeClients, setPppoeClients] = useState(30)
  const [hotspotRevenue, setHotspotRevenue] = useState(5000)
  const [plans, setPlans] = useState<CalcResult>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  useEffect(() => { setMounted(true) }, [])

  const fetchEstimates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        pppoe_clients: String(pppoeClients),
        monthly_hotspot_revenue: String(hotspotRevenue),
      })
      const res = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.detail || `Server responded with ${res.status}` )
      }
      const data = await res.json()
      setPlans(Array.isArray(data) ? data : data.results ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load estimates - please try again.")
    } finally {
      setLoading(false)
    }
  }, [pppoeClients, hotspotRevenue])

  // Debounce: re-fetch 400 ms after sliders stop
  useEffect(() => {
    const t = setTimeout(fetchEstimates, 400)
    return () => clearTimeout(t)
  }, [fetchEstimates])

  // Only show the metered plan in the calculator — non-metered plans are
  // represented by the static Enterprise card with a Contact Sales CTA.
  const sorted = [...plans]
    .filter((p) => p.is_metered)
    .sort((a, b) => a.estimated_monthly - b.estimated_monthly)

  // Highlight the (only) metered plan
  const cheapestId = sorted[0]?.plan_id

  return (
    <section
      ref={ref}
      id="calculator"
      className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 30 } : false}
          animate={mounted ? (isInView ? { opacity: 1, y: 0 } : {}) : undefined}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            Billing Calculator
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            See exactly what<br className="hidden md:block" /> you&apos;ll pay.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Drag the sliders to match your network size. Real numbers, no guesswork.
          </p>
        </motion.div>

        {/* Sliders panel */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={mounted ? (isInView ? { opacity: 1, y: 0 } : {}) : undefined}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 md:p-8 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <Slider
              label="PPPoE Clients"
              value={pppoeClients}
              min={0}
              max={500}
              step={5}
              onChange={setPppoeClients}
              formatValue={(v) => `${v} clients`}
              icon={Users}
            />
            <Slider
              label="Monthly Hotspot Revenue"
              value={hotspotRevenue}
              min={0}
              max={100000}
              step={500}
              onChange={setHotspotRevenue}
              formatValue={(v) => fmtCurrency(v, geo)}
              icon={Wifi}
            />
          </div>

          {/* Quick-select presets */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <p className="w-full text-center text-xs text-slate-400 mb-1 font-medium">Quick presets</p>
            {[
              { label: `Starter (15 PPPoE, no hotspot)`, pppoe: 15, hotspot: 0 },
              { label: `Growing (50 PPPoE, ${fmtCurrency(10000, geo)} hotspot)`, pppoe: 50, hotspot: 10000 },
              { label: `Large (150 PPPoE, ${fmtCurrency(30000, geo)} hotspot)`, pppoe: 150, hotspot: 30000 },
              { label: `Enterprise (300 PPPoE, ${fmtCurrency(80000, geo)} hotspot)`, pppoe: 300, hotspot: 80000 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => { setPppoeClients(p.pppoe); setHotspotRevenue(p.hotspot) }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                  pppoeClients === p.pppoe && hotspotRevenue === p.hotspot
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan cards */}
        {error && (
          <div className="text-center py-8 text-red-500 text-sm font-medium">{error}</div>
        )}

        {loading && plans.length === 0 && (
          <div className="grid sm:grid-cols-2 max-w-2xl mx-auto gap-5">
            {[1, 2].map((n) => (
              <div key={n} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!error && (
          <motion.div
            layout
            className="grid sm:grid-cols-2 max-w-2xl mx-auto gap-5"
          >
            {/* Metered plan — driven by calculator API */}
            {sorted.map((plan) => (
              <PlanCard
                key={plan.plan_id}
                plan={plan}
                onGetStarted={onGetStarted}
                highlighted={plan.plan_id === cheapestId}
                geo={geo}
              />
            ))}

            {/* Enterprise & Custom — static card, always visible */}
            <motion.div
              layout
              className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 border border-blue-700/50 p-6 shadow-xl flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  Enterprise &amp; Custom
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Scale Without Limits</h3>
              <p className="text-slate-400 text-sm mb-6">White-label, SLA guarantee, and pricing built around your ISP.</p>

              <div className="text-3xl font-extrabold text-white mb-1">Custom</div>
              <p className="text-sm text-slate-400 mb-6">Tailored to your subscriber count &amp; growth stage</p>

              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "Everything in Metered",
                  "Full white-label support",
                  "Dedicated account manager",
                  "99.9% uptime SLA",
                  "Custom payment integrations",
                  "Priority 24/7 support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={onContactSales ?? onGetStarted}
                className="mt-auto w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-sm text-center transition-colors"
              >
                Contact Sales →
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Footnote */}
        {sorted.length > 0 && (
          <motion.p
            initial={mounted ? { opacity: 0 } : false}
            animate={mounted ? (isInView ? { opacity: 1 } : {}) : undefined}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-slate-400 mt-8"
          >
            Estimates shown in {geo.currency}{geo.countryCode !== "KE" ? ` (converted from KES at approx. 1 KES = ${geo.rateFromKES} ${geo.currency})` : ""}. Actuals depend on active users per billing cycle. No credit card required to start.
          </motion.p>
        )}
      </div>
    </section>
  )
}


