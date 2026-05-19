"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Check, Users, Wifi, Zap, Shield } from "lucide-react"
import type { GeoInfo } from "@/hooks/use-geo"

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

const KES_FALLBACK: GeoInfo = {
  countryCode: "KE",
  countryName: "Kenya",
  currency: "KES",
  currencySymbol: "KSh",
  rateFromKES: 1,
  paymentCopy: "M-Pesa",
  flag: "KE",
}

const METERED_PLAN = {
  plan_id: 1,
  plan_name: "Metered",
  plan_code: "metered",
  tagline: "Perfect for growing ISPs who want to keep costs lean.",
  is_metered: true,
  is_popular: true,
  base_fee: 500,
  pppoe_unit_price: 20,
  pppoe_min_clients: 0,
  hotspot_share_pct: 3,
  price_yearly: 0,
  max_subscribers: null,
  max_routers: null,
  max_staff: null,
  features: [
    "Free M-Pesa STK Push integration",
    "MikroTik auto-provisioning",
    "Unlimited routers",
  ],
} as const

function fmt(n: number) {
  return n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtCurrency(kesAmount: number, geo: GeoInfo): string {
  const local = Math.round(kesAmount * geo.rateFromKES)
  return `${geo.currencySymbol} ${local.toLocaleString("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

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
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          {label}
        </div>
        <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-sm font-bold tabular-nums text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          {formatValue(value)}
        </span>
      </div>
      <div className="relative flex h-2 items-center">
        <div className="absolute inset-0 rounded-full bg-slate-200" />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative h-2 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-600
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-600
            [&::-moz-range-thumb]:bg-white"
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  onGetStarted,
  geo,
}: {
  plan: PlanEstimate
  onGetStarted: () => void
  geo: GeoInfo
}) {
  return (
    <motion.div
      layout
      className="relative flex flex-col rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-lg shadow-blue-100 transition-shadow hover:shadow-xl dark:bg-slate-900"
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
        Most Popular
      </div>

      <div className="mb-4">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          <Zap className="h-3 w-3" />
          Pay As You Grow
        </span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.plan_name}</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{plan.tagline}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-blue-600">
            {fmtCurrency(plan.base_fee, geo)}
          </span>
          <span className="text-sm font-medium text-slate-500">/mo base</span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          + {fmtCurrency(plan.pppoe_unit_price, geo)} per PPPoE user · {plan.hotspot_share_pct}% hotspot share
        </p>
      </div>

      <div className="mb-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Live estimate
        </p>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Base platform fee
            </span>
            <span className="whitespace-nowrap font-semibold text-slate-900 dark:text-white">
              {fmtCurrency(plan.base_fee, geo)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              {fmt(plan.billable_pppoe_clients)} PPPoE users × {fmtCurrency(plan.pppoe_unit_price, geo)}
            </span>
            <span className="whitespace-nowrap font-semibold text-slate-900 dark:text-white">
              {fmtCurrency(plan.pppoe_charge, geo)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              {plan.hotspot_share_pct}% of {fmtCurrency(plan.input_hotspot_revenue, geo)} hotspot revenue
            </span>
            <span className="whitespace-nowrap font-semibold text-slate-900 dark:text-white">
              {fmtCurrency(plan.hotspot_share, geo)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Estimated total</span>
            <span className="font-bold text-blue-600">{fmtCurrency(plan.estimated_monthly, geo)}/mo</span>
          </div>
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={onGetStarted}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
      >
        Start Free Trial
      </button>
    </motion.div>
  )
}

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
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  useEffect(() => {
    setMounted(true)
  }, [])

  const pppoeCharge = pppoeClients * METERED_PLAN.pppoe_unit_price
  const hotspotShare = Math.round(hotspotRevenue * (METERED_PLAN.hotspot_share_pct / 100))
  const meteredPlan: PlanEstimate = {
    ...METERED_PLAN,
    input_pppoe_clients: pppoeClients,
    billable_pppoe_clients: pppoeClients,
    pppoe_charge: pppoeCharge,
    input_hotspot_revenue: hotspotRevenue,
    hotspot_share: hotspotShare,
    estimated_monthly: METERED_PLAN.base_fee + pppoeCharge + hotspotShare,
  }

  return (
    <section
      ref={ref}
      id="calculator"
      className="bg-gradient-to-b from-white to-slate-50 px-4 py-20 dark:from-slate-950 dark:to-slate-900 sm:px-6 md:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={mounted ? { opacity: 0, y: 30 } : false}
          animate={mounted ? (isInView ? { opacity: 1, y: 0 } : {}) : undefined}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <Zap className="h-3.5 w-3.5" />
            Billing Calculator
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            See exactly what
            <br className="hidden md:block" /> you&apos;ll pay.
          </h2>
          <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Drag the sliders to match your network size. The metered plan updates instantly with no loading.
          </p>
        </motion.div>

        <motion.div
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={mounted ? (isInView ? { opacity: 1, y: 0 } : {}) : undefined}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-8"
        >
          <div className="grid gap-8 md:grid-cols-2">
            <Slider
              label="PPPoE Users"
              value={pppoeClients}
              min={0}
              max={500}
              step={5}
              onChange={setPppoeClients}
              formatValue={(v) => `${v} users`}
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

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <p className="mb-1 w-full text-center text-xs font-medium text-slate-400">Quick presets</p>
            {[
              { label: "Starter", pppoe: 15, hotspot: 0 },
              { label: "Growing", pppoe: 50, hotspot: 10000 },
              { label: "Large", pppoe: 150, hotspot: 30000 },
              { label: "Busy hotspot", pppoe: 30, hotspot: 60000 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setPppoeClients(preset.pppoe)
                  setHotspotRevenue(preset.hotspot)
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  pppoeClients === preset.pppoe && hotspotRevenue === preset.hotspot
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:text-blue-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div layout className="mx-auto grid max-w-2xl gap-5 sm:grid-cols-2">
          <PlanCard plan={meteredPlan} onGetStarted={onGetStarted} geo={geo} />

          <motion.div
            layout
            className="flex flex-col rounded-2xl border border-blue-700/50 bg-gradient-to-br from-slate-900 to-blue-950 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-blue-500/20 p-1.5">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                Enterprise &amp; Custom
              </span>
            </div>

            <h3 className="mb-1 text-xl font-bold text-white">Scale Without Limits</h3>
            <p className="mb-6 text-sm text-slate-400">
              White-label, SLA guarantee, and pricing built around your ISP.
            </p>

            <div className="mb-1 text-3xl font-extrabold text-white">Custom</div>
            <p className="mb-6 text-sm text-slate-400">Tailored to your subscriber count and growth stage</p>

            <ul className="mb-6 flex-1 space-y-2">
              {[
                "Everything in Metered",
                "Full white-label support",
                "Dedicated account manager",
                "99.9% uptime SLA",
                "Custom payment integrations",
                "Priority 24/7 support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="h-4 w-4 shrink-0 text-blue-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={onContactSales ?? onGetStarted}
              className="mt-auto w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Contact Sales →
            </button>
          </motion.div>
        </motion.div>

        <motion.p
          initial={mounted ? { opacity: 0 } : false}
          animate={mounted ? (isInView ? { opacity: 1 } : {}) : undefined}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-slate-400"
        >
          Estimates shown in {geo.currency}. Actual billing depends on active PPPoE users and hotspot revenue for the cycle. No API call is needed for this estimator.
        </motion.p>
      </div>
    </section>
  )
}
