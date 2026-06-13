"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Server,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Settings,
  Eye,
  BarChart3,
  Shield,
  MapPin,
  Search,
  Loader2,
  RotateCcw,
  Save,
  TestTube,
  ArrowUpRight,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Router as RouterType2, RouterType, RouterStatus, RouterDashboardStats } from "@/lib/types"

export default function RoutersPage() {
  const router = useRouter()
  const hasFetchedRef = React.useRef(false)
  
  // State
  const [routers, setRouters] = useState<RouterType2[]>([])
  const [stats, setStats] = useState<RouterDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRouter, setSelectedRouter] = useState<RouterType2 | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState<number | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<Partial<RouterType2> & { api_password?: string }>({
    name: "",
    ip_address: "",
    api_port: 8728,
    api_username: "admin",
    api_password: "",
    router_type: "mikrotik",
    model: "",
    location: "",
    sla_target: 99.0,
    tags: [],
    notes: "",
    is_active: true,
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [routersResponse, statsResponse] = await Promise.all([
        adminApi.getRouters(),
        adminApi.getRouterDashboardStats().catch(() => null),
      ])
      
      const routersList = routersResponse.results || []
      setRouters(routersList)
      setStats(statsResponse)
      
      // Background-fetch live stats for online routers
      if (routersList.length > 0) {
        routersList
          .filter(r => r.status === 'online')
          .slice(0, 10) // limit to first 10 to avoid hammering the API
          .forEach(r => {
            adminApi.getRouterLiveStatus(r.id)
              .then(live => {
                if (!live?.online) return
                const cpuLoad = parseInt(String(live.cpu_load).replace('%', '')) || 0
                const freeNum = parseInt(live.free_memory) || 0
                const totalNum = parseInt(live.total_memory) || 1
                const memUsed = Math.round(((totalNum - freeNum) / totalNum) * 100)
                setRouters(prev => prev.map(router =>
                  router.id === r.id
                    ? { 
                        ...router, 
                        metrics: { 
                          ...router.metrics, 
                          cpu_usage: cpuLoad, 
                          memory_usage: memUsed, 
                          active_connections: router.metrics?.active_connections || 0, 
                          download_speed: router.metrics?.download_speed || 0, 
                          upload_speed: router.metrics?.upload_speed || 0, 
                          packets_in: router.metrics?.packets_in || 0, 
                          packets_out: router.metrics?.packets_out || 0, 
                          bandwidth_in: router.metrics?.bandwidth_in || 0, 
                          bandwidth_out: router.metrics?.bandwidth_out || 0 
                        } 
                      }
                    : router
                ))
              })
              .catch(() => {}) // silently ignore failures
          })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to load routers:', errorMessage)
      toast.error('Failed to load routers. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Prevent duplicate fetches in React Strict Mode
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    fetchData()
  }, [fetchData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast.success("Data refreshed")
  }

  // Calculate local stats if API stats unavailable
  const localStats = useMemo(() => {
    if (stats) return stats
    
    const online = routers.filter(r => r.status === "online").length
    const offline = routers.filter(r => r.status === "offline").length
    const warning = routers.filter(r => r.status === "warning").length
    const maintenance = routers.filter(r => r.status === "maintenance").length
    const totalUsers = routers.reduce((acc, r) => acc + r.active_users, 0)
    const avgUptime = routers.length > 0 
      ? routers.reduce((acc, r) => acc + (r.uptime_percentage || 0), 0) / routers.length 
      : 0
    const belowSla = routers.filter(r => (r.uptime_percentage || 0) < (r.sla_target || 99)).length

    return {
      total_routers: routers.length,
      online_routers: online,
      offline_routers: offline,
      warning_routers: warning,
      maintenance_routers: maintenance,
      total_connected_users: totalUsers,
      average_uptime: avgUptime,
      below_sla_count: belowSla,
    }
  }, [routers, stats])

  // Filter routers
  const filteredRouters = useMemo(() => {
    return routers.filter(r => {
      const matchesSearch = 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ip_address.includes(searchQuery) ||
        (r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      const matchesType = typeFilter === "all" || r.router_type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [routers, searchQuery, statusFilter, typeFilter])

  // CRUD Operations
  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Router name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const newRouter = await adminApi.createRouter(formData)
      setRouters([...routers, newRouter])
      toast.success("Router created successfully")
      
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to create router:', error)
      toast.error(errorMessage || "Failed to create router")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRouter) return

    setIsSubmitting(true)
    try {
      const updatedRouter = await adminApi.updateRouter(selectedRouter.id, formData)
      setRouters(routers.map(r => r.id === selectedRouter.id ? updatedRouter : r))
      toast.success("Router updated successfully")
      
      setIsEditDialogOpen(false)
      setSelectedRouter(null)
      resetForm()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to update router:', error)
      toast.error(errorMessage || "Failed to update router")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRouter) return

    setIsSubmitting(true)
    try {
      await adminApi.deleteRouter(selectedRouter.id)
      setRouters(routers.filter(r => r.id !== selectedRouter.id))
      toast.success("Router deleted successfully")
      
      setIsDeleteDialogOpen(false)
      setSelectedRouter(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to delete router:', error)
      toast.error(errorMessage || "Failed to delete router")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestConnection = async (routerId: number) => {
    setIsTesting(routerId)
    try {
      const result = await adminApi.testRouterConnection(routerId)
      if (result.success) {
        toast.success(`Connection successful! Latency: ${result.latency}ms`)
      } else {
        toast.error(result.message || "Connection failed")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to test connection")
    } finally {
      setIsTesting(null)
    }
  }

  const handleReboot = async (routerId: number) => {
    try {
      await adminApi.rebootRouter(routerId)
      toast.success("Reboot command sent successfully")
      fetchData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to send reboot command")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      ip_address: "",
      api_port: 8728,
      api_username: "admin",
      api_password: "",
      router_type: "mikrotik",
      model: "",
      location: "",
      sla_target: 99.0,
      tags: [],
      notes: "",
      is_active: true,
    })
  }

  const openEditDialog = (r: RouterType2) => {
    setSelectedRouter(r)
    setFormData({
      name: r.name,
      ip_address: r.ip_address,
      api_port: r.api_port,
      api_username: r.api_username,
      router_type: r.router_type,
      model: r.model,
      location: r.location,
      sla_target: r.sla_target,
      tags: r.tags,
      notes: r.notes,
      is_active: r.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const getStatusIcon = (status: RouterStatus) => {
    switch (status) {
      case "online": return <CheckCircle className="w-4 h-4 text-green-600" />
      case "offline": return <XCircle className="w-4 h-4 text-red-600" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-600" />
      case "maintenance": return <Settings className="w-4 h-4 text-blue-600 animate-spin" />
    }
  }

  const getStatusBadge = (status: RouterStatus) => {
    const styles: Record<RouterStatus, string> = {
      online: "bg-green-100 text-green-700 border-green-200",
      offline: "bg-red-100 text-red-700 border-red-200",
      warning: "bg-amber-100 text-amber-700 border-amber-200",
      maintenance: "bg-blue-100 text-blue-700 border-blue-200",
    }
    return (
      <Badge variant="outline" className={styles[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const getTypeBadge = (type: RouterType) => {
    const styles: Record<RouterType, string> = {
      mikrotik: "bg-purple-100 text-purple-700",
      cisco: "bg-blue-100 text-blue-700",
      ubiquiti: "bg-teal-100 text-teal-700",
      other: "bg-slate-100 text-slate-700",
    }
    return (
      <Badge variant="secondary" className={styles[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Router Management</h1>
          <p className="text-slate-500 mt-1">
            Monitor and manage network access servers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Router
          </Button>
        </div>
      </div>

      {/* Stats Cards - Redesigned with 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Server className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{localStats.total_routers}</p>
                <p className="text-xs text-slate-500">Total Routers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{localStats.online_routers}</p>
                <p className="text-xs text-slate-500">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{localStats.offline_routers}</p>
                <p className="text-xs text-slate-500">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{Number(localStats.average_uptime || 0).toFixed(1)}%</p>
                <p className="text-xs text-slate-500">Avg Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{localStats.below_sla_count}</p>
                <p className="text-xs text-slate-500">Below SLA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search routers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mikrotik">MikroTik</SelectItem>
            <SelectItem value="cisco">Cisco</SelectItem>
            <SelectItem value="ubiquiti">Ubiquiti</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Grid View
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Table View
          </TabsTrigger>
        </TabsList>

        {/* Grid View - Premium Redesign */}
        <TabsContent value="grid" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRouters.map((r) => {
              const statusConfig = {
                online: {
                  ring: "ring-green-500/20",
                  glow: "shadow-green-500/10",
                  dot: "bg-green-500",
                  accent: "from-green-500 to-emerald-400",
                  badge: "bg-green-500/10 text-green-700 border-green-500/20",
                },
                offline: {
                  ring: "ring-red-500/20",
                  glow: "shadow-red-500/10",
                  dot: "bg-red-500",
                  accent: "from-red-500 to-rose-400",
                  badge: "bg-red-500/10 text-red-700 border-red-500/20",
                },
                warning: {
                  ring: "ring-amber-500/20",
                  glow: "shadow-amber-500/10",
                  dot: "bg-amber-500",
                  accent: "from-amber-500 to-yellow-400",
                  badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",
                },
                maintenance: {
                  ring: "ring-blue-500/20",
                  glow: "shadow-blue-500/10",
                  dot: "bg-blue-500",
                  accent: "from-blue-500 to-cyan-400",
                  badge: "bg-blue-500/10 text-blue-700 border-blue-500/20",
                },
              }[r.status]

              const slaTarget = r.sla_target || 99
              const uptimePct = r.uptime_percentage && r.uptime_percentage > 0
                ? r.uptime_percentage
                : r.status === 'online' ? slaTarget : 0
              const meetsSla = uptimePct >= slaTarget

              return (
                <Card
                  key={r.id}
                  className={`group relative overflow-hidden cursor-pointer border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${statusConfig.glow} ring-1 ${statusConfig.ring}`}
                  onClick={() => router.push(`/admin/routers/${r.id}`)}
                >
                  {/* Top accent gradient bar */}
                  <div className={`h-1 w-full bg-gradient-to-r ${statusConfig.accent}`} />

                  {/* Subtle corner glow */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${statusConfig.accent} opacity-[0.07] blur-2xl group-hover:opacity-[0.12] transition-opacity`} />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${statusConfig.accent} shadow-md`}>
                            <Server className="w-5 h-5 text-white" />
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${statusConfig.dot} ring-2 ring-white dark:ring-slate-900 ${r.status === 'online' ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{r.name}</CardTitle>
                          <CardDescription className="text-xs font-mono truncate">{r.ip_address}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 flex-shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/routers/${r.id}`) }}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(r) }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleTestConnection(r.id) }}
                            disabled={isTesting === r.id}
                          >
                            {isTesting === r.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <TestTube className="w-4 h-4 mr-2" />
                            )}
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReboot(r.id) }}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Reboot
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); setSelectedRouter(r); setIsDeleteDialogOpen(true) }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Status + type row */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${statusConfig.badge} capitalize font-medium`}>
                        {getStatusIcon(r.status)}
                        <span className="ml-1.5">{r.status}</span>
                      </Badge>
                      {getTypeBadge(r.router_type)}
                    </div>

                    {/* Location */}
                    {r.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{r.location}</span>
                      </div>
                    )}

                    {/* Connected users — highlighted metric */}
                    <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded-md">
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{r.active_users}</span>
                      <span className="text-xs text-slate-400">connected users</span>
                    </div>

                    {/* SLA Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-slate-400 font-medium uppercase tracking-wide">SLA · {slaTarget}%</span>
                        <span className={`font-bold text-sm ${
                          r.uptime_percentage && r.uptime_percentage > 0
                            ? meetsSla ? "text-green-600" : "text-red-600"
                            : r.status === 'online' ? "text-green-600" : "text-slate-400"
                        }`}>
                          {r.uptime_percentage && r.uptime_percentage > 0
                            ? `${Number(r.uptime_percentage).toFixed(1)}%`
                            : r.status === 'online' ? 'Online' : 'Offline'
                          }
                        </span>
                      </div>
                      <Progress
                        value={r.uptime_percentage && r.uptime_percentage > 0 ? r.uptime_percentage : r.status === 'online' ? 100 : 0}
                        className={`h-1.5 ${!meetsSla && r.status !== 'online' ? "[&>div]:bg-red-500" : r.status === 'online' ? "[&>div]:bg-green-500" : "[&>div]:bg-slate-300"}`}
                      />
                    </div>

                    {/* CPU/RAM metrics */}
                    {r.status === 'online' && r.metrics ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { label: "CPU", value: r.metrics.cpu_usage },
                          { label: "RAM", value: r.metrics.memory_usage },
                        ].map(({ label, value }) => {
                          const barClass = value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-500" : "bg-blue-500"
                          const textClass = value > 80 ? "text-red-600" : value > 60 ? "text-amber-600" : "text-slate-600"
                          const R = 11; const circ = 2 * Math.PI * R
                          const dash = (value / 100) * circ
                          return (
                            <div key={label} className="rounded-lg p-2 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                              <svg width="28" height="28" className="-rotate-90 flex-shrink-0">
                                <circle cx="14" cy="14" r={R} fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                <circle cx="14" cy="14" r={R} fill="none"
                                  stroke={value > 80 ? "#ef4444" : value > 60 ? "#f59e0b" : "#3b82f6"}
                                  strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[11px] font-medium text-slate-500">{label}</span>
                                  <span className={`text-xs font-bold ${textClass}`}>{value}%</span>
                                </div>
                                <div className="mt-0.5 h-1 bg-white/70 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barClass} transition-all duration-500`} style={{ width: `${value}%` }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : r.status === 'online' ? (
                      <div className="text-center py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[11px] text-slate-400">
                          Click to view live CPU & memory stats
                        </p>
                      </div>
                    ) : null}

                    {/* Tags */}
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {r.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Hover CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400">View full details</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredRouters.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No routers found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRouters.map((r) => (
                    <TableRow 
                      key={r.id} 
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push(`/admin/routers/${r.id}`)}
                    >
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ip_address}</TableCell>
                      <TableCell>{getTypeBadge(r.router_type)}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>{r.location || "-"}</TableCell>
                      <TableCell>{r.active_users}</TableCell>
                      <TableCell>{r.uptime || "-"}</TableCell>
                      <TableCell>
                        <span className={(r.uptime_percentage || 0) >= (r.sla_target || 99) ? "text-green-600" : "text-red-600"}>
                          {Number(r.uptime_percentage || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.metrics?.cpu_usage != null && r.status === 'online' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${r.metrics.cpu_usage > 80 ? 'bg-red-500' : r.metrics.cpu_usage > 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${r.metrics.cpu_usage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${r.metrics.cpu_usage > 80 ? 'text-red-600' : r.metrics.cpu_usage > 60 ? 'text-amber-600' : 'text-slate-600'}`}>
                              {r.metrics.cpu_usage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.metrics?.memory_usage != null && r.status === 'online' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${r.metrics.memory_usage > 80 ? 'bg-red-500' : r.metrics.memory_usage > 60 ? 'bg-amber-500' : 'bg-purple-500'}`}
                                style={{ width: `${r.metrics.memory_usage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${r.metrics.memory_usage > 80 ? 'text-red-600' : r.metrics.memory_usage > 60 ? 'text-amber-600' : 'text-slate-600'}`}>
                              {r.metrics.memory_usage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/routers/${r.id}`) }}>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(r) }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); handleTestConnection(r.id) }}
                              disabled={isTesting === r.id}
                            >
                              {isTesting === r.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <TestTube className="w-4 h-4 mr-2" />
                              )}
                              Test
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => { e.stopPropagation(); setSelectedRouter(r); setIsDeleteDialogOpen(true) }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Router Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Router</DialogTitle>
            <DialogDescription>
              Enter a name for your router. After adding, you can edit it to configure connection details and get the authentication script.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Router Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Gateway, Westlands Branch"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="router_type">Router Type</Label>
              <Select
                value={formData.router_type}
                onValueChange={(v) => setFormData({ ...formData, router_type: v as RouterType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mikrotik">MikroTik</SelectItem>
                  <SelectItem value="cisco">Cisco</SelectItem>
                  <SelectItem value="ubiquiti">Ubiquiti</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Nairobi CBD - HQ"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Router
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Router Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details Overview</DialogTitle>
            <DialogDescription>Router configuration details (read-only)</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Router Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-router_type">Router Type</Label>
                <Input
                  id="edit-router_type"
                  value={formData.router_type ? formData.router_type.charAt(0).toUpperCase() + formData.router_type.slice(1) : ""}
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ip_address">IP Address</Label>
                <Input
                  id="edit-ip_address"
                  value={formData.ip_address}
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-api_port">API Port</Label>
                <Input
                  id="edit-api_port"
                  value={formData.api_port}
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-api_username">API Username</Label>
                <Input
                  id="edit-api_username"
                  value={formData.api_username}
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-api_password">API Password</Label>
                <Input
                  id="edit-api_password"
                  type="password"
                  value="••••••••"
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sla_target">SLA Target (%)</Label>
                <Input
                  id="edit-sla_target"
                  value={formData.sla_target}
                  readOnly
                  className="bg-slate-50 text-slate-600 cursor-default"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                readOnly
                className="bg-slate-50 text-slate-600 cursor-default"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                readOnly
                className="bg-slate-50 text-slate-600 cursor-default resize-none"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedRouter(null); resetForm() }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Router</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedRouter?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setSelectedRouter(null) }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}