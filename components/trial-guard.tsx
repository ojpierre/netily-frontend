"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Check,
  ArrowRight,
  Loader2,
  LogOut,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Smartphone,
  ShieldAlert,
  RefreshCw,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { adminApi } from "@/lib/admin-api"
import { useAdminAuth } from "@/app/admin/admin-auth-context"
import { toast } from "sonner"
import type { NetilyPlan } from "@/lib/types"

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function checkDateExpired(targetDate: Date): boolean {
  if (Number.isNaN(targetDate.getTime())) return false
  return new Date() >= targetDate
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.substring(1)
  else if (!cleaned.startsWith("254")) cleaned = "254" + cleaned
  return cleaned
}

function isValidKenyanPhone(phone: string): boolean {
  return /^254[17]\d{8}$/.test(formatPhoneNumber(phone))
}

function kes(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount
  return `KES ${(n || 0).toLocaleString()}`
}

function toMoneyNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

// ==========================================
// PAYMENT DIALOG — Hotspot-style real-time
// ==========================================

type PaymentStatus = "idle" | "sending" | "waiting" | "success" | "failed" | "timeout"
type DialogStep = "checkout" | "success" | "failed" | "timeout"

const POLL_INTERVAL_MS = 3000   // 3 s between polls (same as hotspot captive portal)
const TIMEOUT_SECONDS  = 120    // 2 min before declaring timeout

interface PaymentDialogProps {
  open: boolean
  isPaidSubscription: boolean
  plans: NetilyPlan[]
  plansLoading: boolean
  amountDue?: number | null
  invoiceNumber?: string | null
  billingBreakdown?: BillingBreakdown | null
}

interface BillingBreakdown {
  pppoeCount: number
  billablePppoe: number
  pppoeUnitPrice: number
  pppoeCharge: number
  hotspotRevenue: number
  hotspotSharePct: number
  hotspotShareAmount: number
  usageSubtotal: number
  minimumCharge: number
  minimumAdjustment: number
  invoiceAdjustmentAmount: number
  invoiceDiscountAmount: number
  totalEstimate: number
  invoiceNumber?: string | null
  billingCycleStart?: string | null
  billingCycleEnd?: string | null
}

type SubscriptionPaymentStatusResponse = Awaited<ReturnType<typeof adminApi.checkSubscriptionPaymentStatus>>

function PaymentDialog({
  open,
  isPaidSubscription,
  plans,
  plansLoading,
  amountDue,
  invoiceNumber,
  billingBreakdown,
}: PaymentDialogProps) {
  const { logout } = useAdminAuth()

  // Step / flow state
  const [step, setStep] = useState<DialogStep>("checkout")
  const [selectedPlan, setSelectedPlan] = useState<NetilyPlan | null>(null)

  // Phone input
  const [phoneNumber, setPhoneNumber] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("mpesaPayPhone") || "" : ""
  )
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Countdown (for the waiting state)
  const [countdown, setCountdown] = useState(TIMEOUT_SECONDS)

  const refreshBillingCycleAfterPayment = async (res?: SubscriptionPaymentStatusResponse) => {
    adminApi.invalidateSubscriptionCache()
    await Promise.allSettled([
      adminApi.getCurrentSubscription(),
      adminApi.getUsageStats(),
      res?.billing_cycle_id ? adminApi.getInvoices({ search: String(res.billing_cycle_id) }) : Promise.resolve(null),
    ])
  }

  // ─── setInterval-based polling (same pattern as hotspot captive portal) ───
  useEffect(() => {
    if (paymentStatus !== "waiting" || !pendingPaymentId) return

    const pollInterval = setInterval(async () => {
      try {
        const res = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)

        if (res.status === "completed") {
          clearInterval(pollInterval)
          await refreshBillingCycleAfterPayment(res)
          if (res.subscription_activated === false) {
            setPaymentStatus("failed")
            setPaymentError(res.message || "Payment received, but a balance remains on this invoice.")
            setStep("failed")
            return
          }
          localStorage.setItem("mpesaPayPhone", phoneNumber)
          setPaymentStatus("success")
          setStep("success")
          // Auto-reload after a fresh subscription + billing-cycle read.
          setTimeout(() => window.location.reload(), 2500)
          return
        }

        if (res.status === "failed" || res.status === "cancelled") {
          clearInterval(pollInterval)
          setPaymentStatus("failed")
          setPaymentError(res.message || "Payment was declined or cancelled.")
          setStep("failed")
        }
      } catch {
        /* network glitch — will retry on next tick */
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(pollInterval)
  }, [paymentStatus, pendingPaymentId, phoneNumber])

  // ─── Countdown timer ───
  useEffect(() => {
    if (paymentStatus !== "waiting") return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPaymentStatus("timeout")
          setStep("timeout")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [paymentStatus])

  // ─── Helpers ───
  const getPlanAmount = (plan: NetilyPlan | null): number => {
    if (!plan) return 0
    if (plan.is_metered) return Number(plan.base_license_fee) || Number(plan.price_monthly) || 0
    return Number(plan.price_monthly) || 0
  }

  const getPaymentAmount = (plan: NetilyPlan | null): number => {
    if (isPaidSubscription && amountDue && amountDue > 0) return amountDue
    if (isPaidSubscription) return 0
    return getPlanAmount(plan)
  }

  const isEnterprisePlan = (plan: NetilyPlan | null | undefined): boolean =>
    plan?.code === "enterprise" || plan?.name?.toLowerCase().includes("enterprise") === true

  const canPay = Boolean(
    selectedPlan &&
    !isEnterprisePlan(selectedPlan) &&
    (!isPaidSubscription || getPaymentAmount(selectedPlan) > 0)
  )

  useEffect(() => {
    if (!open || plansLoading || plans.length === 0) return
    const starter = plans.find((plan) => plan.code === "starter") ||
      plans.find((plan) => plan.code !== "enterprise") ||
      plans[0]
    setSelectedPlan(starter)
  }, [open, plans, plansLoading])

  const BillingBreakdownPanel = () => {
    if (!isPaidSubscription) return null

    if (!billingBreakdown) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">We could not load the cycle breakdown yet.</p>
              <p className="mt-1 text-xs opacity-80">
                Please refresh once. If this remains, contact Netily Support so we can verify the invoice before payment.
              </p>
            </div>
          </div>
        </div>
      )
    }

    const cycleLabel = billingBreakdown.billingCycleStart && billingBreakdown.billingCycleEnd
      ? `${new Date(billingBreakdown.billingCycleStart).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })} - ${new Date(billingBreakdown.billingCycleEnd).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}`
      : "Current billing cycle"

    const rows = [
      {
        label: "PPPoE footprint",
        value: kes(billingBreakdown.pppoeCharge),
        detail: `${billingBreakdown.billablePppoe || billingBreakdown.pppoeCount} users x ${kes(billingBreakdown.pppoeUnitPrice)}`,
      },
      {
        label: "Hotspot revenue share",
        value: kes(billingBreakdown.hotspotShareAmount),
        detail: `${billingBreakdown.hotspotSharePct}% of ${kes(billingBreakdown.hotspotRevenue)} collected`,
      },
      {
        label: "Usage subtotal",
        value: kes(billingBreakdown.usageSubtotal),
        detail: "PPPoE + hotspot share before minimum rule",
      },
      {
        label: "Monthly minimum adjustment",
        value: kes(billingBreakdown.minimumAdjustment),
        detail: billingBreakdown.minimumAdjustment > 0
          ? `Tops up to the ${kes(billingBreakdown.minimumCharge)} minimum`
          : `Usage surpassed the ${kes(billingBreakdown.minimumCharge)} minimum`,
      },
    ]

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">How this bill was calculated</p>
            <p className="text-xs text-slate-500">{cycleLabel}</p>
          </div>
          <Badge variant="outline" className="w-fit max-w-full shrink-0 truncate text-[10px]">
            {invoiceNumber || billingBreakdown.invoiceNumber || "Estimate"}
          </Badge>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0 rounded-lg border border-white bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
                  <p className="mt-1 break-words text-xs text-slate-500">{row.detail}</p>
                </div>
                <p className="shrink-0 text-sm font-black text-slate-900 dark:text-white sm:text-right">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {(billingBreakdown.invoiceAdjustmentAmount > 0 || billingBreakdown.invoiceDiscountAmount > 0) && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100">
            {billingBreakdown.invoiceAdjustmentAmount > 0 && (
              <p>Custom support charge: <strong>{kes(billingBreakdown.invoiceAdjustmentAmount)}</strong></p>
            )}
            {billingBreakdown.invoiceDiscountAmount > 0 && (
              <p>Support-approved discount: <strong>-{kes(billingBreakdown.invoiceDiscountAmount)}</strong></p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-1 rounded-lg bg-slate-900 px-3 py-2 text-white dark:bg-white dark:text-slate-950 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide">Total due</span>
          <span className="text-base font-black sm:text-right">{kes(amountDue || billingBreakdown.totalEstimate)}</span>
        </div>
      </div>
    )
  }

  const getFeatures = (plan: NetilyPlan): string[] => {
    if (Array.isArray(plan.features)) return plan.features as string[]
    if (typeof plan.features === "object" && plan.features !== null) {
      const f = plan.features as any
      const list: string[] = []
      if (f.sms_notifications)   list.push("SMS Notifications")
      if (f.email_notifications) list.push("Email Notifications")
      if (f.api_access)          list.push("API Access")
      if (f.custom_branding)     list.push("Custom Branding")
      if (f.white_label)         list.push("White Label")
      if (f.priority_support)    list.push("Priority Support")
      if (f.hotspot_portal)      list.push("Hotspot Portal")
      if (f.analytics_dashboard) list.push("Analytics Dashboard")
      if (f.multi_location)      list.push("Multi-Location")
      if (list.length > 0) return list
    }
    const fb: string[] = []
    if (plan.max_subscribers != null)
      fb.push(`${plan.max_subscribers === 0 ? "Unlimited" : plan.max_subscribers} subscribers`)
    if (plan.max_routers != null)
      fb.push(`${plan.max_routers === 0 ? "Unlimited" : plan.max_routers} routers`)
    fb.push(plan.is_metered ? "Metered billing" : "Fixed pricing")
    fb.push("M-Pesa Integration")
    return fb
  }

  // ─── Actions ───
  const handleSelectPlan = (plan: NetilyPlan) => {
    if (paymentStatus !== "idle") return
    setSelectedPlan(plan)
    setPaymentError(null)
    setPhoneError(null)
  }

  const handlePay = async () => {
    if (!selectedPlan || isEnterprisePlan(selectedPlan)) return
    if (!isValidKenyanPhone(phoneNumber)) {
      setPhoneError("Enter a valid Safaricom number (e.g. 0712345678)")
      return
    }
    setPhoneError(null)
    setPaymentError(null)
    setPaymentStatus("sending")

    try {
      const res = await adminApi.initiateSubscriptionPayment({
        plan_id: selectedPlan.code,
        payment_method: "mpesa_stk",
        phone_number: formatPhoneNumber(phoneNumber),
        billing_period: "monthly",
        ...(isPaidSubscription && getPaymentAmount(selectedPlan) > 0
          ? { amount: getPaymentAmount(selectedPlan) }
          : {}),
      })
      toast.success("STK Push sent! Check your phone and enter your M-Pesa PIN.")
      setPendingPaymentId(res.payment_id)
      setCountdown(TIMEOUT_SECONDS)
      setPaymentStatus("waiting")
    } catch (err: any) {
      setPaymentError(err.message || "Failed to initiate payment. Please try again.")
      setPaymentStatus("idle")
    }
  }

  const handleRetry = () => {
    setPendingPaymentId(null)
    setPaymentError(null)
    setPhoneError(null)
    setCountdown(TIMEOUT_SECONDS)
    setPaymentStatus("idle")
    setStep("checkout")
  }

  const handleCheckAndRefresh = async () => {
    setPaymentStatus("sending")
    try {
      await refreshBillingCycleAfterPayment()
      const subscription = await adminApi.getCurrentSubscription()

      const isNowActive =
        subscription?.status === "active" &&
        subscription?.is_trial === false &&
        subscription?.current_period_end &&
        !checkDateExpired(new Date(subscription.current_period_end))

      const trialStillValid =
        (subscription?.status === "active" || subscription?.status === "trial") &&
        subscription?.is_trial === true &&
        subscription?.trial_ends_at &&
        !checkDateExpired(new Date(subscription.trial_ends_at))

      if (isNowActive || trialStillValid) {
        window.location.reload()
      } else {
        toast.info(
          "Payment not confirmed yet. If you entered your PIN, please wait a moment and try again."
        )
        setPaymentStatus("timeout")
      }
    } catch {
      // On network error, attempt reload anyway
      window.location.reload()
    }
  }

  const progressPct = Math.max(0, Math.min(100, ((TIMEOUT_SECONDS - countdown) / TIMEOUT_SECONDS) * 100))

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[92dvh] sm:w-[min(calc(100vw-2rem),48rem)] lg:w-[min(calc(100vw-4rem),56rem)]"
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 flex-col gap-3 border-b bg-background/95 px-4 pb-3 pt-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 dark:bg-red-950">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base leading-tight sm:text-lg">
                {isPaidSubscription ? "Payment Required" : "Trial Expired"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed">
                {isPaidSubscription
                  ? "Your subscription has expired. Pay to restore access."
                  : "Your free trial has ended. Subscribe to continue."}
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => logout()}
            className="h-8 w-fit shrink-0 px-2 text-slate-400 hover:text-destructive sm:self-center"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>

        {/* ── Body (scrollable) ── */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden overscroll-contain">
          <div className="px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5 lg:px-7">

            {/* ── UNIFIED PLAN + PAYMENT CHECKOUT ── */}
            {step === "checkout" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isPaidSubscription
                    ? "Review your cycle summary, confirm Starter, and pay to restore access."
                    : "Choose a plan to continue. Starter is selected for the fastest activation."}
                </p>

                <BillingBreakdownPanel />

                {plansLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500 text-sm">No plans available. Please contact support.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {plans.map((plan) => {
                      const selected = selectedPlan?.id === plan.id
                      const enterprise = isEnterprisePlan(plan)
                      const amount = getPaymentAmount(plan)
                      const features = getFeatures(plan)
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          aria-pressed={selected}
                          disabled={paymentStatus !== "idle"}
                          onClick={() => handleSelectPlan(plan)}
                          className={`relative min-w-0 w-full rounded-xl border p-4 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                              : "border-slate-200 hover:border-slate-400 dark:border-slate-700"
                          }`}
                        >
                          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-2">
                              <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary" : "border-slate-300"}`}>
                                {selected && <Check className="h-3 w-3 text-white" />}
                              </span>
                              <div className="min-w-0">
                                <span className="break-words font-semibold">{plan.name}</span>
                                {plan.code === "starter" && <p className="text-[10px] font-medium text-primary">Default</p>}
                              </div>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <span className="block text-base font-bold leading-tight">{enterprise ? "Contact us" : amount > 0 ? kes(amount) : "Verify bill"}</span>
                              {!enterprise && <span className="text-xs text-slate-500">{isPaidSubscription ? " due" : "/mo"}</span>}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {features.slice(0, 3).map((feature) => (
                              <span key={feature} className="flex items-start gap-1.5 text-xs text-slate-500">
                                <Check className="h-3 w-3 shrink-0 text-success" />
                                <span className="min-w-0 break-words">{feature}</span>
                              </span>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {selectedPlan && isEnterprisePlan(selectedPlan) && paymentStatus === "idle" && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-semibold">Enterprise is tailored to your operation</p>
                    <p className="mt-1 text-xs text-slate-500">Talk to Netily for custom limits, pricing, onboarding, and support terms.</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <a href="https://wa.me/254799538923?text=Hello%20Netily%20Support%2C%20I%20want%20to%20discuss%20the%20Enterprise%20plan." target="_blank" rel="noreferrer" className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">Contact on WhatsApp</a>
                      <a href="mailto:support@netily.co.ke?subject=Enterprise%20Plan%20Enquiry" className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">Email support</a>
                    </div>
                  </div>
                )}

                {selectedPlan && !isEnterprisePlan(selectedPlan) && paymentStatus === "idle" && (
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">Pay with M-Pesa</p>
                        <p className="text-xs text-slate-500">An STK prompt will be sent to your phone.</p>
                      </div>
                      <p className="shrink-0 text-base font-bold sm:text-right">{getPaymentAmount(selectedPlan) > 0 ? kes(getPaymentAmount(selectedPlan)) : "Needs review"}</p>
                    </div>

                    {paymentError && (
                      <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <p className="text-xs text-destructive">{paymentError}</p>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <div className="space-y-1.5">
                        <Label htmlFor="mpesa-phone" className="text-xs">Safaricom phone number</Label>
                        <Input id="mpesa-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712345678" value={phoneNumber} onChange={(event) => { setPhoneNumber(event.target.value); setPhoneError(null); setPaymentError(null) }} aria-invalid={Boolean(phoneError)} />
                        <p className={`text-[10px] ${phoneError ? "text-destructive" : "text-slate-400"}`}>{phoneError || "Use the number that should receive the STK prompt."}</p>
                      </div>
                      <Button className="h-10 w-full bg-success px-6 text-white hover:bg-green-700 sm:w-auto" onClick={handlePay} disabled={!phoneNumber.trim() || !canPay}>
                        <Phone className="mr-2 h-4 w-4" />
                        {canPay ? "Pay now" : "Bill needs review"}
                      </Button>
                    </div>
                  </div>
                )}

                {paymentStatus === "sending" && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border p-5 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Sending STK prompt…</span>
                  </div>
                )}

                {paymentStatus === "waiting" && (
                  <div className="space-y-3 rounded-xl border border-success/20 bg-success/10 p-5 text-center">
                    <Smartphone className="mx-auto h-8 w-8 animate-pulse text-success" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">Approve the payment on your phone</p>
                      <p className="text-xs text-success">Enter your M-Pesa PIN. This page checks confirmation automatically.</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-green-200 dark:bg-success/15"><div className="h-2 rounded-full bg-success transition-all duration-1000" style={{ width: `${progressPct}%` }} /></div>
                    <p className="font-mono text-sm font-bold text-success">{formatCountdown(countdown)} remaining</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/15 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Payment Confirmed!</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Your account is active. All your data is restored.
                  </p>
                  {selectedPlan && (
                    <p className="text-xs text-slate-400 mt-1">
                      Plan: <span className="font-semibold">{selectedPlan.name}</span> —{" "}
                      {kes(getPaymentAmount(selectedPlan))}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Redirecting to dashboard...
                </div>
                <Button className="bg-primary hover:bg-primary" onClick={() => window.location.reload()}>
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── STEP: TIMEOUT ── */}
            {step === "timeout" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-warning/15 dark:bg-amber-950 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Request Timed Out</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    We stopped polling but the payment may still be processing.
                    If you entered your PIN, tap <strong>Check Status</strong> — your account
                    will unlock automatically if the payment went through.
                  </p>
                </div>
                <div className="flex flex-col gap-2 max-w-xs mx-auto">
                  <Button className="bg-primary hover:bg-primary" onClick={handleCheckAndRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Status &amp; Refresh
                  </Button>
                  <Button variant="outline" onClick={handleRetry}>
                    <Phone className="w-4 h-4 mr-2" />
                    Send New STK Push
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP: FAILED ── */}
            {step === "failed" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-destructive/15 dark:bg-red-950 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Payment Failed</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {paymentError || "Could not process payment. Please try again."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 max-w-xs mx-auto">
                  <Button className="bg-success hover:bg-green-700 text-white" onClick={handleRetry}>
                    <Phone className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => setStep("checkout")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Change Plan
                  </Button>
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// MAIN GUARD COMPONENT
// ==========================================

export function TrialGuard({ children, trialDays = 14 }: { children: React.ReactNode; trialDays?: number }) {
  const [isExpired, setIsExpired] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [subscriptionType, setSubscriptionType] = useState<"trial" | "active" | null>(null)
  const [realPlans, setRealPlans] = useState<NetilyPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [cycleAmountDue, setCycleAmountDue] = useState<number | null>(null)
  const [cycleInvoiceNumber, setCycleInvoiceNumber] = useState<string | null>(null)
  const [billingBreakdown, setBillingBreakdown] = useState<BillingBreakdown | null>(null)
  const pathname = usePathname()

  const allowedPaths = [
    "/admin/login",
    "/admin/selfie",
  ]

  useEffect(() => {
    let active = true

    const checkTrial = async () => {
      if (typeof window === "undefined") return

      try {
        // Fetch plans and subscription in parallel for faster load
        const [plansData, subscription] = await Promise.all([
          adminApi.getNetilyPlans().catch(() => []),
          adminApi.getCurrentSubscription().catch(() => null),
        ])

        if (!active) return

        const plansArray = Array.isArray(plansData) ? plansData : ((plansData as any)?.results || [])
        setPlansLoading(false)

        if (!subscription || !subscription.status) {
          // Unknown subscription state should not block an active tenant.
          // Transient request failures can happen during route transitions; only
          // show the wall when the API positively reports an expired subscription.
          setIsExpired(false)
          setSubscriptionType(null)
          setCycleAmountDue(null)
          setCycleInvoiceNumber(null)
          setBillingBreakdown(null)
          setIsChecking(false)
          return
        }

        // Store trial start for countdown display
        if (subscription.trial_ends_at) {
          const trialEndDate = new Date(subscription.trial_ends_at)
          const trialStartDate = new Date(trialEndDate.getTime() - (trialDays * 24 * 60 * 60 * 1000))
          localStorage.setItem("trialStartDate", trialStartDate.toISOString())
        } else if (subscription.current_period_start) {
          localStorage.setItem("trialStartDate", subscription.current_period_start)
        }

        const checkoutPlans = plansArray
          .filter((plan: NetilyPlan) => plan.is_active !== false)
          .filter((plan: NetilyPlan) => plan.code === "starter" || plan.code === "enterprise")
          .sort((a: NetilyPlan, b: NetilyPlan) => (a.code === "starter" ? -1 : b.code === "starter" ? 1 : 0))
        setRealPlans(checkoutPlans.length ? checkoutPlans : plansArray)

        const buildBillingBreakdown = (usageData: any): BillingBreakdown | null => {
          if (!usageData) return null

          const usageSubtotal = toMoneyNumber(usageData.usage_subtotal)
          const totalEstimate = toMoneyNumber(usageData.invoice_total_estimate ?? usageData.total_estimate)
          const pppoeCount = toMoneyNumber(usageData.pppoe_count ?? usageData.current_subscribers)
          const billablePppoe = toMoneyNumber(usageData.billable_pppoe ?? usageData.pppoe_count ?? usageData.current_subscribers)
          const hotspotRevenue = toMoneyNumber(usageData.hotspot_revenue_accrued)
          const hasBillingSignal = Boolean(
            usageData.billing_cycle_id ||
            usageSubtotal > 0 ||
            pppoeCount > 0 ||
            hotspotRevenue > 0 ||
            usageData.invoice_number
          )

          if (!hasBillingSignal) return null

          return {
            pppoeCount,
            billablePppoe,
            pppoeUnitPrice: toMoneyNumber(usageData.pppoe_unit_price ?? (subscription.plan as any)?.pppoe_unit_price ?? 25),
            pppoeCharge: toMoneyNumber(usageData.pppoe_charge),
            hotspotRevenue,
            hotspotSharePct: toMoneyNumber(usageData.hotspot_revenue_share_pct ?? usageData.hotspot_share_pct ?? (subscription.plan as any)?.hotspot_revenue_share_pct ?? 3),
            hotspotShareAmount: toMoneyNumber(usageData.hotspot_revenue_share_amount ?? usageData.hotspot_share_amount),
            usageSubtotal,
            minimumCharge: toMoneyNumber(usageData.minimum_charge ?? (subscription.plan as any)?.base_license_fee ?? 500),
            minimumAdjustment: toMoneyNumber(
              usageData.minimum_adjustment ??
              Math.max(
                toMoneyNumber(usageData.minimum_charge ?? (subscription.plan as any)?.base_license_fee ?? 500) - usageSubtotal,
                0
              )
            ),
            invoiceAdjustmentAmount: toMoneyNumber(usageData.invoice_adjustment_amount),
            invoiceDiscountAmount: toMoneyNumber(usageData.invoice_discount_amount),
            totalEstimate: totalEstimate > 0
              ? totalEstimate
              : Math.max(
                usageSubtotal,
                toMoneyNumber(usageData.minimum_charge ?? (subscription.plan as any)?.base_license_fee ?? 500)
              ),
            invoiceNumber: usageData.invoice_number || null,
            billingCycleStart: usageData.billing_cycle_start || null,
            billingCycleEnd: usageData.billing_cycle_end || null,
          }
        }

        const buildBreakdownFromInvoice = (invoice: any, fallback: BillingBreakdown | null): BillingBreakdown | null => {
          if (!invoice) return fallback
          const items = Array.isArray(invoice.items) ? invoice.items : []
          const findItem = (matcher: RegExp) =>
            items.find((item: any) => matcher.test(String(item?.description || item?.service_type || "")))

          const pppoeItem = findItem(/pppoe/i)
          const hotspotItem = findItem(/hotspot/i)
          const minimumItem = findItem(/minimum/i)
          const adjustmentItem = findItem(/custom|manual|support|adjustment/i)

          const totalEstimate = toMoneyNumber(invoice.total_amount ?? invoice.amount ?? fallback?.totalEstimate)
          const pppoeCharge = toMoneyNumber(pppoeItem?.total ?? fallback?.pppoeCharge)
          const hotspotShareAmount = toMoneyNumber(hotspotItem?.total ?? fallback?.hotspotShareAmount)
          const minimumAdjustment = toMoneyNumber(minimumItem?.total ?? fallback?.minimumAdjustment)
          const usageSubtotal = pppoeCharge + hotspotShareAmount

          return {
            pppoeCount: toMoneyNumber(pppoeItem?.quantity ?? fallback?.pppoeCount),
            billablePppoe: toMoneyNumber(pppoeItem?.quantity ?? fallback?.billablePppoe),
            pppoeUnitPrice: toMoneyNumber(pppoeItem?.unit_price ?? fallback?.pppoeUnitPrice),
            pppoeCharge,
            hotspotRevenue: fallback?.hotspotRevenue ?? 0,
            hotspotSharePct: fallback?.hotspotSharePct ?? toMoneyNumber((subscription.plan as any)?.hotspot_revenue_share_pct ?? 3),
            hotspotShareAmount,
            usageSubtotal: usageSubtotal > 0 ? usageSubtotal : fallback?.usageSubtotal ?? 0,
            minimumCharge: fallback?.minimumCharge ?? toMoneyNumber((subscription.plan as any)?.base_license_fee ?? 500),
            minimumAdjustment,
            invoiceAdjustmentAmount: toMoneyNumber(adjustmentItem?.total ?? fallback?.invoiceAdjustmentAmount),
            invoiceDiscountAmount: toMoneyNumber(invoice.discount_amount ?? fallback?.invoiceDiscountAmount),
            totalEstimate,
            invoiceNumber: invoice.invoice_number || fallback?.invoiceNumber || null,
            billingCycleStart: invoice.service_period_start || invoice.period_start || fallback?.billingCycleStart || null,
            billingCycleEnd: invoice.service_period_end || invoice.period_end || fallback?.billingCycleEnd || null,
          }
        }

        const resolveCycleAmountDue = async () => {
          try {
            const [usageData, invoicesData] = await Promise.all([
              adminApi.getUsageStats().catch(() => null),
              adminApi.getInvoices({ search: "NET-BILL" }).catch(() => null),
            ])
            const breakdown = buildBillingBreakdown(usageData as any)
            setBillingBreakdown(breakdown)

            const invoices = Array.isArray((invoicesData as any)?.results)
              ? (invoicesData as any).results
              : []
            const payableInvoice = invoices.find((invoice: any) =>
              ["pending", "issued", "sent", "overdue", "partial", "draft"].includes(String(invoice?.status || "").toLowerCase())
            )

            if (payableInvoice) {
              const detailedInvoice = payableInvoice.id
                ? await adminApi.getInvoice(Number(payableInvoice.id)).catch(() => payableInvoice)
                : payableInvoice
              const invoiceBreakdown = buildBreakdownFromInvoice(detailedInvoice, breakdown)
              setBillingBreakdown(invoiceBreakdown)
              const balance = toMoneyNumber(
                detailedInvoice.balance_due ??
                detailedInvoice.balance ??
                detailedInvoice.total_amount ??
                detailedInvoice.amount
              )
              const paid = toMoneyNumber(detailedInvoice.amount_paid)
              const total = toMoneyNumber(detailedInvoice.total_amount ?? detailedInvoice.amount)
              const due = balance > 0 ? balance : Math.max(total - paid, 0)
              if (due > 0) {
                setCycleAmountDue(due)
                setCycleInvoiceNumber(detailedInvoice.invoice_number || null)
                return
              }
            }

            const usageEstimate = toMoneyNumber(
              (usageData as any)?.invoice_total_estimate ??
              (usageData as any)?.total_estimate
            )
            if (usageEstimate > 0 && breakdown) {
              setCycleAmountDue(usageEstimate)
              setCycleInvoiceNumber((usageData as any)?.invoice_number || null)
              return
            }

            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
          } catch {
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
          }
        }

        const s = subscription.status
        const paidPeriodActive = Boolean(
          subscription.current_period_end &&
          !checkDateExpired(new Date(subscription.current_period_end))
        )
        const convertedOrPaid = subscription.is_trial === false || paidPeriodActive

        // ── ACTIVE / PAID SUBSCRIPTION ──
        if (s === "active" || convertedOrPaid) {
          localStorage.setItem("subscriptionStatus", "active")
          setSubscriptionType(convertedOrPaid ? "active" : "trial")

          // FIX: For converted paid subscriptions (is_trial === false), ignore trial_ends_at
          // entirely — it will always be in the past and is irrelevant for paid accounts.
          // Only current_period_end determines if the paid period has expired.
          if (convertedOrPaid) {
            if (subscription.current_period_end) {
              const expired = checkDateExpired(new Date(subscription.current_period_end))
              setIsExpired(expired)
              if (expired) {
                await resolveCycleAmountDue()
              } else {
                setCycleAmountDue(null)
                setCycleInvoiceNumber(null)
                setBillingBreakdown(null)
              }
              if (!expired) {
                localStorage.setItem("subscriptionExpiry", subscription.current_period_end)
              }
            } else {
              setIsExpired(false)
            }
            setIsChecking(false)
            return
          }

          // Still on active trial (is_trial === true, status === "active")
          if (subscription.trial_expired === true) {
            setIsExpired(true)
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
            setIsChecking(false)
            return
          }

          if (subscription.trial_ends_at && checkDateExpired(new Date(subscription.trial_ends_at))) {
            setIsExpired(true)
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
            setIsChecking(false)
            return
          }

          if (subscription.current_period_end) {
            const expired = checkDateExpired(new Date(subscription.current_period_end))
            setIsExpired(expired)
            if (!expired) {
              localStorage.setItem("subscriptionExpiry", subscription.current_period_end)
              setCycleAmountDue(null)
              setCycleInvoiceNumber(null)
              setBillingBreakdown(null)
            }
          } else {
            setIsExpired(false)
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
          }

          setIsChecking(false)
          return
        }

        // ── TRIAL ──
        if (s === "trial" || s === "trialing") {
          localStorage.setItem("subscriptionStatus", "trial")
          setSubscriptionType("trial")

          if (subscription.trial_expired === true) {
            setIsExpired(true)
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
          } else if (subscription.trial_ends_at) {
            setIsExpired(checkDateExpired(new Date(subscription.trial_ends_at)))
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
          } else {
            setIsExpired(false)
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
          }

          setIsChecking(false)
          return
        }

        // ── EXPIRED / CANCELLED / PAST_DUE ──
        if (["expired", "cancelled", "past_due"].includes(s)) {
          setIsExpired(true)
          setSubscriptionType(subscription.is_trial === false ? "active" : "trial")
          if (subscription.is_trial === false) {
            await resolveCycleAmountDue()
          } else {
            setCycleAmountDue(null)
            setCycleInvoiceNumber(null)
            setBillingBreakdown(null)
          }
          setIsChecking(false)
          return
        }

        // Unknown status — allow through
        setIsExpired(false)
        setCycleAmountDue(null)
        setCycleInvoiceNumber(null)
        setBillingBreakdown(null)
        setIsChecking(false)
      } catch (error) {
        console.error("TrialGuard error:", error)
        if (!active) return
        setPlansLoading(false)
        setIsExpired(false)
        setSubscriptionType(null)
        setCycleAmountDue(null)
        setCycleInvoiceNumber(null)
        setBillingBreakdown(null)
        setIsChecking(false)
      }
    }

    checkTrial()
    const interval = setInterval(checkTrial, 5 * 60 * 1000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [trialDays])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (allowedPaths.some((path) => pathname?.startsWith(path))) {
    return <>{children}</>
  }

  if (isExpired) {
    return (
      <>
        {children}
        <PaymentDialog
          open={true}
          isPaidSubscription={subscriptionType === "active"}
          plans={realPlans}
          plansLoading={plansLoading}
          amountDue={cycleAmountDue}
          invoiceNumber={cycleInvoiceNumber}
          billingBreakdown={billingBreakdown}
        />
      </>
    )
  }

  return <>{children}</>
}

export default TrialGuard
