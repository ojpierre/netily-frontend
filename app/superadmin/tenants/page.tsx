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
  CalendarDays,
  Wrench,
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { superadminApi, type Tenant } from "@/lib/superadmin-api"

const HARD_DELETE_STEPS = [
  "Verify confirmation and protect system schemas",
  "Delete subscription payments and company subscription",
  "Remove tenant users, domains, company, and tenant records",
  "Clean router indexes and RADIUS tenant configuration",
  "Drop the tenant database schema",
  "Refresh the tenant list and write the audit summary",
]

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
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [hardDeleteStep, setHardDeleteStep] = useState(0)
  const [hardDeleteError, setHardDeleteError] = useState("")
  const [hardDeleteComplete, setHardDeleteComplete] = useState(false)

  // Manual Activation dialog
  const [manualActivateTarget, setManualActivateTarget] = useState<Tenant | null>(null)
  const [manualExtendDays, setManualExtendDays] = useState("30")
  const [manualExpiryDate, setManualExpiryDate] = useState("")
  const [manualActivateLoading, setManualActivateLoading] = useState(false)

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

  useEffect(() => {
    if (confirmAction?.type !== "delete") {
      setDeleteConfirmation("")
      setHardDeleteStep(0)
      setHardDeleteError("")
      setHardDeleteComplete(false)
    }
  }, [confirmAction])

  const handleManualActivate = async () => {
    if (!manualActivateTarget) return
    setManualActivateLoading(true)
    try {
      const options: { extendDays?: number; setExpiryDate?: string } = {}
      if (manualExpiryDate) {
        options.setExpiryDate = manualExpiryDate
      } else if (manualExtendDays && parseInt(manualExtendDays) > 0) {
        options.extendDays = parseInt(manualExtendDays)
      }
      await superadminApi.activateTenant(manualActivateTarget.id, options)
      toast.success(`${manualActivateTarget.company_name} activated successfully`)
      setManualActivateTarget(null)
      setManualExtendDays("30")
      setManualExpiryDate("")
      fetchTenants()
    } catch (err: any) {
      toast.error(err.message || "Activation failed")
    } finally {
      setManualActivateLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      if (confirmAction.type === "suspend") {
        await superadminApi.suspendTenant(confirmAction.tenant.id)
        toast.success(`${confirmAction.tenant.company_name} suspended`)
        setConfirmAction(null)
        fetchTenants()
      } else if (confirmAction.type === "activate") {
        await superadminApi.activateTenant(confirmAction.tenant.id)
        toast.success(`${confirmAction.tenant.company_name} activated`)
        setConfirmAction(null)
        fetchTenants()
      } else if (confirmAction.type === "delete") {
        setHardDeleteStep(0)
        setHardDeleteError("")
        setHardDeleteComplete(false)

        const progressTimer = window.setInterval(() => {
          setHardDeleteStep((step) => Math.min(step + 1, HARD_DELETE_STEPS.length - 2))
        }, 700)

        try {
          await superadminApi.hardDeleteTenant(confirmAction.tenant.id, deleteConfirmation)
          window.clearInterval(progressTimer)
          setHardDeleteStep(HARD_DELETE_STEPS.length - 1)
          setHardDeleteComplete(true)
          toast.success(`${confirmAction.tenant.company_name} permanently deleted`)
          await fetchTenants()
          window.setTimeout(() => {
            setConfirmAction(null)
            setDeleteConfirmation("")
            setHardDeleteStep(0)
            setHardDeleteComplete(false)
          }, 900)
        } catch (err: any) {
          window.clearInterval(progressTimer)
          setHardDeleteError(err.message || "Hard delete failed")
          throw err
        }
      }
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

  const resolveTenantStatus = (tenant: Tenant) =>
    tenant.tenant_status_display ||
    tenant.subscription_status_display ||
    tenant.subscription_status ||
    tenant.status

  const formatExpiry = (tenant: Tenant) => {
    if (!tenant.subscription_expiry) {
      if (tenant.status === "trial" || tenant.subscription_status === "trialing") {
        return "Trial date pending sync"
      }
      return "No expiry date"
    }

    return new Date(tenant.subscription_expiry).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const resolveExpiryTone = (tenant: Tenant) => {
    if (tenant.days_left === null || tenant.days_left === undefined) return "text-slate-400"
    if (tenant.days_left < 0) return "text-red-400"
    if (tenant.days_left <= 7) return "text-amber-400"
    return "text-emerald-400"
  }

  const deleteTargetName = confirmAction?.type === "delete" ? confirmAction.tenant.company_name : ""
  const deleteMatch = deleteConfirmation.trim() === deleteTargetName.trim()

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
                    <td className="p-4">
                      <div className="space-y-1">
                        {statusBadge(t.status)}
                        <p className="text-xs font-medium text-slate-400">
                          Billing: {resolveTenantStatus(t)}
                        </p>
                      </div>
                    </td>
                    
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
                          <span className="text-lg font-black text-white leading-none">
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
                    
                    <td className="p-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-200 capitalize">
                          {t.subscription_plan || "No plan"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t.subscription_status_display || "Billing status unavailable"}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-slate-300">
                      KES {Number(t.monthly_rate).toLocaleString()}
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      <div className="space-y-1">
                        <p className={`text-xs font-semibold ${resolveExpiryTone(t)}`}>
                          {formatExpiry(t)}
                        </p>
                        {t.days_left !== null && t.days_left !== undefined ? (
                          <p className={`text-[11px] ${resolveExpiryTone(t)}`}>
                            {t.days_left < 0
                              ? `${Math.abs(t.days_left)}d overdue`
                              : t.days_left === 0
                              ? "Expires today"
                              : `${t.days_left}d left`}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Waiting for subscription schedule
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden xl:table-cell text-slate-400 text-xs">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(t.status === "suspended" || t.subscription_status === "suspended") ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-700 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => {
                              setManualActivateTarget(t)
                              setManualExtendDays("30")
                              setManualExpiryDate("")
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-amber-700 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => setConfirmAction({ type: "suspend", tenant: t })}
                          >
                            <Pause className="w-3 h-3 mr-1" />Suspend
                          </Button>
                        )}
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
                            onClick={() => window.open(`https://${t.subdomain}.netily.co.ke/admin`, "_blank")}
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
                      </DropdownMenu>                      </div>                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manual Activation Dialog */}
      <Dialog
        open={!!manualActivateTarget}
        onOpenChange={(v) => {
          if (!v && !manualActivateLoading) {
            setManualActivateTarget(null)
            setManualExtendDays("30")
            setManualExpiryDate("")
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <DialogTitle>Manual Activation</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {manualActivateTarget?.company_name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current expiry info */}
            {manualActivateTarget?.subscription_expiry && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Current expiry</p>
                  <p className="text-sm font-medium">
                    {new Date(manualActivateTarget.subscription_expiry).toLocaleDateString("en-KE", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                    {manualActivateTarget.days_left !== null && (
                      <span className={`ml-2 text-xs font-normal ${
                        (manualActivateTarget.days_left ?? 0) < 0 ? "text-red-400" : "text-amber-400"
                      }`}>
                        ({manualActivateTarget.days_left}d)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Override expiry date — takes priority */}
            <div className="space-y-1.5">
              <Label htmlFor="expiry-override" className="text-xs text-slate-300">
                Override expiry date
                <span className="ml-1 text-slate-500">(sets exact date, ignores days below)</span>
              </Label>
              <Input
                id="expiry-override"
                type="date"
                value={manualExpiryDate}
                onChange={(e) => setManualExpiryDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Extend by days */}
            <div className="space-y-1.5">
              <Label htmlFor="extend-days" className="text-xs text-slate-300">
                Extend by days
                <span className="ml-1 text-slate-500">(adds to current expiry or today)</span>
              </Label>
              <Input
                id="extend-days"
                type="number"
                min="1"
                max="3650"
                value={manualExtendDays}
                onChange={(e) => setManualExpiryDate("")} // clear override when typing days
                onInput={(e) => setManualExtendDays((e.target as HTMLInputElement).value)}
                disabled={!!manualExpiryDate}
                className="bg-slate-800 border-slate-700 text-white disabled:opacity-40"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={() => setManualActivateTarget(null)}
              disabled={manualActivateLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleManualActivate}
              disabled={manualActivateLoading}
            >
              {manualActivateLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Activating...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Activate Tenant</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(v) => {
          if (actionLoading) return
          if (!v) setConfirmAction(null)
        }}
      >
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
                <div className="space-y-4 pt-2">
                  <p>
                    This will <span className="text-red-400 font-semibold">permanently delete</span>{" "}
                    <strong className="text-white">{confirmAction.tenant.company_name}</strong> now.
                    The request runs immediately and this dialog will show progress until cleanup finishes.
                  </p>
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                    This removes billing subscriptions, tenant users, domains, router/RADIUS indexes,
                    tenant and company records, then drops the tenant schema. This cannot be undone.
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation" className="text-slate-200">
                      Type <span className="font-semibold text-white">{deleteTargetName}</span> to confirm
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={deleteTargetName}
                      className="border-slate-700 bg-slate-950 text-white"
                      disabled={actionLoading || hardDeleteComplete}
                    />
                  </div>
                  {(actionLoading || hardDeleteComplete || hardDeleteError) && (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {hardDeleteError
                            ? "Hard delete needs attention"
                            : hardDeleteComplete
                            ? "Hard delete completed"
                            : "Hard delete running"}
                        </p>
                        <span className="text-sm font-semibold text-blue-300">
                          {Math.round(((hardDeleteStep + 1) / HARD_DELETE_STEPS.length) * 100)}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            hardDeleteError ? "bg-red-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.round(((hardDeleteStep + 1) / HARD_DELETE_STEPS.length) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-4 space-y-2">
                        {HARD_DELETE_STEPS.map((step, index) => {
                          const isDone = hardDeleteComplete || index < hardDeleteStep
                          const isActive = !hardDeleteComplete && !hardDeleteError && index === hardDeleteStep
                          const isFailed = hardDeleteError && index === hardDeleteStep
                          return (
                            <div key={step} className="flex items-start gap-2 text-xs">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  isFailed
                                    ? "border-red-400 bg-red-500/20 text-red-200"
                                    : isDone
                                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                                    : isActive
                                    ? "border-blue-400 bg-blue-500/20 text-blue-200"
                                    : "border-slate-600 text-slate-500"
                                }`}
                              >
                                {isActive ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isDone ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : null}
                              </span>
                              <span className={isDone || isActive ? "text-slate-100" : "text-slate-500"}>
                                {step}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      {hardDeleteError ? (
                        <p className="mt-3 text-xs text-red-300">{hardDeleteError}</p>
                      ) : null}
                    </div>
                  )}
                </div>
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
            <Button
              variant="outline"
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                actionLoading ||
                hardDeleteComplete ||
                (confirmAction?.type === "delete" && !deleteMatch)
              }
              className={
                confirmAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : confirmAction?.type === "suspend"
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {confirmAction?.type === "delete"
                ? hardDeleteComplete
                  ? "Deleted"
                  : actionLoading
                  ? "Deleting Now"
                  : "Delete Now"
                : confirmAction?.type === "suspend"
                ? "Suspend"
                : "Activate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
