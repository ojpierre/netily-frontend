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

// 1. THIS COMPONENT CONTAINS THE ACTUAL LOGIC
function BillingContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
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
                      <p className="text-[10px] text-slate-400 uppercase font-black">Next Invoice Date</p>
                      <p className="font-bold">{new Date(subscription.current_period_end).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black">Base Monthly Fee</p>
                      <p className="font-bold">{kes(subscription.plan.price)}</p>
                    </div>
                  </div>
                  <Separator />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black mb-4">Plan Limits</p>
                  <ul className="space-y-3">
                    <li className="text-sm flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> {subscription.plan.max_subscribers || 'Unlimited'} Subscribers</li>
                    <li className="text-sm flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> {subscription.plan.max_routers || 'Unlimited'} Routers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="py-20 text-center border-2 border-dashed rounded-xl"><p className="text-slate-400">No active subscription found.</p></div>
          )}
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle>Billing History</CardTitle></CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="py-16 text-center text-slate-400"><Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No invoices generated yet.</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-bold text-blue-600">{inv.invoice_number}</TableCell>
                        <TableCell>{new Date(inv.invoice_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold">{kes(inv.total_amount)}</TableCell>
                        <TableCell><Badge variant={inv.status === 'paid' ? 'default' : 'destructive'}>{inv.status}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="outline" size="sm"><Download className="w-3 h-3 mr-2" /> PDF</Button></TableCell>
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
              <Card key={plan.id} className={plan.code === subscription?.plan.code ? 'border-blue-600 border-2 shadow-md' : 'border-slate-200'}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                  <div className="mt-4">{getPlanPriceDisplay(plan)}</div>
                </CardHeader>
                <CardFooter>
                  <Button variant={plan.code === subscription?.plan.code ? 'secondary' : 'default'} className="w-full font-bold" disabled={plan.code === subscription?.plan.code}>
                    {plan.code === subscription?.plan.code ? 'Currently Active' : 'Select Plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* RESOURCE USAGE TAB */}
        <TabsContent value="usage" className="space-y-6">
          {usage ? (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-slate-400">Subscribers</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{usage.subscribers?.current || 0} used</span>
                    <span>{usage.subscribers?.limit === null ? '∞' : usage.subscribers?.limit} limit</span>
                  </div>
                  {usage.subscribers?.limit !== null && usage.subscribers?.limit !== undefined && usage.subscribers.limit > 0 && (
                    <Progress value={((usage.subscribers.current || 0) / (usage.subscribers.limit as number)) * 100} className="h-1.5" />
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-slate-400">Routers</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{usage.routers?.current || 0} used</span>
                    <span>{usage.routers?.limit === null ? '∞' : usage.routers?.limit} limit</span>
                  </div>
                  {usage.routers?.limit !== null && usage.routers?.limit !== undefined && usage.routers.limit > 0 && (
                    <Progress value={((usage.routers.current || 0) / (usage.routers.limit as number)) * 100} className="h-1.5" />
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-slate-400">Staff</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{usage.staff?.current || 0} used</span>
                    <span>{usage.staff?.limit === null ? '∞' : usage.staff?.limit} limit</span>
                  </div>
                  {usage.staff?.limit !== null && usage.staff?.limit !== undefined && usage.staff.limit > 0 && (
                    <Progress value={((usage.staff.current || 0) / (usage.staff.limit as number)) * 100} className="h-1.5" />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed rounded-xl text-slate-400">No usage data.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 2. THIS IS THE EXPORTED PAGE WRAPPER WITH SUSPENSE
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