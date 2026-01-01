"use client"

import React, { useState, useMemo } from "react"
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
import type {
  EquipmentItem,
  EquipmentType,
  EquipmentStatus,
  EquipmentCondition,
  EquipmentAssignment,
  Supplier,
  StockAlert,
} from "@/lib/types"

// Mock Equipment Types (Categories)
const mockEquipmentTypes: EquipmentType[] = [
  { id: 1, name: "ONU", code: "ONU", description: "Optical Network Unit", min_stock_level: 20, item_count: 45, available_count: 32, is_active: true, created_at: "2024-01-01" },
  { id: 2, name: "Router", code: "RTR", description: "WiFi Routers", min_stock_level: 10, item_count: 28, available_count: 18, is_active: true, created_at: "2024-01-01" },
  { id: 3, name: "Fiber Cable", code: "CBL", description: "Fiber optic cables", min_stock_level: 50, item_count: 120, available_count: 95, is_active: true, created_at: "2024-01-01" },
  { id: 4, name: "Splitter", code: "SPL", description: "PLC Splitters", min_stock_level: 10, item_count: 25, available_count: 20, is_active: true, created_at: "2024-01-01" },
  { id: 5, name: "Connector", code: "CON", description: "Fiber connectors", min_stock_level: 100, item_count: 350, available_count: 280, is_active: true, created_at: "2024-01-01" },
  { id: 6, name: "Tools", code: "TLS", description: "Installation tools", min_stock_level: 3, item_count: 8, available_count: 5, is_active: true, created_at: "2024-01-01" },
]

// Mock Equipment Items (Individual Assets)
const generateMockEquipment = (): EquipmentItem[] => {
  const items: EquipmentItem[] = []
  const locations = ['Main Warehouse', 'Nairobi Store', 'Mombasa Store', 'Field']

  // Generate ONU items
  for (let i = 1; i <= 25; i++) {
    const status: EquipmentStatus = i <= 15 ? 'in_stock' : i <= 20 ? 'assigned' : i <= 23 ? 'in_use' : 'maintenance'
    const condition: EquipmentCondition = i <= 10 ? 'new' : i <= 20 ? 'good' : 'fair'
    items.push({
      id: i,
      equipment_type: 1,
      equipment_type_name: "ONU",
      name: i % 2 === 0 ? "Huawei HG8145V5 ONU" : "ZTE F660 ONU",
      model: i % 2 === 0 ? "HG8145V5" : "F660",
      serial_number: `HW${String(i).padStart(8, '0')}`,
      asset_tag: `ONU-${String(i).padStart(6, '0')}`,
      supplier: i % 2 === 0 ? 1 : 2,
      supplier_name: i % 2 === 0 ? "Huawei Technologies" : "ZTE Corporation",
      purchase_date: "2024-01-15",
      purchase_price: i % 2 === 0 ? "4500.00" : "4200.00",
      warranty_expiry: "2026-01-15",
      status,
      condition,
      location: status === 'in_stock' ? locations[Math.floor(Math.random() * 3)] : 'Field',
      assigned_to: status === 'assigned' ? Math.floor(Math.random() * 5) + 1 : undefined,
      assigned_to_name: status === 'assigned' ? ['John Kamau', 'Peter Mwangi', 'James Ochieng'][Math.floor(Math.random() * 3)] : undefined,
      assigned_to_customer: status === 'in_use' ? Math.floor(Math.random() * 100) + 1 : undefined,
      assigned_to_customer_name: status === 'in_use' ? 'Customer ' + (Math.floor(Math.random() * 100) + 1) : undefined,
      age_in_months: Math.floor(Math.random() * 12) + 1,
      is_available: status === 'in_stock' && ['new', 'good', 'fair'].includes(condition),
      created_at: "2024-01-15T00:00:00Z",
      updated_at: "2024-01-20T00:00:00Z",
    })
  }

  // Generate Router items
  for (let i = 26; i <= 40; i++) {
    const status: EquipmentStatus = i <= 35 ? 'in_stock' : i <= 38 ? 'assigned' : 'in_use'
    items.push({
      id: i,
      equipment_type: 2,
      equipment_type_name: "Router",
      name: i % 2 === 0 ? "TP-Link Archer C6" : "Mikrotik hAP ac2",
      model: i % 2 === 0 ? "Archer C6" : "hAP ac2",
      serial_number: `RTR${String(i).padStart(8, '0')}`,
      asset_tag: `RTR-${String(i - 25).padStart(6, '0')}`,
      supplier: 3,
      supplier_name: "Network Solutions EA",
      purchase_date: "2024-02-01",
      purchase_price: i % 2 === 0 ? "5500.00" : "8500.00",
      warranty_expiry: "2026-02-01",
      status,
      condition: 'good',
      location: status === 'in_stock' ? 'Main Warehouse' : 'Field',
      assigned_to: status === 'assigned' ? Math.floor(Math.random() * 5) + 1 : undefined,
      assigned_to_name: status === 'assigned' ? 'Field Tech ' + (Math.floor(Math.random() * 5) + 1) : undefined,
      age_in_months: Math.floor(Math.random() * 8) + 1,
      is_available: status === 'in_stock',
      created_at: "2024-02-01T00:00:00Z",
      updated_at: "2024-02-05T00:00:00Z",
    })
  }

  // Generate Tools
  const toolNames = ['Fiber Cleaver', 'Optical Power Meter', 'OTDR', 'Fusion Splicer', 'Fiber Stripper', 'Visual Fault Locator', 'Cable Tester', 'Crimping Tool']
  for (let i = 41; i <= 48; i++) {
    const status: EquipmentStatus = i <= 45 ? 'in_stock' : 'assigned'
    items.push({
      id: i,
      equipment_type: 6,
      equipment_type_name: "Tools",
      name: toolNames[i - 41],
      model: `MODEL-${i - 40}`,
      serial_number: `TLS${String(i).padStart(8, '0')}`,
      asset_tag: `TLS-${String(i - 40).padStart(6, '0')}`,
      supplier: 4,
      supplier_name: "Fiber Optics Kenya",
      purchase_date: "2023-06-01",
      purchase_price: String((i - 40) * 5000 + 10000),
      warranty_expiry: "2025-06-01",
      status,
      condition: 'good',
      location: status === 'in_stock' ? 'Main Warehouse' : 'Field',
      assigned_to: status === 'assigned' ? i - 44 : undefined,
      assigned_to_name: status === 'assigned' ? `Tech ${i - 44}` : undefined,
      age_in_months: 18,
      is_available: status === 'in_stock',
      created_at: "2023-06-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    })
  }

  return items
}

// Mock Assignments
const generateMockAssignments = (): EquipmentAssignment[] => {
  return [
    {
      id: 1,
      equipment: 16,
      equipment_name: "Huawei HG8145V5 ONU",
      equipment_serial: "HW00000016",
      employee_id: "EMP001",
      employee_name: "John Kamau",
      purpose: "Customer installation - Westlands",
      assigned_date: "2024-01-20",
      expected_return_date: "2024-01-21",
      condition_at_assignment: 'good',
      status: 'active',
      created_at: "2024-01-20T00:00:00Z",
    },
    {
      id: 2,
      equipment: 17,
      equipment_name: "ZTE F660 ONU",
      equipment_serial: "HW00000017",
      employee_id: "EMP002",
      employee_name: "Peter Mwangi",
      purpose: "Customer installation - Kilimani",
      assigned_date: "2024-01-19",
      expected_return_date: "2024-01-20",
      actual_return_date: "2024-01-20",
      condition_at_assignment: 'good',
      condition_at_return: 'good',
      status: 'returned',
      created_at: "2024-01-19T00:00:00Z",
    },
    {
      id: 3,
      equipment: 46,
      equipment_name: "Fiber Cleaver",
      equipment_serial: "TLS00000046",
      employee_id: "EMP001",
      employee_name: "John Kamau",
      purpose: "Field installations",
      assigned_date: "2024-01-15",
      condition_at_assignment: 'good',
      status: 'active',
      created_at: "2024-01-15T00:00:00Z",
    },
  ]
}

// Mock Suppliers
const mockSuppliers: Supplier[] = [
  { id: 1, name: "Huawei Technologies", contact_name: "John Chen", email: "sales@huawei.com", phone: "+86 755 1234567", address: "Shenzhen, China", is_active: true, total_purchases: "450000.00", equipment_count: 15, created_at: "2023-01-01T00:00:00Z" },
  { id: 2, name: "ZTE Corporation", contact_name: "Li Wei", email: "sales@zte.com", phone: "+86 755 2345678", address: "Shenzhen, China", is_active: true, total_purchases: "320000.00", equipment_count: 12, created_at: "2023-01-01T00:00:00Z" },
  { id: 3, name: "Network Solutions EA", contact_name: "James Kamau", email: "info@networksolutions.co.ke", phone: "+254 20 2345678", address: "Nairobi, Kenya", is_active: true, total_purchases: "180000.00", equipment_count: 18, created_at: "2023-01-01T00:00:00Z" },
  { id: 4, name: "Fiber Optics Kenya", contact_name: "Mary Wanjiku", email: "sales@fokltd.co.ke", phone: "+254 20 1234567", address: "Nairobi, Kenya", is_active: true, total_purchases: "95000.00", equipment_count: 8, created_at: "2023-01-01T00:00:00Z" },
]

// Mock Stock Alerts
const mockStockAlerts: StockAlert[] = [
  { id: 1, equipment_type: 1, equipment_type_name: "ONU", current_count: 15, min_stock_level: 20, shortfall: 5, severity: 'warning', created_at: "2024-01-20" },
  { id: 2, equipment_type: 6, equipment_type_name: "Tools", current_count: 2, min_stock_level: 3, shortfall: 1, severity: 'critical', created_at: "2024-01-20" },
]

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
  const [equipment] = useState(generateMockEquipment())
  const [assignments] = useState(generateMockAssignments())
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("equipment")
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  // Filtered equipment
  const filteredEquipment = useMemo(() => {
    let filtered = equipment

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.serial_number?.toLowerCase().includes(q) ||
        e.asset_tag.toLowerCase().includes(q) ||
        e.model?.toLowerCase().includes(q)
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(e => e.equipment_type === parseInt(typeFilter))
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    if (conditionFilter !== "all") {
      filtered = filtered.filter(e => e.condition === conditionFilter)
    }

    return filtered
  }, [equipment, searchQuery, typeFilter, statusFilter, conditionFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleViewDetails = (item: EquipmentItem) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const handleAssign = (item: EquipmentItem) => {
    setSelectedItem(item)
    setIsAssignOpen(true)
  }

  const handleReturn = (item: EquipmentItem) => {
    setSelectedItem(item)
    setIsReturnOpen(true)
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
          <Button variant="outline">
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
      {mockStockAlerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {mockStockAlerts.map((alert) => (
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
                      {mockEquipmentTypes.map((type) => (
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
                            <DropdownMenuItem>
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
                            <DropdownMenuItem>
                              <Wrench className="mr-2 h-4 w-4" />
                              Send to Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Dispose
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Type
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockEquipmentTypes.map((type) => {
                  const stockPercent = (type.available_count / type.min_stock_level) * 100
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mockSuppliers.map((supplier) => (
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
                  <Button variant="outline">
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
                    {mockEquipmentTypes.map((type) => (
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
                    {mockSuppliers.map((s) => (
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
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddItemOpen(false)}>
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
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAssignOpen(false)}>
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
            <Button variant="outline" onClick={() => setIsReturnOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsReturnOpen(false)}>
              Return to Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
