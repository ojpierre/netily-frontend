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
      
      setRouters(routersResponse.results || [])
      setStats(statsResponse)
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Router Management</h1>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{localStats.warning_routers}</p>
                <p className="text-xs text-slate-500">Warnings</p>
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
                <p className="text-2xl font-bold text-blue-600">{localStats.total_connected_users}</p>
                <p className="text-xs text-slate-500">Connected</p>
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search routers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-40">
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

        {/* Grid View */}
        <TabsContent value="grid" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRouters.map((r) => (
              <Card 
                key={r.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  r.status === "offline" ? "border-red-200 bg-red-50/30" :
                  r.status === "warning" ? "border-amber-200 bg-amber-50/30" :
                  r.status === "maintenance" ? "border-blue-200 bg-blue-50/30" : ""
                }`}
                onClick={() => router.push(`/admin/routers/${r.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        r.status === "online" ? "bg-green-100" :
                        r.status === "offline" ? "bg-red-100" :
                        r.status === "warning" ? "bg-amber-100" : "bg-blue-100"
                      }`}>
                        <Server className={`w-5 h-5 ${
                          r.status === "online" ? "text-green-600" :
                          r.status === "offline" ? "text-red-600" :
                          r.status === "warning" ? "text-amber-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{r.name}</CardTitle>
                        <CardDescription className="text-xs">{r.ip_address}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(r.status)}
                    {getTypeBadge(r.router_type)}
                  </div>
                  
                  {r.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4" />
                      <span>{r.location}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{r.active_users} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{r.uptime || "N/A"}</span>
                    </div>
                  </div>

                  {/* SLA Progress */}
                  {r.uptime_percentage !== undefined && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>SLA: {r.sla_target || 99}%</span>
                        <span className={(r.uptime_percentage || 0) >= (r.sla_target || 99) ? "text-green-600" : "text-red-600"}>
                          {Number(r.uptime_percentage || 0).toFixed(2)}%
                        </span>
                      </div>
                      <Progress 
                        value={r.uptime_percentage} 
                        className={`h-2 ${(r.uptime_percentage || 0) < (r.sla_target || 99) ? "[&>div]:bg-red-500" : ""}`}
                      />
                    </div>
                  )}

                  {/* Metrics Preview */}
                  {r.status === "online" && r.metrics && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">CPU</p>
                        <p className={`font-medium ${
                          r.metrics.cpu_usage > 80 ? "text-red-600" : 
                          r.metrics.cpu_usage > 60 ? "text-amber-600" : "text-slate-700"
                        }`}>
                          {r.metrics.cpu_usage}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Memory</p>
                        <p className={`font-medium ${
                          r.metrics.memory_usage > 80 ? "text-red-600" : 
                          r.metrics.memory_usage > 60 ? "text-amber-600" : "text-slate-700"
                        }`}>
                          {r.metrics.memory_usage}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Temp</p>
                        <p className={`font-medium ${
                          (r.metrics.temperature || 0) > 65 ? "text-red-600" : 
                          (r.metrics.temperature || 0) > 55 ? "text-amber-600" : "text-slate-700"
                        }`}>
                          {r.metrics.temperature || "N/A"}°C
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {r.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
            <DialogTitle>Edit Router</DialogTitle>
            <DialogDescription>Update router configuration</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Router Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-router_type">Router Type</Label>
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ip_address">IP Address *</Label>
                <Input
                  id="edit-ip_address"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-api_port">API Port</Label>
                <Input
                  id="edit-api_port"
                  type="number"
                  value={formData.api_port}
                  onChange={(e) => setFormData({ ...formData, api_port: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-api_username">API Username</Label>
                <Input
                  id="edit-api_username"
                  value={formData.api_username}
                  onChange={(e) => setFormData({ ...formData, api_username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-api_password">API Password (leave blank to keep)</Label>
                <Input
                  id="edit-api_password"
                  type="password"
                  value={formData.api_password}
                  onChange={(e) => setFormData({ ...formData, api_password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sla_target">SLA Target (%)</Label>
                <Input
                  id="edit-sla_target"
                  type="number"
                  step="0.1"
                  value={formData.sla_target}
                  onChange={(e) => setFormData({ ...formData, sla_target: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedRouter(null); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
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
