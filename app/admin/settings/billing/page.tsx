"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Users,
  Wifi,
  BarChart3,
  HeadphonesIcon,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  Loader2,
  Phone,
  ArrowRight,
  Receipt,
  Download,
  ExternalLink,
  Smartphone,
  Building,
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { adminApi } from "@/lib/admin-api"
import type { NetilyPlan, CompanySubscription, UsageStats as ApiUsageStats } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

// ==========================================
// TYPES
// ==========================================

interface PricingPlan {
  id: string
  name: string
  price: number
  period: "monthly" | "yearly"
  description: string
  features: string[]
  limits: {
    subscribers: number | "unlimited"
    routers: number | "unlimited"
    staff: number | "unlimited"
  }
  popular?: boolean
  badge?: string
}

interface Subscription {
  id: number
  plan: PricingPlan
  status: "active" | "trial" | "expired" | "cancelled" | "past_due"
  current_period_start: string
  current_period_end: string
  trial_end?: string
  cancel_at_period_end: boolean
}

interface PaymentHistory {
  id: number
  date: string
  amount: number
  status: "completed" | "pending" | "failed" | "refunded"
  method: string
  reference: string
  invoice_url?: string
}

interface UsageStats {
  subscribers: { used: number; limit: number | "unlimited" }
  routers: { used: number; limit: number | "unlimited" }
  staff: { used: number; limit: number | "unlimited" }
}

type PaymentMethod = "mpesa_stk" | "mpesa_paybill" | "bank_transfer"

// ==========================================
// PRICING DATA
// ==========================================

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 2999,
    period: "monthly",
    description: "Perfect for small ISPs getting started",
    features: [
      "Up to 100 subscribers",
      "3 Routers",
      "2 Staff accounts",
      "Basic billing & invoicing",
      "Email support",
      "M-Pesa integration",
    ],
    limits: {
      subscribers: 100,
      routers: 3,
      staff: 2,
    },
  },
  {
    id: "professional",
    name: "Professional",
    price: 7999,
    period: "monthly",
    description: "For growing ISP businesses",
    popular: true,
    badge: "Most Popular",
    features: [
      "Up to 500 subscribers",
      "10 Routers",
      "10 Staff accounts",
      "Advanced billing & FUP",
      "Priority support",
      "All payment integrations",
      "SMS notifications",
      "Custom captive portal",
      "API access",
    ],
    limits: {
      subscribers: 500,
      routers: 10,
      staff: 10,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 19999,
    period: "monthly",
    description: "For large-scale operations",
    badge: "Best Value",
    features: [
      "Unlimited subscribers",
      "Unlimited Routers",
      "Unlimited Staff accounts",
      "Full automation suite",
      "24/7 dedicated support",
      "White-label solution",
      "Advanced API access",
      "Multi-branch support",
      "Custom integrations",
      "SLA guarantee",
    ],
    limits: {
      subscribers: "unlimited",
      routers: "unlimited",
      staff: "unlimited",
    },
  },
]

const PAYMENT_METHODS = [
  {
    id: "mpesa_stk" as PaymentMethod,
    name: "M-Pesa STK Push",
    description: "Pay directly from your phone",
    icon: Smartphone,
  },
  {
    id: "mpesa_paybill" as PaymentMethod,
    name: "M-Pesa Paybill",
    description: "Pay via Paybill number",
    icon: Phone,
  },
  {
    id: "bank_transfer" as PaymentMethod,
    name: "Bank Transfer",
    description: "Pay via bank deposit",
    icon: Building,
  },
]

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getStatusBadge(status: Subscription["status"]) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700">Active</Badge>
    case "trial":
      return <Badge className="bg-blue-100 text-blue-700">Free Trial</Badge>
    case "expired":
      return <Badge variant="destructive">Expired</Badge>
    case "cancelled":
      return <Badge variant="secondary">Cancelled</Badge>
    case "past_due":
      return <Badge className="bg-amber-100 text-amber-700">Past Due</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// ==========================================
// PAYMENT DIALOG COMPONENT
// ==========================================

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPlan: PricingPlan | null
  onSuccess: () => void
}

function PaymentDialog({ open, onOpenChange, selectedPlan, onSuccess }: PaymentDialogProps) {
  const [step, setStep] = useState<"method" | "details" | "processing" | "result">("method")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa_stk")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean
    message: string
    reference?: string
    paybillNumber?: string
    accountNumber?: string
    bankDetails?: {
      bank_name: string
      account_name: string
      account_number: string
      branch: string
    }
  } | null>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("method")
      setPaymentMethod("mpesa_stk")
      setPhoneNumber("")
      setPaymentResult(null)
    }
  }, [open])

  const handleProceed = () => {
    if (paymentMethod === "mpesa_stk") {
      setStep("details")
    } else {
      initiatePayment()
    }
  }

  const initiatePayment = async () => {
    if (!selectedPlan) return

    setIsProcessing(true)
    setStep("processing")

    try {
      if (paymentMethod === "mpesa_stk") {
        // Use real API for STK push
        const response = await adminApi.initiateSubscriptionPayment(
          typeof selectedPlan.id === 'string' ? parseInt(selectedPlan.id) : selectedPlan.id as number
        )
        
        setPaymentResult({
          success: true,
          message: response.message || "STK Push sent! Check your phone and enter your M-Pesa PIN to complete payment.",
          reference: response.checkout_request_id,
        })
      } else if (paymentMethod === "mpesa_paybill") {
        // For Paybill, we just show the payment details
        setPaymentResult({
          success: true,
          message: "Use the details below to make your payment via M-Pesa Paybill.",
          paybillNumber: "247247",
          accountNumber: `NETILY-${String(selectedPlan.id).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        })
      } else {
        // Bank transfer details
        setPaymentResult({
          success: true,
          message: "Use the bank details below to make your payment.",
          bankDetails: {
            bank_name: "Equity Bank",
            account_name: "Netily Technologies Ltd",
            account_number: "0123456789012",
            branch: "Westlands",
          },
        })
      }

      setStep("result")
    } catch (error) {
      console.error("Payment failed:", error)
      setPaymentResult({
        success: false,
        message: "Payment initiation failed. Please try again.",
      })
      setStep("result")
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  if (!selectedPlan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Subscribe to {selectedPlan.name}
          </DialogTitle>
          <DialogDescription>
            {formatCurrency(selectedPlan.price)}/month
          </DialogDescription>
        </DialogHeader>

        {/* Step: Select Payment Method */}
        {step === "method" && (
          <div className="space-y-4">
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              className="space-y-3"
            >
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <RadioGroupItem value={method.id} />
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        paymentMethod === method.id
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-slate-500">{method.description}</p>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleProceed}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Enter Phone Number (STK Push) */}
        {step === "details" && paymentMethod === "mpesa_stk" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500">
                Enter the phone number registered with M-Pesa
              </p>
            </div>

            <Alert>
              <Smartphone className="w-4 h-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                You&apos;ll receive an STK push notification on your phone. Enter your M-Pesa PIN
                to complete the payment of {formatCurrency(selectedPlan.price)}.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("method")}>
                Back
              </Button>
              <Button
                onClick={initiatePayment}
                disabled={!phoneNumber || phoneNumber.length < 10}
              >
                Pay {formatCurrency(selectedPlan.price)}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Processing */}
        {step === "processing" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <p className="font-medium">Processing Payment</p>
              <p className="text-sm text-slate-500">
                {paymentMethod === "mpesa_stk"
                  ? "Sending STK Push to your phone..."
                  : "Generating payment details..."}
              </p>
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && paymentResult && (
          <div className="space-y-4">
            {paymentResult.success ? (
              <>
                <div className="text-center py-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                      paymentMethod === "mpesa_stk"
                        ? "bg-green-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {paymentMethod === "mpesa_stk" ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <Receipt className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <p className="mt-4 font-medium">
                    {paymentMethod === "mpesa_stk"
                      ? "Check Your Phone!"
                      : "Payment Instructions"}
                  </p>
                  <p className="text-sm text-slate-500">{paymentResult.message}</p>
                </div>

                {/* Paybill Details */}
                {paymentResult.paybillNumber && (
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Paybill Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">
                          {paymentResult.paybillNumber}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(paymentResult.paybillNumber!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {paymentResult.accountNumber}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(paymentResult.accountNumber!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Amount</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(selectedPlan.price)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {paymentResult.bankDetails && (
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Bank</span>
                      <span className="font-medium">{paymentResult.bankDetails.bank_name}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Account Name</span>
                      <span className="font-medium">
                        {paymentResult.bankDetails.account_name}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {paymentResult.bankDetails.account_number}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            copyToClipboard(paymentResult.bankDetails!.account_number)
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Branch</span>
                      <span className="font-medium">{paymentResult.bankDetails.branch}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Amount</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(selectedPlan.price)}
                      </span>
                    </div>
                  </div>
                )}

                {paymentResult.reference && (
                  <p className="text-xs text-slate-500 text-center">
                    Reference: {paymentResult.reference}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="mt-4 font-medium text-red-600">Payment Failed</p>
                <p className="text-sm text-slate-500">{paymentResult.message}</p>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>
                {paymentResult.success ? "Done" : "Close"}
              </Button>
              {!paymentResult.success && (
                <Button variant="outline" onClick={() => setStep("method")}>
                  Try Again
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// MAIN BILLING PAGE COMPONENT
// ==========================================

export default function BillingPage() {
  const searchParams = useSearchParams()
  const preselectedPlan = searchParams.get("plan")

  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [apiPlans, setApiPlans] = useState<NetilyPlan[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  // Convert API plan to display format
  const convertApiPlan = (plan: NetilyPlan): PricingPlan => ({
    id: plan.code,
    name: plan.name,
    price: parseFloat(plan.price),
    period: "monthly",
    description: plan.description,
    features: [
      `Up to ${plan.max_subscribers ?? 'Unlimited'} subscribers`,
      `${plan.max_routers ?? 'Unlimited'} Routers`,
      `${plan.max_staff_users ?? 'Unlimited'} Staff accounts`,
      ...(plan.features.sms_notifications ? ['SMS notifications'] : []),
      ...(plan.features.email_notifications ? ['Email notifications'] : []),
      ...(plan.features.api_access ? ['API access'] : []),
      ...(plan.features.custom_branding ? ['Custom branding'] : []),
      ...(plan.features.white_label ? ['White-label solution'] : []),
      ...(plan.features.priority_support ? ['Priority support'] : []),
      ...(plan.features.hotspot_portal ? ['Hotspot portal'] : []),
      ...(plan.features.analytics_dashboard ? ['Analytics dashboard'] : []),
      ...(plan.features.multi_location ? ['Multi-location support'] : []),
    ],
    limits: {
      subscribers: plan.max_subscribers ?? "unlimited",
      routers: plan.max_routers ?? "unlimited",
      staff: plan.max_staff_users ?? "unlimited",
    },
    popular: plan.code === 'professional',
    badge: plan.code === 'professional' ? 'Most Popular' : plan.code === 'enterprise' ? 'Best Value' : undefined,
  })

  // Load billing data
  useEffect(() => {
    const loadBillingData = async () => {
      setIsLoading(true)
      try {
        // Load data from API
        const [plansData, subData, usageData] = await Promise.all([
          adminApi.getNetilyPlans(),
          adminApi.getCurrentSubscription(),
          adminApi.getUsageStats(),
        ])

        // Set plans from API
        if (plansData && plansData.length > 0) {
          setApiPlans(plansData)
        }

        // Convert API subscription to local format
        if (subData) {
          const planData = convertApiPlan(subData.plan)
          setSubscription({
            id: subData.id,
            plan: planData,
            status: subData.status,
            current_period_start: subData.current_period_start,
            current_period_end: subData.current_period_end,
            trial_end: subData.trial_ends_at ?? undefined,
            cancel_at_period_end: false,
          })
        } else {
          // Fallback for trial users without subscription record
          const trialStartDate = localStorage.getItem("trialStartDate")
          const trialEnd = trialStartDate
            ? new Date(new Date(trialStartDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

          setSubscription({
            id: 0,
            plan: PRICING_PLANS[1],
            status: "trial",
            current_period_start: trialStartDate || new Date().toISOString(),
            current_period_end: trialEnd,
            trial_end: trialEnd,
            cancel_at_period_end: false,
          })
        }

        // Convert API usage to local format
        if (usageData) {
          setUsage({
            subscribers: { 
              used: usageData.subscribers.current, 
              limit: usageData.subscribers.limit ?? "unlimited" 
            },
            routers: { 
              used: usageData.routers.current, 
              limit: usageData.routers.limit ?? "unlimited" 
            },
            staff: { 
              used: usageData.staff.current, 
              limit: usageData.staff.limit ?? "unlimited" 
            },
          })
        } else {
          setUsage({
            subscribers: { used: 0, limit: 500 },
            routers: { used: 0, limit: 10 },
            staff: { used: 0, limit: 10 },
          })
        }

        setPaymentHistory([])
      } catch (error) {
        console.error("Failed to load billing data:", error)
        toast.error("Failed to load billing information")
      } finally {
        setIsLoading(false)
      }
    }

    loadBillingData()
  }, [])

  // Get display plans (from API or fallback)
  const displayPlans = apiPlans.length > 0 
    ? apiPlans.map(convertApiPlan) 
    : PRICING_PLANS

  // Handle preselected plan from URL
  useEffect(() => {
    if (preselectedPlan && displayPlans.length > 0) {
      const plan = displayPlans.find((p) => p.id === preselectedPlan)
      if (plan) {
        setSelectedPlan(plan)
        setIsPaymentDialogOpen(true)
      }
    }
  }, [preselectedPlan, displayPlans])

  const daysRemaining = useMemo(() => {
    if (!subscription) return 0
    return getDaysRemaining(subscription.current_period_end)
  }, [subscription])

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan)
    setIsPaymentDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-600">
          Manage your Netily subscription and payment methods
        </p>
      </div>

      {/* Trial/Subscription Alert */}
      {subscription?.status === "trial" && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="w-4 h-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Free Trial Active</AlertTitle>
          <AlertDescription className="text-blue-700">
            You have <strong>{daysRemaining} days</strong> remaining on your free trial.
            Subscribe to a plan to continue using Netily after your trial ends.
          </AlertDescription>
        </Alert>
      )}

      {subscription?.status === "expired" && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Subscription Expired</AlertTitle>
          <AlertDescription>
            Your subscription has expired. Please renew to continue using Netily.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {displayPlans.map((plan) => {
              const isCurrentPlan = subscription?.plan.id === plan.id
              const isTrial = subscription?.status === "trial"

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    plan.popular
                      ? "border-blue-600 border-2 shadow-lg"
                      : isCurrentPlan
                      ? "border-green-600 border-2"
                      : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-4 right-4">
                      <Badge className={plan.popular ? "bg-blue-600" : "bg-slate-600"}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  {isCurrentPlan && !isTrial && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-600">Current Plan</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {plan.id === "enterprise" && <Crown className="w-5 h-5 text-amber-500" />}
                      {plan.name}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>
                          {plan.limits.subscribers === "unlimited"
                            ? "Unlimited"
                            : plan.limits.subscribers}{" "}
                          subscribers
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi className="w-4 h-4 text-slate-400" />
                        <span>
                          {plan.limits.routers === "unlimited"
                            ? "Unlimited"
                            : plan.limits.routers}{" "}
                          routers
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span>
                          {plan.limits.staff === "unlimited" ? "Unlimited" : plan.limits.staff}{" "}
                          staff accounts
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <ul className="space-y-2">
                      {plan.features.slice(3).map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full ${
                        plan.popular && !isCurrentPlan ? "bg-blue-600 hover:bg-blue-700" : ""
                      }`}
                      variant={isCurrentPlan && !isTrial ? "outline" : "default"}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan && !isTrial}
                    >
                      {isCurrentPlan && !isTrial ? (
                        "Current Plan"
                      ) : isTrial ? (
                        <>
                          Subscribe Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Upgrade
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <HeadphonesIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Need a custom plan?</p>
                    <p className="text-sm text-slate-600">
                      Contact our sales team for custom pricing and features
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <a href="mailto:sales@netily.io">Contact Sales</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Plan Tab */}
        <TabsContent value="current" className="space-y-6">
          {subscription && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Current Subscription</span>
                    {getStatusBadge(subscription.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{subscription.plan.name}</p>
                      <p className="text-slate-500">
                        {formatCurrency(subscription.plan.price)}/month
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Started</span>
                      <span className="font-medium">
                        {formatDate(subscription.current_period_start)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {subscription.status === "trial" ? "Trial Ends" : "Renews"}
                      </span>
                      <span className="font-medium">
                        {formatDate(subscription.current_period_end)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Days Remaining</span>
                      <span
                        className={`font-medium ${
                          daysRemaining <= 3 ? "text-red-600" : ""
                        }`}
                      >
                        {daysRemaining} days
                      </span>
                    </div>
                  </div>

                  {subscription.status === "trial" && (
                    <Button className="w-full" onClick={() => handleSelectPlan(subscription.plan)}>
                      Subscribe Now
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {subscription.plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View all your past payments and download invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No payment history yet</p>
                  <p className="text-sm text-slate-400">
                    Your payments will appear here after you subscribe
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.reference}
                        </TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : payment.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.invoice_url && (
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {usage && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Subscribers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{usage.subscribers.used} used</span>
                      <span className="text-slate-500">
                        of{" "}
                        {usage.subscribers.limit === "unlimited"
                          ? "∞"
                          : usage.subscribers.limit}
                      </span>
                    </div>
                    {usage.subscribers.limit !== "unlimited" && (
                      <Progress
                        value={(usage.subscribers.used / usage.subscribers.limit) * 100}
                        className="h-2"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-green-600" />
                    Routers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{usage.routers.used} used</span>
                      <span className="text-slate-500">
                        of{" "}
                        {usage.routers.limit === "unlimited" ? "∞" : usage.routers.limit}
                      </span>
                    </div>
                    {usage.routers.limit !== "unlimited" && (
                      <Progress
                        value={(usage.routers.used / usage.routers.limit) * 100}
                        className="h-2"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    Staff Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{usage.staff.used} used</span>
                      <span className="text-slate-500">
                        of {usage.staff.limit === "unlimited" ? "∞" : usage.staff.limit}
                      </span>
                    </div>
                    {usage.staff.limit !== "unlimited" && (
                      <Progress
                        value={(usage.staff.used / usage.staff.limit) * 100}
                        className="h-2"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Need More Resources?</CardTitle>
              <CardDescription>
                Upgrade your plan to increase your limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleSelectPlan(PRICING_PLANS[2])}>
                Upgrade to Enterprise
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        selectedPlan={selectedPlan}
        onSuccess={() => {
          toast.success("Subscription activated!")
          // Reload billing data
        }}
      />
    </div>
  )
}
