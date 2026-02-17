"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { adminApi } from "@/lib/admin-api"
import {
  Radio,
  ArrowLeft,
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
  Download,
  Upload,
  Settings,
  Eye,
  Power,
  Terminal,
  BarChart3,
  MapPin,
  Signal,
  Gauge,
  Zap,
  AlertCircle,
  Search,
  Filter,
  Server,
  Cpu,
  Thermometer,
  HardDrive,
  Network,
  ChevronRight,
  User,
  Cable,
  Waves,
  Info,
  History,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { OLT, PONPort, ONU } from "@/lib/types"

const getPortStatusBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }> = {
    active: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    inactive: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    fault: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  }
  const c = config[status] || config.inactive
  return (
    <Badge variant={c.variant} className="capitalize gap-1">
      {c.icon}
      {status}
    </Badge>
  )
}

const getONUStatusBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    online: { variant: "default", icon: <Wifi className="h-3 w-3" /> },
    offline: { variant: "secondary", icon: <WifiOff className="h-3 w-3" /> },
    los: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
    dying_gasp: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
    power_fail: { variant: "destructive", icon: <Power className="h-3 w-3" /> },
  }
  const c = config[status] || config.offline
  return (
    <Badge variant={c.variant} className="capitalize gap-1">
      {c.icon}
      {status.replace('_', ' ')}
    </Badge>
  )
}

const getPowerColor = (power: number) => {
  if (power > -20) return "text-green-600"
  if (power > -25) return "text-yellow-600"
  return "text-red-600"
}

export default function OLTDetailPage() {
  const params = useParams()
  const router = useRouter()
  const oltId = parseInt(params.id as string)
  
  const [olt, setOlt] = useState<OLT | null>(null)
  const [ponPorts, setPonPorts] = useState<PONPort[]>([])
  const [selectedPort, setSelectedPort] = useState<PONPort | null>(null)
  const [portONUs, setPortONUs] = useState<ONU[]>([])
  const [isPortDetailOpen, setIsPortDetailOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [allONUs, setAllONUs] = useState<ONU[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [oltData, portsData] = await Promise.all([
        adminApi.getOLT(oltId),
        adminApi.getOLTPONPorts(oltId),
      ])
      setOlt(oltData)
      setPonPorts(portsData || [])
      // Fetch ONUs for this OLT
      try {
        const onuResponse = await adminApi.getONUs({ olt: String(oltId), page_size: '200' })
        setAllONUs(onuResponse.results || [])
      } catch { setAllONUs([]) }
    } catch (error) {
      console.error('Failed to fetch OLT data:', error)
    } finally {
      setLoading(false)
    }
  }, [oltId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePortClick = async (port: PONPort) => {
    setSelectedPort(port)
    setIsPortDetailOpen(true)
    try {
      const onuResponse = await adminApi.getONUs({ pon_port: String(port.id), page_size: '100' })
      setPortONUs(onuResponse.results || [])
    } catch (error) {
      console.error('Failed to fetch ONUs for port:', error)
      setPortONUs([])
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const filteredPorts = useMemo(() => {
    return ponPorts.filter((port) => {
      const matchesSearch = 
        port.port_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        port.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || port.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [ponPorts, searchQuery, statusFilter])

  const stats = useMemo(() => {
    const activePorts = ponPorts.filter((p) => p.status === "active").length
    const faultPorts = ponPorts.filter((p) => p.status === "fault").length
    const totalOnus = ponPorts.reduce((sum, p) => sum + p.total_onus, 0)
    const onlineOnus = ponPorts.reduce((sum, p) => sum + p.online_onus, 0)
    const avgRxPower = ponPorts.reduce((sum, p) => sum + (p.rx_power || 0), 0) / ponPorts.length
    return { activePorts, faultPorts, totalOnus, onlineOnus, avgRxPower }
  }, [ponPorts])

  if (loading || !olt) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header with Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/olt" className="hover:text-foreground">
            OLT Management
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{olt.name}</span>
        </div>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{olt.name}</h1>
                <Badge variant={olt.status === 'online' ? 'default' : 'destructive'}>
                  {olt.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {olt.model} • {olt.ip_address} • {olt.location}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit OLT
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Terminal className="mr-2 h-4 w-4" />
                  SSH Console
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Config
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Power className="mr-2 h-4 w-4" />
                  Reboot OLT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PON Ports</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePorts}/{olt.total_pon_ports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.faultPorts > 0 && (
                <span className="text-red-600">{stats.faultPorts} fault</span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ONUs</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOnus}</div>
            <p className="text-xs">
              <span className="text-green-600">{stats.onlineOnus}</span>
              <span className="text-muted-foreground"> online ({Math.round(stats.onlineOnus / stats.totalOnus * 100)}%)</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rx Power</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPowerColor(stats.avgRxPower)}`}>
              {stats.avgRxPower.toFixed(2)} dBm
            </div>
            <p className="text-xs text-muted-foreground">Optical signal</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU / Memory</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{olt.cpu_usage}% / {olt.memory_usage}%</div>
            <div className="flex gap-1 mt-1">
              <Progress value={olt.cpu_usage} className="h-1 flex-1" />
              <Progress value={olt.memory_usage} className="h-1 flex-1" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{olt.uptime?.split(' ')[0]}</div>
            <p className="text-xs text-muted-foreground">{olt.uptime}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ports">PON Ports</TabsTrigger>
          <TabsTrigger value="onus">All ONUs</TabsTrigger>
          <TabsTrigger value="details">OLT Details</TabsTrigger>
          <TabsTrigger value="events">Events Log</TabsTrigger>
        </TabsList>

        <TabsContent value="ports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search ports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="fault">Fault</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* PON Ports Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredPorts.map((port) => (
              <Card 
                key={port.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  port.status === 'fault' ? 'border-red-300 dark:border-red-800' :
                  port.status === 'inactive' ? 'border-gray-300 dark:border-gray-700' : ''
                }`}
                onClick={() => handlePortClick(port)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {port.port_number}
                    </CardTitle>
                    {getPortStatusBadge(port.status)}
                  </div>
                  <CardDescription className="text-xs">
                    {port.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">ONUs:</span>
                      <div className="font-medium">
                        <span className="text-green-600">{port.online_onus}</span>
                        <span className="text-muted-foreground">/{port.total_onus}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rx Power:</span>
                      <div className={`font-medium ${getPowerColor(port.rx_power || 0)}`}>
                        {port.rx_power?.toFixed(2)} dBm
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(port.online_onus / port.total_onus) * 100}
                    className="mt-3 h-1.5"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="onus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All ONUs on this OLT</CardTitle>
              <CardDescription>
                Total {olt.total_onus} ONUs across all PON ports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>PON Port</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rx Power</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allONUs.slice(0, 10).map((onu) => (
                    <TableRow key={onu.id}>
                      <TableCell className="font-mono text-sm">{onu.serial_number}</TableCell>
                      <TableCell>{onu.pon_port_name}</TableCell>
                      <TableCell>
                        {onu.customer_name ? (
                          <Link href={`/admin/users/${onu.customer}`} className="hover:underline">
                            {onu.customer_name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{getONUStatusBadge(onu.status)}</TableCell>
                      <TableCell className={getPowerColor(onu.rx_power || 0)}>
                        {onu.rx_power?.toFixed(2)} dBm
                      </TableCell>
                      <TableCell>{onu.distance}m</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{onu.last_seen}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href="/admin/onu">View All ONUs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Manufacturer</Label>
                    <p className="font-medium capitalize">{olt.manufacturer}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model</Label>
                    <p className="font-medium">{olt.model}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Serial Number</Label>
                    <p className="font-medium font-mono">{olt.serial_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Firmware</Label>
                    <p className="font-medium">{olt.firmware_version}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">IP Address</Label>
                    <p className="font-medium font-mono">{olt.ip_address}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">MAC Address</Label>
                    <p className="font-medium font-mono">AA:BB:CC:DD:EE:01</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">{olt.location}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Latitude</Label>
                    <p className="font-medium">{olt.latitude}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Longitude</Label>
                    <p className="font-medium">{olt.longitude}</p>
                  </div>
                </div>
                <div className="h-40 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  Map View (Integration Required)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      CPU Usage
                    </Label>
                    <span className="font-medium">{olt.cpu_usage}%</span>
                  </div>
                  <Progress value={olt.cpu_usage} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Memory Usage
                    </Label>
                    <span className="font-medium">{olt.memory_usage}%</span>
                  </div>
                  <Progress value={olt.memory_usage} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Temperature
                    </Label>
                    <span className={`font-medium ${olt.temperature && olt.temperature > 55 ? 'text-red-600' : ''}`}>
                      {olt.temperature}°C
                    </span>
                  </div>
                  <Progress 
                    value={(olt.temperature || 0) / 80 * 100} 
                    className={olt.temperature && olt.temperature > 55 ? "bg-red-100" : ""}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{new Date(olt.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="font-medium">{new Date(olt.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Seen</Label>
                  <p className="font-medium">{olt.last_seen}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uptime</Label>
                  <p className="font-medium">{olt.uptime}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>OLT system events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-4">No recent events</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Port Detail Sheet */}
      <Sheet open={isPortDetailOpen} onOpenChange={setIsPortDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedPort && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  PON Port {selectedPort.port_number}
                  {getPortStatusBadge(selectedPort.status)}
                </SheetTitle>
                <SheetDescription>
                  {selectedPort.description}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Port Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ONUs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        <span className="text-green-600">{selectedPort.online_onus}</span>
                        <span className="text-muted-foreground">/{selectedPort.total_onus}</span>
                      </div>
                      <Progress 
                        value={(selectedPort.online_onus / selectedPort.total_onus) * 100}
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Optical Power</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${getPowerColor(selectedPort.rx_power || 0)}`}>
                        {selectedPort.rx_power?.toFixed(2)} dBm
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tx: {selectedPort.tx_power?.toFixed(2)} dBm
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* ONUs on this port */}
                <div>
                  <h4 className="font-medium mb-3">ONUs on this Port</h4>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Rx Power</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portONUs.map((onu) => (
                          <TableRow key={onu.id}>
                            <TableCell className="font-mono text-xs">
                              {onu.serial_number}
                            </TableCell>
                            <TableCell>
                              {onu.customer_name || (
                                <span className="text-muted-foreground text-xs">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>{getONUStatusBadge(onu.status)}</TableCell>
                            <TableCell className={getPowerColor(onu.rx_power || 0)}>
                              {onu.rx_power?.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/admin/onu?olt=${olt.id}&port=${selectedPort.id}`}>
                      View All ONUs
                    </Link>
                  </Button>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Port
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
