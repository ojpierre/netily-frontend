"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  
  Trash2,
  X,
  ChevronDown,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"

const API_BASE = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}${window.location.hostname.includes('localhost') ? ':8000' : ''}/api/v1`
  : '/api/v1'

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num || 0)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatusBadge = (status: string) => {
  const s = (status || '').toUpperCase()
  const config: Record<string, any> = {
    PAID: { className: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
    ISSUED: { className: "bg-blue-100 text-blue-800", icon: <Send className="h-3 w-3" /> },
    PENDING: { className: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
    OVERDUE: { className: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" /> },
    DRAFT: { className: "bg-gray-100 text-gray-800", icon: <FileText className="h-3 w-3" /> },
    CANCELLED: { className: "bg-gray-100 text-gray-500", icon: <XCircle className="h-3 w-3" /> },
    PARTIAL: { className: "bg-orange-100 text-orange-800", icon: <DollarSign className="h-3 w-3" /> },
  }
  const c = config[s] || config.DRAFT
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.icon}{s.toLowerCase()}
    </span>
  )
}

// ── Customer Search Combobox ──────────────────────────────────────────
function CustomerSearchCombobox({ value, onChange }: {
  value: { id: number; full_name: string; customer_code: string } | null
  onChange: (v: { id: number; full_name: string; customer_code: string } | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<any>(null)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || ''
      const res = await fetch(`${API_BASE}/billing/customers/search/?q=${encodeURIComponent(q)}&limit=8`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
      }
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(query), 250)
  }, [query, search])

  useEffect(() => { search('') }, [search])

  return (
    <div className="relative">
      <div
        className="flex items-center border rounded-md px-3 py-2 gap-2 cursor-pointer bg-background"
        onClick={() => setOpen(o => !o)}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm">
          {value ? `${value.full_name} (${value.customer_code})` : 'Search customer...'}
        </span>
        {value && (
          <X className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={e => { e.stopPropagation(); onChange(null) }} />
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
          <div className="p-2">
            <Input
              placeholder="Name or phone..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              className="h-8"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>}
            {!loading && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No customers found</div>
            )}
            {results.map(c => (
              <div
                key={c.id}
                className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                onClick={() => { onChange(c); setOpen(false); setQuery('') }}
              >
                <div className="font-medium">{c.full_name}</div>
                <div className="text-xs text-muted-foreground">{c.phone_number} · {c.customer_code}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Invoice Line Items Editor ─────────────────────────────────────────
const SERVICE_ITEMS = [
  'Internet Subscription', 'Installation Fee', 'Router Setup',
  'Maintenance', 'Equipment', 'Other',
]

function LineItemsEditor({ items, onChange }: {
  items: { description: string; quantity: number; unit_price: string }[]
  onChange: (items: { description: string; quantity: number; unit_price: string }[]) => void
}) {
  const add = () => onChange([...items, { description: 'Internet Subscription', quantity: 1, unit_price: '' }])
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, val: any) => {
    const next = [...items]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <Select value={item.description} onValueChange={v => update(i, 'description', v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Item" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_ITEMS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Input
              type="number" min={1} value={item.quantity} className="h-8 text-xs"
              onChange={e => update(i, 'quantity', parseInt(e.target.value) || 1)}
              placeholder="Qty"
            />
          </div>
          <div className="col-span-4">
            <Input
              type="number" value={item.unit_price} className="h-8 text-xs"
              onChange={e => update(i, 'unit_price', e.target.value)}
              placeholder="Amount (KES)"
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full text-xs mt-1">
        + Add Line Item
      </Button>
    </div>
  )
}

// ── Invoice Preview Modal ─────────────────────────────────────────────
function InvoicePreviewModal({ invoice, open, onClose, companyName }: {
  invoice: any; open: boolean; onClose: () => void; companyName: string
}) {
  if (!invoice) return null
  const total = parseFloat(invoice.total_amount || '0')
  const paid = parseFloat(invoice.amount_paid || '0')
  const balance = total - paid

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>
        <div className="bg-white p-6 border rounded-lg space-y-6 font-sans text-sm">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{companyName}</h2>
              <p className="text-blue-600 font-semibold text-lg mt-1">INVOICE</p>
            </div>
            <div className="text-right space-y-1">
              <div><span className="font-medium">Invoice #:</span> {invoice.invoice_number || invoice.id}</div>
              <div><span className="font-medium">Date:</span> {formatDate(invoice.billing_date || invoice.created_at)}</div>
              <div><span className="font-medium">Due:</span> {formatDate(invoice.due_date)}</div>
              <div className="mt-1">{getStatusBadge(invoice.status)}</div>
            </div>
          </div>

          <Separator />

          {/* Bill To */}
          <div>
            <p className="font-semibold text-gray-700 mb-1">Bill To:</p>
            <p className="font-medium">{invoice.customer_name || invoice.customer?.user?.full_name || '—'}</p>
          </div>

          <Separator />

          {/* Items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left py-2 px-3 rounded-tl">Description</th>
                <th className="text-center py-2 px-3">Qty</th>
                <th className="text-right py-2 px-3">Unit Price</th>
                <th className="text-right py-2 px-3 rounded-tr">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-3">{item.description}</td>
                  <td className="py-2 px-3 text-center">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal || invoice.total_amount || 0)}</span>
              </div>
              {invoice.tax_amount && parseFloat(invoice.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              {invoice.discount_amount && parseFloat(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {paid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>{formatCurrency(paid)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Balance Due</span>
                    <span>{formatCurrency(balance)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="text-xs text-gray-500 border-t pt-3">
              <span className="font-medium">Notes: </span>{invoice.notes}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────
export default function InvoiceManagementPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [invoicePayments, setInvoicePayments] = useState<any[]>([])
  const [companyName, setCompanyName] = useState('ISP Management')

  // Auto-generate toggle
  const [autoGenEnabled, setAutoGenEnabled] = useState(false)
  const [autoGenLoading, setAutoGenLoading] = useState(false)

  // Loading
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [issuingId, setIssuingId] = useState<number | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // UI
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)

  // Create invoice form
  const [createForm, setCreateForm] = useState({
    customer: null as any,
    status: 'DRAFT',
    due_date: '',
    notes: '',
    items: [{ description: 'Internet Subscription', quantity: 1, unit_price: '' }] as any[],
  })

  // Payment form
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'MPESA', reference: '' })
  const [discountForm, setDiscountForm] = useState({
    discount_type: 'PERCENTAGE',
    discount_value: '',
    reason: '',
  })

  const getToken = () =>
    (typeof window !== 'undefined' && (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'))) || ''

  const fetchData = useCallback(async () => {
    try {
      const token = getToken()
      const params = new URLSearchParams({ ordering: '-created_at' })
      if (activeTab !== 'all') params.set('status', activeTab.toUpperCase())
      if (searchQuery) params.set('search', searchQuery)

      const [invRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/billing/invoices/?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/billing/invoice-settings/`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (invRes.ok) {
        const data = await invRes.json()
        setInvoices(Array.isArray(data) ? data : data.results || [])
        if (data.stats) setStats(data.stats)
      }
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setAutoGenEnabled(s.auto_generate_enabled)
      }

      // Company name
      try {
        const br = await fetch(`${API_BASE}/core/branding/`, { headers: { Authorization: `Bearer ${token}` } })
        if (br.ok) { const d = await br.json(); setCompanyName(d.name || 'ISP Management') }
      } catch { }

    } catch (e) {
      console.error(e)
      toast.error('Failed to load invoices')
    } finally { setIsLoading(false) }
  }, [activeTab, searchQuery])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast.success('Refreshed')
  }

  const handleToggleAutoGen = async (val: boolean) => {
    setAutoGenLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/billing/invoice-settings/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_generate_enabled: val })
      })
      if (res.ok) {
        setAutoGenEnabled(val)
        toast.success(val ? 'Auto-generation enabled' : 'Auto-generation disabled')
      }
    } catch { toast.error('Failed to update setting') } finally { setAutoGenLoading(false) }
  }

  const handleViewDetails = async (invoice: any) => {
    setSelectedInvoice(invoice)
    setIsDetailOpen(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/billing/invoices/${invoice.id}/payments/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) { const data = await res.json(); setInvoicePayments(data || []) }
    } catch { }
  }

  const handlePreview = async (invoice: any) => {
    // Fetch full invoice with items if not loaded
    if (!invoice.items || invoice.items.length === 0) {
      try {
        const token = getToken()
        const res = await fetch(`${API_BASE}/billing/invoices/${invoice.id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) { const d = await res.json(); setSelectedInvoice(d) }
        else setSelectedInvoice(invoice)
      } catch { setSelectedInvoice(invoice) }
    } else {
      setSelectedInvoice(invoice)
    }
    setIsPreviewOpen(true)
  }

  const handleDownloadPDF = async (invoice: any) => {
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/billing/invoices/${invoice.id}/pdf/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.invoice_number || invoice.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch { toast.error('PDF download failed') }
  }

  const handleAddPayment = async () => {
    if (!selectedInvoice || !paymentForm.amount) return
    setIsSubmitting(true)
    try {
      await adminApi.addPaymentToInvoice(selectedInvoice.id, paymentForm)
      toast.success('Payment recorded')
      setIsPaymentOpen(false)
      setPaymentForm({ amount: '', payment_method: 'MPESA', reference: '' })
      fetchData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to add payment')
    } finally { setIsSubmitting(false) }
  }

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
    } catch (e: any) {
      toast.error(e.message || 'Failed to apply discount')
    } finally { setIsSubmitting(false) }
  }

  const handleDeleteInvoice = async (invoice: any) => {
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/billing/invoices/${invoice.id}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok || res.status === 204) {
        toast.success('Invoice deleted')
        fetchData()
      } else toast.error('Failed to delete invoice')
    } catch { toast.error('Failed to delete invoice') }
  }

  const handleCreateInvoice = async () => {
    if (!createForm.customer) { toast.error('Please select a customer'); return }
    const validItems = createForm.items.filter(i => i.unit_price && parseFloat(i.unit_price) > 0)
    if (validItems.length === 0) { toast.error('Add at least one line item with amount'); return }
    if (!createForm.due_date) { toast.error('Please set a due date'); return }

    setIsSubmitting(true)
    try {
      const token = getToken()
      const subtotal = validItems.reduce((s, i) => s + (parseFloat(i.unit_price) * i.quantity), 0)

      const payload = {
        customer: createForm.customer.id,
        status: createForm.status,
        due_date: createForm.due_date,
        billing_date: new Date().toISOString().split('T')[0],
        notes: createForm.notes,
        items: validItems.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: parseFloat(i.unit_price),
          tax_rate: 0,
        })),
      }

      const res = await fetch(`${API_BASE}/billing/invoices/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || JSON.stringify(err) || 'Failed to create invoice')
      }

      toast.success('Invoice created successfully')
      setIsCreateOpen(false)
      setCreateForm({
        customer: null, status: 'DRAFT', due_date: '', notes: '',
        items: [{ description: 'Internet Subscription', quantity: 1, unit_price: '' }],
      })
      fetchData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create invoice')
    } finally { setIsSubmitting(false) }
  }

  const handleIssue = async (invoice: any) => {
    setIssuingId(invoice.id)
    try {
      await adminApi.issueInvoice(invoice.id)
      toast.success('Invoice issued')
      fetchData()
    } catch (e: any) {
      toast.error(e.message || 'Failed to issue invoice')
    } finally { setIssuingId(null) }
  }

  // Stats
  const localStats = useMemo(() => {
    if (stats) return stats
    const paid = invoices.filter(i => (i.status || '').toUpperCase() === 'PAID')
    const pending = invoices.filter(i => ['PENDING', 'ISSUED', 'SENT', 'PARTIAL'].includes((i.status || '').toUpperCase()))
    const overdue = invoices.filter(i => (i.status || '').toUpperCase() === 'OVERDUE')
    return {
      total_invoices: invoices.length,
      total_paid: paid.reduce((s, i) => s + parseFloat(i.total_amount || '0'), 0),
      total_pending: pending.reduce((s, i) => s + parseFloat(i.total_amount || '0'), 0),
      total_overdue: overdue.reduce((s, i) => s + parseFloat(i.total_amount || '0'), 0),
      paid_count: paid.length, pending_count: pending.length, overdue_count: overdue.length,
    }
  }, [invoices, stats])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-24" /></CardContent></Card>)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
          <p className="text-muted-foreground">Create, manage, and track customer invoices</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-generate toggle */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-muted/40">
            <span className="text-sm font-medium">Auto-generate</span>
            <Switch
              checked={autoGenEnabled}
              onCheckedChange={handleToggleAutoGen}
              disabled={autoGenLoading}
            />
            {autoGenEnabled && <span className="text-xs text-green-600 font-medium">ON</span>}
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{localStats.total_invoices}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(localStats.total_paid ?? 0)}</div>
            <p className="text-xs text-muted-foreground">{localStats.paid_count ?? 0} paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(localStats.total_pending ?? 0)}</div>
            <p className="text-xs text-muted-foreground">{localStats.pending_count ?? 0} awaiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(localStats.total_overdue ?? 0)}</div>
            <p className="text-xs text-muted-foreground">{localStats.overdue_count ?? 0} overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>{invoices.length} invoices</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="issued">Issued</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
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
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell><span className="font-mono font-medium">{inv.invoice_number || `#${inv.id}`}</span></TableCell>
                  <TableCell>{inv.customer_name || inv.customer?.user?.full_name || '—'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(inv.total_amount)}</TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell>{formatDate(inv.due_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(inv)}>
                          <Eye className="mr-2 h-4 w-4" />Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewDetails(inv)}>
                          <FileText className="mr-2 h-4 w-4" />Details
                        </DropdownMenuItem>
                        {inv.status?.toUpperCase() === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => handleIssue(inv)} disabled={issuingId === inv.id}>
                            {issuingId === inv.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Issue
                          </DropdownMenuItem>
                        )}
                        {['ISSUED', 'SENT', 'PARTIAL', 'OVERDUE', 'PENDING'].includes((inv.status || '').toUpperCase()) && (
                          <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setIsPaymentOpen(true) }}>
                            <CreditCard className="mr-2 h-4 w-4" />Add Payment
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDownloadPDF(inv)}>
                          <Download className="mr-2 h-4 w-4" />Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteInvoice(inv)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />Delete
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
              <p className="text-muted-foreground">Create an invoice or enable auto-generation.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <InvoicePreviewModal
        invoice={selectedInvoice}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        companyName={companyName}
      />

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice Details</SheetTitle>
            <SheetDescription>{selectedInvoice?.invoice_number}</SheetDescription>
          </SheetHeader>
          {selectedInvoice && (
            <div className="mt-6 space-y-4">
              <div>{getStatusBadge(selectedInvoice.status)}</div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{selectedInvoice.customer_name}</p></div>
                <div><p className="text-muted-foreground">Due Date</p><p className="font-medium">{formatDate(selectedInvoice.due_date)}</p></div>
                <div><p className="text-muted-foreground">Total</p><p className="font-bold">{formatCurrency(selectedInvoice.total_amount)}</p></div>
                <div><p className="text-muted-foreground">Paid</p><p className="font-medium text-green-600">{formatCurrency(selectedInvoice.amount_paid || 0)}</p></div>
              </div>
              {invoicePayments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Payment History</p>
                    {invoicePayments.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm bg-muted p-2 rounded">
                        <div><p className="font-medium">{formatCurrency(p.amount)}</p><p className="text-xs text-muted-foreground">{p.payment_method} · {p.reference}</p></div>
                        <p className="text-muted-foreground text-xs">{formatDate(p.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => { setIsDetailOpen(false); handlePreview(selectedInvoice) }}>
                  <Eye className="mr-2 h-4 w-4" />Preview
                </Button>
                {['ISSUED', 'SENT', 'PARTIAL', 'OVERDUE'].includes((selectedInvoice.status || '').toUpperCase()) && (
                  <Button className="flex-1" onClick={() => { setIsDetailOpen(false); setIsPaymentOpen(true) }}>
                    <CreditCard className="mr-2 h-4 w-4" />Pay
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>Record payment for invoice {selectedInvoice?.invoice_number}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="p-3 bg-muted rounded text-sm flex justify-between">
              <span>Balance Due</span>
              <span className="font-bold">{formatCurrency(
                parseFloat(selectedInvoice?.total_amount || '0') - parseFloat(selectedInvoice?.amount_paid || '0')
              )}</span>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" placeholder="Enter amount" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm({ ...paymentForm, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MPESA">M-Pesa</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input placeholder="Transaction ID" value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={isSubmitting || !paymentForm.amount}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Add a new invoice for a customer</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <CustomerSearchCombobox value={createForm.customer} onChange={v => setCreateForm(f => ({ ...f, customer: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={createForm.status} onValueChange={v => setCreateForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ISSUED">Issued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" value={createForm.due_date} onChange={e => setCreateForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Line Items *</Label>
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground mb-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-4">Amount (KES)</div>
              </div>
              <LineItemsEditor items={createForm.items} onChange={items => setCreateForm(f => ({ ...f, items }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Optional notes..." value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {/* Total preview */}
            {createForm.items.some(i => parseFloat(i.unit_price) > 0) && (
              <div className="text-right text-sm font-semibold bg-muted p-2 rounded">
                Total: {formatCurrency(createForm.items.reduce((s, i) => s + (parseFloat(i.unit_price || '0') * (i.quantity || 1)), 0))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Discount Dialog */}
      <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>Apply a discount to invoice {selectedInvoice?.invoice_number}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Discount Type *</Label>
              <Select value={discountForm.discount_type} onValueChange={v => setDiscountForm({ ...discountForm, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount (KES)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{discountForm.discount_type === 'PERCENTAGE' ? 'Percentage' : 'Amount'} *</Label>
              <Input
                type="number"
                placeholder={discountForm.discount_type === 'PERCENTAGE' ? 'e.g., 10' : 'e.g., 500'}
                value={discountForm.discount_value}
                onChange={e => setDiscountForm({ ...discountForm, discount_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input placeholder="Reason for discount" value={discountForm.reason} onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyDiscount} disabled={isSubmitting || !discountForm.discount_value}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}