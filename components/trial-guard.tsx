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
  FileText,
  Smartphone,
  ShieldAlert,
  RefreshCw,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

// ==========================================
// PAYMENT DIALOG — Hotspot-style real-time
// ==========================================

type PaymentStatus = "idle" | "sending" | "waiting" | "success" | "failed" | "timeout"
type DialogStep = "plans" | "payment" | "success" | "failed" | "timeout"

const POLL_INTERVAL_MS = 3000   // 3 s between polls (same as hotspot captive portal)
const TIMEOUT_SECONDS  = 120    // 2 min before declaring timeout

interface PaymentDialogProps {
  open: boolean
  isPaidSubscription: boolean
  planName?: string
  plans: NetilyPlan[]
  plansLoading: boolean
}

function PaymentDialog({ open, isPaidSubscription, planName, plans, plansLoading }: PaymentDialogProps) {
  const { logout } = useAdminAuth()

  // Step / flow state
  const [step, setStep] = useState<DialogStep>("plans")
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

  // ─── setInterval-based polling (same pattern as hotspot captive portal) ───
  useEffect(() => {
    if (paymentStatus !== "waiting" || !pendingPaymentId) return

    const pollInterval = setInterval(async () => {
      try {
        const res = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)

        if (res.status === "completed") {
          clearInterval(pollInterval)
          adminApi.invalidateSubscriptionCache()
          localStorage.setItem("mpesaPayPhone", phoneNumber)
          setPaymentStatus("success")
          setStep("success")
          // Auto-reload after 2.5 s so TrialGuard re-checks subscription
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
    setSelectedPlan(plan)
    setPaymentError(null)
    setPhoneError(null)
    setStep("payment")
    setPaymentStatus("idle")
  }

  const handlePay = async () => {
    if (!selectedPlan) return
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
    setStep("payment")
  }

  const handleCheckAndRefresh = async () => {
    setPaymentStatus("sending")
    try {
      await adminApi.invalidateSubscriptionCache()
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
        className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isPaidSubscription ? "Payment Required" : "Trial Expired"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isPaidSubscription
                  ? "Your subscription has expired. Pay to restore access."
                  : "Your free trial has ended. Subscribe to continue."}
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => logout()}
            className="text-slate-400 hover:text-red-600 h-8 px-2"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>

        <Separator />

        {/* ── Body (scrollable) ── */}
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 py-5">

            {/* ── STEP: PLANS ── */}
            {step === "plans" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select a plan below to continue managing your ISP. Your data is safe and fully restored once payment is confirmed.
                </p>

                {plansLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500 text-sm">No plans available. Please contact support.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {plans.map((plan) => {
                      const isPopular = plan.is_popular || plan.name === "Professional"
                      const amount = getPlanAmount(plan)
                      const features = getFeatures(plan)
                      return (
                        <button
                          key={plan.id}
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                            isPopular
                              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 hover:border-blue-600"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{plan.name}</span>
                              {isPopular && (
                                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold">{kes(amount)}</span>
                              <span className="text-slate-500 text-xs">/mo</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {features.slice(0, 4).map((f, i) => (
                              <span key={i} className="text-xs text-slate-500 flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-600" />
                                {f}
                              </span>
                            ))}
                          </div>
                          {plan.is_metered && (
                            <p className="text-[10px] text-blue-600 font-medium mt-1">+ Usage-based fees</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: PAYMENT ── */}
            {step === "payment" && selectedPlan && (
              <div className="space-y-5">
                {/* Back button — only if not mid-payment */}
                {paymentStatus === "idle" && (
                  <Button
                    variant="ghost" size="sm"
                    className="-ml-2 h-7 text-xs"
                    onClick={() => setStep("plans")}
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to plans
                  </Button>
                )}

                {/* Invoice card */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold">Invoice</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Plan</p>
                      <p className="font-medium">{selectedPlan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Amount</p>
                      <p className="font-bold text-base">{kes(getPlanAmount(selectedPlan))}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Billing</p>
                      <p className="font-medium">Monthly</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Due Date</p>
                      <p className="font-medium">
                        {new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-KE", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-xs">
                    <span className="text-slate-400">Description: </span>
                    <span className="font-medium">
                      {isPaidSubscription
                        ? `Renewal — ${selectedPlan.name} Plan`
                        : `Activation — ${selectedPlan.name} Plan`}
                    </span>
                  </div>
                </div>

                {/* ── Waiting / Countdown overlay ── */}
                {paymentStatus === "waiting" && (
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-5 text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Smartphone className="w-7 h-7 text-green-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">
                        Waiting for M-Pesa confirmation
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                        Check your phone and enter your PIN
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center justify-center gap-1.5 text-sm text-green-700 dark:text-green-300">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono font-bold">{formatCountdown(countdown)}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">remaining</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      onClick={handleRetry}
                    >
                      Cancel &amp; Try Again
                    </Button>
                  </div>
                )}

                {/* ── Idle / input form ── */}
                {paymentStatus === "idle" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold">Pay via M-Pesa STK Push</span>
                    </div>

                    {paymentError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-400">{paymentError}</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="mpesa-phone" className="text-xs">Safaricom Phone Number</Label>
                      <Input
                        id="mpesa-phone"
                        type="tel"
                        placeholder="0712345678"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value)
                          setPhoneError(null)
                          setPaymentError(null)
                        }}
                      />
                      {phoneError ? (
                        <p className="text-[10px] text-red-500">{phoneError}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">
                          You will receive an STK push prompt on this number
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handlePay}
                      disabled={!phoneNumber.trim()}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Pay Now — {kes(getPlanAmount(selectedPlan))}
                    </Button>
                  </div>
                )}

                {/* Sending state */}
                {paymentStatus === "sending" && (
                  <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Sending STK Push...</span>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Payment Confirmed!</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Your account is active. All your data is restored.
                  </p>
                  {selectedPlan && (
                    <p className="text-xs text-slate-400 mt-1">
                      Plan: <span className="font-semibold">{selectedPlan.name}</span> —{" "}
                      {kes(getPlanAmount(selectedPlan))}/mo
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Redirecting to dashboard...
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.reload()}>
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── STEP: TIMEOUT ── */}
            {step === "timeout" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-amber-600" />
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
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCheckAndRefresh}>
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
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Payment Failed</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {paymentError || "Could not process payment. Please try again."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 max-w-xs mx-auto">
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleRetry}>
                    <Phone className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => setStep("plans")}>
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
  const [planName, setPlanName] = useState<string | null>(null)
  const [realPlans, setRealPlans] = useState<NetilyPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const pathname = usePathname()

  const allowedPaths = [
    "/admin/login",
    "/admin/register",
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
        setRealPlans(plansArray)
        setPlansLoading(false)

        if (!subscription || !subscription.status) {
          // No subscription — show payment wall
          setIsExpired(true)
          setSubscriptionType("trial")
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

        setPlanName(
          (subscription as any).plan_name ||
          (subscription.plan as any)?.name ||
          "Netily Plan"
        )

        const s = subscription.status

        // ── ACTIVE / PAID SUBSCRIPTION ──
        if (s === "active") {
          localStorage.setItem("subscriptionStatus", "active")
          setSubscriptionType("active")

          // FIX: For converted paid subscriptions (is_trial === false), ignore trial_ends_at
          // entirely — it will always be in the past and is irrelevant for paid accounts.
          // Only current_period_end determines if the paid period has expired.
          if (subscription.is_trial === false) {
            if (subscription.current_period_end) {
              const expired = checkDateExpired(new Date(subscription.current_period_end))
              setIsExpired(expired)
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
            setIsChecking(false)
            return
          }

          if (subscription.trial_ends_at && checkDateExpired(new Date(subscription.trial_ends_at))) {
            setIsExpired(true)
            setIsChecking(false)
            return
          }

          if (subscription.current_period_end) {
            const expired = checkDateExpired(new Date(subscription.current_period_end))
            setIsExpired(expired)
            if (!expired) {
              localStorage.setItem("subscriptionExpiry", subscription.current_period_end)
            }
          } else {
            setIsExpired(false)
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
          } else if (subscription.trial_ends_at) {
            setIsExpired(checkDateExpired(new Date(subscription.trial_ends_at)))
          } else {
            setIsExpired(false)
          }

          setIsChecking(false)
          return
        }

        // ── EXPIRED / CANCELLED / PAST_DUE ──
        if (["expired", "cancelled", "past_due"].includes(s)) {
          setIsExpired(true)
          setSubscriptionType("trial")
          setIsChecking(false)
          return
        }

        // Unknown status — allow through
        setIsExpired(false)
        setIsChecking(false)
      } catch (error) {
        console.error("TrialGuard error:", error)
        if (!active) return
        setPlansLoading(false)
        setIsExpired(true)
        setSubscriptionType("trial")
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
          planName={planName || undefined}
          plans={realPlans}
          plansLoading={plansLoading}
        />
      </>
    )
  }

  return <>{children}</>
}

export default TrialGuard
