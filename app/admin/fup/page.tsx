"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Gauge, Plus, Edit, Trash2, MoreVertical, Search, RefreshCw,
  AlertTriangle,CheckCircle, Users, Activity, Download, Link as LinkIcon, Filter
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
export type FupResetPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "SUBSCRIPTION"

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

export interface FupAvailablePlansDto {
  billing_plans: Array<{ id: string; name: string; already_linked: boolean }>
  hotspot_plans: Array<{ id: string; name: string; already_linked: boolean }>
}

// --- MAPPERS ---
const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE": return <Badge className="bg-green-100 text-green-700">Active</Badge>
    case "INACTIVE": return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
    case "DRAFT": return <Badge className="bg-yellow-100 text-yellow-700">Draft</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

const getViolationBadge = (status: string) => {
  switch (status) {
    case "OPEN": return <Badge className="bg-red-100 text-red-700">Open</Badge>
    case "RESOLVED": return <Badge className="bg-green-100 text-green-700">Resolved</Badge>
    case "ACKNOWLEDGED": return <Badge className="bg-blue-100 text-blue-700">Acknowledged</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
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

  const [policyForm, setPolicyForm] = useState<Partial<FupPolicyDto>>({
    name: "", description: "", data_limit_gb: 100, reset_period: "MONTHLY",
    throttle_download_mbps: 2, throttle_upload_mbps: 1,
    auto_enforce: true, notify_on_violation: true, status: "ACTIVE"
  })

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      // Note the fixed catch syntax: ({ results: [] }) instead of { results: [] }
      const [stats, polData, throtData, analyticsData] = await Promise.all([
        adminApi.getFupDashboardSummary().catch(() => dashboard),
        adminApi.getFupPolicies().catch(() => ({ results: [] })),
        adminApi.getFupThrottledUsers().catch(() => ({ results: [] })),
        adminApi.getFupAnalyticsOverview().catch(() => null)
      ])

      if (stats) setDashboard(stats)
      setPolicies(polData?.results || polData || [])
      setThrottledUsers(throtData?.results || throtData || [])
      if (analyticsData) setAnalytics(analyticsData)
      
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
    if (!confirm("Are you sure you want to delete this policy?")) return
    try {
      await adminApi.deleteFupPolicy(id)
      toast({ title: "Deleted", description: "Policy removed." })
      fetchAllData()
    } catch (error: any) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" })
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
      
      // Find currently linked IDs
      const bIds = data.billing_plans.filter((p: any) => p.already_linked).map((p: any) => p.id)
      const hIds = data.hotspot_plans.filter((p: any) => p.already_linked).map((p: any) => p.id)
      
      // Set initial states for diffing later
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
    
    // DIFFING LOGIC: Determine what to link and what to unlink
    const billingToLink = selectedBillingIds.filter(id => !initialBillingIds.includes(id))
    const billingToUnlink = initialBillingIds.filter(id => !selectedBillingIds.includes(id))
    
    const hotspotToLink = selectedHotspotIds.filter(id => !initialHotspotIds.includes(id))
    const hotspotToUnlink = initialHotspotIds.filter(id => !selectedHotspotIds.includes(id))

    try {
      // 1. Send Link Request
      if (billingToLink.length > 0 || hotspotToLink.length > 0) {
        await adminApi.linkFupPlans(selectedPolicyForLink.id, {
          plan_ids: billingToLink,
          hotspot_plan_ids: hotspotToLink
        })
      }

      // 2. Send Unlink Request
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

  const filteredPolicies = useMemo(() => policies.filter(p => p.name.toLowerCase().includes(policySearch.toLowerCase())), [policies, policySearch])

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900">Fair Usage Policy</h1><p className="text-slate-600 mt-1">Monitor, enforce, and manage bandwidth rules</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllData} disabled={isLoading}><RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh</Button>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Policy</Button>
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
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="violations">Violations {dashboard.active_violations > 0 && <Badge variant="destructive" className="ml-2">{dashboard.active_violations}</Badge>}</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="throttled">Throttled Users</TabsTrigger>
        </TabsList>

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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm bg-slate-50 p-4 rounded-lg">
                    <div><span className="text-slate-500 block">Data Limit</span><span className="font-semibold">{policy.data_limit_gb} GB / {policy.reset_period}</span></div>
                    <div><span className="text-slate-500 block">Throttle Speed</span><span className="font-semibold">{policy.throttle_download_mbps}↓ / {policy.throttle_upload_mbps}↑ Mbps</span></div>
                    <div><span className="text-slate-500 block">Linked Plans</span><span className="font-semibold">{policy.linked_plans_count || 0}</span></div>
                    <div><span className="text-slate-500 block">Status Overview</span><span className="font-semibold">{policy.users_count || 0} Users • {policy.currently_throttled_count || 0} Throttled</span></div>
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
              
              {/* Toolbar Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search by customer..." value={violSearch} onChange={(e) => setViolSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={violStatusFilter} onValueChange={setViolStatusFilter}>
                  <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2 text-slate-500"/><SelectValue placeholder="Filter Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem><SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem><SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={violPolicyFilter} onValueChange={setViolPolicyFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Policy" /></SelectTrigger>
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
                      <BarChart data={analytics.violation_trends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
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
              <div className="space-y-2"><Label>Policy Name</Label><Input placeholder="e.g., Bronze FUP" value={policyForm.name} onChange={e => setPolicyForm({...policyForm, name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Details..." value={policyForm.description} onChange={e => setPolicyForm({...policyForm, description: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2"><Label>Data Limit (GB)</Label><Input type="number" value={policyForm.data_limit_gb} onChange={e => setPolicyForm({...policyForm, data_limit_gb: Number(e.target.value)})} /></div>
                <div className="space-y-2"><Label>Reset Period</Label>
                  <Select value={policyForm.reset_period} onValueChange={(v: FupResetPeriod) => setPolicyForm({...policyForm, reset_period: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem><SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="SUBSCRIPTION" disabled>Subscription (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-4" />
              <h3 className="text-sm font-semibold text-slate-500">Throttle Speeds (Mbps)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Download (↓)</Label><Input type="number" value={policyForm.throttle_download_mbps} onChange={e => setPolicyForm({...policyForm, throttle_download_mbps: Number(e.target.value)})} /></div>
                <div className="space-y-2"><Label>Upload (↑)</Label><Input type="number" value={policyForm.throttle_upload_mbps} onChange={e => setPolicyForm({...policyForm, throttle_upload_mbps: Number(e.target.value)})} /></div>
              </div>

              <Separator className="my-4" />
              <div className="flex justify-between items-center"><Label>Auto Enforce</Label><Switch checked={policyForm.auto_enforce} onCheckedChange={v => setPolicyForm({...policyForm, auto_enforce: v})} /></div>
              <div className="flex justify-between items-center mt-4"><Label>Notify on Violation</Label><Switch checked={policyForm.notify_on_violation} onCheckedChange={v => setPolicyForm({...policyForm, notify_on_violation: v})} /></div>

              <Button className="w-full mt-6" onClick={handleCreatePolicy}>Save Policy</Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* LINK PLANS DIALOG */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Plans to Policy</DialogTitle>
            <DialogDescription>Select which plans should follow the <strong>{selectedPolicyForLink?.name}</strong> rules.</DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-3 border p-4 rounded-lg bg-slate-50">
              <h4 className="font-semibold text-sm">Billing Plans</h4>
              <ScrollArea className="h-48">
                 <div className="space-y-3">
                   {availablePlans.billing_plans.length === 0 && <p className="text-sm text-slate-500">No plans available.</p>}
                   {availablePlans.billing_plans.map(plan => (
                     <div key={plan.id} className="flex items-center space-x-2">
                       <Checkbox id={`bp-${plan.id}`} checked={selectedBillingIds.includes(plan.id)} onCheckedChange={() => toggleBillingPlan(plan.id)} />
                       <Label htmlFor={`bp-${plan.id}`}>{plan.name}</Label>
                     </div>
                   ))}
                 </div>
              </ScrollArea>
            </div>
            
            <div className="space-y-3 border p-4 rounded-lg bg-slate-50">
              <h4 className="font-semibold text-sm">Hotspot Plans</h4>
              <ScrollArea className="h-48">
                 <div className="space-y-3">
                   {availablePlans.hotspot_plans.length === 0 && <p className="text-sm text-slate-500">No plans available.</p>}
                   {availablePlans.hotspot_plans.map(plan => (
                     <div key={plan.id} className="flex items-center space-x-2">
                       <Checkbox id={`hp-${plan.id}`} checked={selectedHotspotIds.includes(plan.id)} onCheckedChange={() => toggleHotspotPlan(plan.id)} />
                       <Label htmlFor={`hp-${plan.id}`}>{plan.name}</Label>
                     </div>
                   ))}
                 </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLinks}>Save Links</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}