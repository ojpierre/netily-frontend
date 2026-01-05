"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  QrCode,
  Plus,
  MoreVertical,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Eye,
  Package,
  Ticket,
  BarChart3,
  Play,
  Check,
  ShoppingCart,
  History,
  Copy,
  AlertCircle,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { VoucherBatch, Voucher, VoucherBatchStats, VoucherBatchStatus, VoucherStatus, VoucherType, Plan } from "@/lib/types"

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

const getBatchStatusBadge = (status: VoucherBatchStatus) => {
  const badges = {
    'DRAFT': { variant: 'secondary' as const, label: 'Draft', icon: Clock },
    'ACTIVE': { variant: 'default' as const, label: 'Active', icon: CheckCircle, className: 'bg-green-500' },
    'DEPLETED': { variant: 'outline' as const, label: 'Depleted', icon: Package },
    'EXPIRED': { variant: 'destructive' as const, label: 'Expired', icon: XCircle },
    'CANCELLED': { variant: 'destructive' as const, label: 'Cancelled', icon: XCircle },
  }
  const badge = badges[status] || { variant: 'outline' as const, label: status, icon: Clock }
  const Icon = badge.icon
  return (
    <Badge variant={badge.variant} className={badge.className}>
      <Icon className="mr-1 h-3 w-3" />
      {badge.label}
    </Badge>
  )
}

const getVoucherStatusBadge = (status: VoucherStatus) => {
  const badges = {
    'AVAILABLE': { variant: 'default' as const, label: 'Available', icon: CheckCircle, className: 'bg-green-500' },
    'SOLD': { variant: 'secondary' as const, label: 'Sold', icon: ShoppingCart },
    'REDEEMED': { variant: 'outline' as const, label: 'Redeemed', icon: Check },
    'EXPIRED': { variant: 'destructive' as const, label: 'Expired', icon: XCircle },
    'CANCELLED': { variant: 'destructive' as const, label: 'Cancelled', icon: XCircle },
  }
  const badge = badges[status] || { variant: 'outline' as const, label: status, icon: Clock }
  const Icon = badge.icon
  return (
    <Badge variant={badge.variant} className={badge.className}>
      <Icon className="mr-1 h-3 w-3" />
      {badge.label}
    </Badge>
  )
}

const getTypeBadge = (type: VoucherType) => {
  const types = {
    'TIME': { label: 'Time Based', variant: 'outline' as const },
    'DATA': { label: 'Data Based', variant: 'secondary' as const },
    'CREDIT': { label: 'Credit', variant: 'default' as const },
  }
  const t = types[type] || { label: type, variant: 'outline' as const }
  return <Badge variant={t.variant}>{t.label}</Badge>
}

export default function VouchersPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState("batches")

  // Data states
  const [batches, setBatches] = useState<VoucherBatch[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedBatch, setSelectedBatch] = useState<VoucherBatch | null>(null)
  const [selectedBatchStats, setSelectedBatchStats] = useState<VoucherBatchStats | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  // Filter states
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>("all")
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // UI states
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false)
  const [isBatchDetailOpen, setIsBatchDetailOpen] = useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isSellOpen, setIsSellOpen] = useState(false)
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)
  const [isValidateOpen, setIsValidateOpen] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  // Form states
  const [batchForm, setBatchForm] = useState({
    name: '',
    voucher_type: 'CREDIT' as VoucherType,
    plan_id: '',
    face_value: '',
    price: '',
    validity_days: '30',
    prefix: '',
    notes: '',
  })
  const [generateCount, setGenerateCount] = useState('10')
  const [sellForm, setSellForm] = useState({ seller_name: '', notes: '' })
  const [redeemCode, setRedeemCode] = useState('')
  const [validateCode, setValidateCode] = useState('')

  // Fetch data
  const fetchBatches = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-created_at' }
      if (batchStatusFilter !== 'all') params.status = batchStatusFilter

      const response = await adminApi.getVoucherBatches(params)
      setBatches(response.results || [])
    } catch (error) {
      console.error('Failed to fetch batches:', error)
      toast.error('Failed to load voucher batches')
    }
  }, [batchStatusFilter])

  const fetchVouchers = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-created_at' }
      if (voucherStatusFilter !== 'all') params.status = voucherStatusFilter
      if (searchQuery) params.search = searchQuery

      const response = await adminApi.getVouchers(params)
      setVouchers(response.results || [])
    } catch (error) {
      console.error('Failed to fetch vouchers:', error)
      toast.error('Failed to load vouchers')
    }
  }, [voucherStatusFilter, searchQuery])

  const fetchPlans = async () => {
    try {
      const response = await adminApi.getPlans()
      setPlans(response.results || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchBatches(), fetchVouchers(), fetchPlans()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchBatches, fetchVouchers])

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchBatches(), fetchVouchers()])
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Create batch
  const handleCreateBatch = async () => {
    if (!batchForm.name) {
      toast.error('Name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.createVoucherBatch({
        name: batchForm.name,
        voucher_type: batchForm.voucher_type,
        plan: batchForm.plan_id ? parseInt(batchForm.plan_id) : undefined,
        face_value: batchForm.face_value || undefined,
        price: batchForm.price || undefined,
        validity_days: parseInt(batchForm.validity_days),
        prefix: batchForm.prefix || undefined,
        notes: batchForm.notes || undefined,
      })
      toast.success('Voucher batch created')
      setIsCreateBatchOpen(false)
      setBatchForm({
        name: '',
        voucher_type: 'CREDIT',
        plan_id: '',
        face_value: '',
        price: '',
        validity_days: '30',
        prefix: '',
        notes: '',
      })
      fetchBatches()
    } catch (error: any) {
      console.error('Failed to create batch:', error)
      toast.error(error.message || 'Failed to create batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Activate batch
  const handleActivate = async (batch: VoucherBatch) => {
    setActivatingId(batch.id)
    try {
      await adminApi.activateVoucherBatch(batch.id)
      toast.success('Batch activated')
      fetchBatches()
    } catch (error: any) {
      console.error('Failed to activate batch:', error)
      toast.error(error.message || 'Failed to activate batch')
    } finally {
      setActivatingId(null)
    }
  }

  // Generate vouchers
  const handleGenerate = async () => {
    if (!selectedBatch) return

    setIsSubmitting(true)
    try {
      await adminApi.generateVouchers(selectedBatch.id, parseInt(generateCount))
      toast.success(`${generateCount} vouchers generated`)
      setIsGenerateOpen(false)
      setGenerateCount('10')
      fetchBatches()
      fetchVouchers()
    } catch (error: any) {
      console.error('Failed to generate vouchers:', error)
      toast.error(error.message || 'Failed to generate vouchers')
    } finally {
      setIsSubmitting(false)
    }
  }

  // View batch stats
  const handleViewBatchStats = async (batch: VoucherBatch) => {
    setSelectedBatch(batch)
    setIsBatchDetailOpen(true)
    try {
      const stats = await adminApi.getBatchStatistics(batch.id)
      setSelectedBatchStats(stats)
    } catch (error) {
      console.error('Failed to fetch batch stats:', error)
    }
  }

  // Sell voucher
  const handleSell = async () => {
    if (!selectedVoucher) return

    setIsSubmitting(true)
    try {
      await adminApi.sellVoucher(selectedVoucher.id, sellForm.seller_name || undefined, sellForm.notes || undefined)
      toast.success('Voucher marked as sold')
      setIsSellOpen(false)
      setSellForm({ seller_name: '', notes: '' })
      fetchVouchers()
    } catch (error: any) {
      console.error('Failed to sell voucher:', error)
      toast.error(error.message || 'Failed to sell voucher')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redeem voucher
  const handleRedeem = async () => {
    if (!redeemCode) {
      toast.error('Voucher code is required')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.redeemVoucher(redeemCode)
      toast.success('Voucher redeemed successfully')
      setIsRedeemOpen(false)
      setRedeemCode('')
      fetchVouchers()
    } catch (error: any) {
      console.error('Failed to redeem voucher:', error)
      toast.error(error.message || 'Failed to redeem voucher')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validate voucher
  const handleValidate = async () => {
    if (!validateCode) {
      toast.error('Voucher code is required')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await adminApi.validateVoucherCode(validateCode)
      setValidationResult(result)
    } catch (error: any) {
      console.error('Failed to validate voucher:', error)
      setValidationResult({ valid: false, message: error.message || 'Invalid voucher' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy voucher code
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  // Stats
  const batchStats = {
    total: batches.length,
    active: batches.filter(b => b.status === 'ACTIVE').length,
    totalVouchers: batches.reduce((sum, b) => sum + (b.total_vouchers || 0), 0),
    totalValue: batches.reduce((sum, b) => sum + parseFloat(b.face_value || '0') * (b.total_vouchers || 0), 0),
  }

  const voucherStats = {
    available: vouchers.filter(v => v.status === 'AVAILABLE').length,
    sold: vouchers.filter(v => v.status === 'SOLD').length,
    redeemed: vouchers.filter(v => v.status === 'REDEEMED').length,
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-24" />
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
          <h1 className="text-3xl font-bold tracking-tight">Vouchers</h1>
          <p className="text-muted-foreground">
            Manage prepaid voucher batches and individual vouchers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsValidateOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Validate
          </Button>
          <Button variant="outline" onClick={() => setIsRedeemOpen(true)}>
            <Check className="mr-2 h-4 w-4" />
            Redeem
          </Button>
          <Button onClick={() => setIsCreateBatchOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Batch
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchStats.total}</div>
            <p className="text-xs text-muted-foreground">{batchStats.active} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Ticket className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{voucherStats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{voucherStats.sold}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voucherStats.redeemed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="batches">
            <Package className="mr-2 h-4 w-4" />
            Batches
          </TabsTrigger>
          <TabsTrigger value="vouchers">
            <Ticket className="mr-2 h-4 w-4" />
            Vouchers
          </TabsTrigger>
        </TabsList>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Voucher Batches</CardTitle>
                  <CardDescription>{batches.length} batches</CardDescription>
                </div>
                <Select value={batchStatusFilter} onValueChange={setBatchStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DEPLETED">Depleted</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Face Value</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Vouchers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{getTypeBadge(batch.voucher_type)}</TableCell>
                      <TableCell>{formatCurrency(batch.face_value)}</TableCell>
                      <TableCell>{formatCurrency(batch.price)}</TableCell>
                      <TableCell>
                        <span className="font-medium">{batch.available_vouchers || 0}</span>
                        <span className="text-muted-foreground">/{batch.total_vouchers || 0}</span>
                      </TableCell>
                      <TableCell>{getBatchStatusBadge(batch.status)}</TableCell>
                      <TableCell>{batch.expiry_date ? formatDate(batch.expiry_date) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewBatchStats(batch)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Statistics
                            </DropdownMenuItem>
                            {batch.status === 'DRAFT' && (
                              <DropdownMenuItem
                                onClick={() => handleActivate(batch)}
                                disabled={activatingId === batch.id}
                              >
                                {activatingId === batch.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="mr-2 h-4 w-4" />
                                )}
                                Activate
                              </DropdownMenuItem>
                            )}
                            {(batch.status === 'DRAFT' || batch.status === 'ACTIVE') && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBatch(batch)
                                  setIsGenerateOpen(true)
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Generate Vouchers
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {batches.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No batches found</h3>
                  <p className="text-muted-foreground">Create a new voucher batch to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Individual Vouchers</CardTitle>
                  <CardDescription>{vouchers.length} vouchers</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={voucherStatusFilter} onValueChange={setVoucherStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="REDEEMED">Redeemed</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono bg-muted px-2 py-1 rounded text-sm">
                            {voucher.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(voucher.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{voucher.batch_name}</TableCell>
                      <TableCell>{getTypeBadge(voucher.voucher_type)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(voucher.face_value)}</TableCell>
                      <TableCell>{getVoucherStatusBadge(voucher.status)}</TableCell>
                      <TableCell>{voucher.expiry_date ? formatDate(voucher.expiry_date) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {voucher.status === 'AVAILABLE' && (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedVoucher(voucher)
                                  setIsSellOpen(true)
                                }}>
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  Mark as Sold
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => copyCode(voucher.code)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Code
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {vouchers.length === 0 && (
                <div className="text-center py-12">
                  <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No vouchers found</h3>
                  <p className="text-muted-foreground">Generate vouchers from a batch to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Batch Dialog */}
      <Dialog open={isCreateBatchOpen} onOpenChange={setIsCreateBatchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Voucher Batch</DialogTitle>
            <DialogDescription>Create a new batch of vouchers</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Batch Name *</Label>
              <Input
                value={batchForm.name}
                onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                placeholder="e.g., December Promo"
              />
            </div>
            <div className="space-y-2">
              <Label>Voucher Type *</Label>
              <Select
                value={batchForm.voucher_type}
                onValueChange={(v) => setBatchForm({ ...batchForm, voucher_type: v as VoucherType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (KES)</SelectItem>
                  <SelectItem value="TIME">Time Based</SelectItem>
                  <SelectItem value="DATA">Data Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {batchForm.voucher_type !== 'CREDIT' && (
              <div className="space-y-2">
                <Label>Plan (for Time/Data vouchers)</Label>
                <Select
                  value={batchForm.plan_id}
                  onValueChange={(v) => setBatchForm({ ...batchForm, plan_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Face Value (KES)</Label>
                <Input
                  type="number"
                  value={batchForm.face_value}
                  onChange={(e) => setBatchForm({ ...batchForm, face_value: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (KES)</Label>
                <Input
                  type="number"
                  value={batchForm.price}
                  onChange={(e) => setBatchForm({ ...batchForm, price: e.target.value })}
                  placeholder="900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Validity (Days)</Label>
                <Input
                  type="number"
                  value={batchForm.validity_days}
                  onChange={(e) => setBatchForm({ ...batchForm, validity_days: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Code Prefix</Label>
                <Input
                  value={batchForm.prefix}
                  onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value.toUpperCase() })}
                  placeholder="DEC"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={batchForm.notes}
                onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBatchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBatch} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Vouchers Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Vouchers</DialogTitle>
            <DialogDescription>
              Generate vouchers for batch: {selectedBatch?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Number of Vouchers</Label>
              <Input
                type="number"
                value={generateCount}
                onChange={(e) => setGenerateCount(e.target.value)}
                min="1"
                max="1000"
              />
              <p className="text-xs text-muted-foreground">Maximum 1000 vouchers at a time</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Stats Sheet */}
      <Sheet open={isBatchDetailOpen} onOpenChange={setIsBatchDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Batch Statistics</SheetTitle>
            <SheetDescription>{selectedBatch?.name}</SheetDescription>
          </SheetHeader>
          {selectedBatch && (
            <div className="mt-6 space-y-6">
              <div className="flex gap-2">
                {getBatchStatusBadge(selectedBatch.status)}
                {getTypeBadge(selectedBatch.voucher_type)}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Face Value</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedBatch.face_value)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selling Price</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedBatch.price)}</p>
                </div>
              </div>

              {selectedBatchStats && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold">Usage Statistics</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm text-center">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-2xl font-bold">{selectedBatchStats.total || 0}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-600">{selectedBatchStats.available || 0}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <p className="text-2xl font-bold text-blue-600">{selectedBatchStats.sold || 0}</p>
                        <p className="text-xs text-muted-foreground">Sold</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-center">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-2xl font-bold">{selectedBatchStats.redeemed || 0}</p>
                        <p className="text-xs text-muted-foreground">Redeemed</p>
                      </div>
                      <div className="p-3 rounded-lg bg-destructive/10">
                        <p className="text-2xl font-bold text-destructive">{selectedBatchStats.expired || 0}</p>
                        <p className="text-xs text-muted-foreground">Expired</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Redemption Rate</span>
                        <span className="font-medium">{selectedBatchStats.redemption_rate || 0}%</span>
                      </div>
                      <Progress value={selectedBatchStats.redemption_rate || 0} />
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedBatchStats.total_revenue || 0)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sell Voucher Dialog */}
      <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Voucher as Sold</DialogTitle>
            <DialogDescription>
              Record the sale of voucher: {selectedVoucher?.code}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Seller Name</Label>
              <Input
                value={sellForm.seller_name}
                onChange={(e) => setSellForm({ ...sellForm, seller_name: e.target.value })}
                placeholder="e.g., Shop A"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={sellForm.notes}
                onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSellOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSell} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Sold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Voucher Dialog */}
      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Voucher</DialogTitle>
            <DialogDescription>Enter the voucher code to redeem</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Voucher Code *</Label>
              <Input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="Enter voucher code"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRedeem} disabled={isSubmitting || !redeemCode}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redeem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validate Voucher Dialog */}
      <Dialog open={isValidateOpen} onOpenChange={(open) => {
        setIsValidateOpen(open)
        if (!open) {
          setValidationResult(null)
          setValidateCode('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validate Voucher</DialogTitle>
            <DialogDescription>Check if a voucher code is valid</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Voucher Code</Label>
              <div className="flex gap-2">
                <Input
                  value={validateCode}
                  onChange={(e) => setValidateCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="font-mono"
                />
                <Button onClick={handleValidate} disabled={isSubmitting || !validateCode}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {validationResult && (
              <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-semibold">
                    {validationResult.valid ? 'Valid Voucher' : 'Invalid Voucher'}
                  </span>
                </div>
                {validationResult.message && (
                  <p className="text-sm text-muted-foreground">{validationResult.message}</p>
                )}
                {validationResult.voucher && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Value:</span> {formatCurrency(validationResult.voucher.face_value)}</p>
                    <p><span className="text-muted-foreground">Status:</span> {validationResult.voucher.status}</p>
                    {validationResult.voucher.expiry_date && (
                      <p><span className="text-muted-foreground">Expires:</span> {formatDate(validationResult.voucher.expiry_date)}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValidateOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
