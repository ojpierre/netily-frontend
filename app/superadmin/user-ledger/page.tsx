"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  BookOpen,
  Search,
  Loader2,
  RefreshCw,
  UserPlus,
  UserMinus,
  Link2,
  Unlink,
  Calendar,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { superadminApi, type LedgerEntry } from "@/lib/superadmin-api"

const EVENTS = [
  { value: "all", label: "All Events" },
  { value: "customer_created", label: "Customer Created" },
  { value: "customer_deleted", label: "Customer Deleted" },
  { value: "service_created", label: "Service Connected" },
  { value: "service_deleted", label: "Service Disconnected" },
]

const USER_TYPES = [
  { value: "all", label: "All Types" },
  { value: "pppoe", label: "PPPoE" },
  { value: "hotspot", label: "Hotspot" },
  { value: "static", label: "Static" },
  { value: "dhcp", label: "DHCP" },
]

const eventIcon = (event: string) => {
  switch (event) {
    case "customer_created":
      return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
    case "customer_deleted":
      return <UserMinus className="w-3.5 h-3.5 text-red-400" />
    case "service_created":
      return <Link2 className="w-3.5 h-3.5 text-blue-400" />
    case "service_deleted":
      return <Unlink className="w-3.5 h-3.5 text-amber-400" />
    default:
      return <BookOpen className="w-3.5 h-3.5 text-slate-400" />
  }
}

const eventBadgeColor = (event: string) => {
  switch (event) {
    case "customer_created":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "customer_deleted":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "service_created":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "service_deleted":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30"
  }
}

const eventLabel = (event: string) =>
  event.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export default function UserLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [eventFilter, setEventFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLedger = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), page_size: "25" }
      if (search) params.search = search
      if (eventFilter !== "all") params.event = eventFilter
      if (userTypeFilter !== "all") params.user_type = userTypeFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await superadminApi.getUserLedger(params)
      setEntries(res.results)
      setTotal(res.count)
    } catch (err: any) {
      toast.error(err.message || "Failed to load user ledger")
    } finally {
      setLoading(false)
    }
  }, [page, search, eventFilter, userTypeFilter, dateFrom, dateTo])

  useEffect(() => {
    const t = setTimeout(() => fetchLedger(), 300)
    return () => clearTimeout(t)
  }, [fetchLedger])

  const totalPages = Math.ceil(total / 25)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-violet-400" />
            User Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable audit trail of customer &amp; service events — {total} entries
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLedger}
          disabled={loading}
          className="border-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search customer, username, phone, tenant…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            {EVENTS.map((e) => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={userTypeFilter} onValueChange={(v) => { setUserTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            {USER_TYPES.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="w-36 bg-slate-900 border-slate-700 text-slate-200"
            placeholder="From"
          />
          <span className="text-slate-500">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="w-36 bg-slate-900 border-slate-700 text-slate-200"
            placeholder="To"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-slate-500 py-20">No ledger entries found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-right">PPPoE</th>
                    <th className="px-4 py-3 text-right">Hotspot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{e.tenant_name}</p>
                          <p className="text-xs text-slate-500">{e.tenant_subdomain}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={eventBadgeColor(e.event)}>
                          {eventIcon(e.event)}
                          <span className="ml-1.5">{eventLabel(e.event)}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-slate-700 text-slate-300 uppercase text-[10px]">
                          {e.user_type || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white">{e.customer_name || "—"}</p>
                          {e.customer_code && (
                            <p className="text-xs text-slate-500 font-mono">{e.customer_code}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        {e.username || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {e.phone_number || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {e.plan_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-mono">
                        {e.pppoe_count_after ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-mono">
                        {e.hotspot_count_after ?? "—"}
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
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {total} total entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-slate-700 text-slate-300"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-slate-700 text-slate-300"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
