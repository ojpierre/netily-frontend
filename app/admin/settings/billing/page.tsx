"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Zap, Check, Users, Wifi, Shield, Clock, Download, Receipt, AlertTriangle, Loader2
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
  const [hasMounted, setHasMounted] = useState(false) // Prevents Hydration Errors
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null)
  const [apiPlans, setApiPlans] = useState<NetilyPlan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<ApiUsageStats | null>(null)

  useEffect(() => {
    setHasMounted(true)
    const loadBillingData = async () => {
      setIsLoading(true)
      try {
        const [plansData, subData, usageData, invoicesData] = await Promise.all([
          adminApi.getNetilyPlans(),
          adminApi.getCurrentSubscription(),
          adminApi.getUsageStats(),
          adminApi.getInvoices({ category: 'subscription' }) 
        ])
        setApiPlans(plansData || [])
        setSubscription(subData)
        setUsage(usageData)
        setInvoices(invoicesData.results || [])
      } catch (error) {
        console.error("Billing load error:", error)
        toast.error("Failed to load billing records")
      } finally {
        setIsLoading(false)
      }
    }
    loadBillingData()
  }, [])

  if (!hasMounted || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const getPlanPriceDisplay = (plan: NetilyPlan) => {
    if (plan.is_metered) {
      return (
        <div className="flex flex-col">
          <span className="text-2xl font-black">{kes(plan.price)}</span>
          <span className="text-[10px] text-blue-600 font-bold uppercase">Base + Metered Usage</span>
        </div>
      )
    }
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black">{kes(plan.price)}</span>
        <span className="text-sm text-slate-500">/mo</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-600">Review your subscription status and official monthly invoices</p>
      </div>

      {subscription?.status === "expired" && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Subscription Expired</AlertTitle>
          <AlertDescription>Your account is currently locked. Please settle outstanding invoices to resume service.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="usage">Resource Usage</TabsTrigger>
        </TabsList>

        {/* CURRENT PLAN TAB */}
        <TabsContent value="current">
          {subscription ? (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" /> {subscription.plan.name}
                  </CardTitle>
                  <CardDescription>{subscription.plan.description}</CardDescription>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'} className="capitalize px-4 py-1">
                  {subscription.status}
                </Badge>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-12 pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Next Invoice Date</p>
                      <p className="font-bold text-slate-900">{new Date(subscription.current_period_end).toLocaleDateString('en-KE', { dateStyle: 'long' })}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Base Monthly Fee</p>
                      <p className="font-bold text-slate-900">{kes(subscription.plan.price)}</p>
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
                      {subscription.plan.max_subscribers || 'Unlimited'} Max Subscribers
                    </li>
                    <li className="text-sm flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500" /> 
                      {subscription.plan.max_routers || 'Unlimited'} Managed Routers
                    </li>
                    <li className="text-sm flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500" /> 
                      {subscription.plan.max_staff_users || 'Unlimited'} Staff Accounts
                    </li>
                    {subscription.plan.features?.api_access && (
                      <li className="text-sm flex items-center gap-3">
                        <Check className="w-4 h-4 text-emerald-500" /> Full API Access
                      </li>
                    )}
                    {subscription.plan.features?.white_label && (
                      <li className="text-sm flex items-center gap-3">
                        <Check className="w-4 h-4 text-emerald-500" /> White-label Solution
                      </li>
                    )}
                    {subscription.plan.features?.priority_support && (
                      <li className="text-sm flex items-center gap-3">
                        <Check className="w-4 h-4 text-emerald-500" /> Priority Support
                      </li>
                    )}
                    {subscription.plan.features?.multi_location && (
                      <li className="text-sm flex items-center gap-3">
                        <Check className="w-4 h-4 text-emerald-500" /> Multi-location Support
                      </li>
                    )}
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

        {/* INVOICES TAB */}
        <TabsContent value="invoices">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Billing History</CardTitle>
              <CardDescription>Official invoices generated at the end of each 30-day subscription cycle</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
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
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Invoice Number</TableHead>
                      <TableHead className="font-bold text-slate-900">Billing Date</TableHead>
                      <TableHead className="font-bold text-slate-900">Period</TableHead>
                      <TableHead className="font-bold text-slate-900">Total Amount</TableHead>
                      <TableHead className="font-bold text-slate-900">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-900">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-mono font-bold text-blue-600">{inv.invoice_number}</TableCell>
                        <TableCell>{new Date(inv.invoice_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {inv.period_start && inv.period_end ? (
                            <>
                              {new Date(inv.period_start).toLocaleDateString()} - {new Date(inv.period_end).toLocaleDateString()}
                            </>
                          ) : (
                            'Monthly Service'
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">{kes(inv.total_amount)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={inv.status === 'paid' ? 'default' : 'destructive'} 
                            className="uppercase text-[9px] font-black tracking-tighter"
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8">
                            <Download className="w-3 h-3 mr-2" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AVAILABLE PLANS TAB */}
        <TabsContent value="plans">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apiPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`${
                  plan.code === subscription?.plan.code 
                    ? 'border-blue-600 border-2 shadow-md ring-1 ring-blue-600/10' 
                    : 'border-slate-200'
                } transition-all hover:shadow-lg`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.code === subscription?.plan.code && (
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
                      {plan.max_staff_users || 'Unlimited'} Staff Accounts
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
                  <Button 
                    variant={plan.code === subscription?.plan.code ? 'secondary' : 'default'} 
                    className="w-full font-bold" 
                    disabled={plan.code === subscription?.plan.code}
                  >
                    {plan.code === subscription?.plan.code ? 'Currently Active' : 'Select Plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* RESOURCE USAGE TAB - FIXED with null checks instead of 'unlimited' strings */}
        <TabsContent value="usage" className="space-y-6">
          {usage ? (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Active Subscribers */}
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
                        {/* Changed 'unlimited' to null check */}
                        {usage.subscribers?.limit === null ? '∞' : usage.subscribers?.limit} limit
                      </span>
                    </div>
                    {/* Changed 'unlimited' to null check and ensured limit is a number for the calculation */}
                    {usage.subscribers?.limit !== null && usage.subscribers?.limit !== undefined && (
                      <Progress 
                        value={((usage.subscribers.current || 0) / (usage.subscribers.limit as number)) * 100} 
                        className="h-1.5" 
                      />
                    )}
                  </CardContent>
                </Card>
                
                {/* Managed Routers */}
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
                        {/* Changed 'unlimited' to null check */}
                        {usage.routers?.limit === null ? '∞' : usage.routers?.limit} limit
                      </span>
                    </div>
                    {/* Changed 'unlimited' to null check */}
                    {usage.routers?.limit !== null && usage.routers?.limit !== undefined && (
                      <Progress 
                        value={((usage.routers.current || 0) / (usage.routers.limit as number)) * 100} 
                        className="h-1.5" 
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Staff Accounts */}
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
                        {/* Changed 'unlimited' to null check */}
                        {usage.staff?.limit === null ? '∞' : usage.staff?.limit} limit
                      </span>
                    </div>
                    {/* Changed 'unlimited' to null check */}
                    {usage.staff?.limit !== null && usage.staff?.limit !== undefined && (
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
                        {subscription?.plan.is_metered && (
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