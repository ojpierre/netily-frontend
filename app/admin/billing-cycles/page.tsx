"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  Plus,
  Edit,
  MoreVertical,
  RefreshCw,
  Download,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Calculator,
  Lock,
  BarChart3,
  Loader2,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { BillingCycle, BillingCycleSummary, BillingCycleStatus } from "@/lib/types"

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num || 0)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStatusBadge = (status: BillingCycleStatus) => {
  const badges = {
    'OPEN': { variant: 'default' as const, label: 'Open', className: 'bg-success' },
    'CLOSED': { variant: 'secondary' as const, label: 'Closed', className: 'bg-gray-500 text-white' },
    'PROCESSING': { variant: 'secondary' as const, label: 'Processing', className: 'bg-primary text-white' },
  }
  const badge = badges[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
}

export default function BillingCyclesPage() {
  const perms = usePagePermissions("/admin/billing-cycles")
  // Data states
  const [cycles, setCycles] = useState<BillingCycle[]>([])
  const [currentCycle, setCurrentCycle] = useState<BillingCycle | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null)
  const [cycleSummary, setCycleSummary] = useState<BillingCycleSummary | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // UI states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    due_date: "",
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-start_date' }
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchQuery) params.search = searchQuery

      const [cyclesRes, currentRes] = await Promise.all([
        adminApi.getBillingCycles(params),
        adminApi.getCurrentBillingCycle().catch(() => null),
      ])

      setCycles(cyclesRes.results || [])
      setCurrentCycle(currentRes)
    } catch (error) {
      console.error('Failed to fetch billing cycles:', error)
      toast.error('Failed to load billing cycles')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Create new billing cycle
  const handleCreate = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date || !formData.due_date) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.createBillingCycle(formData)
      toast.success('Billing cycle created successfully')
      setIsCreateOpen(false)
      setFormData({ name: "", start_date: "", end_date: "", due_date: "" })
      fetchData()
    } catch (error: any) {
      console.error('Failed to create billing cycle:', error)
      toast.error(error.message || 'Failed to create billing cycle')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Close billing cycle
  const handleCloseCycle = async (cycle: BillingCycle) => {
    if (!confirm(`Are you sure you want to close "${cycle.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await adminApi.closeBillingCycle(cycle.id)
      toast.success('Billing cycle closed successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to close billing cycle:', error)
      toast.error(error.message || 'Failed to close billing cycle')
    }
  }

  // Calculate totals
  const handleCalculateTotals = async (cycle: BillingCycle) => {
    try {
      await adminApi.calculateBillingCycleTotals(cycle.id)
      toast.success('Totals calculated successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to calculate totals:', error)
      toast.error(error.message || 'Failed to calculate totals')
    }
  }

  // View summary
  const handleViewSummary = async (cycle: BillingCycle) => {
    setSelectedCycle(cycle)
    setIsSummaryOpen(true)
    
    try {
      const summary = await adminApi.getBillingCycleSummary(cycle.id)
      setCycleSummary(summary)
    } catch (error) {
      console.error('Failed to fetch summary:', error)
      toast.error('Failed to load summary')
    }
  }

  // Calculate stats
  const stats = {
    totalCycles: cycles.length,
    openCycles: cycles.filter(c => c.status === 'OPEN').length,
    closedCycles: cycles.filter(c => c.status === 'CLOSED').length,
    totalInvoiced: cycles.reduce((sum, c) => sum + parseFloat(c.total_invoiced || '0'), 0),
    totalCollected: cycles.reduce((sum, c) => sum + parseFloat(c.total_collected || '0'), 0),
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Cycles</h1>
          <p className="text-muted-foreground">
            Manage billing periods, generate invoices, and track collections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {perms.canAdd && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Cycle
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCycles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cycles</CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.openCycles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Cycles</CardTitle>
            <Lock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.closedCycles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalInvoiced)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.totalCollected)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Cycle Banner */}
      {currentCycle && (
        <Card className="border-primary/20 bg-primary/10 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/15 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Current Billing Cycle: {currentCycle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(currentCycle.start_date)} - {formatDate(currentCycle.end_date)} | 
                    Due: {formatDate(currentCycle.due_date)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewSummary(currentCycle)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Summary
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCalculateTotals(currentCycle)}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Totals
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Billing Cycles</CardTitle>
              <CardDescription>{cycles.length} cycles found</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cycles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoiced</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => {
                const outstanding = parseFloat(cycle.total_invoiced || '0') - parseFloat(cycle.total_collected || '0')
                const collectionRate = parseFloat(cycle.total_invoiced || '0') > 0 
                  ? (parseFloat(cycle.total_collected || '0') / parseFloat(cycle.total_invoiced || '0')) * 100 
                  : 0

                return (
                  <TableRow key={cycle.id}>
                    <TableCell>
                      <div className="font-medium">{cycle.name}</div>
                      {cycle.invoice_count !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          {cycle.invoice_count} invoices
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(cycle.due_date)}</TableCell>
                    <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cycle.total_invoiced || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-success">
                        {formatCurrency(cycle.total_collected || 0)}
                      </div>
                      {collectionRate > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {collectionRate.toFixed(1)}% collected
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={outstanding > 0 ? 'text-destructive' : 'text-success'}>
                        {formatCurrency(outstanding)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {perms.canViewDetails && (
                            <DropdownMenuItem onClick={() => handleViewSummary(cycle)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Summary
                            </DropdownMenuItem>
                          )}
                          {perms.canEdit && (
                            <DropdownMenuItem onClick={() => handleCalculateTotals(cycle)}>
                              <Calculator className="mr-2 h-4 w-4" />
                              Calculate Totals
                            </DropdownMenuItem>
                          )}
                          {perms.canEdit && cycle.status === 'OPEN' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleCloseCycle(cycle)}
                                className="text-destructive"
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Close Cycle
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {cycles.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No billing cycles found</h3>
              <p className="text-muted-foreground">Create your first billing cycle to get started.</p>
              {perms.canAdd && (
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Billing Cycle
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Billing Cycle</DialogTitle>
            <DialogDescription>
              Set up a new billing period for invoice generation
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Cycle Name *</Label>
              <Input
                id="name"
                placeholder="e.g., January 2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The date by which payments should be received
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Sheet */}
      <Sheet open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedCycle?.name}</SheetTitle>
            <SheetDescription>
              Billing cycle summary and statistics
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {cycleSummary ? (
              <>
                <div className="flex gap-2">
                  {getStatusBadge(cycleSummary.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Period</p>
                    <p className="font-medium">
                      {formatDate(cycleSummary.start_date)} - {formatDate(cycleSummary.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Invoices</p>
                    <p className="font-medium">{cycleSummary.total_invoices}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collection Rate</span>
                    <span className="font-medium">{cycleSummary.collection_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={cycleSummary.collection_rate} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-success/10 rounded-lg">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-lg font-bold text-success">{cycleSummary.paid_count}</p>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold text-warning">{cycleSummary.pending_count}</p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-xs text-muted-foreground">Overdue</p>
                    <p className="text-lg font-bold text-destructive">{cycleSummary.overdue_count}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Total Invoiced</span>
                    <span className="font-medium">{formatCurrency(cycleSummary.total_invoiced)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>Total Collected</span>
                    <span className="font-medium">{formatCurrency(cycleSummary.total_collected)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Outstanding</span>
                    <span className="font-medium">{formatCurrency(cycleSummary.total_outstanding)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
