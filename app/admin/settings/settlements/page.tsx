"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  DollarSign,
  Calendar,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { adminApi } from "@/lib/admin-api"
import type { ISPSettlement, SettlementSummary, SettlementStatus } from "@/lib/types"

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
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" })
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`
}

function getStatusIcon(status: SettlementStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-success" />
    case "processing":
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />
    case "pending":
      return <Clock className="w-4 h-4 text-warning" />
    case "failed":
      return <XCircle className="w-4 h-4 text-destructive" />
    default:
      return <Clock className="w-4 h-4 text-gray-600" />
  }
}

function getStatusBadge(status: SettlementStatus) {
  const variants: Record<SettlementStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    completed: { variant: "default", label: "Completed" },
    processing: { variant: "secondary", label: "Processing" },
    pending: { variant: "outline", label: "Pending" },
    failed: { variant: "destructive", label: "Failed" },
  }
  const config = variants[status] || { variant: "outline", label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function SettlementsPage() {
  const [loading, setLoading] = useState(true)
  const [settlements, setSettlements] = useState<ISPSettlement[]>([])
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [requesting, setRequesting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const loadData = useCallback(async (reset = false) => {
    if (reset) {
      setPage(1)
      setLoading(true)
    }

    try {
      const params: Record<string, string> = {
        page: reset ? "1" : page.toString(),
      }
      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const [settlementsRes, summaryData] = await Promise.all([
        adminApi.getSettlements(params),
        reset || page === 1 ? adminApi.getSettlementSummary() : Promise.resolve(null),
      ])

      if (reset) {
        setSettlements(settlementsRes.results || [])
      } else {
        setSettlements((prev) => [...prev, ...(settlementsRes.results || [])])
      }

      setHasMore(!!settlementsRes.next)

      if (summaryData) {
        setSummary(summaryData)
      }
    } catch (error) {
      console.error("Failed to load settlements:", error)
      toast.error("Failed to load settlements")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    loadData(true)
  }, [statusFilter])

  useEffect(() => {
    if (page > 1) {
      loadData()
    }
  }, [page])

  const handleRequestPayout = async () => {
    setRequesting(true)
    try {
      const result = await adminApi.requestManualPayout()
      toast.success(result.message)
      await loadData(true)
    } catch (error) {
      console.error("Failed to request payout:", error)
      toast.error("Failed to request payout. Please try again.")
    } finally {
      setRequesting(false)
    }
  }

  const loadMore = () => {
    setPage((prev) => prev + 1)
  }

  if (loading && settlements.length === 0) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const pendingBalance = summary ? parseFloat(summary.pending_balance) : 0

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Settlements</h1>
          <p className="text-muted-foreground">
            Track your earnings and payout history from customer payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {pendingBalance > 1000 && (
            <Button onClick={handleRequestPayout} disabled={requesting}>
              {requesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4 mr-2" />
              )}
              Request Payout
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-success/20 dark:border-success/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                Available for Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success dark:text-success">
                {formatCurrency(summary.pending_balance)}
              </p>
              {summary.next_payout_date && (
                <p className="text-xs text-success dark:text-success mt-1">
                  Next payout: {formatDate(summary.next_payout_date)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gross Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.total_gross)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From all customer payments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-warning/20 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Platform Commission (5%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning dark:text-warning">
                {formatCurrency(summary.total_commission)}
              </p>
              <p className="text-xs text-warning dark:text-warning mt-1">
                Netily platform fee
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Settlement History
          </CardTitle>
          <CardDescription>
            {settlements.length} settlement{settlements.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Settlements Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                When customers make payments, your earnings will appear here after processing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {formatDateRange(settlement.period_start, settlement.period_end)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatDate(settlement.period_start)} to {formatDate(settlement.period_end)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(settlement.gross_amount)}
                      </TableCell>
                      <TableCell className="text-right text-warning">
                        -{formatCurrency(settlement.commission_amount)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {formatCurrency(settlement.net_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(settlement.status)}
                          {getStatusBadge(settlement.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {settlement.processed_at
                          ? formatDate(settlement.processed_at)
                          : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {settlement.payhero_reference || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Settlement Alert */}
      {settlements.some((s) => s.status === "failed") && (
        <Card className="border-destructive/20 bg-destructive/10 dark:border-destructive/20 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="w-4 h-4" />
              Failed Settlements
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-destructive dark:text-destructive/80">
            <p>
              Some settlements have failed. This may be due to incorrect payout details.
              Please verify your payout settings and contact support if the issue persists.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
