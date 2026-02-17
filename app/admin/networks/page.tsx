"use client"

import React, { useState, useMemo } from "react"
import {
  Network,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  Server,
  Globe,
  Shield,
  Activity,
  Layers,
  Copy,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wifi,
  Router,
  Settings,
  Download,
  ChevronRight,
  ChevronDown,
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
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

type NetworkType = "public" | "private" | "cgnat" | "static-pool"
type NetworkStatus = "active" | "inactive" | "exhausted" | "reserved"

interface IPv4Network {
  id: string
  name: string
  network: string
  gateway: string
  subnet: string
  type: NetworkType
  status: NetworkStatus
  totalIPs: number
  usedIPs: number
  availableIPs: number
  router: string
  vlan: number | null
  description: string
  createdAt: string
}

interface IPAllocation {
  id: string
  ipAddress: string
  macAddress: string
  username: string
  hostname: string
  status: "active" | "reserved" | "expired"
  assignedAt: string
  expiresAt: string | null
  networkId: string
}

// TODO: Add dedicated networks API endpoint when backend supports it
// Networks page uses local types distinct from IPAM Subnets—no direct API match yet

const getStatusBadge = (status: NetworkStatus) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700">Active</Badge>
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
    case "exhausted":
      return <Badge className="bg-red-100 text-red-700">Exhausted</Badge>
    case "reserved":
      return <Badge className="bg-blue-100 text-blue-700">Reserved</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTypeBadge = (type: NetworkType) => {
  switch (type) {
    case "public":
      return <Badge variant="outline" className="border-green-200 text-green-700">Public</Badge>
    case "private":
      return <Badge variant="outline" className="border-blue-200 text-blue-700">Private</Badge>
    case "cgnat":
      return <Badge variant="outline" className="border-purple-200 text-purple-700">CGNAT</Badge>
    case "static-pool":
      return <Badge variant="outline" className="border-orange-200 text-orange-700">Static Pool</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

const getAllocationStatusBadge = (status: IPAllocation["status"]) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700">Active</Badge>
    case "reserved":
      return <Badge className="bg-blue-100 text-blue-700">Reserved</Badge>
    case "expired":
      return <Badge className="bg-red-100 text-red-700">Expired</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function IPv4NetworksPage() {
  const [activeTab, setActiveTab] = useState("networks")
  const [networks, setNetworks] = useState<IPv4Network[]>([])
  const [allocations, setAllocations] = useState<IPAllocation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<IPv4Network | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedNetworks, setExpandedNetworks] = useState<string[]>([])

  // Stats
  const stats = useMemo(() => {
    const totalIPs = networks.reduce((acc, n) => acc + n.totalIPs, 0)
    const usedIPs = networks.reduce((acc, n) => acc + n.usedIPs, 0)
    const publicNets = networks.filter(n => n.type === "public").length
    const activeNets = networks.filter(n => n.status === "active").length
    
    return {
      totalIPs,
      usedIPs,
      availableIPs: totalIPs - usedIPs,
      utilization: totalIPs > 0 ? ((usedIPs / totalIPs) * 100).toFixed(1) : 0,
      publicNets,
      activeNets,
      totalNets: networks.length,
    }
  }, [networks])

  // Filtered networks
  const filteredNetworks = useMemo(() => {
    return networks.filter(network => {
      const matchesSearch = 
        network.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        network.network.includes(searchQuery)
      const matchesType = typeFilter === "all" || network.type === typeFilter
      const matchesStatus = statusFilter === "all" || network.status === statusFilter
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [networks, searchQuery, typeFilter, statusFilter])

  const handleRefresh = async () => {
    setIsLoading(true)
    // TODO: Replace with real API call when backend networks endpoint is available
    setIsLoading(false)
  }

  const toggleNetworkExpand = (id: string) => {
    if (expandedNetworks.includes(id)) {
      setExpandedNetworks(expandedNetworks.filter(n => n !== id))
    } else {
      setExpandedNetworks([...expandedNetworks, id])
    }
  }

  const getNetworkAllocations = (networkId: string) => {
    return allocations.filter(a => a.networkId === networkId)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">IPv4 Networks</h1>
          <p className="text-slate-600 mt-1">Manage IP address pools and allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Network
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Networks</p>
                <p className="text-2xl font-bold">{stats.totalNets}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total IPs</p>
                <p className="text-2xl font-bold">{stats.totalIPs.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Used IPs</p>
                <p className="text-2xl font-bold text-orange-600">{stats.usedIPs.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableIPs.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Utilization</p>
                <p className="text-2xl font-bold">{stats.utilization}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="networks" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Networks
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Allocations
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Networks Tab */}
        <TabsContent value="networks" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search networks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="cgnat">CGNAT</SelectItem>
                    <SelectItem value="static-pool">Static Pool</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="exhausted">Exhausted</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredNetworks.map((network) => (
                  <Collapsible
                    key={network.id}
                    open={expandedNetworks.includes(network.id)}
                    onOpenChange={() => toggleNetworkExpand(network.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                              <Network className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{network.name}</span>
                                {getTypeBadge(network.type)}
                                {getStatusBadge(network.status)}
                              </div>
                              <div className="text-sm text-slate-500 font-mono">
                                {network.network} (GW: {network.gateway})
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="hidden md:block">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-slate-500">
                                  {network.usedIPs.toLocaleString()} / {network.totalIPs.toLocaleString()} IPs
                                </span>
                              </div>
                              <Progress 
                                value={(network.usedIPs / network.totalIPs) * 100} 
                                className="w-32 h-2"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedNetwork(network)
                                    setIsDetailsOpen(true)
                                  }}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              {expandedNetworks.includes(network.id) ? (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t p-4 bg-slate-50">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <span className="text-sm text-slate-500">Gateway</span>
                              <p className="font-mono">{network.gateway}</p>
                            </div>
                            <div>
                              <span className="text-sm text-slate-500">Subnet Mask</span>
                              <p className="font-mono">{network.subnet}</p>
                            </div>
                            <div>
                              <span className="text-sm text-slate-500">Router</span>
                              <p className="flex items-center gap-1">
                                <Router className="w-4 h-4" />
                                {network.router}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-slate-500">VLAN</span>
                              <p>{network.vlan || "None"}</p>
                            </div>
                          </div>
                          
                          {getNetworkAllocations(network.id).length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold mb-2">Recent Allocations</h4>
                              <div className="bg-white rounded border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>IP Address</TableHead>
                                      <TableHead>MAC Address</TableHead>
                                      <TableHead>User</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getNetworkAllocations(network.id).slice(0, 3).map((alloc) => (
                                      <TableRow key={alloc.id}>
                                        <TableCell className="font-mono">{alloc.ipAddress}</TableCell>
                                        <TableCell className="font-mono text-xs">{alloc.macAddress}</TableCell>
                                        <TableCell>{alloc.username}</TableCell>
                                        <TableCell>{getAllocationStatusBadge(alloc.status)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View All IPs
                            </Button>
                            <Button variant="outline" size="sm">
                              <Plus className="w-4 h-4 mr-1" />
                              Reserve IP
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>IP Allocations</CardTitle>
                  <CardDescription>View and manage IP address assignments</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Assign IP
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>MAC Address</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell className="font-mono">{alloc.ipAddress}</TableCell>
                        <TableCell className="font-mono text-xs">{alloc.macAddress}</TableCell>
                        <TableCell>{alloc.username}</TableCell>
                        <TableCell>{alloc.hostname}</TableCell>
                        <TableCell>{getAllocationStatusBadge(alloc.status)}</TableCell>
                        <TableCell className="text-sm text-slate-500">{alloc.assignedAt}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                Release IP
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>DHCP Settings</CardTitle>
                <CardDescription>Configure DHCP server parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable DHCP</Label>
                    <p className="text-sm text-slate-500">Auto-assign IPs to clients</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Lease Time</Label>
                  <Select defaultValue="86400">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3600">1 Hour</SelectItem>
                      <SelectItem value="86400">24 Hours</SelectItem>
                      <SelectItem value="604800">7 Days</SelectItem>
                      <SelectItem value="2592000">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary DNS</Label>
                  <Input placeholder="8.8.8.8" defaultValue="8.8.8.8" />
                </div>
                <div className="space-y-2">
                  <Label>Secondary DNS</Label>
                  <Input placeholder="8.8.4.4" defaultValue="8.8.4.4" />
                </div>
                <Button className="w-full">Save DHCP Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IP Management</CardTitle>
                <CardDescription>Global IP management settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-release Expired IPs</Label>
                    <p className="text-sm text-slate-500">Free up IPs when lease expires</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow MAC Binding</Label>
                    <p className="text-sm text-slate-500">Bind IPs to MAC addresses</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alert on Exhaustion</Label>
                    <p className="text-sm text-slate-500">Notify when pool is 90% full</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Exhaustion Threshold</Label>
                  <Select defaultValue="90">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="80">80%</SelectItem>
                      <SelectItem value="85">85%</SelectItem>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Network Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Add IPv4 Network</SheetTitle>
            <SheetDescription>
              Configure a new IP address pool
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            <div className="space-y-6 pr-4">
              <div className="space-y-2">
                <Label>Network Name</Label>
                <Input placeholder="e.g., Public Pool 2" />
              </div>

              <div className="space-y-2">
                <Label>Network Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public IPs</SelectItem>
                    <SelectItem value="private">Private Network</SelectItem>
                    <SelectItem value="cgnat">CGNAT Pool</SelectItem>
                    <SelectItem value="static-pool">Static IP Pool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Network Address</Label>
                  <Input placeholder="192.168.1.0" />
                </div>
                <div className="space-y-2">
                  <Label>CIDR Prefix</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="/24" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">/24 (256 hosts)</SelectItem>
                      <SelectItem value="25">/25 (128 hosts)</SelectItem>
                      <SelectItem value="26">/26 (64 hosts)</SelectItem>
                      <SelectItem value="27">/27 (32 hosts)</SelectItem>
                      <SelectItem value="28">/28 (16 hosts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gateway</Label>
                <Input placeholder="192.168.1.1" />
              </div>

              <div className="space-y-2">
                <Label>Router</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select router" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="router-001">Router-001</SelectItem>
                    <SelectItem value="router-002">Router-002</SelectItem>
                    <SelectItem value="router-003">Router-003</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>VLAN (Optional)</Label>
                <Input type="number" placeholder="100" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Network description..." />
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Network
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
