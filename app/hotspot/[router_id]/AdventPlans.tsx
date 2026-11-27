"use client"

// "Advent Calendar" plan picker (template 23).
// Every plan is a numbered door on a festive calendar board. Tap a door and it swings
// open on its hinge to show what's inside (duration, price, data); the gold button
// under the board then buys that plan. Two steps on purpose, like Aurora Spotlight:
// people can peek behind several doors without opening the payment sheet.
// The popular plan sits behind door 24 (Christmas Eve), wrapped with a ribbon and
// left slightly ajar to invite the first tap.

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Gift, Sparkles } from "lucide-react"
import type { HotspotPlan } from "./HotspotClientView"

const ADVENT_CSS = `
.cp-adv-door{perspective:700px}
.cp-adv-leaf{transform-origin:0 50%;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.9,.25,1.05)}
.cp-adv-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.cp-adv-back{transform:rotateY(180deg)}
.cp-adv-open .cp-adv-leaf{transform:rotateY(-112deg)}
.cp-adv-ajar .cp-adv-leaf{transform:rotateY(-14deg)}
.cp-adv-inside{opacity:0;transform:scale(.94);transition:opacity .35s ease .15s,transform .45s cubic-bezier(.2,.9,.25,1.05) .1s}
.cp-adv-open .cp-adv-inside{opacity:1;transform:none}
.cp-adv-spark{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:2px;background:#f6d98b;opacity:0;transform:rotate(45deg)}
.cp-adv-open .cp-adv-spark{animation:cp-adv-spark .8s cubic-bezier(.2,.8,.3,1) .12s 1 both}
@keyframes cp-adv-spark{0%{opacity:1;transform:translate(0,0) rotate(45deg) scale(.4)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) rotate(45deg) scale(1)}}
@keyframes cp-adv-peek{0%,70%,100%{transform:rotateY(-14deg)}80%{transform:rotateY(-26deg)}90%{transform:rotateY(-10deg)}}
@keyframes cp-adv-cta{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.cp-adv-cta-in{animation:cp-adv-cta .35s cubic-bezier(.22,1,.36,1) both}
@media (prefers-reduced-motion:no-preference){.cp-adv-ajar .cp-adv-leaf{animation:cp-adv-peek 4.5s ease-in-out 1.2s infinite}}
@media (prefers-reduced-motion:reduce){
.cp-adv-leaf,.cp-adv-inside{transition:none!important}
.cp-adv-open .cp-adv-leaf{transform:none;opacity:0}
.cp-adv-spark,.cp-adv-cta-in{animation:none!important}
}
`

// Door numbers in a scattered, calendar-like order. 24 is kept for the popular plan.
const DAYS = [7, 18, 3, 12, 21, 1, 15, 9, 22, 5, 14, 19, 2, 11, 23, 6, 16, 10, 20, 4, 13, 17, 8]

// Door finishes, cycled so neighbours always differ. Each one keeps text contrast >= 4.5:1.
const FACES = [
  { face: "bg-[#fbf3e4]", num: "text-[#a5162f]", label: "text-[#5c1220]", back: "bg-[#efe2c8]" },
  { face: "bg-[#14513d]", num: "text-[#f6d98b]", label: "text-[#e9f3ee]", back: "bg-[#0f3d2e]" },
  { face: "bg-gradient-to-br from-[#f6d98b] to-[#dcae4f]", num: "text-[#5c1220]", label: "text-[#4a0b16]", back: "bg-[#c99a3e]" },
  { face: "bg-[#5e0b19]", num: "text-[#fbf3e4]", label: "text-[#f6d98b]", back: "bg-[#470813]" },
]

const SPARKS = [
  ["-34px", "-30px"], ["30px", "-34px"], ["40px", "6px"], ["-40px", "10px"], ["-10px", "-44px"], ["12px", "40px"],
]

function Holly({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <path d="M32 22 C 22 8 8 10 2 16 C 8 16 10 20 8 24 C 14 22 18 26 16 31 C 22 26 28 28 32 22Z" fill="#1d6b4f" />
      <path d="M32 22 C 42 8 56 10 62 16 C 56 16 54 20 56 24 C 50 22 46 26 48 31 C 42 26 36 28 32 22Z" fill="#14513d" />
      <path d="M32 22 C 24 14 14 14 6 17" stroke="#0b3a2b" strokeWidth="1" fill="none" opacity=".6" />
      <path d="M32 22 C 40 14 50 14 58 17" stroke="#0b3a2b" strokeWidth="1" fill="none" opacity=".6" />
      <circle cx="28" cy="25" r="4.2" fill="#d11f3b" />
      <circle cx="36" cy="25" r="4.2" fill="#b3122e" />
      <circle cx="32" cy="19.5" r="4.2" fill="#e0304b" />
      <circle cx="30.6" cy="18.2" r="1.2" fill="#fff" opacity=".7" />
    </svg>
  )
}

export default function AdventPlans({
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
  const [openId, setOpenId] = useState<string | null>(null)
  const popularId = useMemo(() => plans.find((p) => p.is_popular)?.id ?? null, [plans])

  // Plans can change (e.g. switching to TV plans): close a door that no longer exists
  useEffect(() => {
    if (openId && !plans.some((p) => p.id === openId)) setOpenId(null)
  }, [plans, openId])

  const days = useMemo(() => {
    let n = 0
    return plans.map((p) => (p.id === popularId ? 24 : DAYS[n++ % DAYS.length]))
  }, [plans, popularId])

  if (plans.length === 0) return null
  const chosen = plans.find((p) => p.id === openId) || null

  return (
    <div className="relative">
      <style>{ADVENT_CSS}</style>

      {/* The calendar board */}
      <div className="relative rounded-[28px] bg-[linear-gradient(160deg,#a5162f,#7a0f21)] p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] ring-1 ring-[#f6d98b]/40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-1.5 rounded-[22px] border border-dashed border-[#f6d98b]/35" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px] opacity-30 [background-image:radial-gradient(#f6d98b_0.8px,transparent_1.2px)] [background-size:16px_16px]" />
        <Holly className="pointer-events-none absolute -left-3 -top-4 h-10 w-16 -rotate-12 drop-shadow" />
        <Holly className="pointer-events-none absolute -right-3 -top-4 h-10 w-16 rotate-12 drop-shadow" />

        <div className="relative mb-3 mt-1 text-center">
          <p className="font-[Georgia,'Times_New_Roman',serif] text-lg italic text-[#fbe7b5]">Your Wi-Fi advent calendar</p>
          <p className="text-[11px] font-medium text-[#fbe7b5]/80">Tap a door to see what&rsquo;s inside</p>
        </div>

        <div className="relative grid grid-flow-dense grid-cols-3 gap-2.5" role="group" aria-label="Choose a plan">
          {plans.map((plan, i) => {
            const open = plan.id === openId
            const popular = plan.id === popularId
            const finish = FACES[i % FACES.length]
            const price = formatPrice(plan)
            const data = plan.limitation_type !== "UNLIMITED" && plan.data_limit_value ? plan.data_limit_display : "Unlimited"
            const speed = plan.download_speed ? `${plan.download_speed} ${plan.speed_unit || "Mbps"}` : plan.speed_display || ""
            const detail = [data, !hideSpeed && speed ? speed : ""].filter(Boolean).join(" · ")
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setOpenId(open ? null : plan.id)}
                aria-pressed={open}
                aria-label={`Door ${days[i]}: ${plan.name}, ${price}${detail ? `, ${detail}` : ""}${popular ? ", most popular" : ""}`}
                className={`cp-adv-door group relative min-h-[112px] rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d98b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#7a0f21] ${
                  popular ? "col-span-2" : ""
                } ${open ? "cp-adv-open z-10" : popular && !openId ? "cp-adv-ajar" : ""}`}
              >
                {/* What's behind the door */}
                <span className="absolute inset-0 overflow-hidden rounded-xl bg-[#fffaf0] shadow-[inset_0_2px_10px_rgba(92,18,32,0.25)]">
                  <span className="cp-adv-inside flex h-full flex-col items-center justify-center gap-0.5 px-2 text-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#14513d]">{plan.duration_display || plan.name}</span>
                    <span className={`font-bold leading-tight text-[#a5162f] ${popular ? "text-2xl" : "text-lg"}`}>{price}</span>
                    {detail && <span className="line-clamp-2 text-[10px] leading-tight text-[#5c1220]/80">{detail}</span>}
                  </span>
                  {SPARKS.map(([sx, sy], k) => (
                    <span key={k} className="cp-adv-spark" style={{ "--sx": sx, "--sy": sy } as CSSProperties} />
                  ))}
                </span>

                {/* The door itself: a front face and a back face, hinged on the left */}
                <span className="cp-adv-leaf absolute inset-0 block rounded-xl">
                  <span className={`cp-adv-face flex flex-col justify-between overflow-hidden rounded-xl border border-[#f6d98b]/60 p-2.5 shadow-[0_3px_0_rgba(0,0,0,0.25)] ${finish.face}`}>
                    {popular && (
                      <>
                        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-[#d11f3b]/90" />
                        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-[#d11f3b]/90" />
                        <Gift aria-hidden="true" className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f6d98b] p-1 text-[#7a0f21] shadow" />
                      </>
                    )}
                    <span className={`relative font-[Georgia,'Times_New_Roman',serif] text-3xl font-bold leading-none ${finish.num}`}>{days[i]}</span>
                    <span className="relative flex items-end justify-between gap-1">
                      <span className={`line-clamp-2 text-[11px] font-semibold leading-tight ${finish.label}`}>{plan.name}</span>
                      {popular && (
                        <span className="shrink-0 rounded-full bg-[#f6d98b] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#5c1220]">Most loved</span>
                      )}
                    </span>
                    {/* door knob */}
                    <span aria-hidden="true" className="absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#f6d98b] shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" />
                  </span>
                  <span className={`cp-adv-face cp-adv-back rounded-xl border border-black/10 ${finish.back}`} />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Buy what's behind the open door */}
      <div className="mt-4 min-h-[56px]" aria-live="polite">
        {chosen ? (
          <button
            key={chosen.id}
            type="button"
            onClick={() => onPay(chosen)}
            className="cp-adv-cta-in flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f6d98b] to-[#e3b553] text-base font-bold text-[#4a0b16] shadow-[0_12px_32px_-10px_rgba(246,217,139,0.7)] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d3b2c]"
          >
            <Gift className="h-5 w-5" aria-hidden="true" />
            Get {chosen.name} · {formatPrice(chosen)}
          </button>
        ) : (
          <p className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-[#f6d98b]/40 text-sm text-[#fbe7b5]/90">
            <Sparkles className="h-4 w-4 text-[#f6d98b]" aria-hidden="true" />
            Open a door to choose your plan
          </p>
        )}
      </div>
    </div>
  )
}
