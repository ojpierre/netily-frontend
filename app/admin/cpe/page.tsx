"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { adminApi } from "@/lib/admin-api"
import type { CPEDevice as BackendCPEDevice, CPETask as BackendCPETask } from "@/lib/types"
import {
  Router,
  Wifi,
  Signal,
  RefreshCw,
  Settings,
  Power,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Upload,
  Terminal,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  User,
  MapPin,
  Eye,
  Play,
  Wrench,
  FileText,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Types for CPE/TR-069 devices
interface CPEDevice {
  id: string
  serialNumber: string
  manufacturer: string
  model: string
  firmwareVersion: string
  hardwareVersion: string
  customerId: string
  customerName: string
  customerPhone: string
  location: string
  ipAddress: string
  macAddress: string
  connectionStatus: "online" | "offline" | "rebooting"
  lastContact: string
  lastInform: string
  uptime: number // in seconds
  cpuUsage: number
  memoryUsage: number
  wifiClients: number
  wifiSSID: string
  wifiChannel: number
  signalStrength: number // dBm
  connectionType: "fiber" | "dsl" | "cable" | "lte"
  provisioningStatus: "provisioned" | "pending" | "failed"
  configurationProfile: string
  pendingTasks: number
}

interface CPETask {
  id: string
  deviceId: string
  type: "reboot" | "firmware_upgrade" | "config_push" | "diagnostics" | "factory_reset"
  status: "pending" | "in_progress" | "completed" | "failed"
  createdAt: string
  completedAt?: string
  createdBy: string
  details: string
  result?: string
}

interface DiagnosticsResult {
  ping: {
    target: string
    packetsLost: number
    avgLatency: number
    minLatency: number
    maxLatency: number
  }
  traceroute: {
    target: string
    hops: { hop: number; ip: string; latency: number }[]
  }
  speedTest?: {
    downloadSpeed: number
    uploadSpeed: number
    latency: number
  }
}

// Map backend CPEDevice to local interface
const mapBackendCPE = (d: BackendCPEDevice): CPEDevice => ({
  id: String(d.id),
  serialNumber: d.serial_number,
  manufacturer: d.manufacturer,
  model: d.model,
  firmwareVersion: d.firmware_version || 'Unknown',
  hardwareVersion: d.hardware_version || 'Unknown',
  customerId: d.customer ? String(d.customer) : '',
  customerName: d.customer_name || 'Unassigned',
  customerPhone: '',
  location: '',
  ipAddress: d.ip_address || '',
  macAddress: d.mac_address || '',
  connectionStatus: d.status === 'online' ? 'online' : d.status === 'rebooting' ? 'rebooting' : 'offline',
  lastContact: d.last_inform || d.updated_at,
  lastInform: d.last_inform || d.updated_at,
  uptime: d.uptime || 0,
  cpuUsage: 0,
  memoryUsage: 0,
  wifiClients: 0,
  wifiSSID: '',
  wifiChannel: 0,
  signalStrength: 0,
  connectionType: 'fiber',
  provisioningStatus: 'provisioned',
  configurationProfile: '',
  pendingTasks: 0,
})

// Helper functions
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const formatTimeAgo = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

export default function CPEManagementPage() {
  const [devices, setDevices] = useState<CPEDevice[]>([])
  const [tasks, setTasks] = useState<CPETask[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [selectedDevice, setSelectedDevice] = useState<CPEDevice | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskType, setTaskType] = useState<CPETask["type"]>("reboot")
  const [diagnosticsDialogOpen, setDiagnosticsDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await adminApi.getCPEDevices({ page_size: '200' })
      setDevices((response.results || []).map(mapBackendCPE))
    } catch (error) {
      console.error('Failed to fetch CPE devices:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Stats
  const stats = useMemo(() => {
    const online = devices.filter(d => d.connectionStatus === "online").length
    const offline = devices.filter(d => d.connectionStatus === "offline").length
    const pendingProvisioning = devices.filter(d => d.provisioningStatus === "pending").length
    const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length
    
    return { total: devices.length, online, offline, pendingProvisioning, pendingTasks }
  }, [devices, tasks])

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = 
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.ipAddress.includes(searchQuery)
      
      const matchesStatus = statusFilter === "all" || device.connectionStatus === statusFilter
      const matchesManufacturer = manufacturerFilter === "all" || device.manufacturer === manufacturerFilter
      
      return matchesSearch && matchesStatus && matchesManufacturer
    })
  }, [devices, searchQuery, statusFilter, manufacturerFilter])

  // Unique manufacturers for filter
  const manufacturers = useMemo(() => 
    [...new Set(devices.map(d => d.manufacturer))].sort(),
    [devices]
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(filteredDevices.map(d => d.id))
    } else {
      setSelectedDevices([])
    }
  }

  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices([...selectedDevices, deviceId])
    } else {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId))
    }
  }

  const openDeviceDetail = (device: CPEDevice) => {
    setSelectedDevice(device)
    setDetailSheetOpen(true)
  }

  const getStatusBadge = (status: CPEDevice["connectionStatus"]) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Online</Badge>
      case "offline":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Offline</Badge>
      case "rebooting":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Rebooting</Badge>
    }
  }

  const getTaskStatusBadge = (status: CPETask["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
    }
  }

  const getTaskTypeIcon = (type: CPETask["type"]) => {
    switch (type) {
      case "reboot": return <Power className="w-4 h-4" />
      case "firmware_upgrade": return <Upload className="w-4 h-4" />
      case "config_push": return <Settings className="w-4 h-4" />
      case "diagnostics": return <Terminal className="w-4 h-4" />
      case "factory_reset": return <RefreshCw className="w-4 h-4" />
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CPE Management</h1>
          <p className="text-muted-foreground">TR-069 Device Management and Remote Configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Managed CPE devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
            <p className="text-xs text-muted-foreground">{((stats.online / stats.total) * 100).toFixed(1)}% of devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Provision</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingProvisioning}</div>
            <p className="text-xs text-muted-foreground">Awaiting setup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">In queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="tasks">Tasks Queue</TabsTrigger>
          <TabsTrigger value="profiles">Config Profiles</TabsTrigger>
          <TabsTrigger value="firmware">Firmware</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
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
                <SelectItem value="rebooting">Rebooting</SelectItem>
              </SelectContent>
            </Select>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDevices.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Bulk Actions ({selectedDevices.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setTaskType("reboot"); setTaskDialogOpen(true) }}>
                    <Power className="w-4 h-4 mr-2" /> Reboot Devices
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfigDialogOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" /> Push Configuration
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setTaskType("firmware_upgrade"); setTaskDialogOpen(true) }}>
                    <Upload className="w-4 h-4 mr-2" /> Firmware Upgrade
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <RefreshCw className="w-4 h-4 mr-2" /> Factory Reset
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Devices Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.slice(0, 20).map((device) => (
                    <TableRow key={device.id} className="cursor-pointer" onClick={() => openDeviceDetail(device)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedDevices.includes(device.id)}
                          onCheckedChange={(checked) => handleSelectDevice(device.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Router className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{device.manufacturer} {device.model}</div>
                            <div className="text-sm text-muted-foreground">{device.serialNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{device.customerName}</div>
                          <div className="text-sm text-muted-foreground">{device.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(device.connectionStatus)}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-0.5 rounded">{device.ipAddress}</code>
                      </TableCell>
                      <TableCell>{formatUptime(device.uptime)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Cpu className="w-3 h-3" />
                            <Progress value={device.cpuUsage} className="w-16 h-1.5" />
                            <span>{device.cpuUsage}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <HardDrive className="w-3 h-3" />
                            <Progress value={device.memoryUsage} className="w-16 h-1.5" />
                            <span>{device.memoryUsage}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatTimeAgo(device.lastContact)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDeviceDetail(device)}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDiagnosticsDialogOpen(true)}>
                              <Terminal className="w-4 h-4 mr-2" /> Run Diagnostics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfigDialogOpen(true)}>
                              <Settings className="w-4 h-4 mr-2" /> Push Config
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Power className="w-4 h-4 mr-2" /> Reboot
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <RefreshCw className="w-4 h-4 mr-2" /> Factory Reset
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

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Queue</CardTitle>
              <CardDescription>Recent and pending device tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const device = devices.find(d => d.id === task.deviceId)
                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTaskTypeIcon(task.type)}
                            <span className="capitalize">{task.type.replace("_", " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {device ? (
                            <div>
                              <div className="font-medium">{device.serialNumber}</div>
                              <div className="text-sm text-muted-foreground">{device.customerName}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(task.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{task.createdBy}</TableCell>
                        <TableCell>
                          {task.result && (
                            <span className={task.status === "completed" ? "text-green-600" : "text-red-600"}>
                              {task.result}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Profiles Tab */}
        <TabsContent value="profiles" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Configuration Profiles</h3>
              <p className="text-sm text-muted-foreground">Predefined device configurations</p>
            </div>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...new Set(devices.map(d => d.configurationProfile).filter(Boolean))].map((profile) => (
              <Card key={profile}>
                <CardHeader>
                  <CardTitle className="text-base">{profile}</CardTitle>
                  <CardDescription>
                    {devices.filter(d => d.configurationProfile === profile).length} devices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">WiFi Enabled</span>
                    <span>Yes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">QoS</span>
                    <span>{profile.includes("Premium") ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Firewall</span>
                    <span>Standard</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    <Button variant="outline" size="sm" className="flex-1">Apply</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Firmware Tab */}
        <TabsContent value="firmware" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Firmware Management</h3>
              <p className="text-sm text-muted-foreground">Available firmware versions</p>
            </div>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Firmware
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Current Version</TableHead>
                    <TableHead>Latest Version</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No firmware data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Firmware tracking not yet configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Device Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Device Details</SheetTitle>
            <SheetDescription>
              {selectedDevice?.manufacturer} {selectedDevice?.model}
            </SheetDescription>
          </SheetHeader>
          {selectedDevice && (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Status Card */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Router className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-semibold">{selectedDevice.serialNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            Firmware: {selectedDevice.firmwareVersion}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(selectedDevice.connectionStatus)}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                    <Power className="w-4 h-4 mb-1" />
                    <span className="text-xs">Reboot</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                    <Terminal className="w-4 h-4 mb-1" />
                    <span className="text-xs">Diagnose</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                    <Settings className="w-4 h-4 mb-1" />
                    <span className="text-xs">Config</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-col h-auto py-3">
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-xs">Update</span>
                  </Button>
                </div>

                {/* Device Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Device Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Manufacturer</div>
                      <div className="font-medium">{selectedDevice.manufacturer}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Model</div>
                      <div className="font-medium">{selectedDevice.model}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Hardware Version</div>
                      <div className="font-medium">{selectedDevice.hardwareVersion}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Firmware Version</div>
                      <div className="font-medium">{selectedDevice.firmwareVersion}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">MAC Address</div>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedDevice.macAddress}</code>
                    </div>
                    <div>
                      <div className="text-muted-foreground">IP Address</div>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedDevice.ipAddress}</code>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Customer</div>
                      <div className="font-medium">{selectedDevice.customerName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Customer ID</div>
                      <div className="font-medium">{selectedDevice.customerId}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Phone</div>
                      <div className="font-medium">{selectedDevice.customerPhone}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Location</div>
                      <div className="font-medium">{selectedDevice.location}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Resources */}
                <div className="space-y-4">
                  <h4 className="font-semibold">System Resources</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">CPU Usage</span>
                        <span className="font-medium">{selectedDevice.cpuUsage}%</span>
                      </div>
                      <Progress value={selectedDevice.cpuUsage} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Memory Usage</span>
                        <span className="font-medium">{selectedDevice.memoryUsage}%</span>
                      </div>
                      <Progress value={selectedDevice.memoryUsage} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="font-medium">{formatUptime(selectedDevice.uptime)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* WiFi Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold">WiFi Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">SSID</div>
                      <div className="font-medium">{selectedDevice.wifiSSID}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Channel</div>
                      <div className="font-medium">{selectedDevice.wifiChannel}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Connected Clients</div>
                      <div className="font-medium">{selectedDevice.wifiClients}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Signal Strength</div>
                      <div className="font-medium">{selectedDevice.signalStrength} dBm</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Configuration</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Profile</div>
                      <div className="font-medium">{selectedDevice.configurationProfile}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Provisioning Status</div>
                      <Badge variant={selectedDevice.provisioningStatus === "provisioned" ? "default" : "secondary"}>
                        {selectedDevice.provisioningStatus}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Connection Type</div>
                      <div className="font-medium capitalize">{selectedDevice.connectionType}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pending Tasks</div>
                      <div className="font-medium">{selectedDevice.pendingTasks}</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Schedule a task for {selectedDevices.length > 0 ? `${selectedDevices.length} selected devices` : "the device"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select value={taskType} onValueChange={(v) => setTaskType(v as CPETask["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reboot">Reboot Device</SelectItem>
                  <SelectItem value="firmware_upgrade">Firmware Upgrade</SelectItem>
                  <SelectItem value="config_push">Push Configuration</SelectItem>
                  <SelectItem value="diagnostics">Run Diagnostics</SelectItem>
                  <SelectItem value="factory_reset">Factory Reset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Add any notes for this task..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setTaskDialogOpen(false)}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diagnostics Dialog */}
      <Dialog open={diagnosticsDialogOpen} onOpenChange={setDiagnosticsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Run Diagnostics</DialogTitle>
            <DialogDescription>Select diagnostic tests to run on the device</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="ping" defaultChecked />
                <Label htmlFor="ping">Ping Test (WAN connectivity)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="traceroute" defaultChecked />
                <Label htmlFor="traceroute">Traceroute</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="speedtest" />
                <Label htmlFor="speedtest">Speed Test</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="dnstest" />
                <Label htmlFor="dnstest">DNS Resolution Test</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Host</Label>
              <Input placeholder="8.8.8.8" defaultValue="8.8.8.8" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiagnosticsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDiagnosticsDialogOpen(false)}>
              <Play className="w-4 h-4 mr-2" />
              Run Tests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Push Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push Configuration</DialogTitle>
            <DialogDescription>Apply a configuration profile to the device</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Configuration Profile</Label>
              <Select defaultValue="residential-basic">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential-basic">Residential Basic</SelectItem>
                  <SelectItem value="residential-premium">Residential Premium</SelectItem>
                  <SelectItem value="business-standard">Business Standard</SelectItem>
                  <SelectItem value="business-premium">Business Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>WiFi SSID (Optional)</Label>
              <Input placeholder="Leave empty to keep current" />
            </div>
            <div className="space-y-2">
              <Label>WiFi Password (Optional)</Label>
              <Input type="password" placeholder="Leave empty to keep current" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="rebootAfter" />
              <Label htmlFor="rebootAfter">Reboot device after applying configuration</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setConfigDialogOpen(false)}>
              <Wrench className="w-4 h-4 mr-2" />
              Apply Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
