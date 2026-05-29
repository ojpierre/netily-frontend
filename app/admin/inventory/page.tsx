"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  Package,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Download,
  Search,
  Box,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Truck,
  Warehouse,
  User,
  Tag,
  BarChart3,
  History,
  QrCode,
  UserCheck,
  Undo2,
  Wrench,
  ClipboardList,
  Filter,
  Calendar,
  MapPin,
  Hash,
  DollarSign,
  Clock,
  AlertCircle,
  Settings,
  FileText,
  Users,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type {
  EquipmentItem,
  EquipmentType,
  EquipmentStatus,
  EquipmentCondition,
  EquipmentAssignment,
  Supplier,
  StockAlert,
} from "@/lib/types"

// Helper Functions
const getStatusBadge = (status: EquipmentStatus) => {
  const badges: Record<EquipmentStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }> = {
    'in_stock': { variant: 'default', label: 'In Stock', className: 'bg-green-500' },
    'assigned': { variant: 'secondary', label: 'Assigned', className: 'bg-blue-500 text-white' },
    'in_use': { variant: 'secondary', label: 'In Use', className: 'bg-purple-500 text-white' },
    'maintenance': { variant: 'secondary', label: 'Maintenance', className: 'bg-yellow-500 text-black' },
    'faulty': { variant: 'destructive', label: 'Faulty' },
    'retired': { variant: 'outline', label: 'Retired' },
    'lost': { variant: 'destructive', label: 'Lost' },
    'disposed': { variant: 'outline', label: 'Disposed' },
  }
  const badge = badges[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
}

const getConditionBadge = (condition: EquipmentCondition) => {
  const badges: Record<EquipmentCondition, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    'new': { variant: 'default', label: 'New' },
    'good': { variant: 'secondary', label: 'Good' },
    'fair': { variant: 'outline', label: 'Fair' },
    'poor': { variant: 'outline', label: 'Poor' },
    'faulty': { variant: 'destructive', label: 'Faulty' },
  }
  return <Badge variant={badges[condition].variant}>{badges[condition].label}</Badge>
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num)
}

export default function InventoryPage() {
  // Data states
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [conditionFilter, setConditionFilter] = useState<string>("all")

  // UI states
  const [activeTab, setActiveTab] = useState("equipment")
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false)
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)

  // Add equipment form
  const [itemForm, setItemForm] = useState({
    equipment_type: "",
    name: "",
    model: "",
    serial_number: "",
    supplier: "",
    purchase_date: "",
    purchase_price: "",
    warranty_expiry: "",
    condition: "new" as EquipmentCondition,
    location: "",
    notes: "",
  })

  // Assignment form
  const [assignForm, setAssignForm] = useState({
    employee_id: "",
    purpose: "",
    expected_return_date: "",
  })

  // Return form
  const [returnForm, setReturnForm] = useState({
    condition: "good" as EquipmentCondition,
    notes: "",
  })

  // Edit equipment form
  const [editForm, setEditForm] = useState({
    name: "",
    model: "",
    serial_number: "",
    condition: "good" as EquipmentCondition,
    location: "",
    notes: "",
    purchase_price: "",
  })

  // Add type form
  const [typeForm, setTypeForm] = useState({
    name: "",
    code: "",
    description: "",
    min_stock_level: "5",
  })

  // Add supplier form
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
  })

  // Fetch all data with optional filters
  const fetchData = useCallback(async (filters?: {
    search?: string
    status?: string
    condition?: string
    equipment_type?: string
  }) => {
    try {
      // Build query params for equipment
      const equipmentParams: Record<string, string> = {}
      if (filters?.search) equipmentParams.search = filters.search
      if (filters?.status && filters.status !== 'all') equipmentParams.status = filters.status
      if (filters?.condition && filters.condition !== 'all') equipmentParams.condition = filters.condition
      if (filters?.equipment_type && filters.equipment_type !== 'all') equipmentParams.equipment_type = filters.equipment_type
      equipmentParams.ordering = '-purchase_date' // Default ordering

      const [equipmentRes, typesRes, assignmentsRes, suppliersRes, alertsRes] = await Promise.all([
        adminApi.getEquipmentItems(Object.keys(equipmentParams).length > 0 ? equipmentParams : undefined),
        adminApi.getEquipmentTypes(),
        adminApi.getAssignments().catch((err) => {
          console.warn('Failed to fetch assignments:', err)
          return { results: [] }
        }),
        adminApi.getSuppliers(),
        adminApi.getStockAlerts().catch(() => []), // Stock alerts might not be implemented
      ])

      setEquipment(equipmentRes.results || [])
      setEquipmentTypes(typesRes.results || [])
      setAssignments(assignmentsRes.results || [])
      setSuppliers(suppliersRes.results || [])
      setStockAlerts(alertsRes || [])
    } catch (error) {
      console.error('Failed to fetch inventory data:', error)
      toast.error('Failed to load inventory data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        fetchData({
          search: searchQuery,
          status: statusFilter,
          condition: conditionFilter,
          equipment_type: typeFilter,
        })
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, conditionFilter, typeFilter, fetchData, isLoading])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData({
      search: searchQuery,
      status: statusFilter,
      condition: conditionFilter,
      equipment_type: typeFilter,
    })
    setIsRefreshing(false)
    toast.success('Inventory data refreshed')
  }

  // Stats
  const stats = useMemo(() => {
    const totalAssets = equipment.length
    const available = equipment.filter(e => e.is_available).length
    const assigned = equipment.filter(e => e.status === 'assigned').length
    const inUse = equipment.filter(e => e.status === 'in_use').length
    const maintenance = equipment.filter(e => e.status === 'maintenance').length
    const faulty = equipment.filter(e => e.status === 'faulty' || e.condition === 'faulty').length
    const totalValue = equipment.reduce((sum, e) => sum + (parseFloat(e.purchase_price || '0')), 0)

    return { totalAssets, available, assigned, inUse, maintenance, faulty, totalValue }
  }, [equipment])

  // Filtered equipment (server-side filtering is primary, this is fallback/display)
  const filteredEquipment = useMemo(() => {
    // Since we're using server-side filtering, just return the equipment
    // This is here for compatibility and as a fallback
    return equipment
  }, [equipment])

  const handleViewDetails = (item: EquipmentItem) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const handleAssign = (item: EquipmentItem) => {
    setSelectedItem(item)
    setAssignForm({ employee_id: "", purpose: "", expected_return_date: "" })
    setIsAssignOpen(true)
  }

  const handleReturn = (item: EquipmentItem) => {
    setSelectedItem(item)
    setReturnForm({ condition: "good", notes: "" })
    setIsReturnOpen(true)
  }

  // Form reset
  const resetItemForm = () => {
    setItemForm({
      equipment_type: "",
      name: "",
      model: "",
      serial_number: "",
      supplier: "",
      purchase_date: "",
      purchase_price: "",
      warranty_expiry: "",
      condition: "new",
      location: "",
      notes: "",
    })
  }

  // Create equipment
  const handleCreateEquipment = async () => {
    if (!itemForm.equipment_type || !itemForm.name) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.createEquipmentItem({
        equipment_type: parseInt(itemForm.equipment_type),
        name: itemForm.name,
        model: itemForm.model || undefined,
        serial_number: itemForm.serial_number || undefined,
        supplier: itemForm.supplier ? parseInt(itemForm.supplier) : undefined,
        purchase_date: itemForm.purchase_date || undefined,
        purchase_price: itemForm.purchase_price || undefined,
        warranty_expiry: itemForm.warranty_expiry || undefined,
        condition: itemForm.condition,
        location: itemForm.location || undefined,
        notes: itemForm.notes || undefined,
      })
      toast.success('Equipment added successfully')
      setIsAddItemOpen(false)
      resetItemForm()
      fetchData()
    } catch (error) {
      console.error('Failed to create equipment:', error)
      toast.error('Failed to add equipment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Assign equipment
  const handleAssignEquipment = async () => {
    if (!selectedItem || !assignForm.employee_id) {
      toast.error('Please enter employee ID')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.assignEquipmentToEmployee(selectedItem.id, {
        employee_id: assignForm.employee_id,
        purpose: assignForm.purpose || undefined,
        expected_return_date: assignForm.expected_return_date || undefined,
      })
      toast.success('Equipment assigned successfully')
      setIsAssignOpen(false)
      setSelectedItem(null)
      fetchData()
    } catch (error) {
      console.error('Failed to assign equipment:', error)
      toast.error('Failed to assign equipment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Return equipment
  const handleReturnEquipment = async () => {
    if (!selectedItem) return

    setIsSubmitting(true)
    try {
      await adminApi.returnEquipment(selectedItem.id, {
        condition: returnForm.condition,
        notes: returnForm.notes || undefined,
      })
      toast.success('Equipment returned successfully')
      setIsReturnOpen(false)
      setSelectedItem(null)
      fetchData()
    } catch (error) {
      console.error('Failed to return equipment:', error)
      toast.error('Failed to return equipment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Send to maintenance
  const handleSendToMaintenance = async (item: EquipmentItem) => {
    try {
      await adminApi.sendToMaintenance(item.id, {})
      toast.success('Equipment sent to maintenance')
      fetchData()
    } catch (error) {
      console.error('Failed to send to maintenance:', error)
      toast.error('Failed to send to maintenance')
    }
  }

  // Dispose equipment
  const handleDispose = async (item: EquipmentItem) => {
    if (!confirm(`Are you sure you want to dispose ${item.name}?`)) return

    try {
      await adminApi.disposeEquipment(item.id, {})
      toast.success('Equipment disposed')
      fetchData()
    } catch (error) {
      console.error('Failed to dispose equipment:', error)
      toast.error('Failed to dispose equipment')
    }
  }

  // Edit equipment
  const handleEditEquipment = (item: EquipmentItem) => {
    setSelectedItem(item)
    setEditForm({
      name: item.name,
      model: item.model || "",
      serial_number: item.serial_number || "",
      condition: item.condition,
      location: item.location || "",
      notes: item.notes || "",
      purchase_price: item.purchase_price || "",
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedItem) return
    setIsSubmitting(true)
    try {
      await adminApi.updateEquipmentItem(selectedItem.id, {
        name: editForm.name,
        model: editForm.model || undefined,
        serial_number: editForm.serial_number || undefined,
        condition: editForm.condition,
        location: editForm.location || undefined,
        notes: editForm.notes || undefined,
        purchase_price: editForm.purchase_price || undefined,
      })
      toast.success('Equipment updated')
      setIsEditOpen(false)
      setIsDetailOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to update equipment:', error)
      toast.error('Failed to update equipment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete equipment
  const handleDeleteEquipment = async (item: EquipmentItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name} (${item.asset_tag})?`)) return
    try {
      await adminApi.deleteEquipmentItem(item.id)
      toast.success('Equipment deleted')
      fetchData()
    } catch (error) {
      console.error('Failed to delete equipment:', error)
      toast.error('Failed to delete equipment')
    }
  }

  // Create equipment type
  const handleCreateType = async () => {
    if (!typeForm.name || !typeForm.code) {
      toast.error('Name and code are required')
      return
    }
    setIsSubmitting(true)
    try {
      await adminApi.createEquipmentType({
        name: typeForm.name,
        code: typeForm.code,
        description: typeForm.description || undefined,
        min_stock_level: parseInt(typeForm.min_stock_level) || 5,
      })
      toast.success('Equipment type created')
      setIsAddTypeOpen(false)
      setTypeForm({ name: "", code: "", description: "", min_stock_level: "5" })
      fetchData()
    } catch (error) {
      console.error('Failed to create equipment type:', error)
      toast.error('Failed to create equipment type')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create supplier
  const handleCreateSupplier = async () => {
    if (!supplierForm.name) {
      toast.error('Supplier name is required')
      return
    }
    setIsSubmitting(true)
    try {
      await adminApi.createSupplier({
        name: supplierForm.name,
        contact_name: supplierForm.contact_name || undefined,
        email: supplierForm.email || undefined,
        phone: supplierForm.phone || undefined,
        address: supplierForm.address || undefined,
      } as any)
      toast.success('Supplier created')
      setIsAddSupplierOpen(false)
      setSupplierForm({ name: "", contact_name: "", email: "", phone: "", address: "" })
      fetchData()
    } catch (error) {
      console.error('Failed to create supplier:', error)
      toast.error('Failed to create supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export equipment
  const handleExport = () => {
    const csvContent = [
      ['Asset Tag', 'Name', 'Model', 'Serial Number', 'Type', 'Status', 'Condition', 'Location', 'Purchase Price'].join(','),
      ...filteredEquipment.map(e => [
        e.asset_tag,
        `"${e.name}"`,
        e.model || '',
        e.serial_number || '',
        e.equipment_type_name || '',
        e.status,
        e.condition,
        e.location || '',
        e.purchase_price || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Inventory exported')
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track individual equipment assets, assignments, and maintenance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddItemOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground">Tracked items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">Ready to assign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">With employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Box className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inUse}</div>
            <p className="text-xs text-muted-foreground">Deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground">Under repair</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stockAlerts.map((alert) => (
                <Badge key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {alert.equipment_type_name}: {alert.current_count}/{alert.min_stock_level} (need {alert.shortfall} more)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="equipment" className="gap-2">
            <Package className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Equipment Assets</CardTitle>
                  <CardDescription>
                    {filteredEquipment.length} items found
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, serial, asset tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="faulty">Faulty</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="faulty">Faulty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Name / Model</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">{item.asset_tag}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.model && (
                            <p className="text-xs text-muted-foreground">{item.model}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{item.serial_number || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.equipment_type_name}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.location || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getConditionBadge(item.condition)}</TableCell>
                      <TableCell>
                        {item.assigned_to_name ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{item.assigned_to_name}</span>
                          </div>
                        ) : item.assigned_to_customer_name ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="text-sm">{item.assigned_to_customer_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditEquipment(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <QrCode className="mr-2 h-4 w-4" />
                              Print Label
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {item.is_available && (
                              <DropdownMenuItem onClick={() => handleAssign(item)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Assign to Employee
                              </DropdownMenuItem>
                            )}
                            {item.status === 'assigned' && (
                              <DropdownMenuItem onClick={() => handleReturn(item)}>
                                <Undo2 className="mr-2 h-4 w-4" />
                                Return to Stock
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleSendToMaintenance(item)}>
                              <Wrench className="mr-2 h-4 w-4" />
                              Send to Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteEquipment(item)}>
                              <Trash2 className="mr-2 h-4 w-4" />
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

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Equipment Assignments</CardTitle>
                  <CardDescription>Track equipment assigned to employees</CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.equipment_name}</TableCell>
                      <TableCell className="font-mono text-sm">{assignment.equipment_serial}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {assignment.employee_name}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{assignment.purpose}</TableCell>
                      <TableCell>{new Date(assignment.assigned_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {assignment.expected_return_date
                          ? new Date(assignment.expected_return_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            assignment.status === 'returned' ? 'secondary' :
                            assignment.status === 'overdue' ? 'destructive' : 'default'
                          }
                          className={assignment.status === 'active' ? 'bg-blue-500' : ''}
                        >
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {assignment.status === 'active' && (
                          <Button size="sm" variant="outline">
                            <Undo2 className="mr-1 h-3 w-3" />
                            Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types/Categories Tab */}
        <TabsContent value="types" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Equipment Types</CardTitle>
                <CardDescription>Categories of equipment with stock levels</CardDescription>
              </div>
              <Button onClick={() => setIsAddTypeOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Type
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {equipmentTypes.map((type) => {
                  const stockPercent = type.min_stock_level > 0 ? (type.available_count / type.min_stock_level) * 100 : 100
                  const isLow = type.available_count < type.min_stock_level
                  return (
                    <Card key={type.id} className={isLow ? 'border-yellow-300' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                          <Badge variant="outline">{type.code}</Badge>
                        </div>
                        <CardDescription>{type.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Total Items</span>
                          <span className="font-medium">{type.item_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Available</span>
                          <span className={`font-medium ${isLow ? 'text-yellow-600' : 'text-green-600'}`}>
                            {type.available_count}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Min Stock Level</span>
                          <span className="text-muted-foreground">{type.min_stock_level}</span>
                        </div>
                        <Progress
                          value={Math.min(stockPercent, 100)}
                          className={`h-2 ${isLow ? '[&>div]:bg-yellow-500' : ''}`}
                        />
                        {isLow && (
                          <p className="text-xs text-yellow-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Below minimum stock level
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Suppliers</CardTitle>
                <CardDescription>Manage your equipment suppliers</CardDescription>
              </div>
              <Button onClick={() => setIsAddSupplierOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{supplier.name}</h3>
                          <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
                        </div>
                        <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground w-20">Email:</span>
                          <a href={`mailto:${supplier.email}`} className="hover:underline">{supplier.email}</a>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground w-20">Phone:</span>
                          {supplier.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground w-20">Address:</span>
                          {supplier.address}
                        </p>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Equipment</p>
                          <p className="font-medium">{supplier.equipment_count} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Total Purchases</p>
                          <p className="font-medium">{formatCurrency(supplier.total_purchases || 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Equipment Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedItem?.name}</SheetTitle>
            <SheetDescription>
              Asset Tag: {selectedItem?.asset_tag}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-4">
            {selectedItem && (
              <div className="space-y-6 pr-4">
                <div className="flex gap-2">
                  {getStatusBadge(selectedItem.status)}
                  {getConditionBadge(selectedItem.condition)}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Serial Number</p>
                    <p className="font-mono font-medium">{selectedItem.serial_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Model</p>
                    <p className="font-medium">{selectedItem.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedItem.equipment_type_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedItem.location || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">
                      {selectedItem.purchase_date
                        ? new Date(selectedItem.purchase_date).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purchase Price</p>
                    <p className="font-medium">{formatCurrency(selectedItem.purchase_price || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Warranty Expiry</p>
                    <p className="font-medium">
                      {selectedItem.warranty_expiry
                        ? new Date(selectedItem.warranty_expiry).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-medium">{selectedItem.age_in_months} months</p>
                  </div>
                </div>

                <Separator />

                <div className="text-sm">
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedItem.supplier_name || '-'}</p>
                </div>

                {selectedItem.assigned_to_name && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Assigned To (Employee)</p>
                      <p className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedItem.assigned_to_name}
                      </p>
                    </div>
                  </>
                )}

                {selectedItem.assigned_to_customer_name && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Deployed To (Customer)</p>
                      <p className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {selectedItem.assigned_to_customer_name}
                      </p>
                    </div>
                  </>
                )}

                {selectedItem.notes && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Notes</p>
                      <p>{selectedItem.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-2">
                  {selectedItem.is_available && (
                    <Button className="flex-1" onClick={() => {
                      setIsDetailOpen(false)
                      handleAssign(selectedItem)
                    }}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Assign
                    </Button>
                  )}
                  {selectedItem.status === 'assigned' && (
                    <Button className="flex-1" onClick={() => {
                      setIsDetailOpen(false)
                      handleReturn(selectedItem)
                    }}>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Return
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => { setIsDetailOpen(false); handleEditEquipment(selectedItem) }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline">
                    <QrCode className="mr-2 h-4 w-4" />
                    Label
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Add Equipment Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>
              Register a new equipment asset in the inventory
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_type">Equipment Type *</Label>
                <Select
                  value={itemForm.equipment_type}
                  onValueChange={(v) => setItemForm({ ...itemForm, equipment_type: v })}
                >
                  <SelectTrigger id="equipment_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Huawei HG8145V5 ONU"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., HG8145V5"
                  value={itemForm.model}
                  onChange={(e) => setItemForm({ ...itemForm, model: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  placeholder="Optional - auto-generated if empty"
                  value={itemForm.serial_number}
                  onChange={(e) => setItemForm({ ...itemForm, serial_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={itemForm.supplier}
                  onValueChange={(v) => setItemForm({ ...itemForm, supplier: v })}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={itemForm.condition}
                  onValueChange={(v) => setItemForm({ ...itemForm, condition: v as EquipmentCondition })}
                >
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={itemForm.purchase_date}
                  onChange={(e) => setItemForm({ ...itemForm, purchase_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (KES)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  placeholder="0.00"
                  value={itemForm.purchase_price}
                  onChange={(e) => setItemForm({ ...itemForm, purchase_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry"
                  type="date"
                  value={itemForm.warranty_expiry}
                  onChange={(e) => setItemForm({ ...itemForm, warranty_expiry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Main Warehouse"
                value={itemForm.location}
                onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateEquipment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Equipment Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Equipment</DialogTitle>
            <DialogDescription>
              Assign {selectedItem?.name} ({selectedItem?.asset_tag}) to an employee
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                placeholder="e.g., EMP001"
                value={assignForm.employee_id}
                onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="e.g., Customer installation - Westlands"
                value={assignForm.purpose}
                onChange={(e) => setAssignForm({ ...assignForm, purpose: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_return_date">Expected Return Date</Label>
              <Input
                id="expected_return_date"
                type="date"
                value={assignForm.expected_return_date}
                onChange={(e) => setAssignForm({ ...assignForm, expected_return_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAssignEquipment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Equipment Dialog */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Equipment</DialogTitle>
            <DialogDescription>
              Return {selectedItem?.name} ({selectedItem?.asset_tag}) to inventory
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="return_condition">Condition at Return *</Label>
              <Select
                value={returnForm.condition}
                onValueChange={(v) => setReturnForm({ ...returnForm, condition: v as EquipmentCondition })}
              >
                <SelectTrigger id="return_condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="faulty">Faulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_notes">Notes</Label>
              <Textarea
                id="return_notes"
                placeholder="Any notes about the return..."
                value={returnForm.notes}
                onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleReturnEquipment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Return to Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Update {selectedItem?.name} ({selectedItem?.asset_tag})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  value={editForm.serial_number}
                  onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={editForm.condition} onValueChange={(v) => setEditForm({ ...editForm, condition: v as EquipmentCondition })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="faulty">Faulty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price (KES)</Label>
                <Input
                  type="number"
                  value={editForm.purchase_price}
                  onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Equipment Type Dialog */}
      <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Equipment Type</DialogTitle>
            <DialogDescription>Create a new equipment category</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., ONU"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  placeholder="e.g., ONU"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this equipment type"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum Stock Level</Label>
              <Input
                type="number"
                value={typeForm.min_stock_level}
                onChange={(e) => setTypeForm({ ...typeForm, min_stock_level: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTypeOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleCreateType} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Register a new equipment supplier</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  placeholder="e.g., Huawei Technologies"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  placeholder="e.g., John Doe"
                  value={supplierForm.contact_name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="supplier@example.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+254 700 000 000"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                placeholder="Supplier address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleCreateSupplier} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
