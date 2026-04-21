"use client"

import React, { useState, useEffect, useCallback } from "react"
import { superAdminApi } from "@/lib/superadmin-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, RefreshCw, CreditCard } from "lucide-react"

interface SubscriptionPaymentRow {
  id: string
  company_name: string
  plan_name: string
  amount: string
  currency: string
  payment_method: string
  status: string
  mpesa_receipt: string
  phone_number: string
  created_at: string | null
  completed_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-700",
  refunded: "bg-purple-100 text-purple-800",
}

function fmt(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      if (statusFilter && statusFilter !== "all") params.status = statusFilter

      const data = await superAdminApi.getSubscriptionPayments(params)
      setPayments((data as any).results || [])
      setTotalPages((data as any).total_pages || 1)
      setTotal((data as any).count || 0)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    const t = setTimeout(fetchPayments, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchPayments, search])

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleStatus = (v: string) => {
    setStatusFilter(v)
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Subscription Payments</h1>
          <p className="text-slate-500 text-sm">
            Platform billing payments from ISP tenants ({total} total)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search company, receipt…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={handleStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchPayments()} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>M-Pesa Receipt</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.company_name}</TableCell>
                      <TableCell>{p.plan_name}</TableCell>
                      <TableCell>
                        KES {Number(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 capitalize">
                        {p.payment_method.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            STATUS_COLORS[p.status] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {p.mpesa_receipt || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{p.phone_number || "—"}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {fmt(p.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
