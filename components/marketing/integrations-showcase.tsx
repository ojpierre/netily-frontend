"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Building2, Check, MessageSquareText, Router, Search, Smartphone } from "lucide-react"
import { BANKS, PAYMENT_PARTNERS, PAYMENT_ROUTES, SMS_GATEWAYS, SMS_TRIGGERS, type Brand } from "@/lib/integrations-data"
import s from "./marketing.module.css"

/** Cycles 0..count-1 while the element is on screen; stops for reduced motion or once the user takes over. */
function useAutoCycle(count: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [manual, setManual] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (manual || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ms)
    return () => window.clearInterval(id)
  }, [manual, visible, count, ms])

  return { ref, index, select: (i: number) => { setManual(true); setIndex(i) } }
}

function Logo({ brand, size = "md" }: { brand: Brand; size?: "sm" | "md" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={brand.logo} alt={`${brand.name} logo`} loading="lazy" decoding="async" className={size === "sm" ? s.logoSm : s.logoMd} />
}

export function PaymentGateways() {
  const { ref, index, select } = useAutoCycle(PAYMENT_ROUTES.length, 6500)
  const route = PAYMENT_ROUTES[index]
  const [query, setQuery] = useState("")
  const banks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? BANKS.filter((b) => b.name.toLowerCase().includes(q) || b.paybill.includes(q)) : BANKS
  }, [query])

  const steps = [
    { icon: Smartphone, title: "Subscriber pays", text: route.pay },
    { icon: null, title: route.brands.map((b) => b.name).join(" / "), text: route.market },
    { icon: Building2, title: "Money lands", text: route.lands },
    { icon: Router, title: "Back online", text: "Router reconnects automatically" },
  ]

  return <section id="payments" className={s.section} aria-labelledby="payments-title">
    <div className={s.container}>
      <div className={s.sectionHeading}>
        <p className={s.eyebrow}>Payment gateways and banks</p>
        <h2 id="payments-title">Subscribers pay the way they already do. The money lands in your account.</h2>
        <p>Internetily (Netily) connects M-Pesa, MTN MoMo, Airtel Money and 22 Kenyan banks and SACCOs to your subscribers. Payments settle to your own Till, Paybill, bank or wallet. We never take a cut of individual payments.</p>
      </div>

      <div ref={ref} className={s.routeLayout}>
        <div className={s.routeList} role="tablist" aria-label="Payment routes">
          {PAYMENT_ROUTES.map((r, i) => <button key={r.id} type="button" role="tab" aria-selected={i === index} aria-controls="payment-route-panel" className={s.routeTab} onClick={() => select(i)}>
            <span className={s.routeMarket}>{r.market}</span>
            <strong>{r.label}</strong>
            {i === index && <span className={s.routeTimer} aria-hidden="true" />}
          </button>)}
        </div>

        <div id="payment-route-panel" role="tabpanel" className={s.routePanel} aria-live="polite">
          <ol className={s.routeTrack} key={route.id}>
            {steps.map(({ icon: Icon, title, text }, i) => <li key={i} style={{ ["--step" as string]: i }}>
              <span className={s.routeNode}>{Icon ? <Icon size={22} /> : <span className={s.routeLogos}>{route.brands.map((b) => <Logo key={b.name} brand={b} size="sm" />)}</span>}</span>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>)}
            <span className={s.routePulse} aria-hidden="true" />
          </ol>
          <dl className={s.routeFacts}>
            <div><dt>What you need</dt><dd>{route.keys}</dd></div>
            <div><dt>Settlement</dt><dd>To {route.lands.charAt(0).toLowerCase() + route.lands.slice(1)}, not to us</dd></div>
          </dl>
        </div>
      </div>

      <div className={s.partnerStrip} aria-label="Payment partners">
        {PAYMENT_PARTNERS.map((p) => <div key={p.name} className={s.partner} data-soon={p.status === "soon" || undefined}>
          <Logo brand={p} size="sm" /><span><strong>{p.name}</strong><small>{p.note}</small></span>
        </div>)}
      </div>

      <div className={s.bankFinder}>
        <div className={s.bankFinderHead}>
          <h3>Is your bank supported?</h3>
          <label className={s.bankSearch}><Search size={17} aria-hidden="true" /><span className="sr-only">Search banks and SACCOs</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 22 banks and SACCOs" />
          </label>
        </div>
        <ul className={s.bankGrid}>
          {banks.map((b) => <li key={b.name}><Logo brand={b} /><span><strong>{b.name}</strong><small>{b.kind} · Paybill {b.paybill}</small></span><Check size={16} className={s.bankCheck} aria-label="Supported" /></li>)}
        </ul>
        {banks.length === 0 && <p className={s.bankEmpty}>Not listed yet. <a href="#contact">Tell us your bank</a> and we will check the settlement path.</p>}
      </div>
      <p className={`${s.small} ${s.integrationNote}`}>Logos are trademarks of their owners, shown to indicate compatibility.</p>
    </div>
  </section>
}

export function SmsGateways() {
  const { ref, index, select } = useAutoCycle(SMS_GATEWAYS.length, 2600)
  const gateway = SMS_GATEWAYS[index]
  const trigger = SMS_TRIGGERS[index % SMS_TRIGGERS.length]

  return <section id="sms" className={`${s.section} ${s.tinted}`} aria-labelledby="sms-title">
    <div ref={ref} className={`${s.container} ${s.smsLayout}`}>
      <div className={s.phone} aria-hidden="true">
        <div className={s.phoneBar}><MessageSquareText size={15} /> SkyNet Fibre</div>
        <div className={s.phoneBody}>
          <div className={s.bubble} key={index}>
            <small>{trigger.label}</small>
            <p>{trigger.text}</p>
          </div>
          <span className={s.sentVia} key={`v${index}`}>Sent via <strong>{gateway.name}</strong></span>
        </div>
      </div>

      <div>
        <div className={s.sectionHeading}>
          <p className={s.eyebrow}>SMS gateways</p>
          <h2 id="sms-title">Bring your SMS provider, or use ours.</h2>
          <p>Payment confirmations, expiry reminders, welcome messages and suspension notices go out automatically through any of these 12 gateways. No provider account? Use Internetily's built-in SMS and top up units from your wallet.</p>
        </div>
        <ul className={s.smsGrid}>
          {SMS_GATEWAYS.map((g, i) => <li key={g.name}><button type="button" className={s.smsChip} aria-pressed={i === index} onClick={() => select(i)}>
            <Logo brand={g} size="sm" /><span><strong>{g.name}</strong><small>{g.region}</small></span>
          </button></li>)}
          <li><div className={`${s.smsChip} ${s.smsBuiltIn}`}><MessageSquareText size={22} /><span><strong>Built-in SMS</strong><small>No account needed</small></span></div></li>
        </ul>
      </div>
    </div>
  </section>
}
