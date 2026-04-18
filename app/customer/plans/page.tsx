"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Wifi,
  Zap,
  Check,
  ArrowRight,
  AlertCircle,
  Loader2,
  Star,
  Clock,
  HardDrive,
} from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { MpesaPaymentModal } from "@/components/mpesa-payment-modal"
import { toast } from "sonner"
import type { CustomerPlan, CustomerDashboardData } from "@/lib/types"

export default function CustomerPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<CustomerPlan[]>([])
  const [dashboard, setDashboard] = useState<CustomerDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<CustomerPlan | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        const [plansRes, dashData] = await Promise.all([
          customerApi.getPlans(),
          customerApi.getDashboard(),
        ])
        setPlans(plansRes.plans || [])
        setDashboard(dashData)
      } catch (err: any) {
        if (err.message?.includes("401")) {
          router.push("/customer/login")
          return
        }
        toast.error("Failed to load plans")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const currentPlanId = dashboard?.current_plan?.id
  const currentPlanPrice = dashboard?.current_plan ? parseFloat(dashboard.current_plan.price) : 0

  const handleSelectPlan = (plan: CustomerPlan) => {
    if (plan.id === currentPlanId) return
    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Available Plans</h1>
          <p className="text-muted-foreground mt-1">Choose a plan that fits your needs</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Available Plans</h1>
        <p className="text-muted-foreground mt-1">
          {dashboard?.current_plan
            ? `Current plan: ${dashboard.current_plan.name}. Choose a new plan below to switch.`
            : "Choose a plan to get started with your internet service."}
        </p>
      </div>

      {/* Current Plan Highlight */}
      {dashboard?.current_plan && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-300">
                Your Current Plan: {dashboard.current_plan.name}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {dashboard.current_plan.speed_down} Mbps &middot; KSh {parseFloat(dashboard.current_plan.price).toLocaleString()}/mo
                {dashboard.current_plan.days_remaining !== null && (
                  <> &middot; {dashboard.current_plan.days_remaining} days left</>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Plans Available</h3>
          <p className="text-muted-foreground">Your ISP has not published any plans yet.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            const planPrice = parseFloat(plan.price)
            const isUpgrade = planPrice > currentPlanPrice
            const speedDown = typeof plan.speed_down === 'string' ? parseInt(plan.speed_down) || 0 : plan.speed_down
            const speedUp = typeof plan.speed_up === 'string' ? parseInt(plan.speed_up) || 0 : plan.speed_up

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  isCurrent
                    ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20"
                    : plan.is_popular
                    ? "border-orange-400 dark:border-orange-500"
                    : "hover:border-foreground/20"
                }`}
              >
                {/* Popular Badge */}
                {plan.is_popular && !isCurrent && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg flex items-center gap-1">
                    <Star className="w-3 h-3" /> Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    Current Plan
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Name & Description */}
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-5">
                    <span className="text-3xl font-bold">
                      KSh {planPrice.toLocaleString()}
                    </span>
                    {plan.validity_display && (
                      <span className="text-muted-foreground text-sm ml-1">
                        /{plan.validity_display}
                      </span>
                    )}
                  </div>

                  {/* Speed & Details */}
                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5 text-sm">
                      <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>
                        <strong>{speedDown}</strong> Mbps download
                        {speedUp > 0 && <> / <strong>{speedUp}</strong> Mbps upload</>}
                      </span>
                    </div>

                    {plan.validity_display && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Clock className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Valid for {plan.validity_display}</span>
                      </div>
                    )}

                    {plan.data_limit && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <HardDrive className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span>{plan.data_limit} GB data cap</span>
                      </div>
                    )}

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <>
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        plan.is_popular
                          ? "bg-orange-600 hover:bg-orange-700"
                          : ""
                      }`}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={requesting}
                    >
                      {requesting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      {isUpgrade ? "Upgrade" : "Switch"} to {plan.name}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* M-Pesa Payment Modal for selected plan */}
      {selectedPlan && (
        <MpesaPaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          amount={selectedPlan.price}
          billingPeriod="monthly"
          onSuccess={() => {
            toast.success("Payment initiated! Your plan will be updated shortly.")
            setShowPaymentModal(false)
            setSelectedPlan(null)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
