"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Network,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Search,
  Globe,
  Check,
  Loader2,
  Shield,
  Activity,
  HardDrive,
  ChevronDown,
  ChevronRight,
  MapPin,
  LinkIcon,
  Unlink,
  Power,
  AlertTriangle,
  Package,
  Wifi,
  Badge as BadgeIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Plan, IPPool, SubnetPrefixOption, CIDROption, SubnetPrefixOptionsResponse } from "@/lib/types"

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num || 0)
}

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

export default function IPv4NetworksPage() {
  const hasFetchedRef = useRef(false)

  // Data
  const [ipPools, setIPPools] = useState<IPPool[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sub-tab & search
  const [activeSubTab, setActiveSubTab] = useState<'pools' | 'static' | 'mapping'>('pools')
  const [searchQuery, setSearchQuery] = useState('')

  // Pool CRUD state
  const [isPoolCreateOpen, setIsPoolCreateOpen] = useState(false)
  const [isPoolEditOpen, setIsPoolEditOpen] = useState(false)
  const [isPoolDeleteOpen, setIsPoolDeleteOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<IPPool | null>(null)
  const [poolSubmitting, setPoolSubmitting] = useState(false)
  const [expandedPoolId, setExpandedPoolId] = useState<number | null>(null)

  // Pool form
  const [poolForm, setPoolForm] = useState({
    name: '',
    pool_type: 'PPPOE' as IPPool['pool_type'],
    subnet_prefix: '10.50',
    subnet_octet: '',
    cidr_prefix: '24',
    gateway: '',
    dns_servers: '',
    description: '',
    is_active: true,
  })

  // Subnet builder options
  const [subnetPrefixes, setSubnetPrefixes] = useState<SubnetPrefixOption[]>([])
  const [cidrOptions, setCidrOptions] = useState<CIDROption[]>([])
  const [subnetOptionsLoading, setSubnetOptionsLoading] = useState(false)

  // ===== Data Fetching =====
  const fetchIPPools = useCallback(async () => {
    try {
      const res = await adminApi.getIPPools({ page_size: '100', ordering: '-created_at' })
      setIPPools(res.results || [])
    } catch (error) {
      console.error('Failed to fetch IP pools:', error)
    }
  }, [])

  const fetchPlans = useCallback(async () => {
    try {
      const res = await adminApi.getPlans({ ordering: '-created_at' })
      setPlans(res.results || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }, [])

  const loadSubnetPrefixOptions = useCallback(async () => {
    if (subnetPrefixes.length > 0) return
    setSubnetOptionsLoading(true)
    try {
      const res: SubnetPrefixOptionsResponse = await adminApi.getSubnetPrefixOptions()
      setSubnetPrefixes(res.prefixes || [])
      setCidrOptions(res.cidr_options || [])
      if (res.default_prefix) {
        setPoolForm(prev => ({ ...prev, subnet_prefix: res.default_prefix }))
      }
    } catch (err) {
      console.error('Failed to load subnet prefix options:', err)
    } finally {
      setSubnetOptionsLoading(false)
    }
  }, [subnetPrefixes.length])

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      Promise.all([fetchIPPools(), fetchPlans()]).finally(() => setLoading(false))
    }
  }, [fetchIPPools, fetchPlans])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchIPPools(), fetchPlans()])
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // ===== Pool Form Helpers =====
  const resetPoolForm = () => {
    setPoolForm({
      name: '', pool_type: 'PPPOE', subnet_prefix: '10.50', subnet_octet: '',
      cidr_prefix: '24', gateway: '', dns_servers: '', description: '', is_active: true,
    })
    setSelectedPool(null)
  }

  // FIXED: poolSubnetPreview with correct calculation, large pool warning, and locked octet
  const poolSubnetPreview = useMemo(() => {
    const { subnet_prefix, subnet_octet, cidr_prefix } = poolForm
    if (!subnet_prefix) return null
    const cidrNum = parseInt(cidr_prefix)
    if (isNaN(cidrNum) || cidrNum < 16 || cidrNum > 30) return null

    // For /16 and larger, 3rd octet is always 0
    const octetConfig = getOctetFieldConfig(cidr_prefix)
    const effectiveOctet = octetConfig.locked ? 0 : parseInt(subnet_octet)

    if (!octetConfig.locked && (isNaN(effectiveOctet) || effectiveOctet < 0 || effectiveOctet > 255)) return null

    const totalIPs = Math.pow(2, 32 - cidrNum)
    const usableIPs = totalIPs - 3 // network + broadcast + gateway

    return {
      network: `${subnet_prefix}.${effectiveOctet}.0`,
      gateway: `${subnet_prefix}.${effectiveOctet}.1`,
      cidr: `${subnet_prefix}.${effectiveOctet}.0/${cidrNum}`,
      usableIPs,
      isLarge: usableIPs > 1000,
    }
  }, [poolForm.subnet_prefix, poolForm.subnet_octet, poolForm.cidr_prefix])

  // ===== Pool CRUD =====
  const handleCreatePool = async () => {
    if (!poolForm.name.trim()) { toast.error('Pool name is required'); return }
    
    const octetConfig = getOctetFieldConfig(poolForm.cidr_prefix)
    let subnetOctetValue: number | undefined
    
    if (octetConfig.locked) {
      subnetOctetValue = 0
    } else if (!poolForm.subnet_octet) {
      toast.error('Subnet octet is required')
      return
    } else {
      subnetOctetValue = parseInt(poolForm.subnet_octet)
    }
    
    setPoolSubmitting(true)
    try {
      await adminApi.createIPPool({
        name: poolForm.name,
        pool_type: poolForm.pool_type,
        subnet_prefix: poolForm.subnet_prefix,
        subnet_octet: subnetOctetValue,
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

  // ===== Filtered Pools =====
  const filteredPools = useMemo(() => {
    if (!searchQuery.trim()) return ipPools
    const q = searchQuery.toLowerCase()
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
  }, [ipPools, plans, searchQuery])

  // ===== Stats =====
  const stats = useMemo(() => {
    const totalPools = ipPools.length
    const activePools = ipPools.filter(p => p.is_active).length
    const totalIPs = ipPools.reduce((sum, p) => sum + (p.total_ips || 0), 0)
    const usedIPs = ipPools.reduce((sum, p) => sum + (p.used_ips || 0), 0)
    const availIPs = totalIPs - usedIPs
    const utilization = totalIPs > 0 ? ((usedIPs / totalIPs) * 100).toFixed(1) : '0'
    const plansWithPool = plans.filter(p => p.ip_pool)
    return { totalPools, activePools, totalIPs, usedIPs, availIPs, utilization, plansLinked: plansWithPool.length }
  }, [ipPools, plans])

  // ===== Loading State =====
  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IPv4 Networks</h1>
          <p className="text-muted-foreground">
            Manage IP address pools, static blocks, and plan-to-pool assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => { resetPoolForm(); loadSubnetPrefixOptions(); setIsPoolCreateOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add IP Pool
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSubTab('pools')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Network className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.totalPools}</p><p className="text-xs text-muted-foreground">IP Pools</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSubTab('pools')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Check className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">{stats.activePools}</p><p className="text-xs text-muted-foreground">Active Pools</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><HardDrive className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{stats.totalIPs.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total IPs</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSubTab('static')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><Shield className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-emerald-600">{stats.availIPs.toLocaleString()}</p><p className="text-xs text-muted-foreground">Available IPs</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSubTab('mapping')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><LinkIcon className="w-5 h-5 text-indigo-600" /></div>
            <div><p className="text-2xl font-bold text-indigo-600">{stats.plansLinked}</p><p className="text-xs text-muted-foreground">Plans Linked</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Activity className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-600">{stats.utilization}%</p><p className="text-xs text-muted-foreground">Utilization</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex border rounded-lg p-1 bg-muted/30 w-fit">
          <button
            onClick={() => setActiveSubTab('pools')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSubTab === 'pools' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Network className="w-4 h-4 inline mr-1.5" />
            IP Pools
          </button>
          <button
            onClick={() => setActiveSubTab('static')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSubTab === 'static' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1.5" />
            Static IP Blocks
          </button>
          <button
            onClick={() => setActiveSubTab('mapping')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSubTab === 'mapping' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-1.5" />
            Pool-Plan Mapping
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pools by name, IP, or linked plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {searchQuery && (
          <Badge variant="secondary" className="w-fit">
            {filteredPools.length} of {ipPools.length} pools
          </Badge>
        )}
      </div>

      {/* ======= IP POOLS Sub-tab ======= */}
      {activeSubTab === 'pools' && (
        <>
          {filteredPools.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium text-lg">{searchQuery ? 'No Pools Match Your Search' : 'No IP Pools Created Yet'}</p>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try a different search term or clear the search to see all pools.'
                    : 'IP pools define the address ranges for your customers. Create one to get started.'
                  }
                </p>
                {!searchQuery && (
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
                                          <Badge key={p.id} variant="outline">
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
      {activeSubTab === 'static' && (
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
                  const utilPct = pool.total_ips > 0 ? (pool.used_ips / pool.total_ips * 100) : 0
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
                          className={`h-full ${utilPct > 90 ? 'bg-red-500' : utilPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${utilPct}%` }}
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
      {activeSubTab === 'mapping' && (
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
                        <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
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
            <div className="space-y-2">
              <Label htmlFor="pool-name">Pool Name *</Label>
              <Input
                id="pool-name"
                placeholder="e.g., Main PPPoE Pool"
                value={poolForm.name}
                onChange={(e) => setPoolForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Pool Type *</Label>
              <Select value={poolForm.pool_type} onValueChange={(v) => setPoolForm(prev => ({ ...prev, pool_type: v as IPPool['pool_type'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PPPOE">PPPoE</SelectItem>
                  <SelectItem value="STATIC">Static IP</SelectItem>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                  <SelectItem value="DHCP">DHCP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Subnet Configuration *</Label>
              
              {/* Dynamic 3rd Octet based on CIDR selection */}
              {(() => {
                const octetConfig = getOctetFieldConfig(poolForm.cidr_prefix)
                return (
                  <div className={`grid gap-3 ${octetConfig.show ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {/* Prefix */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Prefix</Label>
                      <Select
                        value={poolForm.subnet_prefix}
                        onValueChange={(v) => {
                          // When prefix changes, reset octet if cidr becomes locked
                          setPoolForm(prev => ({
                            ...prev,
                            subnet_prefix: v,
                            subnet_octet: octetConfig.locked ? '0' : prev.subnet_octet
                          }))
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
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

                    {/* 3rd Octet — hidden for /16 and larger */}
                    {octetConfig.show && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{octetConfig.label}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          placeholder={octetConfig.hint}
                          value={poolForm.subnet_octet}
                          onChange={(e) => setPoolForm(prev => ({ ...prev, subnet_octet: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-0.5">{octetConfig.hint}</p>
                      </div>
                    )}

                    {/* CIDR */}
                    <div>
                      <Label className="text-xs text-muted-foreground">CIDR</Label>
                      <Select
                        value={poolForm.cidr_prefix}
                        onValueChange={(v) => {
                          const newConfig = getOctetFieldConfig(v)
                          setPoolForm(prev => ({
                            ...prev,
                            cidr_prefix: v,
                            // Auto-clear octet when switching to a large CIDR
                            subnet_octet: newConfig.locked ? '0' : prev.subnet_octet
                          }))
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {cidrOptions.length > 0 ? cidrOptions.map(c => (
                            <SelectItem key={c.value} value={c.value.toString()}>{c.label}</SelectItem>
                          )) : (
                            <>
                              <SelectItem value="16">/16 (65,534 hosts)</SelectItem>
                              <SelectItem value="20">/20 (4,094 hosts)</SelectItem>
                              <SelectItem value="22">/22 (1,022 hosts)</SelectItem>
                              <SelectItem value="23">/23 (510 hosts)</SelectItem>
                              <SelectItem value="24">/24 (254 hosts)</SelectItem>
                              <SelectItem value="25">/25 (126 hosts)</SelectItem>
                              <SelectItem value="26">/26 (62 hosts)</SelectItem>
                              <SelectItem value="27">/27 (30 hosts)</SelectItem>
                              <SelectItem value="28">/28 (14 hosts)</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {/* Show hint when 3rd octet is hidden */}
                      {!octetConfig.show && (
                        <p className="text-xs text-amber-600 mt-1">
                          3rd octet not needed — entire /16 block will be used
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Updated preview with large pool warning */}
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
                    <span className="font-medium text-green-600">
                      {poolSubnetPreview.usableIPs.toLocaleString()}
                    </span>
                  </div>
                  {poolSubnetPreview.isLarge && (
                    <div className="flex items-start gap-1.5 pt-1 border-t text-amber-700 text-xs">
                      <span>⚠</span>
                      <span>
                        Large pool — IP addresses will be generated in the background after creation. 
                        The pool will be available immediately but IPs may take a minute to populate.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>DNS Servers</Label>
              <Input
                placeholder="8.8.8.8,8.8.4.4"
                value={poolForm.dns_servers}
                onChange={(e) => setPoolForm(prev => ({ ...prev, dns_servers: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={poolForm.description}
                onChange={(e) => setPoolForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

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
            <Button variant="outline" onClick={() => setIsPoolCreateOpen(false)} disabled={poolSubmitting}>Cancel</Button>
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
            <div className="space-y-2">
              <Label htmlFor="edit-pool-name">Pool Name *</Label>
              <Input id="edit-pool-name" value={poolForm.name} onChange={(e) => setPoolForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Pool Type</Label>
              <Select value={poolForm.pool_type} onValueChange={(v) => setPoolForm(prev => ({ ...prev, pool_type: v as IPPool['pool_type'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PPPOE">PPPoE</SelectItem>
                  <SelectItem value="STATIC">Static IP</SelectItem>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                  <SelectItem value="DHCP">DHCP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPool && (
              <div className="bg-muted/50 border rounded-lg p-3 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Current Subnet (cannot be changed)</p>
                <p className="font-mono font-medium">{selectedPool.cidr_notation || `${selectedPool.start_ip} — ${selectedPool.end_ip}`}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Gateway</Label>
              <Input value={poolForm.gateway} onChange={(e) => setPoolForm(prev => ({ ...prev, gateway: e.target.value }))} placeholder="e.g., 10.50.1.1" />
            </div>

            <div className="space-y-2">
              <Label>DNS Servers</Label>
              <Input placeholder="8.8.8.8,8.8.4.4" value={poolForm.dns_servers} onChange={(e) => setPoolForm(prev => ({ ...prev, dns_servers: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Optional description..." value={poolForm.description} onChange={(e) => setPoolForm(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable this pool for use</p>
              </div>
              <Switch checked={poolForm.is_active} onCheckedChange={(v) => setPoolForm(prev => ({ ...prev, is_active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPoolEditOpen(false)} disabled={poolSubmitting}>Cancel</Button>
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
    </div>
  )
}