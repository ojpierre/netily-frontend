"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  CreditCard,
  Search,
  Download,
  Eye,
  RefreshCw,
  Phone,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Loader2,
  TrendingUp,
  Building2,
  Banknote,
  ArrowDownUp,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dropdown-menu"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Payment, PaymentDashboardStats, PaymentMethod, PayHeroResponse, PaymentInitiateResponse } from "@/lib/types"

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

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusBadge = (status: string) => {
  const s = status?.toUpperCase() || 'PENDING'
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; className?: string }> = {
    COMPLETED: { variant: "default", icon: <CheckCircle className="h-3 w-3" />, className: "bg-success" },
    PENDING: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    PROCESSING: { variant: "secondary", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    FAILED: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    REFUNDED: { variant: "outline", icon: <RotateCcw className="h-3 w-3" /> },
    CANCELLED: { variant: "outline", icon: <XCircle className="h-3 w-3" /> },
  }
  const c = config[s] || config.PENDING
  return (
    <Badge variant={c.variant} className={`capitalize gap-1 ${c.className || ''}`}>
      {c.icon}
      {status?.toLowerCase()}
    </Badge>
  )
}

const getMethodIcon = (method: string) => {
  const m = method?.toUpperCase() || ''
  const icons: Record<string, typeof Phone> = {
    MPESA: Smartphone,
    BANK: Building2,
    CASH: Banknote,
    CARD: CreditCard,
  }
  const Icon = icons[m] || CreditCard
  return <Icon className="h-4 w-4" />
}

const getMethodBadge = (method: string) => {
  const m = method?.toUpperCase() || ''
  const config: Record<string, { label: string; class: string }> = {
    MPESA: { label: 'M-Pesa', class: 'bg-success/15 text-success border-success/20' },
    BANK: { label: 'Bank', class: 'bg-primary/15 text-primary border-primary/20' },
    CASH: { label: 'Cash', class: 'bg-warning/15 text-warning border-warning/20' },
    CARD: { label: 'Card', class: 'bg-purple-100 text-purple-700 border-purple-200' },
    VOUCHER: { label: 'Voucher', class: 'bg-warning/15 text-warning border-warning/20' },
  }
  const c = config[m] || { label: method, class: '' }
  return (
    <Badge variant="outline" className={c.class}>
      {getMethodIcon(method)}
      <span className="ml-1">{c.label}</span>
    </Badge>
  )
}

// Helper function to get service type badge styling
const getServiceTypeBadge = (serviceType: string | undefined) => {
  const type = serviceType || 'Other'
  const config: Record<string, { label: string; class: string }> = {
    Hotspot: { label: 'Hotspot WiFi', class: 'bg-warning/10 text-warning border-warning/20 dark:bg-orange-950/30 dark:text-warning' },
    PPPoE: { label: 'Fiber / DSL', class: 'bg-primary/10 text-primary border-primary/20 dark:bg-blue-950/30 dark:text-primary/80' },
    Other: { label: 'Other', class: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400' },
  }
  const c = config[type] || config.Other
  return (
    <Badge variant="outline" className={c.class}>
      {c.label}
    </Badge>
  )
}

export default function PaymentsPage() {
  const perms = usePagePermissions("/admin/payments")
  // Data states
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentDashboardStats | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  // Removed methodFilter and activeTab - always showing completed payments only

  // Pagination
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  // UI states
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isMpesaOpen, setIsMpesaOpen] = useState(false)
  const [isBankOpen, setIsBankOpen] = useState(false)
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const [isReconcileOpen, setIsReconcileOpen] = useState(false)

  // Form states
  const [mpesaForm, setMpesaForm] = useState({
    phone_number: '',
    amount: '',
    invoice_id: '',
    customer_id: '',
  })
  const [bankForm, setBankForm] = useState({
    amount: '',
    reference: '',
    bank_name: '',
    account_name: '',
    invoice_id: '',
    customer_id: '',
  })
  const [refundReason, setRefundReason] = useState('')
  const [reconcileRef, setReconcileRef] = useState('')

  // PayHero unified payment states
  const [isPayNowOpen, setIsPayNowOpen] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [payHeroForm, setPayHeroForm] = useState({
    amount: '',
    phone_number: '',
    channel_id: '',
    invoice_id: '',
    customer_id: '',
  })
  const [payHeroResponse, setPayHeroResponse] = useState<PayHeroResponse | null>(null)
  const [pollingPaymentId, setPollingPaymentId] = useState<number | null>(null)
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'instructions'>('form')

  // Fetch data - always filter to COMPLETED only
  const fetchData = useCallback(async () => {
    try {
      // Always send status='COMPLETED' to only get completed payments
      const params: Record<string, string> = { 
        ordering: '-created_at', 
        page: String(page), 
        page_size: String(pageSize),
        status: 'COMPLETED'  // always filter to completed only
      }
      
      // Removed method filter
      if (searchQuery) {
        params.search = searchQuery
      }

      const [paymentsRes, statsRes] = await Promise.all([
        adminApi.getPayments(params),
        adminApi.getPaymentDashboardStats().catch(() => null),
      ])

      setPayments(paymentsRes.results || [])
      setTotalCount(paymentsRes.count || 0)
      if (statsRes) setStats(statsRes)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, page])

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

  // View details
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailOpen(true)
  }

  // Mark completed
  const handleMarkCompleted = async (payment: Payment) => {
    setProcessingId(payment.id)
    try {
      await adminApi.markPaymentCompleted(payment.id)
      toast.success('Payment marked as completed')
      fetchData()
    } catch (error: any) {
      console.error('Failed to mark payment:', error)
      toast.error(error.message || 'Failed to mark payment completed')
    } finally {
      setProcessingId(null)
    }
  }

  // Mark failed
  const handleMarkFailed = async (payment: Payment, reason?: string) => {
    setProcessingId(payment.id)
    try {
      await adminApi.markPaymentFailed(payment.id, reason || 'No reason provided')
      toast.success('Payment marked as failed')
      fetchData()
    } catch (error: any) {
      console.error('Failed to mark payment:', error)
      toast.error(error.message || 'Failed to mark payment failed')
    } finally {
      setProcessingId(null)
    }
  }

  // Reconcile payment
  const handleReconcile = async () => {
    if (!selectedPayment) return

    setIsSubmitting(true)
    try {
      await adminApi.reconcilePayment(selectedPayment.id)
      toast.success('Payment reconciled')
      setIsReconcileOpen(false)
      setReconcileRef('')
      fetchData()
    } catch (error: any) {
      console.error('Failed to reconcile:', error)
      toast.error(error.message || 'Failed to reconcile payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Refund payment
  const handleRefund = async () => {
    if (!selectedPayment) return

    setIsSubmitting(true)
    try {
      await adminApi.refundPayment(selectedPayment.id, {
        refund_amount: parseFloat(selectedPayment.amount || '0'),
        refund_reason: refundReason || 'No reason provided'
      })
      toast.success('Refund initiated')
      setIsRefundOpen(false)
      setRefundReason('')
      fetchData()
    } catch (error: any) {
      console.error('Failed to refund:', error)
      toast.error(error.message || 'Failed to initiate refund')
    } finally {
      setIsSubmitting(false)
    }
  }

  // M-Pesa STK Push (Legacy - use PayHero initiatePayment instead)
  const handleMpesaStkPush = async () => {
    if (!mpesaForm.phone_number || !mpesaForm.amount) {
      toast.error('Phone number and amount are required')
      return
    }

    if (!mpesaForm.customer_id) {
      toast.error('Customer ID is required')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.initiateMpesaStkPush({
        phone_number: mpesaForm.phone_number,
        amount: parseFloat(mpesaForm.amount),
        invoice_id: mpesaForm.invoice_id ? parseInt(mpesaForm.invoice_id) : undefined,
        customer_id: parseInt(mpesaForm.customer_id),
      })
      toast.success('M-Pesa STK Push sent! Customer will receive a prompt.')
      setIsMpesaOpen(false)
      setMpesaForm({ phone_number: '', amount: '', invoice_id: '', customer_id: '' })
      fetchData()
    } catch (error: any) {
      console.error('Failed to initiate M-Pesa:', error)
      toast.error(error.message || 'Failed to initiate M-Pesa payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Bank transfer
  const handleBankTransfer = async () => {
    if (!bankForm.amount || !bankForm.reference) {
      toast.error('Amount and reference are required')
      return
    }

    if (!bankForm.customer_id) {
      toast.error('Customer ID is required')
      return
    }

    if (!bankForm.bank_name) {
      toast.error('Bank name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.processBankTransfer({
        amount: parseFloat(bankForm.amount),
        transaction_reference: bankForm.reference,
        bank_name: bankForm.bank_name,
        account_number: bankForm.account_name || '', // Using account_name field for account_number
        invoice_id: bankForm.invoice_id ? parseInt(bankForm.invoice_id) : undefined,
        customer_id: parseInt(bankForm.customer_id),
      })
      toast.success('Bank transfer recorded')
      setIsBankOpen(false)
      setBankForm({ amount: '', reference: '', bank_name: '', account_name: '', invoice_id: '', customer_id: '' })
      fetchData()
    } catch (error: any) {
      console.error('Failed to process bank transfer:', error)
      toast.error(error.message || 'Failed to record bank transfer')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch active payment methods for PayHero
  const fetchPaymentMethods = async () => {
    try {
      const methods = await adminApi.getActivePaymentMethods()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
  }

  // Open Pay Now dialog
  const openPayNowDialog = async () => {
    await fetchPaymentMethods()
    setPaymentStep('form')
    setPayHeroResponse(null)
    setIsPayNowOpen(true)
  }

  // Initiate PayHero payment (unified flow)
  const handleInitiatePayment = async () => {
    if (!payHeroForm.amount) {
      toast.error('Amount is required')
      return
    }

    // Find selected payment method to check if phone is required
    const selectedMethod = paymentMethods.find(m => 
      String(m.id) === payHeroForm.channel_id || 
      String(m.payhero_channel_id) === payHeroForm.channel_id
    )
    const methodName = selectedMethod?.name?.toUpperCase() || ''
    const isSTKPush = methodName.includes('STK') || methodName.includes('MPESA')
    
    if (isSTKPush && !payHeroForm.phone_number) {
      toast.error('Phone number is required for M-Pesa STK Push')
      return
    }

    setIsSubmitting(true)
    setPaymentStep('processing')

    try {
      const response = await adminApi.initiatePayment({
        amount: payHeroForm.amount,
        external_reference: payHeroForm.invoice_id ? payHeroForm.invoice_id : undefined,
        channel_id: payHeroForm.channel_id ? parseInt(payHeroForm.channel_id) : undefined,
        phone_number: payHeroForm.phone_number ? payHeroForm.phone_number : undefined,
      })

      if (response.status === 'failed' || response.status === 'error') {
        toast.error(response.error || 'Failed to initiate payment')
        setPaymentStep('form')
        return
      }

      // Handle different response types based on PayHero channel
      const payhero = response.payhero_response
      setPayHeroResponse(payhero || null)

      if (payhero?.payment_url) {
        // Payment Link - redirect user
        toast.success('Redirecting to payment page...')
        window.open(payhero.payment_url, '_blank')
        setIsPayNowOpen(false)
        resetPayHeroForm()
      } else if (payhero?.checkout_request_id) {
        // STK Push - show waiting message
        toast.success('STK Push sent! Check your phone.')
        // Start polling for this payment
        if (response.payment_id) {
          startPaymentPolling(response.payment_id)
        }
        setPaymentStep('instructions')
      } else if (payhero?.paybill_number || payhero?.till_number) {
        // Paybill/Till - show payment instructions
        setPaymentStep('instructions')
        // Start polling for this payment
        if (response.payment_id) {
          startPaymentPolling(response.payment_id)
        }
      } else if (payhero?.bank_details) {
        // Bank - show bank details
        setPaymentStep('instructions')
        // Start polling for this payment
        if (response.payment_id) {
          startPaymentPolling(response.payment_id)
        }
      } else {
        // Generic success
        toast.success('Payment initiated successfully')
        setIsPayNowOpen(false)
        resetPayHeroForm()
        fetchData()
      }
    } catch (error: any) {
      console.error('Failed to initiate payment:', error)
      toast.error(error.message || 'Failed to initiate payment')
      setPaymentStep('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Start polling for payment status
  const startPaymentPolling = (paymentId: number) => {
    setPollingPaymentId(paymentId)
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    const pollInterval = setInterval(async () => {
      attempts++
      try {
        const payment = await adminApi.pollPaymentStatus(paymentId)
        const status = payment.status?.toUpperCase()

        if (status === 'COMPLETED') {
          clearInterval(pollInterval)
          setPollingPaymentId(null)
          toast.success('Payment completed successfully!')
          setIsPayNowOpen(false)
          resetPayHeroForm()
          fetchData()
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          clearInterval(pollInterval)
          setPollingPaymentId(null)
          toast.error('Payment failed or was cancelled')
          setPaymentStep('form')
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setPollingPaymentId(null)
          toast.info('Payment is still pending. Please check back later.')
        }
      } catch (error) {
        console.error('Polling error:', error)
        // Continue polling unless max attempts reached
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setPollingPaymentId(null)
        }
      }
    }, 5000) // Poll every 5 seconds
  }

  // Reset PayHero form
  const resetPayHeroForm = () => {
    setPayHeroForm({
      amount: '',
      phone_number: '',
      channel_id: '',
      invoice_id: '',
      customer_id: '',
    })
    setPayHeroResponse(null)
    setPaymentStep('form')
    setPollingPaymentId(null)
  }

  // Calculate local stats — only total collected
  const localStats = useMemo(() => {
    const s = stats as any
    // If the API returned data with flat keys or nested keys, prefer flat keys
    if (s) {
      return {
        total_collected: s.total_collected ?? 0,
        completed_count: s.completed_count ?? s.status_distribution?.COMPLETED ?? 0,
      }
    }
    // Fallback: compute from loaded payments
    const completed = payments.filter(p => p.status?.toUpperCase() === 'COMPLETED')
    return {
      total_collected: completed.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
      completed_count: completed.length,
    }
  }, [payments, stats])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Manage and track completed payment transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {perms.canAdd && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreVertical className="mr-2 h-4 w-4" />
                    Manual Entry
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsMpesaOpen(true)}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    M-Pesa STK Push (Legacy)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsBankOpen(true)}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Record Bank Transfer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={openPayNowDialog}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards - Only Total Collected */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(localStats.total_collected ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{localStats.completed_count ?? 0} payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Table - Removed filters section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>{totalCount} completed payments</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                  className="pl-9 w-[220px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {payment.transaction_id || payment.mpesa_receipt || '—'}
                      </code>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(payment.payment_date || payment.created_at)}
                      </p>
                    </div>
                  </TableCell>
                  
                  {/* Updated Customer Cell */}
                  <TableCell className="font-medium">
                    {payment.customer_name || 'Anonymous Client'}
                  </TableCell>
                  
                  <TableCell>{getMethodBadge(payment.payment_method as string || "Unknown")}</TableCell>
                  
                  {/* Service Cell */}
                  <TableCell>
                    {getServiceTypeBadge(payment.service_type)}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {perms.canViewDetails && (
                          <DropdownMenuItem onClick={() => handleViewDetails(payment)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {/* Only show refund for completed payments (which is all we show now) */}
                        {perms.canEdit && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedPayment(payment)
                            setIsRefundOpen(true)
                          }} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Undo className="mr-2 h-4 w-4" />
                            Reverse Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No completed payments found</h3>
              <p className="text-muted-foreground">Completed payments will appear here once processed.</p>
            </div>
          )}

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm font-medium px-2">
                  Page {page} of {Math.ceil(totalCount / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Payment Details</SheetTitle>
            <SheetDescription>
              {selectedPayment?.reference || selectedPayment?.transaction_id}
            </SheetDescription>
          </SheetHeader>
          {selectedPayment && (
            <div className="mt-6 space-y-6">
              <div className="flex gap-2 flex-wrap">
                {getStatusBadge(selectedPayment.status)}
                {getMethodBadge(selectedPayment.payment_method as string)}
                {getServiceTypeBadge(selectedPayment.service_type)}
              </div>

              <div className="text-center py-6 bg-muted rounded-lg">
                <p className="text-4xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedPayment.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-mono text-sm">{selectedPayment.reference || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedPayment.transaction_id || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDateTime(selectedPayment.created_at)}</p>
                </div>
                {selectedPayment.invoice_number && (
                  <div>
                    <p className="text-muted-foreground">Invoice</p>
                    <p className="font-mono">{selectedPayment.invoice_number}</p>
                  </div>
                )}
              </div>

              {selectedPayment.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Notes</p>
                    <p>{selectedPayment.notes}</p>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false)
                    setIsRefundOpen(true)
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refund
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* M-Pesa STK Push Dialog */}
      <Dialog open={isMpesaOpen} onOpenChange={setIsMpesaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>M-Pesa STK Push</DialogTitle>
            <DialogDescription>
              Send a payment prompt to customer's phone
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                placeholder="254712345678"
                value={mpesaForm.phone_number}
                onChange={(e) => setMpesaForm({ ...mpesaForm, phone_number: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Format: 254XXXXXXXXX</p>
            </div>
            <div className="space-y-2">
              <Label>Amount (KES) *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={mpesaForm.amount}
                onChange={(e) => setMpesaForm({ ...mpesaForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice ID (Optional)</Label>
              <Input
                placeholder="Link to invoice"
                value={mpesaForm.invoice_id}
                onChange={(e) => setMpesaForm({ ...mpesaForm, invoice_id: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMpesaOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMpesaStkPush} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Smartphone className="mr-2 h-4 w-4" />
              Send STK Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Transfer Dialog */}
      <Dialog open={isBankOpen} onOpenChange={setIsBankOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Bank Transfer</DialogTitle>
            <DialogDescription>
              Record a bank transfer payment            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Amount (KES) *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={bankForm.amount}
                onChange={(e) => setBankForm({ ...bankForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference Number *</Label>
              <Input
                placeholder="Bank transaction reference"
                value={bankForm.reference}
                onChange={(e) => setBankForm({ ...bankForm, reference: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  placeholder="e.g., Equity Bank"
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="Sender's name"
                  value={bankForm.account_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Invoice ID (Optional)</Label>
              <Input
                placeholder="Link to invoice"
                value={bankForm.invoice_id}
                onChange={(e) => setBankForm({ ...bankForm, invoice_id: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBankOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBankTransfer} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconcile Payment</DialogTitle>
            <DialogDescription>
              Match this payment with an external reference
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Payment Amount</span>
                <span className="font-bold">{formatCurrency(selectedPayment?.amount || 0)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>External Reference</Label>
              <Input
                placeholder="Bank statement reference, etc."
                value={reconcileRef}
                onChange={(e) => setReconcileRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReconcileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReconcile} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reconcile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              Initiate a refund for this payment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-destructive/10 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">Warning</span>
              </div>
              <p className="text-muted-foreground">
                This will initiate a refund of {formatCurrency(selectedPayment?.amount || 0)} to the customer.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason for Refund</Label>
              <Textarea
                placeholder="Explain why this refund is being processed..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRefund} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PayHero Unified Payment Dialog */}
      <Dialog open={isPayNowOpen} onOpenChange={(open) => {
        if (!open) resetPayHeroForm()
        setIsPayNowOpen(open)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Initiate Payment</DialogTitle>
            <DialogDescription>
              {paymentStep === 'form' && 'Start a new payment'}
              {paymentStep === 'processing' && 'Processing your payment...'}
              {paymentStep === 'instructions' && 'Complete your payment'}
            </DialogDescription>
          </DialogHeader>

          {/* Form Step */}
          {paymentStep === 'form' && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Amount (KES) *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={payHeroForm.amount}
                  onChange={(e) => setPayHeroForm({ ...payHeroForm, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={payHeroForm.channel_id}
                  onValueChange={(value) => setPayHeroForm({ ...payHeroForm, channel_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem 
                        key={method.id} 
                        value={String(method.payhero_channel_id || method.id || '')}
                      >
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default payment method
                </p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="254712345678"
                  value={payHeroForm.phone_number}
                  onChange={(e) => setPayHeroForm({ ...payHeroForm, phone_number: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Required for M-Pesa STK Push. Format: 254XXXXXXXXX
                </p>
              </div>

              <div className="space-y-2">
                <Label>Invoice/Reference (Optional)</Label>
                <Input
                  placeholder="Invoice ID or external reference"
                  value={payHeroForm.invoice_id}
                  onChange={(e) => setPayHeroForm({ ...payHeroForm, invoice_id: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Processing Step */}
          {paymentStep === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Initiating payment...</p>
            </div>
          )}

          {/* Instructions Step */}
          {paymentStep === 'instructions' && payHeroResponse && (
            <div className="grid gap-4 py-4">
              {/* STK Push Instructions */}
              {payHeroResponse.checkout_request_id && (
                <div className="p-4 bg-success/10 dark:bg-success/15/20 rounded-lg border border-success/20 dark:border-success/20">
                  <div className="flex items-center gap-2 text-success dark:text-success/80 mb-2">
                    <Smartphone className="h-5 w-5" />
                    <span className="font-semibold">Check Your Phone</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.
                  </p>
                  {pollingPaymentId && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for confirmation...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Paybill Instructions */}
              {payHeroResponse.paybill_number && (
                <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20 dark:border-primary/20">
                  <div className="flex items-center gap-2 text-primary dark:text-primary/60 mb-3">
                    <Phone className="h-5 w-5" />
                    <span className="font-semibold">M-Pesa Paybill</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paybill Number:</span>
                      <span className="font-mono font-bold">{payHeroResponse.paybill_number}</span>
                    </div>
                    {payHeroResponse.account_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-mono font-bold">{payHeroResponse.account_number}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold">{formatCurrency(payHeroForm.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    Go to M-Pesa → Lipa na M-Pesa → Paybill
                  </div>
                  {pollingPaymentId && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for payment...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Till Instructions */}
              {payHeroResponse.till_number && !payHeroResponse.paybill_number && (
                <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20 dark:border-primary/20">
                  <div className="flex items-center gap-2 text-primary dark:text-primary/60 mb-3">
                    <Phone className="h-5 w-5" />
                    <span className="font-semibold">M-Pesa Till (Buy Goods)</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Till Number:</span>
                      <span className="font-mono font-bold">{payHeroResponse.till_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold">{formatCurrency(payHeroForm.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    Go to M-Pesa → Lipa na M-Pesa → Buy Goods and Services
                  </div>
                  {pollingPaymentId && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for payment...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bank Instructions */}
              {payHeroResponse.bank_details && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-3">
                    <Building2 className="h-5 w-5" />
                    <span className="font-semibold">Bank Transfer</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {payHeroResponse.bank_details.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-bold">{payHeroResponse.bank_details.bank_name}</span>
                      </div>
                    )}
                    {payHeroResponse.bank_details.account_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-mono font-bold">{payHeroResponse.bank_details.account_number}</span>
                      </div>
                    )}
                    {payHeroResponse.bank_details.account_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-bold">{payHeroResponse.bank_details.account_name}</span>
                      </div>
                    )}
                    {payHeroResponse.bank_details.branch && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Branch:</span>
                        <span className="font-bold">{payHeroResponse.bank_details.branch}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold">{formatCurrency(payHeroForm.amount)}</span>
                    </div>
                  </div>
                  {pollingPaymentId && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for confirmation...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {paymentStep === 'form' && (
              <>
                <Button variant="outline" onClick={() => setIsPayNowOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInitiatePayment} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              </>
            )}
            {paymentStep === 'instructions' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsPayNowOpen(false)
                  resetPayHeroForm()
                  fetchData()
                }}
              >
                {pollingPaymentId ? 'Close & Continue in Background' : 'Done'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}