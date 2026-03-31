"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Settings,
  Loader2,
  Smartphone,
  Building2,
  Banknote,
  Wallet,
  Wifi,
  WifiOff,
  TestTube,
  Power,
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
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { PaymentMethod, PaymentMethodType } from "@/lib/types"
import { MpesaSettingsPanel } from "@/components/mpesa-settings-panel"
import { useTumaReferences } from "@/hooks/use-tuma-references"
import { useTumaConfig } from "@/hooks/use-tuma-config"

// ─── Collection Setup Helpers ─────────────────────────────────────────────────
function getCollAccountLabel(code: string) {
  if (code === "BUYGOODS") return "Till Number"
  if (code === "PAYBILL") return "Paybill Number"
  return "Account Number"
}
function getCollAccountPlaceholder(code: string) {
  if (code === "BUYGOODS") return "e.g. 123456"
  if (code === "PAYBILL") return "e.g. 600100"
  return "e.g. 1234567890"
}
function maskAccount(value: string) {
  if (!value || value.length <= 4) return value
  return "•".repeat(value.length - 4) + value.slice(-4)
}

const METHOD_OPTIONS: Array<{ value: PaymentMethodType; label: string }> = [
  { value: 'MPESA', label: 'M-Pesa (Legacy)' },
  { value: 'MPESA_STK', label: 'M-Pesa STK Push' },
  { value: 'MPESA_PAYBILL', label: 'M-Pesa Paybill' },
  { value: 'MPESA_TILL', label: 'M-Pesa Till' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'BANK', label: 'Bank (Legacy)' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card (Legacy)' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'PAYMENT_LINK', label: 'Payment Link' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'VOUCHER', label: 'Voucher' },
  { value: 'OTHER', label: 'Other' },
]

const HANDOFF_METHOD_CONTRACT = [
  {
    method: 'M-Pesa STK Push',
    uiType: 'MPESA_STK',
    backendType: 'MPESA_STK',
    required: 'name, code, method_type, mpesa_configuration',
    status: 'Live frontend + backend aligned',
  },
  {
    method: 'M-Pesa Paybill/Till',
    uiType: 'MPESA_PAYBILL / MPESA_TILL',
    backendType: 'MPESA_PAYBILL / MPESA_TILL',
    required: 'name, code, method_type, config.shortcode, account_reference',
    status: 'Frontend ready, needs backend validation rules',
  },
  {
    method: 'Airtel Money',
    uiType: 'AIRTEL_MONEY',
    backendType: 'MOBILE_MONEY (+ config.mobile_provider=AIRTEL)',
    required: 'name, code, method_type, config.airtel_paybill',
    status: 'Frontend ready, backend propagation pending',
  },
  {
    method: 'Bank Transfer',
    uiType: 'BANK_TRANSFER',
    backendType: 'BANK_TRANSFER',
    required: 'name, code, method_type, config.bank_name, config.account_number',
    status: 'Frontend ready, backend capability enablement pending',
  },
  {
    method: 'Card Payments',
    uiType: 'CREDIT_CARD / DEBIT_CARD',
    backendType: 'CREDIT_CARD / DEBIT_CARD',
    required: 'name, code, method_type, config.merchant_id',
    status: 'Frontend ready, gateway integration pending',
  },
] as const

const getMethodLabel = (type: PaymentMethodType) => {
  const found = METHOD_OPTIONS.find((option) => option.value === type)
  return found?.label || type
}

const getMethodGroup = (type: PaymentMethodType) => {
  if (['MPESA', 'MPESA_STK', 'MPESA_PAYBILL', 'MPESA_TILL'].includes(type)) return 'mpesa'
  if (['AIRTEL_MONEY', 'MOBILE_MONEY'].includes(type)) return 'mobile_money'
  if (['BANK', 'BANK_TRANSFER'].includes(type)) return 'bank'
  if (['CARD', 'CREDIT_CARD', 'DEBIT_CARD', 'STRIPE'].includes(type)) return 'card'
  if (['VOUCHER', 'PAYMENT_LINK', 'PAYPAL'].includes(type)) return 'digital'
  if (['CASH', 'CHEQUE'].includes(type)) return 'offline'
  return 'other'
}

const getMethodIcon = (type: PaymentMethodType) => {
  const group = getMethodGroup(type)

  if (group === 'mpesa' || group === 'mobile_money') return Smartphone
  if (group === 'bank') return Building2
  if (group === 'card') return CreditCard
  if (group === 'offline') return Banknote
  if (group === 'digital') return Wallet
  return CreditCard
}

const getMethodColor = (type: PaymentMethodType) => {
  const group = getMethodGroup(type)

  if (group === 'mpesa') return 'bg-green-100 text-green-700 border-green-200'
  if (group === 'mobile_money') return 'bg-orange-100 text-orange-700 border-orange-200'
  if (group === 'bank') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (group === 'card') return 'bg-purple-100 text-purple-700 border-purple-200'
  if (group === 'offline') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  if (group === 'digital') return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  return 'bg-gray-100 text-gray-700'
}

export default function PaymentMethodsPage() {
  // Data states
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // UI states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activePageTab, setActivePageTab] = useState("methods")

  // Form state
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    name: "",
    code: "",
    method_type: "MPESA_STK",
    description: "",
    is_active: true,
    is_default: false,
    config: {},
  })

  // ─── Collection Gateway State (powered by auto-collection API) ────────────
  const {
    references: tumaRefs,
    isLoading: tumaRefsLoading,
    error: tumaRefsError,
  } = useTumaReferences()

  const {
    config: tumaConfig,
    isLoading: tumaConfigLoading,
    isSaving: tumaSaving,
    error: tumaConfigError,
    isFirstTimeSetup: tumaIsFirstTime,
    save: saveTumaConfig,
  } = useTumaConfig()

  const [collRefId, setCollRefId] = useState("")
  const [collAccount, setCollAccount] = useState("")
  const [collErrors, setCollErrors] = useState<{ ref?: string; account?: string }>({})

  // Sync loaded config into the collection form
  useEffect(() => {
    if (tumaConfig) {
      setCollRefId(String(tumaConfig.collection_reference_id ?? ""))
      setCollAccount(tumaConfig.collection_account_number ?? "")
    }
  }, [tumaConfig])

  const handleCollectionSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: typeof collErrors = {}
    const selectedRef = tumaRefs.find((r) => r.id === collRefId)
    const code = selectedRef?.code ?? ""

    if (!collRefId) {
      errors.ref = "Please select a collection channel."
    }
    if (!collAccount.trim()) {
      errors.account = `${getCollAccountLabel(code)} is required.`
    } else if (!/^\d+$/.test(collAccount.trim())) {
      errors.account = "Digits only — no spaces or symbols."
    } else {
      const [min, max] = code === "BUYGOODS" || code === "PAYBILL" ? [5, 12] : [6, 20]
      if (collAccount.trim().length < min || collAccount.trim().length > max) {
        errors.account = `Must be ${min}–${max} digits.`
      }
    }

    setCollErrors(errors)
    if (Object.keys(errors).length > 0) return

    const ok = await saveTumaConfig({
      collection_reference_id: collRefId,
      collection_account_number: collAccount.trim(),
    })
    if (ok) {
      toast.success("Collection channel activated successfully!")
    } else {
      toast.error("Failed to save. Check your details and try again.")
    }
  }

  const handleMethodTypeChange = (methodType: PaymentMethodType) => {
    const autoName = getMethodLabel(methodType)
    setFormData((prev) => ({
      ...prev,
      method_type: methodType,
      code: prev.code || methodType,
      name: prev.name || autoName,
    }))
  }

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (typeFilter !== 'all') params.method_type = typeFilter
      if (searchQuery) params.search = searchQuery

      const response = await adminApi.getPaymentMethods(params)
      setMethods(response.results || [])
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setIsLoading(false)
    }
  }, [typeFilter, searchQuery])

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

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      method_type: "MPESA_STK",
      description: "",
      is_active: true,
      is_default: false,
      config: {},
    })
  }

  // Create payment method
  const handleCreate = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.createPaymentMethod(formData)
      toast.success('Payment method created successfully')
      setIsCreateOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Failed to create payment method:', error)
      toast.error(error.message || 'Failed to create payment method')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update payment method
  const handleUpdate = async () => {
    if (!selectedMethod || !formData.name) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.updatePaymentMethod(selectedMethod.id, formData)
      toast.success('Payment method updated successfully')
      setIsEditOpen(false)
      setSelectedMethod(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Failed to update payment method:', error)
      toast.error(error.message || 'Failed to update payment method')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      await adminApi.togglePaymentMethodActive(method.id)
      toast.success(`Payment method ${method.is_active ? 'deactivated' : 'activated'}`)
      fetchData()
    } catch (error: any) {
      console.error('Failed to toggle payment method:', error)
      toast.error(error.message || 'Failed to toggle payment method')
    }
  }

  // Test connection
  const handleTestConnection = async (method: PaymentMethod) => {
    setTestingId(method.id)
    try {
      const result = await adminApi.testPaymentMethodConnection(method.id)
      if (result.success) {
        toast.success(result.message || 'Connection successful!')
      } else {
        toast.error(result.message || 'Connection failed')
      }
    } catch (error: any) {
      console.error('Failed to test connection:', error)
      toast.error(error.message || 'Connection test failed')
    } finally {
      setTestingId(null)
    }
  }

  // Delete payment method
  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"?`)) {
      return
    }

    try {
      await adminApi.deletePaymentMethod(method.id)
      toast.success('Payment method deleted')
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete payment method:', error)
      toast.error(error.message || 'Failed to delete payment method')
    }
  }

  // Edit handler
  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setFormData({
      name: method.name,
      code: method.code,
      method_type: method.method_type,
      description: method.description,
      is_active: method.is_active,
      is_default: method.is_default,
      config: method.config || {},
    })
    setIsEditOpen(true)
  }

  const openMpesaTab = () => {
    setIsCreateOpen(false)
    setIsEditOpen(false)
    setSelectedMethod(null)
    setActivePageTab("mpesa")
  }

  // Stats
  const stats = {
    total: methods.length,
    active: methods.filter(m => m.is_active).length,
    inactive: methods.filter(m => !m.is_active).length,
  }

  const selectedMethodType = (formData.method_type || 'OTHER') as PaymentMethodType
  const selectedMethodGroup = getMethodGroup(selectedMethodType)

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
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
              <Skeleton key={i} className="h-16 w-full mb-3" />
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
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">
            Configure customer collection channels and handoff-ready backend mappings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} disabled={activePageTab === "mpesa"}>
            <Plus className="mr-2 h-4 w-4" />
            Add Method
          </Button>
        </div>
      </div>

      <Tabs value={activePageTab} onValueChange={setActivePageTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="mpesa">M-Pesa Settings</TabsTrigger>
          <TabsTrigger value="collection-setup">Collection Gateway</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <WifiOff className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      
      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>{methods.length} methods configured for this tenant</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search methods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MPESA_STK">M-Pesa STK</SelectItem>
                  <SelectItem value="MPESA_PAYBILL">M-Pesa Paybill</SelectItem>
                  <SelectItem value="MPESA_TILL">M-Pesa Till</SelectItem>
                  <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="PAYMENT_LINK">Payment Link</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="VOUCHER">Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => {
                const Icon = getMethodIcon(method.method_type)
                return (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getMethodColor(method.method_type)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          {method.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {method.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{method.code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getMethodColor(method.method_type)}>
                        {getMethodLabel(method.method_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={method.is_active ? "default" : "secondary"}>
                        {method.is_active ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {method.is_default && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(method)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleTestConnection(method)}
                            disabled={testingId === method.id}
                          >
                            {testingId === method.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="mr-2 h-4 w-4" />
                            )}
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActive(method)}>
                            <Power className="mr-2 h-4 w-4" />
                            {method.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(method)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {methods.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payment methods found</h3>
              <p className="text-muted-foreground">Add your first payment method to start accepting payments.</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="mpesa" className="space-y-6">
          <MpesaSettingsPanel />
        </TabsContent>

        {/* ─── Collection Gateway Tab ─────────────────────────────────────── */}
        <TabsContent value="collection-setup" className="space-y-6">

          {/* Connected status card */}
          {tumaConfig && !tumaConfigLoading && (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-green-50/30 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-green-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                        Collection Channel Active
                      </p>
                      <Badge className="bg-emerald-600 text-white text-xs">Connected</Badge>
                    </div>
                    <p className="text-sm text-emerald-600 mt-0.5">
                      Payments are being collected via your configured channel
                    </p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      {tumaConfig.business_id && (
                        <div>
                          <p className="text-muted-foreground">Business ID</p>
                          <p className="font-semibold">{tumaConfig.business_id}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Channel</p>
                        <p className="font-semibold">
                          {tumaRefs.find((r) => r.id === String(tumaConfig.collection_reference_id))?.name ||
                            tumaConfig.reference_name ||
                            "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Account</p>
                        <p className="font-semibold font-mono tracking-wider">
                          {maskAccount(tumaConfig.collection_account_number || "")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Config form */}
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Configure Collection Channel</CardTitle>
              <CardDescription>
                {tumaIsFirstTime
                  ? "Select how you want to receive payments from customers and enter the associated account details."
                  : "Update your payment collection channel and account details below."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tumaConfigLoading || tumaRefsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <form onSubmit={handleCollectionSave} className="space-y-5" noValidate>

                  {/* Channel select */}
                  <div className="space-y-2">
                    <Label htmlFor="coll-channel">
                      Collection Channel <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={collRefId}
                      onValueChange={(v) => {
                        setCollRefId(v)
                        setCollErrors((prev) => ({ ...prev, ref: undefined }))
                      }}
                    >
                      <SelectTrigger
                        id="coll-channel"
                        className={collErrors.ref ? "border-red-400 focus-visible:ring-red-400/30" : ""}
                      >
                        <SelectValue placeholder="Select a channel…" />
                      </SelectTrigger>
                      <SelectContent>
                        {tumaRefs.length === 0 ? (
                          <div className="p-3 text-sm text-center text-muted-foreground">
                            {tumaRefsLoading ? "Loading channels…" : "No channels available from server."}
                          </div>
                        ) : (
                          tumaRefs.map((ref) => (
                            <SelectItem key={ref.id} value={ref.id}>
                              <span className="flex items-center gap-2">
                                {ref.name}
                                {ref.code && (
                                  <span className="text-xs text-muted-foreground">({ref.code})</span>
                                )}
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {collErrors.ref && (
                      <p className="text-xs text-red-500">{collErrors.ref}</p>
                    )}
                  </div>

                  {/* Dynamic account number */}
                  <div className="space-y-2">
                    <Label htmlFor="coll-account">
                      {getCollAccountLabel(tumaRefs.find((r) => r.id === collRefId)?.code ?? "")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="coll-account"
                      inputMode="numeric"
                      placeholder={getCollAccountPlaceholder(
                        tumaRefs.find((r) => r.id === collRefId)?.code ?? ""
                      )}
                      value={collAccount}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "")
                        setCollAccount(v)
                        setCollErrors((prev) => ({ ...prev, account: undefined }))
                      }}
                      className={collErrors.account ? "border-red-400 focus-visible:ring-red-400/30" : ""}
                      maxLength={20}
                      autoComplete="off"
                    />
                    {collErrors.account ? (
                      <p className="text-xs text-red-500">{collErrors.account}</p>
                    ) : (
                      tumaRefs.find((r) => r.id === collRefId)?.code && (
                        <p className="text-xs text-muted-foreground">
                          {tumaRefs.find((r) => r.id === collRefId)?.code === "BUYGOODS" ||
                          tumaRefs.find((r) => r.id === collRefId)?.code === "PAYBILL"
                            ? "5–12 digits required"
                            : "6–20 digits required"}
                        </p>
                      )
                    )}
                  </div>

                  {/* Server-level error */}
                  {(tumaConfigError || tumaRefsError) && (
                    <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
                      {tumaConfigError || tumaRefsError}
                    </div>
                  )}

                  <Button type="submit" disabled={tumaSaving} className="w-full">
                    {tumaSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        {tumaIsFirstTime ? "Activate Collection Channel" : "Update Collection Channel"}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          setIsEditOpen(false)
          setSelectedMethod(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit' : 'Add'} Payment Method</DialogTitle>
            <DialogDescription>
              Define channel details for customer checkout and backend propagation.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Method Details</TabsTrigger>
              <TabsTrigger value="config">Channel Setup</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., M-Pesa Paybill"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., MPESA_PAYBILL"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    disabled={isEditOpen}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method_type">Channel Type *</Label>
                <Select
                  value={formData.method_type}
                  onValueChange={(v) => handleMethodTypeChange(v as PaymentMethodType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tuma rollout mode: configure frontend channel details first, then Mark enables backend capabilities per method.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Shown to admins/customers as setup guidance"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active for checkout</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Default fallback method</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 mt-4">
              {selectedMethodGroup === 'mpesa' && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="font-medium text-green-900">M-Pesa operational setup</h4>
                  <p className="mt-1 text-sm text-green-800">
                    Use the M-Pesa Settings tab to configure credentials, test connectivity, register callback URLs, and set default config.
                  </p>
                  {(selectedMethodType === 'MPESA_PAYBILL' || selectedMethodType === 'MPESA_TILL') && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="shortcode">Business Number</Label>
                        <Input
                          id="shortcode"
                          placeholder={selectedMethodType === 'MPESA_PAYBILL' ? 'Paybill Number' : 'Till Number'}
                          value={formData.config?.shortcode || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, shortcode: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account_reference">Account Reference</Label>
                        <Input
                          id="account_reference"
                          placeholder="e.g., NETILY-SUBSCRIPTION"
                          value={formData.config?.account_reference || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, account_reference: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}
                  <Button className="mt-3" variant="outline" onClick={openMpesaTab}>
                    Go to M-Pesa Settings
                  </Button>
                </div>
              )}

              {selectedMethodType === 'AIRTEL_MONEY' && (
                <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h4 className="font-medium text-orange-900">Airtel Money Collection Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="airtel_business_name">Business Name</Label>
                      <Input
                        id="airtel_business_name"
                        placeholder="e.g., Netily ISP"
                        value={formData.config?.airtel_business_name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, airtel_business_name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="airtel_paybill">Paybill/Business Number</Label>
                      <Input
                        id="airtel_paybill"
                        placeholder="e.g., 247247"
                        value={formData.config?.airtel_paybill || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, airtel_paybill: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-orange-800">
                    Frontend contract is ready. Mark will complete backend propagation (routing, validation, and settlement behavior).
                  </p>
                </div>
              )}

              {selectedMethodGroup === 'bank' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      placeholder="e.g., Equity Bank"
                      value={formData.config?.bank_name || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, bank_name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        placeholder="e.g., Company Ltd"
                        value={formData.config?.account_name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, account_name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        placeholder="e.g., 1234567890"
                        value={formData.config?.account_number || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, account_number: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        placeholder="e.g., Nairobi"
                        value={formData.config?.branch || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, branch: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swift_code">SWIFT Code</Label>
                      <Input
                        id="swift_code"
                        placeholder="e.g., EABORKE"
                        value={formData.config?.swift_code || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, swift_code: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedMethodGroup === 'card' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card_provider">Provider</Label>
                      <Input
                        id="card_provider"
                        placeholder="e.g., Visa / Mastercard / Tuma Card"
                        value={formData.config?.card_provider || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, card_provider: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchant_id">Merchant ID</Label>
                      <Input
                        id="merchant_id"
                        placeholder="Merchant identifier"
                        value={formData.config?.merchant_id || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, merchant_id: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="public_key">Public Key</Label>
                    <Textarea
                      id="public_key"
                      rows={3}
                      placeholder="Paste card gateway public key"
                      value={formData.config?.public_key || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, public_key: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}

              {selectedMethodType === 'PAYMENT_LINK' && (
                <div className="space-y-2">
                  <Label htmlFor="payhero_api_key">Payment Link API Key</Label>
                  <Input
                    id="payhero_api_key"
                    placeholder="Provider key or token (if required by backend integration)"
                    value={formData.config?.payhero_api_key || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, payhero_api_key: e.target.value }
                    })}
                  />
                </div>
              )}

              {(selectedMethodGroup === 'offline' || (selectedMethodGroup === 'digital' && selectedMethodType !== 'PAYMENT_LINK') || selectedMethodType === 'OTHER') && (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="mx-auto h-12 w-12 mb-4" />
                  <p>No additional frontend fields are required for this channel type.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateOpen(false)
                setIsEditOpen(false)
                resetForm()
              }} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={isEditOpen ? handleUpdate : handleCreate} 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditOpen ? 'Update' : 'Create'} Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
