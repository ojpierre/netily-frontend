"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Building2,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  Ban,
  XCircle,
  MoreHorizontal,
  ArrowUpDown,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Eye,
  Filter,
  Plus,
  Download,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { superadminApi, type Tenant } from "@/lib/superadmin-api"

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ordering, setOrdering] = useState("-created_at")

  // Confirm dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "activate" | "delete"
    tenant: Tenant
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { ordering }
      if (search) params.search = search
      if (statusFilter && statusFilter !== "all") params.status = statusFilter
      const data = await superadminApi.getTenants(params)
      setTenants(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load tenants")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, ordering])

  useEffect(() => {
    const t = setTimeout(fetchTenants, 300)
    return () => clearTimeout(t)
  }, [fetchTenants])

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      if (confirmAction.type === "suspend") {
        await superadminApi.suspendTenant(confirmAction.tenant.id)
        toast.success(`${confirmAction.tenant.company_name} suspended`)
      } else if (confirmAction.type === "activate") {
        await superadminApi.activateTenant(confirmAction.tenant.id)
        toast.success(`${confirmAction.tenant.company_name} activated`)
      } else if (confirmAction.type === "delete") {
        await superadminApi.deleteTenant(confirmAction.tenant.id)
        toast.success(`${confirmAction.tenant.company_name} permanently deleted`)
      }
      setConfirmAction(null)
      fetchTenants()
    } catch (err: any) {
      toast.error(err.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
      case "trial":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Trial</Badge>
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>
      case "cancelled":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-slate-400">{s}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenant Management</h1>
          <p className="text-sm text-slate-400 mt-1">{tenants.length} tenants on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => superadminApi.exportTenants()}
            className="border-slate-700 text-slate-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/superadmin/tenants/create">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by name, subdomain, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-slate-200">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ordering} onValueChange={setOrdering}>
              <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-slate-200">
                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_at">Newest First</SelectItem>
                <SelectItem value="created_at">Oldest First</SelectItem>
                <SelectItem value="company__name">Name A-Z</SelectItem>
                <SelectItem value="-company__name">Name Z-A</SelectItem>
                <SelectItem value="-monthly_rate">Revenue ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No tenants found</p>
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left p-4">Company</th>
                  <th className="text-left p-4 hidden md:table-cell">Subdomain</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Metered Usage</th>
                  <th className="text-left p-4 hidden lg:table-cell">Plan</th>
                  <th className="text-left p-4 hidden lg:table-cell">MRR</th>
                  <th className="text-left p-4 hidden xl:table-cell">Expires</th>
                  <th className="text-left p-4 hidden xl:table-cell">Created</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{t.company_name}</p>
                        <p className="text-xs text-slate-500">{t.company_email}</p>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <code className="text-xs bg-slate-800 text-violet-300 px-2 py-0.5 rounded">{t.subdomain}</code>
                    </td>
                    <td className="p-4">{statusBadge(t.status)}</td>
                    
                    {/* NEW: Metered Usage Column */}
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between w-full max-w-[120px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usage</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            (t.raw_active_pppoe_count ?? 0) > (t.billed_pppoe_count ?? 0) 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                            {(t.raw_active_pppoe_count ?? 0) > (t.billed_pppoe_count ?? 0) ? 'OVERAGE' : 'IN-PLAN'}
                          </span>
                        </div>
                        
                        <div className="flex items-end gap-1">
                          <span className="text-lg font-black text-slate-900 leading-none">
                            {t.raw_active_pppoe_count ?? 0}
                          </span>
                          <span className="text-xs font-bold text-slate-400 pb-0.5">
                            / {t.billed_pppoe_count ?? 0}
                          </span>
                        </div>

                        {/* Modern Progress Bar for Usage vs Commitment */}
                        <div className="w-full max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${
                              (t.raw_active_pppoe_count ?? 0) >= (t.billed_pppoe_count ?? 0) 
                              ? 'bg-blue-600' 
                              : 'bg-indigo-400'
                            }`}
                            style={{ 
                              width: `${Math.min(((t.raw_active_pppoe_count ?? 0) / (t.billed_pppoe_count ?? 1)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        
                        <p className="text-[10px] text-slate-400 font-medium">
                          {t.raw_active_pppoe_count ?? 0} Actual vs {t.billed_pppoe_count ?? 0} Min
                        </p>
                      </div>
                    </td>
                    
                    <td className="p-4 hidden lg:table-cell text-slate-300 capitalize">{t.subscription_plan || "—"}</td>
                    <td className="p-4 hidden lg:table-cell text-slate-300">
                      KES {Number(t.monthly_rate).toLocaleString()}
                    </td>
                    <td className="p-4 hidden xl:table-cell text-slate-400 text-xs">
                      {t.subscription_expiry
                        ? new Date(t.subscription_expiry).toLocaleDateString()
                        : "—"}
                      {t.days_left !== null && t.days_left <= 7 && t.days_left >= 0 && (
                        <span className="ml-1 text-amber-400">({t.days_left}d left)</span>
                      )}
                    </td>
                    <td className="p-4 hidden xl:table-cell text-slate-400 text-xs">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/tenants/${t.id}`}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`http://${t.subdomain}.localhost:3000/admin`, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" /> Open Admin Panel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {t.status !== "suspended" ? (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ type: "suspend", tenant: t })}
                              className="text-amber-500"
                            >
                              <Pause className="w-4 h-4 mr-2" /> Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ type: "activate", tenant: t })}
                              className="text-emerald-500"
                            >
                              <Play className="w-4 h-4 mr-2" /> Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: "delete", tenant: t })}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete"
                ? "Delete Tenant Permanently?"
                : confirmAction?.type === "suspend"
                ? "Suspend Tenant?"
                : "Activate Tenant?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmAction?.type === "delete" ? (
                <>
                  This will <span className="text-red-400 font-semibold">permanently destroy</span> the schema, all data,
                  and the company record for <strong className="text-white">{confirmAction.tenant.company_name}</strong>.
                  This action cannot be undone.
                </>
              ) : confirmAction?.type === "suspend" ? (
                <>
                  <strong className="text-white">{confirmAction.tenant.company_name}</strong> will be suspended.
                  Their users will lose access until reactivated.
                </>
              ) : (
                <>
                  <strong className="text-white">{confirmAction?.tenant.company_name}</strong> will be reactivated.
                  All users will regain access immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={
                confirmAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : confirmAction?.type === "suspend"
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {confirmAction?.type === "delete" ? "Delete Forever" : confirmAction?.type === "suspend" ? "Suspend" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}