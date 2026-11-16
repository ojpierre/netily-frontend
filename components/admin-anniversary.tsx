"use client"

import { useEffect, useState, type ComponentType } from "react"
import { ArrowUpRight, PartyPopper, X } from "lucide-react"
import { isAnniversaryActive } from "@/lib/anniversary"

const STORY_URL = "https://netily.co.ke/one-year"
const BAR_KEY = "netily:dash-anniversary-bar:dismissed"
const CONFETTI_MS = 4000
const COLORS = ["#0874cf", "#16a34a", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

type Who = { id?: number | string; email?: string } | null | undefined

/** Theme-aware "Netily turns one" bar shown at the top of the tenant dashboard during the anniversary week. */
export function AdminAnniversaryBar({ disabled }: { disabled?: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (disabled || !isAnniversaryActive()) return setShow(false)
    let dismissed = false
    try { dismissed = localStorage.getItem(BAR_KEY) === "1" } catch {}
    setShow(!dismissed)
  }, [disabled])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem(BAR_KEY, "1") } catch {}
  }

  return (
    <div role="status" className="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground shadow-sm sm:px-4 sm:py-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
      <PartyPopper className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 leading-snug">
        <span className="font-semibold">Netily is one year old this week.</span>{" "}
        <span className="hidden text-muted-foreground sm:inline">Thank you for building your ISP with us. </span>
        <a href={STORY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 whitespace-nowrap font-medium text-primary underline-offset-4 hover:underline">
          Read the story <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </p>
      <button type="button" onClick={dismiss} aria-label="Dismiss anniversary message" className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/** 4-second confetti burst the first time a tenant user opens the dashboard in a login session, during the anniversary week. */
export function AdminAnniversaryConfetti({ user, disabled }: { user: Who; disabled?: boolean }) {
  const [Confetti, setConfetti] = useState<ComponentType<any> | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const who = user?.id ?? user?.email

  useEffect(() => {
    if (disabled || !who || !isAnniversaryActive()) return
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const key = `netily:dash-confetti:${who}`
    try { if (sessionStorage.getItem(key)) return } catch { return }

    let cancelled = false
    const start = setTimeout(async () => {
      try {
        const mod = await import("react-confetti")
        if (cancelled) return
        try { sessionStorage.setItem(key, "1") } catch {}
        setSize({ width: window.innerWidth, height: window.innerHeight })
        setConfetti(() => mod.default)
      } catch {}
    }, 600)

    return () => { cancelled = true; clearTimeout(start) }
  }, [disabled, who])

  // Separate timer so a prop change mid-burst can never leave the confetti mounted.
  useEffect(() => {
    if (!Confetti) return
    const stop = setTimeout(() => setConfetti(null), CONFETTI_MS)
    return () => clearTimeout(stop)
  }, [Confetti])

  if (!Confetti) return null
  return (
    <Confetti
      width={size.width}
      height={size.height}
      numberOfPieces={280}
      recycle={false}
      gravity={0.3}
      colors={COLORS}
      style={{ position: "fixed", inset: 0, zIndex: 120, pointerEvents: "none" }}
    />
  )
}
