"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  Ticket,
  Clock,
  Plus,
  Copy,
  ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { VoucherItem, VoucherSummary, VoucherGenerateResponse } from "@/lib/types"

// Remove Plan import since we're using a different type now
// We'll define a local interface for hotspot plans
interface HotspotPlanSummary {
  id: string
  name: string
  price?: string
  // Add other fields as needed
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getVoucherStatusBadge = (status: string) => {
  const normalizedStatus = status?.toUpperCase() || 'UNKNOWN'
  const badges: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string; icon: any; className?: string }> = {
    'ACTIVE': { variant: 'default' as const, label: 'Active', icon: CheckCircle, className: 'bg-green-500' },
    'UNUSED': { variant: 'default' as const, label: 'Unused', icon: Ticket, className: 'bg-blue-500' },
    'USED': { variant: 'secondary' as const, label: 'Used', icon: ShoppingCart },
    'REDEEMED': { variant: 'outline' as const, label: 'Redeemed', icon: CheckCircle },
    'EXPIRED': { variant: 'destructive' as const, label: 'Expired', icon: XCircle },
    'CANCELLED': { variant: 'destructive' as const, label: 'Cancelled', icon: XCircle },
  }
  const badge = badges[normalizedStatus] || { variant: 'outline' as const, label: normalizedStatus, icon: Clock }
  const Icon = badge.icon
  return (
    <Badge variant={badge.variant} className={badge.className || ''}>
      <Icon className="mr-1 h-3 w-3" />
      {badge.label}
    </Badge>
  )
}

export default function VouchersPage() {
  // Data states
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [summary, setSummary] = useState<VoucherSummary>({ total: 0, used: 0, unused: 0 })
  const [plans, setPlans] = useState<HotspotPlanSummary[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [planFilter, setPlanFilter] = useState<string>("all")

  // UI states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<VoucherGenerateResponse | null>(null)

  // Form states
  const [generateForm, setGenerateForm] = useState({
    plan_id: '',
    quantity: '10',
    valid_days: '',
    prefix: '',
  })

  // Fetch data
  const fetchVouchers = useCallback(async () => {
    try {
      const response = await adminApi.listHotspotVouchers({ 
        status: statusFilter, 
        plan_id: planFilter === 'all' ? undefined : planFilter 
      })
      setVouchers(response.results || [])
      setSummary(response.summary || { total: 0, used: 0, unused: 0 })
    } catch (error) {
      console.error('Failed to fetch vouchers:', error)
      toast.error('Failed to load vouchers')
    }
  }, [statusFilter, planFilter])

  // FETCH HOTSPOT PLANS - Changed from adminApi.getPlans() to adminApi.getAllHotspotPlans()
  const fetchPlans = async () => {
    try {
      // CHANGE: Fetch Hotspot Plans, not standard PPPoE plans
      const response = await adminApi.getAllHotspotPlans()
      setPlans(response.results || [])
    } catch (error) {
      console.error('Failed to fetch hotspot plans:', error)
      toast.error('Failed to load hotspot plans')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchVouchers(), fetchPlans()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchVouchers])

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchVouchers()
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Generate vouchers
  const handleGenerate = async () => {
    if (!generateForm.plan_id) {
      toast.error('Please select a hotspot plan')
      return
    }
    const qty = parseInt(generateForm.quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        plan_id: generateForm.plan_id,
        quantity: qty,
        valid_days: generateForm.valid_days ? parseInt(generateForm.valid_days) : undefined,
        prefix: generateForm.prefix || undefined,
      }
      
      const response = await adminApi.generateHotspotVouchers(payload)
      toast.success(response.message || `${qty} vouchers generated successfully`)
      
      setGeneratedResult(response)
      setIsGenerateOpen(false)
      setIsGeneratedModalOpen(true)
      
      // Reset form
      setGenerateForm({ plan_id: '', quantity: '10', valid_days: '', prefix: '' })
      fetchVouchers() // Refresh background list
    } catch (error: any) {
      console.error('Failed to generate vouchers:', error)
      toast.error(error.message || 'Failed to generate vouchers')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy helpers
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const copyAllGenerated = () => {
    if (!generatedResult?.vouchers) return
    const allCodes = generatedResult.vouchers.map(v => v.code).join('\n')
    navigator.clipboard.writeText(allCodes)
    toast.success(`${generatedResult.vouchers.length} codes copied to clipboard`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-3" />)}
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
          <h1 className="text-3xl font-bold tracking-tight">Vouchers</h1>
          <p className="text-muted-foreground">
            Manage and generate hotspot plan vouchers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsGenerateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Vouchers
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unused</CardTitle>
            <Ticket className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.unused}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.used}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Tabs */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All Vouchers</TabsTrigger>
                <TabsTrigger value="unused">Unused</TabsTrigger>
                <TabsTrigger value="used">Used</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No vouchers found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-mono font-medium">{voucher.code}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{voucher.pin || '-'}</TableCell>
                    <TableCell>{voucher.plan_name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{voucher.batch_number || '-'}</TableCell>
                    <TableCell>{getVoucherStatusBadge(voucher.status)}</TableCell>
                    <TableCell>{voucher.use_count}</TableCell>
                    <TableCell>{formatDate(voucher.expires_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => copyCode(voucher.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Vouchers Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Vouchers</DialogTitle>
            <DialogDescription>Create a new batch of hotspot plan vouchers.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Hotspot Plan *</Label>
              <Select 
                value={generateForm.plan_id} 
                onValueChange={(v) => setGenerateForm({ ...generateForm, plan_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="1000"
                  value={generateForm.quantity} 
                  onChange={(e) => setGenerateForm({ ...generateForm, quantity: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Days (Optional)</Label>
                <Input 
                  type="number" 
                  min="1"
                  placeholder="Override plan default"
                  value={generateForm.valid_days} 
                  onChange={(e) => setGenerateForm({ ...generateForm, valid_days: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Code Prefix (Optional)</Label>
              <Input 
                placeholder="e.g. VIP" 
                maxLength={4}
                value={generateForm.prefix} 
                onChange={(e) => setGenerateForm({ ...generateForm, prefix: e.target.value.toUpperCase() })} 
              />
              <p className="text-xs text-muted-foreground">Short prefix to prepend to generated codes.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Vouchers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Vouchers Success Modal */}
      <Dialog open={isGeneratedModalOpen} onOpenChange={setIsGeneratedModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Generation Successful
            </DialogTitle>
            <DialogDescription>
              Successfully created {generatedResult?.vouchers?.length} vouchers for {generatedResult?.batch?.plan_name}.
              Batch Number: <span className="font-mono">{generatedResult?.batch?.batch_number}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background shadow-sm">
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedResult?.vouchers?.map((v) => (
                  <TableRow key={v.code}>
                    <TableCell className="font-mono font-medium">{v.code}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{v.pin || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => copyCode(v.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-4 sm:justify-between">
            <Button variant="outline" onClick={copyAllGenerated}>
              <Copy className="mr-2 h-4 w-4" />
              Copy All Codes
            </Button>
            <Button onClick={() => setIsGeneratedModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}