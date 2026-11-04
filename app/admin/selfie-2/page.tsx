"use client"

import Image from "next/image"
import Link from "next/link"
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  cancelTenantActivation, finishTenantActivation, getTenantActivation, RegistrationError,
  startTenantActivation, type TenantActivationPayment,
} from "@/lib/platform-registration"

type RegistrationResult = { login_url?: string; company?: string; warnings?: string[] }
type Step = "details" | "payment" | "password" | "done"

const STEPS: { id: Step; label: string; hint: string }[] = [
  { id: "details", label: "Details", hint: "Company and admin" },
  { id: "payment", label: "Payment", hint: "M-Pesa prompt" },
  { id: "password", label: "Password", hint: "Admin sign-in" },
  { id: "done", label: "Done", hint: "Workspace ready" },
]
const STEP_ORDER = STEPS.map((item) => item.id)
const PASSWORD_RULES = ["8 or more characters", "Upper and lower case", "A number", "A symbol"]

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
          toast.success("Payment received. Set the admin password to finish.")
        }
      } catch {
        // A short network interruption should not end a confirmed payment flow.
      }
    }, 3500)
    return () => window.clearInterval(poll)
  }, [payment, step])

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
      toast.error("Fill in the required fields first.")
      return
    }
    setBusy(true)
    try {
      const next = await startTenantActivation(form)
      setPayment(next)
      sessionStorage.setItem("netily-selfie-2-payment", next.id)
      setStep("payment")
    } catch (error) {
      toast.error(`Couldn't send the prompt. ${messageFrom(error)}`)
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
      else if (current.status === "failed") toast.error(`Payment not completed. ${current.failure_reason || "Try again when the customer is ready."}`)
      else toast.info("Not paid yet. The customer still needs to enter their M-Pesa PIN.")
    } catch (error) {
      toast.error(`Couldn't check the payment. ${messageFrom(error)}`)
    } finally {
      setBusy(false)
    }
  }

  async function cancelPayment() {
    if (!payment || !window.confirm("Cancel this payment request? Tell the customer not to approve the old M-Pesa prompt.")) return
    setBusy(true)
    try {
      await cancelTenantActivation(payment.id)
      sessionStorage.removeItem("netily-selfie-2-payment")
      setPayment(null)
      setStep("details")
      toast.success("Request cancelled. Send a new prompt when the customer is ready.")
    } catch (error) {
      toast.error(`Couldn't cancel the request. ${messageFrom(error)}`)
    } finally {
      setBusy(false)
    }
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault()
    if (!passwordChecks.every(Boolean) || password !== confirm) {
      toast.error(password !== confirm ? "The passwords don't match." : "The password doesn't meet every rule yet.")
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
      toast.error(`Couldn't create the workspace. ${messageFrom(error)}`)
    } finally {
      setBusy(false)
    }
  }

  function startOver() {
    sessionStorage.removeItem("netily-selfie-2-payment")
    setForm(emptyForm)
    setPayment(null)
    setPassword("")
    setConfirm("")
    setResult(null)
    setStep("details")
  }

  if (authorized === null) {
    return <main className="grid min-h-dvh place-items-center bg-slate-50"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /><span className="sr-only">Checking access</span></main>
  }

  if (!authorized) {
    return <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 font-[var(--font-plus-jakarta-sans)] text-slate-900">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-slate-600">Tenant activation is only available to Superadmin and Support staff.</p>
        <Link href="/superadmin/login" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">Go to Superadmin sign-in</Link>
      </section>
    </main>
  }

  const stepIndex = STEP_ORDER.indexOf(step)
  const paymentFailed = payment?.status === "failed" || payment?.status === "expired"
  const amountLabel = payment ? `KSh ${Number(payment.amount).toLocaleString("en-KE")}` : null

  return <main className="min-h-dvh bg-slate-50 font-[var(--font-plus-jakarta-sans)] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/internetily-logo-320.webp" alt="Internetily" width={112} height={46} className="h-7 w-auto" priority />
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <span className="hidden text-sm text-slate-600 sm:block">New tenant activation</span>
        </div>
        <Link href="/superadmin" className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Superadmin</Link>
      </div>
    </header>

    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 lg:py-10">
      <div className="min-w-0">
        <ol className="mb-6 flex gap-2 text-sm lg:hidden" aria-label="Progress">
          {STEPS.map((item, index) => <li key={item.id} className={`flex-1 border-t-2 pt-2 ${index <= stepIndex ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-400"}`}>{item.label}</li>)}
        </ol>

        {step === "details" && <form onSubmit={beginPayment} className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h1 className="text-lg font-semibold">Tenant details</h1>
            <p className="mt-1 text-sm text-slate-600">Nothing is created until the payment is confirmed and the admin password is set.</p>
          </div>
          <div className="space-y-8 px-5 py-6 sm:px-6">
            <Section title="Company">
              <Field label="Company name" required value={form.company_name} onChange={(v) => update("company_name", v)} />
              <Field label="Company email" required type="email" value={form.company_email} onChange={(v) => update("company_email", v)} />
              <Field label="Company phone" placeholder="0700 000 000" value={form.company_phone} onChange={(v) => update("company_phone", v)} />
              <Field label="Town" value={form.company_city} onChange={(v) => update("company_city", v)} />
            </Section>
            <Section title="Principal admin" description="This person signs in first and owns the workspace.">
              <Field label="First name" required value={form.admin_first_name} onChange={(v) => update("admin_first_name", v)} />
              <Field label="Last name" required value={form.admin_last_name} onChange={(v) => update("admin_last_name", v)} />
              <Field label="Email" required type="email" value={form.admin_email} onChange={(v) => update("admin_email", v)} />
              <Field label="Phone" required placeholder="0700 000 000" value={form.admin_phone} onChange={(v) => update("admin_phone", v)} />
            </Section>
            <Section title="Activation payment" description="The M-Pesa prompt goes to this number.">
              <Field label="M-Pesa number" required placeholder="07XX XXX XXX" value={form.payment_phone} onChange={(v) => update("payment_phone", v)} />
            </Section>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">Continuing accepts the <Link className="underline underline-offset-2" href="/terms">terms</Link> and <Link className="underline underline-offset-2" href="/privacy">privacy policy</Link> for the tenant.</p>
            <button disabled={busy} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Send M-Pesa prompt</button>
          </div>
        </form>}

        {step === "payment" && payment && <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h1 className="text-lg font-semibold">{paymentFailed ? "Payment not completed" : "Waiting for payment"}</h1>
            <p className="mt-1 text-sm text-slate-600">{paymentFailed
              ? payment.failure_reason || "The prompt was declined or timed out."
              : <>Ask the customer to enter their M-Pesa PIN on <span className="font-medium text-slate-900">{payment.phone_number}</span>. This page updates on its own.</>}</p>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3">
            <Stat label="Amount" value={amountLabel || "—"} />
            <Stat label="Phone" value={payment.phone_number} />
            <Stat label="Status" value={paymentFailed ? "Not paid" : <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />Pending</span>} />
          </dl>
          <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:px-6">
            {paymentFailed ? (
              <button type="button" onClick={() => { sessionStorage.removeItem("netily-selfie-2-payment"); setPayment(null); setStep("details") }} className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">Try again</button>
            ) : <>
              <button type="button" onClick={checkPayment} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Check payment</button>
              <button type="button" onClick={cancelPayment} disabled={busy} className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel request</button>
            </>}
          </div>
          {!paymentFailed && <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:px-6">Don&apos;t send a second prompt while this one is open, or the customer may pay twice.</p>}
        </section>}

        {step === "password" && <form onSubmit={createAccount} className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" />Payment received{payment?.receipt ? ` · ${payment.receipt}` : ""}</p>
            <h1 className="mt-1 text-lg font-semibold">Set the admin password</h1>
            <p className="mt-1 text-sm text-slate-600">{form.admin_first_name ? `${form.admin_first_name} will` : "The principal admin will"} use this to sign in. Share it with them privately.</p>
          </div>
          <div className="px-5 py-6 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordField label="Password" value={password} show={showPassword} onToggle={() => setShowPassword(!showPassword)} onChange={setPassword} />
              <PasswordField label="Confirm password" value={confirm} show={showPassword} onToggle={() => setShowPassword(!showPassword)} onChange={setConfirm} />
            </div>
            <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
              {PASSWORD_RULES.map((label, index) => <li key={label} className={`flex items-center gap-2 ${passwordChecks[index] ? "text-slate-900" : "text-slate-500"}`}><span className={`grid h-4 w-4 place-items-center rounded-full ${passwordChecks[index] ? "bg-emerald-600 text-white" : "border border-slate-300"}`}>{passwordChecks[index] && <Check className="h-3 w-3" />}</span>{label}</li>)}
              {confirm && <li className={`flex items-center gap-2 ${password === confirm ? "text-slate-900" : "text-red-700"}`}><span className={`grid h-4 w-4 place-items-center rounded-full ${password === confirm ? "bg-emerald-600 text-white" : "border border-red-300"}`}>{password === confirm && <Check className="h-3 w-3" />}</span>{password === confirm ? "Passwords match" : "Passwords don't match"}</li>}
            </ul>
          </div>
          <div className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
            <button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create workspace</button>
          </div>
        </form>}

        {step === "done" && <section className="rounded-lg border border-slate-200 bg-white px-5 py-6 sm:px-6">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" />Workspace created</p>
          <h1 className="mt-1 text-lg font-semibold">{result?.company || form.company_name} can sign in now</h1>
          <p className="mt-1 text-sm text-slate-600">The payment is recorded under Superadmin → Subscription payments.</p>
          {!!result?.warnings?.length && <ul className="mt-4 space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {result?.login_url && <a href={result.login_url} className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">Open tenant sign-in</a>}
            <Link href="/superadmin/subscription-payments" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">View payment</Link>
            <button type="button" onClick={startOver} className="inline-flex h-11 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Activate another tenant</button>
          </div>
        </section>}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-6">
          <ol className="space-y-3" aria-label="Progress">
            {STEPS.map((item, index) => {
              const done = index < stepIndex
              const current = index === stepIndex
              return <li key={item.id} className="flex items-start gap-3">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${done ? "bg-slate-900 text-white" : current ? "border-2 border-slate-900 text-slate-900" : "border border-slate-300 text-slate-400"}`}>{done ? <Check className="h-3 w-3" /> : index + 1}</span>
                <div><p className={`text-sm ${current ? "font-semibold text-slate-900" : done ? "text-slate-700" : "text-slate-400"}`}>{item.label}</p><p className="text-xs text-slate-500">{item.hint}</p></div>
              </li>
            })}
          </ol>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Summary</p>
            <dl className="mt-3 space-y-3 text-sm">
              <SummaryRow label="Company" value={form.company_name || payment?.company_name} />
              <SummaryRow label="Admin" value={[form.admin_first_name, form.admin_last_name].filter(Boolean).join(" ")} sub={form.admin_email} />
              <SummaryRow label="M-Pesa number" value={payment?.phone_number || form.payment_phone} />
              {amountLabel && <SummaryRow label="Activation fee" value={amountLabel} />}
            </dl>
          </div>
        </div>
      </aside>
    </div>
  </main>
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <fieldset>
    <legend className="text-sm font-semibold text-slate-900">{title}</legend>
    {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
  </fieldset>
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <div className="bg-white px-5 py-4 sm:px-6"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</dd></div>
}

function SummaryRow({ label, value, sub }: { label: string; value?: string | null; sub?: string }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-slate-900">{value || <span className="text-slate-400">Not entered</span>}</dd>{sub && value && <dd className="break-words text-xs text-slate-500">{sub}</dd>}</div>
}

function Field({ label, value, onChange, required, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  return <label className="block text-sm text-slate-700"><span className="font-medium">{label}</span>{!required && <span className="text-slate-400"> (optional)</span>}<input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 sm:text-sm" /></label>
}

function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void }) {
  return <label className="block text-sm text-slate-700"><span className="font-medium">{label}</span><span className="relative mt-1.5 block"><input required type={show ? "text" : "password"} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 pr-11 text-base text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 sm:text-sm" /><button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"} className="absolute right-0.5 top-0.5 grid h-10 w-10 place-items-center text-slate-500 hover:text-slate-900">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
}
