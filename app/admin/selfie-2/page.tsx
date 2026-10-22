"use client"

import Image from "next/image"
import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, Eye, EyeOff,
  Loader2, MessageSquareText, MonitorSmartphone, Router, ShieldCheck, Smartphone,
} from "lucide-react"
import { toast } from "sonner"
import {
  finishTenantActivation, getTenantActivation, RegistrationError,
  startTenantActivation, type TenantActivationPayment,
} from "@/lib/platform-registration"

type RegistrationResult = { login_url?: string; company?: string; warnings?: string[] }
type Step = "details" | "payment" | "password" | "done"

const advantages = [
  { icon: Router, kicker: "Payment to access", title: "Connect billing to the network.", text: "Keep subscriber payments, PPPoE access, hotspot sessions, and renewals in one operating flow." },
  { icon: BarChart3, kicker: "Clearer decisions", title: "See where the money comes from.", text: "Follow revenue, subscriber status, and router performance without rebuilding the answer in a spreadsheet." },
  { icon: MessageSquareText, kicker: "Built-in communication", title: "Keep customers informed.", text: "Send reminders and service updates even when your ISP does not yet have separate SMS credentials." },
  { icon: MonitorSmartphone, kicker: "Customer experience", title: "Let active customers reconnect.", text: "Give paid hotspot customers a quicker path back online and support TV payments from the captive portal." },
]

const emptyForm = {
  company_name: "", company_email: "", company_phone: "", company_country: "KE",
  company_address: "", company_city: "", company_county: "", company_registration_number: "",
  company_tax_pin: "", company_website: "", admin_first_name: "", admin_last_name: "",
  admin_email: "", admin_phone: "", payment_phone: "", referral_code: "",
}

function messageFrom(error: unknown) {
  if (error instanceof RegistrationError) {
    const first = Object.values(error.errors).flat().find(Boolean)
    return typeof first === "string" ? first : error.message
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again."
}

export default function SelfieTwoPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [step, setStep] = useState<Step>("details")
  const [slide, setSlide] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [payment, setPayment] = useState<TenantActivationPayment | null>(null)
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [result, setResult] = useState<RegistrationResult | null>(null)

  useEffect(() => {
    setAuthorized(Boolean(
      localStorage.getItem("superadminToken") || sessionStorage.getItem("superadminToken") ||
      localStorage.getItem("supportToken") || sessionStorage.getItem("supportToken")
    ))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % advantages.length), 5200)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem("netily-selfie-2-payment")
    if (!saved) return
    getTenantActivation(saved).then((current) => {
      setPayment(current)
      setStep(current.can_set_password ? "password" : current.account_created ? "done" : "payment")
    }).catch(() => sessionStorage.removeItem("netily-selfie-2-payment"))
  }, [])

  useEffect(() => {
    if (step !== "payment" || !payment || !["pending", "processing"].includes(payment.status)) return
    const poll = window.setInterval(async () => {
      try {
        const current = await getTenantActivation(payment.id)
        setPayment(current)
        if (current.status === "completed") {
          setStep("password")
          toast.success("Payment confirmed. Set the principal admin password to create the workspace.")
        }
      } catch {
        // A short network interruption should not end a confirmed payment flow.
      }
    }, 3500)
    return () => window.clearInterval(poll)
  }, [payment, step])

  const currentAdvantage = advantages[slide]
  const AdvantageIcon = currentAdvantage.icon
  const passwordChecks = useMemo(() => [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ], [password])

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function beginPayment(event: FormEvent) {
    event.preventDefault()
    if (!form.company_name || !form.company_email || !form.admin_first_name || !form.admin_last_name || !form.admin_email || !form.admin_phone || !form.payment_phone) {
      toast.error("Complete the required fields before continuing.")
      return
    }
    setBusy(true)
    try {
      const next = await startTenantActivation(form)
      setPayment(next)
      sessionStorage.setItem("netily-selfie-2-payment", next.id)
      setStep("payment")
    } catch (error) {
      toast.error(`Activation could not start. ${messageFrom(error)}`)
    } finally {
      setBusy(false)
    }
  }

  async function checkPayment() {
    if (!payment) return
    setBusy(true)
    try {
      const current = await getTenantActivation(payment.id)
      setPayment(current)
      if (current.status === "completed") setStep("password")
      else if (current.status === "failed") toast.error(`Payment was not completed. ${current.failure_reason || "Start again when you are ready."}`)
      else toast.info("Still waiting for M-Pesa. Approve the prompt on the phone; this page also checks automatically.")
    } catch (error) {
      toast.error(`Could not check payment. ${messageFrom(error)}`)
    } finally {
      setBusy(false)
    }
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault()
    if (!passwordChecks.every(Boolean) || password !== confirm) {
      toast.error("Use a strong password and make sure both entries match.")
      return
    }
    if (!payment) return
    setBusy(true)
    try {
      const response = await finishTenantActivation<RegistrationResult>(payment.id, password, confirm)
      setResult(response)
      setStep("done")
      sessionStorage.removeItem("netily-selfie-2-payment")
    } catch (error) {
      toast.error(`Account setup needs another try. ${messageFrom(error)}`)
    } finally {
      setBusy(false)
    }
  }

  if (authorized === null) {
    return <main className="grid min-h-dvh place-items-center bg-[#f4f8fb]"><Loader2 className="h-7 w-7 animate-spin text-sky-700" /><span className="sr-only">Checking access</span></main>
  }

  if (!authorized) {
    return <main className="grid min-h-dvh place-items-center bg-[#f4f8fb] px-5 font-[var(--font-plus-jakarta-sans)]"><section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm"><ShieldCheck className="mx-auto h-11 w-11 text-sky-700" /><h1 className="mt-5 font-[var(--font-outfit)] text-3xl font-semibold">Operator sign-in required</h1><p className="mt-3 text-sm leading-6 text-slate-600">This activation flow is still private. Sign in to Superadmin or Support before opening it.</p><Link href="/superadmin/login" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-sky-700 px-5 font-bold text-white">Sign in to Superadmin</Link></section></main>
  }

  return <main className="min-h-dvh bg-[#f4f8fb] font-[var(--font-plus-jakarta-sans)] text-slate-950">
    <div className="grid min-h-dvh lg:grid-cols-[minmax(360px,0.9fr)_minmax(560px,1.1fr)]">
      <aside className="relative hidden min-h-dvh overflow-hidden bg-[#082f49] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#7dd3fc_1px,transparent_1px),linear-gradient(90deg,#7dd3fc_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="relative z-10"><Image src="/internetily-white-logo-320.webp" alt="Internetily" width={150} height={62} className="h-auto w-36" /></div>
        <div className="relative z-10 max-w-xl" aria-live="polite">
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-lg bg-sky-300 text-sky-950"><AdvantageIcon className="h-7 w-7" /></div>
          <p className="mb-4 text-sm font-semibold text-sky-200">{currentAdvantage.kicker}</p>
          <h1 className="max-w-lg font-[var(--font-outfit)] text-4xl font-semibold leading-tight xl:text-5xl">{currentAdvantage.title}</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-sky-100/80">{currentAdvantage.text}</p>
          <div className="mt-10 flex gap-2" aria-label="Internetily advantages">
            {advantages.map((item, index) => <button key={item.title} type="button" aria-label={`Show advantage ${index + 1}`} onClick={() => setSlide(index)} className={`h-2 min-w-8 rounded-full transition-all ${index === slide ? "w-16 bg-sky-300" : "bg-white/30"}`} />)}
          </div>
        </div>
        <p className="relative z-10 text-xs text-sky-100/60">Secure tenant activation</p>
      </aside>

      <section className="flex min-h-dvh items-start justify-center overflow-y-auto px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-3xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link href="/superadmin" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-800"><ArrowLeft className="h-4 w-4" /> Back to Superadmin</Link>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">KSh 500 activation</span>
          </div>
          <div className="mb-8 flex items-center gap-3" aria-label="Registration progress">
            {["Business", "Payment", "Password"].map((label, index) => {
              const active = ({ details: 0, payment: 1, password: 2, done: 3 } as const)[step] >= index
              return <div key={label} className="flex min-w-0 flex-1 items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? "bg-sky-700 text-white" : "bg-slate-200 text-slate-500"}`}>{active && ({ details: 0, payment: 1, password: 2, done: 3 } as const)[step] > index ? <Check className="h-4 w-4" /> : index + 1}</span><span className="hidden text-xs font-semibold text-slate-600 sm:block">{label}</span></div>
            })}
          </div>

          {step === "details" && <form onSubmit={beginPayment} className="space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div><p className="text-sm font-semibold text-sky-700">New tenant workspace</p><h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-semibold">Tell us who the account belongs to.</h2><p className="mt-3 text-sm leading-6 text-slate-600">We validate these details before sending the activation prompt. The workspace is created only after payment is confirmed and the admin password is set.</p></div>
            <fieldset className="grid gap-5 sm:grid-cols-2"><legend className="mb-4 text-sm font-bold text-slate-900">Company details</legend>
              <Field label="Company name" required value={form.company_name} onChange={(v) => update("company_name", v)} />
              <Field label="Company email" required type="email" value={form.company_email} onChange={(v) => update("company_email", v)} />
              <Field label="Company phone" placeholder="+254 700 000 000" value={form.company_phone} onChange={(v) => update("company_phone", v)} />
              <Field label="City or town" value={form.company_city} onChange={(v) => update("company_city", v)} />
            </fieldset>
            <fieldset className="grid gap-5 sm:grid-cols-2"><legend className="mb-4 text-sm font-bold text-slate-900">Principal admin</legend>
              <Field label="First name" required value={form.admin_first_name} onChange={(v) => update("admin_first_name", v)} />
              <Field label="Last name" required value={form.admin_last_name} onChange={(v) => update("admin_last_name", v)} />
              <Field label="Work email" required type="email" value={form.admin_email} onChange={(v) => update("admin_email", v)} />
              <Field label="Admin phone" required placeholder="+254 700 000 000" value={form.admin_phone} onChange={(v) => update("admin_phone", v)} />
            </fieldset>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-5"><div className="flex items-start gap-3"><Smartphone className="mt-0.5 h-5 w-5 text-sky-700" /><div className="flex-1"><p className="font-semibold">Activation payment</p><p className="mt-1 text-sm text-slate-600">A KSh 500 M-Pesa prompt will be sent to this number.</p><div className="mt-4"><Field label="M-Pesa phone" required placeholder="07XX XXX XXX" value={form.payment_phone} onChange={(v) => update("payment_phone", v)} /></div></div></div></div>
            <button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-5 font-bold text-white hover:bg-sky-800 disabled:opacity-60">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />} Review and send payment prompt</button>
            <p className="text-center text-xs leading-5 text-slate-500">By continuing, the tenant agrees to the <Link className="underline" href="/terms">terms</Link> and <Link className="underline" href="/privacy">privacy policy</Link>.</p>
          </form>}

          {step === "payment" && payment && <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><Smartphone className="h-7 w-7" /></div><h2 className="mt-6 font-[var(--font-outfit)] text-3xl font-semibold">Approve the M-Pesa prompt.</h2><p className="mt-3 text-slate-600">We sent a KSh 500 activation request to <strong>{payment.phone_number}</strong>. Enter the M-Pesa PIN on that phone. This screen updates automatically.</p>
            <div className="my-7 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5"><div><p className="text-xs font-semibold uppercase text-slate-500">Activation fee</p><p className="mt-1 text-2xl font-bold">KSh 500</p></div>{payment.status === "failed" || payment.status === "expired" ? <div className="text-right text-sm font-semibold text-red-700">Payment not completed</div> : <div className="flex items-center gap-2 text-sm font-semibold text-amber-700"><Loader2 className="h-4 w-4 animate-spin" /> Waiting for confirmation</div>}</div>
            {payment.status === "failed" || payment.status === "expired" ? <button type="button" onClick={() => { sessionStorage.removeItem("netily-selfie-2-payment"); setPayment(null); setStep("details") }} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-sky-700 px-5 font-bold text-white">Start a new payment request</button> : <button type="button" onClick={checkPayment} disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 font-bold text-slate-900 hover:border-sky-600">{busy && <Loader2 className="h-4 w-4 animate-spin" />} I have approved the payment</button>}
            <p className="mt-5 text-sm leading-6 text-slate-500">Do not send another prompt while this one is processing. If the callback is delayed, the status check also reconciles directly with the payment gateway.</p>
          </div>}

          {step === "password" && <form onSubmit={createAccount} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><ShieldCheck className="h-7 w-7" /></div><p className="mt-6 text-sm font-semibold text-emerald-700">Payment confirmed</p><h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-semibold">Secure the principal admin account.</h2><p className="mt-3 text-sm leading-6 text-slate-600">The password is submitted only now. It was not stored with the pending payment.</p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2"><PasswordField label="Password" value={password} show={showPassword} onToggle={() => setShowPassword(!showPassword)} onChange={setPassword} /><PasswordField label="Confirm password" value={confirm} show={showPassword} onToggle={() => setShowPassword(!showPassword)} onChange={setConfirm} /></div>
            <div className="mt-5 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">{["At least 8 characters", "Uppercase and lowercase", "At least one number", "At least one symbol"].map((label, index) => <span key={label} className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${passwordChecks[index] ? "text-emerald-600" : "text-slate-300"}`} />{label}</span>)}</div>
            <button disabled={busy} className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-5 font-bold text-white hover:bg-sky-800 disabled:opacity-60">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Create tenant workspace</button>
          </form>}

          {step === "done" && <div className="rounded-lg border border-emerald-200 bg-white p-7 shadow-sm sm:p-10"><CheckCircle2 className="h-14 w-14 text-emerald-600" /><p className="mt-6 text-sm font-semibold text-emerald-700">Workspace ready</p><h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-semibold">{result?.company || form.company_name} is ready to sign in.</h2><p className="mt-3 text-slate-600">The activation payment is now recorded in Superadmin subscription payments.</p><div className="mt-8 flex flex-wrap gap-3">{result?.login_url && <a href={result.login_url} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-sky-700 px-5 font-bold text-white">Open tenant login <ArrowRight className="h-4 w-4" /></a>}<Link href="/superadmin/subscription-payments" className="inline-flex min-h-12 items-center rounded-md border border-slate-300 px-5 font-bold">View payment record</Link></div></div>}
        </div>
      </section>
    </div>
  </main>
}

function Field({ label, value, onChange, required, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  return <label className="block text-sm font-semibold text-slate-700"><span>{label}{required && <span className="text-red-600"> *</span>}</span><input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label>
}

function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void }) {
  return <label className="block text-sm font-semibold text-slate-700"><span>{label}</span><span className="relative mt-2 block"><input required type={show ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-md border border-slate-300 bg-white px-3 pr-12 text-base outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /><button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1 grid h-10 w-10 place-items-center text-slate-500">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
}
