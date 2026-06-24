"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Lock,
  CreditCard,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { adminApi } from "@/lib/admin-api"
import type { CompanySubscription, NetilyPlan, UsageStats } from "@/lib/types"

// ==========================================
// SUBSCRIPTION CONTEXT
// ==========================================

interface SubscriptionContextValue {
  subscription: CompanySubscription | null
  usage: UsageStats | null
  loading: boolean
  refresh: () => Promise<void>
  isTrialExpired: boolean
  isOverLimit: boolean
  daysRemaining: number | null
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

// ==========================================
// SUBSCRIPTION PROVIDER
// ==========================================

interface SubscriptionProviderProps {
  children: React.ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [subData, usageData] = await Promise.all([
        adminApi.getCurrentSubscription(),
        adminApi.getUsageStats(),
      ])
      setSubscription(subData)
      setUsage(usageData)
    } catch (error) {
      console.error("Failed to load subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const refresh = async () => {
    setLoading(true)
    await loadData()
  }

  // Calculate trial expiration
  const isTrialExpired = subscription?.status === "expired" || subscription?.status === "cancelled"
  
  const daysRemaining = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : subscription?.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const isOverLimit = usage?.is_over_limit ?? false

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        usage,
        loading,
        refresh,
        isTrialExpired,
        isOverLimit,
        daysRemaining,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

// ==========================================
// SUBSCRIPTION GUARD COMPONENT
// ==========================================

interface SubscriptionGuardProps {
  children: React.ReactNode
  requireActive?: boolean
  fallback?: React.ReactNode
}

export function SubscriptionGuard({
  children,
  requireActive = true,
  fallback,
}: SubscriptionGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { subscription, loading, isTrialExpired } = useSubscription()

  // Pages that should always be accessible
  const allowedPaths = [
    "/admin/settings/billing",
    "/admin/settings/payouts",
    "/admin/login",
  ]

  const isAllowedPath = allowedPaths.some((path) => pathname?.startsWith(path))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Always allow access to certain pages
  if (isAllowedPath) {
    return <>{children}</>
  }

  // If subscription is expired and we require active subscription
  if (requireActive && isTrialExpired && !isAllowedPath) {
    return fallback || <ExpiredSubscriptionMessage />
  }

  return <>{children}</>
}

// ==========================================
// EXPIRED SUBSCRIPTION MESSAGE
// ==========================================

function ExpiredSubscriptionMessage() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Subscription Expired</CardTitle>
          <CardDescription>
            Your subscription has expired. Please upgrade to continue using Netily.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={() => router.push("/admin/settings/billing")}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            View Plans & Upgrade
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// TRIAL BANNER COMPONENT
// ==========================================

interface TrialBannerProps {
  className?: string
}

export function TrialBanner({ className }: TrialBannerProps) {
  const router = useRouter()
  const { subscription, daysRemaining, loading } = useSubscription()

  if (loading) return null

  // Only show for trial subscriptions
  if (subscription?.status !== "trial" || daysRemaining === null) {
    return null
  }

  const isUrgent = daysRemaining <= 3
  const bgColor = isUrgent
    ? "bg-destructive"
    : "bg-gradient-to-r from-blue-600 to-indigo-600"

  return (
    <div className={`${bgColor} text-white px-4 py-2 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUrgent && <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {daysRemaining === 0
              ? "Your trial expires today!"
              : daysRemaining === 1
              ? "Your trial expires tomorrow!"
              : `${daysRemaining} days left in your free trial`}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push("/admin/settings/billing")}
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  )
}

// ==========================================
// OVER LIMIT BANNER
// ==========================================

interface OverLimitBannerProps {
  className?: string
}

export function OverLimitBanner({ className }: OverLimitBannerProps) {
  const router = useRouter()
  const { usage, loading } = useSubscription()

  if (loading || !usage?.is_over_limit) return null

  return (
    <div className={`bg-warning text-white px-4 py-2 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            You&apos;ve exceeded your plan limits. Some features may be restricted.
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push("/admin/settings/billing")}
        >
          Upgrade Plan
        </Button>
      </div>
    </div>
  )
}

// ==========================================
// SUBSCRIPTION STATUS BADGE
// ==========================================

interface SubscriptionBadgeProps {
  className?: string
}

export function SubscriptionBadge({ className }: SubscriptionBadgeProps) {
  const { subscription, loading } = useSubscription()

  if (loading) {
    return <Skeleton className="h-5 w-16" />
  }

  if (!subscription) return null

  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    trial: { label: "Free Trial", variant: "secondary" },
    active: { label: "Active", variant: "default" },
    past_due: { label: "Past Due", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "outline" },
    expired: { label: "Expired", variant: "destructive" },
  }

  const config = statusConfig[subscription.status] || { label: subscription.status, variant: "outline" }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export default SubscriptionGuard
