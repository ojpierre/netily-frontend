"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, LoaderCircle, Mail, MessageCircle, Users } from "lucide-react"
import { submitLead } from "@/lib/api"
import s from "./marketing.module.css"

const LEAD_SOURCE_OPTIONS = [
  "Google Search",
  "TikTok",
  "Facebook / Instagram",
  "LinkedIn",
  "WhatsApp group",
  "YouTube",
  "Referral from another ISP",
  "Event or community meetup",
  "Existing Internetily / Netily customer",
  "Other",
]

const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/GDBSxnHgcU0Ly7cc2qEjnC"

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")
  const [referral, setReferral] = useState("")
  const [message, setMessage] = useState("")
  const [leadSource, setLeadSource] = useState("")
  const request = useRef<AbortController | null>(null)
  const successPanel = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("message")) setMessage(params.get("message")!.slice(0, 4000))
    const source = params.get("lead_source")?.trim()
    if (source && LEAD_SOURCE_OPTIONS.includes(source)) setLeadSource(source)
    let ref = params.get("ref")?.trim().toUpperCase() || ""
    try { ref ||= sessionStorage.getItem("internetily-preview-referral") || "" } catch {}
    if (/^[A-Z0-9_-]{4,64}$/.test(ref)) {
      setReferral(ref)
      setLeadSource("Affiliate referral")
    }
    if (params.get("interest") === "quote") setMessage("I would like a quote for my network.")
    if (params.get("interest") === "trial") setMessage("I would like to request a trial for my ISP.")
    return () => request.current?.abort()
  }, [])

  useEffect(() => {
    if (state === "sent") successPanel.current?.focus()
  }, [state])

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (request.current) return
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") || "").trim()
    if (!name) { setError("Please enter your name."); setState("error"); return }
    const controller = new AbortController()
    request.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    setState("sending"); setError("")
    try {
      await submitLead({
        name,
        email: String(data.get("email")).trim(),
        phone: String(data.get("phone") || "").trim(),
        company: String(data.get("company") || "").trim(),
        message: message.trim(),
        lead_source: referral ? "Affiliate referral" : leadSource,
        referral_name: referral ? "" : String(data.get("referral_name") || "").trim(),
        ...(referral ? { referral_code: referral } : {}),
      }, controller.signal)
      setState("sent")
    } catch (err) {
      setError(controller.signal.aborted ? "We could not confirm your submission. Please check your connection or contact us on WhatsApp." : err instanceof Error ? err.message : "We could not send your enquiry. Please try again.")
      setState("error")
    } finally { clearTimeout(timeout); request.current = null }
  }

  return <div className={s.contactGrid}>
    <div><p className={s.eyebrow}>Let's talk about your network</p><h2>See it work for your ISP.</h2><p>Tell us what you are running and what you would like to improve. We will help you find the right setup.</p><a className={s.contactMethod} href="https://wa.me/254100034307"><MessageCircle size={21} /><span>WhatsApp<strong>0100 034 307</strong></span></a><a className={s.contactMethod} href="mailto:sales@netily.co.ke"><Mail size={21} /><span>Email<strong>sales@netily.co.ke</strong></span></a></div>
    {state === "sent" ? <div className={s.success} role="status" tabIndex={-1} ref={successPanel}><CheckCircle2 size={40} /><h3>Your enquiry is safely with us.</h3><p>Our team will review your network details and contact you using the information you shared.</p><div className={s.successActions}><a className={s.button} href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer"><Users size={18} />Join the ISP community</a><a className={s.secondary} href="https://wa.me/254100034307" target="_blank" rel="noopener noreferrer"><MessageCircle size={18} />Chat with sales</a></div><button className={s.textButton} type="button" onClick={() => { setState("idle"); setMessage("") }}>Send another enquiry</button></div> : <form className={s.form} onSubmit={send}>
      <div className={s.formRow}><label>Full name (required)<input name="name" required autoComplete="name" maxLength={150} /></label><label>Email (required)<input name="email" type="email" required autoComplete="email" maxLength={254} /></label></div>
      <div className={s.formRow}><label>Phone / WhatsApp<input name="phone" type="tel" autoComplete="tel" placeholder="Include your country code" maxLength={20} /></label><label>ISP / company<input name="company" autoComplete="organization" maxLength={200} /></label></div>
      <div className={s.formRow}><label>Where did you hear about us? (required)<select name="lead_source" required={!referral} disabled={Boolean(referral)} value={leadSource} onChange={(event) => setLeadSource(event.target.value)}><option value="">Select a source</option>{referral && <option value="Affiliate referral">Affiliate referral</option>}{LEAD_SOURCE_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}</select></label>{!referral && <label>Who referred you?<input name="referral_name" maxLength={200} placeholder="Name or company, if applicable" /></label>}</div>
      <label>What would you like help with?<textarea name="message" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} placeholder="Tell us about your subscriber size, network, payment setup, and what you want to improve." /></label>
      {referral && <div className={s.referralNotice}><CheckCircle2 size={18} /><span><strong>Affiliate referral applied</strong>Your referral code is securely attached to this enquiry.</span></div>}
      {state === "error" && <p role="alert" className={s.error}>{error}</p>}
      <p className={s.small}>We use these details to respond to your enquiry. Read our <Link href="/privacy">privacy policy</Link>.</p>
      <button className={s.button} disabled={state === "sending"} type="submit">{state === "sending" ? <><LoaderCircle size={18} className={s.spinner} />Sending enquiry...</> : <>Book a demo <ArrowRight size={18} /></>}</button>
    </form>}
  </div>
}
