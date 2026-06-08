"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Gauge, Plus, Edit, Trash2, MoreVertical, Search, RefreshCw,
  AlertTriangle, CheckCircle, Users, Activity, Download, Link as LinkIcon, Filter,
  Wifi, Server, Clock3, DollarSign, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/admin-api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

// --- TYPES ---
export type FupPolicyStatus = "DRAFT" | "ACTIVE" | "INACTIVE"
export type FupResetPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "SUBSCRIPTION" | "PEAK_HOURS"

export interface FupPolicyDto {
  id: string
  name: string
  description: string
  data_limit_gb: number
  throttle_download_mbps: number
  throttle_upload_mbps: number
  reset_period: FupResetPeriod
  status: FupPolicyStatus
  auto_enforce: boolean
  notify_on_violation: boolean
  is_active: boolean
  linked_plans_count: number
  users_count: number
  active_violations_count: number
  currently_throttled_count: number
  created_at: string
  peak_hour_start?: string
  peak_hour_end?: string
}

export interface FupViolationDto {
  id: string
  customer_name: string
  customer_code: string
  policy_name: string
  usage_gb: number
  limit_gb: number
  action_taken: "WARNED" | "THROTTLED" | "RETHROTTLED" | "RELEASED" | "RESET"
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED"
  occurred_at: string
}

export interface FupThrottleStateDto {
  id: string
  customer_name: string
  customer_code?: string
  policy_name: string
  original_download_mbps: number
  original_upload_mbps: number
  throttled_download_mbps: number
  throttled_upload_mbps: number
  active: boolean
  applied_at: string
}

export interface FupDashboardSummaryDto {
  active_policies: number
  users_under_fup: number
  active_violations: number
  currently_throttled: number
}

export interface FupAnalyticsOverviewDto {
  violation_trends: Array<{ date: string; count: number }>
  top_violators_this_month: Array<{ customer_code: string; name: string; violations: number; avg_excess_pct?: number }>
  policy_distribution: Array<{ policy_id: string; policy_name: string; users: number }>
}

export interface FupPlanOptionDto {
  id: string
  name: string
  already_linked: boolean
  plan_type?: string
  type?: string
  status?: string
  is_active?: boolean
  price?: number | string
  base_price?: number | string
  validity_display?: string
  validity_type?: string
  validity_days?: number
  duration_days?: number
  validity_hours?: number
  validity_minutes?: number
  validity_months?: number
  download_speed?: number
  upload_speed?: number
  speed?: number
  subscriber_count?: number
  subscribers_count?: number
  users_count?: number
  max_sessions?: number
  simultaneous_devices?: number
}

export interface FupAvailablePlansDto {
  billing_plans: FupPlanOptionDto[]
  hotspot_plans: FupPlanOptionDto[]
}

export interface FupUsageWindowDto {
  id: string
  customer_name: string
  customer_code: string
  policy_name: string
  plan_name: string
  total_gb: number
  limit_gb: number
  usage_percent: number
  status: string
  is_throttled: boolean
  period_start: string
  period_end: string
}

// --- MAPPERS ---
const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE": return <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">Active</Badge>
    case "INACTIVE": return <Badge className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">Inactive</Badge>
    case "DRAFT": return <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">Draft</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

const getViolationBadge = (status: string) => {
  switch (status) {
    case "OPEN": return <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">Open</Badge>
    case "RESOLVED": return <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">Resolved</Badge>
    case "ACKNOWLEDGED": return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">Acknowledged</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

const planCurrencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
})

const formatPlanPrice = (plan: FupPlanOptionDto) => {
  const raw = plan.base_price ?? plan.price
  const amount = typeof raw === "string" ? parseFloat(raw) : raw

  if (typeof amount === "number" && Number.isFinite(amount)) {
    return planCurrencyFormatter.format(amount)
  }

  return "Not set"
}

const formatPlanDuration = (plan: FupPlanOptionDto) => {
  if (plan.validity_display) return plan.validity_display

  const validityType = (plan.validity_type || "").toUpperCase()
  const days = plan.duration_days ?? plan.validity_days

  if (validityType === "MINUTES" && plan.validity_minutes) {
    return `${plan.validity_minutes} minute(s)`
  }
  if (validityType === "HOURS" && plan.validity_hours) {
    return `${plan.validity_hours} hour(s)`
  }
  if (validityType === "MONTHS" && plan.validity_months) {
    return `${plan.validity_months} month(s)`
  }
  if (days) {
    return `${days} day(s)`
  }

  return "Flexible"
}

const getPlanUsers = (plan: FupPlanOptionDto) => {
  return plan.users_count ?? plan.subscriber_count ?? plan.subscribers_count ?? 0
}

const getPlanSpeed = (plan: FupPlanOptionDto) => {
  const download = plan.download_speed ?? plan.speed
  const upload = plan.upload_speed

  if (download && upload) {
    return `${download}/${upload} Mbps`
  }
  if (download) {
    return `${download} Mbps`
  }

  return "Flexible"
}

const isPlanActive = (plan: FupPlanOptionDto) => {
  if (typeof plan.is_active === "boolean") return plan.is_active
  if (typeof plan.status === "string") return plan.status.toUpperCase() === "ACTIVE"
  return false
}

const getBillingPlanBucket = (plan: FupPlanOptionDto): "pppoe" | "static" | "other" => {
  const type = (plan.plan_type || plan.type || "").toUpperCase()
  const name = plan.name.toLowerCase()

  if (type.includes("PPPOE") || name.includes("pppoe")) return "pppoe"
  if (type.includes("STATIC") || name.includes("static") || name.includes("trap") || name.includes("pool")) return "static"
  return "other"
}

export default function FUPPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("policies")
  const [isLoading, setIsLoading] = useState(true)

  // --- API STATE ---
  const [dashboard, setDashboard] = useState<FupDashboardSummaryDto>({ active_policies: 0, users_under_fup: 0, active_violations: 0, currently_throttled: 0 })
  const [policies, setPolicies] = useState<FupPolicyDto[]>([])
  const [violations, setViolations] = useState<FupViolationDto[]>([])
  const [throttledUsers, setThrottledUsers] = useState<FupThrottleStateDto[]>([])
  const [analytics, setAnalytics] = useState<FupAnalyticsOverviewDto | null>(null)
  const [usageWindows, setUsageWindows] = useState<FupUsageWindowDto[]>([])

  // --- FILTERS ---
  const [policySearch, setPolicySearch] = useState("")
  const [violSearch, setViolSearch] = useState("")
  const [violStatusFilter, setViolStatusFilter] = useState("ALL")
  const [violPolicyFilter, setViolPolicyFilter] = useState("ALL")

  // --- MODAL & FORM STATE ---
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [selectedPolicyForLink, setSelectedPolicyForLink] = useState<FupPolicyDto | null>(null)
  
  const [availablePlans, setAvailablePlans] = useState<FupAvailablePlansDto>({ billing_plans: [], hotspot_plans: [] })
  
  // Link State
  const [initialBillingIds, setInitialBillingIds] = useState<string[]>([])
  const [initialHotspotIds, setInitialHotspotIds] = useState<string[]>([])
  const [selectedBillingIds, setSelectedBillingIds] = useState<string[]>([])
  const [selectedHotspotIds, setSelectedHotspotIds] = useState<string[]>([])

  const [policyForm, setPolicyForm] = useState<Partial<FupPolicyDto & {
    peak_hour_start?: string
    peak_hour_end?: string
  }>>({
    name: "",
    description: "",
    data_limit_gb: 100,
    reset_period: "MONTHLY",
    throttle_download_mbps: 2,
    throttle_upload_mbps: 1,
    auto_enforce: true,
    notify_on_violation: true,
    status: "ACTIVE",
    peak_hour_start: "19:00",
    peak_hour_end: "22:00",
  })

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [stats, polData, throtData, analyticsData, usageData] = await Promise.all([
        adminApi.getFupDashboardSummary().catch(() => dashboard),
        adminApi.getFupPolicies().catch(() => ({ results: [] })),
        adminApi.getFupThrottledUsers().catch(() => ({ results: [] })),
        adminApi.getFupAnalyticsOverview().catch(() => null),
        adminApi.getFupUsageWindows().catch(() => ({ results: [] }))
      ])

      if (stats) setDashboard(stats)
      setPolicies(polData?.results || polData || [])
      setThrottledUsers(throtData?.results || throtData || [])
      if (analyticsData) setAnalytics(analyticsData)
      setUsageWindows(usageData?.results || usageData || [])
      
      // Fetch violations separately to easily re-fetch when filters change
      fetchViolations()
    } catch (error: any) {
      toast({ title: "Error loading FUP data", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchViolations = async () => {
    try {
      const params: any = {}
      if (violStatusFilter !== "ALL") params.status = violStatusFilter
      if (violPolicyFilter !== "ALL") params.policy_id = violPolicyFilter
      if (violSearch) params.search = violSearch

      const violData = await adminApi.getFupViolations(params).catch(() => ({ results: [] }))
      setViolations(violData?.results || violData || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { fetchAllData() }, [])

  // Re-fetch violations when filters change
  useEffect(() => {
    const timer = setTimeout(() => { fetchViolations() }, 500)
    return () => clearTimeout(timer)
  }, [violSearch, violStatusFilter, violPolicyFilter])

  // --- ACTIONS ---
  const handleCreatePolicy = async () => {
    try {
      await adminApi.createFupPolicy(policyForm)
      toast({ title: "Success", description: "Policy created successfully." })
      setIsCreateOpen(false)
      fetchAllData()
    } catch (error: any) {
      toast({ title: "Failed to create policy", description: error.message, variant: "destructive" })
    }
  }

  const handleTogglePolicyStatus = async (policy: FupPolicyDto) => {
    try {
      if (policy.status === "ACTIVE") {
        await adminApi.deactivateFupPolicy(policy.id)
        toast({ title: "Deactivated", description: `${policy.name} has been deactivated.` })
      } else {
        await adminApi.activateFupPolicy(policy.id)
        toast({ title: "Activated", description: `${policy.name} is now active.` })
      }
      fetchAllData()
    } catch (error: any) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" })
    }
  }

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy? This cannot be undone.")) return
    try {
      await adminApi.deleteFupPolicy(id)
      toast({ title: "Deleted", description: "The policy has been removed." })
      fetchAllData()
    } catch (e: any) {
      toast({ 
        title: "Delete Restricted", 
        description: e.message || "Please unlink all plans and resolve violations before deleting.", 
        variant: "destructive" 
      })
    }
  }

  const handleExportViolations = async () => {
    try {
      const blob = await adminApi.exportFupViolations()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fup_violations_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" })
    }
  }

  // --- LINKING LOGIC ---
  const openLinkDialog = async (policy: FupPolicyDto) => {
    setSelectedPolicyForLink(policy)
    setIsLinkOpen(true)
    try {
      const data = await adminApi.getFupAvailablePlans(policy.id)
      setAvailablePlans(data)
      
      const bIds = data.billing_plans.filter((p: any) => p.already_linked).map((p: any) => p.id)
      const hIds = data.hotspot_plans.filter((p: any) => p.already_linked).map((p: any) => p.id)
      
      setInitialBillingIds(bIds)
      setInitialHotspotIds(hIds)
      setSelectedBillingIds(bIds)
      setSelectedHotspotIds(hIds)
    } catch (error: any) {
      toast({ title: "Failed to load plans", description: error.message, variant: "destructive" })
    }
  }

  const handleSaveLinks = async () => {
    if (!selectedPolicyForLink) return
    
    const billingToLink = selectedBillingIds.filter(id => !initialBillingIds.includes(id))
    const billingToUnlink = initialBillingIds.filter(id => !selectedBillingIds.includes(id))
    const hotspotToLink = selectedHotspotIds.filter(id => !initialHotspotIds.includes(id))
    const hotspotToUnlink = initialHotspotIds.filter(id => !selectedHotspotIds.includes(id))

    try {
      if (billingToLink.length > 0 || hotspotToLink.length > 0) {
        await adminApi.linkFupPlans(selectedPolicyForLink.id, {
          plan_ids: billingToLink,
          hotspot_plan_ids: hotspotToLink
        })
      }

      if (billingToUnlink.length > 0 || hotspotToUnlink.length > 0) {
        await adminApi.unlinkFupPlans(selectedPolicyForLink.id, {
          plan_ids: billingToUnlink,
          hotspot_plan_ids: hotspotToUnlink
        })
      }

      toast({ title: "Success", description: "Plan links updated successfully." })
      setIsLinkOpen(false)
      fetchAllData()
    } catch (error: any) {
      toast({ title: "Failed to update links", description: error.message, variant: "destructive" })
    }
  }

  const toggleBillingPlan = (id: string) => setSelectedBillingIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  const toggleHotspotPlan = (id: string) => setSelectedHotspotIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const pppoeBillingPlans = useMemo(
    () => availablePlans.billing_plans.filter((plan) => getBillingPlanBucket(plan) === "pppoe"),
    [availablePlans.billing_plans]
  )

  const staticBillingPlans = useMemo(
    () => availablePlans.billing_plans.filter((plan) => getBillingPlanBucket(plan) === "static"),
    [availablePlans.billing_plans]
  )

  const otherBillingPlans = useMemo(
    () => availablePlans.billing_plans.filter((plan) => getBillingPlanBucket(plan) === "other"),
    [availablePlans.billing_plans]
  )

  const pendingLinksCount = useMemo(() => {
    const billingNewLinks = selectedBillingIds.filter((id) => !initialBillingIds.includes(id)).length
    const hotspotNewLinks = selectedHotspotIds.filter((id) => !initialHotspotIds.includes(id)).length
    return billingNewLinks + hotspotNewLinks
  }, [selectedBillingIds, initialBillingIds, selectedHotspotIds, initialHotspotIds])

  const pendingUnlinksCount = useMemo(() => {
    const billingUnlinks = initialBillingIds.filter((id) => !selectedBillingIds.includes(id)).length
    const hotspotUnlinks = initialHotspotIds.filter((id) => !selectedHotspotIds.includes(id)).length
    return billingUnlinks + hotspotUnlinks
  }, [selectedBillingIds, initialBillingIds, selectedHotspotIds, initialHotspotIds])

  const pendingChangesCount = pendingLinksCount + pendingUnlinksCount
  const totalSelectedPlans = selectedBillingIds.length + selectedHotspotIds.length
  const totalAvailablePlans = availablePlans.billing_plans.length + availablePlans.hotspot_plans.length

  const renderPlanCard = (plan: FupPlanOptionDto, source: "billing" | "hotspot") => {
    const isSelected = source === "billing"
      ? selectedBillingIds.includes(plan.id)
      : selectedHotspotIds.includes(plan.id)

    const togglePlan = source === "billing" ? toggleBillingPlan : toggleHotspotPlan
    const active = isPlanActive(plan)

    return (
      <button
        key={`${source}-${plan.id}`}
        type="button"
        onClick={() => togglePlan(plan.id)}
        className={`w-full rounded-lg border p-4 text-left transition-all duration-200 ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-sm"
            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Checkbox checked={isSelected} className="mt-0.5 pointer-events-none data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
            <div>
              <p className={`text-sm font-semibold ${isSelected ? "text-blue-900" : "text-slate-800"}`}>{plan.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {plan.already_linked && (
                  <Badge variant="outline" className="border-slate-300 text-slate-600">Previously linked</Badge>
                )}
                {!plan.already_linked && isSelected && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">New link</Badge>
                )}
                {plan.already_linked && !isSelected && (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Will unlink</Badge>
                )}
              </div>
            </div>
          </div>
          <Badge className={active ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}>
            {active ? "active" : "inactive"}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
            <span>{formatPlanPrice(plan)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-blue-600" />
            <span>{formatPlanDuration(plan)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-orange-600" />
            <span>{getPlanSpeed(plan)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-violet-600" />
            <span>{getPlanUsers(plan)} users</span>
          </div>
        </div>
      </button>
    )
  }

  const renderPlanSection = (
    title: string,
    Icon: React.ComponentType<{ className?: string }>,
    plans: FupPlanOptionDto[],
    source: "billing" | "hotspot",
    emptyMessage: string,
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-600" />
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{title} ({plans.length})</h4>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {plans.map((plan) => renderPlanCard(plan, source))}
        </div>
      )}
    </div>
  )

  const filteredPolicies = useMemo(() => policies.filter(p => p.name.toLowerCase().includes(policySearch.toLowerCase())), [policies, policySearch])

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fair Usage Policy</h1><p className="text-slate-600 dark:text-slate-400 mt-1">Monitor, enforce, and manage bandwidth rules</p></div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={fetchAllData} disabled={isLoading} className="w-full sm:w-auto"><RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh</Button>
          <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Create Policy</Button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-600">Active Policies</p><p className="text-2xl font-bold text-green-600">{dashboard.active_policies}</p></div><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Gauge className="w-5 h-5 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-600">Users Under FUP</p><p className="text-2xl font-bold">{dashboard.users_under_fup}</p></div><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-600">Active Violations</p><p className="text-2xl font-bold text-orange-600">{dashboard.active_violations}</p></div><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-orange-600" /></div></CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-slate-600">Currently Throttled</p><p className="text-2xl font-bold text-red-600">{dashboard.currently_throttled}</p></div><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Activity className="w-5 h-5 text-red-600" /></div></CardContent></Card>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="usage">Current Usage</TabsTrigger>
          <TabsTrigger value="violations">Violations {dashboard.active_violations > 0 && <Badge variant="destructive" className="ml-2">{dashboard.active_violations}</Badge>}</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="throttled">Throttled Users</TabsTrigger>
        </TabsList>

        {/* CURRENT USAGE TAB */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Usage Progress</CardTitle>
              <CardDescription>Live monitoring of users currently tracked under FUP policies</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-4 text-center animate-pulse text-slate-500">Loading usage data...</div>
              ) : usageWindows.length === 0 ? (
                <div className="p-4 text-center border rounded-lg bg-slate-50 text-slate-500">No users currently under FUP tracking.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Policy & Plan</TableHead>
                      <TableHead className="w-[30%]">Usage Progress</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageWindows.map((uw) => {
                      const isOverLimit = Number(uw.usage_percent || 0) >= 100;
                      return (
                        <TableRow key={uw.id}>
                          <TableCell className="font-medium">
                            {uw.customer_name} <span className="text-xs text-slate-500 block">{uw.customer_code}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-slate-800">{uw.policy_name}</span>
                            <span className="text-xs text-slate-500 block">{uw.plan_name}</span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-medium">
                                <span className={isOverLimit ? "text-red-600" : "text-slate-700"}>
                                  {Number(uw.total_gb || 0).toFixed(1)} GB used
                                </span>
                                <span className="text-slate-500">
                                  {Number(uw.limit_gb || 0).toFixed(1)} GB limit
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(Number(uw.usage_percent || 0), 100)} 
                                className={`h-2 ${isOverLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`} 
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {isOverLimit ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Throttled</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* POLICIES TAB */}
        <TabsContent value="policies" className="space-y-4">
          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search policies..." value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} className="pl-10" /></div>
          <div className="grid gap-4">
            {isLoading ? (<div className="p-8 text-center text-slate-500 animate-pulse">Loading policies...</div>) 
            : filteredPolicies.length === 0 ? (<Card className="p-8 text-center text-slate-500">No policies found.</Card>) 
            : filteredPolicies.map((policy) => (
              <Card key={policy.id} className="border">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div><CardTitle className="flex items-center gap-2">{policy.name} {getStatusBadge(policy.status)}</CardTitle><CardDescription className="mt-1">{policy.description}</CardDescription></div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openLinkDialog(policy)}><LinkIcon className="w-4 h-4 mr-2" /> Link Plans</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit Policy</DropdownMenuItem>
                        {policy.status === "ACTIVE" ? (
                          <DropdownMenuItem onClick={() => handleTogglePolicyStatus(policy)}><AlertTriangle className="w-4 h-4 mr-2" /> Deactivate</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleTogglePolicyStatus(policy)}><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Activate</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeletePolicy(policy.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div><span className="text-slate-500 dark:text-slate-400 block">Data Limit</span><span className="font-semibold">{policy.data_limit_gb} GB / {policy.reset_period}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400 block">Throttle Speed</span><span className="font-semibold">{policy.throttle_download_mbps}↓ / {policy.throttle_upload_mbps}↑ Mbps</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400 block">Linked Plans</span><span className="font-semibold">{policy.linked_plans_count || 0}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400 block">Status Overview</span><span className="font-semibold">{policy.users_count || 0} Users • {policy.currently_throttled_count || 0} Throttled</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* VIOLATIONS TAB */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div><CardTitle>Policy Violations</CardTitle><CardDescription>Audit log of FUP actions</CardDescription></div>
              <Button variant="outline" size="sm" onClick={handleExportViolations}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search by customer..." value={violSearch} onChange={(e) => setViolSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={violStatusFilter} onValueChange={setViolStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><Filter className="w-4 h-4 mr-2 text-slate-500"/><SelectValue placeholder="Filter Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem><SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem><SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={violPolicyFilter} onValueChange={setViolPolicyFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter Policy" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Policies</SelectItem>
                    {policies.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (<div className="p-4 text-center animate-pulse">Loading violations...</div>) : violations.length === 0 ? (<div className="p-4 text-center border rounded-lg bg-slate-50">No FUP violations found.</div>) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Policy</TableHead><TableHead>Usage (GB)</TableHead><TableHead>Action</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {violations.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.customer_name} <span className="text-xs text-slate-500 block">{v.customer_code}</span></TableCell>
                        <TableCell>{v.policy_name}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><Progress value={v.limit_gb > 0 ? Math.min(100, (v.usage_gb / v.limit_gb) * 100) : 0} className="w-16 h-2" /><span className="text-xs">{v.usage_gb} / {v.limit_gb}</span></div></TableCell>
                        <TableCell><Badge variant="outline">{v.action_taken}</Badge></TableCell>
                        <TableCell>{getViolationBadge(v.status)}</TableCell>
                        <TableCell className="text-sm text-slate-500">{new Date(v.occurred_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* THROTTLED USERS TAB */}
        <TabsContent value="throttled" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Currently Throttled Users</CardTitle><CardDescription>Live view of active speed restrictions</CardDescription></CardHeader>
            <CardContent>
              {isLoading ? (<div className="p-4 text-center animate-pulse">Loading throttled users...</div>) : throttledUsers.length === 0 ? (<div className="p-4 text-center border rounded-lg bg-slate-50">No users are currently throttled.</div>) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Policy</TableHead><TableHead>Original Speed</TableHead><TableHead>Throttled Speed</TableHead><TableHead>Applied At</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {throttledUsers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.customer_name}</TableCell>
                        <TableCell>{t.policy_name}</TableCell>
                        <TableCell className="text-slate-500">{t.original_download_mbps}↓ / {t.original_upload_mbps}↑</TableCell>
                        <TableCell className="text-red-600 font-medium">{t.throttled_download_mbps}↓ / {t.throttled_upload_mbps}↑</TableCell>
                        <TableCell className="text-sm text-slate-500">{new Date(t.applied_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          {!analytics ? (
            <Card className="p-12 text-center text-slate-500"><Activity className="w-8 h-8 mx-auto mb-3 opacity-50" /><p>No analytics data available yet.</p></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Violation Trends</CardTitle><CardDescription>Violations over time</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.violation_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#64748b' }} 
                          dy={10} 
                        />
                        <YAxis 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#64748b' }} 
                        />
                        <RechartsTooltip 
                          cursor={{ fill: '#f8fafc' }} 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                          }} 
                        />
                        <Bar 
                          dataKey="count" 
                          fill="url(#colorCount)" 
                          radius={[4, 4, 0, 0]} 
                          barSize={40} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Policy Distribution</CardTitle><CardDescription>Users per FUP policy</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {analytics.policy_distribution.map((pd, idx) => {
                    const total = analytics.policy_distribution.reduce((acc, curr) => acc + curr.users, 0);
                    const pct = total > 0 ? (pd.users / total) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm"><span>{pd.policy_name}</span><span className="font-medium">{pd.users} users</span></div>
                        <Progress value={pct} className="h-2 bg-slate-100 [&>div]:bg-blue-600" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Top Violators</CardTitle><CardDescription>Users with most recent violations</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Violations</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {analytics.top_violators_this_month.map((tv, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{tv.name} <span className="text-xs text-slate-500 block">{tv.customer_code}</span></TableCell>
                          <TableCell><Badge variant="secondary">{tv.violations}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* CREATE POLICY SHEET */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Create FUP Policy</SheetTitle><SheetDescription>Define limits and throttle speeds</SheetDescription></SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input
                  placeholder="e.g., Bronze FUP"
                  value={policyForm.name || ""}
                  onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional details..."
                  value={policyForm.description || ""}
                  onChange={e => setPolicyForm({ ...policyForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Limit (GB)</Label>
                  {/* FIX: value uses '' when 0 so user can clear it */}
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={policyForm.data_limit_gb || ""}
                    onChange={e =>
                      setPolicyForm({
                        ...policyForm,
                        data_limit_gb: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reset Period</Label>
                  <Select
                    value={policyForm.reset_period}
                    onValueChange={(v: FupResetPeriod) => setPolicyForm({ ...policyForm, reset_period: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription Period</SelectItem>
                      <SelectItem value="PEAK_HOURS">⏱ Peak Hours Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Peak hours time picker — only shown when PEAK_HOURS selected */}
              {policyForm.reset_period === "PEAK_HOURS" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-xs font-medium text-amber-800">
                    ⏱ Peak Hours (Nairobi EAT time) — Usage only tracked during this window
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-amber-800">Start Time</Label>
                      <Input
                        type="time"
                        value={policyForm.peak_hour_start || "19:00"}
                        onChange={e => setPolicyForm({ ...policyForm, peak_hour_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-amber-800">End Time</Label>
                      <Input
                        type="time"
                        value={policyForm.peak_hour_end || "22:00"}
                        onChange={e => setPolicyForm({ ...policyForm, peak_hour_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-amber-700">
                    Default: 7:00 PM – 10:00 PM EAT (Nairobi)
                  </p>
                </div>
              )}

              <Separator className="my-2" />
              <h3 className="text-sm font-semibold text-slate-500">Throttle Speeds After Limit</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Download ↓ (Mbps)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={policyForm.throttle_download_mbps || ""}
                    onChange={e =>
                      setPolicyForm({
                        ...policyForm,
                        throttle_download_mbps: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload ↑ (Mbps)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    value={policyForm.throttle_upload_mbps || ""}
                    onChange={e =>
                      setPolicyForm({
                        ...policyForm,
                        throttle_upload_mbps: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between items-center">
                <Label>Auto Enforce</Label>
                <Switch
                  checked={!!policyForm.auto_enforce}
                  onCheckedChange={v => setPolicyForm({ ...policyForm, auto_enforce: v })}
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <Label>Notify on Violation</Label>
                <Switch
                  checked={!!policyForm.notify_on_violation}
                  onCheckedChange={v => setPolicyForm({ ...policyForm, notify_on_violation: v })}
                />
              </div>

              <Button className="w-full mt-6" onClick={handleCreatePolicy}>
                Save Policy
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* LINK PLANS DIALOG */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="w-[96vw] max-w-5xl p-0">
          <DialogHeader className="border-b bg-slate-50 px-6 py-5">
            <DialogTitle>Attach Plans to {selectedPolicyForLink?.name || "Policy"}</DialogTitle>
            <DialogDescription>
              Select the internet plans that should be managed by this policy. Selected plans: {totalSelectedPlans}
            </DialogDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-slate-300 text-slate-700">Available: {totalAvailablePlans}</Badge>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">To link: {pendingLinksCount}</Badge>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">To unlink: {pendingUnlinksCount}</Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[68vh] px-6 py-5">
            <div className="space-y-6">
              {renderPlanSection(
                "PPPoE Plans",
                Wifi,
                pppoeBillingPlans,
                "billing",
                "No PPPoE plans are available for this tenant."
              )}

              {renderPlanSection(
                "Static Plans",
                Server,
                staticBillingPlans,
                "billing",
                "No static plans are available for this tenant."
              )}

              {otherBillingPlans.length > 0 && renderPlanSection(
                "Billing Plans",
                LinkIcon,
                otherBillingPlans,
                "billing",
                "No additional billing plans are available."
              )}

              {renderPlanSection(
                "Hotspot Plans",
                Wifi,
                availablePlans.hotspot_plans,
                "hotspot",
                "No hotspot plans are available for this tenant."
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t bg-white px-6 py-4">
            <Button variant="outline" onClick={() => setIsLinkOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLinks} disabled={pendingChangesCount === 0}>
              Save Links {pendingChangesCount > 0 ? `(${pendingChangesCount} changes)` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
