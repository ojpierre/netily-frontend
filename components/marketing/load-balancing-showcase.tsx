"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { ArrowRight, CircleCheck, Gift, Router, TriangleAlert, Zap } from "lucide-react"
import s from "./marketing.module.css"

const UPLINKS = [
  { name: "Fibre ISP", port: "ether1", mode: "DHCP", weight: 50, color: "#0874cf" },
  { name: "Wireless ISP", port: "ether2", mode: "PPPoE", weight: 30, color: "#7c3aed" },
  { name: "Backup link", port: "ether3", mode: "Static", weight: 20, color: "#16a34a" },
]

// Scene timeline: all up → one uplink fails → traffic shifts → it recovers.
const SCENES = [null, 1, 1, null] as const
const SCENE_MS = 3200

function shares(down: number | null) {
  const live = UPLINKS.filter((_, i) => i !== down)
  const total = live.reduce((sum, u) => sum + u.weight, 0)
  return UPLINKS.map((u, i) => (i === down ? 0 : Math.round((u.weight / total) * 100)))
}

export function LoadBalancingShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const [scene, setScene] = useState(0)
  const [manualDown, setManualDown] = useState<number | null | undefined>(undefined)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (manualDown !== undefined || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setScene((n) => (n + 1) % SCENES.length), SCENE_MS)
    return () => window.clearInterval(id)
  }, [manualDown, visible])

  const down = manualDown !== undefined ? manualDown : SCENES[scene]
  const split = shares(down)
  const failed = down === null ? null : UPLINKS[down]

  return <section id="load-balancing" className={`${s.section} ${s.tinted}`} aria-labelledby="lb-title">
    <div className={s.container}>
      <div className={s.sectionHeading}>
        <p className={s.eyebrow}>New · Load balancing and failover</p>
        <h2 id="lb-title">Combine your internet links. If one goes down, subscribers stay online.</h2>
        <p>Internetily (Netily) now sets up MikroTik multi-WAN load balancing with automatic failover for you. It is <strong>free on every plan</strong> and ready in your dashboard today: open a router, choose Load Balancing, and paste one command.</p>
      </div>

      <div className={s.lbLayout} ref={ref}>
        <div className={s.lbStage} data-down={down ?? "none"}>
          <ol className={s.lbUplinks} aria-label="Internet uplinks">
            {UPLINKS.map((u, i) => {
              const isDown = down === i
              return <li key={u.name} data-down={isDown || undefined} style={{ "--lb": u.color } as CSSProperties}>
                <button type="button" aria-pressed={isDown} onClick={() => setManualDown(isDown ? null : i)} title={isDown ? `Restore ${u.name}` : `Simulate an outage on ${u.name}`}>
                  <span className={s.lbDot} aria-hidden />
                  <span><strong>{u.name}</strong><small>{u.port} · {u.mode}</small></span>
                  <span className={s.lbShare}>{isDown ? "Down" : `${split[i]}%`}</span>
                </button>
                <span className={s.lbWire} aria-hidden><span /></span>
              </li>
            })}
          </ol>

          <div className={s.lbRouter}>
            <span className={s.lbRouterIcon}><Router size={26} /></span>
            <strong>MikroTik router</strong>
            <small>RouterOS v7</small>
            <div className={s.lbBar} aria-hidden>{UPLINKS.map((u, i) => <span key={u.name} style={{ width: `${split[i]}%`, background: u.color }} />)}</div>
          </div>

          <p className={s.lbStatus} role="status" data-state={failed ? "failover" : "ok"}>
            {failed
              ? <><TriangleAlert size={16} /> {failed.name} stopped answering. New connections moved to the other links. Subscribers stay online.</>
              : <><CircleCheck size={16} /> All links healthy. New connections are shared by your percentages.</>}
          </p>
          <p className={s.lbHint}>Tap a link to simulate an outage.</p>
        </div>

        <div className={s.lbFacts}>
          <ul>
            <li><Gift size={20} /><span><strong>Free, already in your dashboard</strong>Included on every plan at no extra cost. Routers → open a router → Load Balancing.</span></li>
            <li><Zap size={20} /><span><strong>Failover in seconds</strong>Each link is checked every 10 seconds. When it stops answering, traffic moves to the links that are still up, and comes back when it recovers.</span></li>
            <li><Router size={20} /><span><strong>2 to 6 links, any type</strong>DHCP fibre, PPPoE or static IP, with optional VLAN. Set each link&apos;s share in 5% steps.</span></li>
            <li><CircleCheck size={20} /><span><strong>Safe for billing and hotspot</strong>Your hotspot login, DNS and the Netily management tunnel are kept out of the split, so payments and reconnection keep working.</span></li>
          </ul>
          <Link className={s.textLink} href="/features/load-balancing-failover">How load balancing and failover work <ArrowRight size={18} /></Link>
        </div>
      </div>
    </div>
  </section>
}
