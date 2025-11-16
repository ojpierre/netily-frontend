"use client"

import React, { useState, useEffect } from "react"
import {
  CreditCard,
  Search,
  Download,
  Eye,
  Filter,
  TrendingUp,
  Loader2,
  Phone,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Payment = {
  id: string
  transactionId: string
  userId: string
  userName: string
  amount: number
  method: "mpesa" | "pokopoko" | "airtel" | "card"
  status: "completed" | "pending" | "failed" | "refunded"
  plan: string
  phoneNumber?: string
  date: string
  time: string
}

const generateMockPayments = (): Payment[] => {
  const methods: Payment["method"][] = ["mpesa", "pokopoko", "airtel", "card"]
  const statuses: Payment["status"][] = ["completed", "pending", "failed", "refunded"]
  const plans = ["Mtaani-8 Weekly", "Mtaani-10 Monthly", "Mtaani-12 Quarterly"]

  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2025, 10, Math.floor(Math.random() * 16) + 1)
    return {
      id: `PAY-${10000 + i}`,
      transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId: `USR-${1000 + Math.floor(Math.random() * 100)}`,
      userName: `User ${Math.floor(Math.random() * 100) + 1}`,
      amount: [350, 450, 1200, 2000, 3200][Math.floor(Math.random() * 5)],
      method: methods[Math.floor(Math.random() * methods.length)],
      status: i < 3 ? statuses[1] : i < 5 ? statuses[2] : i === 5 ? statuses[3] : statuses[0],
      plan: plans[Math.floor(Math.random() * plans.length)],
      phoneNumber: `+254 7${Math.floor(10000000 + Math.random() * 90000000)}`,
      date: date.toISOString().split("T")[0],
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(
        Math.floor(Math.random() * 60)
      ).padStart(2, "0")}`,
    }
  }).sort((a, b) => new Date(b.date + " " + b.time).getTime() - new Date(a.date + " " + a.time).getTime())
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        await new Promise((resolve) => setTimeout(resolve, 700))
        setPayments(generateMockPayments())
      } catch (err) {
        setError("Failed to load payments. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  })

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)

  const getStatusBadge = (status: Payment["status"]) => {
    const variants = {
      completed: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      refunded: "bg-blue-100 text-blue-700 border-blue-200",
    }
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getMethodIcon = (method: Payment["method"]) => {
    switch (method) {
      case "mpesa":
        return <Phone className="w-4 h-4 text-green-600" />
      case "pokopoko":
        return <Smartphone className="w-4 h-4 text-blue-600" />
      case "airtel":
        return <Smartphone className="w-4 h-4 text-red-600" />
      case "card":
        return <CreditCard className="w-4 h-4 text-indigo-600" />
    }
  }

  const getMethodName = (method: Payment["method"]) => {
    return {
      mpesa: "M-Pesa",
      pokopoko: "Kopokopo",
      airtel: "Airtel Money",
      card: "Bank Card",
    }[method]
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setDialogOpen(true)
  }

  const totalRevenue = filteredPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Payments & Billing</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments & Billing</h1>
          <p className="text-slate-500 mt-1">Track all payment transactions</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  KSh {totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">Completed payments</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {payments.filter((p) => p.status === "completed").length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {payments.filter((p) => p.status === "pending").length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {payments.filter((p) => p.status === "failed").length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by transaction ID, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="pokopoko">Kopokopo</SelectItem>
                <SelectItem value="airtel">Airtel Money</SelectItem>
                <SelectItem value="card">Bank Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredPayments.length})</CardTitle>
          <CardDescription>
            Showing {paginatedPayments.length} of {filteredPayments.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No payments found</p>
              <p className="text-slate-500 text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{payment.id}</p>
                            <p className="text-xs text-slate-500">{payment.transactionId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{payment.userName}</p>
                            <p className="text-xs text-slate-500">{payment.userId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-900">
                            KSh {payment.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(payment.method)}
                            <span className="text-sm">{getMethodName(payment.method)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{payment.plan}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{payment.date}</p>
                            <p className="text-slate-500">{payment.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Complete transaction information</DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedPayment.status)}
                <div className="flex items-center gap-2">
                  {getMethodIcon(selectedPayment.method)}
                  <span className="text-sm font-medium">
                    {getMethodName(selectedPayment.method)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Payment ID</span>
                  <span className="text-sm font-medium">{selectedPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Transaction ID</span>
                  <span className="text-sm font-mono">{selectedPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">User</span>
                  <span className="text-sm font-medium">{selectedPayment.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">User ID</span>
                  <span className="text-sm">{selectedPayment.userId}</span>
                </div>
                {selectedPayment.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Phone Number</span>
                    <span className="text-sm font-medium">{selectedPayment.phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Plan</span>
                    <span className="text-sm font-medium">{selectedPayment.plan}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="text-2xl font-bold text-blue-600">
                      KSh {selectedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Date & Time</span>
                <span className="font-medium">
                  {selectedPayment.date} at {selectedPayment.time}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
