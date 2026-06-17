"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Building2, Users, Wifi, FileText, CreditCard,
  Loader2, Save, CheckCircle2, Clock, Ban, XCircle, Globe,
  Mail, Phone, MapPin, Calendar, ExternalLink, Pause, Play, Trash2,
  Radio, HardDrive, Package, ScrollText, Search, Signal,
  LogIn, ChevronLeft, ChevronRight, DollarSign, Activity,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  superadminApi,
  type Tenant, type TenantStats, type TenantUpdatePayload,
  type TenantRouter, type PPPoEUser, type HotspotUser,
  type InventoryItem, type AuditLogEntry, type PaginatedResponse,
} from "@/lib/superadmin-api"
import { TenantBillingTab } from "./components/tenant-billing-tab"

const HARD_DELETE_STEPS = [
  "Verify confirmation and protect system schemas",
  "Delete subscription payments and company subscription",
  "Remove tenant users, domains, company, and tenant records",
  "Clean router indexes and RADIUS tenant configuration",
  "Drop the tenant database schema",
  "Return to the tenant list",
]

// ━━━━━━━━━━━━━━━ Helpers ━━━━━━━━━━━━━━━

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleString()
}

function kes(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function statusColor(s: string): string {
  const m: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    offline: "bg-red-500/20 text-red-400 border-red-500/30",
    maintenance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    connected: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    disabled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    in_stock: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    in_use: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    assigned: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    faulty: "bg-red-500/20 text-red-400 border-red-500/30",
    retired: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  }
  return m[s?.toLowerCase()] || "bg-slate-500/20 text-slate-400 border-slate-500/30"
}

// ━━━━━━━━━━━━━━━ Main Page ━━━━━━━━━━━━━━━

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [stats, setStats] = useState<TenantStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Form fields
  const [formStatus, setFormStatus] = useState("")
  const [maxUsers, setMaxUsers] = useState(10)
  const [maxCustomers, setMaxCustomers] = useState(100)
  const [monthlyRate, setMonthlyRate] = useState("")
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [subscriptionExpiry, setSubscriptionExpiry] = useState("")

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [hardDeleteStep, setHardDeleteStep] = useState(0)
  const [hardDeleteError, setHardDeleteError] = useState("")
  const [hardDeleteComplete, setHardDeleteComplete] = useState(false)
  const [impersonating, setImpersonating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [t, s] = await Promise.all([
        superadminApi.getTenant(id),
        superadminApi.getTenantStats(id),
      ])
      setTenant(t)
      setStats(s)
      setFormStatus(t.status)
      setMaxUsers(t.max_users)
      setMaxCustomers(t.max_customers)
      setMonthlyRate(t.monthly_rate)
      setBillingCycle(t.billing_cycle)
      setSubscriptionExpiry(t.subscription_expiry || "")
    } catch (err: any) {
      toast.error(err.message || "Failed to load tenant")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!confirmDelete) {
      setDeleteConfirmation("")
      setHardDeleteStep(0)
      setHardDeleteError("")
      setHardDeleteComplete(false)
    }
  }, [confirmDelete])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: TenantUpdatePayload = {
        status: formStatus,
        max_users: maxUsers,
        max_customers: maxCustomers,
        monthly_rate: monthlyRate,
        billing_cycle: billingCycle,
      }
      if (subscriptionExpiry) payload.subscription_expiry = subscriptionExpiry
      await superadminApi.updateTenant(id, payload)
      toast.success("Tenant updated successfully")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const handleSuspend = async () => {
    if (!tenant) return
    const previous = { ...tenant }
    // Optimistic update
    setTenant((cur) => cur ? { ...cur, status: "suspended" } : cur)
    setFormStatus("suspended")
    try {
      const updated = await superadminApi.suspendTenant(id)
      setTenant((cur) => cur ? { ...cur, ...updated } : updated)
      setFormStatus(updated.status)
      toast.success("Tenant suspended")
    } catch (err: any) {
      // Roll back
      setTenant(previous)
      setFormStatus(previous.status)
      toast.error(err.message || "Failed to suspend tenant")
    }
  }

  const handleUnsuspend = async () => {
    if (!tenant) return
    const previous = { ...tenant }
    // Optimistic update
    setTenant((cur) => cur ? { ...cur, status: "active" } : cur)
    setFormStatus("active")
    try {
      const updated = await superadminApi.activateTenant(id)
      setTenant((cur) => cur ? { ...cur, ...updated } : updated)
      setFormStatus(updated.status)
      toast.success("Tenant unsuspended")
    } catch (err: any) {
      // Roll back
      setTenant(previous)
      setFormStatus(previous.status)
      toast.error(err.message || "Failed to unsuspend tenant")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setHardDeleteStep(0)
    setHardDeleteError("")
    setHardDeleteComplete(false)

    const progressTimer = window.setInterval(() => {
      setHardDeleteStep((step) => Math.min(step + 1, HARD_DELETE_STEPS.length - 2))
    }, 700)

    try {
      await superadminApi.hardDeleteTenant(id, deleteConfirmation)
      window.clearInterval(progressTimer)
      setHardDeleteStep(HARD_DELETE_STEPS.length - 1)
      setHardDeleteComplete(true)
      toast.success("Tenant permanently deleted")
      window.setTimeout(() => router.push("/superadmin/tenants"), 800)
    } catch (err: any) {
      window.clearInterval(progressTimer)
      setHardDeleteError(err.message || "Delete failed")
      toast.error(err.message || "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  const handleImpersonate = async () => {
    setImpersonating(true)
    try {
      const result = await superadminApi.impersonateTenant(id)
      try {
        const targetHost = new URL(result.panel_url).hostname
        localStorage.setItem(`adminToken:${targetHost}`, result.access)
        localStorage.setItem(`adminRefreshToken:${targetHost}`, result.refresh)
      } catch {
        localStorage.setItem("adminToken", result.access)
        localStorage.setItem("adminRefreshToken", result.refresh)
      }
      window.open(result.panel_url, "_blank")
      toast.success(`Impersonating ${result.tenant.company_name} as ${result.user.email}`)
    } catch (err: any) {
      toast.error(err.message || "Impersonation failed")
    } finally {
      setImpersonating(false)
    }
  }

  const tenantStatusBadge = (s: string) => {
    const map: Record<string, React.ReactNode> = {
      active: <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>,
      trial: <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Trial</Badge>,
      suspended: <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>,
      cancelled: <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>,
    }
    return map[s] || <Badge variant="outline" className="text-slate-400">{s}</Badge>
  }

  const billingStatusText =
    tenant?.subscription_status_display ||
    tenant?.subscription_status_code ||
    tenant?.subscription_status ||
    tenant?.status ||
    "Unknown"
  const deleteTargetName = tenant?.company_name || ""
  const deleteMatch = deleteConfirmation.trim() === deleteTargetName.trim()

  if (loading || !tenant) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  const company = tenant.company

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link href="/superadmin/tenants">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{tenant.company_name}</h1>
            {tenantStatusBadge(tenant.status)}
            <Badge variant="outline" className="border-slate-700 bg-slate-900/70 text-slate-300">
              Billing: {billingStatusText}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            <code className="text-violet-300">{tenant.subdomain}</code> · Schema: <code className="text-slate-500">{tenant.schema_name}</code>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline" size="sm"
            className="border-violet-700 text-violet-300 hover:bg-violet-500/10"
            onClick={handleImpersonate}
            disabled={impersonating}
          >
            {impersonating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
            Access Panel
          </Button>
          <Button
            variant="outline" size="sm"
            className="border-slate-700 text-slate-300"
            onClick={() => window.open(`http://${tenant.subdomain}.localhost:3000/admin`, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Panel
          </Button>
          {tenant.status !== "suspended" ? (
            <Button
              variant="outline" size="sm"
              className="border-amber-700 text-amber-400 hover:bg-amber-500/10"
              onClick={handleSuspend}
            >
              <Pause className="w-4 h-4 mr-2" />Suspend
            </Button>
          ) : (
            <Button
              variant="outline" size="sm"
              className="border-emerald-700 text-emerald-400 hover:bg-emerald-500/10"
              onClick={handleUnsuspend}
            >
              <Play className="w-4 h-4 mr-2" />Unsuspend
            </Button>
          )}
          <Button
            variant="outline" size="sm"
            className="border-red-700 text-red-400 hover:bg-red-500/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />Delete
          </Button>
        </div>
      </div>

      {/* ── Stats Summary ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="Customers" value={stats.customers} sub={`${stats.customers_active ?? 0} active`} icon={Users} color="text-blue-400" />
          <StatCard label="Routers" value={stats.routers} sub={`${stats.routers_online ?? 0} online`} icon={Wifi} color="text-emerald-400" />
          <StatCard label="PPPoE" value={stats.pppoe_users ?? 0} sub={`${stats.pppoe_active ?? 0} active`} icon={Radio} color="text-cyan-400" />
          <StatCard label="Hotspot" value={stats.hotspot_users ?? 0} sub={`${stats.hotspot_active ?? 0} active`} icon={Signal} color="text-amber-400" />
          <StatCard label="Invoices" value={stats.invoices} icon={FileText} color="text-violet-400" />
          <StatCard label="Payments" value={stats.payments} icon={CreditCard} color="text-pink-400" />
          <StatCard label="Equipment" value={stats.equipment_items ?? 0} sub={`${stats.equipment_in_use ?? 0} in use`} icon={HardDrive} color="text-orange-400" />
          <StatCard label="Revenue" value={`KES ${(stats.tenant_revenue ?? 0).toLocaleString()}`} icon={CreditCard} color="text-emerald-400" />
        </div>
      )}

      {/* LIVE METERED USAGE CARD */}
      {stats?.metered_usage?.is_metered && (
        <Card className="bg-slate-900 border-emerald-500/30 mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex gap-1 items-center">
              <Activity className="w-3 h-3 animate-pulse" />
              Live Billing Cycle
            </Badge>
          </div>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
              Current Billing Period (Ending {new Date(stats.metered_usage.cycle_end!).toLocaleDateString()})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Unique PPPoE Clients</p>
                <p className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  {stats.metered_usage.pppoe_clients}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Accumulated Hotspot Revenue</p>
                <p className="text-2xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  {kes(stats.metered_usage.hotspot_revenue)}
                </p>
              </div>
              <div className="space-y-1 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                <p className="text-xs text-emerald-500 font-semibold">Estimated Monthly Total</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {kes(stats.metered_usage.estimated_total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300">
            <Building2 className="w-4 h-4 mr-1.5" />Overview
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300">
            <CreditCard className="w-4 h-4 mr-1.5" />Billing
          </TabsTrigger>
          <TabsTrigger value="routers" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300">
            <Wifi className="w-4 h-4 mr-1.5" />Routers
          </TabsTrigger>
          <TabsTrigger value="pppoe" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300">
            <Radio className="w-4 h-4 mr-1.5" />PPPoE
          </TabsTrigger>
          <TabsTrigger value="hotspot" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300">
            <Signal className="w-4 h-4 mr-1.5" />Hotspot
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300">
            <Package className="w-4 h-4 mr-1.5" />Inventory
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300">
            <ScrollText className="w-4 h-4 mr-1.5" />Audit Log
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-violet-400" />Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {company ? (
                  <>
                    <InfoRow icon={Building2} label="Name" value={company.name} />
                    <InfoRow icon={Mail} label="Email" value={company.email} />
                    <InfoRow icon={Phone} label="Phone" value={company.phone_number} />
                    <InfoRow icon={MapPin} label="Location" value={`${company.city}${company.county ? ", " + company.county : ""}`} />
                    {company.website && <InfoRow icon={Globe} label="Website" value={company.website} />}
                    {company.registration_number && <InfoRow icon={FileText} label="Reg #" value={company.registration_number} />}
                    {company.tax_pin && <InfoRow icon={FileText} label="Tax PIN" value={company.tax_pin} />}
                    <InfoRow icon={Calendar} label="Created" value={new Date(company.created_at).toLocaleString()} />
                  </>
                ) : <p className="text-slate-500">Company details not available</p>}
              </CardContent>
            </Card>

            {/* Editable settings */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Tenant Settings</CardTitle>
                <CardDescription className="text-slate-400">Adjust limits, billing, and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Status</Label>
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Billing Cycle</Label>
                    <Select value={billingCycle} onValueChange={setBillingCycle}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Max Users</Label>
                    <Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Max Customers</Label>
                    <Input type="number" value={maxCustomers} onChange={(e) => setMaxCustomers(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Monthly Rate (KES)</Label>
                    <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Subscription Expiry</Label>
                    <Input type="date" value={subscriptionExpiry} onChange={(e) => setSubscriptionExpiry(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
                    <p className="text-xs text-slate-500">
                      Use this only when you need to intentionally override the subscription-derived expiry date.
                    </p>
                  </div>
                </div>
                <Separator className="bg-slate-800" />
                <Button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-500">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown Cards */}
          {stats && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <BreakdownCard title="Customers" icon={Users} items={[
                { label: "Active", value: stats.customers_active ?? 0, color: "text-emerald-400" },
                { label: "Suspended", value: stats.customers_suspended ?? 0, color: "text-red-400" },
                { label: "Pending", value: stats.customers_pending ?? 0, color: "text-amber-400" },
              ]} />
              <BreakdownCard title="Routers" icon={Wifi} items={[
                { label: "Online", value: stats.routers_online ?? 0, color: "text-emerald-400" },
                { label: "Offline", value: stats.routers_offline ?? 0, color: "text-red-400" },
                { label: "Total", value: stats.routers, color: "text-slate-300" },
              ]} />
              <BreakdownCard title="Equipment" icon={HardDrive} items={[
                { label: "In Stock", value: stats.equipment_in_stock ?? 0, color: "text-blue-400" },
                { label: "In Use", value: stats.equipment_in_use ?? 0, color: "text-emerald-400" },
                { label: "Faulty", value: stats.equipment_faulty ?? 0, color: "text-red-400" },
              ]} />
            </div>
          )}

          {/* Domains */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-400" />Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.domains && tenant.domains.length > 0 ? (
                <div className="space-y-2">
                  {tenant.domains.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <code className="text-sm text-violet-300">{d.domain}</code>
                      {d.is_primary && <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Primary</Badge>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No domains configured</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BILLING TAB ── */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          {/* We pass the fetched tenant data directly into our new component */}
          <TenantBillingTab tenant={tenant} />
        </TabsContent>

        {/* ── ROUTERS TAB ── */}
        <TabsContent value="routers" className="mt-4">
          <RoutersTab tenantId={id} />
        </TabsContent>

        {/* ── PPPoE TAB ── */}
        <TabsContent value="pppoe" className="mt-4">
          <PPPoETab tenantId={id} />
        </TabsContent>

        {/* ── HOTSPOT TAB ── */}
        <TabsContent value="hotspot" className="mt-4">
          <HotspotTab tenantId={id} />
        </TabsContent>

        {/* ── INVENTORY TAB ── */}
        <TabsContent value="inventory" className="mt-4">
          <InventoryTab tenantId={id} />
        </TabsContent>

        {/* ── AUDIT LOG TAB ── */}
        <TabsContent value="audit" className="mt-4">
          <AuditLogTab tenantId={id} />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (deleting) return
          setConfirmDelete(open)
        }}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Tenant?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              <div className="space-y-4 pt-2">
                <p>
                  This will <span className="text-red-400 font-semibold">permanently delete</span>{" "}
                  <strong className="text-white">{tenant.company_name}</strong> now. The request runs
                  immediately, and you will be returned to the tenant list when cleanup is complete.
                </p>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                  This removes subscription records, users, domains, router/RADIUS indexes, tenant and
                  company records, then drops the tenant schema. This cannot be undone.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm-tenant" className="text-slate-200">
                    Type <span className="font-semibold text-white">{deleteTargetName}</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirm-tenant"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={deleteTargetName}
                    className="border-slate-700 bg-slate-950 text-white"
                    disabled={deleting || hardDeleteComplete}
                  />
                </div>
                {(deleting || hardDeleteComplete || hardDeleteError) && (
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting || hardDeleteComplete || !deleteMatch}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {hardDeleteComplete ? "Deleted" : deleting ? "Deleting Now" : "Delete Now"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ━━━━━━━━━━━━━━━ ROUTERS TAB ━━━━━━━━━━━━━━━

function RoutersTab({ tenantId }: { tenantId: string }) {
  const [routers, setRouters] = useState<TenantRouter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    superadminApi.getTenantRouters(tenantId)
      .then(setRouters)
      .catch(() => toast.error("Failed to load routers"))
      .finally(() => setLoading(false))
  }, [tenantId])

  if (loading) return <TableLoader />

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-emerald-400" />
          Routers ({routers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {routers.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No routers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">PPPoE</th>
                  <th className="px-4 py-3">Hotspot</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Last Seen</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {routers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{r.ip_address || "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{r.router_type}</td>
                    <td className="px-4 py-3 text-slate-400">{r.model || "—"}</td>
                    <td className="px-4 py-3"><Badge className={statusColor(r.status)}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-300">{r.active_users}/{r.total_users}</td>
                    <td className="px-4 py-3">{r.enable_pppoe ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3">{r.enable_hotspot ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.routeros_version || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(r.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ━━━━━━━━━━━━━━━ PPPoE TAB ━━━━━━━━━━━━━━━

function PPPoETab({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<PaginatedResponse<PPPoEUser> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      const res = await superadminApi.getTenantPPPoEUsers(tenantId, params)
      setData(res)
    } catch {
      toast.error("Failed to load PPPoE users")
    } finally {
      setLoading(false)
    }
  }, [tenantId, page, search])

  useEffect(() => {
    const t = setTimeout(loadData, 300)
    return () => clearTimeout(t)
  }, [loadData])

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            PPPoE Users ({data?.count ?? 0})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search username, IP…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <TableLoader /> : !data || data.results.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No PPPoE users found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Caller ID</th>
                    <th className="px-4 py-3">Remote IP</th>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Router</th>
                    <th className="px-4 py-3">Download</th>
                    <th className="px-4 py-3">Upload</th>
                    <th className="px-4 py-3">Connected</th>
                    <th className="px-4 py-3">Last Seen</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.results.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(u.status)}>{u.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.caller_id || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.remote_address || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{u.profile || "—"}</td>
                      <td className="px-4 py-3 text-violet-300 text-xs">{u.router_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{formatBytes(u.bytes_in)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatBytes(u.bytes_out)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(u.connected_since)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(u.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data.count} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ━━━━━━━━━━━━━━━ HOTSPOT TAB ━━━━━━━━━━━━━━━

function HotspotTab({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<PaginatedResponse<HotspotUser> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      const res = await superadminApi.getTenantHotspotUsers(tenantId, params)
      setData(res)
    } catch {
      toast.error("Failed to load hotspot users")
    } finally {
      setLoading(false)
    }
  }, [tenantId, page, search])

  useEffect(() => {
    const t = setTimeout(loadData, 300)
    return () => clearTimeout(t)
  }, [loadData])

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Signal className="w-5 h-5 text-amber-400" />
            Hotspot Users ({data?.count ?? 0})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search username, MAC…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <TableLoader /> : !data || data.results.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No hotspot users found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">MAC Address</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Router</th>
                    <th className="px-4 py-3">Download</th>
                    <th className="px-4 py-3">Upload</th>
                    <th className="px-4 py-3">Connected</th>
                    <th className="px-4 py-3">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.results.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(u.status)}>{u.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.mac_address || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.ip_address || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{u.profile || "—"}</td>
                      <td className="px-4 py-3 text-violet-300 text-xs">{u.router_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{formatBytes(u.bytes_in)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatBytes(u.bytes_out)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(u.connected_since)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(u.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data.count} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ━━━━━━━━━━━━━━━ INVENTORY TAB ━━━━━━━━━━━━━━━

function InventoryTab({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<PaginatedResponse<InventoryItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    superadminApi.getTenantInventory(tenantId, { page: String(page) })
      .then(setData)
      .catch(() => toast.error("Failed to load inventory"))
      .finally(() => setLoading(false))
  }, [tenantId, page])

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-400" />
          Inventory ({data?.count ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <TableLoader /> : !data || data.results.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No equipment found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Serial #</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">MAC</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Warranty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.results.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                      <td className="px-4 py-3 text-slate-400">{item.type_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{item.model || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{item.serial_number || "—"}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(item.status)}>{item.status?.replace("_", " ")}</Badge></td>
                      <td className="px-4 py-3 text-slate-400">{item.location || "—"}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.mac_address || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{item.ip_address || "—"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{item.warranty_expiry ? new Date(item.warranty_expiry).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data.count} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ━━━━━━━━━━━━━━━ AUDIT LOG TAB ━━━━━━━━━━━━━━━

function AuditLogTab({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<PaginatedResponse<AuditLogEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [page, setPage] = useState(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      if (actionFilter !== "all") params.action = actionFilter
      const res = await superadminApi.getTenantAuditLog(tenantId, params)
      setData(res)
    } catch {
      toast.error("Failed to load audit log")
    } finally {
      setLoading(false)
    }
  }, [tenantId, page, search, actionFilter])

  useEffect(() => {
    const t = setTimeout(loadData, 300)
    return () => clearTimeout(t)
  }, [loadData])

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  const actionBadge = (action: string) => {
    const m: Record<string, string> = {
      create: "bg-emerald-500/20 text-emerald-400",
      update: "bg-blue-500/20 text-blue-400",
      delete: "bg-red-500/20 text-red-400",
      login: "bg-violet-500/20 text-violet-400",
      logout: "bg-slate-500/20 text-slate-400",
      view: "bg-cyan-500/20 text-cyan-400",
      export: "bg-amber-500/20 text-amber-400",
    }
    return <Badge className={m[action] || "bg-slate-500/20 text-slate-400"}>{action}</Badge>
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-violet-400" />
            Tenant Audit Log ({data?.count ?? 0})
          </CardTitle>
          <div className="flex gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="view">View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <TableLoader /> : !data || data.results.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No audit entries found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Object</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.results.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(entry.timestamp)}</td>
                      <td className="px-4 py-3 text-slate-300">{entry.actor_email}</td>
                      <td className="px-4 py-3">{actionBadge(entry.action)}</td>
                      <td className="px-4 py-3 text-slate-400">{entry.model_name}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{entry.object_repr || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{entry.ip_address || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data.count} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ━━━━━━━━━━━━━━━ Shared Components ━━━━━━━━━━━━━━━

function StatCard({ label, value, sub, icon: Icon, color = "text-slate-400" }: {
  label: string; value: number | string; sub?: string; icon: React.ElementType; color?: string
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <p className="text-lg font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function BreakdownCard({ title, icon: Icon, items }: {
  title: string; icon: React.ElementType; items: { label: string; value: number; color: string }[]
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-white text-sm">{title}</span>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">{item.label}</span>
              <span className={`font-semibold text-sm ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <span className="text-slate-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  )
}

function TableLoader() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange, total }: {
  page: number; totalPages: number; onPageChange: (p: number) => void; total: number
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
      <p className="text-xs text-slate-500">{total} total · Page {page} of {totalPages}</p>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-8 w-8 text-slate-400">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-8 w-8 text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
