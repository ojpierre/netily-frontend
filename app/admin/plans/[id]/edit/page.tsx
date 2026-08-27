"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Wifi,
  Settings,
  Plus,
  X,
  RefreshCw,
  Network,
  Gauge,
  Layers,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import { Router as RouterType, IPPool } from "@/lib/types"

export default function EditPlanPage() {
  const router = useRouter()
  const params = useParams()
  const planId = parseInt(params.id as string)

  const [pageLoading, setPageLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")

  // Router & IP Pool state
  const [routers, setRouters] = useState<RouterType[]>([])
  const [routersLoading, setRoutersLoading] = useState(false)
  const [pools, setPools] = useState<IPPool[]>([])
  const [poolsLoading, setPoolsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    plan_type: "PPPOE",
    download_speed: "",
    upload_speed: "",
    speed_unit: "MBPS",
    data_limit: "",
    unlimitedData: true,
    // Validity
    validity_type: "DAYS",
    duration_days: "30",
    validity_hours: "",
    validity_minutes: "",
    validity_months: "1",
    // Sessions
    max_sessions: "1",
    session_timeout: "",
    // MikroTik QoS Priority
    priority: "8",
    // Burst
    burst_enabled: false,
    burst_download: "",
    burst_upload: "",
    burst_threshold: "",
    burst_time: "",
    // IP Pool
    router_id: "",
    ip_pool: "",
    // FUP
    fup_enabled: false,
    fup_limit: "",
    fup_speed: "",
    // Status
    is_active: true,
    is_public: true,
    is_popular: false,
    // Vouchers
    generateVouchers: false,
    voucherPrefix: "",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value } as typeof prev))

    if (field === "router_id") {
      setFormData(prev => ({ ...prev, [field]: value, ip_pool: "" } as typeof prev))
      if (value && typeof value === "string") {
        loadPoolsForRouter(value)
      } else {
        setPools([])
      }
    }
  }

  const loadRouters = async () => {
    setRoutersLoading(true)
    try {
      const res = await adminApi.getRouters({ page_size: "100" })
      setRouters(res.results || [])
    } catch (err) {
      console.error("Failed to load routers:", err)
    } finally {
      setRoutersLoading(false)
    }
  }

  const loadPoolsForRouter = async (routerId: string) => {
    setPoolsLoading(true)
    try {
      const res = await adminApi.getIPPools({ router_id: routerId, is_active: "true" })
      setPools(res.results || [])
    } catch (err) {
      console.error("Failed to load pools:", err)
      setPools([])
    } finally {
      setPoolsLoading(false)
    }
  }

  // Load plan data on mount
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const plan = await adminApi.getPlan(planId)
        setFormData({
          name: plan.name || "",
          description: plan.description || "",
          base_price: plan.base_price?.toString() || plan.price?.toString() || "",
          plan_type: plan.plan_type || "PPPOE",
          download_speed: plan.download_speed?.toString() || "",
          upload_speed: plan.upload_speed?.toString() || "",
          speed_unit: plan.speed_unit || "MBPS",
          data_limit: plan.data_limit?.toString() || "",
          unlimitedData: plan.data_limit == null,
          validity_type: plan.validity_type || "DAYS",
          duration_days: (plan.duration_days ?? plan.validity_days ?? 30).toString(),
          validity_hours: plan.validity_hours?.toString() || "",
          validity_minutes: plan.validity_minutes?.toString() || "",
          validity_months: plan.validity_months?.toString() || "1",
          max_sessions: plan.max_sessions?.toString() || "1",
          session_timeout: plan.session_timeout?.toString() || "",
          priority: plan.priority?.toString() || "8",
          burst_enabled: plan.burst_enabled ?? false,
          burst_download: plan.burst_download?.toString() || "",
          burst_upload: plan.burst_upload?.toString() || "",
          burst_threshold: plan.burst_threshold?.toString() || "",
          burst_time: plan.burst_time?.toString() || "",
          router_id: "",
          ip_pool: plan.ip_pool?.toString() || "",
          fup_enabled: !!(plan.fup_limit || plan.fup_speed),
          fup_limit: plan.fup_limit?.toString() || "",
          fup_speed: plan.fup_speed?.toString() || "",
          is_active: plan.is_active ?? true,
          is_public: plan.is_public ?? true,
          is_popular: plan.is_popular ?? false,
          generateVouchers: false,
          voucherPrefix: "",
        })
        setFeatures(plan.features || [])
      } catch (err: any) {
        toast.error("Failed to load plan: " + (err.message || "Unknown error"))
        router.push("/admin/plans")
      } finally {
        setPageLoading(false)
      }
    }

    fetchPlan()
    loadRouters()
  }, [planId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures(prev => [...prev, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: Record<string, any> = {
        name: formData.name,
        description: formData.description,
        plan_type: formData.plan_type,
        base_price: parseFloat(formData.base_price) || 0,
        download_speed: parseInt(formData.download_speed) || null,
        upload_speed: parseInt(formData.upload_speed) || null,
        speed_unit: formData.speed_unit,
        data_limit: formData.unlimitedData ? null : parseInt(formData.data_limit) || null,
        validity_type: formData.validity_type,
        duration_days: parseInt(formData.duration_days) || 30,
        validity_hours: parseInt(formData.validity_hours) || null,
        validity_minutes: parseInt(formData.validity_minutes) || null,
        validity_months: parseInt(formData.validity_months) || null,
        max_sessions: parseInt(formData.max_sessions) || 1,
        session_timeout: parseInt(formData.session_timeout) || null,
        priority: parseInt(formData.priority) || 8,
        burst_enabled: formData.burst_enabled,
        burst_download: formData.burst_enabled ? parseInt(formData.burst_download) || null : null,
        burst_upload: formData.burst_enabled ? parseInt(formData.burst_upload) || null : null,
        burst_threshold: formData.burst_enabled ? parseInt(formData.burst_threshold) || null : null,
        burst_time: formData.burst_enabled ? parseInt(formData.burst_time) || null : null,
        ip_pool: formData.ip_pool ? parseInt(formData.ip_pool) : null,
        fup_limit: formData.fup_enabled ? parseInt(formData.fup_limit) || null : null,
        fup_speed: formData.fup_enabled ? parseInt(formData.fup_speed) || null : null,
        is_active: formData.is_active,
        is_public: formData.is_public,
        is_popular: formData.is_popular,
        features: features,
      }

      await adminApi.updatePlan(planId, payload)
      toast.success("Plan updated successfully!")
      router.push(`/admin/plans/${planId}`)
    } catch (err: any) {
      console.error("Failed to update plan:", err)
      toast.error(err.message || "Failed to update plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/plans/${planId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Plan</h1>
          <p className="text-muted-foreground">Update plan details and configuration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Premium 50Mbps"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe the plan benefits..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_type">Connection Type</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={(value) => handleChange("plan_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                    <SelectItem value="PPPOE">PPPoE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange("is_active", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Popular</Label>
                  <Switch
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => handleChange("is_popular", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Validity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing &amp; Validity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Price (KSh)</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleChange("base_price", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Validity Type</Label>
                <Select
                  value={formData.validity_type}
                  onValueChange={(value) => handleChange("validity_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINUTES">Minutes</SelectItem>
                    <SelectItem value="HOURS">Hours</SelectItem>
                    <SelectItem value="DAYS">Days</SelectItem>
                    <SelectItem value="MONTHS">Months</SelectItem>
                    <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.validity_type === "MINUTES" && (
                <div className="space-y-2">
                  <Label htmlFor="validity_minutes">Duration (Minutes)</Label>
                  <Input
                    id="validity_minutes"
                    type="number"
                    value={formData.validity_minutes}
                    onChange={(e) => handleChange("validity_minutes", e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-xs text-slate-500">Common: 15, 30, 45, 60, 90, 120 minutes</p>
                </div>
              )}

              {formData.validity_type === "HOURS" && (
                <div className="space-y-2">
                  <Label htmlFor="validity_hours">Duration (Hours)</Label>
                  <Input
                    id="validity_hours"
                    type="number"
                    value={formData.validity_hours}
                    onChange={(e) => handleChange("validity_hours", e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-slate-500">Common: 1, 2, 3, 6, 12, 24 hours</p>
                </div>
              )}

              {formData.validity_type === "DAYS" && (
                <div className="space-y-2">
                  <Label htmlFor="duration_days">Duration (Days)</Label>
                  <Select
                    value={formData.duration_days}
                    onValueChange={(value) => handleChange("duration_days", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">7 Days (Weekly)</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days (Monthly)</SelectItem>
                      <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                      <SelectItem value="180">180 Days (Semi-Annual)</SelectItem>
                      <SelectItem value="365">365 Days (Annual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.validity_type === "MONTHS" && (
                <div className="space-y-2">
                  <Label htmlFor="validity_months">Duration (Months)</Label>
                  <Select
                    value={formData.validity_months}
                    onValueChange={(value) => handleChange("validity_months", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="2">2 Months</SelectItem>
                      <SelectItem value="3">3 Months (Quarterly)</SelectItem>
                      <SelectItem value="6">6 Months (Semi-Annual)</SelectItem>
                      <SelectItem value="12">12 Months (Annual)</SelectItem>
                      <SelectItem value="24">24 Months (2 Years)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {parseInt(formData.validity_months) > 0
                      ? `≈ ${parseInt(formData.validity_months) * 30} days`
                      : "Select duration"}
                  </p>
                </div>
              )}

              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generate Vouchers</Label>
                  <p className="text-sm text-slate-500">Create voucher codes for this plan</p>
                </div>
                <Switch
                  checked={formData.generateVouchers}
                  onCheckedChange={(checked) => handleChange("generateVouchers", checked)}
                />
              </div>
              {formData.generateVouchers && (
                <div className="space-y-2">
                  <Label htmlFor="voucherPrefix">Voucher Prefix</Label>
                  <Input
                    id="voucherPrefix"
                    value={formData.voucherPrefix}
                    onChange={(e) => handleChange("voucherPrefix", e.target.value)}
                    placeholder="e.g., PRE50"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Speed Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Speed Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Speed Unit</Label>
                <Select
                  value={formData.speed_unit}
                  onValueChange={(value) => handleChange("speed_unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MBPS">Mbps (Megabits)</SelectItem>
                    <SelectItem value="KBPS">Kbps (Kilobits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="download_speed">Download Speed</Label>
                  <Input
                    id="download_speed"
                    type="number"
                    value={formData.download_speed}
                    onChange={(e) => handleChange("download_speed", e.target.value)}
                    placeholder="50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload_speed">Upload Speed</Label>
                  <Input
                    id="upload_speed"
                    type="number"
                    value={formData.upload_speed}
                    onChange={(e) => handleChange("upload_speed", e.target.value)}
                    placeholder="25"
                    required
                  />
                </div>
              </div>

              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Unlimited Data</Label>
                  <p className="text-sm text-slate-500">No data cap for this plan</p>
                </div>
                <Switch
                  checked={formData.unlimitedData}
                  onCheckedChange={(checked) => handleChange("unlimitedData", checked)}
                />
              </div>
              {!formData.unlimitedData && (
                <div className="space-y-2">
                  <Label htmlFor="data_limit">Data Limit (GB)</Label>
                  <Input
                    id="data_limit"
                    type="number"
                    value={formData.data_limit}
                    onChange={(e) => handleChange("data_limit", e.target.value)}
                    placeholder="100"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* IP Pool Assignment — PPPoE only */}
          {formData.plan_type === "PPPOE" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  IP Pool Assignment
                </CardTitle>
                <CardDescription>
                  Assign or change the IP pool for this PPPoE plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Router</Label>
                  <Select
                    value={formData.router_id}
                    onValueChange={(value) => handleChange("router_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={routersLoading ? "Loading routers..." : "Select a router"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {routers.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.name} — {r.ip_address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Select a router to see its IP pools</p>
                </div>

                {formData.router_id && (
                  <div className="space-y-2">
                    <Label>IP Pool</Label>
                    <Select
                      value={formData.ip_pool}
                      onValueChange={(value) => handleChange("ip_pool", value)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={poolsLoading ? "Loading pools..." : "Select an IP pool"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {pools.map((pool) => (
                          <SelectItem key={pool.id} value={pool.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{pool.name}</span>
                              <span className="text-xs text-slate-500">
                                {pool.ip_range} • {pool.available_ips ?? "?"} available
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {!poolsLoading && pools.length === 0 && (
                          <div className="px-2 py-3 text-sm text-slate-500 text-center">
                            No active pools for this router
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Subscribers on this plan will receive IPs from the selected pool
                    </p>
                  </div>
                )}

                {!formData.router_id && (
                  <p className="text-sm text-slate-500 italic">
                    Select a router first to see available pools
                  </p>
                )}

                {formData.ip_pool && !formData.router_id && (
                  <p className="text-xs text-warning">
                    This plan has an existing IP pool assigned. Select a router above to change it.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Session & QoS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Session &amp; QoS Settings
              </CardTitle>
              <CardDescription>
                Configure concurrent sessions, priority, and MikroTik burst speeds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_sessions">Max Devices</Label>
                  <Input
                    id="max_sessions"
                    type="number"
                    value={formData.max_sessions}
                    onChange={(e) => handleChange("max_sessions", e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                  <p className="text-xs text-slate-500">Concurrent connections allowed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Idle Timeout (min)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={formData.session_timeout}
                    onChange={(e) => handleChange("session_timeout", e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-xs text-slate-500">Auto-disconnect on idle</p>
                </div>
              </div>

              <Separator />

              {/* MikroTik Queue Priority */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-slate-500" />
                  <Label>Queue Priority</Label>
                </div>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Highest (VoIP / Critical)</SelectItem>
                    <SelectItem value="2">2 — Very High</SelectItem>
                    <SelectItem value="3">3 — High (Business)</SelectItem>
                    <SelectItem value="4">4 — Above Normal</SelectItem>
                    <SelectItem value="5">5 — Normal (Residential)</SelectItem>
                    <SelectItem value="6">6 — Below Normal</SelectItem>
                    <SelectItem value="7">7 — Low</SelectItem>
                    <SelectItem value="8">8 — Lowest (Best Effort)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  MikroTik simple queue priority (1 = highest, 8 = lowest / best effort)
                </p>
              </div>

              <Separator />

              {/* Burst Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <Label>Burst Speed</Label>
                  </div>
                  <p className="text-sm text-slate-500">
                    Allow temporary speed boost on MikroTik routers
                  </p>
                </div>
                <Switch
                  checked={formData.burst_enabled}
                  onCheckedChange={(checked) => handleChange("burst_enabled", checked)}
                />
              </div>

              {formData.burst_enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="burst_download">
                        Burst Download ({formData.speed_unit === "MBPS" ? "Mbps" : "Kbps"})
                      </Label>
                      <Input
                        id="burst_download"
                        type="number"
                        value={formData.burst_download}
                        onChange={(e) => handleChange("burst_download", e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="burst_upload">
                        Burst Upload ({formData.speed_unit === "MBPS" ? "Mbps" : "Kbps"})
                      </Label>
                      <Input
                        id="burst_upload"
                        type="number"
                        value={formData.burst_upload}
                        onChange={(e) => handleChange("burst_upload", e.target.value)}
                        placeholder="50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="burst_threshold">Threshold (KB)</Label>
                      <Input
                        id="burst_threshold"
                        type="number"
                        value={formData.burst_threshold}
                        onChange={(e) => handleChange("burst_threshold", e.target.value)}
                        placeholder="2048"
                      />
                      <p className="text-xs text-slate-500">Burst stops after this many KB transferred</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="burst_time">Duration (sec)</Label>
                      <Input
                        id="burst_time"
                        type="number"
                        value={formData.burst_time}
                        onChange={(e) => handleChange("burst_time", e.target.value)}
                        placeholder="10"
                      />
                      <p className="text-xs text-slate-500">How long the burst window lasts</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fair Usage Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Fair Usage Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable FUP</Label>
                  <p className="text-sm text-slate-500">Throttle speed after threshold</p>
                </div>
                <Switch
                  checked={formData.fup_enabled}
                  onCheckedChange={(checked) => handleChange("fup_enabled", checked)}
                />
              </div>
              {formData.fup_enabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="fup_limit">FUP Threshold (GB)</Label>
                    <Input
                      id="fup_limit"
                      type="number"
                      value={formData.fup_limit}
                      onChange={(e) => handleChange("fup_limit", e.target.value)}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fup_speed">Throttled Speed (Mbps)</Label>
                    <Input
                      id="fup_speed"
                      type="number"
                      value={formData.fup_speed}
                      onChange={(e) => handleChange("fup_speed", e.target.value)}
                      placeholder="10"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Features displayed on the plan card</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="e.g., 24/7 Support"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                />
                <Button type="button" onClick={addFeature}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 py-1.5">
                    {feature}
                    <button type="button" onClick={() => removeFeature(index)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {features.length === 0 && (
                  <p className="text-sm text-slate-500">No features added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/plans/${planId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
