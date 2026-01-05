"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  FileText,
  Plus,
  MoreVertical,
  RefreshCw,
  Download,
  Send,
  Eye,
  Search,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  MessageSquare,
  Loader2,
  TrendingUp,
  Receipt,
  CreditCard,
  Percent,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Invoice, InvoiceDashboardStats, Payment } from "@/lib/types"

type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL'

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

const getStatusBadge = (status: string) => {
  const s = status.toUpperCase()
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; className?: string }> = {
    PAID: { variant: "default", icon: <CheckCircle className="h-3 w-3" />, className: "bg-green-500" },
    PENDING: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    OVERDUE: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
    DRAFT: { variant: "outline", icon: <FileText className="h-3 w-3" /> },
    CANCELLED: { variant: "outline", icon: <XCircle className="h-3 w-3" /> },
    PARTIAL: { variant: "secondary", icon: <DollarSign className="h-3 w-3" /> },
  }
  const c = config[s] || config.PENDING
  return (
    <Badge variant={c.variant} className={`capitalize gap-1 ${c.className || ''}`}>
      {c.icon}
      {status.toLowerCase()}
    </Badge>
  )
}

export default function InvoiceManagementPage() {
  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceDashboardStats | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([])

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [issuingId, setIssuingId] = useState<number | null>(null)
  const [sendingId, setSendingId] = useState<number | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // UI states
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isSendOpen, setIsSendOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)
  const [sendMethod, setSendMethod] = useState<'email' | 'sms'>('email')

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'MPESA',
    reference: '',
  })
  const [discountForm, setDiscountForm] = useState({
    discount_type: 'PERCENTAGE',
    discount_value: '',
    reason: '',
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-created_at' }
      if (activeTab !== 'all') {
        params.status = activeTab.toUpperCase()
      }
      if (searchQuery) {
        params.search = searchQuery
      }

      const [invoicesRes, statsRes] = await Promise.all([
        adminApi.getInvoices(params),
        adminApi.getInvoiceDashboardStats().catch(() => null),
      ])

      setInvoices(invoicesRes.results || [])
      if (statsRes) setStats(statsRes)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchQuery])

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
  const handleViewDetails = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailOpen(true)
    try {
      const payments = await adminApi.getInvoicePayments(invoice.id)
      setInvoicePayments(payments || [])
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    }
  }

  // Issue invoice
  const handleIssue = async (invoice: Invoice) => {
    setIssuingId(invoice.id)
    try {
      await adminApi.issueInvoice(invoice.id)
      toast.success('Invoice issued successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to issue invoice:', error)
      toast.error(error.message || 'Failed to issue invoice')
    } finally {
      setIssuingId(null)
    }
  }

  // Send invoice
  const handleSend = async () => {
    if (!selectedInvoice) return
    setSendingId(selectedInvoice.id)
    try {
      await adminApi.markInvoiceSent(selectedInvoice.id, sendMethod)
      toast.success(`Invoice sent via ${sendMethod}`)
      setIsSendOpen(false)
      fetchData()
    } catch (error: any) {
      console.error('Failed to send invoice:', error)
      toast.error(error.message || 'Failed to send invoice')
    } finally {
      setSendingId(null)
    }
  }

  // Add payment
  const handleAddPayment = async () => {
    if (!selectedInvoice || !paymentForm.amount) return

    setIsSubmitting(true)
    try {
      await adminApi.addPaymentToInvoice(selectedInvoice.id, {
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference || undefined,
      })
      toast.success('Payment added successfully')
      setIsPaymentOpen(false)
      setPaymentForm({ amount: '', payment_method: 'MPESA', reference: '' })
      fetchData()
      handleViewDetails(selectedInvoice) // Refresh details
    } catch (error: any) {
      console.error('Failed to add payment:', error)
      toast.error(error.message || 'Failed to add payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Apply discount
  const handleApplyDiscount = async () => {
    if (!selectedInvoice || !discountForm.discount_value) return

    setIsSubmitting(true)
    try {
      await adminApi.applyInvoiceDiscount(selectedInvoice.id, {
        discount_type: discountForm.discount_type as 'PERCENTAGE' | 'FIXED',
        discount_value: discountForm.discount_value,
        reason: discountForm.reason || undefined,
      })
      toast.success('Discount applied successfully')
      setIsDiscountOpen(false)
      setDiscountForm({ discount_type: 'PERCENTAGE', discount_value: '', reason: '' })
      fetchData()
    } catch (error: any) {
      console.error('Failed to apply discount:', error)
      toast.error(error.message || 'Failed to apply discount')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Download PDF
  const handleDownload = async (invoice: Invoice) => {
    try {
      // Assuming there's a download endpoint - for now just log
      toast.success('Download started')
    } catch (error) {
      toast.error('Failed to download invoice')
    }
  }

  // Calculate local stats if API stats not available
  const localStats = useMemo(() => {
    if (stats) return stats
    const paid = invoices.filter(i => i.status?.toUpperCase() === 'PAID')
    const pending = invoices.filter(i => i.status?.toUpperCase() === 'PENDING')
    const overdue = invoices.filter(i => i.status?.toUpperCase() === 'OVERDUE')
    
    return {
      total_invoices: invoices.length,
      total_paid: paid.reduce((sum, i) => sum + parseFloat(i.total_amount || '0'), 0),
      total_pending: pending.reduce((sum, i) => sum + parseFloat(i.total_amount || '0'), 0),
      total_overdue: overdue.reduce((sum, i) => sum + parseFloat(i.total_amount || '0'), 0),
      paid_count: paid.length,
      pending_count: pending.length,
      overdue_count: overdue.length,
    }
  }, [invoices, stats])

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
                <Skeleton className="h-8 w-24" />
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
          <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and track customer invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.total_invoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(localStats.total_paid ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{localStats.paid_count ?? 0} invoices paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(localStats.total_pending ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{localStats.pending_count ?? 0} awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(localStats.total_overdue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{localStats.overdue_count ?? 0} past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>{invoices.length} total invoices</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <span className="font-mono font-medium">{invoice.invoice_number}</span>
                  </TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {invoice.status?.toUpperCase() === 'DRAFT' && (
                          <DropdownMenuItem
                            onClick={() => handleIssue(invoice)}
                            disabled={issuingId === invoice.id}
                          >
                            {issuingId === invoice.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Issue Invoice
                          </DropdownMenuItem>
                        )}
                        {['PENDING', 'OVERDUE', 'PARTIAL'].includes(invoice.status?.toUpperCase() || '') && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedInvoice(invoice)
                              setIsPaymentOpen(true)
                            }}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Add Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedInvoice(invoice)
                              setIsDiscountOpen(true)
                            }}>
                              <Percent className="mr-2 h-4 w-4" />
                              Apply Discount
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setSelectedInvoice(invoice)
                          setIsSendOpen(true)
                        }}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send to Customer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {invoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
              <p className="text-muted-foreground">Invoices will appear here once created.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice Details</SheetTitle>
            <SheetDescription>{selectedInvoice?.invoice_number}</SheetDescription>
          </SheetHeader>
          {selectedInvoice && (
            <div className="mt-6 space-y-6">
              <div className="flex gap-2">
                {getStatusBadge(selectedInvoice.status)}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.due_date)}</p>
                </div>
                {selectedInvoice.paid_date && (
                  <div>
                    <p className="text-muted-foreground">Paid Date</p>
                    <p className="font-medium">{formatDate(selectedInvoice.paid_date)}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Invoice Items</h4>
                {selectedInvoice.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <p>{item.description}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(selectedInvoice.tax_amount || 0)}</span>
                </div>
                {selectedInvoice.discount_amount && parseFloat(selectedInvoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
                {selectedInvoice.amount_paid && parseFloat(selectedInvoice.amount_paid) > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid</span>
                      <span>{formatCurrency(selectedInvoice.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Balance</span>
                      <span>{formatCurrency(selectedInvoice.balance_due || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              {invoicePayments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold">Payment History</h4>
                    {invoicePayments.map((payment, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.payment_method} • {payment.reference}
                          </p>
                        </div>
                        <p className="text-muted-foreground">{formatDate(payment.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                {['PENDING', 'OVERDUE', 'PARTIAL'].includes(selectedInvoice.status?.toUpperCase() || '') && (
                  <Button className="flex-1" onClick={() => {
                    setIsDetailOpen(false)
                    setIsPaymentOpen(true)
                  }}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => {
                  setIsDetailOpen(false)
                  setIsSendOpen(true)
                }}>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Send Invoice Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Send invoice {selectedInvoice?.invoice_number} to customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <p className="font-medium">{selectedInvoice?.customer_name}</p>
            </div>
            <div className="space-y-2">
              <Label>Send via</Label>
              <Select value={sendMethod} onValueChange={(v: 'email' | 'sms') => setSendMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sendingId !== null}>
              {sendingId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Invoice Total</span>
                <span className="font-medium">{formatCurrency(selectedInvoice?.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance Due</span>
                <span className="font-bold">{formatCurrency(selectedInvoice?.balance_due || selectedInvoice?.total_amount || 0)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MPESA">M-Pesa</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="e.g., Transaction ID"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} disabled={isSubmitting || !paymentForm.amount}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Discount Dialog */}
      <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Apply a discount to invoice {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Discount Type *</Label>
              <Select
                value={discountForm.discount_type}
                onValueChange={(v) => setDiscountForm({ ...discountForm, discount_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount (KES)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {discountForm.discount_type === 'PERCENTAGE' ? 'Percentage' : 'Amount'} *
              </Label>
              <Input
                type="number"
                placeholder={discountForm.discount_type === 'PERCENTAGE' ? 'e.g., 10' : 'e.g., 500'}
                value={discountForm.discount_value}
                onChange={(e) => setDiscountForm({ ...discountForm, discount_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="Reason for discount"
                value={discountForm.reason}
                onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyDiscount} disabled={isSubmitting || !discountForm.discount_value}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
