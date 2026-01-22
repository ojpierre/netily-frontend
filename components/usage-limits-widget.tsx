"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Wifi,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { adminApi } from "@/lib/admin-api"
import type { UsageStats } from "@/lib/types"

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getProgressColor(percentage: number | null): string {
  if (percentage === null) return "bg-green-500"
  if (percentage >= 90) return "bg-red-500"
  if (percentage >= 75) return "bg-amber-500"
  return "bg-green-500"
}

function getTextColor(percentage: number | null): string {
  if (percentage === null) return "text-green-600"
  if (percentage >= 90) return "text-red-600"
  if (percentage >= 75) return "text-amber-600"
  return "text-green-600"
}

// ==========================================
// USAGE LIMITS WIDGET
// ==========================================

interface UsageLimitsWidgetProps {
  className?: string
  compact?: boolean
}

export function UsageLimitsWidget({ className, compact = false }: UsageLimitsWidgetProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<UsageStats | null>(null)

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    try {
      const data = await adminApi.getUsageStats()
      setUsage(data)
    } catch (error) {
      console.error("Failed to load usage stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  const items = [
    {
      label: "Subscribers",
      icon: Users,
      current: usage.subscribers.current,
      limit: usage.subscribers.limit,
      percentage: usage.subscribers.percentage,
    },
    {
      label: "Routers",
      icon: Wifi,
      current: usage.routers.current,
      limit: usage.routers.limit,
      percentage: usage.routers.percentage,
    },
    {
      label: "Staff Users",
      icon: UserCheck,
      current: usage.staff.current,
      limit: usage.staff.limit,
      percentage: usage.staff.percentage,
    },
  ]

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        {usage.is_over_limit && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You&apos;ve exceeded your plan limits. Upgrade to continue.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center gap-4">
          {items.map((item) => (
            <TooltipProvider key={item.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm">
                    <item.icon className={`w-4 h-4 ${getTextColor(item.percentage)}`} />
                    <span className="font-medium">
                      {item.current}
                      {item.limit !== null && (
                        <span className="text-muted-foreground">/{item.limit}</span>
                      )}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {item.label}: {item.current} of{" "}
                    {item.limit === null ? "Unlimited" : item.limit}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Plan Usage
        </CardTitle>
        <CardDescription>Current usage against your plan limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Over Limit Warning */}
        {usage.is_over_limit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Plan Limit Exceeded</AlertTitle>
            <AlertDescription>
              You&apos;ve exceeded one or more plan limits. Some features may be restricted.
              <Button
                variant="link"
                className="p-0 h-auto ml-1"
                onClick={() => router.push("/admin/settings/billing")}
              >
                Upgrade your plan
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {usage.warnings.length > 0 && !usage.is_over_limit && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {usage.warnings[0]}
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Items */}
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getTextColor(item.percentage)}`}>
                  {item.current}
                </span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground">
                  {item.limit === null ? "∞" : item.limit}
                </span>
                {item.percentage !== null && item.percentage >= 90 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {item.percentage >= 100 ? "Over Limit" : "Almost Full"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="relative">
              <Progress
                value={item.percentage ?? 0}
                className="h-2"
                // Custom styling through CSS
              />
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${getProgressColor(item.percentage)}`}
                style={{ width: `${Math.min(item.percentage ?? 0, 100)}%` }}
              />
            </div>
          </div>
        ))}

        {/* Upgrade CTA */}
        {(usage.is_over_limit || usage.warnings.length > 0) && (
          <Button
            className="w-full mt-2"
            onClick={() => router.push("/admin/settings/billing")}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ==========================================
// USAGE BAR COMPONENT
// ==========================================

interface UsageBarProps {
  label: string
  current: number
  limit: number | null
  icon?: React.ComponentType<{ className?: string }>
}

export function UsageBar({ label, current, limit, icon: Icon }: UsageBarProps) {
  const percentage = limit !== null ? Math.min((current / limit) * 100, 100) : 0
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <span>{label}</span>
        </div>
        <span className={`font-medium ${getTextColor(percentage)}`}>
          {current} / {limit === null ? "Unlimited" : limit}
        </span>
      </div>
      {limit !== null && (
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default UsageLimitsWidget
