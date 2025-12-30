"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Download,
  Send,
  Eye,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Mail,
  MessageSquare,
  Printer,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  BarChart3,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Invoice, InvoiceItem } from "@/lib/types"

type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'

// Mock data for invoices
const generateMockInvoices = (): Invoice[] => {
  const statuses: InvoiceStatus[] = ['paid', 'paid', 'paid', 'pending', 'pending', 'overdue', 'draft', 'cancelled']
  const plans = ["Home Fiber 20Mbps", "Home Fiber 50Mbps", "Business 100Mbps", "SME Package"]
  
  const invoices: Invoice[] = []
  for (let i = 1; i <= 40; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const baseAmount = [2500, 4500, 8500, 15000][Math.floor(Math.random() * 4)]
    const taxAmount = Math.round(baseAmount * 0.16)
    const invoiceDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
    const dueDate = new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000)
    
    invoices.push({
      id: i,
      invoice_number: `INV-${String(2024001 + i).padStart(7, '0')}`,
      customer: 1000 + i,
      customer_name: `Customer ${i}`,
      amount: baseAmount.toString(),
      tax_amount: taxAmount.toString(),
      total_amount: (baseAmount + taxAmount).toString(),
      status,
      invoice_date: invoiceDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      paid_date: status === 'paid' ? new Date(dueDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      items: [
        {
          id: 1,
          description: plans[Math.floor(Math.random() * plans.length)],
          quantity: 1,
          unit_price: baseAmount.toString(),
          total: baseAmount.toString(),
        },
      ],
      created_at: invoiceDate.toISOString(),
    })
  }
  return invoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
}

const getStatusBadge = (status: InvoiceStatus) => {
  const config: Record<InvoiceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    paid: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    overdue: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
    draft: { variant: "outline", icon: <FileText className="h-3 w-3" /> },
    cancelled: { variant: "outline", icon: <XCircle className="h-3 w-3" /> },
  }
  const c = config[status]
  return (
    <Badge variant={c.variant} className="capitalize gap-1">
      {c.icon}
      {status}
    </Badge>
  )
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num)
}

export default function InvoiceManagementPage() {
  const [invoices] = useState<Invoice[]>(generateMockInvoices())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null)
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'both'>('email')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("all")

  // Create invoice form state
  const [createForm, setCreateForm] = useState({
    customer: "",
    items: [{ description: "", quantity: 1, unit_price: "" }],
    due_days: "14",
    notes: "",
  })

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(inv => inv.status === activeTab)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const days = parseInt(dateFilter)
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(inv => new Date(inv.invoice_date) >= cutoff)
    }

    return filtered
  }, [invoices, searchQuery, statusFilter, dateFilter, activeTab])

  // Stats
  const stats = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'paid')
    const pending = invoices.filter(i => i.status === 'pending')
    const overdue = invoices.filter(i => i.status === 'overdue')
    
    const totalPaid = paid.reduce((sum, i) => sum + parseFloat(i.total_amount), 0)
    const totalPending = pending.reduce((sum, i) => sum + parseFloat(i.total_amount), 0)
    const totalOverdue = overdue.reduce((sum, i) => sum + parseFloat(i.total_amount), 0)
    
    return {
      totalInvoices: invoices.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      totalPaid,
      totalPending,
      totalOverdue,
      totalOutstanding: totalPending + totalOverdue,
    }
  }, [invoices])

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailOpen(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleSendInvoice = async () => {
    if (invoiceToSend) {
      console.log("Sending invoice:", invoiceToSend.invoice_number, "via:", sendMethod)
      setIsSendDialogOpen(false)
      setInvoiceToSend(null)
    }
  }

  const handleMarkPaid = async (invoice: Invoice) => {
    console.log("Marking invoice as paid:", invoice.invoice_number)
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    console.log("Downloading PDF for:", invoice.invoice_number)
  }

  const handleCreateInvoice = async () => {
    console.log("Creating invoice:", createForm)
    setIsCreateDialogOpen(false)
    setCreateForm({
      customer: "",
      items: [{ description: "", quantity: 1, unit_price: "" }],
      due_days: "14",
      notes: "",
    })
  }

  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const toggleAllRows = () => {
    if (selectedRows.length === filteredInvoices.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredInvoices.map(i => i.id))
    }
  }

  const addInvoiceItem = () => {
    setCreateForm(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: "" }],
    }))
  }

  const removeInvoiceItem = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateInvoiceItem = (index: number, field: string, value: string | number) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
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
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.paidCount} invoices paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount} invoices pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount} invoices overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">{invoices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-2">{stats.pendingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue
            <Badge variant="destructive" className="ml-2">{stats.overdueCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid
            <Badge variant="secondary" className="ml-2">{stats.paidCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>
                    {filteredInvoices.length} invoices found
                  </CardDescription>
                </div>
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedRows.length} selected
                    </span>
                    <Button variant="outline" size="sm">
                      <Send className="mr-2 h-4 w-4" />
                      Send Selected
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedRows.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={toggleAllRows}
                      />
                    </TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(invoice.id)}
                          onCheckedChange={() => toggleRowSelection(invoice.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">{invoice.invoice_number}</span>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/users/${invoice.customer}`}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <User className="h-3 w-3" />
                          {invoice.customer_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                          <span className="text-xs text-muted-foreground">
                            incl. VAT {formatCurrency(invoice.tax_amount || 0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={invoice.status === 'overdue' ? 'text-red-600' : ''}>
                          {new Date(invoice.due_date).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="mr-2 h-4 w-4" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setInvoiceToSend(invoice)
                                setIsSendDialogOpen(true)
                              }}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send to Customer
                            </DropdownMenuItem>
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleMarkPaid(invoice)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedInvoice && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedInvoice.invoice_number}
                  {getStatusBadge(selectedInvoice.status)}
                </SheetTitle>
                <SheetDescription>
                  Invoice for {selectedInvoice.customer_name}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Invoice Preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-bold">INVOICE</h3>
                        <p className="text-sm text-muted-foreground">{selectedInvoice.invoice_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Netily ISP</p>
                        <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Bill To</Label>
                        <p className="font-medium">{selectedInvoice.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <Label className="text-muted-foreground">Invoice Date</Label>
                        <p className="font-medium">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Customer ID</Label>
                        <p className="font-medium">#{selectedInvoice.customer}</p>
                      </div>
                      <div className="text-right">
                        <Label className="text-muted-foreground">Due Date</Label>
                        <p className={`font-medium ${selectedInvoice.status === 'overdue' ? 'text-red-600' : ''}`}>
                          {new Date(selectedInvoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedInvoice.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>VAT (16%)</span>
                        <span>{formatCurrency(selectedInvoice.tax_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                      </div>
                    </div>

                    {selectedInvoice.paid_date && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-sm text-green-600 font-medium">
                          Paid on {new Date(selectedInvoice.paid_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleDownloadPDF(selectedInvoice)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setInvoiceToSend(selectedInvoice)
                      setIsSendDialogOpen(true)
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </div>

                {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleMarkPaid(selectedInvoice)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Generate an invoice for a customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={createForm.customer} onValueChange={(v) => setCreateForm({ ...createForm, customer: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1001">John Doe - Home Fiber 50Mbps</SelectItem>
                  <SelectItem value="1002">Jane Smith - Business 100Mbps</SelectItem>
                  <SelectItem value="1003">Bob Wilson - Home Fiber 20Mbps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Items</Label>
              {createForm.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value))}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) => updateInvoiceItem(index, 'unit_price', e.target.value)}
                    className="w-28"
                  />
                  {createForm.items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInvoiceItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addInvoiceItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="due_days">Payment Due</Label>
                <Select value={createForm.due_days} onValueChange={(v) => setCreateForm({ ...createForm, due_days: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes for the invoice..."
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invoice Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Send invoice {invoiceToSend?.invoice_number} to {invoiceToSend?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Send via</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="email"
                    checked={sendMethod === 'email'}
                    onChange={() => setSendMethod('email')}
                    className="h-4 w-4"
                  />
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="sms"
                    checked={sendMethod === 'sms'}
                    onChange={() => setSendMethod('sms')}
                    className="h-4 w-4"
                  />
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="both"
                    checked={sendMethod === 'both'}
                    onChange={() => setSendMethod('both')}
                    className="h-4 w-4"
                  />
                  Both
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvoice}>
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
