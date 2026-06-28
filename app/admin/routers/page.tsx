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
      case "online": return <CheckCircle className="w-4 h-4 text-success" />
      case "offline": return <XCircle className="w-4 h-4 text-destructive" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />
      case "maintenance": return <Settings className="w-4 h-4 text-primary animate-spin" />
    }
  }

  const getStatusBadge = (status: RouterStatus) => {
    const styles: Record<RouterStatus, string> = {
      online: "bg-success/15 text-success border-success/20",
      offline: "bg-destructive/15 text-destructive border-destructive/20",
      warning: "bg-warning/15 text-warning border-warning/20",
      maintenance: "bg-primary/15 text-primary border-primary/20",
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
      cisco: "bg-primary/15 text-primary",
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Router Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage network access servers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="rounded-xl">
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Router
          </Button>
        </div>
      </div>

      {/* Stats Cards - Glassmorphism redesign */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl">
                <Server className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{localStats.total_routers}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Routers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-500/20 dark:to-emerald-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{localStats.online_routers}</p>
                <p className="text-xs text-muted-foreground font-medium">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-500/20 dark:to-red-500/10 rounded-xl">
                <XCircle className="w-5 h-5 text-destructive dark:text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive dark:text-destructive">{localStats.offline_routers}</p>
                <p className="text-xs text-muted-foreground font-medium">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-500/20 dark:to-emerald-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Number(localStats.average_uptime || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground font-medium">Avg Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-500/20 dark:to-purple-500/10 rounded-xl">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{localStats.below_sla_count}</p>
                <p className="text-xs text-muted-foreground font-medium">Below SLA</p>
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
            className="pl-9 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
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
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
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
        <TabsList className="rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger value="grid" className="flex items-center gap-2 rounded-lg data-[state=active]:shadow-md">
            <BarChart3 className="w-4 h-4" />
            Grid View
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2 rounded-lg data-[state=active]:shadow-md">
            <Server className="w-4 h-4" />
            Table View
          </TabsTrigger>
        </TabsList>

        {/* Grid View - Premium Glassmorphism Design */}
        <TabsContent value="grid" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRouters.map((r) => {
              const statusConfig = {
                online: {
                  glow: "shadow-emerald-500/20",
                  dot: "bg-emerald-500",
                  dotRing: "ring-emerald-500/30",
                  gradient: "from-emerald-400 via-teal-400 to-cyan-400",
                  meshFrom: "rgba(16,185,129,0.15)",
                  meshTo: "rgba(6,182,212,0.05)",
                  badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                  textAccent: "text-emerald-600 dark:text-emerald-400",
                },
                offline: {
                  glow: "shadow-red-500/20",
                  dot: "bg-destructive",
                  dotRing: "ring-red-500/30",
                  gradient: "from-red-400 via-rose-400 to-pink-400",
                  meshFrom: "rgba(239,68,68,0.15)",
                  meshTo: "rgba(244,63,94,0.05)",
                  badge: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/20",
                  textAccent: "text-destructive dark:text-destructive",
                },
                warning: {
                  glow: "shadow-amber-500/20",
                  dot: "bg-warning",
                  dotRing: "ring-amber-500/30",
                  gradient: "from-amber-400 via-orange-400 to-yellow-400",
                  meshFrom: "rgba(245,158,11,0.15)",
                  meshTo: "rgba(251,191,36,0.05)",
                  badge: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/10 dark:text-warning dark:border-warning/20",
                  textAccent: "text-warning dark:text-warning",
                },
                maintenance: {
                  glow: "shadow-blue-500/20",
                  dot: "bg-primary",
                  dotRing: "ring-ring/30",
                  gradient: "from-blue-400 via-indigo-400 to-violet-400",
                  meshFrom: "rgba(59,130,246,0.15)",
                  meshTo: "rgba(139,92,246,0.05)",
                  badge: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary/80 dark:border-primary/20",
                  textAccent: "text-primary dark:text-primary/80",
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
                  className={`group relative overflow-hidden cursor-pointer border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl ${statusConfig.glow} rounded-2xl`}
                  onClick={() => router.push(`/admin/routers/${r.id}`)}
                >
                  {/* Animated gradient mesh background */}
                  <div
                    className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 85% -10%, ${statusConfig.meshFrom}, transparent 50%), radial-gradient(circle at -10% 110%, ${statusConfig.meshTo}, transparent 50%)`,
                    }}
                  />

                  {/* Fine grid texture overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                      backgroundImage: `linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)`,
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Top gradient line — animates on hover */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${statusConfig.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />

                  <CardHeader className="relative pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon with layered glow */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${statusConfig.gradient} opacity-30 blur-md group-hover:opacity-50 group-hover:blur-lg transition-all duration-500`} />
                          <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${statusConfig.gradient} shadow-lg`}>
                            <Server className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.25} />
                          </div>
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${statusConfig.dot} ring-[3px] ring-white dark:ring-slate-900 ${statusConfig.dotRing} ${r.status === 'online' ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <CardTitle className="text-[15px] font-bold tracking-tight truncate text-foreground">
                            {r.name}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono truncate text-slate-400 mt-0.5">
                            {r.ip_address}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 flex-shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
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
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); setSelectedRouter(r); setIsDeleteDialogOpen(true) }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    {/* Status + type row */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${statusConfig.badge} capitalize font-semibold text-xs px-2.5 py-1 rounded-full border`}>
                        {getStatusIcon(r.status)}
                        <span className="ml-1.5">{r.status}</span>
                      </Badge>
                      {getTypeBadge(r.router_type)}
                    </div>

                    {/* Location */}
                    {r.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{r.location}</span>
                      </div>
                    )}

                    {/* Hero metric — connected users, big and bold */}
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/20 px-4 py-3 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                          <Users className="w-4 h-4 text-primary dark:text-primary/80" />
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold text-foreground leading-none tracking-tight">
                            {r.active_users}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">connected users</p>
                        </div>
                      </div>
                      {/* SLA pill */}
                      <div className="text-right">
                        <p className={`text-sm font-bold leading-none ${
                          r.uptime_percentage && r.uptime_percentage > 0
                            ? meetsSla ? statusConfig.textAccent : "text-destructive"
                            : r.status === 'online' ? statusConfig.textAccent : "text-slate-400"
                        }`}>
                          {r.uptime_percentage && r.uptime_percentage > 0
                            ? `${Number(r.uptime_percentage).toFixed(1)}%`
                            : r.status === 'online' ? 'Online' : '—'
                          }
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                          SLA {slaTarget}%
                        </p>
                      </div>
                    </div>

                    {/* SLA Progress bar */}
                    <div className="space-y-1.5">
                      <Progress
                        value={r.uptime_percentage && r.uptime_percentage > 0 ? r.uptime_percentage : r.status === 'online' ? 100 : 0}
                        className={`h-1.5 rounded-full ${!meetsSla && r.status !== 'online' ? "[&>div]:bg-destructive" : `[&>div]:bg-gradient-to-r [&>div]:${statusConfig.gradient}`}`}
                      />
                    </div>

                    {/* CPU/RAM metrics */}
                    {r.status === 'online' && r.metrics ? (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        {[
                          { label: "CPU", value: r.metrics.cpu_usage },
                          { label: "Memory", value: r.metrics.memory_usage },
                        ].map(({ label, value }) => {
                          const barClass = value > 80 ? "bg-destructive" : value > 60 ? "bg-warning" : "bg-primary"
                          const textClass = value > 80 ? "text-destructive dark:text-destructive" : value > 60 ? "text-warning dark:text-warning" : "text-primary dark:text-primary/80"
                          const R = 13; const circ = 2 * Math.PI * R
                          const dash = (value / 100) * circ
                          return (
                            <div key={label} className="rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2.5 border border-slate-100 dark:border-slate-800/50">
                              <svg width="32" height="32" className="-rotate-90 flex-shrink-0">
                                <circle cx="16" cy="16" r={R} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="3" />
                                <circle cx="16" cy="16" r={R} fill="none"
                                  stroke={value > 80 ? "#ef4444" : value > 60 ? "#f59e0b" : "#3b82f6"}
                                  strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                                  style={{ transition: "stroke-dasharray 0.6s ease" }} />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
                                  <span className={`text-xs font-bold ${textClass}`}>{value}%</span>
                                </div>
                                <div className="mt-1 h-1 bg-white dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barClass} transition-all duration-700`} style={{ width: `${value}%` }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : r.status === 'online' ? (
                      <div className="text-center py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[11px] text-slate-400">
                          Live metrics load on open
                        </p>
                      </div>
                    ) : null}

                    {/* Tags */}
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {r.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-medium bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Hover CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        Open dashboard
                      </span>
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br ${statusConfig.gradient} opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300`}>
                        <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredRouters.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Server className="w-7 h-7 opacity-40" />
              </div>
              <p className="font-medium">No routers found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        {/* Table View - Enhanced with premium styling */}
        <TabsContent value="table" className="mt-4">
          <Card className="rounded-2xl border-slate-200/50 dark:border-slate-800/50 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">IP Address</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Users</TableHead>
                    <TableHead className="font-semibold">Uptime</TableHead>
                    <TableHead className="font-semibold">SLA</TableHead>
                    <TableHead className="font-semibold">CPU</TableHead>
                    <TableHead className="font-semibold">RAM</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRouters.map((r) => (
                    <TableRow 
                      key={r.id} 
                      className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                      onClick={() => router.push(`/admin/routers/${r.id}`)}
                    >
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ip_address}</TableCell>
                      <TableCell>{getTypeBadge(r.router_type)}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>{r.location || "-"}</TableCell>
                      <TableCell className="font-semibold">{r.active_users}</TableCell>
                      <TableCell>{r.uptime || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(r.uptime_percentage || 0) >= (r.sla_target || 99) ? "bg-success/15 text-success dark:bg-success/20 dark:text-success" : "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive"}`}>
                          {Number(r.uptime_percentage || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.metrics?.cpu_usage != null && r.status === 'online' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${r.metrics.cpu_usage > 80 ? 'bg-destructive' : r.metrics.cpu_usage > 60 ? 'bg-warning' : 'bg-primary'}`}
                                style={{ width: `${r.metrics.cpu_usage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${r.metrics.cpu_usage > 80 ? 'text-destructive dark:text-destructive' : r.metrics.cpu_usage > 60 ? 'text-warning dark:text-warning' : 'text-slate-600 dark:text-slate-300'}`}>
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
                            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${r.metrics.memory_usage > 80 ? 'bg-destructive' : r.metrics.memory_usage > 60 ? 'bg-warning' : 'bg-purple-500'}`}
                                style={{ width: `${r.metrics.memory_usage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${r.metrics.memory_usage > 80 ? 'text-destructive dark:text-destructive' : r.metrics.memory_usage > 60 ? 'text-warning dark:text-warning' : 'text-slate-600 dark:text-slate-300'}`}>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              className="text-destructive"
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

      {/* Add Router Dialog - Glassmorphism */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Router</DialogTitle>
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
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="router_type">Router Type</Label>
              <Select
                value={formData.router_type}
                onValueChange={(v) => setFormData({ ...formData, router_type: v as RouterType })}
              >
                <SelectTrigger className="rounded-xl">
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
                className="rounded-xl"
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
                className="rounded-xl"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm() }} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Router
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Router Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Details Overview</DialogTitle>
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
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-router_type">Router Type</Label>
                <Input
                  id="edit-router_type"
                  value={formData.router_type ? formData.router_type.charAt(0).toUpperCase() + formData.router_type.slice(1) : ""}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
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
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-api_port">API Port</Label>
                <Input
                  id="edit-api_port"
                  value={formData.api_port}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
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
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-api_password">API Password</Label>
                <Input
                  id="edit-api_password"
                  type="password"
                  value="••••••••"
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
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
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sla_target">SLA Target (%)</Label>
                <Input
                  id="edit-sla_target"
                  value={formData.sla_target}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                readOnly
                className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                readOnly
                className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-default resize-none rounded-xl"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedRouter(null); resetForm() }} className="rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Router</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedRouter?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setSelectedRouter(null) }} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}