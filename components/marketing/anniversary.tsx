"use client"

import { useEffect, useState, type ComponentType } from "react"
import Link from "next/link"
import { ArrowRight, PartyPopper, X } from "lucide-react"
import { ANNIVERSARY_PATH, isAnniversaryActive } from "@/lib/anniversary"
import s from "./marketing.module.css"

const DISMISS_KEY = "netily:anniversary-bar:dismissed"
const CONFETTI_KEY = "netily:anniversary-confetti:shown"
const CONFETTI_MS = 4000
const COLORS = ["#0874cf", "#56b7ff", "#16a34a", "#f5b400", "#ef4444", "#a855f7"]

function safeGet(store: () => Storage, key: string) {
  try { return store().getItem(key) } catch { return null }
}
function safeSet(store: () => Storage, key: string) {
  try { store().setItem(key, "1") } catch { /* storage blocked: harmless */ }
}

/** Thin bar above the header during the anniversary week. */
export function AnniversaryBar() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!isAnniversaryActive() || safeGet(() => localStorage, DISMISS_KEY)) setVisible(false)
  }, [])

  if (!visible || !isAnniversaryActive()) return null

  return <div className={s.anniversaryBar} role="region" aria-label="Announcement">
    <div className={s.anniversaryInner}>
      <PartyPopper size={17} aria-hidden="true" />
      <p><strong>Internetily (Netily) is one year old.</strong> <span>Thank you to every ISP building with us.</span></p>
      <Link href={ANNIVERSARY_PATH}>Read the story <ArrowRight size={14} /></Link>
      <button type="button" aria-label="Dismiss announcement" onClick={() => { safeSet(() => localStorage, DISMISS_KEY); setVisible(false) }}><X size={16} /></button>
    </div>
  </div>
}

type ConfettiProps = { width: number; height: number; numberOfPieces: number; recycle: boolean; gravity: number; colors: string[]; style?: React.CSSProperties }

/** Fires a 4-second confetti burst on the visitor's first interaction, once per browser session. */
export function AnniversaryConfetti() {
  const [Confetti, setConfetti] = useState<ComponentType<ConfettiProps> | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!isAnniversaryActive() || safeGet(() => sessionStorage, CONFETTI_KEY)) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const
    let timer = 0
    const fire = async () => {
      events.forEach((e) => window.removeEventListener(e, fire))
      safeSet(() => sessionStorage, CONFETTI_KEY)
      const mod = await import("react-confetti")
      setSize({ width: window.innerWidth, height: window.innerHeight })
      setConfetti(() => mod.default as unknown as ComponentType<ConfettiProps>)
      timer = window.setTimeout(() => setConfetti(null), CONFETTI_MS)
    }
    events.forEach((e) => window.addEventListener(e, fire, { once: true, passive: true }))
    return () => { events.forEach((e) => window.removeEventListener(e, fire)); window.clearTimeout(timer) }
  }, [])

  if (!Confetti) return null
  return <Confetti width={size.width} height={size.height} numberOfPieces={320} recycle={false} gravity={0.3} colors={COLORS}
    style={{ position: "fixed", inset: 0, zIndex: 120, pointerEvents: "none" }} />
}
