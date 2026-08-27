"use client"

import React, { useState, useEffect } from "react"
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
  Network,
  Gauge,
  Layers,
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
import { Router as RouterType, IPPool, SubnetPrefixOption, CIDROption, SubnetPrefixOptionsResponse } from "@/lib/types"

/**
 * Determines whether the 3rd octet field is relevant for the given CIDR.
 * /16 or larger → lock to 0, hide the field
 * /17-/23 → show with label "3rd Octet (partial)"
 * /24 and smaller → show normally, required
 */
function getOctetFieldConfig(cidrPrefix: string) {
  const cidr = parseInt(cidrPrefix)
  if (isNaN(cidr)) return { show: true, locked: false, label: '3rd Octet', hint: '0–255' }
  if (cidr <= 16) return { show: false, locked: true, value: '0', label: '3rd Octet', hint: 'Not needed for /16+' }
  if (cidr <= 23) return { show: true, locked: false, label: '3rd Octet (partial)', hint: `0–${Math.pow(2, 24 - cidr) - 1}` }
  return { show: true, locked: false, label: '3rd Octet', hint: '0–255' }
}

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
      color: 'bg-warning',
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
      color: 'bg-primary',
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
      color: 'bg-success',
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
      color: 'bg-warning',
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
      color: 'bg-primary',
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
      color: 'bg-primary',
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
      color: 'bg-success',
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
      color: 'bg-warning',
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
  
  // Router & IP Pool state for pool picker
  const [routers, setRouters] = useState<RouterType[]>([])
  const [routersLoading, setRoutersLoading] = useState(false)
  const [pools, setPools] = useState<IPPool[]>([])
  const [poolsLoading, setPoolsLoading] = useState(false)

  // Cloud-Led Subnet Builder state
  const [poolMode, setPoolMode] = useState<'existing' | 'new'>('new')
  const [subnetPrefixes, setSubnetPrefixes] = useState<SubnetPrefixOption[]>([])
  const [cidrOptions, setCidrOptions] = useState<CIDROption[]>([])
  const [blockedPrefixes, setBlockedPrefixes] = useState<string[]>([])
  const [defaultPrefix, setDefaultPrefix] = useState('10.50')
  const [subnetOptionsLoading, setSubnetOptionsLoading] = useState(false)

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
    // Cloud-Led Subnet Builder
    subnet_prefix: "10.50",
    subnet_octet: "",
    cidr_prefix: "24",
    pool_name: "",
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
    setSelectedPreset(null) // Clear preset selection on manual change
    
    // Cascade: when router changes, reset pool and load pools for that router
    if (field === 'router_id') {
      setFormData(prev => ({ ...prev, [field]: value, ip_pool: "" } as typeof prev))
      if (value && typeof value === 'string') {
        loadPoolsForRouter(value)
      } else {
        setPools([])
      }
    }
  }

  // Load routers for the IP Pool picker
  const loadRouters = async () => {
    if (routers.length > 0) return // Cache
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

  // Load IP pools for a specific router
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

  // Load subnet prefix options for Cloud-Led subnet builder
  const loadSubnetPrefixOptions = async () => {
    if (subnetPrefixes.length > 0) return // Cache
    setSubnetOptionsLoading(true)
    try {
      const res: SubnetPrefixOptionsResponse = await adminApi.getSubnetPrefixOptions()
      setSubnetPrefixes(res.prefixes || [])
      setCidrOptions(res.cidr_options || [])
      setBlockedPrefixes(res.blocked_prefixes || [])
      setDefaultPrefix(res.default_prefix || '10.50')
      // Set default in form
      setFormData(prev => ({ ...prev, subnet_prefix: res.default_prefix || '10.50' } as typeof prev))
    } catch (err) {
      console.error("Failed to load subnet prefix options:", err)
    } finally {
      setSubnetOptionsLoading(false)
    }
  }

  // FIXED: Compute subnet preview with large pool detection and locked octet support
  const subnetPreview = React.useMemo(() => {
    const { subnet_prefix, subnet_octet, cidr_prefix } = formData
    if (!subnet_prefix) return null
    const cidrNum = parseInt(cidr_prefix)
    if (isNaN(cidrNum)) return null

    const octetConfig = getOctetFieldConfig(cidr_prefix)
    const effectiveOctet = octetConfig.locked ? 0 : parseInt(subnet_octet)
    if (!octetConfig.locked && (isNaN(effectiveOctet) || effectiveOctet < 0 || effectiveOctet > 255)) return null

    const totalHosts = Math.pow(2, 32 - cidrNum) - 2 // minus network + broadcast
    const usableIPs = totalHosts - 1 // minus gateway
    const isLarge = usableIPs > 1000

    return {
      network: `${subnet_prefix}.${effectiveOctet}.0/${cidrNum}`,
      gateway: `${subnet_prefix}.${effectiveOctet}.1`,
      usableIPs,
      totalHosts,
      isLarge,
    }
  }, [formData.subnet_prefix, formData.subnet_octet, formData.cidr_prefix])

  // Load routers + subnet options on mount for PPPoE plan
  useEffect(() => {
    loadRouters()
    loadSubnetPrefixOptions()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

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
      let ipPoolId: number | null = formData.ip_pool ? parseInt(formData.ip_pool) : null

      // Cloud-Led: Create a new IP Pool from subnet builder first
      if (formData.plan_type === 'PPPOE' && poolMode === 'new' && formData.subnet_prefix) {
        const octetConfig = getOctetFieldConfig(formData.cidr_prefix)
        let subnetOctetValue: number
        
        if (octetConfig.locked) {
          subnetOctetValue = 0
        } else if (!formData.subnet_octet) {
          toast.error("3rd octet is required for this CIDR")
          setIsLoading(false)
          return
        } else {
          subnetOctetValue = parseInt(formData.subnet_octet)
        }
        
        const poolName = formData.pool_name.trim()
          || `Pool ${formData.subnet_prefix}.${subnetOctetValue}.0/${formData.cidr_prefix}`
        
        toast.info("Creating IP Pool from subnet builder...")
        const newPool = await adminApi.createIPPool({
          name: poolName,
          subnet_prefix: formData.subnet_prefix,
          subnet_octet: subnetOctetValue,
          cidr_prefix: parseInt(formData.cidr_prefix),
          router: formData.router_id ? parseInt(formData.router_id) as any : null,
          pool_type: 'PPPOE',
          is_active: true,
        })
        ipPoolId = newPool.id
        toast.success(`IP Pool "${poolName}" created with ${newPool.total_ips} IPs`)
      }

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
        ip_pool: ipPoolId,
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
          <h1 className="text-3xl font-bold text-foreground">Create Plan</h1>
          <p className="text-slate-600 mt-1">Set up a new internet service plan</p>
        </div>
      </div>

      {/* Quick Create Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
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
                  <div className="font-semibold text-foreground">{preset.name}</div>
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
                    <SelectItem value="MONTHS">Months</SelectItem>
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

              {formData.validity_type === 'MONTHS' && (
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
                      : 'Select duration'
                    }
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

          {/* IP Pool & Router Assignment — Cloud-Led Subnet Builder */}
          {formData.plan_type === 'PPPOE' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  IP Pool Assignment
                </CardTitle>
                <CardDescription>
                  Create a new IP pool from a subnet or pick an existing one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={poolMode === 'new' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPoolMode('new')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Subnet Pool
                  </Button>
                  <Button
                    type="button"
                    variant={poolMode === 'existing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPoolMode('existing')}
                  >
                    <Layers className="w-4 h-4 mr-1" />
                    Existing Pool
                  </Button>
                </div>

                <Separator />

                {/* Router selection (shared by both modes) */}
                <div className="space-y-2">
                  <Label>Router</Label>
                  <Select
                    value={formData.router_id}
                    onValueChange={(value) => handleChange("router_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={routersLoading ? "Loading routers..." : "Select a router"} />
                    </SelectTrigger>
                    <SelectContent>
                      {routers.map((router) => (
                        <SelectItem key={router.id} value={router.id.toString()}>
                          {router.name} — {router.ip_address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Router that will serve this plan</p>
                </div>

                {/* ─── NEW SUBNET POOL (Cloud-Led) ─── */}
                {poolMode === 'new' && (
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Globe className="w-4 h-4" />
                      Subnet Builder
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pool_name">Pool Name (optional)</Label>
                      <Input
                        id="pool_name"
                        value={formData.pool_name}
                        onChange={(e) => handleChange("pool_name", e.target.value)}
                        placeholder={`Pool ${formData.subnet_prefix}.${formData.subnet_octet || '0'}.0/${formData.cidr_prefix}`}
                      />
                      <p className="text-xs text-slate-500">Leave blank for auto-generated name</p>
                    </div>

                    {/* Dynamic 3rd Octet based on CIDR selection */}
                    {(() => {
                      const octetConfig = getOctetFieldConfig(formData.cidr_prefix)
                      return (
                        <div className={`grid gap-3 ${octetConfig.show ? 'grid-cols-3' : 'grid-cols-2'}`}>
                          {/* Subnet Prefix */}
                          <div className="space-y-2">
                            <Label>Prefix</Label>
                            <Select
                              value={formData.subnet_prefix}
                              onValueChange={(value) => {
                                handleChange("subnet_prefix", value)
                                if (octetConfig.locked) handleChange("subnet_octet", "0")
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={subnetOptionsLoading ? "Loading..." : "Select prefix"} />
                              </SelectTrigger>
                              <SelectContent>
                                {subnetPrefixes.map((prefix) => {
                                  const isBlocked = blockedPrefixes.includes(prefix.value)
                                  return (
                                    <SelectItem
                                      key={prefix.value}
                                      value={prefix.value}
                                      disabled={isBlocked}
                                      className={isBlocked ? "opacity-50 line-through" : ""}
                                    >
                                      {prefix.label}
                                      {isBlocked && " (blocked)"}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">First two octets</p>
                          </div>

                          {/* 3rd Octet — hidden for /16 and larger */}
                          {octetConfig.show && (
                            <div className="space-y-2">
                              <Label>{octetConfig.label}</Label>
                              <Input
                                type="number"
                                min={0}
                                max={255}
                                value={formData.subnet_octet}
                                onChange={(e) => handleChange("subnet_octet", e.target.value)}
                                placeholder={octetConfig.hint}
                              />
                              <p className="text-xs text-slate-500">{octetConfig.hint}</p>
                            </div>
                          )}

                          {/* CIDR Prefix */}
                          <div className="space-y-2">
                            <Label>CIDR</Label>
                            <Select
                              value={formData.cidr_prefix}
                              onValueChange={(value) => {
                                const newConfig = getOctetFieldConfig(value)
                                handleChange("cidr_prefix", value)
                                if (newConfig.locked) handleChange("subnet_octet", "0")
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select CIDR" />
                              </SelectTrigger>
                              <SelectContent>
                                {cidrOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value.toString()}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                                {cidrOptions.length === 0 && (
                                  <>
                                    <SelectItem value="16">/16 — 65,534 hosts</SelectItem>
                                    <SelectItem value="20">/20 — 4,094 hosts</SelectItem>
                                    <SelectItem value="22">/22 — 1,022 hosts</SelectItem>
                                    <SelectItem value="23">/23 — 510 hosts</SelectItem>
                                    <SelectItem value="24">/24 — 254 hosts</SelectItem>
                                    <SelectItem value="25">/25 — 126 hosts</SelectItem>
                                    <SelectItem value="26">/26 — 62 hosts</SelectItem>
                                    <SelectItem value="27">/27 — 30 hosts</SelectItem>
                                    <SelectItem value="28">/28 — 14 hosts</SelectItem>
                                    <SelectItem value="29">/29 — 6 hosts</SelectItem>
                                    <SelectItem value="30">/30 — 2 hosts</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            {!octetConfig.show && (
                              <p className="text-xs text-warning">
                                3rd octet not needed — entire /16 block used
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* 192.168 Warning */}
                    {formData.subnet_prefix.startsWith('192.168') && (
                      <div className="flex items-center gap-2 p-3 bg-warning/10 dark:bg-amber-950 border border-warning/20 dark:border-amber-800 rounded-md text-sm text-warning dark:text-amber-300">
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        <span>192.168.x.x is typically used for local LANs. Consider using 10.x.x.x or 172.x.x.x for subscriber pools.</span>
                      </div>
                    )}

                    {/* FIXED: Subnet Preview with large pool warning */}
                    {subnetPreview && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="text-xs text-slate-500">Network</p>
                          <p className="text-sm font-mono font-medium">{subnetPreview.network}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Gateway</p>
                          <p className="text-sm font-mono font-medium">{subnetPreview.gateway}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Usable IPs</p>
                          <p className="text-sm font-medium">{subnetPreview.usableIPs.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Hosts</p>
                          <p className="text-sm font-medium">{subnetPreview.totalHosts.toLocaleString()}</p>
                        </div>
                        {subnetPreview.isLarge && (
                          <div className="col-span-2 text-xs text-warning bg-warning/10 rounded p-2">
                            ⚠ Large pool — IP records generated in background after save.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── EXISTING POOL (Legacy) ─── */}
                {poolMode === 'existing' && formData.router_id && (
                  <div className="space-y-2">
                    <Label>IP Pool</Label>
                    <Select
                      value={formData.ip_pool}
                      onValueChange={(value) => handleChange("ip_pool", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={poolsLoading ? "Loading pools..." : "Select an IP pool"} />
                      </SelectTrigger>
                      <SelectContent>
                        {pools.map((pool) => (
                          <SelectItem key={pool.id} value={pool.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{pool.name}</span>
                              <span className="text-xs text-slate-500">
                                {pool.ip_range} • {pool.available_ips ?? '?'} available
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

                {poolMode === 'existing' && !formData.router_id && (
                  <p className="text-sm text-slate-500 italic">Select a router first to see available pools</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Session & QoS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Session & QoS Settings
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

              {/* Burst Settings with Enable Toggle */}
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
                      <Label htmlFor="burst_download">Burst Download ({formData.speed_unit === 'MBPS' ? 'Mbps' : 'Kbps'})</Label>
                      <Input
                        id="burst_download"
                        type="number"
                        value={formData.burst_download}
                        onChange={(e) => handleChange("burst_download", e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="burst_upload">Burst Upload ({formData.speed_unit === 'MBPS' ? 'Mbps' : 'Kbps'})</Label>
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