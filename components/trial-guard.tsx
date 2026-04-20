"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Lock,
  CreditCard,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { adminApi } from "@/lib/admin-api"
import { useAdminAuth } from "@/app/admin/admin-auth-context"
import { toast } from "sonner"
import type { NetilyPlan } from "@/lib/types"

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function checkDateExpired(targetDate: Date): boolean {
  const now = new Date()
  return targetDate <= now
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1)
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned
  }
  return cleaned
}

function isValidKenyanPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  return /^254[17]\d{8}$/.test(formatted)
}

function kes(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount
  return `KES ${(n || 0).toLocaleString()}`
}

// ==========================================
// PAYMENT WALL COMPONENT (replaces old ExpiredPage)
// ==========================================

type WallStep = "plans" | "payment" | "polling" | "success" | "failed"

interface PaymentWallProps {
  isPaidSubscription: boolean
  planName?: string
  plans: NetilyPlan[]
  loading?: boolean
}

function PaymentWall({ isPaidSubscription, planName, plans, loading = false }: PaymentWallProps) {
  const { logout } = useAdminAuth()
  const [step, setStep] = useState<WallStep>("plans")
  const [selectedPlan, setSelectedPlan] = useState<NetilyPlan | null>(null)
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mpesaPayPhone") || ""
    }
    return ""
  })
  const [payLoading, setPayLoading] = useState(false)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const MAX_POLLS = 24 // 24 * 5s = 2 minutes

  // Generate a fake invoice ref for display
  const invoiceRef = selectedPlan
    ? `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`
    : ""

  const getPlanAmount = (plan: NetilyPlan | null): number => {
    if (!plan) return 0
    if (plan.is_metered) return Number(plan.base_license_fee) || Number(plan.price_monthly) || 0
    return Number(plan.price_monthly) || 0
  }

  const getFeaturesList = (plan: NetilyPlan): string[] => {
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
      if (f.multi_location) list.push("Multi-Location Support")
      if (list.length > 0) return list
    }
    const fallback: string[] = []
    if (plan.max_subscribers != null) fallback.push(`Up to ${plan.max_subscribers === 0 ? "Unlimited" : plan.max_subscribers} subscribers`)
    if (plan.max_routers != null) fallback.push(`Up to ${plan.max_routers === 0 ? "Unlimited" : plan.max_routers} routers`)
    if (plan.max_staff_users != null) fallback.push(`Up to ${plan.max_staff_users === 0 ? "Unlimited" : plan.max_staff_users} staff`)
    fallback.push(plan.is_metered ? "Metered usage-based billing" : "Fixed monthly pricing")
    fallback.push("M-Pesa Integration")
    return fallback
  }

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Poll for payment status
  useEffect(() => {
    if (step !== "polling" || !pendingPaymentId) return

    let attempts = 0
    let cancelled = false

    const poll = async () => {
      if (cancelled || attempts >= MAX_POLLS) {
        if (attempts >= MAX_POLLS) {
          setStep("failed")
          setPaymentError("Payment timeout. Please check your M-Pesa messages and try again if not deducted.")
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
          setPaymentError(res.message || "Payment was declined or cancelled. Please try again.")
          return
        }
        // Still pending
        setTimeout(poll, 5000)
      } catch {
        if (!cancelled) setTimeout(poll, 5000)
      }
    }

    // First poll after 4s (give user time to enter PIN)
    const timeout = setTimeout(poll, 4000)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [step, pendingPaymentId, phoneNumber])

  const handleSelectPlan = (plan: NetilyPlan) => {
    setSelectedPlan(plan)
    setPaymentError(null)
    setStep("payment")
  }

  const handlePay = async () => {
    if (!selectedPlan) return
    if (!isValidKenyanPhone(phoneNumber)) {
      setPaymentError("Please enter a valid Safaricom phone number (e.g., 0712345678)")
      return
    }

    setPayLoading(true)
    setPaymentError(null)

    try {
      const formatted = formatPhoneNumber(phoneNumber)
      const res = await adminApi.initiateSubscriptionPayment({
        plan_id: selectedPlan.code,
        payment_method: "mpesa_stk",
        phone_number: formatted,
        billing_period: "monthly",
      })

      toast.success("STK Push sent! Check your phone and enter your M-Pesa PIN.")
      setPendingPaymentId(res.payment_id)
      setPollCount(0)
      setStep("polling")
    } catch (err: any) {
      setPaymentError(err.message || "Failed to initiate payment. Please try again.")
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

  const handleReload = () => {
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
  }

  // ─── PLANS STEP ─────────────────────────────────────────────────────────
  if (step === "plans") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header bar */}
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">N</div>
              <span className="font-bold text-lg">Netily</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Status banner */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 mb-4">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPaidSubscription ? "Payment Required" : "Free Trial Expired"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              {isPaidSubscription ? "Payment Required" : "Your Trial Has Ended"}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              {isPaidSubscription
                ? "Your account requires payment to continue using the service. Select a plan to complete payment."
                : "Your 14-day free trial has ended. Select a plan below to continue managing your ISP."}
            </p>
          </div>

          {/* Plan cards */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500">No plans available. Please contact support.</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${plans.length <= 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"}`}>
              {plans.map((plan) => {
                const isPopular = plan.is_popular || plan.name === "Professional"
                const amount = getPlanAmount(plan)
                const features = getFeaturesList(plan)

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                      isPopular ? "border-blue-600 border-2 shadow-md" : "hover:border-slate-300"
                    }`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isPopular && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-blue-600 text-white">Recommended</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {plan.description || `Perfect for ${plan.name.toLowerCase()} ISPs`}
                      </CardDescription>
                      <div className="pt-3">
                        <span className="text-3xl font-bold">{kes(amount)}</span>
                        <span className="text-slate-500 text-sm">/month</span>
                        {plan.is_metered && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">+ Usage-based fees</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <Separator />
                      <ul className="space-y-2">
                        {features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full mt-3 ${isPopular ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                        variant={isPopular ? "default" : "outline"}
                      >
                        Select Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── PAYMENT STEP (Invoice + M-Pesa) ───────────────────────────────────
  if (step === "payment" && selectedPlan) {
    const amount = getPlanAmount(selectedPlan)
    const today = new Date()
    const dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">N</div>
              <span className="font-bold text-lg">Netily</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-12">
          {/* Back to plans */}
          <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => setStep("plans")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to plans
          </Button>

          {/* Payment Required Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 mb-3">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Payment Required</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Complete Payment</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Pay your activation fee to restore access to your account
            </p>
          </div>

          {/* Invoice Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                <CardTitle className="text-base">Invoice Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Plan:</p>
                  <p className="font-semibold">{selectedPlan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Amount:</p>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">{kes(amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Billing:</p>
                  <p className="font-medium">Monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Due Date:</p>
                  <p className="font-medium">{dueDate.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="text-slate-500">Description:</p>
                <p className="font-medium">
                  {isPaidSubscription
                    ? `Subscription Renewal — ${selectedPlan.name} Plan`
                    : `Activation Fee — ${selectedPlan.name} Plan`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* M-Pesa Payment Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base">Pay via M-Pesa</CardTitle>
              </div>
              <CardDescription>
                Enter your Safaricom number to receive an STK push
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{paymentError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="e.g., 0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    setPaymentError(null)
                  }}
                  disabled={payLoading}
                  className="text-base"
                />
                <p className="text-xs text-slate-400">You&apos;ll receive an STK push prompt on this number</p>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
                onClick={handlePay}
                disabled={payLoading || !phoneNumber.trim()}
              >
                {payLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending STK Push...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Pay Now — {kes(amount)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── POLLING STEP (Waiting for M-Pesa) ──────────────────────────────────
  if (step === "polling") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-green-600 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 left-0 right-0 flex justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Waiting for Payment</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            An M-Pesa prompt has been sent to your phone.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Please enter your M-Pesa PIN to complete the transaction.
          </p>

          {/* Progress indicator */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-4">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 95)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mb-8">
            Checking payment status... ({pollCount}/{MAX_POLLS})
          </p>

          <Button variant="outline" size="sm" onClick={handleRetry}>
            Cancel & Try Again
          </Button>
        </div>
      </div>
    )
  }

  // ─── SUCCESS STEP ───────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Your account has been reactivated.
          </p>
          {selectedPlan && (
            <p className="text-sm text-slate-500 mb-8">
              Plan: <span className="font-semibold">{selectedPlan.name}</span> — {kes(getPlanAmount(selectedPlan))}/month
            </p>
          )}

          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleReload}>
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // ─── FAILED STEP ────────────────────────────────────────────────────────
  if (step === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Failed</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {paymentError || "The payment could not be processed. Please try again."}
          </p>

          <div className="flex flex-col gap-3">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleRetry}>
              <Phone className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => setStep("plans")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Plan
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
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
    "/admin/settings/billing",
    "/admin/settings/account",
    "/admin/settings/payouts",
  ]

  useEffect(() => {
    let isCheckingNow = false

    const checkTrial = async () => {
      if (typeof window === "undefined") return
      if (isCheckingNow) return
      isCheckingNow = true

      try {
        // Fetch Real Netily Plans from Backend
        const plansData = await adminApi.getNetilyPlans() as any
        
        // FIX: Ensure realPlans is ALWAYS an array even if backend paginates
        const plansArray = Array.isArray(plansData) 
          ? plansData 
          : (plansData?.results || [])
          
        setRealPlans(plansArray)
        setPlansLoading(false)

        // Get current subscription
        const subscription = await adminApi.getCurrentSubscription()
        
        if (subscription) {
          // Store trial start date locally for countdown component
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
            
            if (subscription.current_period_end) {
              const expiryDate = new Date(subscription.current_period_end)
              const expired = checkDateExpired(expiryDate)
              setIsExpired(expired)
              localStorage.setItem("subscriptionExpiry", subscription.current_period_end)
            } else {
              setIsExpired(false)
            }
            
            setIsChecking(false)
            isCheckingNow = false
            return
          }
          
          if (subscription.status === "trial") {
            localStorage.setItem("subscriptionStatus", "trial")
            setSubscriptionType("trial")
            
            if (subscription.trial_ends_at) {
              const trialEndDate = new Date(subscription.trial_ends_at)
              const expired = checkDateExpired(trialEndDate)
              setIsExpired(expired)
            } else {
              setIsExpired(false)
            }
            setIsChecking(false)
            isCheckingNow = false
            return
          }
          
          if (subscription.status === "expired" || subscription.status === "cancelled") {
            setIsExpired(true)
            setIsChecking(false)
            isCheckingNow = false
            return
          }
        }
      } catch (error) {
        console.error("TrialGuard error:", error)
        setPlansLoading(false)
      }
      
      // Fallback: Check for cached expiry
      const cachedExpiry = localStorage.getItem("subscriptionExpiry")
      if (cachedExpiry) {
        const expiryDate = new Date(cachedExpiry)
        if (!isNaN(expiryDate.getTime())) {
          setIsExpired(checkDateExpired(expiryDate))
          setIsChecking(false)
          isCheckingNow = false
          return
        }
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
      <PaymentWall 
        isPaidSubscription={subscriptionType === "active"} 
        planName={planName || undefined} 
        plans={realPlans} 
        loading={plansLoading} 
      />
    )
  }

  return <>{children}</>
}

export default TrialGuard