"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Loader2,
  Clock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

import { adminApi } from "@/lib/admin-api"
import type { SettlementSummary } from "@/lib/types"

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(num)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getDaysUntil(dateString: string): number {
  const target = new Date(dateString)
  const now = new Date()
  const diffTime = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

// ==========================================
// SETTLEMENT WIDGET COMPONENT
// ==========================================

interface SettlementWidgetProps {
  className?: string
  showViewAll?: boolean
}

export function SettlementWidget({ className, showViewAll = true }: SettlementWidgetProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const data = await adminApi.getSettlementSummary()
      setSummary(data)
    } catch (error) {
      console.error("Failed to load settlement summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    setRequesting(true)
    try {
      const result = await adminApi.requestManualPayout()
      toast.success(result.message)
      await loadSummary()
    } catch (error) {
      console.error("Failed to request payout:", error)
      toast.error("Failed to request payout. Please try again.")
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  const pendingBalance = parseFloat(summary.pending_balance)
  const totalGross = parseFloat(summary.total_gross)
  const commissionRate = totalGross > 0 
    ? (parseFloat(summary.total_commission) / totalGross) * 100 
    : 5
  const netPercentage = 100 - commissionRate

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Settlement Overview
        </CardTitle>
        <CardDescription>Your earnings from customer payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Balance */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available for Payout</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(summary.pending_balance)}
              </p>
            </div>
            {pendingBalance > 1000 && (
              <Button
                size="sm"
                onClick={handleRequestPayout}
                disabled={requesting}
              >
                {requesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    Request Payout
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.total_gross)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Platform Fee (5%)</p>
            <p className="text-lg font-semibold text-orange-600">
              {formatCurrency(summary.total_commission)}
            </p>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Earnings</span>
            <span className="font-medium">{netPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={netPercentage} className="h-2" />
        </div>

        {/* Next Payout Info */}
        {summary.next_payout_date && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Next Scheduled Payout</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(summary.next_payout_date)} ({getDaysUntil(summary.next_payout_date)} days)
              </p>
            </div>
          </div>
        )}

        {/* Last Payout Info */}
        {summary.last_payout && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Last Payout: {formatCurrency(summary.last_payout.amount)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {formatDate(summary.last_payout.date)}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                summary.last_payout.status === "completed"
                  ? "text-green-700 border-green-300"
                  : summary.last_payout.status === "processing"
                  ? "text-blue-700 border-blue-300"
                  : "text-gray-700 border-gray-300"
              }
            >
              {summary.last_payout.status}
            </Badge>
          </div>
        )}

        {/* Pending Settlements Count */}
        {summary.pending_settlements_count > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {summary.pending_settlements_count} pending settlement{summary.pending_settlements_count > 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
      {showViewAll && (
        <CardFooter className="pt-0">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/admin/settings/settlements")}
          >
            View All Settlements
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

// ==========================================
// COMPACT SETTLEMENT CARD
// ==========================================

export function SettlementCard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SettlementSummary | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await adminApi.getSettlementSummary()
        setSummary(data)
      } catch {
        // Silently fail for dashboard widget
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20">
      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
        <TrendingUp className="w-5 h-5 text-green-600" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Pending Balance</p>
        <p className="text-lg font-bold text-green-700 dark:text-green-400">
          {formatCurrency(summary.pending_balance)}
        </p>
      </div>
    </div>
  )
}

export default SettlementWidget
