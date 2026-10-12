"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { previewHref } from "./content"
import s from "./preview.module.css"

const money = (value: number) => `KSh ${value.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`

export function PreviewCalculator() {
  const [clients, setClients] = useState("100")
  const [revenue, setRevenue] = useState("10000")
  const count = Number(clients)
  const turnover = Number(revenue)
  const valid = clients !== "" && revenue !== "" && Number.isSafeInteger(count) && count >= 0 && Number.isFinite(turnover) && turnover >= 0 && turnover <= Number.MAX_SAFE_INTEGER / 100 && count <= Number.MAX_SAFE_INTEGER / 2500
  const pppoe = count * 25
  const hotspot = Math.round(turnover * 0.03)
  const subtotal = pppoe + hotspot

  return <div className={s.calculator}>
    <div><label htmlFor="preview-clients">Billable PPPoE subscribers<input id="preview-clients" type="number" inputMode="numeric" min="0" step="1" value={clients} onChange={(event) => setClients(event.target.value)} /></label><label htmlFor="preview-revenue">Monthly hotspot revenue (KSh)<input id="preview-revenue" type="number" inputMode="decimal" min="0" step="0.01" value={revenue} onChange={(event) => setRevenue(event.target.value)} /></label><p className={s.small}>Enter your subscriber count and revenue for the month. Your invoice uses the billable usage recorded in your billing cycle.</p></div>
    <div aria-live="polite" aria-atomic="true">{valid ? <><dl><div><dt>PPPoE: {count.toLocaleString("en-KE")} x KSh 25</dt><dd>{money(pppoe)}</dd></div><div><dt>Hotspot share: 3%</dt><dd>{money(hotspot)}</dd></div><div><dt>Monthly minimum adjustment</dt><dd>{money(Math.max(0, 500 - subtotal))}</dd></div></dl><p className={s.small}>Estimated monthly bill</p><output>{money(Math.max(500, subtotal))}</output><p className={s.small}>One-time activation after trial: KSh 500, separate from monthly usage.</p></> : <p role="status">Enter a whole subscriber count and a valid revenue amount, both zero or above.</p>}<Link href={previewHref("/contact?interest=trial")} className={s.textLink}>Request a trial <ArrowRight size={18} /></Link></div>
  </div>
}
