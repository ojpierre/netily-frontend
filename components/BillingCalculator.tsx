"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Gauge, Shield, TrendingUp, Users, Wifi, Zap } from "lucide-react"
import type { GeoInfo } from "@/hooks/use-geo"

interface PlanEstimate {
  plan_id: number
  plan_name: string
  plan_code: string
  tagline: string
  is_metered: boolean
  is_popular: boolean
  base_fee: number
  activation_fee: number
  minimum_charge: number
  pppoe_unit_price: number
  pppoe_min_clients: number
  hotspot_share_pct: number
  input_pppoe_clients: number
  billable_pppoe_clients: number
  pppoe_charge: number
  input_hotspot_revenue: number
  hotspot_share: number
  usage_subtotal: number
  minimum_applied: boolean
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
  base_fee: 0,
  activation_fee: 500,
  minimum_charge: 500,
  pppoe_unit_price: 25,
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

function CalculatorLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-3 border border-zinc-700 px-4 py-2">
      <span className="h-2.5 w-2.5 bg-amber-500" />
      <span className="text-sm font-medium tracking-wide text-zinc-400">{children}</span>
    </div>
  )
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
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  formatValue: (v: number) => string
  icon: React.ElementType
  hint?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  const commitValue = (nextValue: number) => {
    const safeValue = Number.isFinite(nextValue) ? nextValue : min
    onChange(Math.min(max, Math.max(min, Math.round(safeValue))))
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 text-sm font-medium text-zinc-200">
          <span className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2">
            <Icon className="h-4 w-4 text-amber-300" />
          </span>
          <span>
            <span className="block">{label}</span>
            {hint && <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">{hint}</span>}
          </span>
        </div>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => commitValue(Number(e.target.value))}
          className="h-10 w-full rounded-lg border border-amber-500/25 bg-zinc-950 px-3 text-right text-sm font-semibold tabular-nums text-amber-100 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 sm:w-40"
          aria-label={`${label} exact value`}
        />
      </div>
      <div className="relative flex h-2 items-center">
        <div className="absolute inset-0 rounded-full bg-zinc-800" />
        <div className="absolute inset-y-0 left-0 rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => commitValue(Number(e.target.value))}
          className="relative h-2 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-amber-500
            [&::-webkit-slider-thumb]:bg-zinc-950
            [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-amber-500
            [&::-moz-range-thumb]:bg-zinc-950"
        />
      </div>
      <div className="mt-3 flex justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
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
    <motion.div layout className="relative flex flex-col border border-amber-500/40 bg-zinc-950 p-6">
      <div className="absolute -top-px left-6 bg-amber-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black">
        Most popular
      </div>

      <div className="mb-5 mt-5">
        <span className="mb-3 inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
          <Zap className="h-3 w-3 text-amber-400" />
          Pay as you grow
        </span>
        <h3 className="text-2xl font-normal text-white">{plan.plan_name}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{plan.tagline}</p>
      </div>

      <div className="mb-6 border-y border-zinc-800 py-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-medium tracking-tight text-white">{fmtCurrency(plan.activation_fee, geo)}</span>
          <span className="text-sm text-zinc-500">activation</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Then {fmtCurrency(plan.pppoe_unit_price, geo)} per PPPoE footprint + {plan.hotspot_share_pct}% hotspot revenue.
        </p>
      </div>

      <div className="mb-6 border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Live estimate</p>
        <div className="space-y-2">
          {[
            ["One-time activation after trial", fmtCurrency(plan.activation_fee, geo)],
            [`${fmt(plan.billable_pppoe_clients)} PPPoE users x ${fmtCurrency(plan.pppoe_unit_price, geo)}`, fmtCurrency(plan.pppoe_charge, geo)],
            [`${plan.hotspot_share_pct}% of ${fmtCurrency(plan.input_hotspot_revenue, geo)} hotspot revenue`, fmtCurrency(plan.hotspot_share, geo)],
            ["Usage subtotal", fmtCurrency(plan.usage_subtotal, geo)],
          ].map(([label, amount]) => (
            <div key={label} className="flex items-start justify-between gap-4 text-xs">
              <span className="text-zinc-500">{label}</span>
              <span className="whitespace-nowrap font-medium text-zinc-200">{amount}</span>
            </div>
          ))}
          {plan.minimum_applied && (
            <div className="border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
              Your usage subtotal is below {fmtCurrency(plan.minimum_charge, geo)}, so the monthly estimate is rounded up to the minimum charge.
            </div>
          )}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-sm">
            <span className="font-medium text-zinc-300">Monthly estimate</span>
            <span className="font-medium text-amber-300">{fmtCurrency(plan.estimated_monthly, geo)}/mo</span>
          </div>
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-zinc-300">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            {feature}
          </li>
        ))}
      </ul>

      <button onClick={onGetStarted} className="w-full bg-white py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200">
        Start free trial
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
  const [pppoeClients, setPppoeClients] = useState(500)
  const [hotspotRevenue, setHotspotRevenue] = useState(5000)
  const pppoeCharge = pppoeClients * METERED_PLAN.pppoe_unit_price
  const hotspotShare = Math.round(hotspotRevenue * (METERED_PLAN.hotspot_share_pct / 100))
  const usageSubtotal = pppoeCharge + hotspotShare
  const estimatedMonthly = Math.max(usageSubtotal, METERED_PLAN.minimum_charge)
  const meteredPlan: PlanEstimate = {
    ...METERED_PLAN,
    features: [...METERED_PLAN.features],
    input_pppoe_clients: pppoeClients,
    billable_pppoe_clients: pppoeClients,
    pppoe_charge: pppoeCharge,
    input_hotspot_revenue: hotspotRevenue,
    hotspot_share: hotspotShare,
    usage_subtotal: usageSubtotal,
    minimum_applied: usageSubtotal < METERED_PLAN.minimum_charge,
    estimated_monthly: estimatedMonthly,
  }

  return (
    <section id="calculator" className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950 px-6 py-24 text-white md:px-12 md:py-32 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(245,158,11,0.16),transparent_28rem),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.07),transparent_24rem)]" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-12 max-w-4xl"
        >
          <CalculatorLabel>Billing Calculator</CalculatorLabel>
          <h2 className="mt-6 text-balance text-4xl font-normal tracking-tight md:text-6xl">
            Model your Internetily bill from first customers to large-scale ISP growth.
          </h2>
          <p className="mt-5 text-base leading-7 text-zinc-400">
            Drag the controls or type exact values for larger PPPoE footprints and serious hotspot revenue. The same metered pricing logic updates instantly, with estimates shown in your selected regional currency.
          </p>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-8"
        >
          <div className="mb-7 grid gap-3 sm:grid-cols-3">
            {[
              { label: "PPPoE footprint", value: fmt(pppoeClients), icon: Users },
              { label: "Hotspot turnover", value: fmtCurrency(hotspotRevenue, geo), icon: Wifi },
              { label: "Monthly estimate", value: `${fmtCurrency(estimatedMonthly, geo)}/mo`, icon: TrendingUp },
            ].map((metric) => {
              const Icon = metric.icon
              return (
                <div key={metric.label} className="rounded-xl border border-zinc-800 bg-zinc-950/75 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    <Icon className="h-3.5 w-3.5 text-amber-400" />
                    {metric.label}
                  </div>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">{metric.value}</p>
                </div>
              )
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Slider
              label="PPPoE Users"
              value={pppoeClients}
              min={0}
              max={25000}
              step={25}
              onChange={setPppoeClients}
              formatValue={(v) => `${v} users`}
              icon={Users}
              hint="Supports micro ISPs, WISPs, and operators past 5,000 active clients."
            />
            <Slider
              label="Monthly Hotspot Revenue"
              value={hotspotRevenue}
              min={0}
              max={50000000}
              step={5000}
              onChange={setHotspotRevenue}
              formatValue={(v) => fmtCurrency(v, geo)}
              icon={Wifi}
              hint="Model estates, malls, campuses, hotels, public Wi-Fi, and multi-site hotspots."
            />
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-600">
              <Gauge className="h-4 w-4 text-amber-500/80" />
              Quick presets
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Starter", pppoe: 50, hotspot: 0 },
              { label: "Growing", pppoe: 500, hotspot: 50000 },
              { label: "Regional ISP", pppoe: 2500, hotspot: 300000 },
              { label: "Large operator", pppoe: 7500, hotspot: 1500000 },
              { label: "Busy hotspot", pppoe: 1200, hotspot: 5000000 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setPppoeClients(preset.pppoe)
                  setHotspotRevenue(preset.hotspot)
                }}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition ${
                  pppoeClients === preset.pppoe && hotspotRevenue === preset.hotspot
                    ? "border-amber-500 bg-amber-500 text-black"
                    : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-amber-500/60 hover:text-amber-200"
                }`}
              >
                <span className="block text-sm">{preset.label}</span>
                <span className="mt-1 block text-[10px] font-normal text-current opacity-70">
                  {fmt(preset.pppoe)} PPPoE / {fmtCurrency(preset.hotspot, geo)}
                </span>
              </button>
            ))}
            </div>
          </div>
        </motion.div>

        <motion.div layout className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <PlanCard plan={meteredPlan} onGetStarted={onGetStarted} geo={geo} />

          <motion.div layout className="flex flex-col border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="border border-amber-500/30 bg-amber-500/10 p-2">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Enterprise and custom
              </span>
            </div>

            <h3 className="text-3xl font-normal text-white">Scale without limits</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              White-label, SLA guarantee, dedicated implementation, and pricing built around your ISP.
            </p>

            <div className="my-7 border-y border-zinc-800 py-6">
              <div className="text-4xl font-medium text-white">Custom</div>
              <p className="mt-2 text-sm text-zinc-500">Tailored to subscriber count, payment rails, support model, and growth stage.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {[
                "Everything in Metered",
                "Full white-label support",
                "Dedicated account manager",
                "99.9% uptime SLA",
                "Custom payment integrations",
                "Priority 24/7 support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="h-4 w-4 shrink-0 text-amber-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={onContactSales ?? onGetStarted}
              className="mt-auto w-full bg-amber-500 py-3 text-center text-sm font-medium text-black transition hover:bg-amber-400"
            >
              Contact sales
            </button>
          </motion.div>
        </motion.div>

        <motion.p
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 max-w-3xl text-xs leading-6 text-zinc-500"
        >
          Estimates shown in {geo.currency}. Activation is paid once after trial. Monthly usage is PPPoE footprint plus hotspot revenue share, with a {fmtCurrency(METERED_PLAN.minimum_charge, geo)} minimum if usage is lower.
        </motion.p>
      </div>
    </section>
  )
}
