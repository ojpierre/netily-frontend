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

// ==========================================
// PERSISTENT PAYMENT DIALOG
// ==========================================

type DialogStep = "plans" | "payment" | "polling" | "success" | "failed"

interface PaymentDialogProps {
  open: boolean
  isPaidSubscription: boolean
  planName?: string
  plans: NetilyPlan[]
  plansLoading: boolean
}

function PaymentDialog({ open, isPaidSubscription, planName, plans, plansLoading }: PaymentDialogProps) {
  const { logout } = useAdminAuth()
  const [step, setStep] = useState<DialogStep>("plans")
  const [selectedPlan, setSelectedPlan] = useState<NetilyPlan | null>(null)
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("mpesaPayPhone") || ""
    return ""
  })
  const [payLoading, setPayLoading] = useState(false)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  const MAX_POLLS = 24

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
      if (f.sms_notifications) list.push("SMS Notifications")
      if (f.email_notifications) list.push("Email Notifications")
      if (f.api_access) list.push("API Access")
      if (f.custom_branding) list.push("Custom Branding")
      if (f.white_label) list.push("White Label")
      if (f.priority_support) list.push("Priority Support")
      if (f.hotspot_portal) list.push("Hotspot Portal")
      if (f.analytics_dashboard) list.push("Analytics Dashboard")
      if (f.multi_location) list.push("Multi-Location")
      if (list.length > 0) return list
    }
    const fb: string[] = []
    if (plan.max_subscribers != null) fb.push(`${plan.max_subscribers === 0 ? "Unlimited" : plan.max_subscribers} subscribers`)
    if (plan.max_routers != null) fb.push(`${plan.max_routers === 0 ? "Unlimited" : plan.max_routers} routers`)
    fb.push(plan.is_metered ? "Metered billing" : "Fixed pricing")
    fb.push("M-Pesa Integration")
    return fb
  }

  // Poll for payment status
  useEffect(() => {
    if (step !== "polling" || !pendingPaymentId) return
    let attempts = 0
    let cancelled = false

    const poll = async () => {
      if (cancelled || attempts >= MAX_POLLS) {
        if (attempts >= MAX_POLLS) {
          setStep("failed")
          setPaymentError("Payment timeout. Check your M-Pesa messages and try again if not deducted.")
        }
        return
      }
      attempts++
      setPollCount(attempts)
      try {
        const res = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)
        if (cancelled) return
        if (res.status === "completed") {
          setStep("success")
          adminApi.invalidateSubscriptionCache()
          localStorage.setItem("mpesaPayPhone", phoneNumber)
          return
        }
        if (res.status === "failed" || res.status === "cancelled") {
          setStep("failed")
          setPaymentError(res.message || "Payment was declined or cancelled.")
          return
        }
        setTimeout(poll, 5000)
      } catch {
        if (!cancelled) setTimeout(poll, 5000)
      }
    }

    const t = setTimeout(poll, 4000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [step, pendingPaymentId, phoneNumber])

  const handleSelectPlan = (plan: NetilyPlan) => {
    setSelectedPlan(plan)
    setPaymentError(null)
    setStep("payment")
  }

  const handlePay = async () => {
    if (!selectedPlan) return
    if (!isValidKenyanPhone(phoneNumber)) {
      setPaymentError("Enter a valid Safaricom number (e.g. 0712345678)")
      return
    }
    setPayLoading(true)
    setPaymentError(null)
    try {
      const res = await adminApi.initiateSubscriptionPayment({
        plan_id: selectedPlan.code,
        payment_method: "mpesa_stk",
        phone_number: formatPhoneNumber(phoneNumber),
        billing_period: "monthly",
      })
      toast.success("STK Push sent! Check your phone and enter your M-Pesa PIN.")
      setPendingPaymentId(res.payment_id)
      setPollCount(0)
      setStep("polling")
    } catch (err: any) {
      setPaymentError(err.message || "Failed to initiate payment.")
    } finally {
      setPayLoading(false)
    }
  }

  const handleRetry = () => {
    setPaymentError(null)
    setPendingPaymentId(null)
    setPollCount(0)
    setStep("payment")
  }

  const handleReload = () => window.location.reload()
  const handleLogout = () => logout()

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
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
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-600 h-8 px-2">
            <LogOut className="w-4 h-4 mr-1" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>

        <Separator />

        {/* Body (scrollable) */}
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 py-5">

            {/* STEP: PLANS */}
            {step === "plans" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select a plan below to continue managing your ISP. Your data is safe and will be fully restored once payment is confirmed.
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
                                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">Recommended</Badge>
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

            {/* STEP: PAYMENT (Invoice + M-Pesa) */}
            {step === "payment" && selectedPlan && (
              <div className="space-y-5">
                <Button variant="ghost" size="sm" className="-ml-2 h-7 text-xs" onClick={() => setStep("plans")}>
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back to plans
                </Button>

                {/* Invoice */}
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
                      <p className="text-slate-400 text-xs">Due</p>
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
                        ? `Renewal ${selectedPlan.name} Plan`
                        : `Activation ${selectedPlan.name} Plan`}
                    </span>
                  </div>
                </div>

                {/* M-Pesa input */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold">Pay via M-Pesa</span>
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
                      onChange={(e) => { setPhoneNumber(e.target.value); setPaymentError(null) }}
                      disabled={payLoading}
                    />
                    <p className="text-[10px] text-slate-400">You will receive an STK push prompt on this number</p>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handlePay}
                    disabled={payLoading || !phoneNumber.trim()}
                  >
                    {payLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending STK Push...</>
                    ) : (
                      <><Phone className="w-4 h-4 mr-2" />Pay Now — {kes(getPlanAmount(selectedPlan))}</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: POLLING */}
            {step === "polling" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-green-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Waiting for Payment</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    An M-Pesa prompt has been sent. Enter your PIN to complete.
                  </p>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 95)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">Checking status... ({pollCount}/{MAX_POLLS})</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>Cancel &amp; Try Again</Button>
              </div>
            )}

            {/* STEP: SUCCESS */}
            {step === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Payment Successful!</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Your account has been reactivated. All your data is restored.
                  </p>
                  {selectedPlan && (
                    <p className="text-xs text-slate-400 mt-1">
                      Plan: <span className="font-semibold">{selectedPlan.name}</span> — {kes(getPlanAmount(selectedPlan))}/mo
                    </p>
                  )}
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleReload}>
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* STEP: FAILED */}
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
                <div className="flex flex-col gap-2">
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleRetry}>
                    <Phone className="w-4 h-4 mr-2" />Try Again
                  </Button>
                  <Button variant="outline" onClick={() => setStep("plans")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />Change Plan
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
    let isCheckingNow = false

    const checkTrial = async () => {
      if (typeof window === "undefined") return
      if (isCheckingNow) return
      isCheckingNow = true

      try {
        // Fetch plans and subscription in parallel for faster load
        const [plansData, subscription] = await Promise.all([
          adminApi.getNetilyPlans().catch(() => []),
          adminApi.getCurrentSubscription().catch(() => null),
        ])

        const plansArray = Array.isArray(plansData) ? plansData : ((plansData as any)?.results || [])
        setRealPlans(plansArray)
        setPlansLoading(false)

        if (subscription && subscription.status) {
          if (subscription.trial_ends_at) {
            const trialEndDate = new Date(subscription.trial_ends_at)
            const trialStartDate = new Date(trialEndDate.getTime() - (trialDays * 24 * 60 * 60 * 1000))
            localStorage.setItem("trialStartDate", trialStartDate.toISOString())
          } else if (subscription.current_period_start) {
            localStorage.setItem("trialStartDate", subscription.current_period_start)
          }

          setPlanName(subscription.plan_name || subscription.plan?.name || "Netily Plan")

          if (subscription.status === "active") {
            localStorage.setItem("subscriptionStatus", "active")
            setSubscriptionType("active")

            // Check trial_expired flag first (backend property: trial_ends_at < now)
            if (subscription.trial_expired === true) {
              setIsExpired(true)
              setIsChecking(false)
              isCheckingNow = false
              return
            }

            // Check trial_ends_at even for "active" status (trial on active plan)
            if (subscription.trial_ends_at && checkDateExpired(new Date(subscription.trial_ends_at))) {
              setIsExpired(true)
              setIsChecking(false)
              isCheckingNow = false
              return
            }

            // Check billing period end
            if (subscription.current_period_end) {
              const expiryDate = new Date(subscription.current_period_end)
              setIsExpired(checkDateExpired(expiryDate))
              localStorage.setItem("subscriptionExpiry", subscription.current_period_end)
            } else {
              setIsExpired(false)
            }
            setIsChecking(false)
            isCheckingNow = false
            return
          }

          if (subscription.status === "trial" || subscription.status === "trialing") {
            localStorage.setItem("subscriptionStatus", "trial")
            setSubscriptionType("trial")

            // trial_expired takes priority (backend computed property)
            if (subscription.trial_expired === true) {
              setIsExpired(true)
              setIsChecking(false)
              isCheckingNow = false
              return
            }

            if (subscription.trial_ends_at) {
              setIsExpired(checkDateExpired(new Date(subscription.trial_ends_at)))
            } else {
              setIsExpired(false)
            }
            setIsChecking(false)
            isCheckingNow = false
            return
          }

          if (["expired", "cancelled", "past_due"].includes(subscription.status)) {
            setIsExpired(true)
            setSubscriptionType("trial")
            setIsChecking(false)
            isCheckingNow = false
            return
          }
        } else {
          // No subscription record found — treat as expired (needs to subscribe)
          console.warn("TrialGuard: No subscription found, showing payment dialog")
          setIsExpired(true)
          setSubscriptionType("trial")
          setIsChecking(false)
          isCheckingNow = false
          return
        }
      } catch (error) {
        console.error("TrialGuard error:", error)
        setPlansLoading(false)
        // On error, treat as expired to force payment dialog
        setIsExpired(true)
        setSubscriptionType("trial")
        setIsChecking(false)
        isCheckingNow = false
        return
      }

      setIsChecking(false)
      isCheckingNow = false
    }

    checkTrial()
    const interval = setInterval(checkTrial, 5 * 60 * 1000)
    return () => clearInterval(interval)
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
