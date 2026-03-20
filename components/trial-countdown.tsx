"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Clock, CreditCard, AlertTriangle, Lock, CheckCircle2 } from "lucide-react"
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

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  expired: boolean
}

interface StatusDisplay {
  status: "expired" | "critical" | "warning" | "healthy" | "active"
  color: string
  bgColor: string
  message: string
  icon: React.ComponentType<any>
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date()
  const totalMs = targetDate.getTime() - now.getTime()
  
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true }
  }
  
  return {
    days: Math.floor(totalMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((totalMs % (1000 * 60)) / 1000),
    totalMs,
    expired: false,
  }
}

function getStatusDisplay(timeRemaining: TimeRemaining, isTrial: boolean): StatusDisplay {
  if (timeRemaining.expired) {
    return {
      status: "expired",
      color: "text-red-600",
      bgColor: "bg-red-100 border-red-200",
      message: isTrial ? "Trial expired" : "Subscription Overdue",
      icon: Lock
    }
  }
  
  if (!isTrial) {
    return {
      status: "active",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50 border-emerald-100",
      message: `Ends in ${timeRemaining.days}d`,
      icon: CheckCircle2
    }
  }
  
  // Trial Warning Levels
  if (timeRemaining.days <= 1) {
    return {
      status: "critical",
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      message: "Expires today!",
      icon: AlertTriangle
    }
  }
  
  if (timeRemaining.days <= 3) {
    return {
      status: "warning",
      color: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200",
      message: `${timeRemaining.days}d left`,
      icon: Clock
    }
  }
  
  return {
    status: "healthy",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    message: `${timeRemaining.days}d left`,
    icon: Clock
  }
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function TrialCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [showExpiredDialog, setShowExpiredDialog] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const subscription = await adminApi.getCurrentSubscription()
        if (subscription) {
          setSubscriptionStatus(subscription.status)
          // Safe access to plan name with fallbacks
          setPlanName(subscription.plan_name || subscription.plan?.name || "Netily Plan")
          
          const endStr = subscription.status === 'active' 
            ? subscription.current_period_end 
            : subscription.trial_ends_at || subscription.current_period_end
          
          if (endStr) {
            const date = new Date(endStr)
            setExpiryDate(date)
            setTimeRemaining(calculateTimeRemaining(date))
          }
        }
      } catch (err) {
        console.error("Failed to fetch subscription status", err)
        setSubscriptionStatus("trial")
      }
    }
    loadSubscription()
  }, [])

  useEffect(() => {
    if (!expiryDate) return
    
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiryDate)
      setTimeRemaining(remaining)
      
      // Show expired dialog only for trial users when trial ends
      if (remaining.expired && subscriptionStatus === 'trial' && !showExpiredDialog) {
        setShowExpiredDialog(true)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [expiryDate, subscriptionStatus, showExpiredDialog])

  // Don't render if no time remaining data
  if (!timeRemaining || !expiryDate) {
    return null
  }
  
  const isTrial = subscriptionStatus === "trial" || !subscriptionStatus
  const status = getStatusDisplay(timeRemaining, isTrial)
  const Icon = status.icon
  
  const handleUpgradeClick = () => {
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
              <Icon className={`w-4 h-4 ${status.color} ${status.status === 'critical' ? 'animate-pulse' : ''}`} />
              
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${status.color}`}>
                  {subscriptionStatus === 'active' ? planName : status.message}
                </span>
                {subscriptionStatus === 'active' && (
                  <span className="text-[10px] font-medium opacity-70">
                    (Ends in {timeRemaining.days}d)
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs ml-1 hover:bg-white/50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpgradeClick()
                }}
              >
                <CreditCard className="w-3 h-3 mr-1" />
                {subscriptionStatus === 'active' ? "Manage" : "Upgrade"}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">
                {subscriptionStatus === 'active' 
                  ? `${planName} - Active` 
                  : "Free Trial"}
              </p>
              {!timeRemaining.expired && (
                <p className="text-xs text-slate-500">
                  {subscriptionStatus === 'active'
                    ? `Next billing cycle ends: ${expiryDate.toLocaleDateString()}`
                    : `${timeRemaining.days} days, ${timeRemaining.hours} hours, ${timeRemaining.minutes} minutes remaining`}
                </p>
              )}
              <p className="text-xs text-slate-500">
                {subscriptionStatus === 'active'
                  ? "Manage your subscription and billing settings"
                  : status.status === "expired"
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

export function TrialCountdownCompact() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const subscription = await adminApi.getCurrentSubscription()
        if (subscription) {
          setSubscriptionStatus(subscription.status)
          setPlanName(subscription.plan_name || subscription.plan?.name || "Netily Plan")
          
          const endStr = subscription.status === 'active' 
            ? subscription.current_period_end 
            : subscription.trial_ends_at || subscription.current_period_end
          
          if (endStr) {
            const date = new Date(endStr)
            setExpiryDate(date)
            setTimeRemaining(calculateTimeRemaining(date))
          }
        }
      } catch (err) {
        console.error("Failed to fetch subscription status", err)
      }
    }
    loadSubscription()
  }, [])

  useEffect(() => {
    if (!expiryDate) return

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(expiryDate))
    }, 60000) // Update every minute for compact version

    return () => clearInterval(interval)
  }, [expiryDate])

  if (!timeRemaining || !expiryDate) {
    return null
  }

  const isTrial = subscriptionStatus === "trial" || !subscriptionStatus
  const status = getStatusDisplay(timeRemaining, isTrial)

  return (
    <Link href="/admin/settings/billing" className="block">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all hover:shadow-sm ${status.bgColor}`}
      >
        <div className="flex items-center gap-2">
          <status.icon className={`w-4 h-4 ${status.color}`} />
          <span className={`text-sm font-medium ${status.color}`}>
            {subscriptionStatus === 'active' ? planName : status.message}
          </span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
          {subscriptionStatus === 'active' ? "Manage" : "Upgrade"}
        </Button>
      </div>
    </Link>
  )
}

export default TrialCountdown