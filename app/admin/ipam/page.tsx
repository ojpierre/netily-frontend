"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  Network,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Download,
  Search,
  Filter,
  Globe,
  Server,
  Wifi,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Copy,
  Layers,
  Activity,
  Router,
  Share2,
  Settings,
  Zap,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi } from "@/lib/admin-api"
import type { Subnet, IPAddress, DHCPLease, IPPool, IPPoolsByRouter, Router as RouterType } from "@/lib/types"

type SubnetStatus = 'active' | 'inactive' | 'full'
type IPStatus = 'available' | 'assigned' | 'reserved' | 'dhcp'



const getStatusBadge = (status: IPStatus) => {
  const config: Record<IPStatus, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    available: { variant: "outline", color: "text-green-600" },
    assigned: { variant: "default", color: "" },
    reserved: { variant: "secondary", color: "text-yellow-600" },
    dhcp: { variant: "outline", color: "text-blue-600" },
  }
  const c = config[status]
  return (
    <Badge variant={c.variant} className={`capitalize ${c.color}`}>
      {status}
    </Badge>
  )
}

const getUsageColor = (percent: number) => {
  if (percent >= 90) return "text-red-600"
  if (percent >= 75) return "text-yellow-600"
  return "text-green-600"
}

const getProgressColor = (percent: number) => {
  if (percent >= 90) return "bg-red-500"
  if (percent >= 75) return "bg-yellow-500"
  return "bg-green-500"
}

export default function IPAMPage() {
  const [loading, setLoading] = useState(true)
  const [subnets, setSubnets] = useState<(Subnet & { usage_percent: number; available: number; total: number })[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("subnets")
  const [selectedSubnet, setSelectedSubnet] = useState<typeof subnets[0] | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateSubnetOpen, setIsCreateSubnetOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([])
  const [dhcpLeases, setDhcpLeases] = useState<DHCPLease[]>([])
  const [poolsByRouter, setPoolsByRouter] = useState<IPPoolsByRouter[]>([])
  const [routers, setRouters] = useState<RouterType[]>([])
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false)
  const [creatingPool, setCreatingPool] = useState(false)
  const [editingPool, setEditingPool] = useState<IPPool | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [subnetsRes, dhcpRes, poolsRes, routersRes] = await Promise.allSettled([
        adminApi.getSubnets({ page_size: "100" }),
        adminApi.getDHCPLeases({ page_size: "100" }),
        adminApi.getIPPoolsByRouter(),
        adminApi.getRouters({ page_size: "100" }),
      ])
      if (subnetsRes.status === "fulfilled") {
        setSubnets(
          (subnetsRes.value.results || []).map(s => ({
            ...s,
            usage_percent: 0,
            available: 0,
            total: 0,
          }))
        )
      }
      if (dhcpRes.status === "fulfilled") {
        setDhcpLeases(dhcpRes.value.results || [])
      }
      if (poolsRes.status === "fulfilled") {
        setPoolsByRouter(poolsRes.value || [])
      }
      if (routersRes.status === "fulfilled") {
        setRouters(routersRes.value.results || [])
      }
    } catch (err) {
      console.error("Failed to load IPAM data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Subnet form state
  const [subnetForm, setSubnetForm] = useState({
    network: "",
    name: "",
    vlan: "",
    gateway: "",
    dns_primary: "8.8.8.8",
    dns_secondary: "8.8.4.4",
    dhcp_enabled: true,
    dhcp_start: "",
    dhcp_end: "",
    description: "",
  })

  // IP Pool form state
  const [poolForm, setPoolForm] = useState({
    router: "" as string,
    name: "",
    pool_type: "PPPOE" as string,
    start_ip: "",
    end_ip: "",
    gateway: "",
    dns_servers: "8.8.8.8,8.8.4.4",
    description: "",
    is_active: true,
  })

  const resetPoolForm = () => {
    setPoolForm({
      router: "",
      name: "",
      pool_type: "PPPOE",
      start_ip: "",
      end_ip: "",
      gateway: "",
      dns_servers: "8.8.8.8,8.8.4.4",
      description: "",
      is_active: true,
    })
    setEditingPool(null)
  }

  // Stats
  const stats = useMemo(() => {
    const totalIPs = subnets.reduce((sum, s) => sum + s.total, 0)
    const usedIPs = subnets.reduce((sum, s) => sum + (s.total - s.available), 0)
    const activeSubnets = subnets.filter(s => s.is_active).length
    const dhcpEnabled = subnets.filter(s => s.dhcp_enabled).length
    
    return {
      totalSubnets: subnets.length,
      activeSubnets,
      totalIPs,
      usedIPs,
      availableIPs: totalIPs - usedIPs,
      dhcpEnabled,
      utilizationPercent: Math.round((usedIPs / totalIPs) * 100),
    }
  }, [subnets])

  const filteredSubnets = useMemo(() => {
    if (!searchQuery) return subnets
    return subnets.filter(s =>
      s.network.includes(searchQuery) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vlan?.toString().includes(searchQuery)
    )
  }, [subnets, searchQuery])

  const handleViewSubnet = async (subnet: typeof subnets[0]) => {
    setSelectedSubnet(subnet)
    try {
      const res = await adminApi.getIPAddresses({ subnet: String(subnet.id), page_size: "100" })
      setIPAddresses(res.results || [])
    } catch (err) {
      console.error("Failed to load IP addresses:", err)
      setIPAddresses([])
    }
    setIsDetailOpen(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const handleCreateSubnet = async () => {
    console.log("Creating subnet:", subnetForm)
    setIsCreateSubnetOpen(false)
    setSubnetForm({
      network: "",
      name: "",
      vlan: "",
      gateway: "",
      dns_primary: "8.8.8.8",
      dns_secondary: "8.8.4.4",
      dhcp_enabled: true,
      dhcp_start: "",
      dhcp_end: "",
      description: "",
    })
  }

  // Pool stats
  const poolStats = useMemo(() => {
    const allPools = poolsByRouter.flatMap(r => r.pools)
    const totalPools = allPools.length
    const activePools = allPools.filter(p => p.is_active).length
    const totalPoolIPs = allPools.reduce((sum, p) => sum + (p.total_ips || 0), 0)
    const usedPoolIPs = allPools.reduce((sum, p) => sum + (p.used_ips || 0), 0)
    return {
      totalPools,
      activePools,
      totalPoolIPs,
      usedPoolIPs,
      availablePoolIPs: totalPoolIPs - usedPoolIPs,
      routersWithPools: poolsByRouter.length,
    }
  }, [poolsByRouter])

  const handleCreatePool = async () => {
    if (!poolForm.router || !poolForm.name || !poolForm.start_ip || !poolForm.end_ip) {
      return
    }
    try {
      setCreatingPool(true)
      const data: Record<string, any> = {
        router: parseInt(poolForm.router, 10),
        name: poolForm.name,
        pool_type: poolForm.pool_type,
        start_ip: poolForm.start_ip,
        end_ip: poolForm.end_ip,
        gateway: poolForm.gateway || undefined,
        dns_servers: poolForm.dns_servers || undefined,
        description: poolForm.description || undefined,
        is_active: poolForm.is_active,
      }

      if (editingPool) {
        await adminApi.updateIPPool(editingPool.id, data)
      } else {
        await adminApi.createIPPool(data)
      }

      resetPoolForm()
      setIsCreatePoolOpen(false)
      await fetchData()
    } catch (err) {
      console.error("Failed to save IP pool:", err)
    } finally {
      setCreatingPool(false)
    }
  }

  const handleEditPool = (pool: IPPool) => {
    setEditingPool(pool)
    setPoolForm({
      router: pool.router ? String(pool.router) : "",
      name: pool.name,
      pool_type: pool.pool_type,
      start_ip: pool.start_ip,
      end_ip: pool.end_ip,
      gateway: pool.gateway || "",
      dns_servers: pool.dns_servers || "8.8.8.8,8.8.4.4",
      description: pool.description || "",
      is_active: pool.is_active,
    })
    setIsCreatePoolOpen(true)
  }

  const handleDeletePool = async (pool: IPPool) => {
    if (!confirm(`Delete pool "${pool.name}" from ${pool.router_name}?`)) return
    try {
      await adminApi.deleteIPPool(pool.id)
      await fetchData()
    } catch (err) {
      console.error("Failed to delete pool:", err)
    }
  }

  const getRouterStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'text-green-600 bg-green-50 border-green-200'
      case 'offline': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const getPoolTypeBadge = (type: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      PPPOE: { variant: "default", className: "bg-purple-500" },
      DHCP: { variant: "default", className: "bg-blue-500" },
      STATIC: { variant: "secondary", className: "" },
      HOTSPOT: { variant: "default", className: "bg-orange-500" },
      MANAGEMENT: { variant: "outline", className: "" },
    }
    const c = config[type] || { variant: "outline" as const, className: "" }
    return <Badge variant={c.variant} className={c.className}>{type}</Badge>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IP Address Management</h1>
          <p className="text-muted-foreground">
            Manage subnets, IP addresses, and DHCP leases
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateSubnetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subnet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subnets</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubnets}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSubnets} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total IP Addresses</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIPs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all subnets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUsageColor(stats.utilizationPercent)}`}>
              {stats.utilizationPercent}%
            </div>
            <Progress value={stats.utilizationPercent} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available IPs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.availableIPs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ready for allocation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="subnets" className="gap-2">
            <Network className="h-4 w-4" />
            Subnets
          </TabsTrigger>
          <TabsTrigger value="pools" className="gap-2">
            <Layers className="h-4 w-4" />
            IP Pools
          </TabsTrigger>
          <TabsTrigger value="dhcp" className="gap-2">
            <Server className="h-4 w-4" />
            DHCP Leases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subnets" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Subnets</CardTitle>
                  <CardDescription>
                    Manage network subnets and IP pools
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search subnets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>VLAN</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>DHCP</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubnets.map((subnet) => (
                    <TableRow key={subnet.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-medium">{subnet.network}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{subnet.name}</span>
                          {subnet.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {subnet.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">VLAN {subnet.vlan}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{subnet.gateway}</span>
                      </TableCell>
                      <TableCell>
                        {subnet.dhcp_enabled ? (
                          <Badge variant="default" className="bg-blue-500">
                            <Zap className="mr-1 h-3 w-3" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">Static</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={subnet.usage_percent}
                            className="h-2 w-20"
                          />
                          <span className={`text-sm font-medium ${getUsageColor(subnet.usage_percent)}`}>
                            {subnet.usage_percent}%
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {subnet.available} / {subnet.total} available
                        </span>
                      </TableCell>
                      <TableCell>
                        {subnet.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewSubnet(subnet)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View IPs
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Subnet
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              DHCP Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Subnet
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

        {/* IP Pools Tab — grouped by router */}
        <TabsContent value="pools" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">IP Pools by Router</h2>
              <p className="text-sm text-muted-foreground">
                {poolStats.totalPools} pools across {poolStats.routersWithPools} routers · {poolStats.availablePoolIPs.toLocaleString()} IPs available
              </p>
            </div>
            <Button onClick={() => { resetPoolForm(); setIsCreatePoolOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Add IP Pool
            </Button>
          </div>

          {poolsByRouter.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No IP Pools Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Create IP pools on your routers to manage PPPoE address assignment.
                </p>
                <Button onClick={() => { resetPoolForm(); setIsCreatePoolOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Pool
                </Button>
              </CardContent>
            </Card>
          ) : (
            poolsByRouter.map((group) => (
              <Card key={group.router_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Router className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{group.router_name}</CardTitle>
                        <CardDescription className="font-mono">{group.router_ip}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getRouterStatusColor(group.router_status)}>
                      {group.router_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pool Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>IP Range</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.pools.map((pool) => (
                        <TableRow key={pool.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{pool.name}</span>
                              {pool.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {pool.description}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getPoolTypeBadge(pool.pool_type)}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{pool.start_ip} – {pool.end_ip}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{pool.gateway || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={pool.utilization_percentage} className="h-2 w-20" />
                              <span className={`text-sm font-medium ${getUsageColor(pool.utilization_percentage)}`}>
                                {Math.round(pool.utilization_percentage)}%
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {pool.available_ips} / {pool.total_ips} free
                            </span>
                          </TableCell>
                          <TableCell>
                            {pool.is_active ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPool(pool)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Pool
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePool(pool)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Pool
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
            ))
          )}
        </TabsContent>

        <TabsContent value="dhcp" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>DHCP Leases</CardTitle>
                  <CardDescription>
                    Active and expired DHCP leases
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Leases
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>Hostname</TableHead>
                    <TableHead>Lease Start</TableHead>
                    <TableHead>Lease Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dhcpLeases.map((lease) => (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <span className="font-mono font-medium">{lease.ip_address}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{lease.mac_address}</span>
                      </TableCell>
                      <TableCell>{lease.hostname || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(lease.lease_start).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(lease.lease_expiry).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {lease.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy MAC
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Make Static
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              Release Lease
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

      {/* Subnet Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedSubnet && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  {selectedSubnet.network}
                </SheetTitle>
                <SheetDescription>
                  {selectedSubnet.name}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Subnet Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Gateway</Label>
                    <p className="font-mono font-medium">{selectedSubnet.gateway}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">VLAN</Label>
                    <p className="font-medium">{selectedSubnet.vlan}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">DNS Primary</Label>
                    <p className="font-mono text-sm">{selectedSubnet.dns_primary}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">DNS Secondary</Label>
                    <p className="font-mono text-sm">{selectedSubnet.dns_secondary}</p>
                  </div>
                </div>

                {/* Utilization */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">IP Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedSubnet.total - selectedSubnet.available} used of {selectedSubnet.total}
                      </span>
                      <span className={`font-bold ${getUsageColor(selectedSubnet.usage_percent)}`}>
                        {selectedSubnet.usage_percent}%
                      </span>
                    </div>
                    <Progress value={selectedSubnet.usage_percent} className="h-3" />
                  </CardContent>
                </Card>

                {/* DHCP Info */}
                {selectedSubnet.dhcp_enabled && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        DHCP Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Range Start</Label>
                        <p className="font-mono">{selectedSubnet.dhcp_start}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Range End</Label>
                        <p className="font-mono">{selectedSubnet.dhcp_end}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Lease Time</Label>
                        <p>{selectedSubnet.lease_time ? `${selectedSubnet.lease_time / 3600} hours` : '-'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* IP Address List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">IP Addresses</h3>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Assign IP
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>MAC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ipAddresses.slice(0, 25).map((ip) => (
                          <TableRow key={ip.id}>
                            <TableCell className="font-mono text-sm">{ip.address}</TableCell>
                            <TableCell>{getStatusBadge(ip.status)}</TableCell>
                            <TableCell>{ip.customer_name || "-"}</TableCell>
                            <TableCell className="font-mono text-xs">{ip.mac_address || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Subnet Dialog */}
      <Dialog open={isCreateSubnetOpen} onOpenChange={setIsCreateSubnetOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Subnet</DialogTitle>
            <DialogDescription>
              Create a new IP subnet for address allocation
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="network">Network (CIDR)</Label>
                <Input
                  id="network"
                  placeholder="10.0.0.0/24"
                  value={subnetForm.network}
                  onChange={(e) => setSubnetForm({ ...subnetForm, network: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vlan">VLAN ID</Label>
                <Input
                  id="vlan"
                  placeholder="100"
                  value={subnetForm.vlan}
                  onChange={(e) => setSubnetForm({ ...subnetForm, vlan: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Subnet Name</Label>
              <Input
                id="name"
                placeholder="Customer Pool - Area"
                value={subnetForm.name}
                onChange={(e) => setSubnetForm({ ...subnetForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gateway">Gateway</Label>
              <Input
                id="gateway"
                placeholder="10.0.0.1"
                value={subnetForm.gateway}
                onChange={(e) => setSubnetForm({ ...subnetForm, gateway: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dns_primary">Primary DNS</Label>
                <Input
                  id="dns_primary"
                  value={subnetForm.dns_primary}
                  onChange={(e) => setSubnetForm({ ...subnetForm, dns_primary: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dns_secondary">Secondary DNS</Label>
                <Input
                  id="dns_secondary"
                  value={subnetForm.dns_secondary}
                  onChange={(e) => setSubnetForm({ ...subnetForm, dns_secondary: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="dhcp_enabled"
                checked={subnetForm.dhcp_enabled}
                onCheckedChange={(checked) => setSubnetForm({ ...subnetForm, dhcp_enabled: checked })}
              />
              <Label htmlFor="dhcp_enabled">Enable DHCP</Label>
            </div>
            {subnetForm.dhcp_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dhcp_start">DHCP Range Start</Label>
                  <Input
                    id="dhcp_start"
                    placeholder="10.0.0.10"
                    value={subnetForm.dhcp_start}
                    onChange={(e) => setSubnetForm({ ...subnetForm, dhcp_start: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dhcp_end">DHCP Range End</Label>
                  <Input
                    id="dhcp_end"
                    placeholder="10.0.0.250"
                    value={subnetForm.dhcp_end}
                    onChange={(e) => setSubnetForm({ ...subnetForm, dhcp_end: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Subnet description..."
                value={subnetForm.description}
                onChange={(e) => setSubnetForm({ ...subnetForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSubnetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubnet}>
              <Plus className="mr-2 h-4 w-4" />
              Create Subnet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit IP Pool Dialog */}
      <Dialog open={isCreatePoolOpen} onOpenChange={(open) => { setIsCreatePoolOpen(open); if (!open) resetPoolForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPool ? "Edit IP Pool" : "Add New IP Pool"}</DialogTitle>
            <DialogDescription>
              {editingPool
                ? "Update the IP pool configuration."
                : "Create an IP pool on a router for PPPoE/DHCP address assignment."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pool_router">Router *</Label>
              <Select
                value={poolForm.router}
                onValueChange={(v) => setPoolForm({ ...poolForm, router: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select router" />
                </SelectTrigger>
                <SelectContent>
                  {routers.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.ip_address}) — {r.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pool_name">Pool Name *</Label>
                <Input
                  id="pool_name"
                  placeholder="pppoe-pool-1"
                  value={poolForm.name}
                  onChange={(e) => setPoolForm({ ...poolForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pool_type">Pool Type</Label>
                <Select
                  value={poolForm.pool_type}
                  onValueChange={(v) => setPoolForm({ ...poolForm, pool_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPPOE">PPPoE</SelectItem>
                    <SelectItem value="DHCP">DHCP</SelectItem>
                    <SelectItem value="STATIC">Static</SelectItem>
                    <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                    <SelectItem value="MANAGEMENT">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pool_start">Start IP *</Label>
                <Input
                  id="pool_start"
                  placeholder="10.0.0.2"
                  value={poolForm.start_ip}
                  onChange={(e) => setPoolForm({ ...poolForm, start_ip: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pool_end">End IP *</Label>
                <Input
                  id="pool_end"
                  placeholder="10.0.0.254"
                  value={poolForm.end_ip}
                  onChange={(e) => setPoolForm({ ...poolForm, end_ip: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pool_gateway">Gateway</Label>
                <Input
                  id="pool_gateway"
                  placeholder="10.0.0.1"
                  value={poolForm.gateway}
                  onChange={(e) => setPoolForm({ ...poolForm, gateway: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pool_dns">DNS Servers</Label>
                <Input
                  id="pool_dns"
                  placeholder="8.8.8.8,8.8.4.4"
                  value={poolForm.dns_servers}
                  onChange={(e) => setPoolForm({ ...poolForm, dns_servers: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pool_desc">Description (Optional)</Label>
              <Textarea
                id="pool_desc"
                placeholder="Pool for residential PPPoE customers..."
                value={poolForm.description}
                onChange={(e) => setPoolForm({ ...poolForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="pool_active"
                checked={poolForm.is_active}
                onCheckedChange={(checked) => setPoolForm({ ...poolForm, is_active: checked })}
              />
              <Label htmlFor="pool_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreatePoolOpen(false); resetPoolForm() }} disabled={creatingPool}>
              Cancel
            </Button>
            <Button onClick={handleCreatePool} disabled={creatingPool || !poolForm.router || !poolForm.name || !poolForm.start_ip || !poolForm.end_ip}>
              {creatingPool ? "Saving..." : editingPool ? "Update Pool" : "Create Pool"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
