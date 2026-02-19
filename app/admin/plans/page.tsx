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
  Activity,
  HardDrive,
  Gauge,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BarChart3,
  MapPin,
  LinkIcon,
  Unlink,
  Power,
  Info,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Plan, PlanType, PlanDashboardStats, SubnetPrefixOption, CIDROption, SubnetPrefixOptionsResponse, IPPool } from "@/lib/types"

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num || 0)
}

const getTypeBadge = (type: PlanType) => {
  const config: Record<string, { icon: typeof Wifi; class: string; label: string }> = {
    INTERNET: { icon: Globe, class: "bg-green-100 text-green-700 border-green-200", label: "Internet" },
    ADDON: { icon: Package, class: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Add-on" },
    BUNDLE: { icon: Package, class: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Bundle" },
    TOPUP: { icon: CreditCard, class: "bg-pink-100 text-pink-700 border-pink-200", label: "Top-up" },
    HOTSPOT: { icon: Wifi, class: "bg-blue-100 text-blue-700 border-blue-200", label: "Hotspot" },
    PPPOE: { icon: Globe, class: "bg-purple-100 text-purple-700 border-purple-200", label: "PPPoE" },
    STATIC: { icon: Server, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Static IP" },
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
    id: 'hotspot-30min', name: '30 Minutes', icon: Coffee, color: 'bg-amber-500',
    description: 'Quick browse session',
    config: { name: '30 Min Access', base_price: 20, validity_type: 'MINUTES', validity_minutes: 30, download_speed: 5, upload_speed: 5, max_sessions: 1, features: ['5 Mbps Speed', '30 Minutes', 'Single Device'] }
  },
  {
    id: 'hotspot-1hr', name: '1 Hour', icon: Timer, color: 'bg-blue-500',
    description: 'Standard session',
    config: { name: '1 Hour Access', base_price: 30, validity_type: 'HOURS', validity_hours: 1, download_speed: 10, upload_speed: 5, max_sessions: 1, features: ['10 Mbps Speed', '1 Hour', 'Single Device'] }
  },
  {
    id: 'hotspot-3hr', name: '3 Hours', icon: Globe, color: 'bg-green-500',
    description: 'Extended session',
    config: { name: '3 Hour Access', base_price: 70, validity_type: 'HOURS', validity_hours: 3, download_speed: 15, upload_speed: 10, max_sessions: 2, features: ['15 Mbps Speed', '3 Hours', '2 Devices'] }
  },
  {
    id: 'hotspot-daily', name: '24 Hours', icon: Clock, color: 'bg-purple-500',
    description: 'Full day access',
    config: { name: 'Daily Pass', base_price: 150, validity_type: 'HOURS', validity_hours: 24, download_speed: 20, upload_speed: 10, max_sessions: 3, features: ['20 Mbps Speed', '24 Hours', '3 Devices'] }
  },
  {
    id: 'hotspot-weekly', name: '7 Days', icon: Zap, color: 'bg-orange-500',
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
function PlanCard({ plan, onView, onEdit, onToggle, togglingId }: {
  plan: Plan
  onView: (p: Plan) => void
  onEdit: (p: Plan) => void
  onToggle: (p: Plan) => void
  togglingId: number | null
}) {
  return (
    <Card className={`relative ${plan.is_popular ? "ring-2 ring-blue-500" : ""}`}>
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-500 text-white">
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
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>{plan.download_speed} Mbps ↓</span>
            </div>
          )}
          {plan.upload_speed && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500 rotate-180" />
              <span>{plan.upload_speed} Mbps ↑</span>
            </div>
          )}
        </div>

        {plan.features && plan.features.length > 0 && (
          <div className="space-y-2">
            {plan.features.slice(0, 3).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
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
            {plan.subscriber_count || 0} subscribers
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
  const [dashboardStats, setDashboardStats] = useState<PlanDashboardStats | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  
  // IP Pool state (for IPv4 Networks tab)
  const [ipPools, setIPPools] = useState<IPPool[]>([])
  const [ipPoolsLoading, setIPPoolsLoading] = useState(false)

  // IPv4 Networks sub-tab & search state
  const [ipv4SubTab, setIpv4SubTab] = useState<'pools' | 'static' | 'mapping'>('pools')
  const [poolSearchQuery, setPoolSearchQuery] = useState('')
  const [isPoolCreateOpen, setIsPoolCreateOpen] = useState(false)
  const [isPoolEditOpen, setIsPoolEditOpen] = useState(false)
  const [isPoolDeleteOpen, setIsPoolDeleteOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<IPPool | null>(null)
  const [poolSubmitting, setPoolSubmitting] = useState(false)
  const [poolForm, setPoolForm] = useState({
    name: '', pool_type: 'PPPOE' as IPPool['pool_type'],
    subnet_prefix: '10.50', subnet_octet: '', cidr_prefix: '24',
    gateway: '', dns_servers: '', description: '', is_active: true,
  })
  const [expandedPoolId, setExpandedPoolId] = useState<number | null>(null)

  // Hotspot quick-create state
  const [isHotspotCreateOpen, setIsHotspotCreateOpen] = useState(false)
  const [hotspotCreating, setHotspotCreating] = useState(false)
  const [hotspotForm, setHotspotForm] = useState({
    name: '', price: '', download_speed: '', upload_speed: '',
    validity_type: 'HOURS' as string, duration_days: '1', validity_hours: '1', validity_minutes: '30',
    max_sessions: '1', description: '', features: '',
  })

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Filter states
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // UI states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Form state - Enhanced with all fields
  const [planForm, setPlanForm] = useState({
    name: '',
    plan_type: 'PPPOE' as PlanType,
    description: '',
    // Speed settings
    download_speed: '',
    upload_speed: '',
    speed_unit: 'MBPS' as 'MBPS' | 'KBPS',
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

  // Fetch IP Pools (for IPv4 Networks tab)
  const fetchIPPools = useCallback(async () => {
    setIPPoolsLoading(true)
    try {
      const res = await adminApi.getIPPools({ page_size: '100', ordering: '-created_at' })
      setIPPools(res.results || [])
    } catch (error) {
      console.error('Failed to fetch IP pools:', error)
    } finally {
      setIPPoolsLoading(false)
    }
  }, [])

  // Pool CRUD helpers
  const resetPoolForm = () => {
    setPoolForm({
      name: '', pool_type: 'PPPOE', subnet_prefix: '10.50', subnet_octet: '',
      cidr_prefix: '24', gateway: '', dns_servers: '', description: '', is_active: true,
    })
    setSelectedPool(null)
  }

  // Pool form computed preview
  const poolSubnetPreview = useMemo(() => {
    const { subnet_prefix, subnet_octet, cidr_prefix } = poolForm
    if (!subnet_prefix || !subnet_octet) return null
    const octet = parseInt(subnet_octet)
    if (isNaN(octet) || octet < 0 || octet > 255) return null
    const cidrNum = parseInt(cidr_prefix)
    const base = `${subnet_prefix}.${octet}`
    const totalIPs = Math.pow(2, 32 - cidrNum)
    const usableIPs = totalIPs - 3
    return {
      network: `${base}.0`,
      gateway: `${base}.1`,
      startIP: `${base}.1`,
      endIP: `${base}.${totalIPs - 2}`,
      broadcast: `${base}.${totalIPs - 1}`,
      cidr: `${base}.0/${cidrNum}`,
      usableIPs,
    }
  }, [poolForm.subnet_prefix, poolForm.subnet_octet, poolForm.cidr_prefix])

  const handleCreatePool = async () => {
    if (!poolForm.name.trim()) { toast.error('Pool name is required'); return }
    if (!poolForm.subnet_octet) { toast.error('Subnet octet is required'); return }
    setPoolSubmitting(true)
    try {
      await adminApi.createIPPool({
        name: poolForm.name,
        pool_type: poolForm.pool_type,
        subnet_prefix: poolForm.subnet_prefix,
        subnet_octet: parseInt(poolForm.subnet_octet),
        cidr_prefix: parseInt(poolForm.cidr_prefix),
        gateway: poolSubnetPreview?.gateway || '',
        dns_servers: poolForm.dns_servers || '8.8.8.8,8.8.4.4',
        description: poolForm.description,
        is_active: poolForm.is_active,
      })
      toast.success(`IP Pool "${poolForm.name}" created successfully`)
      setIsPoolCreateOpen(false)
      resetPoolForm()
      fetchIPPools()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create IP pool')
    } finally {
      setPoolSubmitting(false)
    }
  }

  const openPoolEdit = (pool: IPPool) => {
    setSelectedPool(pool)
    setPoolForm({
      name: pool.name,
      pool_type: pool.pool_type,
      subnet_prefix: pool.subnet_prefix || '10.50',
      subnet_octet: pool.subnet_octet?.toString() || '',
      cidr_prefix: pool.cidr_prefix?.toString() || '24',
      gateway: pool.gateway || '',
      dns_servers: pool.dns_servers || '',
      description: pool.description || '',
      is_active: pool.is_active,
    })
    setIsPoolEditOpen(true)
  }

  const handleUpdatePool = async () => {
    if (!selectedPool) return
    setPoolSubmitting(true)
    try {
      await adminApi.updateIPPool(selectedPool.id, {
        name: poolForm.name,
        pool_type: poolForm.pool_type,
        gateway: poolForm.gateway || poolSubnetPreview?.gateway || '',
        dns_servers: poolForm.dns_servers,
        description: poolForm.description,
        is_active: poolForm.is_active,
      })
      toast.success(`Pool "${poolForm.name}" updated`)
      setIsPoolEditOpen(false)
      resetPoolForm()
      fetchIPPools()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update pool')
    } finally {
      setPoolSubmitting(false)
    }
  }

  const handleDeletePool = async () => {
    if (!selectedPool) return
    setPoolSubmitting(true)
    try {
      await adminApi.deleteIPPool(selectedPool.id)
      toast.success(`Pool "${selectedPool.name}" deleted`)
      setIsPoolDeleteOpen(false)
      setSelectedPool(null)
      fetchIPPools()
      fetchPlans()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete pool')
    } finally {
      setPoolSubmitting(false)
    }
  }

  const handleTogglePoolActive = async (pool: IPPool) => {
    try {
      await adminApi.updateIPPool(pool.id, { is_active: !pool.is_active })
      toast.success(`Pool "${pool.name}" ${pool.is_active ? 'disabled' : 'enabled'}`)
      fetchIPPools()
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle pool')
    }
  }

  // Filtered pools for search
  const filteredPools = useMemo(() => {
    if (!poolSearchQuery.trim()) return ipPools
    const q = poolSearchQuery.toLowerCase()
    return ipPools.filter(pool => {
      const linkedPlans = plans.filter(p => p.ip_pool === pool.id)
      return (
        pool.name.toLowerCase().includes(q) ||
        pool.start_ip?.toLowerCase().includes(q) ||
        pool.end_ip?.toLowerCase().includes(q) ||
        pool.gateway?.toLowerCase().includes(q) ||
        pool.cidr_notation?.toLowerCase().includes(q) ||
        pool.pool_type?.toLowerCase().includes(q) ||
        linkedPlans.some(p => p.name.toLowerCase().includes(q))
      )
    })
  }, [ipPools, plans, poolSearchQuery])

  // Hotspot quick-create from preset
  const handleHotspotPresetCreate = async (preset: HotspotPreset) => {
    setHotspotCreating(true)
    try {
      await adminApi.createPlan({
        name: preset.config.name,
        plan_type: 'HOTSPOT',
        base_price: preset.config.base_price.toString(),
        validity_type: preset.config.validity_type,
        duration_days: preset.config.duration_days,
        validity_hours: preset.config.validity_hours,
        validity_minutes: preset.config.validity_minutes,
        download_speed: preset.config.download_speed,
        upload_speed: preset.config.upload_speed,
        max_sessions: preset.config.max_sessions,
        features: preset.config.features,
        is_active: true,
        is_public: true,
      })
      toast.success(`"${preset.config.name}" plan created!`)
      fetchPlans()
      fetchDashboardStats()
    } catch (error: any) {
      toast.error(error.message || `Failed to create ${preset.name} plan`)
    } finally {
      setHotspotCreating(false)
    }
  }

  // Hotspot custom create handler
  const handleHotspotCustomCreate = async () => {
    if (!hotspotForm.name || !hotspotForm.price) {
      toast.error('Name and price are required')
      return
    }
    setHotspotCreating(true)
    try {
      await adminApi.createPlan({
        name: hotspotForm.name,
        plan_type: 'HOTSPOT',
        base_price: hotspotForm.price,
        description: hotspotForm.description || undefined,
        validity_type: hotspotForm.validity_type,
        duration_days: hotspotForm.validity_type === 'DAYS' ? parseInt(hotspotForm.duration_days) : undefined,
        validity_hours: hotspotForm.validity_type === 'HOURS' ? parseInt(hotspotForm.validity_hours) : undefined,
        validity_minutes: hotspotForm.validity_type === 'MINUTES' ? parseInt(hotspotForm.validity_minutes) : undefined,
        download_speed: hotspotForm.download_speed ? parseInt(hotspotForm.download_speed) : undefined,
        upload_speed: hotspotForm.upload_speed ? parseInt(hotspotForm.upload_speed) : undefined,
        max_sessions: hotspotForm.max_sessions ? parseInt(hotspotForm.max_sessions) : 1,
        features: hotspotForm.features ? hotspotForm.features.split('\n').filter(f => f.trim()) : undefined,
        is_active: true,
        is_public: true,
      })
      toast.success('Hotspot plan created!')
      setIsHotspotCreateOpen(false)
      setHotspotForm({ name: '', price: '', download_speed: '', upload_speed: '', validity_type: 'HOURS', duration_days: '1', validity_hours: '1', validity_minutes: '30', max_sessions: '1', description: '', features: '' })
      fetchPlans()
      fetchDashboardStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create hotspot plan')
    } finally {
      setHotspotCreating(false)
    }
  }

  // Fetch data
  const fetchPlans = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-created_at' }
      if (activeTab !== 'all' && activeTab !== 'ipv4') {
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
      fetchIPPools()
      loadSubnetPrefixOptions()
    }
  }, [fetchPlans, fetchDashboardStats])

  // Re-fetch when tab changes
  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchPlans()
    }
  }, [activeTab, fetchPlans])

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchPlans(), fetchDashboardStats(), fetchIPPools()])
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Filter plans by search
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [plans, searchQuery])

  // Stats - use dashboard stats if available, otherwise calculate from plans
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
    // Fallback to calculated stats
    return {
      total: plans.length,
      active: plans.filter(p => p.is_active).length,
      hotspot: plans.filter(p => p.plan_type === 'HOTSPOT').length,
      pppoe: plans.filter(p => p.plan_type === 'PPPOE').length,
      static: plans.filter(p => p.plan_type === 'STATIC').length,
      subscribers: plans.reduce((sum, p) => sum + (p.subscriber_count || 0), 0),
    }
  }, [dashboardStats, plans])

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
    } catch (error: any) {
      console.error('Failed to create plan:', error)
      toast.error(error.message || 'Failed to create plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit plan
  const openEditDialog = (plan: Plan) => {
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
    } catch (error: any) {
      console.error('Failed to update plan:', error)
      toast.error(error.message || 'Failed to update plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async (plan: Plan) => {
    setTogglingId(plan.id)
    try {
      await adminApi.togglePlanActive(plan.id)
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`)
      fetchPlans()
      fetchDashboardStats()
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-6">
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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plans Management</h1>
          <p className="text-muted-foreground">
            Manage internet plans, pricing, and features
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => {
            if (activeTab === 'hotspot') {
              setIsHotspotCreateOpen(true)
            } else if (activeTab === 'ipv4') {
              resetPoolForm()
              loadSubnetPrefixOptions()
              setIsPoolCreateOpen(true)
            } else {
              resetForm()
              setIsCreateOpen(true)
            }
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'hotspot' ? 'Custom Hotspot' : activeTab === 'ipv4' ? 'Add IP Pool' : 'Add Plan'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.subscribers}</p>
                <p className="text-xs text-muted-foreground">Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("hotspot")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.hotspot}</p>
                <p className="text-xs text-muted-foreground">Hotspot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("pppoe")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.pppoe}</p>
                <p className="text-xs text-muted-foreground">PPPoE</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("static")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Server className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.static}</p>
                <p className="text-xs text-muted-foreground">Static IP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Plans</TabsTrigger>
            <TabsTrigger value="hotspot">
              <Wifi className="w-3.5 h-3.5 mr-1" />
              Hotspot
            </TabsTrigger>
            <TabsTrigger value="pppoe">
              <Globe className="w-3.5 h-3.5 mr-1" />
              PPPoE
            </TabsTrigger>
            <TabsTrigger value="static">Static IP</TabsTrigger>
            <TabsTrigger value="ipv4">
              <Network className="w-3.5 h-3.5 mr-1" />
              IPv4 Networks
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTab !== 'ipv4' ? (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        ) : (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search pools by name, IP, or linked plan..."
              value={poolSearchQuery}
              onChange={(e) => setPoolSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* ====== HOTSPOT TAB — Quick Create Cards + Plan Listing ====== */}
      {activeTab === 'hotspot' && (
        <>
          {/* Quick Create Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Create Hotspot Plans
              </CardTitle>
              <CardDescription>
                One-click to create industry-standard hotspot packages. Click any card to instantly create that plan.
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

          {/* Existing Hotspot Plans Listing */}
          {filteredPlans.length === 0 ? (
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
                <PlanCard key={plan.id} plan={plan} onView={handleViewDetails} onEdit={openEditDialog} onToggle={handleToggleActive} togglingId={togglingId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ====== IPv4 NETWORKS TAB — Enhanced Lipanet-style with Sub-tabs ====== */}
      {activeTab === 'ipv4' && (
        <div className="space-y-6">
          {/* Network Summary Stats */}
          {(() => {
            const totalPools = ipPools.length
            const activePools = ipPools.filter(p => p.is_active).length
            const totalIPs = ipPools.reduce((sum, p) => sum + (p.total_ips || 0), 0)
            const usedIPs = ipPools.reduce((sum, p) => sum + (p.used_ips || 0), 0)
            const availIPs = totalIPs - usedIPs
            const utilization = totalIPs > 0 ? ((usedIPs / totalIPs) * 100).toFixed(1) : '0'
            const plansWithPool = plans.filter(p => p.ip_pool)
            const plansWithoutPool = plans.filter(p => !p.ip_pool && (p.plan_type === 'PPPOE' || p.plan_type === 'STATIC'))
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIpv4SubTab('pools')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Network className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-2xl font-bold">{totalPools}</p><p className="text-xs text-muted-foreground">IP Pools</p></div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIpv4SubTab('pools')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg"><Check className="w-5 h-5 text-green-600" /></div>
                    <div><p className="text-2xl font-bold text-green-600">{activePools}</p><p className="text-xs text-muted-foreground">Active Pools</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><HardDrive className="w-5 h-5 text-purple-600" /></div>
                    <div><p className="text-2xl font-bold">{totalIPs.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total IPs</p></div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIpv4SubTab('static')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg"><Shield className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-2xl font-bold text-emerald-600">{availIPs.toLocaleString()}</p><p className="text-xs text-muted-foreground">Available IPs</p></div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIpv4SubTab('mapping')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg"><LinkIcon className="w-5 h-5 text-indigo-600" /></div>
                    <div><p className="text-2xl font-bold text-indigo-600">{plansWithPool.length}</p><p className="text-xs text-muted-foreground">Plans Linked</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg"><Activity className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-2xl font-bold text-amber-600">{utilization}%</p><p className="text-xs text-muted-foreground">Utilization</p></div>
                  </CardContent>
                </Card>
              </div>
            )
          })()}

          {/* Sub-tabs: IP Pools | Static IP Blocks | Pool-Plan Mapping */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex border rounded-lg p-1 bg-muted/30 w-fit">
              <button
                onClick={() => setIpv4SubTab('pools')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  ipv4SubTab === 'pools' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Network className="w-4 h-4 inline mr-1.5" />
                IP Pools
              </button>
              <button
                onClick={() => setIpv4SubTab('static')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  ipv4SubTab === 'static' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-1.5" />
                Static IP Blocks
              </button>
              <button
                onClick={() => setIpv4SubTab('mapping')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  ipv4SubTab === 'mapping' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-1.5" />
                Pool-Plan Mapping
              </button>
            </div>
            {poolSearchQuery && (
              <Badge variant="secondary" className="w-fit">
                {filteredPools.length} of {ipPools.length} pools
              </Badge>
            )}
          </div>

          {/* ======= IP POOLS Sub-tab ======= */}
          {ipv4SubTab === 'pools' && (
            <>
              {ipPoolsLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading IP pools...</p>
                  </CardContent>
                </Card>
              ) : filteredPools.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="font-medium text-lg">{poolSearchQuery ? 'No Pools Match Your Search' : 'No IP Pools Created Yet'}</p>
                    <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                      {poolSearchQuery 
                        ? 'Try a different search term or clear the search to see all pools.'
                        : 'IP pools define the address ranges for your customers. Create one to get started.'
                      }
                    </p>
                    {!poolSearchQuery && (
                      <Button size="sm" className="mt-4" onClick={() => { resetPoolForm(); loadSubnetPrefixOptions(); setIsPoolCreateOpen(true) }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create IP Pool
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Network className="w-5 h-5" />
                        IP Address Pools
                      </CardTitle>
                      <CardDescription>
                        {filteredPools.length} pool{filteredPools.length !== 1 ? 's' : ''} · {filteredPools.reduce((s, p) => s + (p.total_ips || 0), 0).toLocaleString()} total IPs
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => { resetPoolForm(); loadSubnetPrefixOptions(); setIsPoolCreateOpen(true) }}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Pool
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium w-8"></th>
                            <th className="text-left p-3 font-medium">Pool Name</th>
                            <th className="text-left p-3 font-medium">Linked Plan</th>
                            <th className="text-left p-3 font-medium">Start IP</th>
                            <th className="text-left p-3 font-medium">End IP</th>
                            <th className="text-center p-3 font-medium">IPs</th>
                            <th className="text-center p-3 font-medium">Utilization</th>
                            <th className="text-center p-3 font-medium">Status</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPools.map((pool) => {
                            const utilPct = pool.total_ips > 0 ? ((pool.used_ips / pool.total_ips) * 100) : 0
                            const utilColor = utilPct > 90 ? 'text-red-600' : utilPct > 70 ? 'text-amber-600' : 'text-green-600'
                            const linkedPlans = plans.filter(p => p.ip_pool === pool.id)
                            const isExpanded = expandedPoolId === pool.id
                            return (
                              <React.Fragment key={pool.id}>
                                <tr className={`border-b hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}>
                                  <td className="p-3">
                                    <button 
                                      onClick={() => setExpandedPoolId(isExpanded ? null : pool.id)}
                                      className="p-1 hover:bg-muted rounded"
                                    >
                                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium">{pool.name}</div>
                                      <Badge variant="outline" className={
                                        pool.pool_type === 'PPPOE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        pool.pool_type === 'STATIC' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        pool.pool_type === 'HOTSPOT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-gray-50'
                                      }>
                                        {pool.pool_type}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                      {pool.cidr_notation || `${pool.start_ip}/${pool.cidr_prefix || '24'}`}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {linkedPlans.length > 0 ? (
                                      <div className="space-y-1">
                                        {linkedPlans.slice(0, 2).map(p => (
                                          <Badge key={p.id} variant="secondary" className="text-xs mr-1">
                                            <LinkIcon className="w-3 h-3 mr-1" />
                                            {p.name}
                                          </Badge>
                                        ))}
                                        {linkedPlans.length > 2 && (
                                          <span className="text-xs text-muted-foreground">+{linkedPlans.length - 2} more</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Unlink className="w-3 h-3" />
                                        No plans linked
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono text-xs">{pool.start_ip}</td>
                                  <td className="p-3 font-mono text-xs">{pool.end_ip}</td>
                                  <td className="p-3 text-center">
                                    <span className="text-green-600 font-medium">{pool.available_ips ?? pool.total_ips - pool.used_ips}</span>
                                    <span className="text-muted-foreground">/{pool.total_ips}</span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${utilPct > 90 ? 'bg-red-500' : utilPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                          style={{ width: `${Math.min(utilPct, 100)}%` }} />
                                      </div>
                                      <span className={`text-xs font-medium ${utilColor}`}>{utilPct.toFixed(0)}%</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge variant={pool.is_active ? "default" : "secondary"} className="text-xs">
                                      {pool.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { loadSubnetPrefixOptions(); openPoolEdit(pool) }}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit Pool
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleTogglePoolActive(pool)}>
                                          <Power className="w-4 h-4 mr-2" />
                                          {pool.is_active ? 'Disable' : 'Enable'}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => { setSelectedPool(pool); setIsPoolDeleteOpen(true) }}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete Pool
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                                {/* Expanded Row Details */}
                                {isExpanded && (
                                  <tr className="bg-muted/10">
                                    <td colSpan={9} className="p-4">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <p className="text-muted-foreground text-xs mb-1">Gateway</p>
                                          <p className="font-mono">{pool.gateway || '—'}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground text-xs mb-1">DNS Servers</p>
                                          <p className="font-mono text-xs">{pool.dns_servers || '—'}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground text-xs mb-1">Description</p>
                                          <p className="text-xs">{pool.description || 'No description'}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground text-xs mb-1">Created</p>
                                          <p className="text-xs">{pool.created_at ? new Date(pool.created_at).toLocaleDateString() : '—'}</p>
                                        </div>
                                      </div>
                                      {linkedPlans.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                          <p className="text-muted-foreground text-xs mb-2 font-medium">Linked Plans ({linkedPlans.length})</p>
                                          <div className="flex flex-wrap gap-2">
                                            {linkedPlans.map(p => (
                                              <Badge key={p.id} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => handleViewDetails(p)}>
                                                {p.name} — {p.plan_type} — {formatCurrency(p.price ?? p.base_price)}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ======= STATIC IP BLOCKS Sub-tab ======= */}
          {ipv4SubTab === 'static' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Static IP Blocks
                </CardTitle>
                <CardDescription>
                  Individual IP addresses allocated to customers from your pools
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ipPools.filter(p => p.pool_type === 'STATIC').length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="font-medium">No Static IP Pools</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Create a pool with type &quot;STATIC&quot; to manage static IP blocks.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => { resetPoolForm(); setPoolForm(prev => ({ ...prev, pool_type: 'STATIC' })); loadSubnetPrefixOptions(); setIsPoolCreateOpen(true) }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Static Pool
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ipPools.filter(p => p.pool_type === 'STATIC').map(pool => {
                      const linkedPlans = plans.filter(p => p.ip_pool === pool.id)
                      return (
                        <div key={pool.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                {pool.name}
                                <Badge variant={pool.is_active ? "default" : "secondary"} className="text-xs">{pool.is_active ? 'Active' : 'Inactive'}</Badge>
                              </h4>
                              <p className="text-sm text-muted-foreground font-mono">{pool.cidr_notation || `${pool.start_ip} — ${pool.end_ip}`}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{pool.available_ips ?? pool.total_ips - pool.used_ips}</p>
                              <p className="text-xs text-muted-foreground">of {pool.total_ips} available</p>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                            <div 
                              className={`h-full ${pool.used_ips / pool.total_ips > 0.9 ? 'bg-red-500' : pool.used_ips / pool.total_ips > 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${(pool.used_ips / pool.total_ips * 100)}%` }} 
                            />
                          </div>
                          {linkedPlans.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-muted-foreground mr-1">Plans:</span>
                              {linkedPlans.map(p => (
                                <Badge key={p.id} variant="outline" className="text-xs">{p.name}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ======= POOL-PLAN MAPPING Sub-tab ======= */}
          {ipv4SubTab === 'mapping' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Pool-Plan Mapping
                </CardTitle>
                <CardDescription>
                  All plans and their IP pool assignments — plans need an IP pool to assign addresses to subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No plans created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium">Plan Name</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Speed</th>
                          <th className="text-left p-3 font-medium">Price</th>
                          <th className="text-left p-3 font-medium">IP Pool</th>
                          <th className="text-center p-3 font-medium">Pool IPs</th>
                          <th className="text-center p-3 font-medium">Subscribers</th>
                          <th className="text-center p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map((plan) => {
                          const linkedPool = ipPools.find(p => p.id === plan.ip_pool)
                          return (
                            <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => handleViewDetails(plan)}>
                              <td className="p-3">
                                <div className="font-medium">{plan.name}</div>
                                <div className="text-xs text-muted-foreground">{plan.validity_display || `${plan.duration_days || 30} days`}</div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className={
                                  plan.plan_type === 'PPPOE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  plan.plan_type === 'HOTSPOT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  plan.plan_type === 'STATIC' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-gray-50 text-gray-700'
                                }>
                                  {plan.plan_type}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <span className="text-sm">{plan.speed_display || `${plan.download_speed || '—'}/${plan.upload_speed || '—'} ${plan.speed_unit || 'Mbps'}`}</span>
                              </td>
                              <td className="p-3 font-medium">{formatCurrency(plan.price ?? plan.base_price)}</td>
                              <td className="p-3">
                                {plan.ip_pool ? (
                                  <div>
                                    <span className="text-sm font-medium text-purple-700 flex items-center gap-1">
                                      <LinkIcon className="w-3 h-3" />
                                      {plan.ip_pool_name || linkedPool?.name || `Pool #${plan.ip_pool}`}
                                    </span>
                                    {(plan.ip_pool_range || linkedPool?.ip_range) && (
                                      <div className="text-xs text-muted-foreground font-mono">{plan.ip_pool_range || linkedPool?.ip_range}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <Unlink className="w-3 h-3" />
                                    No pool assigned
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {linkedPool ? (
                                  <span className="text-sm">{linkedPool.available_ips ?? (linkedPool.total_ips - linkedPool.used_ips)}/{linkedPool.total_ips}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-sm font-medium">{plan.subscriber_count ?? plan.subscribers_count ?? 0}</span>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant={plan.is_active ? "default" : "secondary"} className="text-xs">
                                  {plan.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ====== ALL / PPPoE / STATIC TABS — Standard Plan Card Grid ====== */}
      {(activeTab === 'all' || activeTab === 'pppoe' || activeTab === 'static') && (
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
                <PlanCard key={plan.id} plan={plan} onView={handleViewDetails} onEdit={openEditDialog} onToggle={handleToggleActive} togglingId={togglingId} />
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
              <Network className="w-5 h-5 text-primary" />
              Add New PPPoE Plan
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
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
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
                      <SelectItem value="STATIC">Static IP</SelectItem>
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
                  <Select value={planForm.speed_unit}
                    onValueChange={(v) => setPlanForm({ ...planForm, speed_unit: v as 'MBPS' | 'KBPS' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MBPS">Mbps</SelectItem>
                      <SelectItem value="KBPS">Kbps</SelectItem>
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
                  <Zap className="w-3 h-3 inline mr-1 text-yellow-500" />
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

      {/* Hotspot Custom Create Dialog */}
      <Dialog open={isHotspotCreateOpen} onOpenChange={setIsHotspotCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-500" />
              Create Custom Hotspot Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Plan Name</Label>
              <Input value={hotspotForm.name}
                onChange={(e) => setHotspotForm({ ...hotspotForm, name: e.target.value })}
                placeholder="e.g., Weekend Special 12hr" />
            </div>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price (KES)</Label>
              <Input type="number" value={hotspotForm.price}
                onChange={(e) => setHotspotForm({ ...hotspotForm, price: e.target.value })}
                placeholder="e.g., 100" />
            </div>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Devices</Label>
              <Input type="number" min={1} value={hotspotForm.max_sessions}
                onChange={(e) => setHotspotForm({ ...hotspotForm, max_sessions: e.target.value })}
                placeholder="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHotspotCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleHotspotCustomCreate} disabled={hotspotCreating || !hotspotForm.name || !hotspotForm.price}>
              {hotspotCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Hotspot Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== IP POOL CREATE DIALOG ====== */}
      <Dialog open={isPoolCreateOpen} onOpenChange={setIsPoolCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Create IP Pool
            </DialogTitle>
            <DialogDescription>
              Define a new IP address range for your network infrastructure
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Pool Name */}
            <div className="space-y-2">
              <Label htmlFor="pool-name">Pool Name *</Label>
              <Input
                id="pool-name"
                placeholder="e.g., Main PPPoE Pool"
                value={poolForm.name}
                onChange={(e) => setPoolForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Pool Type */}
            <div className="space-y-2">
              <Label>Pool Type *</Label>
              <Select value={poolForm.pool_type} onValueChange={(v) => setPoolForm(prev => ({ ...prev, pool_type: v as IPPool['pool_type'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PPPOE">PPPoE</SelectItem>
                  <SelectItem value="STATIC">Static IP</SelectItem>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                  <SelectItem value="DHCP">DHCP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subnet Builder */}
            <div className="space-y-3">
              <Label>Subnet Configuration *</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Prefix</Label>
                  <Select value={poolForm.subnet_prefix} onValueChange={(v) => setPoolForm(prev => ({ ...prev, subnet_prefix: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subnetPrefixes.length > 0 ? subnetPrefixes.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      )) : (
                        <>
                          <SelectItem value="10.50">10.50.x.x</SelectItem>
                          <SelectItem value="10.60">10.60.x.x</SelectItem>
                          <SelectItem value="172.16">172.16.x.x</SelectItem>
                          <SelectItem value="192.168">192.168.x.x</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">3rd Octet</Label>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    placeholder="0-255"
                    value={poolForm.subnet_octet}
                    onChange={(e) => setPoolForm(prev => ({ ...prev, subnet_octet: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">CIDR</Label>
                  <Select value={poolForm.cidr_prefix} onValueChange={(v) => setPoolForm(prev => ({ ...prev, cidr_prefix: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cidrOptions.length > 0 ? cidrOptions.map(c => (
                        <SelectItem key={c.value} value={c.value.toString()}>{c.label}</SelectItem>
                      )) : (
                        <>
                          <SelectItem value="24">/24 (254 hosts)</SelectItem>
                          <SelectItem value="25">/25 (126 hosts)</SelectItem>
                          <SelectItem value="26">/26 (62 hosts)</SelectItem>
                          <SelectItem value="27">/27 (30 hosts)</SelectItem>
                          <SelectItem value="28">/28 (14 hosts)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Subnet Preview */}
              {poolSubnetPreview && (
                <div className="bg-muted/50 border rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CIDR:</span>
                    <span className="font-mono font-medium">{poolSubnetPreview.cidr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gateway:</span>
                    <span className="font-mono">{poolSubnetPreview.gateway}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usable IPs:</span>
                    <span className="font-medium text-green-600">{poolSubnetPreview.usableIPs}</span>
                  </div>
                </div>
              )}
            </div>

            {/* DNS Servers */}
            <div className="space-y-2">
              <Label>DNS Servers</Label>
              <Input
                placeholder="8.8.8.8,8.8.4.4"
                value={poolForm.dns_servers}
                onChange={(e) => setPoolForm(prev => ({ ...prev, dns_servers: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={poolForm.description}
                onChange={(e) => setPoolForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable this pool for use</p>
              </div>
              <Switch
                checked={poolForm.is_active}
                onCheckedChange={(v) => setPoolForm(prev => ({ ...prev, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPoolCreateOpen(false)} disabled={poolSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreatePool} disabled={poolSubmitting}>
              {poolSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Pool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== IP POOL EDIT DIALOG ====== */}
      <Dialog open={isPoolEditOpen} onOpenChange={setIsPoolEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit IP Pool
            </DialogTitle>
            <DialogDescription>
              Update pool settings. Note: Subnet range cannot be changed after creation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Pool Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-pool-name">Pool Name *</Label>
              <Input
                id="edit-pool-name"
                value={poolForm.name}
                onChange={(e) => setPoolForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Pool Type */}
            <div className="space-y-2">
              <Label>Pool Type</Label>
              <Select value={poolForm.pool_type} onValueChange={(v) => setPoolForm(prev => ({ ...prev, pool_type: v as IPPool['pool_type'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PPPOE">PPPoE</SelectItem>
                  <SelectItem value="STATIC">Static IP</SelectItem>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                  <SelectItem value="DHCP">DHCP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Subnet (Read-only) */}
            {selectedPool && (
              <div className="bg-muted/50 border rounded-lg p-3 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Current Subnet (cannot be changed)</p>
                <p className="font-mono font-medium">{selectedPool.cidr_notation || `${selectedPool.start_ip} — ${selectedPool.end_ip}`}</p>
              </div>
            )}

            {/* Gateway */}
            <div className="space-y-2">
              <Label>Gateway</Label>
              <Input
                value={poolForm.gateway}
                onChange={(e) => setPoolForm(prev => ({ ...prev, gateway: e.target.value }))}
                placeholder="e.g., 10.50.1.1"
              />
            </div>

            {/* DNS Servers */}
            <div className="space-y-2">
              <Label>DNS Servers</Label>
              <Input
                placeholder="8.8.8.8,8.8.4.4"
                value={poolForm.dns_servers}
                onChange={(e) => setPoolForm(prev => ({ ...prev, dns_servers: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={poolForm.description}
                onChange={(e) => setPoolForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable this pool for use</p>
              </div>
              <Switch
                checked={poolForm.is_active}
                onCheckedChange={(v) => setPoolForm(prev => ({ ...prev, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPoolEditOpen(false)} disabled={poolSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePool} disabled={poolSubmitting}>
              {poolSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== IP POOL DELETE CONFIRMATION ====== */}
      <AlertDialog open={isPoolDeleteOpen} onOpenChange={setIsPoolDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete IP Pool
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the pool <strong>&quot;{selectedPool?.name}&quot;</strong>?
              {(() => {
                const linkedPlans = selectedPool ? plans.filter(p => p.ip_pool === selectedPool.id) : []
                if (linkedPlans.length > 0) {
                  return (
                    <span className="block mt-2 text-amber-600">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Warning: This pool is linked to {linkedPlans.length} plan{linkedPlans.length !== 1 ? 's' : ''}: {linkedPlans.map(p => p.name).join(', ')}.
                      Deleting it will remove the pool assignment from these plans.
                    </span>
                  )
                }
                return null
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={poolSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePool} 
              disabled={poolSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {poolSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <Badge className="bg-blue-500 text-white">
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
                    <p className="font-medium">{selectedPlan.download_speed} Mbps</p>
                  </div>
                )}
                {selectedPlan.upload_speed && (
                  <div>
                    <p className="text-muted-foreground">Upload Speed</p>
                    <p className="font-medium">{selectedPlan.upload_speed} Mbps</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Data Limit</p>
                  <p className="font-medium">{selectedPlan.data_limit ? `${selectedPlan.data_limit} GB` : 'Unlimited'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subscribers</p>
                  <p className="font-medium">{selectedPlan.subscriber_count || 0}</p>
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
                          <Check className="w-4 h-4 text-green-500" />
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
    </div>
  )
}
