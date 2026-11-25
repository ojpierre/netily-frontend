"use client"

// "Wi-Fi Vending" plan picker (template 22).
// A cheerful vending machine: lit marquee with the hotspot name, bundles on shelves with
// A1/B2 codes, a green LED display that echoes the choice, and a chunky VEND button.

import { useState } from "react"
import type { HotspotPlan } from "./HotspotClientView"

const VENDING_CSS = `
@keyframes cp-vend-bulb{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes cp-vend-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.cp-vend-bulb{animation:cp-vend-bulb 1.6s ease-in-out infinite}
.cp-vend-blink{animation:cp-vend-blink 1.1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){.cp-vend-bulb,.cp-vend-blink{animation:none!important}}
`

// Product colours on the shelves, cycling
const PRODUCTS = [
  "from-[#c6f432] to-[#7fbf1a] text-[#1d2a05]",
  "from-[#5fd3ff] to-[#1f8fd6] text-[#06243a]",
  "from-[#ffb347] to-[#f07b12] text-[#3a1a02]",
  "from-[#d39bff] to-[#9a4fe0] text-[#250840]",
]
const LED = "font-[ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation_Mono',monospace]"

const codeFor = (i: number) => `${String.fromCharCode(65 + Math.floor(i / 2))}${(i % 2) + 1}`

export default function VendingPlans({
  plans,
  formatPrice,
  hideSpeed,
  displayName,
  logoUrl,
  onPay,
}: {
  plans: HotspotPlan[]
  formatPrice: (plan: HotspotPlan) => string
  hideSpeed?: boolean
  displayName: string
  logoUrl?: string | null
  onPay: (plan: HotspotPlan) => void
}) {
  const [index, setIndex] = useState<number | null>(null)
  const picked = index !== null ? plans[index] : null

  return (
    <div className="rounded-[2rem] bg-gradient-to-b from-[#e8473d] to-[#b8261f] p-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),inset_0_-4px_0_rgba(0,0,0,0.15),0_24px_50px_-16px_rgba(120,20,15,0.6)]">
      <style>{VENDING_CSS}</style>

      {/* Marquee */}
      <div className="rounded-2xl bg-[#2a0d0b] px-4 py-3 text-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
        <div className="mb-1.5 flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="cp-vend-bulb h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#fcd34d]" style={{ animationDelay: `${(i % 2) * 0.8}s` }} />
          ))}
        </div>
        {logoUrl && <img src={logoUrl} alt="" className="mx-auto mb-1.5 h-8 max-w-[120px] rounded bg-white/90 object-contain p-0.5" />}
        <p className="truncate text-lg font-black uppercase tracking-[0.14em] text-amber-200 [text-shadow:0_0_12px_rgba(252,211,77,0.55)]">{displayName}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-100/60">Wi-Fi vending</p>
      </div>

      {/* Glass window with shelves */}
      <div className="relative mt-3 overflow-hidden rounded-2xl border-4 border-[#8f1c16] bg-[#141922] p-3">
        <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-0 h-full w-24 rotate-12 bg-white/[0.07]" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {plans.map((plan, i) => {
            const sel = index === i
            const speed = !hideSpeed && plan.download_speed ? `${plan.download_speed} ${plan.speed_unit || "Mbps"}` : plan.duration_display
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-pressed={sel}
                aria-label={`${codeFor(i)}: ${plan.name}, ${formatPrice(plan)}`}
                className="group flex flex-col items-stretch focus-visible:outline-none"
              >
                <span
                  className={`relative flex aspect-[4/5] flex-col items-center justify-center rounded-xl bg-gradient-to-b px-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_6px_12px_-6px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-amber-300 ${PRODUCTS[i % PRODUCTS.length]} ${
                    sel ? "-translate-y-1 ring-[3px] ring-amber-300 ring-offset-2 ring-offset-[#141922]" : ""
                  }`}
                >
                  {plan.is_popular && (
                    <span className="absolute -right-1 -top-1 rotate-12 rounded-full bg-amber-300 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#3a0f0c] shadow">Hot</span>
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">Wi-Fi</span>
                  <span className="mt-0.5 line-clamp-2 text-xl font-black leading-tight">{plan.name}</span>
                  <span className="mt-1 text-[11px] font-semibold opacity-75">{speed}</span>
                </span>
                {/* Shelf edge with the price tag */}
                <span className="mt-1.5 flex items-center justify-between rounded-md bg-gradient-to-b from-[#c9ced6] to-[#8e959f] px-2 py-1 shadow-inner">
                  <span className={`${LED} text-[11px] font-bold text-[#141922]`}>{codeFor(i)}</span>
                  <span className={`${LED} truncate pl-1 text-[11px] font-bold text-[#141922]`}>{formatPrice(plan)}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Control panel */}
      <div className="mt-3 flex items-stretch gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl border-4 border-[#3a0f0c] bg-[#08140b] px-3 py-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]" aria-live="polite">
          {picked ? (
            <>
              <p className={`${LED} truncate text-[13px] font-bold uppercase text-[#7cff6b] [text-shadow:0_0_8px_rgba(124,255,107,0.7)]`}>
                {codeFor(index!)} · {picked.name}
              </p>
              <p className={`${LED} truncate text-xl font-bold uppercase text-[#7cff6b] [text-shadow:0_0_10px_rgba(124,255,107,0.8)]`}>{formatPrice(picked)}</p>
            </>
          ) : (
            <p className={`${LED} cp-vend-blink text-[13px] font-bold uppercase text-[#7cff6b] [text-shadow:0_0_8px_rgba(124,255,107,0.7)]`}>Select a bundle</p>
          )}
        </div>
        <button
          type="button"
          disabled={!picked}
          onClick={() => picked && onPay(picked)}
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-b-[6px] border-amber-600 bg-gradient-to-b from-amber-200 to-amber-400 text-lg font-black tracking-wider text-[#3a0f0c] shadow-[0_6px_14px_-4px_rgba(0,0,0,0.5)] transition-all active:translate-y-1 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/70"
        >
          VEND
        </button>
      </div>

      {/* Delivery slot */}
      <div className="mt-3 flex h-12 items-center justify-center rounded-xl bg-[#2a0d0b] shadow-[inset_0_4px_10px_rgba(0,0,0,0.7)]">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">{picked ? "Push VEND to get online" : "Pick · Vend · Connect"}</span>
      </div>
    </div>
  )
}
