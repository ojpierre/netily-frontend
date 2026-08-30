"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Zap, Check, Users, Wifi, Shield, Clock, Download, Receipt, AlertTriangle, Loader2, Eye, Phone
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { adminApi } from "@/lib/admin-api"
import type { NetilyPlan, CompanySubscription, UsageStats as ApiUsageStats, Invoice, BillingCycleBreakdown } from "@/lib/types"

const kes = (amount: number | string) => 
  new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES", maximumFractionDigits: 0,
  }).format(Number(amount))

const getInvoiceBalance = (inv: Invoice) => {
  const explicitBalance = (inv as any).balance_due ?? (inv as any).balance ?? (inv as any).invoice_balance
  if (explicitBalance !== undefined && explicitBalance !== null && explicitBalance !== "") {
    return Number(explicitBalance || 0)
  }

  const total = Number(inv.total_amount || 0)
  const paid = Number(inv.amount_paid || (inv as any).invoice_amount_paid || 0)
  return Math.max(total - paid, 0)
}

const isInvoicePaid = (inv: Invoice) => {
  const status = String(inv?.status || "").toLowerCase()
  return status === "paid" && getInvoiceBalance(inv) <= 0
}

const getInvoiceStatusLabel = (inv: Invoice) => {
  if (isInvoicePaid(inv)) return "paid"
  if (getInvoiceBalance(inv) > 0) return "unpaid"
  return String(inv?.status || "pending").toLowerCase()
}

// Separate component to handle search params safely within Suspense
function BillingContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null)
  const [apiPlans, setApiPlans] = useState<NetilyPlan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<ApiUsageStats | null>(null)
  const [cycleBreakdowns, setCycleBreakdowns] = useState<BillingCycleBreakdown[]>([])
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null)
  const [payPhone, setPayPhone] = useState("")
  const [payLoading, setPayLoading] = useState(false)
  const [selectingPlan, setSelectingPlan] = useState<NetilyPlan | null>(null)
  const [planPayPhone, setPlanPayPhone] = useState("")
  const [planPayLoading, setPlanPayLoading] = useState(false)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("")
  const [paymentStage, setPaymentStage] = useState<"idle" | "checking" | "success" | "timeout" | "failed">("idle")
  const [enterpriseSupportOpen, setEnterpriseSupportOpen] = useState(false)

  // Pay Now dialog state (for expired trial activation)
  const [payNowOpen, setPayNowOpen] = useState(false)
  const [payNowPhone, setPayNowPhone] = useState("")
  const [payNowLoading, setPayNowLoading] = useState(false)

  const loadBillingData = async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true)
    try {
      adminApi.invalidateSubscriptionCache()
      const [plansData, subData, usageData, invoicesData, cycleBreakdownsData] = await Promise.all([
        adminApi.getNetilyPlans(),
        adminApi.getCurrentSubscription(),
        adminApi.getUsageStats(),
        // FIX: Use search filter for NET-BILL prefix to isolate Netily platform invoices
        adminApi.getInvoices({ search: 'NET-BILL', page_size: 100 }),
        adminApi.getBillingCycleBreakdowns(12).catch(() => ({ count: 0, results: [] }))
      ])

      // FIX 1: Handle Paginated vs List responses for Plans
      if (Array.isArray(plansData)) {
        setApiPlans(plansData)
      } else if (plansData && (plansData as any).results) {
        setApiPlans((plansData as any).results)
      } else {
        setApiPlans([])
      }

      setSubscription(subData)

      // Normalize flat backend response ? nested UsageStats format
      if (usageData && !(usageData as any).subscribers) {
        const raw = usageData as any
        setUsage({
          subscribers: { current: raw.current_subscribers ?? raw.pppoe_count ?? 0, limit: raw.max_subscribers === 0 ? null : (raw.max_subscribers ?? null), percentage: raw.subscribers_usage_percent ?? null },
          routers: { current: raw.current_routers ?? 0, limit: raw.max_routers === 0 ? null : (raw.max_routers ?? null), percentage: raw.routers_usage_percent ?? null },
          staff: { current: raw.current_staff ?? 0, limit: raw.max_staff === 0 ? null : (raw.max_staff ?? null), percentage: raw.staff_usage_percent ?? null },
          is_over_limit: raw.is_near_limit ?? false,
          warnings: raw.warnings ?? [],
          is_metered: raw.is_metered,
          billing_cycle_id: raw.billing_cycle_id,
          billing_cycle_start: raw.billing_cycle_start,
          billing_cycle_end: raw.billing_cycle_end,
          pppoe_count: raw.pppoe_count ?? raw.current_subscribers ?? 0,
          pppoe_unit_price: raw.pppoe_unit_price ?? 25,
          billable_pppoe: raw.billable_pppoe ?? raw.pppoe_count ?? raw.current_subscribers ?? 0,
          pppoe_charge: raw.pppoe_charge ?? 0,
          hotspot_revenue_accrued: raw.hotspot_revenue_accrued ?? 0,
          hotspot_revenue_share_pct: raw.hotspot_revenue_share_pct ?? raw.hotspot_share_pct ?? 0,
          hotspot_revenue_share_amount: raw.hotspot_revenue_share_amount ?? raw.hotspot_share_amount ?? 0,
          hotspot_revenue_count: raw.hotspot_revenue_count ?? 0,
          hotspot_revenue_source: raw.hotspot_revenue_source ?? "",
          hotspot_minimum_charge: raw.hotspot_minimum_charge ?? 0,
          hotspot_billable_charge: raw.hotspot_billable_charge ?? raw.hotspot_revenue_share_amount ?? raw.hotspot_share_amount ?? 0,
          usage_subtotal: raw.usage_subtotal ?? 0,
          minimum_charge: raw.minimum_charge ?? raw.monthly_minimum_charge ?? 500,
          minimum_adjustment: raw.minimum_adjustment ?? 0,
          total_estimate: raw.total_estimate ?? 0,
          invoice_adjustment_amount: raw.invoice_adjustment_amount ?? 0,
          invoice_discount_amount: raw.invoice_discount_amount ?? 0,
          invoice_total_estimate: raw.invoice_total_estimate ?? null,
          invoice_number: raw.invoice_number ?? "",
          invoice_adjustment_note: raw.invoice_adjustment_note ?? "",
          hotspot_revenue_note: raw.hotspot_revenue_note,
        } as ApiUsageStats)
      } else {
        setUsage(usageData)
      }

      // FIX 2: Safe Invoice extraction
      setInvoices(invoicesData?.results || [])
      setCycleBreakdowns(cycleBreakdownsData?.results || [])
      
    } catch (error) {
      console.error("Billing load error:", error)
      if (showSpinner) toast.error("Failed to load billing records")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setHasMounted(true)
    loadBillingData(true)
  }, [])

  // --- Poll pending payment status -----------------------------------------
  useEffect(() => {
    if (!pendingPaymentId) return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 6 // ~30 seconds after the STK prompt is sent

    const poll = async () => {
      if (cancelled || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          setPaymentStage("timeout")
          setPaymentStatus("We could not confirm this within 30 seconds. If you entered your PIN, tap Check status before sending another STK.")
          toast.info("Payment is not confirmed yet. Check status in a moment or send a new STK.")
        }
        return
      }
      attempts++
      try {
        const res = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)
        if (cancelled) return

        if (res.status === 'completed') {
          adminApi.invalidateSubscriptionCache()
          setPendingPaymentId(null)
          setPaymentStage("success")
          setPaymentStatus("Payment confirmed. Refreshing your subscription access...")
          if (res.subscription_activated === false) {
            toast.info(res.message || "Payment received. Please settle the remaining invoice balance to reactivate.", { duration: 8000 })
          } else {
            toast.success("Payment confirmed! Your plan is now active.", { duration: 6000 })
          }
          await loadBillingData()
          window.setTimeout(() => window.location.reload(), 1200)
          return
        }
        if (res.status === 'failed' || res.status === 'cancelled') {
          setPendingPaymentId(null)
          setPaymentStage("failed")
          setPaymentStatus(res.message || "Payment failed. Please try again.")
          toast.error(res.message || "Payment failed. Please try again.")
          return
        }
        // Still pending - poll again
        setPaymentStage("checking")
        setPaymentStatus(attempts <= 1 ? "Waiting for M-Pesa confirmation..." : "Still checking M-Pesa confirmation...")
        setTimeout(poll, 5000)
      } catch {
        if (!cancelled) {
          setPaymentStage("checking")
          setPaymentStatus("Still checking payment status...")
          setTimeout(poll, 5000)
        }
      }
    }

    setPaymentStage("checking")
    setTimeout(poll, 4000) // first poll after 4s (give user time to enter PIN)
    return () => { cancelled = true }
  }, [pendingPaymentId])

  const checkPendingPaymentNow = async () => {
    if (!pendingPaymentId) return
    setPaymentStage("checking")
    setPaymentStatus("Checking M-Pesa confirmation...")
    try {
      const res = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)
      if (res.status === "completed") {
        adminApi.invalidateSubscriptionCache()
        setPendingPaymentId(null)
        setPaymentStage("success")
        setPaymentStatus("Payment confirmed. Refreshing your subscription access...")
        toast.success(res.message || "Payment confirmed. Your subscription is active.")
        await loadBillingData()
        window.setTimeout(() => window.location.reload(), 1200)
        return
      }
      if (res.status === "failed" || res.status === "cancelled") {
        setPendingPaymentId(null)
        setPaymentStage("failed")
        setPaymentStatus(res.message || "Payment was not completed. Please try again.")
        toast.error(res.message || "Payment was not completed. Please try again.")
        return
      }
      setPaymentStage("timeout")
      setPaymentStatus("M-Pesa has not confirmed this payment yet. If no money left the phone, you can send a new STK.")
    } catch {
      setPaymentStage("timeout")
      setPaymentStatus("We could not reach billing status right now. Try Check status again in a moment.")
    }
  }

  const resetPendingPayment = () => {
    setPendingPaymentId(null)
    setPaymentStage("idle")
    setPaymentStatus("")
  }

  if (!hasMounted || isLoading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Helper for plan price display.
  const getPlanPriceDisplay = (plan: NetilyPlan) => {
    if (plan?.is_metered) {
      const activationFee = Number(plan.base_license_fee) || Number(plan.price_monthly) || 500
      return (
        <div className="flex flex-col">
          <span className="text-2xl font-black">{kes(activationFee)}</span>
          <span className="text-[10px] text-primary font-bold uppercase">Activation + Usage Minimum</span>
        </div>
      )
    }
    // Non-metered plans: show commission percentage instead of price
    const pct = Number((plan as any).hotspot_revenue_share_pct) || 0
    if (pct > 0) {
      return (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{pct}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Commission</span>
        </div>
      )
    }
    // Fallback if no percentage set
    const price = Number(plan?.price_monthly) || Number(plan?.price) || 0
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black">{kes(price)}</span>
        <span className="text-sm text-slate-500">/mo</span>
      </div>
    )
  }

  const isEnterprisePlan = (plan: NetilyPlan | null | undefined) => {
    if (!plan) return false
    return plan.code === 'enterprise' || plan.name.toLowerCase().includes('enterprise')
  }

  // Client-side PDF generation via print window
  const handleDownloadPDF = (inv: Invoice) => {
    const billingDate = (inv as any).billing_date || inv.invoice_date
    const w = window.open('', '_blank')
    if (!w) { toast.error("Please allow pop-ups to download PDF"); return }
    w.document.write(`<html><head><title>Invoice ${inv.invoice_number}</title>
<style>body{font-family:system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{font-size:24px;margin-bottom:8px}.meta{color:#666;margin-bottom:24px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eee}th{background:#f8f9fa;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.5px}.total{font-size:20px;font-weight:800;text-align:right;margin-top:24px;padding-top:16px;border-top:2px solid #333}.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase}.paid{background:#dcfce7;color:#166534}.pending{background:#fef2f2;color:#991b1b}@media print{body{padding:20px}}</style></head><body>
<h1>Invoice ${inv.invoice_number}</h1>
<p class="meta">Date: ${billingDate ? new Date(billingDate).toLocaleDateString('en-KE', { dateStyle: 'long' }) : '---'}</p>
<p>Status: <span class="badge ${inv.status === 'paid' ? 'paid' : 'pending'}">${(inv.status || 'pending').toUpperCase()}</span></p>
<table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>
${inv.items?.length ? inv.items.map((item: any) => `<tr><td>${item.description}</td><td style="text-align:right">KES ${Number(item.total || 0).toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:#999;padding:24px">Platform subscription fee</td></tr>'}
</tbody></table><div class="total">Total: KES ${Number(inv.total_amount || 0).toLocaleString()}</div>
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  // STK Push payment for unpaid invoices
  const handlePayInvoice = async (invoiceId: number) => {
    const phone = payPhone.trim()
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    const inv = invoices.find(i => i.id === invoiceId)
    const invoiceAmount = inv ? getInvoiceBalance(inv) || Number(inv.total_amount) : 0
    if (!invoiceAmount) {
      toast.error("Could not determine invoice amount")
      return
    }
    setPayLoading(true)
    try {
      const res = await adminApi.initiateSubscriptionPayment({
        plan_id: subscription?.plan?.code || 'metered',
        payment_method: 'mpesa_stk',
        phone_number: phone.startsWith('0') ? `254${phone.slice(1)}` : phone,
        billing_period: 'monthly',
        amount: invoiceAmount,
      })
      toast.success("STK Push sent! Check your phone and enter your M-Pesa PIN.")
      setPayingInvoiceId(null)
      setPayPhone("")
      if (res.payment_id) {
        setPendingPaymentId(res.payment_id)
        setPaymentStage("checking")
        setPaymentStatus("Waiting for M-Pesa confirmation...")
      }
    } catch (error: any) {
      setPaymentStage("failed")
      toast.error(error?.message || "Payment initiation failed")
    } finally {
      setPayLoading(false)
    }
  }

  // Derive display amount for a plan. The backend calculates the final amount.
  const getPlanAmount = (plan: NetilyPlan | null) => {
    if (!plan) return 0
    if (plan.is_metered) return Number(plan.base_license_fee) || 500
    return Number(plan.price_monthly) || 0
  }

  // STK Push payment for selecting a new plan
  const handleSelectPlan = async () => {
    if (!selectingPlan) return
    const phone = planPayPhone.trim()
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    setPlanPayLoading(true)
    try {
      const res = await adminApi.initiateSubscriptionPayment({
        plan_id: selectingPlan.code,
        payment_method: 'mpesa_stk',
        phone_number: phone.startsWith('0') ? `254${phone.slice(1)}` : phone,
        billing_period: 'monthly',
      })
      toast.success("STK Push sent! Check your phone and enter your M-Pesa PIN.")
      setSelectingPlan(null)
      setPlanPayPhone("")
      // Start polling for payment confirmation
      if (res.payment_id) {
        setPendingPaymentId(res.payment_id)
        setPaymentStage("checking")
        setPaymentStatus("Waiting for M-Pesa confirmation...")
      }
    } catch (error: any) {
      setPaymentStage("failed")
      toast.error(error?.message || "Payment initiation failed")
    } finally {
      setPlanPayLoading(false)
    }
  }

  // STK Push payment for Pay Now on active subscription (post-trial activation)
  const handlePayNow = async () => {
    if (!subscription?.plan) return
    const phone = payNowPhone.trim()
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    setPayNowLoading(true)
    try {
      const res = await adminApi.initiateSubscriptionPayment({
        plan_id: subscription.plan.code,
        payment_method: 'mpesa_stk',
        phone_number: phone.startsWith('0') ? `254${phone.slice(1)}` : phone,
        billing_period: subscription.billing_period || 'monthly',
        defer_billing_to_trial_end: false, // Trial has already expired, start billing immediately
      })
      toast.success("STK Push sent! Check your phone and enter your M-Pesa PIN.")
      setPayNowOpen(false)
      setPayNowPhone("")
      if (res.payment_id) {
        setPendingPaymentId(res.payment_id)
        setPaymentStage("checking")
        setPaymentStatus("Waiting for M-Pesa confirmation...")
      }
    } catch (error: any) {
      setPaymentStage("failed")
      toast.error(error?.message || "Payment initiation failed")
    } finally {
      setPayNowLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-slate-600">Review your subscription status and official monthly invoices</p>
      </div>

      {(subscription?.status === "expired" || subscription?.status === "past_due") && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Account Locked</AlertTitle>
          <AlertDescription>
            {subscription?.status === "expired" 
              ? "Your trial has expired. Select a plan below and pay to restore access."
              : "Your subscription payment is past due. Please settle your invoice to restore access."
            }
          </AlertDescription>
        </Alert>
      )}

      {pendingPaymentId && (
        <Alert className={
          paymentStage === "timeout"
            ? "border-amber-500/30 bg-amber-500/10"
            : "border-primary/20 bg-primary/10"
        }>
          <Loader2 className={`w-4 h-4 text-primary ${paymentStage === "checking" ? "animate-spin" : "hidden"}`} />
          <AlertTitle className={paymentStage === "timeout" ? "text-amber-700 dark:text-amber-300" : "text-primary"}>
            {paymentStage === "timeout" ? "Confirmation delayed" : "Processing payment"}
          </AlertTitle>
          <AlertDescription className={paymentStage === "timeout" ? "text-amber-700 dark:text-amber-300" : "text-primary"}>
            <div className="space-y-3">
              <p>{paymentStatus || "Waiting for M-Pesa confirmation..."}</p>
              {paymentStage === "timeout" && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" size="sm" onClick={checkPendingPaymentNow}>
                    Check status
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={resetPendingPayment}>
                    Send new STK
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={subscription?.status === "expired" || subscription?.status === "past_due" ? "plans" : "invoices"} className="space-y-6">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="current" className="flex-1 min-w-0 text-xs sm:text-sm">Current Plan</TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 min-w-0 text-xs sm:text-sm">Invoices</TabsTrigger>
          <TabsTrigger value="plans" className="flex-1 min-w-0 text-xs sm:text-sm">Available Plans</TabsTrigger>
          <TabsTrigger value="usage" className="flex-1 min-w-0 text-xs sm:text-sm">Usage</TabsTrigger>
        </TabsList>

        {/* 1. CURRENT PLAN */}
        <TabsContent value="current">
          {subscription ? (
            <>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> {subscription.plan?.name || 'Standard Plan'}
                  </CardTitle>
                  <CardDescription>{subscription.plan?.description || ''}</CardDescription>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'} className="capitalize px-4 py-1">
                  {subscription.status || 'Active'}
                </Badge>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6 md:gap-12 pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Next Invoice Date</p>
                      <p className="font-bold text-foreground">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-KE', { dateStyle: 'long' }) : '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        {subscription.plan?.is_metered ? "Activation Fee" : "Monthly Fee"}
                      </p>
                      <p className="font-bold text-foreground">{kes(subscription.plan?.price_monthly || subscription.plan?.base_license_fee || subscription.plan?.price || 0)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your plan is billed every 30 days. Metered invoices use your PPPoE footprint plus 3% of hotspot revenue, with a KES 500 monthly minimum if usage is lower.
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-4">Plan Limits & Features</p>
                  <ul className="space-y-3">
                    <li className="text-sm flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500" /> 
                      {subscription.plan?.max_subscribers || 'Unlimited'} Max Subscribers
                    </li>
                    <li className="text-sm flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500" /> 
                      {subscription.plan?.max_routers || 'Unlimited'} Managed Routers
                    </li>
                    <li className="text-sm flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500" /> 
                      {(subscription.plan as any)?.max_staff || subscription.plan?.max_staff_users || 'Unlimited'} Staff Accounts
                    </li>
                    {Array.isArray(subscription.plan?.features)
                      ? subscription.plan.features.map((feat: string) => (
                          <li key={feat} className="text-sm flex items-center gap-3">
                            <Check className="w-4 h-4 text-emerald-500" /> {feat}
                          </li>
                        ))
                      : (
                        <>
                          {subscription.plan?.features?.api_access && (
                            <li className="text-sm flex items-center gap-3">
                              <Check className="w-4 h-4 text-emerald-500" /> Full API Access
                            </li>
                          )}
                          {subscription.plan?.features?.white_label && (
                            <li className="text-sm flex items-center gap-3">
                              <Check className="w-4 h-4 text-emerald-500" /> White-label Solution
                            </li>
                          )}
                          {subscription.plan?.features?.priority_support && (
                            <li className="text-sm flex items-center gap-3">
                              <Check className="w-4 h-4 text-emerald-500" /> Priority Support
                            </li>
                          )}
                          {subscription.plan?.features?.multi_location && (
                            <li className="text-sm flex items-center gap-3">
                              <Check className="w-4 h-4 text-emerald-500" /> Multi-location Support
                            </li>
                          )}
                        </>
                      )
                    }
                  </ul>
                </div>
              </CardContent>

              {/* --- Pay Now Section --- */}
              {/* Show Pay Now ONLY when trial has expired and activation fee hasn't been paid */}
              {subscription.plan?.is_metered && subscription.trial_expired && (subscription.status === 'expired' || subscription.status === 'past_due') && (
                <CardFooter className="flex flex-col items-stretch gap-4 pt-4 border-t border-slate-100">
                  {/* Trial expired - needs payment */}
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Trial Expired
                      </p>
                      <p className="text-xs text-destructive mt-0.5">
                        Pay the activation fee to continue using Netily
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full sm:w-auto bg-success hover:bg-green-700 font-bold"
                    onClick={() => {
                      setPayNowOpen(true)
                      setPayNowPhone("")
                    }}
                    disabled={!!pendingPaymentId}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Pay Now - Activate Subscription
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* --- Pay Now Dialog --- */}
            <Dialog open={payNowOpen} onOpenChange={(open) => { if (!open) { setPayNowOpen(false); setPayNowPhone("") } }}>
              <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                  <DialogTitle>Activate Your Subscription</DialogTitle>
                  <DialogDescription>
                    Pay the one-time activation fee of {kes(Number(subscription?.plan?.base_license_fee) || 500)} to activate your subscription. Monthly invoices will be based on usage or the KES 500 minimum, whichever is higher.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">M-Pesa Phone Number</label>
                    <Input
                      placeholder="0712345678"
                      value={payNowPhone}
                      onChange={(e) => setPayNowPhone(e.target.value)}
                      maxLength={13}
                    />
                    <p className="text-xs text-slate-400 mt-1">You&apos;ll receive an STK push prompt on this number</p>
                  </div>
                  <Button
                    className="w-full bg-success hover:bg-green-700"
                    disabled={payNowLoading || !payNowPhone.trim()}
                    onClick={handlePayNow}
                  >
                    {payNowLoading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      : `Send STK Push - ${kes(Number(subscription?.plan?.base_license_fee) || Number(subscription?.plan?.price_monthly) || 500)}`
                    }
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </>
          ) : (
            <div className="py-20 text-center border-2 border-dashed rounded-xl">
              <p className="text-slate-400">No active subscription found.</p>
            </div>
          )}
        </TabsContent>

        {/* 2. INVOICES - Now with correct dates and View Breakdown Modal */}
        <TabsContent value="invoices">
          {/* ── Upcoming Invoice Banner (shows if renewal is within 5 days) ── */}
          {(() => {
            if (!subscription?.current_period_end) return null
            const daysLeft = Math.ceil(
              (new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            if (daysLeft < 0 || daysLeft > 5) return null
            const dueDate = new Date(subscription.current_period_end).toLocaleDateString(undefined, {
              day: "numeric", month: "long", year: "numeric",
            })
            const upcomingEstimateAmount =
              usage?.invoice_total_estimate ??
              usage?.total_estimate ??
              subscription.plan?.base_license_fee ??
              subscription.plan?.price_monthly ??
              null
            return (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 dark:bg-amber-950/30 dark:border-amber-800 p-4">
                <span className="text-warning mt-0.5">⏰</span>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                    Upcoming Invoice — due in {daysLeft === 0 ? "today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                  </p>
                  <p className="text-xs text-warning dark:text-amber-300 mt-0.5">
                    Your next subscription invoice is due on <strong>{dueDate}</strong>
                    {upcomingEstimateAmount ? ` · Estimated KES ${Number(upcomingEstimateAmount).toLocaleString()}` : ""}.
                    Ensure your M-Pesa wallet is funded to avoid service interruption.
                  </p>
                </div>
              </div>
            )
          })()}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Billing History</CardTitle>
              <CardDescription>Official invoices generated at the end of each 30-day subscription cycle</CardDescription>
            </CardHeader>
            <CardContent>
              {(!Array.isArray(invoices) || invoices.length === 0) ? (
                <div className="py-16 text-center">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-foreground font-medium">No invoices yet</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                    Finalized bills will appear here once your current 30-day billing cycle completes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold text-foreground whitespace-nowrap">Invoice Number</TableHead>
                      <TableHead className="font-bold text-foreground whitespace-nowrap">Billing Date</TableHead>
                      <TableHead className="font-bold text-foreground whitespace-nowrap hidden sm:table-cell">Period</TableHead>
                      <TableHead className="font-bold text-foreground whitespace-nowrap">Total Amount</TableHead>
                      <TableHead className="font-bold text-foreground whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right font-bold text-foreground whitespace-nowrap">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => {
                      // Dynamically pull correct fields regardless of TS interface constraints
                      const billingDate = (inv as any).billing_date || inv.invoice_date;
                      const pStart = (inv as any).service_period_start || inv.period_start;
                      const pEnd = (inv as any).service_period_end || inv.period_end;

                      return (
                        <TableRow key={inv?.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-mono font-bold text-primary">{inv?.invoice_number || '---'}</TableCell>
                          <TableCell>{billingDate ? new Date(billingDate).toLocaleDateString() : '---'}</TableCell>
                          <TableCell className="text-slate-600 text-sm hidden sm:table-cell">
                            {pStart && pEnd ? (
                              <>
                                {new Date(pStart).toLocaleDateString()} - {new Date(pEnd).toLocaleDateString()}
                              </>
                            ) : (
                              'Monthly Service'
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-foreground">{kes(inv?.total_amount || 0)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={isInvoicePaid(inv) ? 'default' : 'destructive'}
                              className="uppercase text-[9px] font-black tracking-tighter"
                            >
                              {getInvoiceStatusLabel(inv)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {/* Breakdown Modal */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="mr-2 h-8">
                                  <Eye className="w-3 h-3 mr-2" /> Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Invoice Breakdown</DialogTitle>
                                  <CardDescription>{inv?.invoice_number}</CardDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                  {inv?.items && inv.items.length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Description</TableHead>
                                          <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {inv.items.map((item: any) => (
                                          <TableRow key={item.id}>
                                            <TableCell className="text-sm">{item.description}</TableCell>
                                            <TableCell className="text-right font-medium">{kes(item.total || 0)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                      <p>No line items found for this invoice.</p>
                                    </div>
                                  )}
                                  <div className="mt-6 flex justify-between items-center border-t pt-4">
                                    <span className="font-bold uppercase text-xs tracking-widest text-slate-500">Total Due</span>
                                    <span className="font-black text-xl text-primary">{kes(inv?.total_amount || 0)}</span>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleDownloadPDF(inv)}>
                              <Download className="w-3 h-3 mr-2" /> PDF
                            </Button>
                            {!isInvoicePaid(inv) && (
                              <Dialog open={payingInvoiceId === inv.id} onOpenChange={(open) => { if (!open) { setPayingInvoiceId(null); setPayPhone("") } }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="ml-2 h-8 bg-success hover:bg-green-700" onClick={() => setPayingInvoiceId(inv.id)}>
                                    <Phone className="w-3 h-3 mr-2" /> Pay
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[400px]">
                                  <DialogHeader>
                                    <DialogTitle>Pay Invoice {inv.invoice_number}</DialogTitle>
                                    <CardDescription>Amount: {kes(getInvoiceBalance(inv) || inv?.total_amount || 0)}</CardDescription>
                                  </DialogHeader>
                                  <div className="mt-4 space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-slate-700 block mb-1.5">M-Pesa Phone Number</label>
                                      <Input
                                        placeholder="0712345678"
                                        value={payPhone}
                                        onChange={(e) => setPayPhone(e.target.value)}
                                        maxLength={13}
                                      />
                                      <p className="text-xs text-slate-400 mt-1">You&apos;ll receive an STK push prompt on this number</p>
                                    </div>
                                    <Button
                                      className="w-full bg-success hover:bg-green-700"
                                      disabled={payLoading || !payPhone.trim()}
                                      onClick={() => handlePayInvoice(inv.id)}
                                    >
                                      {payLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Send STK Push"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. AVAILABLE PLANS - Added Array check to prevent k.map crash */}
        <TabsContent value="plans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Metered plans excluding Enterprise (handled by unified card below) */}
            {Array.isArray(apiPlans) && apiPlans.filter((p) => p.is_metered && !isEnterprisePlan(p)).map((plan) => (
              <Card 
                key={plan.id} 
                className={`${
                  plan.code === subscription?.plan?.code 
                    ? 'border-primary border-2 shadow-md ring-1 ring-ring/10' 
                    : 'border-slate-200'
                } transition-all hover:shadow-lg`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.code === subscription?.plan?.code && (
                      <Badge className="bg-primary text-[10px] font-bold">CURRENT PLAN</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs h-8 line-clamp-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    {getPlanPriceDisplay(plan)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <Separator />
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-slate-400" /> 
                      {plan.max_subscribers || 'Unlimited'} Subscribers
                    </div>
                    <div className="flex items-center gap-3">
                      <Wifi className="w-4 h-4 text-slate-400" /> 
                      {plan.max_routers || 'Unlimited'} Routers
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-slate-400" /> 
                      {(plan as any).max_staff || plan.max_staff_users || 'Unlimited'} Staff Accounts
                    </div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="text-xs text-primary font-medium">
                      KES 500 activation after trial, then usage billing with a KES 500 monthly minimum
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  {plan.code === subscription?.plan?.code ? (
                    <Button variant="secondary" className="w-full font-bold" disabled>
                      Currently Active
                    </Button>
                  ) : (
                    <Button className="w-full font-bold" onClick={() => { setSelectingPlan(plan); setPlanPayPhone("") }}>
                      Select Plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}

            {/* Enterprise & Custom — unified card (no direct pay flow) */}
            <Card className="border-slate-800 bg-linear-to-br from-slate-900 to-blue-950 text-white transition-all hover:shadow-xl col-span-1 sm:col-span-1 lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary/80" />
                    Enterprise &amp; Custom Plans
                  </CardTitle>
                  {isEnterprisePlan(subscription?.plan) ? (
                    <Badge className="bg-primary text-[10px] font-bold">CURRENT PLAN</Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary/60 border border-primary/30 text-[10px]">CUSTOM PRICING</Badge>
                  )}
                </div>
                <CardDescription className="text-slate-400 text-xs">
                  White-label, dedicated infrastructure, custom integrations, SLA guarantee, and a pricing model built around your ISP.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <Separator className="bg-slate-700" />
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
                  {[
                    "Everything in Metered",
                    "Full white-label support",
                    "Dedicated account manager",
                    "99.9% uptime SLA",
                    "Custom payment integrations",
                    "Priority 24/7 phone support",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary/80 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  className="w-full bg-primary hover:bg-primary font-bold"
                  onClick={() => setEnterpriseSupportOpen(true)}
                >
                  Contact Support
                </Button>
              </CardFooter>
            </Card>

            <Dialog open={enterpriseSupportOpen} onOpenChange={setEnterpriseSupportOpen}>
              <DialogContent className="max-w-[92vw] sm:max-w-[460px]">
                <DialogHeader>
                  <DialogTitle>Talk to Netily Support</DialogTitle>
                  <DialogDescription>
                    Enterprise and custom plans are configured directly by our support team based on your current billing cycle and ISP requirements.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <a
                    href="https://wa.me/254799538923?text=Hello%20Netily%20Support%2C%20I%20need%20help%20with%20Enterprise%20plan%20billing."
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition-colors"
                  >
                    Continue on WhatsApp
                  </a>
                  <a
                    href="mailto:support@netily.co.ke?subject=Enterprise%20Plan%20Support%20Request"
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 text-sm transition-colors"
                  >
                    Send Email to Support
                  </a>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Single shared dialog for plan selection lives outside the map to avoid controlled/uncontrolled conflicts. */}
          <Dialog open={!!selectingPlan} onOpenChange={(open) => { if (!open) { setSelectingPlan(null); setPlanPayPhone("") } }}>
            <DialogContent className="max-w-[92vw] sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Subscribe to {selectingPlan?.name}</DialogTitle>
                <DialogDescription>
                  {selectingPlan?.is_metered
                      ? `Pay ${kes(getPlanAmount(selectingPlan))} to activate. Monthly invoices use PPPoE footprint + 3% hotspot revenue, or KES 500 if usage is lower.`
                    : `Pay ${kes(getPlanAmount(selectingPlan))} to activate this plan`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">M-Pesa Phone Number</label>
                  <Input
                    placeholder="0712345678"
                    value={planPayPhone}
                    onChange={(e) => setPlanPayPhone(e.target.value)}
                    maxLength={13}
                  />
                  <p className="text-xs text-slate-400 mt-1">You&apos;ll receive an STK push prompt on this number</p>
                </div>
                <Button
                  className="w-full bg-success hover:bg-green-700"
                  disabled={planPayLoading || !planPayPhone.trim()}
                  onClick={handleSelectPlan}
                >
                  {planPayLoading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    : selectingPlan?.is_metered
                      ? `Activate - ${kes(getPlanAmount(selectingPlan))}`
                      : `Pay ${kes(getPlanAmount(selectingPlan))}`
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* 4. RESOURCE USAGE */}
        <TabsContent value="usage" className="space-y-6">
          {usage ? (
            <>
              {/* --- Metered Billing Estimate (only shown for metered plans) --- */}
              {subscription?.plan?.is_metered && (() => {
                const plan = subscription.plan
                const minimumCharge = Number(usage.minimum_charge ?? plan.base_license_fee) || 500
                const pppoeCount = Number((usage as any).pppoe_count ?? usage.subscribers?.current ?? 0)
                const pppoeUnitPrice = Number((usage as any).pppoe_unit_price ?? (plan as any).pppoe_unit_price) || 25
                const hotspotSharePct = Number(usage.hotspot_revenue_share_pct ?? (plan as any).hotspot_revenue_share_pct) || 0
                const hotspotRevenueAccrued = Number(usage.hotspot_revenue_accrued || 0)
                const hotspotRevenueCount = Number(usage.hotspot_revenue_count || 0)
                const hotspotRevenueSource = String(usage.hotspot_revenue_source || "")
                const hotspotRevenueSourceLabel = hotspotRevenueSource === "completed_hotspot_payments"
                  ? "completed payments"
                  : hotspotRevenueSource === "legacy_paid_hotspot_sessions"
                    ? "legacy paid sessions"
                    : "reconciled records"
                const hotspotShareAmount = Number(usage.hotspot_revenue_share_amount || 0)
                const billablePppoe = Number((usage as any).billable_pppoe ?? pppoeCount)
                const pppoeCharge = Number((usage as any).pppoe_charge ?? (billablePppoe * pppoeUnitPrice))
                const usageSubtotal = Number(usage.usage_subtotal ?? (pppoeCharge + hotspotShareAmount))
                const minimumAdjustment = Number(usage.minimum_adjustment ?? Math.max(minimumCharge - usageSubtotal, 0))
                const totalEstimate = Number(usage.total_estimate ?? (usageSubtotal + minimumAdjustment))
                const invoiceAdjustmentAmount = Number(usage.invoice_adjustment_amount || 0)
                const invoiceDiscountAmount = Number(usage.invoice_discount_amount || 0)
                const hasInvoiceAdjustment = invoiceAdjustmentAmount > 0 || invoiceDiscountAmount > 0
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Billing Estimate - Current Cycle</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                      {/* Monthly Minimum */}
                      <Card className="border-primary/20 bg-primary/10/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Monthly Minimum</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-extrabold text-foreground">{kes(minimumCharge)}</p>
                          <p className="text-xs text-slate-500 mt-1">Applies only when usage is lower</p>
                        </CardContent>
                      </Card>

                      {/* PPPoE Clients */}
                      <Card className="border-primary/20 bg-primary/10/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">PPPoE Clients</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-extrabold text-foreground">{kes(pppoeCharge)}</p>
                          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                            <p>Actual: <span className="font-semibold text-slate-700">{pppoeCount}</span> clients</p>
                            <p>Footprint billed: <span className="font-semibold text-slate-700">{billablePppoe}</span> x {kes(pppoeUnitPrice)}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Hotspot Revenue Accrued */}
                      <Card className="border-emerald-200 bg-emerald-50/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-emerald-500 tracking-widest">Hotspot Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-extrabold text-foreground">{kes(hotspotRevenueAccrued)}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {hotspotRevenueCount > 0
                              ? `${hotspotRevenueCount} ${hotspotRevenueSourceLabel}`
                              : "No completed hotspot payments yet"}
                          </p>
                          <p className="text-xs text-emerald-600 mt-0.5">{usage.hotspot_revenue_note || "Reconciled every 8 hrs"}</p>
                        </CardContent>
                      </Card>

                      {/* Netily Hotspot Share */}
                      <Card className="border-warning/20 bg-warning/10/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-warning tracking-widest">Hotspot Share</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-extrabold text-foreground">{kes(hotspotShareAmount)}</p>
                          <p className="text-xs text-slate-500 mt-1">{hotspotSharePct}% of hotspot revenue</p>
                          <p className="text-xs text-slate-400 mt-0.5">Added to next invoice</p>
                        </CardContent>
                      </Card>

                      {/* Total Estimate */}
                      <Card className="border-slate-300 bg-slate-900 text-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Estimated Invoice</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-extrabold">{kes(totalEstimate)}</p>
                          <p className="text-xs text-slate-400 mt-1">Max of usage subtotal or monthly minimum</p>
                          {minimumAdjustment > 0 && (
                            <p className="text-xs text-amber-300 mt-0.5">Includes {kes(minimumAdjustment)} minimum adjustment</p>
                          )}
                          {invoiceAdjustmentAmount > 0 && (
                            <p className="text-xs text-amber-300 mt-0.5">Includes {kes(invoiceAdjustmentAmount)} support-approved custom charge</p>
                          )}
                          {invoiceDiscountAmount > 0 && (
                            <p className="text-xs text-emerald-300 mt-0.5">Includes {kes(invoiceDiscountAmount)} support-approved discount</p>
                          )}
                          {hasInvoiceAdjustment && usage.invoice_number && (
                            <p className="text-xs text-primary/60 mt-0.5">Linked invoice: {usage.invoice_number}</p>
                          )}
                          <p className="text-xs text-primary/80 mt-0.5">Updated every 8 hrs</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )
              })()}

              {subscription?.plan?.is_metered && (() => {
                const previousCycles = cycleBreakdowns.filter((cycle) => cycle.id !== usage.billing_cycle_id)
                if (previousCycles.length === 0) return null

                return (
                  <Card className="border-slate-200">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-bold text-foreground">Previous Billing Cycles</CardTitle>
                          <CardDescription>Historical usage breakdowns tied to this tenant</CardDescription>
                        </div>
                        <Badge variant="outline">{previousCycles.length} shown</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">PPPoE</TableHead>
                            <TableHead className="text-right">Hotspot Share</TableHead>
                            <TableHead className="text-right">Minimum Adj.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Breakdown</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previousCycles.map((cycle) => {
                            const items = cycle.invoice_items || []
                            const hasItems = items.length > 0
                            return (
                              <TableRow key={cycle.id}>
                                <TableCell className="whitespace-nowrap">
                                  <div className="font-medium text-foreground">
                                    {new Date(cycle.start_date).toLocaleDateString('en-KE')} - {new Date(cycle.end_date).toLocaleDateString('en-KE')}
                                  </div>
                                  {cycle.invoice_number && (
                                    <div className="text-xs text-slate-500">{cycle.invoice_number}</div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={cycle.status === 'paid' || cycle.invoice_status === 'PAID' ? 'default' : 'secondary'}>
                                    {(cycle.invoice_status || cycle.status).replaceAll("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  {cycle.pppoe_count} x {kes(cycle.pppoe_unit_price)}
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">{kes(cycle.hotspot_share_amount)}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{kes(cycle.minimum_adjustment)}</TableCell>
                                <TableCell className="text-right font-bold whitespace-nowrap">{kes(cycle.invoice_total ?? cycle.total_charge)}</TableCell>
                                <TableCell className="text-right">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Billing Cycle Breakdown</DialogTitle>
                                        <DialogDescription>
                                          {new Date(cycle.start_date).toLocaleDateString('en-KE', { dateStyle: 'medium' })} - {new Date(cycle.end_date).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                                          {cycle.invoice_number ? ` · ${cycle.invoice_number}` : ''}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="grid gap-3 sm:grid-cols-3">
                                          <div className="rounded-lg border p-3">
                                            <p className="text-xs text-slate-500">PPPoE Users</p>
                                            <p className="text-lg font-bold">{cycle.pppoe_count}</p>
                                            <p className="text-xs text-slate-500">{kes(cycle.pppoe_charge)}</p>
                                          </div>
                                          <div className="rounded-lg border p-3">
                                            <p className="text-xs text-slate-500">Hotspot Revenue</p>
                                            <p className="text-lg font-bold">{kes(cycle.hotspot_revenue)}</p>
                                            <p className="text-xs text-slate-500">{cycle.hotspot_share_pct}% share</p>
                                          </div>
                                          <div className="rounded-lg border p-3">
                                            <p className="text-xs text-slate-500">Invoice Total</p>
                                            <p className="text-lg font-bold">{kes(cycle.invoice_total ?? cycle.total_charge)}</p>
                                            <p className="text-xs text-slate-500">Balance {kes(cycle.invoice_balance ?? 0)}</p>
                                          </div>
                                        </div>

                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Item</TableHead>
                                              <TableHead className="text-right">Qty</TableHead>
                                              <TableHead className="text-right">Unit</TableHead>
                                              <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {hasItems ? items.map((item, index) => (
                                              <TableRow key={`${cycle.id}-${index}`}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right">{Number(item.quantity).toLocaleString('en-KE')}</TableCell>
                                                <TableCell className="text-right">{kes(item.unit_price)}</TableCell>
                                                <TableCell className="text-right font-medium">{kes(item.amount)}</TableCell>
                                              </TableRow>
                                            )) : (
                                              <>
                                                <TableRow>
                                                  <TableCell>PPPoE usage</TableCell>
                                                  <TableCell className="text-right">{cycle.pppoe_count}</TableCell>
                                                  <TableCell className="text-right">{kes(cycle.pppoe_unit_price)}</TableCell>
                                                  <TableCell className="text-right font-medium">{kes(cycle.pppoe_charge)}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                  <TableCell>Hotspot revenue share</TableCell>
                                                  <TableCell className="text-right">{cycle.hotspot_share_pct}%</TableCell>
                                                  <TableCell className="text-right">{kes(cycle.hotspot_revenue)}</TableCell>
                                                  <TableCell className="text-right font-medium">{kes(cycle.hotspot_share_amount)}</TableCell>
                                                </TableRow>
                                                {Number(cycle.minimum_adjustment) > 0 && (
                                                  <TableRow>
                                                    <TableCell>Minimum charge adjustment</TableCell>
                                                    <TableCell className="text-right">1</TableCell>
                                                    <TableCell className="text-right">{kes(cycle.minimum_adjustment)}</TableCell>
                                                    <TableCell className="text-right font-medium">{kes(cycle.minimum_adjustment)}</TableCell>
                                                  </TableRow>
                                                )}
                                              </>
                                            )}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* --- Resource Usage --- */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">
                      Active Subscribers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{usage.subscribers?.current || 0} <span className="text-slate-400 font-normal">used</span></span>
                      <span className="text-slate-400 font-normal">
                        {usage.subscribers?.limit === null ? '8' : usage.subscribers?.limit} limit
                      </span>
                    </div>
                    {usage.subscribers?.limit !== null && usage.subscribers?.limit !== undefined && usage.subscribers.limit > 0 && (
                      <Progress 
                        value={((usage.subscribers.current || 0) / (usage.subscribers.limit as number)) * 100} 
                        className="h-1.5" 
                      />
                    )}
                  </CardContent>
                </Card>
                
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">
                      Managed Routers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{usage.routers?.current || 0} <span className="text-slate-400 font-normal">used</span></span>
                      <span className="text-slate-400 font-normal">
                        {usage.routers?.limit === null ? '8' : usage.routers?.limit} limit
                      </span>
                    </div>
                    {usage.routers?.limit !== null && usage.routers?.limit !== undefined && usage.routers.limit > 0 && (
                      <Progress 
                        value={((usage.routers.current || 0) / (usage.routers.limit as number)) * 100} 
                        className="h-1.5" 
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">
                      Staff Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{usage.staff?.current || 0} <span className="text-slate-400 font-normal">used</span></span>
                      <span className="text-slate-400 font-normal">
                        {usage.staff?.limit === null ? '8' : usage.staff?.limit} limit
                      </span>
                    </div>
                    {usage.staff?.limit !== null && usage.staff?.limit !== undefined && usage.staff.limit > 0 && (
                      <Progress 
                        value={((usage.staff.current || 0) / (usage.staff.limit as number)) * 100} 
                        className="h-1.5" 
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200 bg-slate-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Usage resets every billing cycle</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Your resource usage counts reset at the start of each new 30-day billing period.
                        {subscription?.plan?.is_metered && (
                          <span className="block mt-2 text-primary">
                            Metered usage beyond plan limits will be calculated and added to your next invoice.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="py-12 text-center border-2 border-dashed rounded-xl">
              <p className="text-slate-400">No usage data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Wrap in Suspense to satisfy Next.js useSearchParams requirement
export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" /> 
        <span>Loading billing information...</span>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}
