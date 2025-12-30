"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Loader2,
  X,
  Wifi,
  Globe,
  Server,
  Activity,
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Signal,
  Upload,
  FileUp,
  Send,
  UserCheck,
  Power,
} from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import type { Customer, CustomerService, CustomerStatus } from "@/lib/types"

// Mock mode toggle - set to false when backend is ready
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

// User types for different connection methods (maps to backend ConnectionType)
type UserType = "hotspot" | "pppoe" | "static" | "fiber" | "wireless"
type UserStatus = "active" | "inactive" | "expired" | "suspended" | "pending" | "online" | "offline"

// Display user interface - mapped from Customer API response
interface User {
  id: string
  customerId: number
  name: string
  email: string
  phone: string
  status: UserStatus
  connectionStatus: "online" | "offline"
  type: UserType
  plan: string
  planPrice: number
  joinedDate: string
  expiryDate: string
  lastOnline: string
  dataUsed: number
  dataLimit: number | null
  macAddress?: string
  ipAddress?: string
  router: string
  downloadSpeed: number
  uploadSpeed: number
  loyaltyPoints: number
  balance: number
}

// Stats cards data interface
interface UserStats {
  total: number
  active: number
  expired: number
  online: number
  hotspot: number
  pppoe: number
  static: number
}

// Helper: Map backend Customer to frontend User display type
const mapCustomerToUser = (customer: Customer): User => {
  // Get the primary service if available
  const primaryService = customer.services?.[0]
  
  // Determine connection status from service
  const isOnline = primaryService?.is_online ?? false
  
  // Map backend status to frontend status (handle 'inactive' as 'expired' for display)
  const mapStatus = (status: CustomerStatus): UserStatus => {
    switch (status) {
      case 'active': return 'active'
      case 'inactive': return 'expired'
      case 'suspended': return 'suspended'
      case 'pending': return 'pending'
      default: return 'active'
    }
  }

  return {
    id: customer.customer_number || `USR-${customer.id}`,
    customerId: customer.id,
    name: customer.full_name || `${customer.first_name} ${customer.last_name}`,
    email: customer.email,
    phone: customer.phone,
    status: mapStatus(customer.status),
    connectionStatus: isOnline ? "online" : "offline",
    type: (primaryService?.service_type || "hotspot") as UserType,
    plan: primaryService?.plan?.name || "No Plan",
    planPrice: primaryService?.plan?.price ? parseFloat(String(primaryService.plan.price)) : 0,
    joinedDate: customer.created_at,
    expiryDate: primaryService?.expiry_date || new Date().toISOString(),
    lastOnline: isOnline ? "Now" : (primaryService?.last_seen || "Unknown"),
    dataUsed: primaryService?.data_used || 0,
    dataLimit: primaryService?.data_limit || null,
    macAddress: primaryService?.mac_address,
    ipAddress: primaryService?.ip_address,
    router: primaryService?.device?.name || "Unassigned",
    downloadSpeed: primaryService?.download_speed || 0,
    uploadSpeed: primaryService?.upload_speed || 0,
    loyaltyPoints: 0, // Will come from loyalty module
    balance: parseFloat(customer.balance) || 0,
  }
}

// Mock data generator (fallback when API is unavailable)
const generateMockUsers = (): User[] => {
  const types: UserType[] = ["hotspot", "pppoe", "static"]
  const plans = [
    { name: "Basic Daily", price: 50 },
    { name: "Weekly 8Mbps", price: 500 },
    { name: "Monthly 10Mbps", price: 1500 },
    { name: "Premium Monthly", price: 3000 },
    { name: "Business Quarterly", price: 8000 },
  ]
  const routers = ["Router-Nairobi-01", "Router-Mombasa-02", "Router-Kisumu-03", "Router-Nakuru-04"]
  
  return Array.from({ length: 50 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)]
    const plan = plans[Math.floor(Math.random() * plans.length)]
    const isOnline = Math.random() > 0.4
    const statuses: UserStatus[] = ["active", "expired", "suspended"]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    return {
      id: `USR-${1000 + i}`,
      customerId: 1000 + i,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `+254 7${Math.floor(10000000 + Math.random() * 90000000)}`,
      status,
      connectionStatus: isOnline && status === "active" ? "online" : "offline",
      type,
      plan: plan.name,
      planPrice: plan.price,
      joinedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      expiryDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      lastOnline: isOnline ? "Now" : `${Math.floor(Math.random() * 24)}h ago`,
      dataUsed: Math.random() * 100,
      dataLimit: Math.random() > 0.5 ? 100 + Math.floor(Math.random() * 400) : null,
      macAddress: type === "hotspot" || type === "static" ? `AA:BB:CC:${Math.floor(Math.random() * 99).toString().padStart(2, '0')}:${Math.floor(Math.random() * 99).toString().padStart(2, '0')}:${Math.floor(Math.random() * 99).toString().padStart(2, '0')}` : undefined,
      ipAddress: type !== "hotspot" ? `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}` : undefined,
      router: routers[Math.floor(Math.random() * routers.length)],
      downloadSpeed: Math.floor(Math.random() * 20) + 2,
      uploadSpeed: Math.floor(Math.random() * 10) + 1,
      loyaltyPoints: Math.floor(Math.random() * 5000),
      balance: Math.floor(Math.random() * 1000),
    }
  })
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("all")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false)
  const [showSmsDialog, setShowSmsDialog] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (USE_MOCK_DATA) {
        // Use mock data when backend is not available
        await new Promise((resolve) => setTimeout(resolve, 500))
        setUsers(generateMockUsers())
      } else {
        // Fetch from real API - /customers/ endpoint
        try {
          const response = await adminApi.getCustomers()
          const mappedUsers = response.results.map(mapCustomerToUser)
          setUsers(mappedUsers)
        } catch (apiError) {
          console.warn('API call failed, falling back to mock data:', apiError)
          // Fallback to mock data if API fails
          setUsers(generateMockUsers())
          setError("Using demo data - backend not available")
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setError("Failed to load users. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUsers()
    setRefreshing(false)
  }

  // Calculate stats
  const stats: UserStats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === "active").length,
      expired: users.filter(u => u.status === "expired").length,
      online: users.filter(u => u.connectionStatus === "online").length,
      hotspot: users.filter(u => u.type === "hotspot").length,
      pppoe: users.filter(u => u.type === "pppoe").length,
      static: users.filter(u => u.type === "static").length,
    }
  }, [users])

  // Filter users based on tab and search
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Tab filter
      const matchesTab = 
        activeTab === "all" ||
        (activeTab === "hotspot" && user.type === "hotspot") ||
        (activeTab === "pppoe" && user.type === "pppoe") ||
        (activeTab === "static" && user.type === "static") ||
        (activeTab === "online" && user.connectionStatus === "online")

      // Search filter
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      return matchesTab && matchesSearch && matchesStatus
    })
  }, [users, activeTab, searchQuery, statusFilter])

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, statusFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map((u) => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<UserStatus, string> = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
      expired: "bg-red-100 text-red-700 border-red-200",
      suspended: "bg-yellow-100 text-yellow-700 border-yellow-200",
      pending: "bg-orange-100 text-orange-700 border-orange-200",
      online: "bg-blue-100 text-blue-700 border-blue-200",
      offline: "bg-slate-100 text-slate-700 border-slate-200",
    }
    return (
      <Badge variant="outline" className={variants[status] || variants.active}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getConnectionBadge = (status: "online" | "offline") => {
    if (status === "online") {
      return (
        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
          <Activity className="w-3 h-3 mr-1" />
          Online
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
        <XCircle className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    )
  }

  const getTypeBadge = (type: UserType) => {
    const config: Record<UserType, { icon: typeof Wifi; class: string; label: string }> = {
      hotspot: { icon: Wifi, class: "bg-blue-100 text-blue-700 border-blue-200", label: "Hotspot" },
      pppoe: { icon: Globe, class: "bg-purple-100 text-purple-700 border-purple-200", label: "PPPoE" },
      static: { icon: Server, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Static IP" },
      fiber: { icon: Signal, class: "bg-teal-100 text-teal-700 border-teal-200", label: "Fiber" },
      wireless: { icon: Wifi, class: "bg-cyan-100 text-cyan-700 border-cyan-200", label: "Wireless" },
    }
    const typeConfig = config[type] || config.hotspot
    const Icon = typeConfig.icon
    return (
      <Badge variant="outline" className={typeConfig.class}>
        <Icon className="w-3 h-3 mr-1" />
        {typeConfig.label}
      </Badge>
    )
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setDrawerOpen(true)
  }

  const handleDisconnectUser = (user: User) => {
    // TODO: Implement disconnect via API
    console.log("Disconnecting user:", user.id)
  }

  const handleExtendSubscription = (user: User) => {
    // TODO: Implement extend subscription
    console.log("Extending subscription for:", user.id)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users Management</h1>
          <p className="text-slate-500 mt-1">Manage Hotspot, PPPoE, and Static IP users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileUp className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Users</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to import multiple users at once
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                  <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag & drop your CSV file here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  <p className="font-medium mb-1">CSV Format:</p>
                  <code className="bg-slate-100 p-1 rounded">
                    name,email,phone,type,plan
                  </code>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
                  Cancel
                </Button>
                <Button>Import Users</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new customer account
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+254 7XX XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotspot">Hotspot</SelectItem>
                      <SelectItem value="pppoe">PPPoE</SelectItem>
                      <SelectItem value="static">Static IP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic Daily - KES 50</SelectItem>
                      <SelectItem value="weekly">Weekly 8Mbps - KES 500</SelectItem>
                      <SelectItem value="monthly">Monthly 10Mbps - KES 1500</SelectItem>
                      <SelectItem value="premium">Premium Monthly - KES 3000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Router</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign router" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="r1">Router-Nairobi-01</SelectItem>
                      <SelectItem value="r2">Router-Mombasa-02</SelectItem>
                      <SelectItem value="r3">Router-Kisumu-03</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                  Cancel
                </Button>
                <Button>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("online")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.online}</p>
                <p className="text-xs text-slate-500">Online Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab("all"); setStatusFilter("active"); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab("all"); setStatusFilter("expired"); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                <p className="text-xs text-slate-500">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("hotspot")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.hotspot}</p>
                <p className="text-xs text-slate-500">Hotspot</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("pppoe")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.pppoe}</p>
                <p className="text-xs text-slate-500">PPPoE</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("static")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Server className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.static}</p>
                <p className="text-xs text-slate-500">Static IP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">All Users</span>
          </TabsTrigger>
          <TabsTrigger value="hotspot" className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">Hotspot</span>
          </TabsTrigger>
          <TabsTrigger value="pppoe" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">PPPoE</span>
          </TabsTrigger>
          <TabsTrigger value="static" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">Static IP</span>
          </TabsTrigger>
          <TabsTrigger value="online" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Online</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {selectedUsers.length > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex-1" />
              <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Bulk SMS</DialogTitle>
                    <DialogDescription>
                      Send SMS to {selectedUsers.length} selected users
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea 
                        placeholder="Enter your message..."
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-slate-500">{smsMessage.length}/160 characters</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSmsDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Send SMS</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedUsers([])}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "all" && "All Users"}
            {activeTab === "hotspot" && "Hotspot Users"}
            {activeTab === "pppoe" && "PPPoE Users"}
            {activeTab === "static" && "Static IP Users"}
            {activeTab === "online" && "Online Users"}
            {" "}({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No users found</p>
              <p className="text-slate-500 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            paginatedUsers.length > 0 &&
                            selectedUsers.length === paginatedUsers.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Data Usage</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) =>
                              handleSelectUser(user.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(user.type)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{getConnectionBadge(user.connectionStatus)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{user.plan}</p>
                            <p className="text-xs text-slate-500">KES {user.planPrice.toLocaleString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{user.dataUsed.toFixed(1)} GB</p>
                            {user.dataLimit && (
                              <Progress value={(user.dataUsed / user.dataLimit) * 100} className="h-1.5 w-16" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(user.expiryDate).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(user.expiryDate) > new Date() 
                                ? `${Math.ceil((new Date(user.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                                : "Expired"
                              }
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExtendSubscription(user)}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Extend Subscription
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.connectionStatus === "online" && (
                                <DropdownMenuItem 
                                  onClick={() => handleDisconnectUser(user)}
                                  className="text-yellow-600"
                                >
                                  <Power className="w-4 h-4 mr-2" />
                                  Disconnect
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Send SMS
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>Complete information about this user</SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {getTypeBadge(selectedUser.type)}
                {getStatusBadge(selectedUser.status)}
                {getConnectionBadge(selectedUser.connectionStatus)}
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{selectedUser.name}</p>
                    <p className="text-sm text-slate-500">{selectedUser.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Email</label>
                    <p className="text-sm text-slate-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Phone</label>
                    <p className="text-sm text-slate-900">{selectedUser.phone}</p>
                  </div>
                </div>
              </div>

              {/* Connection Info */}
              <div className="p-4 bg-slate-50 rounded-lg border">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Signal className="w-4 h-4" />
                  Connection Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Router:</span>
                    <p className="font-medium">{selectedUser.router}</p>
                  </div>
                  {selectedUser.ipAddress && (
                    <div>
                      <span className="text-slate-500">IP Address:</span>
                      <p className="font-medium">{selectedUser.ipAddress}</p>
                    </div>
                  )}
                  {selectedUser.macAddress && (
                    <div>
                      <span className="text-slate-500">MAC Address:</span>
                      <p className="font-medium font-mono text-xs">{selectedUser.macAddress}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Last Online:</span>
                    <p className="font-medium">{selectedUser.lastOnline}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Download:</span>
                    <p className="font-medium">{selectedUser.downloadSpeed} Mbps</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Upload:</span>
                    <p className="font-medium">{selectedUser.uploadSpeed} Mbps</p>
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-3">Subscription</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current Plan</span>
                    <span className="font-medium">{selectedUser.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Price</span>
                    <span className="font-medium">KES {selectedUser.planPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Joined Date</span>
                    <span className="font-medium">
                      {new Date(selectedUser.joinedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expiry Date</span>
                    <span className="font-medium">
                      {new Date(selectedUser.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="p-4 bg-slate-50 rounded-lg border">
                <h3 className="font-semibold text-slate-900 mb-3">Usage & Balance</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Data Used</span>
                      <span className="font-medium">
                        {selectedUser.dataUsed.toFixed(1)} GB 
                        {selectedUser.dataLimit && ` / ${selectedUser.dataLimit} GB`}
                      </span>
                    </div>
                    {selectedUser.dataLimit && (
                      <Progress value={(selectedUser.dataUsed / selectedUser.dataLimit) * 100} className="h-2" />
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Account Balance</span>
                    <span className="font-medium">KES {selectedUser.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Loyalty Points</span>
                    <span className="font-medium text-amber-600">{selectedUser.loyaltyPoints.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit User
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    Extend
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
                {selectedUser.connectionStatus === "online" && (
                  <Button variant="outline" className="w-full text-yellow-600 hover:text-yellow-700">
                    <Power className="w-4 h-4 mr-2" />
                    Disconnect User
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
