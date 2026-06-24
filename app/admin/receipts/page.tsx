"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  FileText,
  Plus,
  MoreVertical,
  RefreshCw,
  Download,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  MessageSquare,
  Loader2,
  Eye,
  Send,
  Printer,
  Share2,
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
import type { Receipt, ReceiptStatus } from "@/lib/types"

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

const getStatusBadge = (status: ReceiptStatus) => {
  const badges: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: typeof Clock; className?: string }> = {
    'DRAFT': { variant: 'secondary' as const, label: 'Draft', icon: Clock, className: '' },
    'ISSUED': { variant: 'default' as const, label: 'Issued', icon: CheckCircle, className: 'bg-success' },
    'CANCELLED': { variant: 'destructive' as const, label: 'Cancelled', icon: XCircle, className: '' },
  }
  const badge = badges[status] || { variant: 'outline' as const, label: status, icon: Clock, className: '' }
  const Icon = badge.icon
  return (
    <Badge variant={badge.variant} className={badge.className || ''}>
      <Icon className="mr-1 h-3 w-3" />
      {badge.label}
    </Badge>
  )
}

export default function ReceiptsPage() {
  // Data states
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [sharingId, setSharingId] = useState<number | null>(null)
  const [issuingId, setIssuingId] = useState<number | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // UI states
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareMethod, setShareMethod] = useState<'email' | 'sms'>('email')

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-created_at' }
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchQuery) params.search = searchQuery

      const response = await adminApi.getReceipts(params)
      setReceipts(Array.isArray(response) ? response : response.results || [])
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
      toast.error('Failed to load receipts')
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

  // Issue receipt
  const handleIssue = async (receipt: Receipt) => {
    setIssuingId(receipt.id)
    try {
      await adminApi.issueReceipt(receipt.id)
      toast.success('Receipt issued successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to issue receipt:', error)
      toast.error(error.message || 'Failed to issue receipt')
    } finally {
      setIssuingId(null)
    }
  }

  // Download PDF
  const handleDownload = async (receipt: Receipt) => {
    setDownloadingId(receipt.id)
    try {
      const blob = await adminApi.downloadReceiptPDF(receipt.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${receipt.receipt_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Receipt downloaded')
    } catch (error: any) {
      console.error('Failed to download receipt:', error)
      toast.error(error.message || 'Failed to download receipt')
    } finally {
      setDownloadingId(null)
    }
  }

  // Share receipt
  const handleShare = async () => {
    if (!selectedReceipt) return

    setSharingId(selectedReceipt.id)
    try {
      await adminApi.shareReceipt(selectedReceipt.id, shareMethod)
      toast.success(`Receipt sent via ${shareMethod === 'email' ? 'email' : 'SMS'}`)
      setIsShareOpen(false)
    } catch (error: any) {
      console.error('Failed to share receipt:', error)
      toast.error(error.message || 'Failed to share receipt')
    } finally {
      setSharingId(null)
    }
  }

  // View details
  const handleViewDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsDetailOpen(true)
  }

  // Open share dialog
  const openShareDialog = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsShareOpen(true)
  }

  // Stats
  const stats = {
    total: receipts.length,
    issued: receipts.filter(r => r.status === 'ISSUED').length,
    draft: receipts.filter(r => r.status === 'DRAFT').length,
    totalAmount: receipts
      .filter(r => r.status === 'ISSUED')
      .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0),
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            Manage payment receipts and send to customers
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.issued}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipted</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Receipt History</CardTitle>
              <CardDescription>{receipts.length} receipts found</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Ref</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <span className="font-mono font-medium">{receipt.receipt_number}</span>
                  </TableCell>
                  <TableCell>{receipt.customer_name}</TableCell>
                  <TableCell>
                    {receipt.payment_reference ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {receipt.payment_reference}
                      </code>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(receipt.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                  <TableCell>{receipt.issued_by_name || '-'}</TableCell>
                  <TableCell>{formatDate(receipt.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(receipt)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {receipt.status === 'DRAFT' && (
                          <DropdownMenuItem 
                            onClick={() => handleIssue(receipt)}
                            disabled={issuingId === receipt.id}
                          >
                            {issuingId === receipt.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Issue Receipt
                          </DropdownMenuItem>
                        )}
                        {receipt.status === 'ISSUED' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDownload(receipt)}
                              disabled={downloadingId === receipt.id}
                            >
                              {downloadingId === receipt.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="mr-2 h-4 w-4" />
                              )}
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openShareDialog(receipt)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {receipts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No receipts found</h3>
              <p className="text-muted-foreground">Receipts are automatically created when payments are processed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Receipt Details</SheetTitle>
            <SheetDescription>
              {selectedReceipt?.receipt_number}
            </SheetDescription>
          </SheetHeader>
          {selectedReceipt && (
            <div className="mt-6 space-y-6">
              <div className="flex gap-2">
                {getStatusBadge(selectedReceipt.status)}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Receipt Number</p>
                  <p className="font-mono font-medium">{selectedReceipt.receipt_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedReceipt.amount)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedReceipt.customer_name}</p>
                </div>
                {selectedReceipt.payment_reference && (
                  <div>
                    <p className="text-muted-foreground">Payment Reference</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{selectedReceipt.payment_reference}</code>
                  </div>
                )}
                {selectedReceipt.issued_by_name && (
                  <div>
                    <p className="text-muted-foreground">Issued By</p>
                    <p className="font-medium">{selectedReceipt.issued_by_name}</p>
                  </div>
                )}
                {selectedReceipt.issued_at && (
                  <div>
                    <p className="text-muted-foreground">Issued At</p>
                    <p className="font-medium">{formatDateTime(selectedReceipt.issued_at)}</p>
                  </div>
                )}
                {selectedReceipt.notes && (
                  <div>
                    <p className="text-muted-foreground">Notes</p>
                    <p>{selectedReceipt.notes}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                {selectedReceipt.status === 'DRAFT' && (
                  <Button 
                    className="flex-1"
                    onClick={() => handleIssue(selectedReceipt)}
                    disabled={issuingId === selectedReceipt.id}
                  >
                    {issuingId === selectedReceipt.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Send className="mr-2 h-4 w-4" />
                    Issue
                  </Button>
                )}
                {selectedReceipt.status === 'ISSUED' && (
                  <>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(selectedReceipt)}
                      disabled={downloadingId === selectedReceipt.id}
                    >
                      {downloadingId === selectedReceipt.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        setIsDetailOpen(false)
                        openShareDialog(selectedReceipt)
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Receipt</DialogTitle>
            <DialogDescription>
              Send receipt {selectedReceipt?.receipt_number} to customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <p className="font-medium">{selectedReceipt?.customer_name}</p>
            </div>
            <div className="space-y-2">
              <Label>Send via</Label>
              <Select value={shareMethod} onValueChange={(v: 'email' | 'sms') => setShareMethod(v)}>
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
            <Button variant="outline" onClick={() => setIsShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={sharingId !== null}>
              {sharingId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
