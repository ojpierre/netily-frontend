"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  CreditCard,
  Search,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  superadminApi,
  type SubscriptionPayment,
  type PaymentSummary,
} from "@/lib/superadmin-api"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      if (serviceFilter !== "all") params.service_type = serviceFilter
      const [res, sum] = await Promise.all([
        superadminApi.getPayments(params),
        superadminApi.getPaymentSummary(),
      ])
      setPayments(res.results)
      setTotal(res.count)
      setSummary(sum)
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, serviceFilter])

  useEffect(() => {
    const t = setTimeout(() => fetchPayments(), 300)
    return () => clearTimeout(t)
  }, [fetchPayments])

  const totalPages = Math.ceil(total / 20)
  const change = summary
    ? summary.last_month > 0
      ? (((summary.this_month - summary.last_month) / summary.last_month) * 100).toFixed(1)
      : summary.this_month > 0
      ? "100"
      : "0"
    : "0"
  const changePositive = Number(change) >= 0

  const statusBadge = (s: string) => {
    switch (s) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline" className="text-slate-400">{s}</Badge>
    }
  }

  const kes = (n: number | string) =>
    Number(n).toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })

  const dateTime = (value?: string | null) => {
    if (!value) return "-"
    return new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
  }

  const serviceBadge = (service?: string) => {
    const normalized = (service || "other").toLowerCase()
    const styles: Record<string, string> = {
      subscription: "bg-violet-500/20 text-violet-300 border-violet-500/30",
      hotspot: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      pppoe: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      other: "bg-slate-700/60 text-slate-300 border-slate-600",
    }
    return (
      <Badge variant="outline" className={styles[normalized] || styles.other}>
        {normalized.toUpperCase()}
      </Badge>
    )
  }

  const periodDisplay = (p: SubscriptionPayment) => {
    if (!p.period_start && !p.period_end) return "-"
    return `${dateTime(p.period_start)} - ${dateTime(p.period_end)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-violet-400" />
          Payments
        </h1>
        <p className="text-sm text-slate-400 mt-1">Subscription payment transactions — {total} total</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Revenue</p>
                  <p className="text-xl font-bold text-white">{kes(summary.total_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">This Month</p>
                  <p className="text-xl font-bold text-white">{kes(summary.this_month)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${changePositive ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  {changePositive ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                </div>
                <div>
                  <p className="text-xs text-slate-400">vs Last Month</p>
                  <p className={`text-xl font-bold ${changePositive ? "text-emerald-400" : "text-red-400"}`}>
                    {changePositive ? "+" : ""}{change}%
                  </p>
                  <p className="text-xs text-slate-500">{kes(summary.last_month)} prev</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by reference, company…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={(v) => { setServiceFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="hotspot">Hotspot</SelectItem>
            <SelectItem value="pppoe">PPPoE</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-slate-500 py-20">No payments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <code className="text-xs text-violet-300">{p.reference || p.id.slice(0, 8)}</code>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white">{p.company_name}</p>
                        <p className="text-xs text-slate-500">{p.customer_name || p.plan_name || p.invoice_number || "-"}</p>
                      </td>
                      <td className="px-4 py-3">{serviceBadge(p.service_type)}</td>
                      <td className="px-4 py-3 text-white font-medium">
                        {kes(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-slate-300 border-slate-700">
                          {p.payment_method || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs min-w-[220px]">
                        {periodDisplay(p)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {dateTime(p.completed_at || p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border-slate-700 text-slate-300">Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="border-slate-700 text-slate-300">Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
