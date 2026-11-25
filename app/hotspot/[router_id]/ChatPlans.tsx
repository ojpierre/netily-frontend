"use client"

// "Chat Bundles" plan picker (template 21).
// The portal reads like a chat with the ISP: a few friendly bot messages, a list of
// bundles to tap, the customer's reply bubble, a short typing pause, then a Pay button.

import { useEffect, useRef, useState } from "react"
import { CheckCheck, ChevronRight, Phone, Send, Wifi } from "lucide-react"
import type { HotspotPlan } from "./HotspotClientView"

const CHAT_CSS = `
@keyframes cp-chat-in{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
@keyframes cp-chat-dot{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-3px);opacity:1}}
.cp-chat-in{animation:cp-chat-in .28s cubic-bezier(.22,1,.36,1) both}
.cp-chat-dot{animation:cp-chat-dot 1.1s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.cp-chat-in,.cp-chat-dot{animation:none!important}}
`

const TYPING_MS = 750

function Bubble({ children, out = false, time, read }: { children: React.ReactNode; out?: boolean; time?: string; read?: boolean }) {
  return (
    <div className={`cp-chat-in flex ${out ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[85%] rounded-2xl px-3 py-2 text-[14px] leading-snug shadow-[0_1px_1px_rgba(0,0,0,0.08)] ${
          out ? "rounded-tr-md bg-[#d4f1e6] text-[#0b2b26]" : "rounded-tl-md bg-white text-[#1f2b2a]"
        }`}
      >
        {children}
        {time && (
          <span className="ml-2 inline-flex translate-y-1 items-center gap-0.5 whitespace-nowrap text-[10px] text-[#6b7f7c]">
            {time}
            {out && <CheckCheck className={`h-3.5 w-3.5 ${read ? "text-sky-500" : "text-[#8aa09c]"}`} aria-hidden="true" />}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ChatPlans({
  plans,
  formatPrice,
  hideSpeed,
  displayName,
  logoUrl,
  supportPhone,
  greeting,
  announcement,
  provider,
  onPay,
}: {
  plans: HotspotPlan[]
  formatPrice: (plan: HotspotPlan) => string
  hideSpeed?: boolean
  displayName: string
  logoUrl?: string | null
  supportPhone?: string
  greeting?: string
  announcement?: string
  provider: string
  onPay: (plan: HotspotPlan) => void
}) {
  const [picked, setPicked] = useState<HotspotPlan | null>(null)
  const [typing, setTyping] = useState(false)
  const [time, setTime] = useState("")
  const [logoFailed, setLogoFailed] = useState(false)
  const replyRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)

  // Clock only on the client so server and browser render the same HTML
  useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
  }, [])
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const choose = (plan: HotspotPlan) => {
    setPicked(plan)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setTyping(!reduce)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setTyping(false)
      replyRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" })
    }, reduce ? 0 : TYPING_MS)
  }

  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "W"

  return (
    <div className="overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-20px_rgba(11,43,38,0.45)] ring-1 ring-black/5">
      <style>{CHAT_CSS}</style>

      {/* Chat header */}
      <div className="flex items-center gap-3 bg-[#0f5e57] px-4 py-3 text-white">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-sm font-bold text-[#0f5e57]">
          {logoUrl && !logoFailed ? (
            <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" onError={() => setLogoFailed(true)} />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{displayName}</p>
          <p className="flex items-center gap-1.5 text-xs text-emerald-100/90">
            <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
            online · replies instantly
          </p>
        </div>
        {supportPhone ? (
          <a href={`tel:${supportPhone}`} aria-label={`Call ${supportPhone}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
            <Phone className="h-5 w-5" />
          </a>
        ) : (
          <Wifi className="h-5 w-5 opacity-80" aria-hidden="true" />
        )}
      </div>

      {/* Conversation */}
      <div className="space-y-2 bg-[#ece5dc] bg-[radial-gradient(rgba(15,94,87,0.07)_1px,transparent_1px)] px-3 py-4 [background-size:14px_14px]">
        <div className="flex justify-center">
          <span className="rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#55706b] shadow-sm">Today</span>
        </div>

        <Bubble time={time}>Karibu! 👋 Welcome to <strong>{displayName}</strong> Wi-Fi.</Bubble>
        <Bubble time={time}>{greeting || "Pick a bundle below and you'll be online in seconds."}</Bubble>
        {announcement && <Bubble time={time}>📣 {announcement}</Bubble>}

        {/* Bundle list, like a chat "list message" */}
        <div className="cp-chat-in max-w-[92%] overflow-hidden rounded-2xl rounded-tl-md bg-white shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
          <p className="border-b border-black/5 px-3 py-2 text-[13px] font-semibold text-[#1f2b2a]">Which bundle would you like? 👇</p>
          <ul>
            {plans.map((plan) => {
              const isPicked = picked?.id === plan.id
              const meta = [plan.duration_display, !hideSpeed && plan.download_speed ? `${plan.download_speed} ${plan.speed_unit || "Mbps"}` : null]
                .filter(Boolean)
                .join(" · ")
              return (
                <li key={plan.id} className="border-b border-black/5 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => choose(plan)}
                    aria-pressed={isPicked}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:bg-[#f2faf7] focus-visible:outline-none ${isPicked ? "bg-[#f2faf7]" : "hover:bg-[#f7faf9]"}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0f5e57]">
                        <span className="truncate">{plan.name}</span>
                        {plan.is_popular && <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">Popular</span>}
                      </span>
                      <span className="block truncate text-xs text-[#6b7f7c]">{meta}</span>
                    </span>
                    <span className="shrink-0 text-[14px] font-bold text-[#1f2b2a]">{formatPrice(plan)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#9fb3af]" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {picked && (
          <div ref={replyRef} className="space-y-2 pt-1" aria-live="polite">
            <Bubble out time={time} read={!typing}>
              {picked.name} · {formatPrice(picked)}
            </Bubble>
            {typing ? (
              <div className="cp-chat-in flex">
                <div className="flex gap-1 rounded-2xl rounded-tl-md bg-white px-3 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.08)]" aria-label="typing">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="cp-chat-dot h-1.5 w-1.5 rounded-full bg-[#6b7f7c]" style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              <Bubble time={time}>
                Sawa! 👍 <strong>{picked.name}</strong> for <strong>{formatPrice(picked)}</strong>. Tap Pay and approve the {provider} prompt on your phone.
                <button
                  type="button"
                  onClick={() => onPay(picked)}
                  className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5e57] text-[14px] font-semibold text-white transition-transform hover:bg-[#0c4d47] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f5e57] focus-visible:ring-offset-2"
                >
                  Pay {formatPrice(picked)}
                </button>
              </Bubble>
            )}
          </div>
        )}
      </div>

      {/* Composer (a hint, not a text box) */}
      <div className="flex items-center gap-2 bg-[#f4efe9] px-3 py-2.5">
        <div className="flex-1 truncate rounded-full bg-white px-4 py-2.5 text-[13px] text-[#8aa09c]">
          {picked ? "Tap Pay above to continue" : "Tap a bundle above to start"}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0f5e57] text-white" aria-hidden="true">
          <Send className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
