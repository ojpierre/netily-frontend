"use client"

import React, { useState, useMemo } from "react"
import {
  Server,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Download,
  Upload,
  Settings,
  Eye,
  Power,
  Terminal,
  History,
  BarChart3,
  Shield,
  MapPin,
  Signal,
  Gauge,
  Zap,
  AlertCircle,
  Search,
  Filter,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type RouterStatus = "online" | "offline" | "warning" | "maintenance"
type RouterType = "mikrotik" | "cisco" | "ubiquiti" | "other"

interface RouterEvent {
  id: string
  type: "up" | "down" | "warning" | "config_change" | "reboot"
  message: string
  timestamp: string
}

interface RouterMetrics {
  cpuUsage: number
  memoryUsage: number
  temperature: number
  activeConnections: number
  downloadSpeed: number // Mbps
  uploadSpeed: number // Mbps
  packetsIn: number
  packetsOut: number
}

interface Router {
  id: string
  name: string
  ipAddress: string
  macAddress: string
  routerType: RouterType
  model: string
  secret: string
  status: RouterStatus
  connectedUsers: number
  uptime: string
  uptimePercentage: number
  location: string
  latitude?: number
  longitude?: number
  lastSeen: string
  slaTarget: number // percentage
  metrics: RouterMetrics
  events: RouterEvent[]
  tags: string[]
}

const generateMockRouters = (): Router[] => {
  return [
    {
      id: "NAS-001",
      name: "Main Gateway Router",
      ipAddress: "192.168.1.1",
      macAddress: "AA:BB:CC:DD:EE:01",
      routerType: "mikrotik",
      model: "CCR1036-12G-4S",
      secret: "shared-secret-123",
      status: "online",
      connectedUsers: 320,
      uptime: "45d 12h 30m",
      uptimePercentage: 99.98,
      location: "Nairobi CBD - HQ",
      lastSeen: "Just now",
      slaTarget: 99.9,
      metrics: {
        cpuUsage: 32,
        memoryUsage: 45,
        temperature: 52,
        activeConnections: 320,
        downloadSpeed: 850,
        uploadSpeed: 420,
        packetsIn: 12500000,
        packetsOut: 8900000,
      },
      events: [
        { id: "e1", type: "up", message: "Router is online", timestamp: "2024-01-15 08:00:00" },
        { id: "e2", type: "config_change", message: "Firewall rules updated", timestamp: "2024-01-14 14:30:00" },
      ],
      tags: ["primary", "production"],
    },
    {
      id: "NAS-002",
      name: "Westlands Branch Router",
      ipAddress: "192.168.2.1",
      macAddress: "AA:BB:CC:DD:EE:02",
      routerType: "mikrotik",
      model: "RB4011iGS+RM",
      secret: "shared-secret-456",
      status: "online",
      connectedUsers: 180,
      uptime: "23d 8h 15m",
      uptimePercentage: 99.85,
      location: "Westlands - Branch Office",
      lastSeen: "Just now",
      slaTarget: 99.5,
      metrics: {
        cpuUsage: 28,
        memoryUsage: 38,
        temperature: 48,
        activeConnections: 180,
        downloadSpeed: 450,
        uploadSpeed: 210,
        packetsIn: 6500000,
        packetsOut: 4200000,
      },
      events: [
        { id: "e3", type: "up", message: "Router is online", timestamp: "2024-01-10 10:00:00" },
      ],
      tags: ["branch", "production"],
    },
    {
      id: "NAS-003",
      name: "Kilimani Distribution",
      ipAddress: "192.168.3.1",
      macAddress: "AA:BB:CC:DD:EE:03",
      routerType: "ubiquiti",
      model: "EdgeRouter 12P",
      secret: "shared-secret-789",
      status: "warning",
      connectedUsers: 95,
      uptime: "12d 5h 45m",
      uptimePercentage: 97.5,
      location: "Kilimani - Residential",
      lastSeen: "5 min ago",
      slaTarget: 99.0,
      metrics: {
        cpuUsage: 78,
        memoryUsage: 82,
        temperature: 68,
        activeConnections: 95,
        downloadSpeed: 380,
        uploadSpeed: 190,
        packetsIn: 4200000,
        packetsOut: 2800000,
      },
      events: [
        { id: "e4", type: "warning", message: "High CPU usage detected", timestamp: "2024-01-15 07:45:00" },
        { id: "e5", type: "warning", message: "Memory usage above threshold", timestamp: "2024-01-15 07:30:00" },
      ],
      tags: ["residential", "production"],
    },
    {
      id: "NAS-004",
      name: "Mombasa Gateway",
      ipAddress: "10.0.1.1",
      macAddress: "AA:BB:CC:DD:EE:04",
      routerType: "cisco",
      model: "ISR 4331",
      secret: "shared-secret-abc",
      status: "online",
      connectedUsers: 245,
      uptime: "67d 18h 20m",
      uptimePercentage: 99.95,
      location: "Mombasa - Main Hub",
      lastSeen: "Just now",
      slaTarget: 99.9,
      metrics: {
        cpuUsage: 42,
        memoryUsage: 55,
        temperature: 55,
        activeConnections: 245,
        downloadSpeed: 920,
        uploadSpeed: 480,
        packetsIn: 15800000,
        packetsOut: 10200000,
      },
      events: [
        { id: "e6", type: "up", message: "Router is online", timestamp: "2023-11-10 06:00:00" },
      ],
      tags: ["primary", "production", "coast"],
    },
    {
      id: "NAS-005",
      name: "Kisumu Branch",
      ipAddress: "10.0.2.1",
      macAddress: "AA:BB:CC:DD:EE:05",
      routerType: "mikrotik",
      model: "hEX S",
      secret: "shared-secret-def",
      status: "offline",
      connectedUsers: 0,
      uptime: "0d 0h 0m",
      uptimePercentage: 85.2,
      location: "Kisumu - Branch",
      lastSeen: "2 hours ago",
      slaTarget: 99.0,
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        temperature: 0,
        activeConnections: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        packetsIn: 0,
        packetsOut: 0,
      },
      events: [
        { id: "e7", type: "down", message: "Router went offline - Connection timeout", timestamp: "2024-01-15 06:30:00" },
        { id: "e8", type: "warning", message: "High latency detected", timestamp: "2024-01-15 06:15:00" },
      ],
      tags: ["branch", "production"],
    },
    {
      id: "NAS-006",
      name: "Nakuru Distribution",
      ipAddress: "10.0.3.1",
      macAddress: "AA:BB:CC:DD:EE:06",
      routerType: "mikrotik",
      model: "RB3011UiAS-RM",
      secret: "shared-secret-ghi",
      status: "maintenance",
      connectedUsers: 0,
      uptime: "0d 0h 0m",
      uptimePercentage: 98.5,
      location: "Nakuru - Distribution Center",
      lastSeen: "1 hour ago",
      slaTarget: 99.0,
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        temperature: 0,
        activeConnections: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        packetsIn: 0,
        packetsOut: 0,
      },
      events: [
        { id: "e9", type: "config_change", message: "Scheduled maintenance started", timestamp: "2024-01-15 05:00:00" },
      ],
      tags: ["distribution", "maintenance"],
    },
  ]
}

const mockRouters = generateMockRouters()

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>(mockRouters)
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)

  // Calculate stats
  const stats = useMemo(() => {
    const online = routers.filter(r => r.status === "online").length
    const offline = routers.filter(r => r.status === "offline").length
    const warning = routers.filter(r => r.status === "warning").length
    const maintenance = routers.filter(r => r.status === "maintenance").length
    const totalUsers = routers.reduce((acc, r) => acc + r.connectedUsers, 0)
    const avgUptime = routers.reduce((acc, r) => acc + r.uptimePercentage, 0) / routers.length
    const belowSla = routers.filter(r => r.uptimePercentage < r.slaTarget).length

    return { online, offline, warning, maintenance, totalUsers, avgUptime, belowSla }
  }, [routers])

  // Filter routers
  const filteredRouters = useMemo(() => {
    return routers.filter(router => {
      const matchesSearch = 
        router.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        router.ipAddress.includes(searchQuery) ||
        router.location.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || router.status === statusFilter
      const matchesType = typeFilter === "all" || router.routerType === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [routers, searchQuery, statusFilter, typeFilter])

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleViewDetails = (router: Router) => {
    setSelectedRouter(router)
    setIsDetailOpen(true)
  }

  const getStatusIcon = (status: RouterStatus) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "offline":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />
      case "maintenance":
        return <Settings className="w-4 h-4 text-blue-600" />
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

  const getEventIcon = (type: RouterEvent["type"]) => {
    switch (type) {
      case "up":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "down":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />
      case "config_change":
        return <Settings className="w-4 h-4 text-blue-600" />
      case "reboot":
        return <RefreshCw className="w-4 h-4 text-purple-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Router Management</h1>
          <p className="text-slate-500 mt-1">Monitor and manage network access servers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
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
                <p className="text-2xl font-bold">{routers.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
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
                <p className="text-2xl font-bold text-amber-600">{stats.warning}</p>
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
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
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
                <p className="text-2xl font-bold text-emerald-600">{stats.avgUptime.toFixed(1)}%</p>
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
                <p className="text-2xl font-bold text-purple-600">{stats.belowSla}</p>
                <p className="text-xs text-slate-500">Below SLA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grid" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search routers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
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
              <SelectTrigger className="w-32">
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
        </div>

        {/* Grid View */}
        <TabsContent value="grid" className="mt-0">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRouters.map((router) => (
              <Card 
                key={router.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  router.status === "offline" ? "border-red-200 bg-red-50/30" :
                  router.status === "warning" ? "border-amber-200 bg-amber-50/30" :
                  router.status === "maintenance" ? "border-blue-200 bg-blue-50/30" :
                  ""
                }`}
                onClick={() => handleViewDetails(router)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        router.status === "online" ? "bg-green-100" :
                        router.status === "offline" ? "bg-red-100" :
                        router.status === "warning" ? "bg-amber-100" :
                        "bg-blue-100"
                      }`}>
                        <Server className={`w-5 h-5 ${
                          router.status === "online" ? "text-green-600" :
                          router.status === "offline" ? "text-red-600" :
                          router.status === "warning" ? "text-amber-600" :
                          "text-blue-600"
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{router.name}</CardTitle>
                        <CardDescription className="text-xs">{router.ipAddress}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(router.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>{router.location}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{router.connectedUsers} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{router.uptime}</span>
                    </div>
                  </div>

                  {/* Uptime Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>SLA: {router.slaTarget}%</span>
                      <span className={router.uptimePercentage >= router.slaTarget ? "text-green-600" : "text-red-600"}>
                        {router.uptimePercentage.toFixed(2)}%
                      </span>
                    </div>
                    <Progress 
                      value={router.uptimePercentage} 
                      className={`h-2 ${router.uptimePercentage < router.slaTarget ? "[&>div]:bg-red-500" : ""}`}
                    />
                  </div>

                  {/* Metrics Preview */}
                  {router.status === "online" && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">CPU</p>
                        <p className={`font-medium ${router.metrics.cpuUsage > 80 ? "text-red-600" : router.metrics.cpuUsage > 60 ? "text-amber-600" : "text-slate-700"}`}>
                          {router.metrics.cpuUsage}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Memory</p>
                        <p className={`font-medium ${router.metrics.memoryUsage > 80 ? "text-red-600" : router.metrics.memoryUsage > 60 ? "text-amber-600" : "text-slate-700"}`}>
                          {router.metrics.memoryUsage}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Temp</p>
                        <p className={`font-medium ${router.metrics.temperature > 65 ? "text-red-600" : router.metrics.temperature > 55 ? "text-amber-600" : "text-slate-700"}`}>
                          {router.metrics.temperature}°C
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {router.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Router</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRouters.map((router) => (
                    <TableRow key={router.id} className="cursor-pointer" onClick={() => handleViewDetails(router)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{router.name}</p>
                          <p className="text-xs text-slate-500">{router.model}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{router.ipAddress}</TableCell>
                      <TableCell>{getTypeBadge(router.routerType)}</TableCell>
                      <TableCell className="text-sm">{router.location}</TableCell>
                      <TableCell>{getStatusBadge(router.status)}</TableCell>
                      <TableCell>{router.connectedUsers}</TableCell>
                      <TableCell className="text-sm">{router.uptime}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${router.uptimePercentage >= router.slaTarget ? "text-green-600" : "text-red-600"}`}>
                            {router.uptimePercentage.toFixed(1)}%
                          </span>
                          {router.uptimePercentage < router.slaTarget && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{router.lastSeen}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(router)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Terminal className="w-4 h-4 mr-2" />
                              SSH Console
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reboot
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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

        {/* Monitoring View */}
        <TabsContent value="monitoring" className="mt-0 space-y-6">
          {/* SLA Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Performance Dashboard</CardTitle>
              <CardDescription>Service Level Agreement compliance across all routers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRouters.map((router) => (
                  <div key={router.id} className="flex items-center gap-4">
                    <div className="w-48">
                      <p className="font-medium text-sm">{router.name}</p>
                      <p className="text-xs text-slate-500">{router.location}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Target: {router.slaTarget}%</span>
                        <span className={router.uptimePercentage >= router.slaTarget ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {router.uptimePercentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${router.uptimePercentage >= router.slaTarget ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${router.uptimePercentage}%` }}
                        />
                        <div 
                          className="absolute top-0 h-full w-0.5 bg-slate-800"
                          style={{ left: `${router.slaTarget}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24">
                      {router.uptimePercentage >= router.slaTarget ? (
                        <Badge className="bg-green-100 text-green-700">Compliant</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">Violation</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bandwidth Usage */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bandwidth Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRouters.filter(r => r.status === "online").map((router) => (
                    <div key={router.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{router.name}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-green-600">
                            <Download className="w-3 h-3" />
                            {router.metrics.downloadSpeed} Mbps
                          </span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <Upload className="w-3 h-3" />
                            {router.metrics.uploadSpeed} Mbps
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-green-500 rounded-l" 
                          style={{ width: `${(router.metrics.downloadSpeed / 1000) * 100}%` }}
                        />
                        <div 
                          className="bg-blue-500 rounded-r" 
                          style={{ width: `${(router.metrics.uploadSpeed / 1000) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRouters.filter(r => r.status === "online").map((router) => (
                    <div key={router.id} className="flex items-center gap-4">
                      <div className="w-32">
                        <p className="font-medium text-sm truncate">{router.name}</p>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>CPU</span>
                            <span className={router.metrics.cpuUsage > 80 ? "text-red-600" : "text-slate-600"}>
                              {router.metrics.cpuUsage}%
                            </span>
                          </div>
                          <Progress 
                            value={router.metrics.cpuUsage} 
                            className={`h-2 ${router.metrics.cpuUsage > 80 ? "[&>div]:bg-red-500" : router.metrics.cpuUsage > 60 ? "[&>div]:bg-amber-500" : ""}`}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Memory</span>
                            <span className={router.metrics.memoryUsage > 80 ? "text-red-600" : "text-slate-600"}>
                              {router.metrics.memoryUsage}%
                            </span>
                          </div>
                          <Progress 
                            value={router.metrics.memoryUsage} 
                            className={`h-2 ${router.metrics.memoryUsage > 80 ? "[&>div]:bg-red-500" : router.metrics.memoryUsage > 60 ? "[&>div]:bg-amber-500" : ""}`}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Temp</span>
                            <span className={router.metrics.temperature > 65 ? "text-red-600" : "text-slate-600"}>
                              {router.metrics.temperature}°C
                            </span>
                          </div>
                          <Progress 
                            value={(router.metrics.temperature / 80) * 100} 
                            className={`h-2 ${router.metrics.temperature > 65 ? "[&>div]:bg-red-500" : router.metrics.temperature > 55 ? "[&>div]:bg-amber-500" : ""}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest router events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {routers.flatMap(router => 
                  router.events.map(event => ({ ...event, routerName: router.name }))
                ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-slate-500">{event.routerName}</p>
                    </div>
                    <span className="text-xs text-slate-400">{event.timestamp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Router Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          {selectedRouter && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    selectedRouter.status === "online" ? "bg-green-100" :
                    selectedRouter.status === "offline" ? "bg-red-100" :
                    selectedRouter.status === "warning" ? "bg-amber-100" :
                    "bg-blue-100"
                  }`}>
                    <Server className={`w-6 h-6 ${
                      selectedRouter.status === "online" ? "text-green-600" :
                      selectedRouter.status === "offline" ? "text-red-600" :
                      selectedRouter.status === "warning" ? "text-amber-600" :
                      "text-blue-600"
                    }`} />
                  </div>
                  <div>
                    <SheetTitle>{selectedRouter.name}</SheetTitle>
                    <SheetDescription>{selectedRouter.ipAddress}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-180px)] mt-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="metrics" className="flex-1">Metrics</TabsTrigger>
                    <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedRouter.status)}
                      {getTypeBadge(selectedRouter.routerType)}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Model</p>
                        <p className="font-medium">{selectedRouter.model}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">MAC Address</p>
                        <p className="font-mono text-sm">{selectedRouter.macAddress}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="font-medium">{selectedRouter.location}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Connected Users</p>
                        <p className="font-medium">{selectedRouter.connectedUsers}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Uptime</p>
                        <p className="font-medium">{selectedRouter.uptime}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Last Seen</p>
                        <p className="font-medium">{selectedRouter.lastSeen}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3">SLA Compliance</h4>
                      <div className="p-4 rounded-lg border">
                        <div className="flex justify-between mb-2">
                          <span>Target: {selectedRouter.slaTarget}%</span>
                          <span className={selectedRouter.uptimePercentage >= selectedRouter.slaTarget ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            Current: {selectedRouter.uptimePercentage.toFixed(2)}%
                          </span>
                        </div>
                        <Progress value={selectedRouter.uptimePercentage} className="h-3" />
                        <div className="mt-2 text-center">
                          {selectedRouter.uptimePercentage >= selectedRouter.slaTarget ? (
                            <Badge className="bg-green-100 text-green-700">✓ Meeting SLA</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">✗ SLA Violation</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRouter.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="justify-start">
                          <Terminal className="w-4 h-4 mr-2" />
                          SSH Console
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reboot
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Config
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <History className="w-4 h-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="mt-4 space-y-4">
                    {selectedRouter.status === "online" ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">CPU Usage</span>
                                <Gauge className="w-4 h-4 text-slate-400" />
                              </div>
                              <p className={`text-3xl font-bold ${
                                selectedRouter.metrics.cpuUsage > 80 ? "text-red-600" :
                                selectedRouter.metrics.cpuUsage > 60 ? "text-amber-600" :
                                "text-green-600"
                              }`}>
                                {selectedRouter.metrics.cpuUsage}%
                              </p>
                              <Progress value={selectedRouter.metrics.cpuUsage} className="mt-2 h-2" />
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">Memory Usage</span>
                                <Zap className="w-4 h-4 text-slate-400" />
                              </div>
                              <p className={`text-3xl font-bold ${
                                selectedRouter.metrics.memoryUsage > 80 ? "text-red-600" :
                                selectedRouter.metrics.memoryUsage > 60 ? "text-amber-600" :
                                "text-green-600"
                              }`}>
                                {selectedRouter.metrics.memoryUsage}%
                              </p>
                              <Progress value={selectedRouter.metrics.memoryUsage} className="mt-2 h-2" />
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Bandwidth</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <Download className="w-5 h-5 text-green-600" />
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Download</span>
                                    <span className="font-medium">{selectedRouter.metrics.downloadSpeed} Mbps</span>
                                  </div>
                                  <Progress value={(selectedRouter.metrics.downloadSpeed / 1000) * 100} className="h-2 [&>div]:bg-green-500" />
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Upload className="w-5 h-5 text-blue-600" />
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Upload</span>
                                    <span className="font-medium">{selectedRouter.metrics.uploadSpeed} Mbps</span>
                                  </div>
                                  <Progress value={(selectedRouter.metrics.uploadSpeed / 1000) * 100} className="h-2 [&>div]:bg-blue-500" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">Temperature</p>
                            <p className={`text-2xl font-bold ${
                              selectedRouter.metrics.temperature > 65 ? "text-red-600" :
                              selectedRouter.metrics.temperature > 55 ? "text-amber-600" :
                              "text-green-600"
                            }`}>
                              {selectedRouter.metrics.temperature}°C
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">Active Connections</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedRouter.metrics.activeConnections}
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">Packets In</p>
                            <p className="text-lg font-mono">
                              {(selectedRouter.metrics.packetsIn / 1000000).toFixed(1)}M
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">Packets Out</p>
                            <p className="text-lg font-mono">
                              {(selectedRouter.metrics.packetsOut / 1000000).toFixed(1)}M
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <WifiOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Router is {selectedRouter.status}</p>
                        <p className="text-sm">Metrics unavailable</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="events" className="mt-4">
                    <div className="space-y-3">
                      {selectedRouter.events.length > 0 ? selectedRouter.events.map((event) => (
                        <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          {getEventIcon(event.type)}
                          <div className="flex-1">
                            <p className="text-sm">{event.message}</p>
                            <p className="text-xs text-slate-500">{event.timestamp}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-slate-500">
                          <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">No recent events</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Router Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Router</DialogTitle>
            <DialogDescription>Configure a new NAS/Router for your network</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Router Name</Label>
                <Input placeholder="e.g., Main Gateway" />
              </div>
              <div className="space-y-2">
                <Label>Router Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
                <Label>IP Address</Label>
                <Input placeholder="192.168.1.1" />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input placeholder="e.g., CCR1036-12G-4S" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>RADIUS Secret</Label>
              <Input type="password" placeholder="Shared secret for RADIUS" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="e.g., Nairobi - Main Office" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SLA Target (%)</Label>
                <Input type="number" placeholder="99.9" defaultValue="99.9" />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input placeholder="production, primary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes about this router..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>Add Router</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
