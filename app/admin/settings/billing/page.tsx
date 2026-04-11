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
import type { NetilyPlan, CompanySubscription, UsageStats as ApiUsageStats, Invoice } from "@/lib/types"

const kes = (amount: number | string) => 
  new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES", maximumFractionDigits: 0,
  }).format(Number(amount))

// Separate component to handle search params safely within Suspense
function BillingContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null)
  const [apiPlans, setApiPlans] = useState<NetilyPlan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<ApiUsageStats | null>(null)
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null)
  const [payPhone, setPayPhone] = useState("")
  const [payLoading, setPayLoading] = useState(false)
  const [selectingPlan, setSelectingPlan] = useState<NetilyPlan | null>(null)
  const [planPayPhone, setPlanPayPhone] = useState("")
  const [planPayLoading, setPlanPayLoading] = useState(false)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("")

  const loadBillingData = async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true)
    try {
      adminApi.invalidateSubscriptionCache()
      const [plansData, subData, usageData, invoicesData] = await Promise.all([
        adminApi.getNetilyPlans(),
        adminApi.getCurrentSubscription(),
        adminApi.getUsageStats(),
        // FIX: Use search filter for NET-BILL prefix to isolate Netily platform invoices
        adminApi.getInvoices({ search: 'NET-BILL' })
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

      // Normalize flat backend response → nested UsageStats format
      if (usageData && !(usageData as any).subscribers) {
        const raw = usageData as any
        setUsage({
          subscribers: { current: raw.current_subscribers ?? 0, limit: raw.max_subscribers === 0 ? null : (raw.max_subscribers ?? null), percentage: raw.subscribers_usage_percent ?? null },
          routers: { current: raw.current_routers ?? 0, limit: raw.max_routers === 0 ? null : (raw.max_routers ?? null), percentage: raw.routers_usage_percent ?? null },
          staff: { current: raw.current_staff ?? 0, limit: raw.max_staff === 0 ? null : (raw.max_staff ?? null), percentage: raw.staff_usage_percent ?? null },
          is_over_limit: raw.is_near_limit ?? false,
          warnings: raw.warnings ?? [],
        } as ApiUsageStats)
      } else {
        setUsage(usageData)
      }

      // FIX 2: Safe Invoice extraction
      setInvoices(invoicesData?.results || [])
      
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

  // ─── Poll pending payment status ─────────────────────────────────────────
  useEffect(() => {
    if (!pendingPaymentId) return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 24 // ~2 minutes at 5s intervals

    const poll = async () => {
      if (cancelled || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          setPaymentStatus("")
          setPendingPaymentId(null)
          toast.info("Payment is still processing. It will activate automatically once confirmed.")
        }
        return
      }
      attempts++
      try {
        const res = await adminApi.checkSubscriptionPaymentStatus(pendingPaymentId)
        if (cancelled) return

        if (res.status === 'completed') {
          setPaymentStatus("")
          setPendingPaymentId(null)
          toast.success("Payment confirmed! Your plan is now active.", { duration: 6000 })
          loadBillingData()
          return
        }
        if (res.status === 'failed' || res.status === 'cancelled') {
          setPaymentStatus("")
          setPendingPaymentId(null)
          toast.error(res.message || "Payment failed. Please try again.")
          return
        }
        // Still pending — poll again
        setTimeout(poll, 5000)
      } catch {
        if (!cancelled) setTimeout(poll, 5000)
      }
    }

    setTimeout(poll, 4000) // first poll after 4s (give user time to enter PIN)
    return () => { cancelled = true }
  }, [pendingPaymentId])

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

  // Helper for Plan Price — use Number() so string "0.00" is treated as falsy
  const getPlanPriceDisplay = (plan: NetilyPlan) => {
    if (plan?.is_metered) {
      const basePrice = Number(plan.base_license_fee) || Number(plan.price_monthly) || 0
      return (
        <div className="flex flex-col">
          <span className="text-2xl font-black">{kes(basePrice)}</span>
          <span className="text-[10px] text-blue-600 font-bold uppercase">Base + Metered Usage</span>
        </div>
      )
    }
    const price = Number(plan?.price_monthly) || Number(plan?.price) || 0
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black">{kes(price)}</span>
        <span className="text-sm text-slate-500">/mo</span>
      </div>
    )
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
    const invoiceAmount = inv ? Number(inv.total_amount) : 0
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
        setPaymentStatus("Waiting for M-Pesa confirmation…")
      }
    } catch (error: any) {
      toast.error(error?.message || "Payment initiation failed")
    } finally {
      setPayLoading(false)
    }
  }

  // Derive display amount for a plan (UI only — backend calculates real amount)
  const getPlanAmount = (plan: NetilyPlan | null) => {
    if (!plan) return 0
    if (plan.is_metered) return Number(plan.base_license_fee) || 0
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
        setPaymentStatus("Waiting for M-Pesa confirmation…")
      }
    } catch (error: any) {
      toast.error(error?.message || "Payment initiation failed")
    } finally {
      setPlanPayLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
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
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <AlertTitle className="text-blue-800">Processing Payment</AlertTitle>
          <AlertDescription className="text-blue-700">
            {paymentStatus || "Waiting for M-Pesa confirmation…"} This page will update automatically once your payment is confirmed.
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
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" /> {subscription.plan?.name || 'Standard Plan'}
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
                      <p className="font-bold text-slate-900">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-KE', { dateStyle: 'long' }) : '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Base Monthly Fee</p>
                      <p className="font-bold text-slate-900">{kes(subscription.plan?.price_monthly || subscription.plan?.base_license_fee || subscription.plan?.price || 0)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your plan is billed every 30 days. Invoices include your base fee plus any metered PPPoE or Hotspot usage accumulated during the period.
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
            </Card>
          ) : (
            <div className="py-20 text-center border-2 border-dashed rounded-xl">
              <p className="text-slate-400">No active subscription found.</p>
            </div>
          )}
        </TabsContent>

        {/* 2. INVOICES - Now with correct dates and View Breakdown Modal */}
        <TabsContent value="invoices">
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
                  <p className="text-slate-900 font-medium">No invoices yet</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                    Finalized bills will appear here once your current 30-day billing cycle completes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-900 whitespace-nowrap">Invoice Number</TableHead>
                      <TableHead className="font-bold text-slate-900 whitespace-nowrap">Billing Date</TableHead>
                      <TableHead className="font-bold text-slate-900 whitespace-nowrap hidden sm:table-cell">Period</TableHead>
                      <TableHead className="font-bold text-slate-900 whitespace-nowrap">Total Amount</TableHead>
                      <TableHead className="font-bold text-slate-900 whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-900 whitespace-nowrap">Action</TableHead>
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
                          <TableCell className="font-mono font-bold text-blue-600">{inv?.invoice_number || '---'}</TableCell>
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
                          <TableCell className="font-bold text-slate-900">{kes(inv?.total_amount || 0)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={inv?.status === 'paid' ? 'default' : 'destructive'} 
                              className="uppercase text-[9px] font-black tracking-tighter"
                            >
                              {inv?.status || 'pending'}
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
                                    <span className="font-black text-xl text-blue-600">{kes(inv?.total_amount || 0)}</span>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleDownloadPDF(inv)}>
                              <Download className="w-3 h-3 mr-2" /> PDF
                            </Button>
                            {inv?.status !== 'paid' && (
                              <Dialog open={payingInvoiceId === inv.id} onOpenChange={(open) => { if (!open) { setPayingInvoiceId(null); setPayPhone("") } }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="ml-2 h-8 bg-green-600 hover:bg-green-700" onClick={() => setPayingInvoiceId(inv.id)}>
                                    <Phone className="w-3 h-3 mr-2" /> Pay
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[400px]">
                                  <DialogHeader>
                                    <DialogTitle>Pay Invoice {inv.invoice_number}</DialogTitle>
                                    <CardDescription>Amount: {kes(inv?.total_amount || 0)}</CardDescription>
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
                                      className="w-full bg-green-600 hover:bg-green-700"
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
            {Array.isArray(apiPlans) && apiPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`${
                  plan.code === subscription?.plan?.code 
                    ? 'border-blue-600 border-2 shadow-md ring-1 ring-blue-600/10' 
                    : 'border-slate-200'
                } transition-all hover:shadow-lg`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.code === subscription?.plan?.code && (
                      <Badge className="bg-blue-600 text-[10px] font-bold">CURRENT PLAN</Badge>
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
                  {plan.is_metered && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">
                        Metered billing: Pay only for what you use beyond base limits
                      </p>
                    </div>
                  )}
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
          </div>

          {/* Single shared dialog for plan selection — lives outside the map to avoid controlled/uncontrolled conflicts */}
          <Dialog open={!!selectingPlan} onOpenChange={(open) => { if (!open) { setSelectingPlan(null); setPlanPayPhone("") } }}>
            <DialogContent className="max-w-[92vw] sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Subscribe to {selectingPlan?.name}</DialogTitle>
                <DialogDescription>
                  {selectingPlan?.is_metered
                    ? `Base fee ${kes(getPlanAmount(selectingPlan))} + metered usage. You'll be charged based on actual usage.`
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
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={planPayLoading || !planPayPhone.trim()}
                  onClick={handleSelectPlan}
                >
                  {planPayLoading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    : selectingPlan?.is_metered
                      ? `Subscribe — ${kes(getPlanAmount(selectingPlan))} base`
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
                        {usage.subscribers?.limit === null ? '∞' : usage.subscribers?.limit} limit
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
                        {usage.routers?.limit === null ? '∞' : usage.routers?.limit} limit
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
                        {usage.staff?.limit === null ? '∞' : usage.staff?.limit} limit
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
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Usage resets every billing cycle</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Your resource usage counts reset at the start of each new 30-day billing period.
                        {subscription?.plan?.is_metered && (
                          <span className="block mt-2 text-blue-600">
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
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" /> 
        <span>Loading billing information...</span>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}