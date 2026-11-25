"use client"

// "Aurora Spotlight" plan picker (template 19).
// Pick a duration from the chip row (or swipe the card), see that one plan large in a
// glowing glass card, then pay with a single Connect button. Two steps on purpose:
// customers compare without accidentally opening the payment sheet.

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Database, Gauge, Users, Zap } from "lucide-react"
import type { HotspotPlan } from "./HotspotClientView"

const SPOTLIGHT_CSS = `
@keyframes cp-spot-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
@keyframes cp-spot-halo{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.9;transform:scale(1.06)}}
.cp-spot-in{animation:cp-spot-in .38s cubic-bezier(.22,1,.36,1) both}
.cp-spot-halo{animation:cp-spot-halo 6s ease-in-out infinite}
.cp-spot-chips{scrollbar-width:none}.cp-spot-chips::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.cp-spot-in,.cp-spot-halo{animation:none!important}}
`

export default function SpotlightPlans({
  plans,
  formatPrice,
  hideSpeed,
  onPay,
}: {
  plans: HotspotPlan[]
  formatPrice: (plan: HotspotPlan) => string
  hideSpeed?: boolean
  onPay: (plan: HotspotPlan) => void
}) {
  const initialIndex = useMemo(() => Math.max(0, plans.findIndex((p) => p.is_popular)), [plans])
  const [index, setIndex] = useState(initialIndex)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const chipRow = useRef<HTMLDivElement>(null)
  const swipeStart = useRef<number | null>(null)

  // Plans can change (e.g. switching to TV plans); keep the index valid.
  useEffect(() => {
    setIndex((i) => (i < plans.length ? i : initialIndex))
  }, [plans.length, initialIndex])

  // Keep the chosen chip centred by scrolling the chip row only (never the page)
  useEffect(() => {
    const row = chipRow.current
    const chip = chipRefs.current[index]
    if (!row || !chip) return
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    row.scrollTo({ left: Math.max(0, left), behavior: smooth ? "smooth" : "auto" })
  }, [index])

  if (plans.length === 0) return null
  const plan = plans[Math.min(index, plans.length - 1)]
  const price = formatPrice(plan)
  const sp = price.indexOf(" ")
  const currency = sp > 0 ? price.slice(0, sp) : ""
  const amount = sp > 0 ? price.slice(sp + 1) : price
  const go = (delta: number) => setIndex((i) => (i + delta + plans.length) % plans.length)

  const speed = plan.download_speed
    ? `${plan.download_speed} ${plan.speed_unit || "Mbps"}`
    : plan.speed_display || ""
  const data = plan.limitation_type !== "UNLIMITED" && plan.data_limit_value ? plan.data_limit_display : "Unlimited"
  const devices = plan.simultaneous_devices && plan.simultaneous_devices > 0 ? `${plan.simultaneous_devices}` : "1"

  return (
    <div className="relative">
      <style>{SPOTLIGHT_CSS}</style>

      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200/80">How long do you need?</p>

      {/* Duration chips */}
      <div ref={chipRow} className="cp-spot-chips relative -mx-1 mb-5 flex snap-x gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Choose a plan">
        {plans.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => { chipRefs.current[i] = el }}
            type="button"
            onClick={() => setIndex(i)}
            aria-pressed={i === index}
            className={`shrink-0 snap-center rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 ${
              i === index
                ? "border-teal-200 bg-teal-300 text-slate-950 shadow-[0_0_24px_rgba(94,234,212,0.45)]"
                : "border-white/15 bg-white/[0.06] text-slate-200 hover:border-white/30"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Spotlight card */}
      <div className="relative">
        <div aria-hidden="true" className="cp-spot-halo pointer-events-none absolute -inset-3 rounded-[2.25rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(45,212,191,0.35),transparent_70%),radial-gradient(60%_50%_at_50%_100%,rgba(139,92,246,0.35),transparent_70%)] blur-xl" />
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-md"
          onPointerDown={(e) => { swipeStart.current = e.clientX }}
          onPointerUp={(e) => {
            if (swipeStart.current === null) return
            const dx = e.clientX - swipeStart.current
            swipeStart.current = null
            if (Math.abs(dx) > 40 && plans.length > 1) go(dx < 0 ? 1 : -1)
          }}
          aria-live="polite"
        >
          <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-200/70 to-transparent" />

          <div key={plan.id} className="cp-spot-in">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">{plan.name}</span>
              {plan.is_popular && (
                <span className="rounded-full bg-violet-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Popular</span>
              )}
            </div>

            <p className="mt-3 bg-gradient-to-r from-teal-200 via-cyan-100 to-violet-200 bg-clip-text text-[2.6rem] font-semibold leading-none tracking-tight text-transparent">
              {plan.duration_display}
            </p>

            <p className="mt-5 flex items-baseline justify-center gap-1.5 text-white">
              {currency && <span className="text-base font-medium text-slate-300">{currency}</span>}
              <span className="text-5xl font-bold tracking-tight">{amount}</span>
            </p>

            <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/20 py-3 text-left">
              {[
                !hideSpeed && speed ? { Icon: Gauge, label: "Speed", value: speed } : { Icon: Zap, label: "Access", value: "Full" },
                { Icon: Database, label: "Data", value: data },
                { Icon: Users, label: "Devices", value: devices },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1 px-1">
                  <Icon className="h-4 w-4 text-teal-200" aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
                  <span className="max-w-full truncate text-xs font-semibold text-slate-100">{value}</span>
                </div>
              ))}
            </div>

            {plan.description && <p className="mt-4 text-xs leading-relaxed text-slate-300">{plan.description}</p>}
          </div>

          <button
            type="button"
            onClick={() => onPay(plan)}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-300 text-base font-bold text-slate-950 shadow-[0_10px_40px_-8px_rgba(94,234,212,0.7)] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <Zap className="h-5 w-5" aria-hidden="true" />
            Connect · {price}
          </button>
        </div>
      </div>

      {/* Step through plans */}
      {plans.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button type="button" onClick={() => go(-1)} aria-label="Previous plan" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-slate-200 hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {plans.length <= 8 ? (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {plans.map((p, i) => (
                <span key={p.id} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-teal-300" : "w-1.5 bg-white/25"}`} />
              ))}
            </div>
          ) : (
            <span className="text-xs tabular-nums text-slate-300" aria-hidden="true">{index + 1} / {plans.length}</span>
          )}
          <button type="button" onClick={() => go(1)} aria-label="Next plan" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-slate-200 hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
