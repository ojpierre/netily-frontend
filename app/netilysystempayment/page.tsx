"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Split,
  XCircle,
} from "lucide-react"

type PaymentModel = "direct_tenant" | "netily_passthrough"
type SimulatorStatus = "idle" | "pending" | "completed" | "failed" | "cancelled" | "expired"

type SimulationState = {
  success?: boolean
  status?: SimulatorStatus | "orphaned_callback"
  model?: PaymentModel
  phone_number?: string
  amount?: string
  fee_rate?: string
  fee_amount?: string
  tenant_payout_amount?: string
  destination_shortcode?: string
  destination_label?: string
  account_reference?: string
  checkout_request_id?: string
  merchant_request_id?: string
  customer_message?: string
  created_at?: string
  completed_at?: string
  last_result_desc?: string
  mpesa_receipt?: string
  safeguard?: string
  message?: string
  daraja_response?: unknown
}

const SIMULATOR_API_BASE = "/api/netily-system-payment"

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 30000

const formatKes = (value: string | number | undefined) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function statusCopy(status: SimulationState["status"]) {
  switch (status) {
    case "completed":
      return {
        title: "Payment received",
        body: "Daraja confirmed the STK payment. This simulator did not create a tenant subscription payment or unlock any account.",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
        icon: CheckCircle2,
      }
    case "failed":
      return {
        title: "Payment failed",
        body: "The STK request was not completed. You can safely retry with the same details.",
        tone: "border-red-200 bg-red-50 text-red-900",
        icon: XCircle,
      }
    case "cancelled":
      return {
        title: "Prompt cancelled",
        body: "The customer cancelled the M-Pesa prompt. Send a fresh request when ready.",
        tone: "border-amber-200 bg-amber-50 text-amber-900",
        icon: AlertCircle,
      }
    case "expired":
      return {
        title: "No callback yet",
        body: "The 30 second polling window ended. The callback can still arrive later, but no system records will be changed.",
        tone: "border-slate-200 bg-slate-50 text-slate-900",
        icon: Clock3,
      }
    default:
      return {
        title: "Awaiting M-Pesa PIN",
        body: "Ask the tester to approve the STK prompt. We will poll for 30 seconds and show the Daraja result.",
        tone: "border-blue-200 bg-blue-50 text-blue-900",
        icon: Loader2,
      }
  }
}

export default function NetilySystemPaymentPage() {
  const [model, setModel] = useState<PaymentModel>("netily_passthrough")
  const [testKey, setTestKey] = useState("")
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("10")
  const [tenantCode, setTenantCode] = useState("DEMO")
  const [feeRate, setFeeRate] = useState("2")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [state, setState] = useState<SimulationState | null>(null)
  const [error, setError] = useState("")
  const pollStartedAt = useRef<number | null>(null)

  const feePreview = useMemo(() => {
    const gross = Number(amount || 0)
    const rate = Number(feeRate || 0)
    if (!Number.isFinite(gross) || !Number.isFinite(rate)) return { fee: 0, payout: 0 }
    const fee = model === "netily_passthrough" ? Math.round((gross * rate) / 100) : 0
    return { fee, payout: Math.max(gross - fee, 0) }
  }, [amount, feeRate, model])

  const canSubmit = Boolean(testKey.trim() && phone.trim() && amount.trim())

  useEffect(() => {
    if (!isPolling || !state?.checkout_request_id) return

    const tick = async () => {
      if (!pollStartedAt.current) pollStartedAt.current = Date.now()
      const nextElapsed = Date.now() - pollStartedAt.current
      setElapsedMs(Math.min(nextElapsed, POLL_TIMEOUT_MS))

      if (nextElapsed >= POLL_TIMEOUT_MS) {
        setIsPolling(false)
        setState((current) =>
          current?.status === "pending" ? { ...current, status: "expired" } : current,
        )
        return
      }

      try {
        const response = await fetch(
          `${SIMULATOR_API_BASE}/status/${encodeURIComponent(state.checkout_request_id)}`,
          {
            headers: { "X-Netily-System-Payment-Token": testKey.trim() },
            cache: "no-store",
          },
        )
        const data = (await response.json()) as SimulationState
        if (!response.ok) throw new Error(data.message || "Could not read simulator status.")
        setState(data)
        if (["completed", "failed", "cancelled"].includes(String(data.status))) {
          setIsPolling(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not poll the payment status.")
      }
    }

    tick()
    const interval = window.setInterval(tick, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [isPolling, state?.checkout_request_id, testKey])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setState(null)
    setElapsedMs(0)
    pollStartedAt.current = null
    setIsSubmitting(true)

    try {
      const response = await fetch(`${SIMULATOR_API_BASE}/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Netily-System-Payment-Token": testKey.trim(),
        },
        body: JSON.stringify({
          model,
          phone_number: phone,
          amount,
          tenant_code: tenantCode,
          fee_rate: feeRate,
          test_key: testKey.trim(),
        }),
      })
      const data = (await response.json()) as SimulationState
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "The STK request was not accepted.")
      }
      setState(data)
      setIsPolling(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment simulation could not start.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStatus = state?.status || "idle"
  const feedback = statusCopy(currentStatus)
  const StatusIcon = feedback.icon
  const progress = isPolling ? Math.max(8, Math.round((elapsedMs / POLL_TIMEOUT_MS) * 100)) : 100

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Isolated live STK simulator
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              Netily system payment lab
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Test Netily's own Daraja paybill flow with a live STK push while keeping tenant subscriptions,
              invoices, wallets, payouts, and activation state untouched.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
            <p className="text-sm font-semibold text-slate-300">Destination</p>
            <p className="mt-2 text-2xl font-black">Netily system Equity paybill</p>
            <p className="mt-2 max-w-sm text-sm text-slate-300">
              Shortcode and Daraja credentials are read only from production environment variables.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setModel("direct_tenant")}
              className={`rounded-2xl border p-5 text-left transition ${
                model === "direct_tenant"
                  ? "border-slate-950 bg-white shadow-lg"
                  : "border-slate-200 bg-white/70 hover:border-slate-400"
              }`}
            >
              <Banknote className="h-6 w-6 text-emerald-600" />
              <h2 className="mt-4 text-lg font-black">Direct-to-tenant model</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Simulates a tenant-owned paybill setup where payment settlement belongs to the ISP.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setModel("netily_passthrough")}
              className={`rounded-2xl border p-5 text-left transition ${
                model === "netily_passthrough"
                  ? "border-slate-950 bg-white shadow-lg"
                  : "border-slate-200 bg-white/70 hover:border-slate-400"
              }`}
            >
              <Split className="h-6 w-6 text-blue-600" />
              <h2 className="mt-4 text-lg font-black">Netily passthrough model</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Simulates centralized collection with an instant passthrough calculation and no wallet balance.
              </p>
            </button>
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">Send live STK push</h2>
                <p className="mt-1 text-sm text-slate-600">Use a Safaricom test phone and approve within 30 seconds.</p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                <LockKeyhole className="h-3.5 w-3.5" />
                Token protected
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <KeyRound className="h-4 w-4" />
                  Simulator test key
                </span>
                <input
                  value={testKey}
                  onChange={(event) => setTestKey(event.target.value)}
                  type="password"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
                  placeholder="Enter the private test key"
                />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Smartphone className="h-4 w-4" />
                  Phone number
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="tel"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
                  placeholder="2547XXXXXXXX"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Amount</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="numeric"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
                  placeholder="10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Tenant reference</span>
                <input
                  value={tenantCode}
                  onChange={(event) => setTenantCode(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base uppercase outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
                  placeholder="DEMO"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Passthrough fee %</span>
                <input
                  value={feeRate}
                  onChange={(event) => setFeeRate(event.target.value)}
                  inputMode="decimal"
                  disabled={model === "direct_tenant"}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="2"
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-semibold text-slate-500">Gross</p>
                  <p className="mt-1 text-xl font-black">{formatKes(amount)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Netily fee</p>
                  <p className="mt-1 text-xl font-black">{formatKes(feePreview.fee)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Tenant payout model</p>
                  <p className="mt-1 text-xl font-black">{formatKes(feePreview.payout)}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || isPolling}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isSubmitting ? "Sending STK push" : "Send live STK push"}
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          <div className={`rounded-2xl border p-5 shadow-lg ${feedback.tone}`}>
            <div className="flex items-start gap-3">
              <StatusIcon className={`mt-1 h-6 w-6 shrink-0 ${isPolling ? "animate-spin" : ""}`} />
              <div>
                <h2 className="text-xl font-black">{feedback.title}</h2>
                <p className="mt-2 text-sm leading-6">{state?.last_result_desc || state?.customer_message || feedback.body}</p>
              </div>
            </div>
            {(isPolling || currentStatus === "expired") && (
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-current transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs font-bold">{Math.ceil((POLL_TIMEOUT_MS - elapsedMs) / 1000)}s polling window</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-xl font-black">Simulation receipt</h2>
            <div className="mt-5 space-y-3 text-sm">
              {[
                ["Checkout ID", state?.checkout_request_id || "Not started"],
                ["Receipt", state?.mpesa_receipt || "Pending"],
                ["Account reference", state?.account_reference || `NET-${tenantCode || "DEMO"}`],
                ["Destination", state?.destination_label || "Server configured"],
                ["Shortcode", state?.destination_shortcode || "Hidden until initiated"],
                ["Safeguard", state?.safeguard || "No ledger records are created by this simulator."],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-500">{label}</p>
                  <p className="mt-1 break-words font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-xl font-black">What this proves</h2>
            <div className="mt-5 space-y-4">
              {[
                "Netily can own the Daraja paybill initiation path.",
                "BYOP and passthrough can share one operator-facing payment UX.",
                "Callbacks can update a temporary state without touching live subscriptions.",
                "A future production version can swap cache-only state for audited ledger records.",
              ].map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {state?.checkout_request_id && !isPolling && !["completed", "failed", "cancelled"].includes(String(state.status)) && (
            <button
              type="button"
              onClick={() => {
                pollStartedAt.current = Date.now()
                setElapsedMs(0)
                setIsPolling(true)
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-900 transition hover:border-slate-950"
            >
              <RefreshCcw className="h-4 w-4" />
              Poll again
            </button>
          )}
        </aside>
      </section>
    </main>
  )
}
