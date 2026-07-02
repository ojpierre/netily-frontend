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
  ArrowUpDown,
  ChevronRight,
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
import { usePagePermissions } from "@/hooks/use-page-permissions"
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
import type { OLT, PONPort } from "@/lib/types"

type OLTStatus = 'online' | 'offline' | 'warning' | 'maintenance'
type OLTManufacturer = NonNullable<OLT["manufacturer"]>

const getStatusIcon = (status: OLTStatus) => {
  switch (status) {
    case "online":
      return <CheckCircle className="h-4 w-4 text-success" />
    case "offline":
      return <XCircle className="h-4 w-4 text-destructive" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />
    case "maintenance":
      return <Settings className="h-4 w-4 text-primary animate-spin" />
  }
}

const getStatusBadge = (status: OLTStatus) => {
  const variants: Record<OLTStatus, "default" | "secondary" | "destructive" | "outline"> = {
    online: "default",
    offline: "destructive",
    warning: "secondary",
    maintenance: "outline",
  }
  return (
    <Badge variant={variants[status]} className="capitalize">
      {getStatusIcon(status)}
      <span className="ml-1">{status}</span>
    </Badge>
  )
}

const getManufacturerBadge = (manufacturer: string) => {
  const colors: Record<string, string> = {
    huawei: "bg-destructive/15 text-red-800 dark:bg-destructive/15 dark:text-red-200",
    zte: "bg-primary/15 text-primary dark:bg-primary dark:text-primary/40",
    fiberhome: "bg-success/15 text-green-800 dark:bg-success/15 dark:text-green-200",
    nokia: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  }
  return (
    <Badge className={colors[manufacturer] || colors.other}>
      {manufacturer.toUpperCase()}
    </Badge>
  )
}

export default function OLTManagementPage() {
  const perms = usePagePermissions("/admin/olt")
  const [olts, setOlts] = useState<OLT[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all")
  const [selectedOLT, setSelectedOLT] = useState<OLT | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [oltToDelete, setOltToDelete] = useState<OLT | null>(null)
  const [ponPorts, setPonPorts] = useState<PONPort[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchOLTs = useCallback(async () => {
    try {
      const response = await adminApi.getOLTs({ page_size: '100' })
      setOlts(response.results || [])
    } catch (error) {
      console.error('Failed to fetch OLTs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOLTs()
  }, [fetchOLTs])

  // Form state for new OLT
  const [formData, setFormData] = useState<{
    name: string
    ip_address: string
    model: string
    manufacturer: OLTManufacturer
    serial_number: string
    location: string
    total_pon_ports: number
  }>({
    name: "",
    ip_address: "",
    model: "",
    manufacturer: "huawei",
    serial_number: "",
    location: "",
    total_pon_ports: 8,
  })

  // Filtered OLTs
  const filteredOLTs = useMemo(() => {
    return olts.filter((olt) => {
      const matchesSearch =
        olt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        olt.ip_address.includes(searchQuery) ||
        olt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        olt.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || olt.status === statusFilter
      const matchesManufacturer = manufacturerFilter === "all" || olt.manufacturer === manufacturerFilter
      
      return matchesSearch && matchesStatus && matchesManufacturer
    })
  }, [olts, searchQuery, statusFilter, manufacturerFilter])

  // Stats
  const stats = useMemo(() => {
    const online = olts.filter((o) => o.status === "online").length
    const offline = olts.filter((o) => o.status === "offline").length
    const warning = olts.filter((o) => o.status === "warning").length
    const totalONUs = olts.reduce((sum, o) => sum + o.total_onus, 0)
    const onlineONUs = olts.reduce((sum, o) => sum + o.online_onus, 0)
    const totalPorts = olts.reduce((sum, o) => sum + o.total_pon_ports, 0)
    const activePorts = olts.reduce((sum, o) => sum + o.active_pon_ports, 0)
    
    return { online, offline, warning, totalONUs, onlineONUs, totalPorts, activePorts }
  }, [olts])

  const handleViewDetails = async (olt: OLT) => {
    setSelectedOLT(olt)
    setIsDetailOpen(true)
    try {
      const ports = await adminApi.getOLTPONPorts(olt.id)
      setPonPorts(ports || [])
    } catch (error) {
      console.error('Failed to fetch PON ports:', error)
      setPonPorts([])
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchOLTs()
    setIsRefreshing(false)
  }

  const handleReboot = async (olt: OLT) => {
    try {
      await adminApi.rebootOLT(olt.id)
      await fetchOLTs()
    } catch (error) {
      console.error('Failed to reboot OLT:', error)
    }
  }

  const handleDelete = async () => {
    if (oltToDelete) {
      try {
        await adminApi.deleteOLT(oltToDelete.id)
        await fetchOLTs()
      } catch (error) {
        console.error('Failed to delete OLT:', error)
      }
      setIsDeleteDialogOpen(false)
      setOltToDelete(null)
    }
  }

  const handleAddOLT = async () => {
    try {
      await adminApi.createOLT(formData)
      await fetchOLTs()
      setIsAddDialogOpen(false)
      setFormData({
        name: "",
        ip_address: "",
        model: "",
        manufacturer: "huawei",
        serial_number: "",
        location: "",
        total_pon_ports: 8,
      })
    } catch (error) {
      console.error('Failed to create OLT:', error)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OLT Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage Optical Line Terminals across your network
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {perms.canAdd && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add OLT
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total OLTs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{olts.length}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-success">{stats.online} online</span>
              <span className="text-xs text-destructive">{stats.offline} offline</span>
              {stats.warning > 0 && (
                <span className="text-xs text-warning">{stats.warning} warning</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ONUs</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalONUs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">{stats.onlineONUs.toLocaleString()}</span> online ({Math.round((stats.onlineONUs / stats.totalONUs) * 100)}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PON Ports</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPorts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">{stats.activePorts}</span> active ({Math.round((stats.activePorts / stats.totalPorts) * 100)}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.online / olts.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on OLT availability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, IP, location, or serial number..."
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
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="huawei">Huawei</SelectItem>
                <SelectItem value="zte">ZTE</SelectItem>
                <SelectItem value="fiberhome">FiberHome</SelectItem>
                <SelectItem value="nokia">Nokia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* OLT Table */}
      <Card>
        <CardHeader>
          <CardTitle>OLT Devices</CardTitle>
          <CardDescription>
            {filteredOLTs.length} of {olts.length} devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">PON Ports</TableHead>
                <TableHead className="text-center">ONUs</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOLTs.map((olt) => (
                <TableRow key={olt.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link 
                        href={`/admin/olt/${olt.id}`}
                        className="font-medium hover:underline"
                      >
                        {olt.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {olt.ip_address} • {olt.model}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(olt.status)}</TableCell>
                  <TableCell>{getManufacturerBadge(olt.manufacturer)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{olt.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-success">{olt.active_pon_ports}</span>
                    <span className="text-muted-foreground">/{olt.total_pon_ports}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-success">{olt.online_onus}</span>
                    <span className="text-muted-foreground">/{olt.total_onus}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 w-32">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        <Progress 
                          value={olt.cpu_usage || 0} 
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs w-8">{olt.cpu_usage}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-3 w-3 text-muted-foreground" />
                        <Progress 
                          value={olt.memory_usage || 0} 
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs w-8">{olt.memory_usage}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{olt.uptime}</span>
                      <span className="text-xs text-muted-foreground">
                        Last: {olt.last_seen}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {perms.canViewDetails && (
                          <>
                            <DropdownMenuItem onClick={() => handleViewDetails(olt)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/olt/${olt.id}`}>
                                <Network className="mr-2 h-4 w-4" />
                                Manage PON Ports
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        {perms.canEdit && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleReboot(olt)}>
                              <Power className="mr-2 h-4 w-4" />
                              Reboot
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Terminal className="mr-2 h-4 w-4" />
                              SSH Console
                            </DropdownMenuItem>
                          </>
                        )}
                        {perms.canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setOltToDelete(olt)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete OLT
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOLTs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No OLTs found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* OLT Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedOLT && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedOLT.name}
                  {getStatusBadge(selectedOLT.status)}
                </SheetTitle>
                <SheetDescription>
                  {selectedOLT.model} • {selectedOLT.ip_address}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ports">PON Ports</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Manufacturer</Label>
                        <p className="font-medium capitalize">{selectedOLT.manufacturer}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Model</Label>
                        <p className="font-medium">{selectedOLT.model}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Serial Number</Label>
                        <p className="font-medium">{selectedOLT.serial_number}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Firmware</Label>
                        <p className="font-medium">{selectedOLT.firmware_version}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Location</Label>
                        <p className="font-medium">{selectedOLT.location}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Uptime</Label>
                        <p className="font-medium">{selectedOLT.uptime}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">PON Ports</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedOLT.active_pon_ports}/{selectedOLT.total_pon_ports}
                          </div>
                          <Progress 
                            value={(selectedOLT.active_pon_ports / selectedOLT.total_pon_ports) * 100}
                            className="mt-2"
                          />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">ONUs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedOLT.online_onus}/{selectedOLT.total_onus}
                          </div>
                          <Progress 
                            value={(selectedOLT.online_onus / selectedOLT.total_onus) * 100}
                            className="mt-2"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ports" className="space-y-4">
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Port</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>ONUs</TableHead>
                            <TableHead>Rx Power</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ponPorts.map((port) => (
                            <TableRow key={port.id}>
                              <TableCell className="font-medium">
                                {port.port_number}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={port.status === 'active' ? 'default' : 
                                    port.status === 'fault' ? 'destructive' : 'secondary'}
                                >
                                  {port.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-success">{port.online_onus}</span>
                                <span className="text-muted-foreground">/{port.total_onus}</span>
                              </TableCell>
                              <TableCell>
                                {port.rx_power?.toFixed(2)} dBm
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="performance" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="flex items-center gap-2">
                            <Cpu className="h-4 w-4" />
                            CPU Usage
                          </Label>
                          <span className="font-medium">{selectedOLT.cpu_usage}%</span>
                        </div>
                        <Progress value={selectedOLT.cpu_usage || 0} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Memory Usage
                          </Label>
                          <span className="font-medium">{selectedOLT.memory_usage}%</span>
                        </div>
                        <Progress value={selectedOLT.memory_usage || 0} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4" />
                            Temperature
                          </Label>
                          <span className="font-medium">{selectedOLT.temperature}°C</span>
                        </div>
                        <Progress 
                          value={(selectedOLT.temperature || 0) / 80 * 100} 
                          className={selectedOLT.temperature && selectedOLT.temperature > 60 ? "bg-destructive/15" : ""}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-2 pt-4">
                  <Button asChild className="flex-1">
                    <Link href={`/admin/olt/${selectedOLT.id}`}>
                      View Full Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline">
                    <Terminal className="mr-2 h-4 w-4" />
                    SSH
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add OLT Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New OLT</DialogTitle>
            <DialogDescription>
              Add a new Optical Line Terminal to your network
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., OLT-Location-01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                placeholder="e.g., 10.0.1.1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Select 
                  value={formData.manufacturer} 
                  onValueChange={(v) => setFormData({ ...formData, manufacturer: v as OLTManufacturer })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="huawei">Huawei</SelectItem>
                    <SelectItem value="zte">ZTE</SelectItem>
                    <SelectItem value="fiberhome">FiberHome</SelectItem>
                    <SelectItem value="nokia">Nokia</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., MA5800-X17"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Device serial number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Nairobi CBD - Main POP"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ports">Total PON Ports</Label>
              <Select 
                value={formData.total_pon_ports.toString()} 
                onValueChange={(v) => setFormData({ ...formData, total_pon_ports: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Ports</SelectItem>
                  <SelectItem value="8">8 Ports</SelectItem>
                  <SelectItem value="16">16 Ports</SelectItem>
                  <SelectItem value="24">24 Ports</SelectItem>
                  <SelectItem value="32">32 Ports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOLT}>Add OLT</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete OLT</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{oltToDelete?.name}</strong>? 
              This will remove all associated PON ports and ONU mappings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete OLT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
