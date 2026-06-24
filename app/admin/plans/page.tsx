"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Package,
  Plus,
  Edit,
  Check,
  Zap,
  Loader2,
  Wifi,
  Globe,
  Server,
  Search,
  MoreVertical,
  RefreshCw,
  Users,
  TrendingUp,
  Pause,
  Play,
  Eye,
  CreditCard,
  Timer,
  Clock,
  Calendar,
  Network,
  AlertTriangle,
  Coffee,
  Gamepad2,
  Briefcase,
  Home,
  Building2,
  Signal,
  Sparkles,
  Shield,
  Trash2,
  Gauge,
  Info,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
import { adminApi } from "@/lib/admin-api"
import type { Plan, PlanType, PlanDashboardStats, SubnetPrefixOption, CIDROption, SubnetPrefixOptionsResponse, Router } from "@/lib/types"

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num || 0)
}

const getPlanSubscriberCount = (plan?: Plan | null) => {
  const raw: unknown =
    plan?.active_subscriptions_count ??
    plan?.subscriptions_count ??
    plan?.subscriber_count ??
    plan?.subscribers_count ??
    0
  const count = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw)
  return Number.isFinite(count) ? count : 0
}

const getTypeBadge = (type: PlanType) => {
  const config: Record<string, { icon: typeof Wifi; class: string; label: string }> = {
    INTERNET: { icon: Globe, class: "bg-success/15 text-success border-success/20", label: "Internet" },
    ADDON: { icon: Package, class: "bg-warning/15 text-warning border-warning/20", label: "Add-on" },
    BUNDLE: { icon: Package, class: "bg-primary/15 text-primary border-primary/20", label: "Bundle" },
    TOPUP: { icon: CreditCard, class: "bg-pink-100 text-pink-700 border-pink-200", label: "Top-up" },
    HOTSPOT: { icon: Wifi, class: "bg-primary/15 text-primary border-primary/20", label: "Hotspot" },
    PPPOE: { icon: Globe, class: "bg-purple-100 text-purple-700 border-purple-200", label: "PPPoE" },
    STATIC: { icon: Server, class: "bg-warning/15 text-warning border-warning/20", label: "Static IP" },
  }
  const c = config[type] || { icon: Globe, class: "bg-gray-100 text-gray-700 border-gray-200", label: type }
  const Icon = c.icon
  return (
    <Badge variant="outline" className={c.class}>
      <Icon className="w-3 h-3 mr-1" />
      {c.label}
    </Badge>
  )
}

const formatDuration = (plan: Plan) => {
  // Use backend-computed validity_display if available
  if (plan.validity_display) return plan.validity_display
  // Fallback: compute from validity fields
  const vt = plan.validity_type || 'DAYS'
  if (vt === 'UNLIMITED') return 'Unlimited'
  if (vt === 'MINUTES' && plan.validity_minutes) {
    if (plan.validity_minutes < 60) return `${plan.validity_minutes} min`
    const h = Math.floor(plan.validity_minutes / 60)
    const m = plan.validity_minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`
  }
  if (vt === 'HOURS' && plan.validity_hours) {
    if (plan.validity_hours < 24) return `${plan.validity_hours} hour${plan.validity_hours > 1 ? 's' : ''}`
    const d = Math.floor(plan.validity_hours / 24)
    const h = plan.validity_hours % 24
    return h > 0 ? `${d}d ${h}h` : `${d} day${d > 1 ? 's' : ''}`
  }
  // DAYS fallback
  const days = plan.duration_days ?? plan.validity_days ?? 30
  if (days === 1) return "Daily"
  if (days === 7) return "Weekly"
  if (days === 30) return "Monthly"
  if (days === 90) return "Quarterly"
  if (days === 365) return "Yearly"
  return `${days} Days`
}

const getValidityIcon = (plan: Plan) => {
  const vt = plan.validity_type || 'DAYS'
  if (vt === 'MINUTES') return Timer
  if (vt === 'HOURS') return Clock
  if (vt === 'UNLIMITED') return Zap
  return Calendar
}

// Hotspot quick-create presets (industry-standard Kenyan ISP packages)
interface HotspotPreset {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  description: string
  config: {
    name: string
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

const HOTSPOT_PRESETS: HotspotPreset[] = [
  {
    id: 'hotspot-30min', name: '30 Minutes', icon: Coffee, color: 'bg-warning',
    description: 'Quick browse session',
    config: { name: '30 Min Access', base_price: 20, validity_type: 'MINUTES', validity_minutes: 30, download_speed: 5, upload_speed: 5, max_sessions: 1, features: ['5 Mbps Speed', '30 Minutes', 'Single Device'] }
  },
  {
    id: 'hotspot-1hr', name: '1 Hour', icon: Timer, color: 'bg-primary',
    description: 'Standard session',
    config: { name: '1 Hour Access', base_price: 30, validity_type: 'HOURS', validity_hours: 1, download_speed: 10, upload_speed: 5, max_sessions: 1, features: ['10 Mbps Speed', '1 Hour', 'Single Device'] }
  },
  {
    id: 'hotspot-3hr', name: '3 Hours', icon: Globe, color: 'bg-success',
    description: 'Extended session',
    config: { name: '3 Hour Access', base_price: 70, validity_type: 'HOURS', validity_hours: 3, download_speed: 15, upload_speed: 10, max_sessions: 2, features: ['15 Mbps Speed', '3 Hours', '2 Devices'] }
  },
  {
    id: 'hotspot-daily', name: '24 Hours', icon: Clock, color: 'bg-purple-500',
    description: 'Full day access',
    config: { name: 'Daily Pass', base_price: 150, validity_type: 'HOURS', validity_hours: 24, download_speed: 20, upload_speed: 10, max_sessions: 3, features: ['20 Mbps Speed', '24 Hours', '3 Devices'] }
  },
  {
    id: 'hotspot-weekly', name: '7 Days', icon: Zap, color: 'bg-warning',
    description: 'Weekly pass',
    config: { name: 'Weekly Pass', base_price: 500, validity_type: 'DAYS', duration_days: 7, download_speed: 25, upload_speed: 15, max_sessions: 3, features: ['25 Mbps Speed', '7 Days', '3 Devices', 'Unlimited Data'] }
  },
  {
    id: 'hotspot-monthly', name: '30 Days', icon: Sparkles, color: 'bg-pink-500',
    description: 'Monthly unlimited',
    config: { name: 'Monthly Hotspot', base_price: 1500, validity_type: 'DAYS', duration_days: 30, download_speed: 30, upload_speed: 20, max_sessions: 5, features: ['30 Mbps Speed', '30 Days', '5 Devices', 'Unlimited Data'] }
  },
]

// Reusable PlanCard component
function PlanCard({ plan, onView, onEdit, onToggle, onDelete, togglingId, deletingId }: {
  plan: Plan
  onView: (p: Plan) => void
  onEdit: (p: Plan) => void
  onToggle: (p: Plan) => void
  onDelete: (p: Plan) => void
  togglingId: number | null
  deletingId: number | null
}) {
  return (
    <Card className={`relative ${plan.is_popular ? "ring-2 ring-ring" : ""}`}>
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white">
            <Zap className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              {getTypeBadge(plan.plan_type)}
              <Badge variant={plan.is_active ? "default" : "secondary"}>
                {plan.is_active ? "Active" : "Inactive"}
              </Badge>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(plan)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onToggle(plan)}
                disabled={togglingId === plan.id}
              >
                {togglingId === plan.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : plan.is_active ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {plan.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(plan)}
                disabled={deletingId === plan.id}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                {deletingId === plan.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-muted rounded-lg">
          <p className="text-3xl font-bold">
            {formatCurrency(plan.price ?? plan.base_price)}
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            {(() => {
              const Icon = getValidityIcon(plan)
              return <Icon className="w-3.5 h-3.5" />
            })()}
            {formatDuration(plan)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {plan.download_speed && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span>{plan.download_speed} {plan.speed_unit || 'Mbps'} ↓</span>
            </div>
          )}
          {plan.upload_speed && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary rotate-180" />
              <span>{plan.upload_speed} {plan.speed_unit || 'Mbps'} ↑</span>
            </div>
          )}
        </div>

        {/* Data limit badge */}
        {(plan as any).limitation_type === 'DATA' && (plan as any).data_limit_value && (
          <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-2 py-1 rounded">
            <Database className="w-3.5 h-3.5" />
            <span>
              {(plan as any).data_limit_value} {(plan as any).data_limit_unit || 'MB'} cap
            </span>
          </div>
        )}

        {plan.features && plan.features.length > 0 && (
          <div className="space-y-2">
            {plan.features.slice(0, 3).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                <span>{feature}</span>
              </div>
            ))}
            {plan.features.length > 3 && (
              <p className="text-xs text-muted-foreground pl-6">
                +{plan.features.length - 3} more features
              </p>
            )}
          </div>
        )}

        {plan.ip_pool_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 p-2 rounded">
            <Network className="w-3.5 h-3.5" />
            Pool: {plan.ip_pool_name} {plan.ip_pool_range && `· ${plan.ip_pool_range}`}
          </div>
        )}

        {plan.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex w-full justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {getPlanSubscriberCount(plan)} subscribers
          </span>
          {plan.data_limit && (
            <span>{plan.data_limit} GB limit</span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default function PlansPage() {
  // Refs to prevent duplicate fetches
  const hasFetchedRef = useRef(false)

  // Data states
  const [plans, setPlans] = useState<Plan[]>([])
  const [hotspotPlans, setHotspotPlans] = useState<Plan[]>([])
  const [hotspotTotalCount, setHotspotTotalCount] = useState(0) // NEW: independent hotspot count for fallback
  const [dashboardStats, setDashboardStats] = useState<PlanDashboardStats | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  
  // Hotspot quick-create state
  const [isHotspotCreateOpen, setIsHotspotCreateOpen] = useState(false)
  const [hotspotCreating, setHotspotCreating] = useState(false)
  const [isEditingHotspot, setIsEditingHotspot] = useState(false)
  const [editingHotspotPlan, setEditingHotspotPlan] = useState<Plan | null>(null)
  const [hotspotForm, setHotspotForm] = useState({
    name: '', price: '', download_speed: '', upload_speed: '',
    validity_type: 'HOURS' as string, duration_days: '1', validity_hours: '1', validity_minutes: '30',
    max_sessions: '1', description: '', features: '',
    is_active: true, is_popular: false,
    // NEW: Data limit fields
    limitation_type: 'UNLIMITED' as 'UNLIMITED' | 'DATA',
    data_limit_value: '',
    data_limit_unit: 'MB' as 'MB' | 'GB',
  })

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)

  // Router state for hotspot plans - updated to accept 'all'
  const [routers, setRouters] = useState<Router[]>([])
  const [selectedRouterId, setSelectedRouterId] = useState<number | 'all' | null>(null)
  const [routersLoading, setRoutersLoading] = useState(false)

  // Filter states
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // UI states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPlanTypePickerOpen, setIsPlanTypePickerOpen] = useState(false)

  // Form state - Enhanced with all fields
  // 🟢 FIXED: Updated speed_unit type to include GBPS
  const [planForm, setPlanForm] = useState({
    name: '',
    plan_type: 'PPPOE' as PlanType,
    description: '',
    // Speed settings
    download_speed: '',
    upload_speed: '',
    speed_unit: 'MBPS' as 'MBPS' | 'KBPS' | 'GBPS',
    // Data limit
    data_limit: '',
    unlimited_data: true,
    // Validity - flexible time-based
    validity_type: 'MONTHS' as 'DAYS' | 'HOURS' | 'MINUTES' | 'MONTHS' | 'UNLIMITED',
    duration_days: '30',
    validity_hours: '',
    validity_minutes: '',
    // Session/Connection limits
    max_sessions: '1',
    session_timeout: '',
    // Burst Speed
    burst_download: '',
    burst_upload: '',
    burst_threshold: '',
    burst_time: '',
    // FUP
    fup_enabled: false,
    fup_limit: '',
    fup_speed: '',
    // Pricing
    price: '',
    setup_fee: '',
    // Subnet Builder (Cloud-Led)
    subnet_prefix: '172.16',
    subnet_octet: '',
    cidr_prefix: '24',
    // MikroTik QoS
    priority: '8',
    burst_enabled: false,
    // Validity months
    validity_months: '1',
    // Status
    is_active: true,
    is_popular: false,
    is_public: true,
    features: '',
  })

  // Cloud-Led Subnet Builder state
  const [subnetPrefixes, setSubnetPrefixes] = useState<SubnetPrefixOption[]>([])
  const [cidrOptions, setCidrOptions] = useState<CIDROption[]>([])
  const [blockedPrefixes, setBlockedPrefixes] = useState<string[]>([])
  const [subnetOptionsLoading, setSubnetOptionsLoading] = useState(false)

  // NEW: Fetch hotspot stats count independently (for fallback when dashboardStats is null)
  const fetchHotspotStatsCount = useCallback(async () => {
    if (routers.length === 0) return
    try {
      let count = 0
      for (const r of routers) {
        const hPlans = await adminApi.getHotspotPlans(r.id)
        count += hPlans.length
      }
      setHotspotTotalCount(count)
    } catch (error) {
      console.error('Failed to fetch hotspot stats count:', error)
    }
  }, [routers])

  // Load subnet prefix options for Cloud-Led subnet builder
  const loadSubnetPrefixOptions = useCallback(async () => {
    if (subnetPrefixes.length > 0) return
    setSubnetOptionsLoading(true)
    try {
      const res: SubnetPrefixOptionsResponse = await adminApi.getSubnetPrefixOptions()
      setSubnetPrefixes(res.prefixes || [])
      setCidrOptions(res.cidr_options || [])
      setBlockedPrefixes(res.blocked_prefixes || [])
      if (res.default_prefix) {
        setPlanForm(prev => ({ ...prev, subnet_prefix: res.default_prefix }))
      }
    } catch (err) {
      console.error('Failed to load subnet prefix options:', err)
    } finally {
      setSubnetOptionsLoading(false)
    }
  }, [subnetPrefixes.length])

  // Compute subnet preview from current form values
  const subnetPreview = useMemo(() => {
    const { subnet_prefix, subnet_octet, cidr_prefix } = planForm
    if (!subnet_prefix || !subnet_octet) return null
    const octet = parseInt(subnet_octet)
    if (isNaN(octet) || octet < 0 || octet > 255) return null
    const gateway = `${subnet_prefix}.${octet}.1`
    const cidrNum = parseInt(cidr_prefix)
    const usableIPs = Math.pow(2, 32 - cidrNum) - 3 // minus network, broadcast, gateway
    return { gateway, cidr: cidrNum, usableIPs }
  }, [planForm.subnet_prefix, planForm.subnet_octet, planForm.cidr_prefix])

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const stats = await adminApi.getPlanDashboardStats()
      setDashboardStats(stats)
    } catch (error) {
      console.log('Dashboard stats endpoint not available, using calculated stats')
    }
  }, [])

  // Fetch routers for hotspot plan creation
  const fetchRouters = useCallback(async () => {
    if (routers.length > 0) return
    setRoutersLoading(true)
    try {
      const res = await adminApi.getRouters({ is_active: 'true' })
      setRouters(res.results || [])
    } finally {
      setRoutersLoading(false)
    }
  }, [routers.length])

  // NEW: Fetch hotspot plans from all routers - UPDATED with subscriber_count
  const fetchAllHotspotPlans = useCallback(async () => {
    try {
      const allPlans: Plan[] = []
      for (const r of routers) {
        const hPlans = await adminApi.getHotspotPlans(r.id)
        const mapped: Plan[] = hPlans.map((hp: any) => ({
          id: hp.id,
          name: hp.name,
          code: '',
          plan_type: 'HOTSPOT' as PlanType,
          description: hp.description || '',
          base_price: hp.price,
          price: hp.price,
          download_speed: hp.download_speed,
          upload_speed: hp.upload_speed,
          speed_unit: hp.speed_unit || 'MBPS',
          validity_type: hp.validity_type || 'HOURS',
          validity_hours: hp.validity_type === 'HOURS' ? hp.validity_value : undefined,
          validity_minutes: hp.validity_type === 'MINUTES' ? hp.validity_value : undefined,
          duration_days: hp.validity_type === 'DAYS' ? hp.validity_value : undefined,
          validity_display: hp.duration_display,
          max_sessions: hp.simultaneous_devices,
          is_active: hp.is_active,
          is_public: true,
          is_popular: hp.is_popular,
          features: [],
          subscriber_count: hp.subscriber_count || 0,
          created_at: hp.created_at,
          updated_at: hp.updated_at,
          _isHotspotPlan: true,
          _hotspotPlanId: hp.id,
          _routerId: r.id,
          _routerName: r.name,
          limitation_type: hp.limitation_type || 'UNLIMITED',
          data_limit_value: hp.data_limit_value,
          data_limit_unit: hp.data_limit_unit || 'MB',
        })) as any[]
        allPlans.push(...mapped)
      }
      setHotspotPlans(allPlans)
    } catch (error) {
      console.error('Failed to fetch all hotspot plans:', error)
      setHotspotPlans([])
    }
  }, [routers])

  // Fetch HotspotPlan records for a specific router - UPDATED with subscriber_count
  const fetchHotspotPlans = useCallback(async (routerId: number) => {
    try {
      const hPlans = await adminApi.getHotspotPlans(routerId)
      // Map HotspotPlan to Plan-compatible shape for consistent rendering
      const mapped: Plan[] = hPlans.map((hp: any) => ({
        id: hp.id,
        name: hp.name,
        code: '',
        plan_type: 'HOTSPOT' as PlanType,
        description: hp.description || '',
        base_price: hp.price,
        price: hp.price,
        download_speed: hp.download_speed,
        upload_speed: hp.upload_speed,
        speed_unit: hp.speed_unit || 'MBPS',
        validity_type: hp.validity_type || 'HOURS',
        validity_hours: hp.validity_type === 'HOURS' ? hp.validity_value : undefined,
        validity_minutes: hp.validity_type === 'MINUTES' ? hp.validity_value : undefined,
        duration_days: hp.validity_type === 'DAYS' ? hp.validity_value : undefined,
        validity_display: hp.duration_display,
        max_sessions: hp.simultaneous_devices,
        is_active: hp.is_active,
        is_public: true,
        is_popular: hp.is_popular,
        features: [],
        subscriber_count: hp.subscriber_count || 0,
        created_at: hp.created_at,
        updated_at: hp.updated_at,
        _isHotspotPlan: true,
        _hotspotPlanId: hp.id,
        _routerId: routerId,
        limitation_type: hp.limitation_type || 'UNLIMITED',
        data_limit_value: hp.data_limit_value,
        data_limit_unit: hp.data_limit_unit || 'MB',
      })) as any[]
      setHotspotPlans(mapped)
    } catch (error) {
      console.error('Failed to fetch hotspot plans:', error)
      setHotspotPlans([])
    }
  }, [])

  // Fetch hotspot plans when router changes - updated for 'all'
  useEffect(() => {
    if (activeTab === 'hotspot') {
      if (selectedRouterId === 'all' && routers.length > 0) {
        fetchAllHotspotPlans()
      } else if (selectedRouterId && selectedRouterId !== 'all') {
        fetchHotspotPlans(selectedRouterId as number)
      }
    }
  }, [activeTab, selectedRouterId, fetchHotspotPlans, fetchAllHotspotPlans, routers.length])

  // NEW: Fetch hotspot stats count after routers load
  useEffect(() => {
    if (routers.length > 0) {
      fetchHotspotStatsCount()
    }
  }, [routers, fetchHotspotStatsCount])

  // Fetch data
  const fetchPlans = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-created_at' }
      if (activeTab !== 'all') {
        params.plan_type = activeTab.toUpperCase()
      }

      const response = await adminApi.getPlans(params)
      setPlans(response.results || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load plans')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchPlans()
      fetchDashboardStats()
      loadSubnetPrefixOptions()
      fetchRouters()
    }
  }, [fetchPlans, fetchDashboardStats, loadSubnetPrefixOptions, fetchRouters])

  // Re-fetch when tab changes
  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchPlans()
    }
  }, [activeTab, fetchPlans])

  // Refresh - updated for 'all'
  const handleRefresh = async () => {
    setIsRefreshing(true)
    const refreshTasks = [fetchPlans(), fetchDashboardStats(), fetchHotspotStatsCount()]
    if (activeTab === 'hotspot') {
      if (selectedRouterId === 'all') {
        refreshTasks.push(fetchAllHotspotPlans())
      } else if (selectedRouterId) {
        refreshTasks.push(fetchHotspotPlans(selectedRouterId as number))
      }
    }
    await Promise.all(refreshTasks)
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Filter plans by search — use hotspotPlans on hotspot tab with router selected
  const filteredPlans = useMemo(() => {
    const source = (activeTab === 'hotspot' && selectedRouterId) ? hotspotPlans : plans
    return source.filter(plan => 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [plans, hotspotPlans, activeTab, selectedRouterId, searchQuery])

  // Stats - use dashboard stats if available, otherwise calculate from loaded data
  // Use hotspotTotalCount which is loaded independently on mount
  const stats = useMemo(() => {
    if (dashboardStats) {
      return {
        total: dashboardStats.total_plans,
        active: dashboardStats.active_plans,
        hotspot: dashboardStats.hotspot_plans,
        pppoe: dashboardStats.pppoe_plans,
        static: dashboardStats.static_plans,
        subscribers: dashboardStats.total_subscribers,
      }
    }
    // Fallback: use hotspotTotalCount which is loaded independently on mount
    return {
      total: plans.length + hotspotTotalCount,
      active: plans.filter(p => p.is_active).length,
      hotspot: plans.filter(p => p.plan_type === 'HOTSPOT').length + hotspotTotalCount,
      pppoe: plans.filter(p => p.plan_type === 'PPPOE').length,
      static: plans.filter(p => p.plan_type === 'STATIC').length,
      subscribers: plans.reduce((sum, p) => sum + getPlanSubscriberCount(p), 0),
    }
  }, [dashboardStats, plans, hotspotTotalCount])

  // Reset form
  const resetForm = () => {
    setPlanForm({
      name: '',
      plan_type: 'PPPOE',
      description: '',
      // Speed settings
      download_speed: '',
      upload_speed: '',
      speed_unit: 'MBPS',
      // Data limit
      data_limit: '',
      unlimited_data: true,
      // Validity
      validity_type: 'MONTHS',
      duration_days: '30',
      validity_hours: '',
      validity_minutes: '',
      // Session/Connection limits
      max_sessions: '1',
      session_timeout: '',
      // Burst Speed
      burst_download: '',
      burst_upload: '',
      burst_threshold: '',
      burst_time: '',
      // FUP
      fup_enabled: false,
      fup_limit: '',
      fup_speed: '',
      // Pricing
      price: '',
      setup_fee: '',
      // Subnet Builder
      subnet_prefix: '172.16',
      subnet_octet: '',
      cidr_prefix: '24',
      // MikroTik QoS
      priority: '8',
      burst_enabled: false,
      // Validity months
      validity_months: '1',
      // Status
      is_active: true,
      is_popular: false,
      is_public: true,
      features: '',
    })
  }

  // Create plan
  const handleCreate = async () => {
    if (!planForm.name || !planForm.price) {
      toast.error('Name and price are required')
      return
    }

    setIsSubmitting(true)
    try {
      let ipPoolId: number | undefined = undefined

      // Cloud-Led: Create IP Pool from subnet builder if subnet fields are filled
      if (planForm.subnet_prefix && planForm.subnet_octet) {
        const poolName = `Pool ${planForm.subnet_prefix}.${planForm.subnet_octet}.0/${planForm.cidr_prefix}`
        toast.info('Creating IP Pool from subnet builder...')
        const newPool = await adminApi.createIPPool({
          name: poolName,
          subnet_prefix: planForm.subnet_prefix,
          subnet_octet: parseInt(planForm.subnet_octet),
          cidr_prefix: parseInt(planForm.cidr_prefix),
          pool_type: 'PPPOE',
          is_active: true,
        })
        ipPoolId = newPool.id
        toast.success(`IP Pool created with ${newPool.total_ips} IPs`)
      }

      await adminApi.createPlan({
        name: planForm.name,
        plan_type: planForm.plan_type,
        description: planForm.description || undefined,
        // Speed settings
        download_speed: planForm.download_speed ? parseInt(planForm.download_speed) : undefined,
        upload_speed: planForm.upload_speed ? parseInt(planForm.upload_speed) : undefined,
        speed_unit: planForm.speed_unit,
        // Data limit
        data_limit: planForm.unlimited_data ? null : (planForm.data_limit ? parseInt(planForm.data_limit) : undefined),
        // Validity
        validity_type: planForm.validity_type,
        duration_days: planForm.validity_type === 'DAYS' ? parseInt(planForm.duration_days) : undefined,
        validity_hours: planForm.validity_type === 'HOURS' ? parseInt(planForm.validity_hours) : undefined,
        validity_minutes: planForm.validity_type === 'MINUTES' ? parseInt(planForm.validity_minutes) : undefined,
        validity_months: planForm.validity_type === 'MONTHS' ? parseInt(planForm.validity_months) : undefined,
        // Session/Connection limits
        max_sessions: planForm.max_sessions ? parseInt(planForm.max_sessions) : undefined,
        session_timeout: planForm.session_timeout ? parseInt(planForm.session_timeout) : undefined,
        // MikroTik QoS
        priority: parseInt(planForm.priority) || 8,
        // Burst
        burst_enabled: planForm.burst_enabled,
        burst_download: planForm.burst_enabled && planForm.burst_download ? parseInt(planForm.burst_download) : undefined,
        burst_upload: planForm.burst_enabled && planForm.burst_upload ? parseInt(planForm.burst_upload) : undefined,
        burst_threshold: planForm.burst_enabled && planForm.burst_threshold ? parseInt(planForm.burst_threshold) : undefined,
        burst_time: planForm.burst_enabled && planForm.burst_time ? parseInt(planForm.burst_time) : undefined,
        // IP Pool
        ip_pool: ipPoolId,
        // Pricing
        base_price: planForm.price,
        setup_fee: planForm.setup_fee || undefined,
        // Status
        is_active: planForm.is_active,
        is_popular: planForm.is_popular,
        is_public: planForm.is_public,
        features: planForm.features ? planForm.features.split('\n').filter(f => f.trim()) : undefined,
      })
      toast.success('Plan created successfully')
      setIsCreateOpen(false)
      resetForm()
      fetchPlans()
      fetchDashboardStats()
      fetchHotspotStatsCount()
    } catch (error: any) {
      console.error('Failed to create plan:', error)
      toast.error(error.message || 'Failed to create plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit plan
  const openEditDialog = (plan: Plan) => {
    const hp = plan as any
    if (hp._isHotspotPlan) {
      // Pre-populate hotspot form and open hotspot edit dialog
      setSelectedPlan(plan)
      setHotspotForm({
        name: plan.name,
        price: (plan.price ?? plan.base_price)?.toString() || '',
        download_speed: plan.download_speed?.toString() || '',
        upload_speed: plan.upload_speed?.toString() || '',
        validity_type: plan.validity_type || 'HOURS',
        duration_days: plan.duration_days?.toString() || '1',
        validity_hours: plan.validity_hours?.toString() || '1',
        validity_minutes: plan.validity_minutes?.toString() || '30',
        max_sessions: plan.max_sessions?.toString() || '1',
        description: plan.description || '',
        features: plan.features?.join('\n') || '',
        is_active: plan.is_active,
        is_popular: plan.is_popular || false,
        // NEW: Restore data limit from existing plan
        limitation_type: (hp.limitation_type as 'UNLIMITED' | 'DATA') || 'UNLIMITED',
        data_limit_value: hp.data_limit_value?.toString() || '',
        data_limit_unit: (hp.data_limit_unit as 'MB' | 'GB') || 'MB',
      })
      setEditingHotspotPlan(plan)
      setIsEditingHotspot(true)
      setIsHotspotCreateOpen(true)
      return
    }
    setSelectedPlan(plan)
    setPlanForm({
      name: plan.name,
      plan_type: plan.plan_type,
      description: plan.description || '',
      // Speed settings
      download_speed: plan.download_speed?.toString() || '',
      upload_speed: plan.upload_speed?.toString() || '',
      speed_unit: plan.speed_unit || 'MBPS',
      // Data limit
      data_limit: plan.data_limit?.toString() || '',
      unlimited_data: !plan.data_limit,
      // Validity - flexible time-based
      validity_type: plan.validity_type || 'DAYS',
      duration_days: plan.duration_days?.toString() || plan.validity_days?.toString() || '30',
      validity_hours: plan.validity_hours?.toString() || '',
      validity_minutes: plan.validity_minutes?.toString() || '',
      // Session/Connection limits
      max_sessions: plan.max_sessions?.toString() || '1',
      session_timeout: plan.session_timeout?.toString() || '',
      // Burst Speed
      burst_download: plan.burst_download?.toString() || '',
      burst_upload: plan.burst_upload?.toString() || '',
      burst_threshold: plan.burst_threshold?.toString() || '',
      burst_time: plan.burst_time?.toString() || '',
      // FUP
      fup_enabled: !!(plan.fup_limit || plan.fup_speed),
      fup_limit: plan.fup_limit?.toString() || '',
      fup_speed: plan.fup_speed?.toString() || '',
      // Pricing
      price: plan.price?.toString() || plan.base_price?.toString() || '',
      setup_fee: plan.setup_fee?.toString() || '',
      // Subnet Builder (not editable from edit dialog)
      subnet_prefix: '172.16',
      subnet_octet: '',
      cidr_prefix: '24',
      // MikroTik QoS
      priority: plan.priority?.toString() || '8',
      burst_enabled: plan.burst_enabled || false,
      // Validity months
      validity_months: plan.validity_months?.toString() || '1',
      // Status
      is_active: plan.is_active,
      is_popular: plan.is_popular || false,
      is_public: plan.is_public ?? true,
      features: plan.features?.join('\n') || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedPlan) return

    setIsSubmitting(true)
    try {
      await adminApi.updatePlan(selectedPlan.id, {
        name: planForm.name,
        plan_type: planForm.plan_type,
        description: planForm.description || undefined,
        // Speed settings
        download_speed: planForm.download_speed ? parseInt(planForm.download_speed) : undefined,
        upload_speed: planForm.upload_speed ? parseInt(planForm.upload_speed) : undefined,
        speed_unit: planForm.speed_unit,
        // Data limit
        data_limit: planForm.unlimited_data ? null : (planForm.data_limit ? parseInt(planForm.data_limit) : undefined),
        // Validity
        validity_type: planForm.validity_type,
        duration_days: planForm.validity_type === 'DAYS' ? parseInt(planForm.duration_days) : undefined,
        validity_hours: planForm.validity_type === 'HOURS' ? parseInt(planForm.validity_hours) : undefined,
        validity_minutes: planForm.validity_type === 'MINUTES' ? parseInt(planForm.validity_minutes) : undefined,
        validity_months: planForm.validity_type === 'MONTHS' ? parseInt(planForm.validity_months || '1') : undefined,
        // QoS Priority (MikroTik 1-8)
        priority: planForm.priority ? parseInt(planForm.priority) : undefined,
        // Session/Connection limits
        max_sessions: planForm.max_sessions ? parseInt(planForm.max_sessions) : undefined,
        session_timeout: planForm.session_timeout ? parseInt(planForm.session_timeout) : undefined,
        // Burst Speed
        burst_enabled: planForm.burst_enabled,
        burst_download: planForm.burst_enabled && planForm.burst_download ? parseInt(planForm.burst_download) : undefined,
        burst_upload: planForm.burst_enabled && planForm.burst_upload ? parseInt(planForm.burst_upload) : undefined,
        burst_threshold: planForm.burst_enabled && planForm.burst_threshold ? parseInt(planForm.burst_threshold) : undefined,
        burst_time: planForm.burst_enabled && planForm.burst_time ? parseInt(planForm.burst_time) : undefined,
        // FUP
        fup_limit: planForm.fup_enabled && planForm.fup_limit ? parseInt(planForm.fup_limit) : undefined,
        fup_speed: planForm.fup_enabled && planForm.fup_speed ? parseInt(planForm.fup_speed) : undefined,
        // Pricing
        base_price: planForm.price,  // Backend expects base_price, not price
        setup_fee: planForm.setup_fee || undefined,
        // Status
        is_active: planForm.is_active,
        is_popular: planForm.is_popular,
        is_public: planForm.is_public,
        features: planForm.features ? planForm.features.split('\n').filter(f => f.trim()) : undefined,
      })
      toast.success('Plan updated successfully')
      setIsEditOpen(false)
      resetForm()
      fetchPlans()
      fetchDashboardStats()
      fetchHotspotStatsCount()
    } catch (error: any) {
      console.error('Failed to update plan:', error)
      toast.error(error.message || 'Failed to update plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle active status - FIXED to handle hotspot plans
  const handleToggleActive = async (plan: Plan) => {
    setTogglingId(plan.id)
    try {
      const hp = plan as any
      if (hp._isHotspotPlan && hp._routerId) {
        // HotspotPlan: pass routerId to the API
        await adminApi.togglePlanActive(hp._hotspotPlanId, hp._routerId)
      } else {
        // Regular Plan
        await adminApi.togglePlanActive(plan.id)
      }
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`)
      fetchPlans()
      fetchDashboardStats()
      fetchHotspotStatsCount()
      if (selectedRouterId === 'all') fetchAllHotspotPlans()
      else if (selectedRouterId) fetchHotspotPlans(selectedRouterId as number)
    } catch (error: any) {
      console.error('Failed to toggle plan:', error)
      toast.error(error.message || 'Failed to toggle plan status')
    } finally {
      setTogglingId(null)
    }
  }

  // View details
  const handleViewDetails = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsDetailOpen(true)
  }

  // Delete plan — show confirmation dialog
  const handleDeleteRequest = (plan: Plan) => {
    setPlanToDelete(plan)
  }

  // Confirm and execute delete - updated to refresh correctly
  const handleConfirmDelete = async () => {
    if (!planToDelete) return
    setDeletingId(planToDelete.id)
    try {
      const hp = planToDelete as any
      if (hp._isHotspotPlan && hp._routerId) {
        // Delete HotspotPlan via router-scoped endpoint
        await adminApi.deleteHotspotPlan(hp._routerId, hp._hotspotPlanId)
      } else {
        // Delete regular Plan
        await adminApi.deletePlan(planToDelete.id)
      }
      toast.success(`"${planToDelete.name}" deleted permanently`)
      setPlanToDelete(null)
      fetchPlans()
      fetchDashboardStats()
      fetchHotspotStatsCount()
      if (selectedRouterId === 'all') fetchAllHotspotPlans()
      else if (selectedRouterId) fetchHotspotPlans(selectedRouterId as number)
    } catch (error: any) {
      console.error('Failed to delete plan:', error)
      toast.error(error.message || 'Failed to delete plan')
    } finally {
      setDeletingId(null)
    }
  }

  // Hotspot quick-create from preset — updated to support 'all' routers with is_global_template
  const handleHotspotPresetCreate = async (preset: HotspotPreset) => {
    if (!selectedRouterId) {
      toast.error('Please select a router first')
      return
    }
    setHotspotCreating(true)
    try {
      const targetRouters = selectedRouterId === 'all' ? routers : routers.filter(r => r.id === selectedRouterId)
      
      for (const router of targetRouters) {
        await adminApi.createHotspotPlan(router.id, {
          name: preset.config.name,
          price: preset.config.base_price.toString(),
          validity_type: preset.config.validity_type === 'MINUTES' ? 'MINUTES' :
                         preset.config.validity_type === 'HOURS' ? 'HOURS' : 'DAYS',
          validity_value: preset.config.validity_type === 'MINUTES' ? preset.config.validity_minutes! :
                          preset.config.validity_type === 'HOURS' ? preset.config.validity_hours! :
                          preset.config.duration_days!,
          download_speed: preset.config.download_speed,
          upload_speed: preset.config.upload_speed,
          simultaneous_devices: preset.config.max_sessions || 1,
          is_active: true,
          is_popular: false,
          // Mark as global template when "All Routers" was selected
          is_global_template: selectedRouterId === 'all',
          // Presets are always unlimited
          limitation_type: 'UNLIMITED',
          data_limit_value: null,
          data_limit_unit: 'MB',
        } as any)
      }
      
      const routerLabel = selectedRouterId === 'all' ? `all ${targetRouters.length} routers` : 'selected router'
      toast.success(`"${preset.config.name}" plan created for ${routerLabel}!`)
      fetchPlans()
      fetchDashboardStats()
      fetchHotspotStatsCount()
      if (selectedRouterId === 'all') fetchAllHotspotPlans()
      else fetchHotspotPlans(selectedRouterId as number)
    } catch (error: any) {
      toast.error(error.message || `Failed to create ${preset.name} plan`)
    } finally {
      setHotspotCreating(false)
    }
  }

  const resetHotspotForm = () => {
    setHotspotForm({ 
      name: '', price: '', download_speed: '', upload_speed: '', 
      validity_type: 'HOURS', duration_days: '1', validity_hours: '1', validity_minutes: '30', 
      max_sessions: '1', description: '', features: '', is_active: true, is_popular: false,
      limitation_type: 'UNLIMITED',
      data_limit_value: '',
      data_limit_unit: 'MB',
    })
    setIsEditingHotspot(false)
    setEditingHotspotPlan(null)
  }

  // Hotspot custom create/edit handler — supports 'all' routers for create, single router for edit
  const handleHotspotCustomCreate = async () => {
    if (!hotspotForm.name || !hotspotForm.price) {
      toast.error('Name and price are required')
      return
    }
    setHotspotCreating(true)
    try {
      const validityType = hotspotForm.validity_type as 'MINUTES' | 'HOURS' | 'DAYS' | 'UNLIMITED'
      const validityValue = validityType === 'MINUTES' ? parseInt(hotspotForm.validity_minutes) :
                            validityType === 'HOURS' ? parseInt(hotspotForm.validity_hours) :
                            validityType === 'DAYS' ? parseInt(hotspotForm.duration_days) : 0

      const payload = {
        name: hotspotForm.name,
        description: hotspotForm.description || undefined,
        price: hotspotForm.price,
        validity_type: validityType,
        validity_value: validityValue || 1,
        download_speed: hotspotForm.download_speed ? parseInt(hotspotForm.download_speed) : 10,
        upload_speed: hotspotForm.upload_speed ? parseInt(hotspotForm.upload_speed) : 5,
        simultaneous_devices: hotspotForm.max_sessions ? parseInt(hotspotForm.max_sessions) : 1,
        is_active: hotspotForm.is_active,
        is_popular: hotspotForm.is_popular,
        // NEW: Data limit fields
        limitation_type: hotspotForm.limitation_type,
        data_limit_value: hotspotForm.limitation_type === 'DATA' && hotspotForm.data_limit_value 
          ? parseInt(hotspotForm.data_limit_value) 
          : null,
        data_limit_unit: hotspotForm.data_limit_unit,
      } as any

      if (isEditingHotspot && editingHotspotPlan) {
        // Update existing hotspot plan on its router
        const hp = editingHotspotPlan as any
        await adminApi.updateHotspotPlan(hp._routerId, hp._hotspotPlanId, payload)
        toast.success('Hotspot plan updated!')
      } else {
        if (!selectedRouterId) {
          toast.error('Please select a router first')
          return
        }
        const targetRouters = selectedRouterId === 'all' ? routers : routers.filter(r => r.id === selectedRouterId)
        for (const router of targetRouters) {
          await adminApi.createHotspotPlan(router.id, { ...payload, is_global_template: selectedRouterId === 'all' })
        }
        const routerLabel = selectedRouterId === 'all' ? `all ${targetRouters.length} routers` : 'selected router'
        toast.success(`Hotspot plan created for ${routerLabel}!`)
      }

      setIsHotspotCreateOpen(false)
      resetHotspotForm()
      fetchPlans()
      fetchDashboardStats()
      fetchHotspotStatsCount()
      if (selectedRouterId === 'all') fetchAllHotspotPlans()
      else if (selectedRouterId) fetchHotspotPlans(selectedRouterId as number)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save hotspot plan')
    } finally {
      setHotspotCreating(false)
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    )
  }

  return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plans Management</h1>
          <p className="text-muted-foreground">
            Manage internet plans, pricing, and features
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Tabs: Full-width, prominent, with counts ── */}
      <div className="w-full">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {([
            { value: "all", label: "All Plans", icon: Package, count: stats.total, activeBorder: "border-slate-500", activeBg: "bg-slate-50", activeIconBg: "bg-slate-100", activeIconColor: "text-slate-600", activeCountColor: "text-slate-600", inactiveIconBg: "bg-muted", bottomBar: "bg-slate-500" },
            { value: "hotspot", label: "Hotspot", icon: Wifi, count: stats.hotspot, activeBorder: "border-primary", activeBg: "bg-primary/10", activeIconBg: "bg-primary/15", activeIconColor: "text-primary", activeCountColor: "text-primary", inactiveIconBg: "bg-muted", bottomBar: "bg-primary" },
            { value: "pppoe", label: "PPPoE", icon: Globe, count: stats.pppoe, activeBorder: "border-purple-500", activeBg: "bg-purple-50", activeIconBg: "bg-purple-100", activeIconColor: "text-purple-600", activeCountColor: "text-purple-600", inactiveIconBg: "bg-muted", bottomBar: "bg-purple-500" },
          ] as const).map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? `${tab.activeBorder} ${tab.activeBg} shadow-sm`
                    : "border-transparent bg-muted/40 hover:bg-muted/70 hover:border-muted-foreground/20"
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? tab.activeIconBg : tab.inactiveIconBg}`}>
                  <Icon className={`w-5 h-5 ${isActive ? tab.activeIconColor : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {tab.label}
                  </p>
                  <p className={`text-2xl font-bold ${isActive ? tab.activeCountColor : "text-foreground"}`}>
                    {tab.count}
                  </p>
                </div>
                {isActive && (
                  <div className={`absolute bottom-0 left-4 right-4 h-0.5 ${tab.bottomBar} rounded-full`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search + Create Button Row ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          size="lg"
          onClick={() => {
            if (activeTab === "all") {
              // Show plan type picker
              setIsPlanTypePickerOpen(true)
            } else if (activeTab === "hotspot") {
              if (!selectedRouterId) {
                toast.error('Please select a router first')
                return
              }
              setIsHotspotCreateOpen(true)
            } else {
              resetForm()
              setPlanForm(prev => ({
                ...prev,
                plan_type: activeTab.toUpperCase() as PlanType,
              }))
              setIsCreateOpen(true)
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "all"
            ? "Create Plan"
            : activeTab === "hotspot"
            ? "Create Hotspot Plan"
            : "Create PPPoE Plan"}
        </Button>
      </div>

      {/* ── Plan Type Picker Dialog (shown from "All Plans" tab) ── */}
      <Dialog open={isPlanTypePickerOpen} onOpenChange={setIsPlanTypePickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>What type of plan do you want to create?</DialogTitle>
            <DialogDescription>
              Choose a plan type to get started
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            {[
              { type: "hotspot" as const, label: "Hotspot Plan", description: "Time-based WiFi access for captive portals", icon: Wifi, color: "bg-primary" },
              { type: "pppoe" as const, label: "PPPoE Plan", description: "Point-to-point subscriber connections", icon: Globe, color: "bg-purple-500" },
            ].map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.type}
                  onClick={() => {
                    setIsPlanTypePickerOpen(false)
                    setActiveTab(opt.type)
                    if (opt.type === "hotspot") {
                      // Switch to hotspot tab — user must select a router first
                      fetchRouters()
                      toast.info('Select a router to create hotspot plans')
                    } else {
                      resetForm()
                      setPlanForm(prev => ({
                        ...prev,
                        plan_type: opt.type.toUpperCase() as PlanType,
                      }))
                      setIsCreateOpen(true)
                    }
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-muted hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                >
                  <div className={`p-3 rounded-lg ${opt.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== HOTSPOT TAB — Router Picker + Quick Create Cards + Plan Listing ====== */}
      {activeTab === 'hotspot' && (
        <>
          {/* Router Selector - Updated with "All Routers" option */}
          <Card className="border-primary/20 bg-primary/10/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Signal className="w-5 h-5 text-primary" />
                Select Router
              </CardTitle>
              <CardDescription>
                {selectedRouterId === 'all'
                  ? `Managing plans across all ${routers.length} routers`
                  : 'Hotspot plans are linked to a specific router. Select the router where these plans will be available.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routersLoading ? (
                <Skeleton className="h-10 w-full max-w-sm" />
              ) : routers.length === 0 ? (
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">No routers found. Add a router in the Network section first.</span>
                </div>
              ) : (
                <Select
                  value={selectedRouterId?.toString() || ''}
                  onValueChange={(v) => {
                    if (v === 'all') {
                      setSelectedRouterId('all')
                      fetchAllHotspotPlans()
                    } else {
                      setSelectedRouterId(parseInt(v))
                    }
                  }}
                >
                  <SelectTrigger className="max-w-sm bg-white">
                    <SelectValue placeholder="Choose a router..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        All Routers
                      </div>
                    </SelectItem>
                    {routers.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${r.is_active ? 'bg-success' : 'bg-gray-400'}`} />
                          {r.name} <span className="text-muted-foreground ml-1">({r.ip_address})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Quick Create Presets — only shown when router is selected, updated description */}
          {selectedRouterId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-warning" />
                Quick Create Hotspot Plans
              </CardTitle>
              <CardDescription>
                One-click to create industry-standard hotspot packages for{' '}
                <span className="font-semibold">
                  {selectedRouterId === 'all'
                    ? `all ${routers.length} routers`
                    : routers.find(r => r.id === selectedRouterId)?.name || 'Unknown'}
                </span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {HOTSPOT_PRESETS.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleHotspotPresetCreate(preset)}
                      disabled={hotspotCreating}
                      className="group relative flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 transition-all text-center disabled:opacity-50"
                    >
                      <div className={`w-10 h-10 rounded-full ${preset.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-sm">{preset.name}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{preset.description}</span>
                      <span className="text-sm font-bold text-primary mt-1">
                        KES {preset.config.base_price.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                        <Gauge className="w-3 h-3" />
                        {preset.config.download_speed}/{preset.config.upload_speed} Mbps
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          )}

          {/* No router selected prompt */}
          {!selectedRouterId && routers.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Signal className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Select a router to manage hotspot plans</p>
                <p className="text-muted-foreground text-sm mt-1">Choose a router above to view, create, or manage its hotspot plans</p>
              </CardContent>
            </Card>
          )}

          {/* Existing Hotspot Plans Listing */}
          {selectedRouterId && filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wifi className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">No hotspot plans yet</p>
                <p className="text-muted-foreground text-sm mt-1">Click a quick-create card above or use &ldquo;Custom Hotspot&rdquo; to create one</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} onView={handleViewDetails} onEdit={openEditDialog} onToggle={handleToggleActive} onDelete={handleDeleteRequest} togglingId={togglingId} deletingId={deletingId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ====== ALL / PPPoE TABS — Standard Plan Card Grid ====== */}
      {(activeTab === 'all' || activeTab === 'pppoe') && (
        <>
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">No plans found</p>
                <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or create a new plan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} onView={handleViewDetails} onEdit={openEditDialog} onToggle={handleToggleActive} onDelete={handleDeleteRequest} togglingId={togglingId} deletingId={deletingId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Plan Dialog - PPPoE */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-500" />
              Create PPPoE Plan
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Plan Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Plan Name</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g., Home Basic 20Mbps"
              />
            </div>

            {/* IP Pool Range - Inline Subnet Builder */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">IP Pool Range</Label>
              <div className="flex items-center gap-1.5">
                <Select
                  value={planForm.subnet_prefix}
                  onValueChange={(v) => setPlanForm({ ...planForm, subnet_prefix: v })}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Prefix" />
                  </SelectTrigger>
                  <SelectContent>
                    {subnetPrefixes.map((p) => (
                      <SelectItem key={p.value} value={p.value} disabled={blockedPrefixes.includes(p.value)}>
                        {p.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground font-mono">.</span>
                <Input
                  type="number"
                  className="w-[70px] text-center font-mono"
                  min={0}
                  max={255}
                  value={planForm.subnet_octet}
                  onChange={(e) => setPlanForm({ ...planForm, subnet_octet: e.target.value })}
                  placeholder="x"
                />
                <span className="text-muted-foreground font-mono">.1</span>
                <span className="text-muted-foreground font-mono">/</span>
                <Select
                  value={planForm.cidr_prefix}
                  onValueChange={(v) => setPlanForm({ ...planForm, cidr_prefix: v })}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cidrOptions.map((c) => (
                      <SelectItem key={c.value} value={String(c.value)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Subnet Preview */}
              {planForm.subnet_prefix && planForm.subnet_octet && subnetPreview && (
                <div className="flex items-center gap-3 text-xs mt-1.5">
                  <span className="text-muted-foreground">
                    Generated Range: <span className="font-mono font-medium text-foreground">{subnetPreview.gateway}/{planForm.cidr_prefix}</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">{subnetPreview.usableIPs} usable IPs</Badge>
                </div>
              )}
              {planForm.subnet_prefix === '192.168' && (
                <p className="text-xs text-warning flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  192.168.x.x is typically used for local LANs — consider 10.x or 172.16-31.x for PPPoE pools
                </p>
              )}
            </div>

            <Separator />

            {/* Validity + Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Validity</Label>
                {planForm.validity_type !== 'UNLIMITED' && (
                  <Input
                    type="number"
                    min={1}
                    value={
                      planForm.validity_type === 'MONTHS' ? planForm.validity_months :
                      planForm.validity_type === 'DAYS' ? planForm.duration_days :
                      planForm.validity_type === 'HOURS' ? planForm.validity_hours :
                      planForm.validity_type === 'MINUTES' ? planForm.validity_minutes : '1'
                    }
                    onChange={(e) => {
                      const v = e.target.value
                      if (planForm.validity_type === 'MONTHS') setPlanForm({ ...planForm, validity_months: v })
                      else if (planForm.validity_type === 'DAYS') setPlanForm({ ...planForm, duration_days: v })
                      else if (planForm.validity_type === 'HOURS') setPlanForm({ ...planForm, validity_hours: v })
                      else if (planForm.validity_type === 'MINUTES') setPlanForm({ ...planForm, validity_minutes: v })
                    }}
                    placeholder="1"
                  />
                )}
                {planForm.validity_type === 'UNLIMITED' && (
                  <Input disabled value="∞" className="text-center" />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit</Label>
                <Select
                  value={planForm.validity_type}
                  onValueChange={(v) => setPlanForm({ ...planForm, validity_type: v as typeof planForm.validity_type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHS">Months</SelectItem>
                    <SelectItem value="DAYS">Days</SelectItem>
                    <SelectItem value="HOURS">Hours</SelectItem>
                    <SelectItem value="MINUTES">Minutes</SelectItem>
                    <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price (KES)</Label>
              <Input
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                placeholder="e.g., 2500"
              />
            </div>

            {/* Download / Upload Speed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Download Speed (Mbps)</Label>
                <Input
                  type="number"
                  value={planForm.download_speed}
                  onChange={(e) => setPlanForm({ ...planForm, download_speed: e.target.value })}
                  placeholder="e.g., 20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Speed (Mbps)</Label>
                <Input
                  type="number"
                  value={planForm.upload_speed}
                  onChange={(e) => setPlanForm({ ...planForm, upload_speed: e.target.value })}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            {/* 🟢 NEW: Speed Unit Selector with GBPS */}
            <div className="space-y-2">
              <Label>Speed Unit</Label>
              <Select 
                value={planForm.speed_unit}
                onValueChange={(v) => setPlanForm({ ...planForm, speed_unit: v as 'MBPS' | 'KBPS' | 'GBPS' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MBPS">Mbps (Megabits)</SelectItem>
                  <SelectItem value="KBPS">Kbps (Kilobits)</SelectItem>
                  <SelectItem value="GBPS">Gbps (Gigabits)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {planForm.speed_unit === 'KBPS' && 'e.g., 512 Kbps, 1024 Kbps (= 1 Mbps)'}
                {planForm.speed_unit === 'MBPS' && 'e.g., 10 Mbps, 50 Mbps, 100 Mbps'}
                {planForm.speed_unit === 'GBPS' && 'e.g., 1 Gbps, 10 Gbps'}
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority (1-8)</Label>
              <Select
                value={planForm.priority}
                onValueChange={(v) => setPlanForm({ ...planForm, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Highest)</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="8">8 (Lowest)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Lower numbers = higher priority in MikroTik queue tree</p>
            </div>

            {/* Enable Burst */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Enable Burst</Label>
                <Switch
                  checked={planForm.burst_enabled}
                  onCheckedChange={(c) => setPlanForm({ ...planForm, burst_enabled: c })}
                />
              </div>
              {planForm.burst_enabled && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Burst Download (Mbps)</Label>
                    <Input
                      type="number"
                      value={planForm.burst_download}
                      onChange={(e) => setPlanForm({ ...planForm, burst_download: e.target.value })}
                      placeholder="e.g., 40"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Burst Upload (Mbps)</Label>
                    <Input
                      type="number"
                      value={planForm.burst_upload}
                      onChange={(e) => setPlanForm({ ...planForm, burst_upload: e.target.value })}
                      placeholder="e.g., 20"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Burst Threshold (KB)</Label>
                    <Input
                      type="number"
                      value={planForm.burst_threshold}
                      onChange={(e) => setPlanForm({ ...planForm, burst_threshold: e.target.value })}
                      placeholder="e.g., 2048"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Burst Time (sec)</Label>
                    <Input
                      type="number"
                      value={planForm.burst_time}
                      onChange={(e) => setPlanForm({ ...planForm, burst_time: e.target.value })}
                      placeholder="e.g., 10"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !planForm.name || !planForm.price}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog - Enhanced with IP Pool & QoS */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Plan
              {selectedPlan && (
                <Badge variant="outline" className="ml-2">
                  {selectedPlan.plan_type}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Update plan details, pricing, QoS, and IP pool configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* IP Pool Info (read-only, for context) */}
            {selectedPlan?.ip_pool && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <Network className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900">Linked IP Pool</p>
                  <p className="text-xs text-purple-700">
                    {selectedPlan.ip_pool_name || `Pool #${selectedPlan.ip_pool}`}
                    {selectedPlan.ip_pool_range && ` — ${selectedPlan.ip_pool_range}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
                  Pool #{selectedPlan.ip_pool}
                </Badge>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name *</Label>
                  <Input
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g., Premium 50Mbps"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan Type *</Label>
                  <Select
                    value={planForm.plan_type}
                    onValueChange={(v) => setPlanForm({ ...planForm, plan_type: v as PlanType })}
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
                <div className="space-y-2">
                  <Label>Price (KES) *</Label>
                  <Input
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="e.g., 2500"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Validity Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Validity Period</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Validity Type</Label>
                  <Select
                    value={planForm.validity_type}
                    onValueChange={(v) => setPlanForm({ ...planForm, validity_type: v as typeof planForm.validity_type })}
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
                
                {planForm.validity_type === 'MINUTES' && (
                  <div className="space-y-2">
                    <Label>Duration (Minutes)</Label>
                    <Input type="number" value={planForm.validity_minutes}
                      onChange={(e) => setPlanForm({ ...planForm, validity_minutes: e.target.value })}
                      placeholder="e.g., 30, 60, 120" />
                  </div>
                )}
                {planForm.validity_type === 'HOURS' && (
                  <div className="space-y-2">
                    <Label>Duration (Hours)</Label>
                    <Input type="number" value={planForm.validity_hours}
                      onChange={(e) => setPlanForm({ ...planForm, validity_hours: e.target.value })}
                      placeholder="e.g., 1, 3, 6, 12, 24" />
                  </div>
                )}
                {planForm.validity_type === 'DAYS' && (
                  <div className="space-y-2">
                    <Label>Duration (Days)</Label>
                    <Select value={planForm.duration_days}
                      onValueChange={(v) => setPlanForm({ ...planForm, duration_days: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">7 Days (Weekly)</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days (Monthly)</SelectItem>
                        <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                        <SelectItem value="180">180 Days</SelectItem>
                        <SelectItem value="365">365 Days (Annual)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {planForm.validity_type === 'MONTHS' && (
                  <div className="space-y-2">
                    <Label>Duration (Months)</Label>
                    <Input type="number" min={1} value={planForm.validity_months}
                      onChange={(e) => setPlanForm({ ...planForm, validity_months: e.target.value })}
                      placeholder="e.g., 1, 3, 6, 12" />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Speed Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Speed Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Download Speed</Label>
                  <Input type="number" value={planForm.download_speed}
                    onChange={(e) => setPlanForm({ ...planForm, download_speed: e.target.value })}
                    placeholder="e.g., 50" />
                </div>
                <div className="space-y-2">
                  <Label>Upload Speed</Label>
                  <Input type="number" value={planForm.upload_speed}
                    onChange={(e) => setPlanForm({ ...planForm, upload_speed: e.target.value })}
                    placeholder="e.g., 25" />
                </div>
                <div className="space-y-2">
                  <Label>Speed Unit</Label>
                  <Select 
                    value={planForm.speed_unit}
                    onValueChange={(v) => setPlanForm({ ...planForm, speed_unit: v as 'MBPS' | 'KBPS' | 'GBPS' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MBPS">Mbps (Megabits)</SelectItem>
                      <SelectItem value="KBPS">Kbps (Kilobits)</SelectItem>
                      <SelectItem value="GBPS">Gbps (Gigabits)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* MikroTik QoS Priority */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">MikroTik QoS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority (1-8)</Label>
                  <Select value={planForm.priority}
                    onValueChange={(v) => setPlanForm({ ...planForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Highest)</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8 (Lowest / Default)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Lower number = higher priority in MikroTik queue tree</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Devices</Label>
                  <Input type="number" min="1" value={planForm.max_sessions}
                    onChange={(e) => setPlanForm({ ...planForm, max_sessions: e.target.value })}
                    placeholder="1" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Burst Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Burst Speed</h3>
                <div className="flex items-center gap-2">
                  <Switch checked={planForm.burst_enabled}
                    onCheckedChange={(c) => setPlanForm({ ...planForm, burst_enabled: c })} />
                  <Label className="text-sm">Enable Burst</Label>
                </div>
              </div>
              {planForm.burst_enabled && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Burst Download (Mbps)</Label>
                    <Input type="number" value={planForm.burst_download}
                      onChange={(e) => setPlanForm({ ...planForm, burst_download: e.target.value })}
                      placeholder="100" className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Burst Upload (Mbps)</Label>
                    <Input type="number" value={planForm.burst_upload}
                      onChange={(e) => setPlanForm({ ...planForm, burst_upload: e.target.value })}
                      placeholder="50" className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Threshold (KB)</Label>
                    <Input type="number" value={planForm.burst_threshold}
                      onChange={(e) => setPlanForm({ ...planForm, burst_threshold: e.target.value })}
                      placeholder="2048" className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Burst Time (sec)</Label>
                    <Input type="number" value={planForm.burst_time}
                      onChange={(e) => setPlanForm({ ...planForm, burst_time: e.target.value })}
                      placeholder="10" className="h-9" />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Data Limit */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Data Limit</h3>
                <div className="flex items-center gap-2">
                  <Switch checked={planForm.unlimited_data}
                    onCheckedChange={(c) => setPlanForm({ ...planForm, unlimited_data: c, data_limit: c ? '' : planForm.data_limit })} />
                  <Label className="text-sm">Unlimited</Label>
                </div>
              </div>
              {!planForm.unlimited_data && (
                <Input type="number" value={planForm.data_limit}
                  onChange={(e) => setPlanForm({ ...planForm, data_limit: e.target.value })}
                  placeholder="Data limit in GB" />
              )}
            </div>

            <Separator />

            {/* Additional Settings Row */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Additional Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Setup Fee (KES)</Label>
                  <Input type="number" value={planForm.setup_fee}
                    onChange={(e) => setPlanForm({ ...planForm, setup_fee: e.target.value })}
                    placeholder="500" />
                </div>
                <div className="space-y-2">
                  <Label>Idle Timeout (min)</Label>
                  <Input type="number" value={planForm.session_timeout}
                    onChange={(e) => setPlanForm({ ...planForm, session_timeout: e.target.value })}
                    placeholder="30" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={planForm.is_active ? "active" : "inactive"}
                    onValueChange={(v) => setPlanForm({ ...planForm, is_active: v === "active" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* FUP Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fair Usage Policy (FUP)</h3>
                <div className="flex items-center gap-2">
                  <Switch checked={planForm.fup_enabled}
                    onCheckedChange={(c) => setPlanForm({ ...planForm, fup_enabled: c })} />
                  <Label className="text-sm">Enable FUP</Label>
                </div>
              </div>
              {planForm.fup_enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>FUP Threshold (GB)</Label>
                    <Input type="number" value={planForm.fup_limit}
                      onChange={(e) => setPlanForm({ ...planForm, fup_limit: e.target.value })}
                      placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Throttled Speed (Mbps)</Label>
                    <Input type="number" value={planForm.fup_speed}
                      onChange={(e) => setPlanForm({ ...planForm, fup_speed: e.target.value })}
                      placeholder="10" />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Description & Features */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description & Features</h3>
              <Textarea value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Describe the plan benefits..." rows={2} />
              <Textarea value={planForm.features}
                onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                placeholder="Features (one per line)&#10;e.g., 24/7 Support&#10;Unlimited Data" rows={3} />
            </div>

            {/* Popular & Public Toggles */}
            <div className="flex flex-wrap items-center gap-6 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch checked={planForm.is_popular}
                  onCheckedChange={(c) => setPlanForm({ ...planForm, is_popular: c })} />
                <Label className="text-sm">
                  <Zap className="w-3 h-3 inline mr-1 text-warning" />
                  Popular
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={planForm.is_public}
                  onCheckedChange={(c) => setPlanForm({ ...planForm, is_public: c })} />
                <Label className="text-sm">Customer Portal</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hotspot Create / Edit Dialog */}
      <Dialog open={isHotspotCreateOpen} onOpenChange={(open) => { if (!open) { setIsHotspotCreateOpen(false); resetHotspotForm() } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary" />
              {isEditingHotspot ? 'Edit Hotspot Plan' : 'Create Custom Hotspot Plan'}
            </DialogTitle>
            <DialogDescription>
              {isEditingHotspot
                ? <span>Editing <span className="font-semibold">{editingHotspotPlan?.name}</span>{(editingHotspotPlan as any)?._routerName ? ` · ${(editingHotspotPlan as any)._routerName}` : ''}</span>
                : <span>Creating plan for: <span className="font-semibold">{selectedRouterId === 'all' ? `all ${routers.length} routers` : routers.find(r => r.id === selectedRouterId)?.name || 'Unknown'}</span></span>
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Plan Name *</Label>
              <Input value={hotspotForm.name}
                onChange={(e) => setHotspotForm({ ...hotspotForm, name: e.target.value })}
                placeholder="e.g., Weekend Special 12hr" />
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Validity</Label>
                {hotspotForm.validity_type !== 'UNLIMITED' && (
                  <Input type="number" min={1}
                    value={
                      hotspotForm.validity_type === 'DAYS' ? hotspotForm.duration_days :
                      hotspotForm.validity_type === 'HOURS' ? hotspotForm.validity_hours :
                      hotspotForm.validity_minutes
                    }
                    onChange={(e) => {
                      const v = e.target.value
                      if (hotspotForm.validity_type === 'DAYS') setHotspotForm({ ...hotspotForm, duration_days: v })
                      else if (hotspotForm.validity_type === 'HOURS') setHotspotForm({ ...hotspotForm, validity_hours: v })
                      else setHotspotForm({ ...hotspotForm, validity_minutes: v })
                    }}
                    placeholder="1" />
                )}
                {hotspotForm.validity_type === 'UNLIMITED' && (
                  <Input disabled value="∞" className="text-center" />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit</Label>
                <Select value={hotspotForm.validity_type}
                  onValueChange={(v) => setHotspotForm({ ...hotspotForm, validity_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINUTES">Minutes</SelectItem>
                    <SelectItem value="HOURS">Hours</SelectItem>
                    <SelectItem value="DAYS">Days</SelectItem>
                    <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price (KES) *</Label>
              <Input type="number" value={hotspotForm.price}
                onChange={(e) => setHotspotForm({ ...hotspotForm, price: e.target.value })}
                placeholder="e.g., 100" />
            </div>

            {/* Speed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Download (Mbps)</Label>
                <Input type="number" value={hotspotForm.download_speed}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, download_speed: e.target.value })}
                  placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload (Mbps)</Label>
                <Input type="number" value={hotspotForm.upload_speed}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, upload_speed: e.target.value })}
                  placeholder="5" />
              </div>
            </div>

            {/* Max Devices */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Devices</Label>
              <Input type="number" min={1} value={hotspotForm.max_sessions}
                onChange={(e) => setHotspotForm({ ...hotspotForm, max_sessions: e.target.value })}
                placeholder="1" />
            </div>

            {/* Data Limit — NEW SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Data Limit</Label>
                <div className="flex rounded-lg border overflow-hidden text-sm">
                  <button
                    type="button"
                    onClick={() => setHotspotForm({ ...hotspotForm, limitation_type: 'UNLIMITED' })}
                    className={`px-3 py-1.5 transition-colors ${
                      hotspotForm.limitation_type === 'UNLIMITED'
                        ? 'bg-primary text-white font-semibold'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Unlimited
                  </button>
                  <button
                    type="button"
                    onClick={() => setHotspotForm({ ...hotspotForm, limitation_type: 'DATA' })}
                    className={`px-3 py-1.5 transition-colors ${
                      hotspotForm.limitation_type === 'DATA'
                        ? 'bg-primary text-white font-semibold'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Limited
                  </button>
                </div>
              </div>

              {hotspotForm.limitation_type === 'DATA' && (
                <div className="flex gap-2 items-center p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-warning">Data Cap</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hotspotForm.data_limit_value}
                      onChange={(e) => setHotspotForm({ ...hotspotForm, data_limit_value: e.target.value })}
                      placeholder="e.g., 7"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-warning">Unit</Label>
                    <Select
                      value={hotspotForm.data_limit_unit}
                      onValueChange={(v) => setHotspotForm({ ...hotspotForm, data_limit_unit: v as 'MB' | 'GB' })}
                    >
                      <SelectTrigger className="h-9 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                        <SelectItem value="GB">GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {hotspotForm.limitation_type === 'UNLIMITED' && (
                <p className="text-xs text-muted-foreground">
                  No data cap — users can use as much data as they want within the time period.
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea rows={2} value={hotspotForm.description}
                onChange={(e) => setHotspotForm({ ...hotspotForm, description: e.target.value })}
                placeholder="Describe the plan benefits..." />
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Features (one per line)</Label>
              <Textarea rows={3} value={hotspotForm.features}
                onChange={(e) => setHotspotForm({ ...hotspotForm, features: e.target.value })}
                placeholder={`e.g., 10 Mbps Speed\n1 Hour Access\nSingle Device`} />
            </div>

            {/* Active / Popular toggles */}
            <div className="flex flex-wrap items-center gap-6 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch checked={hotspotForm.is_active}
                  onCheckedChange={(c) => setHotspotForm({ ...hotspotForm, is_active: c })} />
                <Label className="text-sm">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={hotspotForm.is_popular}
                  onCheckedChange={(c) => setHotspotForm({ ...hotspotForm, is_popular: c })} />
                <Label className="text-sm">
                  <Zap className="w-3 h-3 inline mr-1 text-warning" />
                  Popular
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsHotspotCreateOpen(false); resetHotspotForm() }}>Cancel</Button>
            <Button onClick={handleHotspotCustomCreate} disabled={hotspotCreating || !hotspotForm.name || !hotspotForm.price}>
              {hotspotCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditingHotspot ? 'Update Hotspot Plan' : 'Create Hotspot Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Details Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Plan Details</SheetTitle>
            <SheetDescription>{selectedPlan?.name}</SheetDescription>
          </SheetHeader>
          {selectedPlan && (
            <div className="mt-6 space-y-6">
              <div className="flex gap-2">
                {getTypeBadge(selectedPlan.plan_type)}
                <Badge variant={selectedPlan.is_active ? "default" : "secondary"}>
                  {selectedPlan.is_active ? "Active" : "Inactive"}
                </Badge>
                {selectedPlan.is_popular && (
                  <Badge className="bg-primary text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>

              <div className="text-center py-6 bg-muted rounded-lg">
                <p className="text-4xl font-bold">{formatCurrency(selectedPlan.price ?? selectedPlan.base_price)}</p>
                <p className="text-muted-foreground flex items-center justify-center gap-1">
                  {(() => {
                    const Icon = getValidityIcon(selectedPlan)
                    return <Icon className="w-4 h-4" />
                  })()}
                  {formatDuration(selectedPlan)}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedPlan.download_speed && (
                  <div>
                    <p className="text-muted-foreground">Download Speed</p>
                    <p className="font-medium">{selectedPlan.download_speed} {selectedPlan.speed_unit || 'Mbps'}</p>
                  </div>
                )}
                {selectedPlan.upload_speed && (
                  <div>
                    <p className="text-muted-foreground">Upload Speed</p>
                    <p className="font-medium">{selectedPlan.upload_speed} {selectedPlan.speed_unit || 'Mbps'}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Data Limit</p>
                  <p className="font-medium">{selectedPlan.data_limit ? `${selectedPlan.data_limit} GB` : 'Unlimited'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subscribers</p>
                  <p className="font-medium">{getPlanSubscriberCount(selectedPlan)}</p>
                </div>
                {selectedPlan.setup_fee && (
                  <div>
                    <p className="text-muted-foreground">Setup Fee</p>
                    <p className="font-medium">{formatCurrency(selectedPlan.setup_fee)}</p>
                  </div>
                )}
              </div>

              {selectedPlan.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Description</p>
                    <p>{selectedPlan.description}</p>
                  </div>
                </>
              )}

              {selectedPlan.features && selectedPlan.features.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-3">Features</p>
                    <div className="space-y-2">
                      {selectedPlan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  setIsDetailOpen(false)
                  openEditDialog(selectedPlan)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleToggleActive(selectedPlan)}
                  disabled={togglingId === selectedPlan.id}
                >
                  {togglingId === selectedPlan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedPlan.is_active ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => { if (!open) setPlanToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">&ldquo;{planToDelete?.name}&rdquo;</span>?
              This action cannot be undone. The plan will be permanently removed from the system.
              {getPlanSubscriberCount(planToDelete) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This plan has {getPlanSubscriberCount(planToDelete)} active subscriber(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={!!deletingId}
              className="bg-destructive hover:bg-destructive/90 focus:ring-red-600"
            >
              {deletingId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}