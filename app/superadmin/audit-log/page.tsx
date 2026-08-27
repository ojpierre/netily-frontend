"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  ScrollText,
  Search,
  Loader2,
  RefreshCw,
  Shield,
  Pencil,
  Trash2,
  LogIn,
  Eye,
  Download,
  Upload,
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
import { superadminApi, type AuditLogEntry } from "@/lib/superadmin-api"

const ACTIONS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "view", label: "View" },
  { value: "export", label: "Export" },
]

const actionIcon = (action: string) => {
  switch (action) {
    case "create":
      return <Shield className="w-3.5 h-3.5 text-emerald-400" />
    case "update":
      return <Pencil className="w-3.5 h-3.5 text-blue-400" />
    case "delete":
      return <Trash2 className="w-3.5 h-3.5 text-red-400" />
    case "login":
      return <LogIn className="w-3.5 h-3.5 text-violet-400" />
    case "view":
      return <Eye className="w-3.5 h-3.5 text-slate-400" />
    case "export":
      return <Download className="w-3.5 h-3.5 text-amber-400" />
    case "import":
      return <Upload className="w-3.5 h-3.5 text-cyan-400" />
    default:
      return <ScrollText className="w-3.5 h-3.5 text-slate-400" />
  }
}

const actionBadgeColor = (action: string) => {
  switch (action) {
    case "create":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "update":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "delete":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "login":
      return "bg-violet-500/20 text-violet-400 border-violet-500/30"
    case "export":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30"
  }
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLog = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      if (actionFilter !== "all") params.action = actionFilter
      const res = await superadminApi.getAuditLog(params)
      setEntries(res.results)
      setTotal(res.count)
    } catch (err: any) {
      toast.error(err.message || "Failed to load audit log")
    } finally {
      setLoading(false)
    }
  }, [page, search, actionFilter])

  useEffect(() => {
    const t = setTimeout(() => fetchLog(), 300)
    return () => clearTimeout(t)
  }, [fetchLog])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-violet-400" />
            Audit Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            All system actions — {total} entries
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLog}
          disabled={loading}
          className="border-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by user, object, model…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
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
          ) : entries.length === 0 ? (
            <p className="text-center text-slate-500 py-20">No audit log entries</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Object</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-white">{e.actor_email}</td>
                      <td className="px-4 py-3">
                        <Badge className={actionBadgeColor(e.action)}>
                          {actionIcon(e.action)}
                          <span className="ml-1">{e.action}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded">
                          {e.model_name}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{e.object_repr || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.ip_address || "—"}</td>
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
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-700 text-slate-300"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
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
