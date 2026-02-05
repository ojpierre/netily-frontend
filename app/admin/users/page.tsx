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
import type { Customer, CustomerService, CustomerStatus, Plan } from "@/lib/types"

import { toast } from "sonner"

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
// Note: Hotspot users are managed separately via captive portal
type UserType = "pppoe" | "static" | "fiber" | "wireless"
type UserStatus = "active" | "inactive" | "expired" | "suspended" | "pending" | "online" | "offline"

// RADIUS credentials for PPPoE/Hotspot authentication
interface RADIUSCredentials {
  id?: string
  username: string
  password: string
  is_enabled: boolean
  connection_type: string
  expiration_date: string | null  // Wall-clock expiration
  synced_to_radius?: boolean
}

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
  // RADIUS credentials for network authentication
  radiusCredentials?: RADIUSCredentials
}

// Stats cards data interface
interface UserStats {
  total: number
  active: number
  expired: number
  online: number
  pppoe: number
  static: number
  fiber: number
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
  
  // Helper to safely format dates
  const safeDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return new Date().toISOString()
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? new Date().toISOString() : dateStr
  }
  
  // Map service type, defaulting to pppoe for managed users
  const serviceType = primaryService?.service_type?.toLowerCase() || 'pppoe'
  const mappedType = ['pppoe', 'static', 'fiber', 'wireless'].includes(serviceType) 
    ? serviceType as UserType 
    : 'pppoe'
  
  // Map RADIUS credentials if available
  const radiusCreds = (customer as any).radius_credentials
  const radiusCredentials: RADIUSCredentials | undefined = radiusCreds ? {
    id: radiusCreds.id || '',
    username: radiusCreds.username || '',
    password: radiusCreds.password || '',
    is_enabled: radiusCreds.is_enabled ?? true,
    connection_type: radiusCreds.connection_type || 'PPPOE',
    expiration_date: radiusCreds.expiration_date || null,
    synced_to_radius: radiusCreds.synced_to_radius ?? false,
  } : undefined

  return {
    id: customer.customer_number || `USR-${customer.id}`,
    customerId: customer.id,
    name: customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
    email: customer.email || 'No email',
    phone: customer.phone || 'No phone',
    status: mapStatus(customer.status),
    connectionStatus: isOnline ? "online" : "offline",
    type: mappedType,
    plan: primaryService?.plan?.name || "No Plan",
    planPrice: primaryService?.plan?.price ? parseFloat(String(primaryService.plan.price)) : 0,
    joinedDate: safeDate(customer.created_at),
    expiryDate: safeDate(primaryService?.expiry_date),
    lastOnline: isOnline ? "Now" : (primaryService?.last_seen ? new Date(primaryService.last_seen).toLocaleString() : "Never"),
    dataUsed: primaryService?.data_used || 0,
    dataLimit: primaryService?.data_limit || null,
    macAddress: primaryService?.mac_address,
    ipAddress: primaryService?.ip_address,
    router: primaryService?.device?.name || "Not assigned",
    downloadSpeed: primaryService?.download_speed || 0,
    uploadSpeed: primaryService?.upload_speed || 0,
    loyaltyPoints: 0, // Will come from loyalty module
    balance: parseFloat(customer.balance) || 0,
    radiusCredentials,
  }
}

// Mock data generator (fallback when API is unavailable)
const generateMockUsers = (): User[] => {
  const types: UserType[] = ["pppoe", "static", "fiber"]
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

// Generate a simple password for easy testing
const generateSimplePassword = (length: number = 8): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
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
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const itemsPerPage = 10

  // Edit user form state
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    radius_username: "",
    radius_password: "",
  })

  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    connection_type: "pppoe" as "pppoe" | "static",
    plan_id: "",
    router_id: "",
  })

  useEffect(() => {
    loadUsers()
    loadPlans()
  }, [])

  // Load billing plans from API
  const loadPlans = async () => {
    try {
      setPlansLoading(true)
      const response = await adminApi.getPlans({ is_active: "true" })
      setPlans(response.results || [])
    } catch (err) {
      console.error('Failed to load plans:', err)
      // Don't show error toast for plans - just use empty array
    } finally {
      setPlansLoading(false)
    }
  }

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

  // Create customer function
  const handleCreateCustomer = async () => {
    // Validate required fields
    if (!newCustomerForm.first_name || !newCustomerForm.last_name) {
      toast.error("First name and last name are required")
      return
    }
    if (!newCustomerForm.email) {
      toast.error("Email is required")
      return
    }
    if (!newCustomerForm.phone) {
      toast.error("Phone number is required")
      return
    }
    if (!newCustomerForm.password) {
      toast.error("Password is required")
      return
    }

    try {
      setCreating(true)
      
      // Create the customer - the backend auto-sync will create RADIUS credentials
      // if the connection_type is PPPoE or Hotspot
      const customerData = {
        first_name: newCustomerForm.first_name,
        last_name: newCustomerForm.last_name,
        email: newCustomerForm.email,
        phone_number: newCustomerForm.phone,  // Backend expects phone_number
        password: newCustomerForm.password,
        status: 'active' as const,
      }

      const newCustomer = await adminApi.createCustomer(customerData)
      
      // If a plan/router is selected, create a service connection
      // This triggers auto-sync to create RADIUS credentials
      if (newCustomerForm.connection_type && newCustomerForm.connection_type !== 'none') {
        try {
          // Build service data with optional plan
          const serviceData: Record<string, any> = {
            service_type: 'INTERNET',
            auth_connection_type: newCustomerForm.connection_type.toUpperCase(),  // PPPOE or HOTSPOT triggers RADIUS
            status: 'ACTIVE',
            // Pass the same password for RADIUS authentication
            // This makes testing easier as login and network passwords match
            radius_password: newCustomerForm.password,
          }
          
          // Add plan if selected - backend expects 'plan' not 'plan_id'
          if (newCustomerForm.plan_id) {
            const planId = parseInt(newCustomerForm.plan_id, 10)
            serviceData.plan = planId
            
            // Get selected plan details to set speeds
            const selectedPlan = plans.find(p => p.id === planId)
            if (selectedPlan) {
              serviceData.download_speed = selectedPlan.download_speed
              serviceData.upload_speed = selectedPlan.upload_speed
              serviceData.monthly_price = selectedPlan.price
            }
          }
          
          await adminApi.createCustomerService(newCustomer.id, serviceData)
        } catch (serviceError) {
          console.warn('Service creation optional error:', serviceError)
        }
      }

      toast.success(`Customer ${newCustomer.full_name} created successfully!`)
      
      // Reset form and close dialog
      setNewCustomerForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        connection_type: "pppoe",
        plan_id: "",
        router_id: "",
      })
      setShowAddUserDialog(false)
      
      // Refresh the list
      await loadUsers()
      
    } catch (err: any) {
      console.error('Failed to create customer:', err)
      toast.error(err.message || "Failed to create customer. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  // Calculate stats
  const stats: UserStats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === "active").length,
      expired: users.filter(u => u.status === "expired").length,
      online: users.filter(u => u.connectionStatus === "online").length,
      pppoe: users.filter(u => u.type === "pppoe").length,
      static: users.filter(u => u.type === "static").length,
      fiber: users.filter(u => u.type === "fiber").length,
    }
  }, [users])

  // Filter users based on tab and search
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Tab filter
      const matchesTab = 
        activeTab === "all" ||
        (activeTab === "pppoe" && user.type === "pppoe") ||
        (activeTab === "static" && user.type === "static") ||
        (activeTab === "fiber" && user.type === "fiber") ||
        (activeTab === "online" && user.connectionStatus === "online")

      // Search filter - add null checks for safety
      const matchesSearch = !searchQuery || (
        (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.phone || '').includes(searchQuery) ||
        (user.id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )

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
      pppoe: { icon: Globe, class: "bg-purple-100 text-purple-700 border-purple-200", label: "PPPoE" },
      static: { icon: Server, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Static IP" },
      fiber: { icon: Signal, class: "bg-teal-100 text-teal-700 border-teal-200", label: "Fiber" },
      wireless: { icon: Wifi, class: "bg-cyan-100 text-cyan-700 border-cyan-200", label: "Wireless" },
    }
    const typeConfig = config[type] || config.pppoe
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

  const handleEditUser = (user: User) => {
    setEditForm({
      first_name: user.name.split(' ')[0] || '',
      last_name: user.name.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone,
      radius_username: user.radiusCredentials?.username || '',
      radius_password: user.radiusCredentials?.password || '',
    })
    setSelectedUser(user)
    setShowEditUserDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    
    try {
      setUpdating(true)
      
      // Update customer details
      await adminApi.updateCustomer(selectedUser.customerId, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone_number: editForm.phone,
      })
      
      // Update RADIUS credentials if changed
      const radiusUpdate: { password?: string; username?: string } = {}
      
      // Check if username changed
      if (editForm.radius_username && editForm.radius_username !== selectedUser.radiusCredentials?.username) {
        radiusUpdate.username = editForm.radius_username
      }
      
      // Check if password changed
      if (editForm.radius_password) {
        radiusUpdate.password = editForm.radius_password
      }
      
      // Send update if anything changed
      if (Object.keys(radiusUpdate).length > 0 && selectedUser.radiusCredentials) {
        try {
          await adminApi.updateRADIUSCredentials(selectedUser.customerId, radiusUpdate)
        } catch (radiusError) {
          console.warn('RADIUS update optional error:', radiusError)
          toast.error('Failed to update RADIUS credentials')
        }
      }
      
      toast.success('User updated successfully!')
      setShowEditUserDialog(false)
      await loadUsers()
      
    } catch (err: any) {
      console.error('Failed to update user:', err)
      toast.error(err.message || 'Failed to update user')
    } finally {
      setUpdating(false)
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generateSimplePassword(8)
    setEditForm(prev => ({ ...prev, radius_password: newPassword }))
  }

  const handleRegenerateUsername = async () => {
    if (!selectedUser) return
    
    try {
      setUpdating(true)
      const result = await adminApi.regenerateRADIUSUsername(selectedUser.customerId)
      setEditForm(prev => ({ ...prev, radius_username: result.new_username }))
      toast.success(`Username updated: ${result.new_username}`)
    } catch (err: any) {
      console.error('Failed to regenerate username:', err)
      toast.error(err.message || 'Failed to regenerate username')
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
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
          <Dialog open={showAddUserDialog} onOpenChange={(open) => {
            setShowAddUserDialog(open)
            // Refresh plans when dialog opens to get latest
            if (open) {
              loadPlans()
            }
          }}>
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
                  Create a new customer account. For PPPoE/Hotspot users, RADIUS credentials will be created automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input 
                    placeholder="John" 
                    value={newCustomerForm.first_name}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input 
                    placeholder="Doe" 
                    value={newCustomerForm.last_name}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, last_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input 
                    placeholder="+254 7XX XXX XXX" 
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input 
                    type="password"
                    placeholder="Enter password" 
                    value={newCustomerForm.password}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Select 
                    value={newCustomerForm.connection_type}
                    onValueChange={(value: "pppoe" | "static") => setNewCustomerForm({...newCustomerForm, connection_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pppoe">PPPoE (Auto-creates RADIUS credentials)</SelectItem>
                      <SelectItem value="static">Static IP (Manual configuration)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Hotspot users connect via captive portal and are managed separately.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Plan (Optional)</Label>
                  <Select
                    value={newCustomerForm.plan_id || "none"}
                    onValueChange={(value) => setNewCustomerForm({...newCustomerForm, plan_id: value === "none" ? "" : value})}
                    disabled={plansLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={plansLoading ? "Loading plans..." : "Select plan"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Plan</SelectItem>
                      {plans.length === 0 && !plansLoading && (
                        <SelectItem value="no-plans" disabled>
                          No plans available - create plans first
                        </SelectItem>
                      )}
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={String(plan.id)}>
                          {plan.name} - KES {parseFloat(plan.base_price || plan.price || "0").toLocaleString()}
                          {plan.download_speed && ` (${plan.download_speed}/${plan.upload_speed || plan.download_speed} Mbps)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {plans.length === 0 && !plansLoading && (
                    <p className="text-xs text-amber-600">
                      No plans found. <a href="/admin/plans" className="underline hover:text-amber-700">Create plans</a> first.
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Required fields. PPPoE and Hotspot users will automatically get RADIUS credentials created.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("fiber")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Signal className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-600">{stats.fiber}</p>
                <p className="text-xs text-slate-500">Fiber</p>
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
          <TabsTrigger value="pppoe" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">PPPoE</span>
          </TabsTrigger>
          <TabsTrigger value="static" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">Static IP</span>
          </TabsTrigger>
          <TabsTrigger value="fiber" className="flex items-center gap-2">
            <Signal className="w-4 h-4" />
            <span className="hidden sm:inline">Fiber</span>
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
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
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

              {/* RADIUS Network Credentials - Easy to copy for testing */}
              {selectedUser.radiusCredentials && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-purple-600" />
                    Network Login (PPPoE/Hotspot)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500">Username</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border">
                          {selectedUser.radiusCredentials.username}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(selectedUser.radiusCredentials!.username, 'Username')}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">Password</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded border">
                          {showPassword ? selectedUser.radiusCredentials.password : '••••••••'}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <XCircle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(selectedUser.radiusCredentials!.password, 'Password')}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    {/* Expiration Info */}
                    <div>
                      <label className="text-xs font-medium text-slate-500">Subscription Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedUser.radiusCredentials.expiration_date ? (
                          (() => {
                            const now = new Date()
                            const expiry = new Date(selectedUser.radiusCredentials.expiration_date!)
                            const isExpired = expiry <= now
                            const diffMs = expiry.getTime() - now.getTime()
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                            
                            if (isExpired) {
                              return (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Expired
                                </Badge>
                              )
                            } else if (diffHours < 24) {
                              return (
                                <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {diffHours}h remaining
                                </Badge>
                              )
                            } else {
                              return (
                                <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {diffDays}d remaining
                                </Badge>
                              )
                            }
                          })()
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Unlimited
                          </Badge>
                        )}
                        {selectedUser.radiusCredentials.expiration_date && (
                          <span className="text-xs text-slate-500">
                            Expires: {new Date(selectedUser.radiusCredentials.expiration_date).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant={selectedUser.radiusCredentials.is_enabled ? "default" : "secondary"}>
                        {selectedUser.radiusCredentials.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <span className="text-slate-500">
                        {selectedUser.radiusCredentials.connection_type}
                      </span>
                      {selectedUser.radiusCredentials.synced_to_radius && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          ✓ Synced
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                  <Button className="flex-1" onClick={() => handleEditUser(selectedUser)}>
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

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and network credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            
            {/* RADIUS Credentials Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Network Login Credentials
              </h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit_radius_username">RADIUS Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_radius_username"
                      value={editForm.radius_username}
                      onChange={(e) => setEditForm({ ...editForm, radius_username: e.target.value })}
                      placeholder="e.g., 712345678"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleRegenerateUsername}
                      disabled={updating}
                      title="Regenerate from phone number"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Click refresh to use phone number (last 9 digits)</p>
                </div>
                <div>
                  <Label htmlFor="edit_radius_password">RADIUS Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_radius_password"
                      value={editForm.radius_password}
                      onChange={(e) => setEditForm({ ...editForm, radius_password: e.target.value })}
                      placeholder="Enter new password or generate"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGeneratePassword}
                      title="Generate simple password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Leave empty to keep current password</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updating}>
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
