"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Wifi,
  Clock,
  Settings,
  Plus,
  X,
  RefreshCw,
  Zap,
  Timer,
  Users,
  Sparkles,
  Signal,
  Globe,
  Coffee,
  Gamepad2,
  Briefcase,
  Home,
  Building2,
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

// Industry-standard plan presets
interface PlanPreset {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  description: string
  config: {
    name: string
    plan_type: string
    base_price: number
    validity_type: string
    duration_days?: number
    validity_hours?: number
    validity_minutes?: number
    download_speed?: number
    upload_speed?: number
    max_sessions?: number
    features?: string[]
  }
}

const PLAN_PRESETS: { hotspot: PlanPreset[]; pppoe: PlanPreset[] } = {
  hotspot: [
    {
      id: 'hotspot-30min',
      name: '30 Minutes',
      icon: Coffee,
      color: 'bg-amber-500',
      description: 'Quick browse session',
      config: {
        name: '30 Min Access',
        plan_type: 'HOTSPOT',
        base_price: 20,
        validity_type: 'MINUTES',
        validity_minutes: 30,
        download_speed: 5,
        upload_speed: 5,
        max_sessions: 1,
        features: ['5 Mbps Speed', '30 Minutes', 'Single Device'],
      }
    },
    {
      id: 'hotspot-1hr',
      name: '1 Hour',
      icon: Timer,
      color: 'bg-blue-500',
      description: 'Standard session',
      config: {
        name: '1 Hour Access',
        plan_type: 'HOTSPOT',
        base_price: 30,
        validity_type: 'HOURS',
        validity_hours: 1,
        download_speed: 10,
        upload_speed: 5,
        max_sessions: 1,
        features: ['10 Mbps Speed', '1 Hour', 'Single Device'],
      }
    },
    {
      id: 'hotspot-3hr',
      name: '3 Hours',
      icon: Globe,
      color: 'bg-green-500',
      description: 'Extended session',
      config: {
        name: '3 Hour Access',
        plan_type: 'HOTSPOT',
        base_price: 70,
        validity_type: 'HOURS',
        validity_hours: 3,
        download_speed: 15,
        upload_speed: 10,
        max_sessions: 2,
        features: ['15 Mbps Speed', '3 Hours', '2 Devices'],
      }
    },
    {
      id: 'hotspot-daily',
      name: '24 Hours',
      icon: Clock,
      color: 'bg-purple-500',
      description: 'Full day access',
      config: {
        name: 'Daily Pass',
        plan_type: 'HOTSPOT',
        base_price: 150,
        validity_type: 'HOURS',
        validity_hours: 24,
        download_speed: 20,
        upload_speed: 10,
        max_sessions: 3,
        features: ['20 Mbps Speed', '24 Hours', '3 Devices'],
      }
    },
    {
      id: 'hotspot-weekly',
      name: '7 Days',
      icon: Zap,
      color: 'bg-orange-500',
      description: 'Weekly pass',
      config: {
        name: 'Weekly Pass',
        plan_type: 'HOTSPOT',
        base_price: 500,
        validity_type: 'DAYS',
        duration_days: 7,
        download_speed: 25,
        upload_speed: 15,
        max_sessions: 3,
        features: ['25 Mbps Speed', '7 Days', '3 Devices', 'Unlimited Data'],
      }
    },
    {
      id: 'hotspot-monthly',
      name: '30 Days',
      icon: Sparkles,
      color: 'bg-pink-500',
      description: 'Monthly unlimited',
      config: {
        name: 'Monthly Hotspot',
        plan_type: 'HOTSPOT',
        base_price: 1500,
        validity_type: 'DAYS',
        duration_days: 30,
        download_speed: 30,
        upload_speed: 20,
        max_sessions: 5,
        features: ['30 Mbps Speed', '30 Days', '5 Devices', 'Unlimited Data'],
      }
    },
  ],
  pppoe: [
    // --- Short Duration PPPoE (Hourly/Daily) ---
    {
      id: 'pppoe-1hr',
      name: '1 Hour',
      icon: Timer,
      color: 'bg-cyan-500',
      description: 'Quick PPPoE session',
      config: {
        name: 'PPPoE 1 Hour',
        plan_type: 'PPPOE',
        base_price: 50,
        validity_type: 'HOURS',
        validity_hours: 1,
        download_speed: 10,
        upload_speed: 5,
        max_sessions: 1,
        features: ['10 Mbps Download', '5 Mbps Upload', '1 Hour Access', 'Pay-As-You-Go'],
      }
    },
    {
      id: 'pppoe-6hr',
      name: '6 Hours',
      icon: Clock,
      color: 'bg-teal-500',
      description: 'Half-day PPPoE access',
      config: {
        name: 'PPPoE 6 Hours',
        plan_type: 'PPPOE',
        base_price: 150,
        validity_type: 'HOURS',
        validity_hours: 6,
        download_speed: 10,
        upload_speed: 5,
        max_sessions: 1,
        features: ['10 Mbps Download', '5 Mbps Upload', '6 Hours Access', 'Budget Friendly'],
      }
    },
    {
      id: 'pppoe-daily',
      name: '24 Hours',
      icon: Coffee,
      color: 'bg-indigo-500',
      description: 'Full day PPPoE access',
      config: {
        name: 'PPPoE Daily',
        plan_type: 'PPPOE',
        base_price: 200,
        validity_type: 'DAYS',
        duration_days: 1,
        download_speed: 10,
        upload_speed: 5,
        max_sessions: 1,
        features: ['10 Mbps Download', '5 Mbps Upload', '1 Day Access', 'Affordable Daily Rate'],
      }
    },
    {
      id: 'pppoe-3day',
      name: '3 Days',
      icon: Zap,
      color: 'bg-violet-500',
      description: '3-day PPPoE bundle',
      config: {
        name: 'PPPoE 3 Days',
        plan_type: 'PPPOE',
        base_price: 500,
        validity_type: 'DAYS',
        duration_days: 3,
        download_speed: 10,
        upload_speed: 5,
        max_sessions: 1,
        features: ['10 Mbps Download', '5 Mbps Upload', '3 Days Access', 'Value Bundle'],
      }
    },
    {
      id: 'pppoe-weekly',
      name: '7 Days',
      icon: Globe,
      color: 'bg-sky-500',
      description: 'Weekly PPPoE plan',
      config: {
        name: 'PPPoE Weekly',
        plan_type: 'PPPOE',
        base_price: 800,
        validity_type: 'DAYS',
        duration_days: 7,
        download_speed: 10,
        upload_speed: 5,
        max_sessions: 1,
        features: ['10 Mbps Download', '5 Mbps Upload', '7 Days Access', 'Best Weekly Value'],
      }
    },
    // --- Monthly PPPoE (Home & Business) ---
    {
      id: 'pppoe-basic',
      name: 'Basic Home',
      icon: Home,
      color: 'bg-slate-500',
      description: 'Light browsing & email',
      config: {
        name: 'Basic Home',
        plan_type: 'PPPOE',
        base_price: 1500,
        validity_type: 'DAYS',
        duration_days: 30,
        download_speed: 5,
        upload_speed: 2,
        max_sessions: 1,
        features: ['5 Mbps Download', '2 Mbps Upload', 'Unlimited Data', 'Email & Browsing'],
      }
    },
    {
      id: 'pppoe-standard',
      name: 'Standard Home',
      icon: Wifi,
      color: 'bg-blue-500',
      description: 'Streaming & social media',
      config: {
        name: 'Standard Home',
        plan_type: 'PPPOE',
        base_price: 2500,
        validity_type: 'DAYS',
        duration_days: 30,
        download_speed: 15,
        upload_speed: 5,
        max_sessions: 1,
        features: ['15 Mbps Download', '5 Mbps Upload', 'Unlimited Data', 'HD Streaming', '24/7 Support'],
      }
    },
    {
      id: 'pppoe-premium',
      name: 'Premium Home',
      icon: Signal,
      color: 'bg-green-500',
      description: '4K streaming & gaming',
      config: {
        name: 'Premium Home',
        plan_type: 'PPPOE',
        base_price: 4000,
        validity_type: 'DAYS',
        duration_days: 30,
        download_speed: 30,
        upload_speed: 15,
        max_sessions: 1,
        features: ['30 Mbps Download', '15 Mbps Upload', 'Unlimited Data', '4K Streaming', 'Online Gaming', 'Priority Support'],
      }
    },
    {
      id: 'pppoe-gamer',
      name: 'Gamer Pro',
      icon: Gamepad2,
      color: 'bg-purple-500',
      description: 'Low latency gaming',
      config: {
        name: 'Gamer Pro',
        plan_type: 'PPPOE',
        base_price: 5500,
        validity_type: 'DAYS',
        duration_days: 30,
        download_speed: 50,
        upload_speed: 25,
        max_sessions: 1,
        features: ['50 Mbps Download', '25 Mbps Upload', 'Low Latency', 'Gaming Optimized', 'Priority Traffic', '24/7 Support'],
      }
    },
    {
      id: 'pppoe-soho',
      name: 'Small Office',
      icon: Briefcase,
      color: 'bg-amber-500',
      description: 'Small business needs',
      config: {
        name: 'SOHO Business',
        plan_type: 'PPPOE',
        base_price: 7500,
        validity_type: 'DAYS',
        duration_days: 30,
        download_speed: 50,
        upload_speed: 50,
        max_sessions: 10,
        features: ['50 Mbps Symmetric', '10 Users', 'Static IP Available', 'SLA 99.5%', 'Business Support'],
      }
    },
    {
      id: 'pppoe-enterprise',
      name: 'Enterprise',
      icon: Building2,
      color: 'bg-rose-500',
      description: 'Corporate solution',
      config: {
        name: 'Enterprise',
        plan_type: 'PPPOE',
        base_price: 15000,
        validity_type: 'DAYS',
        duration_days: 30,
        download_speed: 100,
        upload_speed: 100,
        max_sessions: 50,
        features: ['100 Mbps Symmetric', '50 Users', 'Static IP Included', 'SLA 99.9%', 'Dedicated Support', 'Priority Routing'],
      }
    },
  ],
}

export default function CreatePlanPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

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
    // Sessions
    max_sessions: "1",
    session_timeout: "",
    // Burst
    burst_download: "",
    burst_upload: "",
    burst_threshold: "",
    burst_time: "",
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
    setFormData(prev => ({ ...prev, [field]: value }))
    setSelectedPreset(null) // Clear preset selection on manual change
  }

  const applyPreset = (preset: PlanPreset) => {
    setSelectedPreset(preset.id)
    setFormData(prev => ({
      ...prev,
      name: preset.config.name,
      plan_type: preset.config.plan_type,
      base_price: preset.config.base_price.toString(),
      validity_type: preset.config.validity_type,
      duration_days: preset.config.duration_days?.toString() || "30",
      validity_hours: preset.config.validity_hours?.toString() || "",
      validity_minutes: preset.config.validity_minutes?.toString() || "",
      download_speed: preset.config.download_speed?.toString() || "",
      upload_speed: preset.config.upload_speed?.toString() || "",
      max_sessions: preset.config.max_sessions?.toString() || "1",
    }))
    setFeatures(preset.config.features || [])
    toast.success(`Applied "${preset.name}" preset`)
  }

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
    setIsLoading(true)
    
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
        max_sessions: parseInt(formData.max_sessions) || 1,
        session_timeout: parseInt(formData.session_timeout) || null,
        burst_download: parseInt(formData.burst_download) || null,
        burst_upload: parseInt(formData.burst_upload) || null,
        burst_threshold: parseInt(formData.burst_threshold) || null,
        burst_time: parseInt(formData.burst_time) || null,
        fup_limit: formData.fup_enabled ? parseInt(formData.fup_limit) || null : null,
        fup_speed: formData.fup_enabled ? parseInt(formData.fup_speed) || null : null,
        is_active: formData.is_active,
        is_public: formData.is_public,
        is_popular: formData.is_popular,
        features: features,
      }
      
      await adminApi.createPlan(payload)
      toast.success("Plan created successfully!")
      router.push("/admin/plans")
    } catch (err: any) {
      console.error("Failed to create plan:", err)
      toast.error(err.message || "Failed to create plan")
    } finally {
      setIsLoading(false)
    }
  }

  const currentPresets = formData.plan_type === 'HOTSPOT' ? PLAN_PRESETS.hotspot : PLAN_PRESETS.pppoe

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Create Plan</h1>
          <p className="text-slate-600 mt-1">Set up a new internet service plan</p>
        </div>
      </div>

      {/* Quick Create Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Create
          </CardTitle>
          <CardDescription>
            Choose a preset to get started quickly with industry-standard configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Plan Type Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={formData.plan_type === 'HOTSPOT' ? 'default' : 'outline'}
              onClick={() => handleChange('plan_type', 'HOTSPOT')}
              className="flex-1"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Hotspot Plans
            </Button>
            <Button
              type="button"
              variant={formData.plan_type === 'PPPOE' ? 'default' : 'outline'}
              onClick={() => handleChange('plan_type', 'PPPOE')}
              className="flex-1"
            >
              <Signal className="w-4 h-4 mr-2" />
              PPPoE Plans
            </Button>
          </div>
          
          {/* Preset Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {currentPresets.map((preset) => {
              const Icon = preset.icon
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`
                    relative p-4 rounded-lg border-2 text-left transition-all hover:scale-105
                    ${selectedPreset === preset.id 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg ${preset.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-semibold text-slate-900">{preset.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{preset.description}</div>
                  <div className="text-sm font-bold text-primary mt-2">
                    KSh {preset.config.base_price.toLocaleString()}
                  </div>
                  {selectedPreset === preset.id && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-xs">Selected</Badge>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
                    <SelectItem value="STATIC">Static IP</SelectItem>
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
                Pricing & Validity
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
                    <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.validity_type === 'MINUTES' && (
                <div className="space-y-2">
                  <Label htmlFor="validity_minutes">Duration (Minutes)</Label>
                  <Input
                    id="validity_minutes"
                    type="number"
                    value={formData.validity_minutes}
                    onChange={(e) => handleChange("validity_minutes", e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-xs text-slate-500">
                    Common: 15, 30, 45, 60, 90, 120 minutes
                  </p>
                </div>
              )}

              {formData.validity_type === 'HOURS' && (
                <div className="space-y-2">
                  <Label htmlFor="validity_hours">Duration (Hours)</Label>
                  <Input
                    id="validity_hours"
                    type="number"
                    value={formData.validity_hours}
                    onChange={(e) => handleChange("validity_hours", e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-slate-500">
                    Common: 1, 2, 3, 6, 12, 24 hours
                  </p>
                </div>
              )}

              {formData.validity_type === 'DAYS' && (
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

          {/* Session & Burst Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Session & Burst Settings
              </CardTitle>
              <CardDescription>
                Configure concurrent sessions and MikroTik burst speeds
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
              <p className="text-sm font-medium text-slate-700">Burst Speed (Optional)</p>
              <p className="text-xs text-slate-500">
                Allow temporary speed boost for MikroTik routers
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="burst_download">Burst Download</Label>
                  <Input
                    id="burst_download"
                    type="number"
                    value={formData.burst_download}
                    onChange={(e) => handleChange("burst_download", e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="burst_upload">Burst Upload</Label>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FUP Settings */}
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

          {/* Features */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Add features to highlight in the plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="e.g., 24/7 Support"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
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
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Plan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
