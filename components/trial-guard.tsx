"use client"

import React, { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Lock,
  CreditCard,
  Check,
  Zap,
  Users,
  Wifi,
  BarChart3,
  HeadphonesIcon,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { adminApi } from "@/lib/admin-api"
import type { NetilyPlan } from "@/lib/types"

// ==========================================
// STATIC FEATURES DATA
// ==========================================

const staticFeatures = [
  { icon: Users, title: "Subscriber Management", desc: "Manage all your customers in one place" },
  { icon: Wifi, title: "Network Monitoring", desc: "Real-time router and ONU monitoring" },
  { icon: CreditCard, title: "Automated Billing", desc: "M-Pesa, bank transfers & more" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track revenue and growth metrics" },
  { icon: Shield, title: "FUP Management", desc: "Fair usage policy automation" },
  { icon: HeadphonesIcon, title: "Support System", desc: "Built-in ticketing system" },
]

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function checkDateExpired(targetDate: Date): boolean {
  const now = new Date()
  return targetDate <= now
}

// ==========================================
// EXPIRED PAGE COMPONENT
// ==========================================

interface ExpiredPageProps {
  isPaidSubscription: boolean
  planName?: string
  plans: NetilyPlan[]
  loading?: boolean
}

function ExpiredPage({ isPaidSubscription, planName, plans, loading = false }: ExpiredPageProps) {
  const router = useRouter()

  const handleSelectPlan = (name: string) => {
    router.push(`/admin/settings/billing?plan=${name.toLowerCase()}`)
  }

  const handleContactSales = () => {
    window.open("mailto:sales@netily.io?subject=Enterprise%20Inquiry", "_blank")
  }

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return "0"
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return numPrice.toLocaleString()
  }

  const getFeaturesList = (plan: NetilyPlan): string[] => {
    // 1. If it's already an array, use it
    if (Array.isArray(plan.features)) {
      return plan.features as string[]
    }
    
    // 2. If it's the boolean object format (like from NetilyPlan), convert to list
    if (typeof plan.features === 'object' && plan.features !== null) {
      const featureObj = plan.features as any
      const list: string[] = []
      
      if (featureObj.sms_notifications) list.push("SMS Notifications")
      if (featureObj.email_notifications) list.push("Email Notifications")
      if (featureObj.api_access) list.push("API Access")
      if (featureObj.custom_branding) list.push("Custom Branding")
      if (featureObj.white_label) list.push("White Label")
      if (featureObj.priority_support) list.push("Priority Support")
      if (featureObj.hotspot_portal) list.push("Hotspot Portal")
      if (featureObj.analytics_dashboard) list.push("Analytics Dashboard")
      if (featureObj.multi_location) list.push("Multi-Location Support")
      
      if (list.length > 0) return list
    }
    
    // 3. Fallback based on plan limits
    const fallbackFeatures: string[] = []
    
    if (plan.max_subscribers !== undefined && plan.max_subscribers !== null) {
      fallbackFeatures.push(`Up to ${plan.max_subscribers === 0 ? 'Unlimited' : plan.max_subscribers} subscribers`)
    }
    
    if (plan.max_routers !== undefined && plan.max_routers !== null) {
      fallbackFeatures.push(`Up to ${plan.max_routers === 0 ? 'Unlimited' : plan.max_routers} routers`)
    }
    
    // FIX: Use max_staff_users instead of max_staff to match NetilyPlan interface
    if (plan.max_staff_users !== undefined && plan.max_staff_users !== null) {
      fallbackFeatures.push(`Up to ${plan.max_staff_users === 0 ? 'Unlimited' : plan.max_staff_users} staff accounts`)
    }
    
    fallbackFeatures.push(plan.is_metered ? 'Metered usage-based billing' : 'Fixed monthly pricing')
    fallbackFeatures.push('Automated Invoicing')
    fallbackFeatures.push('M-Pesa Integration')
    
    return fallbackFeatures
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
              N
            </div>
            <span className="font-bold text-xl">Netily</span>
          </div>
          <Button variant="outline" onClick={handleContactSales}>
            Contact Sales
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
            isPaidSubscription ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
          }`}>
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isPaidSubscription ? "Subscription Overdue" : "Free Trial Expired"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {isPaidSubscription ? "Subscription Expired" : "Upgrade to Continue"}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            {isPaidSubscription 
              ? `Your ${planName || "Starter"} subscription has ended. Choose a plan below to settle your account and restore your network management tools.`
              : "Your 14-day free trial has ended. Choose a plan below to continue managing your ISP business with Netily's powerful tools."}
          </p>
        </div>
      </section>

      {/* Pricing Cards - Real Plans */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500">No plans available. Please contact support.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isPopular = plan.name === "Professional" || plan.is_popular
                const isEnterprise = plan.code === "enterprise"
                const features = getFeaturesList(plan)
                const displayPrice = plan.is_metered ? plan.base_license_fee : plan.price_monthly
                
                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      isPopular ? "border-blue-600 border-2 shadow-md" : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-blue-600">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description || `Perfect for ${plan.name.toLowerCase()} ISPs`}</CardDescription>
                      <div className="pt-4">
                        <span className="text-4xl font-bold">
                          KES {formatPrice(displayPrice)}
                        </span>
                        <span className="text-slate-500">/month</span>
                        {plan.is_metered && (
                          <p className="text-xs text-slate-500 mt-1">+ Usage-based fees</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full ${isPopular ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handleSelectPlan(plan.name)}
                      >
                        {isEnterprise ? "Contact Sales" : "Get Started"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Everything You Need to Run Your ISP
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-12">
            Powerful features designed specifically for Internet Service Providers
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {staticFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-blue-600 rounded-2xl p-8 text-white">
            <Zap className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Need Help Choosing?</h2>
            <p className="mb-6 opacity-90">
              Our team is here to help you find the perfect plan for your ISP business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-slate-100"
                onClick={handleContactSales}
              >
                Schedule a Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-blue-700"
                onClick={() => router.push("/admin/settings/billing")}
              >
                View All Plans
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">© 2025 Netily. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Terms of Service</a>
            <a href="mailto:support@netily.io" className="hover:text-slate-900 dark:hover:text-white">support@netily.io</a>
          </div>
        </div>
      </footer>
    </div>
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
      <ExpiredPage 
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