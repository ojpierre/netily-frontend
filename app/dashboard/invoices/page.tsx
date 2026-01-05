"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Download, Eye, CreditCard, DollarSign, CheckCircle2, Clock, Loader2, Smartphone, Phone, Building2 } from "lucide-react"
import { toast } from "sonner"
import type { PaymentMethod, PayHeroResponse } from "@/lib/types"

interface Invoice {
  id: number
  invoice_number?: string
  invoice_date: string
  due_date: string
  amount: string
  paid: boolean
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all")
  const [useMockData, setUseMockData] = useState(false)

  // PayHero payment states
  const [isPayNowOpen, setIsPayNowOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [payHeroForm, setPayHeroForm] = useState({
    phone_number: '',
    channel_id: '',
  })
  const [payHeroResponse, setPayHeroResponse] = useState<PayHeroResponse | null>(null)
  const [pollingPaymentId, setPollingPaymentId] = useState<number | null>(null)
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'instructions'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data
  const mockInvoices: Invoice[] = [
    {
      id: 1,
      invoice_number: "INV-0001",
      invoice_date: "2024-11-01",
      due_date: "2024-11-15",
      amount: "2000.00",
      paid: true
    },
    {
      id: 2,
      invoice_number: "INV-0002",
      invoice_date: "2024-10-01",
      due_date: "2024-10-15",
      amount: "2000.00",
      paid: true
    },
    {
      id: 3,
      invoice_number: "INV-0003",
      invoice_date: "2024-09-01",
      due_date: "2024-09-15",
      amount: "2000.00",
      paid: true
    },
    {
      id: 4,
      invoice_number: "INV-0004",
      invoice_date: "2024-12-01",
      due_date: "2024-12-15",
      amount: "2000.00",
      paid: false
    },
    {
      id: 5,
      invoice_number: "INV-0005",
      invoice_date: "2024-08-01",
      due_date: "2024-08-15",
      amount: "1500.00",
      paid: true
    },
  ]

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await api.getInvoices()
      setInvoices(response.results || [])
      setUseMockData(false)
    } catch (error) {
      console.log("API failed, using mock data")
      setInvoices(mockInvoices)
      setUseMockData(true)
      toast.info("Using demo data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const methods = await api.getActivePaymentMethods()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
  }

  // Open Pay Now dialog for an invoice
  const openPayNowDialog = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    await fetchPaymentMethods()
    setPaymentStep('form')
    setPayHeroResponse(null)
    setIsPayNowOpen(true)
  }

  // Initiate PayHero payment
  const handleInitiatePayment = async () => {
    if (!selectedInvoice) return

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
      const response = await api.initiatePayment({
        amount: selectedInvoice.amount,
        external_reference: selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`,
        channel_id: payHeroForm.channel_id ? parseInt(payHeroForm.channel_id) : undefined,
        phone_number: payHeroForm.phone_number ? payHeroForm.phone_number : undefined,
        invoice_id: selectedInvoice.id,
      })

      if (response.status === 'failed' || response.status === 'error') {
        toast.error(response.error || 'Failed to initiate payment')
        setPaymentStep('form')
        return
      }

      // Handle different response types based on PayHero channel
      const payhero = response.payhero_response
      setPayHeroResponse(payhero as PayHeroResponse || null)

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
        loadInvoices()
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
        const payment = await api.pollPaymentStatus(paymentId)
        const status = payment.status?.toUpperCase()

        if (status === 'COMPLETED') {
          clearInterval(pollInterval)
          setPollingPaymentId(null)
          toast.success('Payment completed successfully!')
          setIsPayNowOpen(false)
          resetPayHeroForm()
          loadInvoices()
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
      phone_number: '',
      channel_id: '',
    })
    setPayHeroResponse(null)
    setPaymentStep('form')
    setPollingPaymentId(null)
    setSelectedInvoice(null)
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === "paid") return inv.paid
    if (filter === "unpaid") return !inv.paid
    return true
  })

  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
  const paidAmount = invoices
    .filter((inv) => inv.paid)
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
  const unpaidAmount = totalAmount - paidAmount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-600 mt-1">View and manage your billing invoices</p>
      </div>

      {useMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">ℹ️</span>
          </div>
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Using mock data. Login to see your actual invoices.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900">
                KSh {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                KSh {paidAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Unpaid</p>
              <p className="text-2xl font-bold text-orange-600">
                KSh {unpaidAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Filter:</span>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({invoices.length})
          </Button>
          <Button
            variant={filter === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("paid")}
          >
            Paid ({invoices.filter((i) => i.paid).length})
          </Button>
          <Button
            variant={filter === "unpaid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unpaid")}
          >
            Unpaid ({invoices.filter((i) => !i.paid).length})
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold">Invoice History</h2>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No invoices found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">#{invoice.id}</TableCell>
                  <TableCell>
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold">
                    KSh {parseFloat(invoice.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {invoice.paid ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!invoice.paid && (
                        <Button 
                          size="sm" 
                          onClick={() => openPayNowDialog(invoice)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => toast.info("View invoice details")}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info("Download invoice")}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* PayHero Payment Dialog */}
      <Dialog open={isPayNowOpen} onOpenChange={(open) => {
        if (!open) resetPayHeroForm()
        setIsPayNowOpen(open)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Invoice</DialogTitle>
            <DialogDescription>
              {paymentStep === 'form' && selectedInvoice && (
                <>Pay KSh {parseFloat(selectedInvoice.amount).toFixed(2)} for Invoice #{selectedInvoice.invoice_number || selectedInvoice.id}</>
              )}
              {paymentStep === 'processing' && 'Processing your payment...'}
              {paymentStep === 'instructions' && 'Complete your payment'}
            </DialogDescription>
          </DialogHeader>

          {/* Form Step */}
          {paymentStep === 'form' && (
            <div className="grid gap-4 py-4">
              {selectedInvoice && (
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Amount to Pay</span>
                    <span className="text-xl font-bold text-green-600">
                      KSh {parseFloat(selectedInvoice.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={payHeroForm.channel_id}
                  onValueChange={(value) => setPayHeroForm({ ...payHeroForm, channel_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
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
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="254712345678"
                  value={payHeroForm.phone_number}
                  onChange={(e) => setPayHeroForm({ ...payHeroForm, phone_number: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Required for M-Pesa STK Push. Format: 254XXXXXXXXX
                </p>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {paymentStep === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
              <p className="text-slate-600">Initiating payment...</p>
            </div>
          )}

          {/* Instructions Step */}
          {paymentStep === 'instructions' && payHeroResponse && (
            <div className="grid gap-4 py-4">
              {/* STK Push Instructions */}
              {payHeroResponse.checkout_request_id && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Smartphone className="h-5 w-5" />
                    <span className="font-semibold">Check Your Phone</span>
                  </div>
                  <p className="text-sm text-slate-600">
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 mb-3">
                    <Phone className="h-5 w-5" />
                    <span className="font-semibold">M-Pesa Paybill</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paybill Number:</span>
                      <span className="font-mono font-bold">{payHeroResponse.paybill_number}</span>
                    </div>
                    {payHeroResponse.account_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Account Number:</span>
                        <span className="font-mono font-bold">{payHeroResponse.account_number}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Amount:</span>
                      <span className="font-bold">KSh {parseFloat(selectedInvoice?.amount || '0').toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-xs text-slate-500">
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 mb-3">
                    <Phone className="h-5 w-5" />
                    <span className="font-semibold">M-Pesa Till (Buy Goods)</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Till Number:</span>
                      <span className="font-mono font-bold">{payHeroResponse.till_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Amount:</span>
                      <span className="font-bold">KSh {parseFloat(selectedInvoice?.amount || '0').toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-xs text-slate-500">
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
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 mb-3">
                    <Building2 className="h-5 w-5" />
                    <span className="font-semibold">Bank Transfer</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {payHeroResponse.bank_details.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Bank:</span>
                        <span className="font-bold">{payHeroResponse.bank_details.bank_name}</span>
                      </div>
                    )}
                    {payHeroResponse.bank_details.account_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Account:</span>
                        <span className="font-mono font-bold">{payHeroResponse.bank_details.account_number}</span>
                      </div>
                    )}
                    {payHeroResponse.bank_details.account_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Account Name:</span>
                        <span className="font-bold">{payHeroResponse.bank_details.account_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Amount:</span>
                      <span className="font-bold">KSh {parseFloat(selectedInvoice?.amount || '0').toFixed(2)}</span>
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
                <Button 
                  onClick={handleInitiatePayment} 
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
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
                  loadInvoices()
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