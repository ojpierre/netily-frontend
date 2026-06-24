"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { adminApi } from "@/lib/admin-api"
import Link from "next/link"
import {
  Radio,
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
  Download,
  Settings,
  Eye,
  Power,
  Search,
  Filter,
  Server,
  Signal,
  MapPin,
  User,
  Zap,
  Cable,
  ChevronRight,
  Play,
  RotateCcw,
  Terminal,
  Unplug,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { ONU, OLT } from "@/lib/types"

const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
    online: { variant: "default", icon: <Wifi className="h-3 w-3" />, color: "text-success" },
    offline: { variant: "secondary", icon: <WifiOff className="h-3 w-3" />, color: "text-gray-600" },
    los: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" />, color: "text-destructive" },
    dying_gasp: { variant: "destructive", icon: <Zap className="h-3 w-3" />, color: "text-warning" },
    power_fail: { variant: "destructive", icon: <Power className="h-3 w-3" />, color: "text-destructive" },
  }
  const c = config[status] || config.offline
  return (
    <Badge variant={c.variant} className="capitalize gap-1">
      {c.icon}
      {status.replace('_', ' ')}
    </Badge>
  )
}

const getRegistrationBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "outline" }> = {
    registered: { variant: "default" },
    unregistered: { variant: "outline" },
    pending: { variant: "secondary" },
  }
  return (
    <Badge variant={config[status]?.variant || "secondary"} className="capitalize">
      {status}
    </Badge>
  )
}

const getPowerColor = (power: number) => {
  if (power > -20) return "text-success"
  if (power > -25) return "text-warning"
  return "text-destructive"
}

const getPowerStatus = (power: number) => {
  if (power > -20) return { status: "Good", color: "text-success" }
  if (power > -25) return { status: "Warning", color: "text-warning" }
  return { status: "Critical", color: "text-destructive" }
}

export default function ONUManagementPage() {
  const [onus, setOnus] = useState<ONU[]>([])
  const [unregisteredONUs, setUnregisteredONUs] = useState<ONU[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [oltFilter, setOltFilter] = useState<string>("all")
  const [registrationFilter, setRegistrationFilter] = useState<string>("all")
  const [selectedONU, setSelectedONU] = useState<ONU | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false)
  const [onuToProvision, setOnuToProvision] = useState<ONU | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("registered")
  const [olts, setOlts] = useState<OLT[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [onuResponse, unregResponse, oltResponse] = await Promise.allSettled([
        adminApi.getONUs({ page_size: '200' }),
        adminApi.getUnregisteredONUs(),
        adminApi.getOLTs({ page_size: '100' }),
      ])
      if (onuResponse.status === 'fulfilled') setOnus(onuResponse.value.results || [])
      if (unregResponse.status === 'fulfilled') setUnregisteredONUs(unregResponse.value || [])
      if (oltResponse.status === 'fulfilled') setOlts(oltResponse.value.results || [])
    } catch (error) {
      console.error('Failed to fetch ONU data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered ONUs
  const filteredONUs = useMemo(() => {
    const list = activeTab === "unregistered" ? unregisteredONUs : onus
    return list.filter((onu) => {
      const matchesSearch =
        onu.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        onu.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        onu.olt_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        onu.mac_address?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || onu.status === statusFilter
      const matchesOlt = oltFilter === "all" || onu.olt === parseInt(oltFilter)
      const matchesRegistration = registrationFilter === "all" || onu.registration_status === registrationFilter
      
      return matchesSearch && matchesStatus && matchesOlt && matchesRegistration
    })
  }, [onus, unregisteredONUs, searchQuery, statusFilter, oltFilter, registrationFilter, activeTab])

  // Stats
  const stats = useMemo(() => {
    const online = onus.filter((o) => o.status === "online").length
    const offline = onus.filter((o) => o.status === "offline").length
    const los = onus.filter((o) => o.status === "los" || o.status === "dying_gasp").length
    const unassigned = onus.filter((o) => !o.customer).length
    const avgRxPower = onus.reduce((sum, o) => sum + (o.rx_power || 0), 0) / onus.length
    
    return { 
      total: onus.length, 
      online, 
      offline, 
      los, 
      unassigned,
      unregistered: unregisteredONUs.length,
      avgRxPower,
    }
  }, [onus, unregisteredONUs])

  const handleViewDetails = (onu: ONU) => {
    setSelectedONU(onu)
    setIsDetailOpen(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const handleProvision = async () => {
    if (onuToProvision && selectedCustomer) {
      try {
        await adminApi.provisionONU(onuToProvision.id, { customer: selectedCustomer })
        await fetchData()
      } catch (error) {
        console.error('Failed to provision ONU:', error)
      }
      setIsProvisionDialogOpen(false)
      setOnuToProvision(null)
      setSelectedCustomer("")
    }
  }

  const handleReboot = async (onu: ONU) => {
    // TODO: Add ONU reboot API when available
    console.error('ONU reboot API not yet available')
  }

  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const toggleAllRows = () => {
    if (selectedRows.length === filteredONUs.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredONUs.map(o => o.id))
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ONU Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage Optical Network Units across your fiber network
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ONUs</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.online}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.online / stats.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offline}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LOS / Fault</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.los}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unregistered</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.unregistered}</div>
            <p className="text-xs text-muted-foreground">Pending setup</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rx Power</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPowerColor(stats.avgRxPower)}`}>
              {stats.avgRxPower.toFixed(1)} dBm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registered">
            Registered ONUs
            <Badge variant="secondary" className="ml-2">{onus.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unregistered">
            Unregistered
            <Badge variant="destructive" className="ml-2">{unregisteredONUs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by serial, customer, OLT, or MAC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="los">LOS</SelectItem>
                  <SelectItem value="dying_gasp">Dying Gasp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={oltFilter} onValueChange={setOltFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="OLT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All OLTs</SelectItem>
                  {olts.map(olt => (
                    <SelectItem key={olt.id} value={String(olt.id)}>{olt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTab === "registered" && (
                <Select value={registrationFilter} onValueChange={setRegistrationFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Registration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <TabsContent value="registered" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registered ONUs</CardTitle>
                  <CardDescription>
                    {filteredONUs.length} of {onus.length} devices
                  </CardDescription>
                </div>
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedRows.length} selected
                    </span>
                    <Button variant="outline" size="sm">
                      <Power className="mr-2 h-4 w-4" />
                      Reboot Selected
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedRows.length === filteredONUs.length && filteredONUs.length > 0}
                        onCheckedChange={toggleAllRows}
                      />
                    </TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>OLT / Port</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rx Power</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredONUs.map((onu) => (
                    <TableRow key={onu.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(onu.id)}
                          onCheckedChange={() => toggleRowSelection(onu.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-medium">
                            {onu.serial_number}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {onu.model} • {onu.manufacturer}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link 
                            href={`/admin/olt/${onu.olt}`}
                            className="text-sm hover:underline"
                          >
                            {onu.olt_name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            Port: {onu.pon_port_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {onu.customer_name ? (
                          <Link 
                            href={`/admin/users/${onu.customer}`}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <User className="h-3 w-3" />
                            {onu.customer_name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(onu.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-medium ${getPowerColor(onu.rx_power || 0)}`}>
                            {onu.rx_power?.toFixed(2)} dBm
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Tx: {onu.tx_power?.toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{onu.distance}m</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{onu.last_seen}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(onu)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleReboot(onu)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reboot ONU
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Terminal className="mr-2 h-4 w-4" />
                              Run Diagnostics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Unplug className="mr-2 h-4 w-4" />
                              Deregister
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredONUs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No ONUs found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unregistered" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Unregistered ONUs
              </CardTitle>
              <CardDescription>
                These ONUs are detected on your network but haven&apos;t been provisioned yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>OLT / Port</TableHead>
                    <TableHead>Rx Power</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredONUs.map((onu) => (
                    <TableRow key={onu.id}>
                      <TableCell>
                        <span className="font-mono font-medium">{onu.serial_number}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{onu.olt_name}</span>
                          <span className="text-xs text-muted-foreground">
                            Port: {onu.pon_port_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={getPowerColor(onu.rx_power || 0)}>
                        {onu.rx_power?.toFixed(2)} dBm
                      </TableCell>
                      <TableCell>{onu.distance}m</TableCell>
                      <TableCell className="text-muted-foreground">{onu.last_seen}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setOnuToProvision(onu)
                            setIsProvisionDialogOpen(true)
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Provision
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredONUs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No unregistered ONUs detected
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ONU Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedONU && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedONU.serial_number}
                  {getStatusBadge(selectedONU.status)}
                </SheetTitle>
                <SheetDescription>
                  {selectedONU.model} • {selectedONU.manufacturer}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <Tabs defaultValue="info">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="optical">Optical</TabsTrigger>
                    <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Serial Number</Label>
                        <p className="font-mono font-medium">{selectedONU.serial_number}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Model</Label>
                        <p className="font-medium">{selectedONU.model}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Manufacturer</Label>
                        <p className="font-medium">{selectedONU.manufacturer}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Firmware</Label>
                        <p className="font-medium">{selectedONU.firmware_version}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">MAC Address</Label>
                        <p className="font-mono font-medium">{selectedONU.mac_address}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">IP Address</Label>
                        <p className="font-mono font-medium">{selectedONU.ip_address}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">OLT</Label>
                        <Link href={`/admin/olt/${selectedONU.olt}`} className="font-medium hover:underline block">
                          {selectedONU.olt_name}
                        </Link>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">PON Port</Label>
                        <p className="font-medium">{selectedONU.pon_port_name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Distance</Label>
                        <p className="font-medium">{selectedONU.distance}m</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Registration</Label>
                        <p>{getRegistrationBadge(selectedONU.registration_status)}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-muted-foreground">Customer</Label>
                      {selectedONU.customer_name ? (
                        <Link 
                          href={`/admin/users/${selectedONU.customer}`}
                          className="flex items-center gap-2 mt-1 font-medium hover:underline"
                        >
                          <User className="h-4 w-4" />
                          {selectedONU.customer_name}
                        </Link>
                      ) : (
                        <p className="text-muted-foreground">Not assigned to any customer</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="optical" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Rx Power</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${getPowerColor(selectedONU.rx_power || 0)}`}>
                            {selectedONU.rx_power?.toFixed(2)} dBm
                          </div>
                          <p className={`text-xs ${getPowerStatus(selectedONU.rx_power || 0).color}`}>
                            {getPowerStatus(selectedONU.rx_power || 0).status}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Tx Power</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-success">
                            {selectedONU.tx_power?.toFixed(2)} dBm
                          </div>
                          <p className="text-xs text-muted-foreground">Normal</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Signal Quality Guide</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-success">● Good</span>
                          <span className="text-muted-foreground">Better than -20 dBm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-warning">● Warning</span>
                          <span className="text-muted-foreground">-20 to -25 dBm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-destructive">● Critical</span>
                          <span className="text-muted-foreground">Worse than -25 dBm</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="diagnostics" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Signal className="mr-2 h-4 w-4" />
                        Check Optical Power
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Activity className="mr-2 h-4 w-4" />
                        Run Speed Test
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Terminal className="mr-2 h-4 w-4" />
                        Ping Test
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Cable className="mr-2 h-4 w-4" />
                        Check Connectivity
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start text-warning">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reboot ONU
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-destructive">
                        <Power className="mr-2 h-4 w-4" />
                        Factory Reset
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Provision Dialog */}
      <Dialog open={isProvisionDialogOpen} onOpenChange={setIsProvisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provision ONU</DialogTitle>
            <DialogDescription>
              Register ONU <strong>{onuToProvision?.serial_number}</strong> and assign it to a customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Serial Number</Label>
              <Input value={onuToProvision?.serial_number || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>OLT / Port</Label>
              <Input value={`${onuToProvision?.olt_name} - ${onuToProvision?.pon_port_name}`} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer">Assign to Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Create New Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProvisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProvision} disabled={!selectedCustomer}>
              <Play className="mr-2 h-4 w-4" />
              Provision ONU
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
