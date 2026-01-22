"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Clock, CreditCard, AlertTriangle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { adminApi } from "@/lib/admin-api"

// ==========================================
// TYPES
// ==========================================

interface TrialCountdownProps {
  trialStartDate?: string | null // ISO date string
  trialDays?: number // Default 14 days
  onUpgrade?: () => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  expired: boolean
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateTimeRemaining(trialStartDate: Date, trialDays: number): TimeRemaining {
  const now = new Date()
  const expiryDate = new Date(trialStartDate)
  expiryDate.setDate(expiryDate.getDate() + trialDays)

  const totalMs = expiryDate.getTime() - now.getTime()

  if (totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      expired: true,
    }
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    expired: false,
  }
}

function getTrialStatus(timeRemaining: TimeRemaining): {
  status: "healthy" | "warning" | "critical" | "expired"
  color: string
  bgColor: string
  message: string
} {
  if (timeRemaining.expired) {
    return {
      status: "expired",
      color: "text-red-600",
      bgColor: "bg-red-100 border-red-200",
      message: "Trial expired",
    }
  }

  if (timeRemaining.days <= 1) {
    return {
      status: "critical",
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      message: timeRemaining.days === 0 ? "Expires today!" : "Expires tomorrow!",
    }
  }

  if (timeRemaining.days <= 3) {
    return {
      status: "warning",
      color: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200",
      message: `${timeRemaining.days} days left`,
    }
  }

  return {
    status: "healthy",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    message: `${timeRemaining.days} days left`,
  }
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function TrialCountdown({
  trialStartDate: initialTrialStartDate,
  trialDays = 14,
  onUpgrade,
}: TrialCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [showExpiredDialog, setShowExpiredDialog] = useState(false)
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

  // Initialize trial start date from API, props, or localStorage
  useEffect(() => {
    const initTrialDate = async () => {
      let startDate: Date | null = null

      // First, try props
      if (initialTrialStartDate) {
        startDate = new Date(initialTrialStartDate)
      }
      
      // Then try API if no props provided
      if (!startDate && typeof window !== "undefined") {
        try {
          const subscription = await adminApi.getCurrentSubscription()
          
          if (subscription) {
            setSubscriptionStatus(subscription.status)
            
            // If active subscription, don't show trial countdown
            if (subscription.status === "active") {
              return
            }
            
            // For trial status, calculate start date from trial_ends_at
            if (subscription.status === "trial" && subscription.trial_ends_at) {
              const trialEndDate = new Date(subscription.trial_ends_at)
              startDate = new Date(trialEndDate.getTime() - (trialDays * 24 * 60 * 60 * 1000))
              // Also store in localStorage for future use
              localStorage.setItem("trialStartDate", startDate.toISOString())
            } else if (subscription.current_period_start) {
              startDate = new Date(subscription.current_period_start)
              localStorage.setItem("trialStartDate", startDate.toISOString())
            }
          } else {
            // API returned null - no subscription exists, user is on implicit trial
            // Check if we need to create a trial start date
            const storedDate = localStorage.getItem("trialStartDate")
            if (!storedDate) {
              // First time user - create trial start date now
              startDate = new Date()
              localStorage.setItem("trialStartDate", startDate.toISOString())
              setSubscriptionStatus("trial")
            }
          }
        } catch (error) {
          // API failed (400/404 means no subscription) - treat as new trial user
          console.log("No subscription found, treating as trial user:", error)
          const storedDate = localStorage.getItem("trialStartDate")
          if (!storedDate) {
            // First time user - create trial start date now
            startDate = new Date()
            localStorage.setItem("trialStartDate", startDate.toISOString())
            setSubscriptionStatus("trial")
          }
        }
      }
      
      // Fallback to localStorage
      if (!startDate && typeof window !== "undefined") {
        const storedDate = localStorage.getItem("trialStartDate")
        if (storedDate) {
          startDate = new Date(storedDate)
          // If we have a stored date but no subscription status, assume trial
          if (!subscriptionStatus) {
            setSubscriptionStatus("trial")
          }
        }
      }

      if (startDate && !isNaN(startDate.getTime())) {
        setTrialStartDate(startDate)
        setTimeRemaining(calculateTimeRemaining(startDate, trialDays))
      }
    }
    
    initTrialDate()
  }, [initialTrialStartDate, trialDays])

  // Update countdown every second
  useEffect(() => {
    if (!trialStartDate) return

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(trialStartDate, trialDays)
      setTimeRemaining(remaining)

      // Show expired dialog when trial ends
      if (remaining.expired && !showExpiredDialog) {
        setShowExpiredDialog(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [trialStartDate, trialDays, showExpiredDialog])

  // Memoize status to avoid unnecessary recalculations
  const status = useMemo(() => {
    if (!timeRemaining) return null
    return getTrialStatus(timeRemaining)
  }, [timeRemaining])

  // Don't render if subscription is active (paid user)
  if (subscriptionStatus === "active") {
    return null
  }

  // Don't render if no trial date is set
  if (!trialStartDate || !timeRemaining || !status) {
    return null
  }

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade()
    }
    // Default: navigate to pricing page
    window.location.href = "/admin/settings/billing"
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${status.bgColor}`}
              onClick={handleUpgradeClick}
            >
              {status.status === "expired" ? (
                <Lock className={`w-4 h-4 ${status.color}`} />
              ) : status.status === "critical" ? (
                <AlertTriangle className={`w-4 h-4 ${status.color} animate-pulse`} />
              ) : (
                <Clock className={`w-4 h-4 ${status.color}`} />
              )}

              <div className="flex items-center gap-2">
                {status.status === "expired" ? (
                  <span className={`text-sm font-medium ${status.color}`}>Trial Expired</span>
                ) : (
                  <>
                    <span className={`text-sm font-medium ${status.color}`}>
                      {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                    </span>
                    {status.status === "critical" && (
                      <Badge variant="destructive" className="text-xs py-0 h-5">
                        Urgent
                      </Badge>
                    )}
                  </>
                )}
              </div>

              <Button
                size="sm"
                variant={status.status === "expired" ? "destructive" : "default"}
                className="h-7 text-xs ml-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpgradeClick()
                }}
              >
                <CreditCard className="w-3 h-3 mr-1" />
                {status.status === "expired" ? "Unlock" : "Upgrade"}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">
                {status.status === "expired"
                  ? "Your free trial has expired"
                  : "Free Trial Period"}
              </p>
              {!timeRemaining.expired && (
                <p className="text-xs text-slate-500">
                  {timeRemaining.days} days, {timeRemaining.hours} hours, {timeRemaining.minutes}{" "}
                  minutes remaining
                </p>
              )}
              <p className="text-xs text-slate-500">
                {status.status === "expired"
                  ? "Upgrade now to restore full access"
                  : "Click to upgrade and unlock all features"}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Trial Expired Dialog */}
      <Dialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">Free Trial Expired</DialogTitle>
            <DialogDescription className="text-center">
              Your 14-day free trial has ended. Upgrade to a paid plan to continue managing your
              ISP business with Netily.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm">Unlimited Users & Routers</p>
                <p className="text-xs text-slate-500">Manage your entire network</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm">Automated Billing & Payments</p>
                <p className="text-xs text-slate-500">M-Pesa, bank transfers, and more</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm">24/7 Priority Support</p>
                <p className="text-xs text-slate-500">Get help when you need it</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleUpgradeClick} className="w-full" size="lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowExpiredDialog(false)}
              className="w-full text-slate-500"
            >
              Remind me later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ==========================================
// COMPACT VERSION FOR MOBILE/SIDEBAR
// ==========================================

export function TrialCountdownCompact({
  trialStartDate: initialTrialStartDate,
  trialDays = 14,
}: Omit<TrialCountdownProps, "onUpgrade">) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

  useEffect(() => {
    const initTrialDate = async () => {
      let startDate: Date | null = null

      if (initialTrialStartDate) {
        startDate = new Date(initialTrialStartDate)
      }
      
      // Try API first
      if (!startDate && typeof window !== "undefined") {
        try {
          const subscription = await adminApi.getCurrentSubscription()
          
          if (subscription) {
            setSubscriptionStatus(subscription.status)
            
            // If active subscription, don't show trial countdown
            if (subscription.status === "active") {
              return
            }
            
            // For trial status, calculate start date from trial_ends_at
            if (subscription.status === "trial" && subscription.trial_ends_at) {
              const trialEndDate = new Date(subscription.trial_ends_at)
              startDate = new Date(trialEndDate.getTime() - (trialDays * 24 * 60 * 60 * 1000))
              localStorage.setItem("trialStartDate", startDate.toISOString())
            } else if (subscription.current_period_start) {
              startDate = new Date(subscription.current_period_start)
              localStorage.setItem("trialStartDate", startDate.toISOString())
            }
          }
        } catch (error) {
          console.log("Failed to fetch subscription for compact countdown:", error)
        }
      }
      
      // Fallback to localStorage or create new trial for new users
      if (!startDate && typeof window !== "undefined") {
        const storedDate = localStorage.getItem("trialStartDate")
        if (storedDate) {
          startDate = new Date(storedDate)
        } else {
          // New user with no subscription and no stored date - start trial now
          startDate = new Date()
          localStorage.setItem("trialStartDate", startDate.toISOString())
          setSubscriptionStatus("trial")
        }
      }

      if (startDate && !isNaN(startDate.getTime())) {
        setTrialStartDate(startDate)
        setTimeRemaining(calculateTimeRemaining(startDate, trialDays))
      }
    }
    
    initTrialDate()
  }, [initialTrialStartDate, trialDays])

  useEffect(() => {
    if (!trialStartDate) return

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(trialStartDate, trialDays))
    }, 60000) // Update every minute for compact version

    return () => clearInterval(interval)
  }, [trialStartDate, trialDays])

  // Don't render if subscription is active
  if (subscriptionStatus === "active") {
    return null
  }

  if (!trialStartDate || !timeRemaining) {
    return null
  }

  const status = getTrialStatus(timeRemaining)

  return (
    <Link href="/admin/settings/billing" className="block">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all hover:shadow-sm ${status.bgColor}`}
      >
        <div className="flex items-center gap-2">
          {status.status === "expired" ? (
            <Lock className={`w-4 h-4 ${status.color}`} />
          ) : (
            <Clock className={`w-4 h-4 ${status.color}`} />
          )}
          <span className={`text-sm font-medium ${status.color}`}>{status.message}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
          {status.status === "expired" ? "Unlock" : "Upgrade"}
        </Button>
      </div>
    </Link>
  )
}

export default TrialCountdown
