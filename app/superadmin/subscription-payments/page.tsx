"use client"

import React, { useState, useEffect, useCallback } from "react"
import { superadminApi } from "@/lib/superadmin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Search, RefreshCw, CreditCard, CheckCircle2, Clock, XCircle, AlertCircle, Ban, RotateCcw } from "lucide-react"

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

const STATUS_STYLES: Record<string, { cls: string; Icon: React.ElementType }> = {
  completed:  { cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", Icon: CheckCircle2 },
  pending:    { cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",   Icon: Clock },
  processing: { cls: "bg-blue-500/15 text-blue-400 border border-blue-500/30",         Icon: AlertCircle },
  failed:     { cls: "bg-red-500/15 text-red-400 border border-red-500/30",            Icon: XCircle },
  cancelled:  { cls: "bg-slate-700/60 text-slate-400 border border-slate-600",         Icon: Ban },
  refunded:   { cls: "bg-purple-500/15 text-purple-400 border border-purple-500/30",   Icon: RotateCcw },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { cls: "bg-slate-700 text-slate-400 border border-slate-600", Icon: AlertCircle }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${s.cls}`}>
      <s.Icon className="w-3 h-3" />
      {status}
    </span>
  )
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

      const data = await superadminApi.getSubscriptionPayments(params)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Payments</h1>
          <p className="text-slate-400 text-sm">
            Platform billing payments from ISP tenants &nbsp;·&nbsp; {total} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
              placeholder="Search company or receipt…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={handleStatus}>
            <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-300">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300">All statuses</SelectItem>
              <SelectItem value="completed" className="text-slate-300">Completed</SelectItem>
              <SelectItem value="pending" className="text-slate-300">Pending</SelectItem>
              <SelectItem value="processing" className="text-slate-300">Processing</SelectItem>
              <SelectItem value="failed" className="text-slate-300">Failed</SelectItem>
              <SelectItem value="cancelled" className="text-slate-300">Cancelled</SelectItem>
              <SelectItem value="refunded" className="text-slate-300">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="outline"
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={() => fetchPayments()}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Method</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">M-Pesa Receipt</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-400" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{p.company_name}</td>
                    <td className="px-4 py-3 text-slate-300">{p.plan_name || "—"}</td>
                    <td className="px-4 py-3 text-white font-semibold">
                      KES {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 capitalize hidden md:table-cell">
                      {p.payment_method?.replace("_", " ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden lg:table-cell">
                      {p.mpesa_receipt || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                      {p.phone_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {fmt(p.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
