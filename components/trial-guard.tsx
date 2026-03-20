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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { adminApi } from "@/lib/admin-api"

// ==========================================
// TYPES
// ==========================================

interface TrialGuardProps {
  children: React.ReactNode
  trialDays?: number
}

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  popular?: boolean
  badge?: string
}

// ==========================================
// PRICING DATA
// ==========================================

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "KSh 2,999",
    period: "/month",
    description: "Perfect for small ISPs getting started",
    features: [
      "Up to 100 subscribers",
      "3 Routers",
      "Basic billing & invoicing",
      "Email support",
      "M-Pesa integration",
    ],
  },
  {
    name: "Professional",
    price: "KSh 7,999",
    period: "/month",
    description: "For growing ISP businesses",
    popular: true,
    badge: "Most Popular",
    features: [
      "Up to 500 subscribers",
      "10 Routers",
      "Advanced billing & FUP",
      "Priority support",
      "All payment integrations",
      "SMS notifications",
      "Custom captive portal",
    ],
  },
  {
    name: "Enterprise",
    price: "KSh 19,999",
    period: "/month",
    description: "For large-scale operations",
    features: [
      "Unlimited subscribers",
      "Unlimited Routers",
      "Full automation suite",
      "24/7 dedicated support",
      "White-label solution",
      "API access",
      "Multi-branch support",
      "Custom integrations",
    ],
  },
]

const features = [
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

/**
 * Renamed to checkDateExpired to avoid shadowing the state variable
 */
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
}

function ExpiredPage({ isPaidSubscription, planName }: ExpiredPageProps) {
  const router = useRouter()

  const handleSelectPlan = (planName: string) => {
    router.push(`/admin/settings/billing?plan=${planName.toLowerCase()}`)
  }

  const handleContactSales = () => {
    window.open("mailto:sales@netily.io?subject=Enterprise%20Inquiry", "_blank")
  }

  const title = isPaidSubscription ? "Subscription Expired" : "Free Trial Expired"
  const description = isPaidSubscription
    ? `Your ${planName || "Starter"} subscription has ended. Choose a plan to continue managing your ISP business with Netily's powerful tools.`
    : "Your 14-day free trial has ended. Choose a plan to continue managing your ISP business with Netily's powerful tools."
  const badgeText = isPaidSubscription ? "Subscription overdue" : "Your free trial has expired"
  const badgeColor = isPaidSubscription ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b">
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
          <div className={`inline-flex items-center gap-2 ${badgeColor} px-4 py-2 rounded-full mb-6`}>
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">{badgeText}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {title}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.popular ? "border-blue-600 border-2 shadow-md" : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-600">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-slate-500">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Everything You Need to Run Your ISP
          </h2>
          <p className="text-slate-600 text-center mb-12">
            Powerful features designed specifically for Internet Service Providers
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.desc}</p>
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
      <footer className="py-8 px-4 border-t bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">© 2025 Netily. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-900">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-900">
              Terms of Service
            </a>
            <a href="mailto:support@netily.io" className="hover:text-slate-900">
              support@netily.io
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ==========================================
// MAIN GUARD COMPONENT
// ==========================================

export function TrialGuard({ children, trialDays = 14 }: TrialGuardProps) {
  const [isExpired, setIsExpired] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [subscriptionType, setSubscriptionType] = useState<"trial" | "active" | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)
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
        const subscription = await adminApi.getCurrentSubscription()
        
        if (subscription) {
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
        console.log("Failed to fetch subscription, falling back to localStorage:", error)
      }

      // Check for a cached subscription expiry first
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

      const storedDate = localStorage.getItem("trialStartDate")

      if (!storedDate) {
        const hasSubscription = localStorage.getItem("subscriptionStatus")
        if (hasSubscription === "active") {
          const expiryDateStr = localStorage.getItem("subscriptionExpiry")
          if (expiryDateStr) {
            setIsExpired(checkDateExpired(new Date(expiryDateStr)))
          } else {
            setIsExpired(false)
          }
          setIsChecking(false)
          isCheckingNow = false
          return
        }
        const newTrialStart = new Date()
        localStorage.setItem("trialStartDate", newTrialStart.toISOString())
        localStorage.setItem("subscriptionStatus", "trial")
        setIsExpired(false)
        setIsChecking(false)
        isCheckingNow = false
        return
      }

      const trialStartDate = new Date(storedDate)
      if (isNaN(trialStartDate.getTime())) {
        setIsChecking(false)
        isCheckingNow = false
        return
      }

      const trialEndDate = new Date(trialStartDate)
      trialEndDate.setDate(trialEndDate.getDate() + trialDays)
      const expired = checkDateExpired(trialEndDate)
      setIsExpired(expired)
      setIsChecking(false)
      isCheckingNow = false
    }

    checkTrial()

    const interval = setInterval(checkTrial, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [trialDays])

  if (isChecking) {
    return null
  }

  if (allowedPaths.some((path) => pathname?.startsWith(path))) {
    return <>{children}</>
  }

  if (isExpired) {
    const isPaidSubscription = subscriptionType === "active"
    return <ExpiredPage isPaidSubscription={isPaidSubscription} planName={planName || undefined} />
  }

  return <>{children}</>
}

export default TrialGuard