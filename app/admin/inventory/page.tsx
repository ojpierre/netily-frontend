"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Package,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
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
  ArrowUpDown,
  History,
  QrCode,
  Scan,
  PackageCheck,
  PackageMinus,
  PackageX,
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
import type { InventoryItem, Supplier } from "@/lib/types"

type ItemStatus = 'in_stock' | 'assigned' | 'deployed' | 'faulty' | 'rma'
type ItemCategory = 'onu' | 'router' | 'cable' | 'connector' | 'splitter' | 'olt_module' | 'tools' | 'other'

// Mock inventory items
const generateMockInventory = (): (InventoryItem & { quantity: number; min_quantity: number })[] => {
  const items = [
    { name: "Huawei HG8145V5 ONU", category: "onu" as ItemCategory, sku: "HG8145V5", unit_cost: 4500, quantity: 45, min_quantity: 20 },
    { name: "ZTE F660 ONU", category: "onu" as ItemCategory, sku: "ZTE-F660", unit_cost: 4200, quantity: 32, min_quantity: 15 },
    { name: "Huawei EG8145X6 WiFi 6 ONU", category: "onu" as ItemCategory, sku: "EG8145X6", unit_cost: 7500, quantity: 8, min_quantity: 10 },
    { name: "TP-Link Archer C6 Router", category: "router" as ItemCategory, sku: "ARCHER-C6", unit_cost: 5500, quantity: 25, min_quantity: 10 },
    { name: "Mikrotik hAP ac2 Router", category: "router" as ItemCategory, sku: "HAP-AC2", unit_cost: 8500, quantity: 12, min_quantity: 5 },
    { name: "SC/APC Fiber Patch Cord 3m", category: "cable" as ItemCategory, sku: "FPC-SC-3M", unit_cost: 250, quantity: 150, min_quantity: 50 },
    { name: "SC/APC Fiber Patch Cord 5m", category: "cable" as ItemCategory, sku: "FPC-SC-5M", unit_cost: 350, quantity: 80, min_quantity: 30 },
    { name: "Drop Cable 2 Core 100m", category: "cable" as ItemCategory, sku: "DC-2C-100", unit_cost: 1200, quantity: 35, min_quantity: 20 },
    { name: "SC/APC Fast Connector", category: "connector" as ItemCategory, sku: "SCAPC-FC", unit_cost: 85, quantity: 500, min_quantity: 200 },
    { name: "SC/UPC Fast Connector", category: "connector" as ItemCategory, sku: "SCUPC-FC", unit_cost: 75, quantity: 300, min_quantity: 150 },
    { name: "1x8 PLC Splitter", category: "splitter" as ItemCategory, sku: "PLC-1X8", unit_cost: 2500, quantity: 15, min_quantity: 10 },
    { name: "1x16 PLC Splitter", category: "splitter" as ItemCategory, sku: "PLC-1X16", unit_cost: 4000, quantity: 8, min_quantity: 5 },
    { name: "SFP+ 10G Module", category: "olt_module" as ItemCategory, sku: "SFP-10G", unit_cost: 15000, quantity: 6, min_quantity: 4 },
    { name: "GPON OLT SFP Class C+", category: "olt_module" as ItemCategory, sku: "GPON-SFP-C", unit_cost: 25000, quantity: 4, min_quantity: 2 },
    { name: "Fiber Cleaver", category: "tools" as ItemCategory, sku: "FBR-CLEAVER", unit_cost: 35000, quantity: 3, min_quantity: 2 },
    { name: "Optical Power Meter", category: "tools" as ItemCategory, sku: "OPM-001", unit_cost: 12000, quantity: 5, min_quantity: 3 },
  ]

  return items.map((item, idx) => ({
    id: idx + 1,
    name: item.name,
    sku: item.sku,
    category: item.category,
    description: `${item.name} for network installations`,
    unit_cost: item.unit_cost.toString(),
    quantity: item.quantity,
    min_quantity: item.min_quantity,
    location: ['Main Warehouse', 'Nairobi Store', 'Mombasa Store'][Math.floor(Math.random() * 3)],
    supplier: Math.floor(Math.random() * 4) + 1,
    status: item.quantity <= 0 ? 'out_of_stock' as const : 
            item.quantity < item.min_quantity ? 'low_stock' as const : 'in_stock' as const,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_restocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

// Mock suppliers
const mockSuppliers: Supplier[] = [
  { id: 1, name: "Huawei Technologies", contact_name: "John Chen", email: "sales@huawei.com", phone: "+86 755 1234567", address: "Shenzhen, China", created_at: "2023-01-01T00:00:00Z" },
  { id: 2, name: "ZTE Corporation", contact_name: "Li Wei", email: "sales@zte.com", phone: "+86 755 2345678", address: "Shenzhen, China", created_at: "2023-01-01T00:00:00Z" },
  { id: 3, name: "Fiber Optics Kenya", contact_name: "Mary Wanjiku", email: "sales@fokltd.co.ke", phone: "+254 20 1234567", address: "Nairobi, Kenya", created_at: "2023-01-01T00:00:00Z" },
  { id: 4, name: "Network Solutions EA", contact_name: "James Kamau", email: "info@networksolutions.co.ke", phone: "+254 20 2345678", address: "Nairobi, Kenya", created_at: "2023-01-01T00:00:00Z" },
]

// Mock movements/transactions
interface InventoryMovement {
  id: number
  item_id: number
  item_name: string
  type: 'received' | 'issued' | 'returned' | 'adjustment'
  quantity: number
  reference: string
  notes: string
  created_by: string
  created_at: string
}

const generateMockMovements = (): InventoryMovement[] => {
  const movements: InventoryMovement[] = []
  const types: InventoryMovement['type'][] = ['received', 'issued', 'issued', 'issued', 'returned']
  const items = generateMockInventory()
  
  for (let i = 1; i <= 30; i++) {
    const item = items[Math.floor(Math.random() * items.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    
    movements.push({
      id: i,
      item_id: item.id,
      item_name: item.name,
      type,
      quantity: type === 'received' ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 5) + 1,
      reference: type === 'received' ? `PO-${2024000 + i}` : 
                 type === 'issued' ? `JOB-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` :
                 `RET-${i}`,
      notes: type === 'received' ? 'Stock received from supplier' :
             type === 'issued' ? 'Issued for installation job' :
             type === 'returned' ? 'Returned from field - unused' : 'Stock adjustment',
      created_by: ['Peter O.', 'James M.', 'David K.'][Math.floor(Math.random() * 3)],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }
  return movements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

const getCategoryIcon = (category: ItemCategory) => {
  const icons: Record<ItemCategory, React.ReactNode> = {
    onu: <Box className="h-4 w-4" />,
    router: <Package className="h-4 w-4" />,
    cable: <Tag className="h-4 w-4" />,
    connector: <Tag className="h-4 w-4" />,
    splitter: <Tag className="h-4 w-4" />,
    olt_module: <Box className="h-4 w-4" />,
    tools: <Tag className="h-4 w-4" />,
    other: <Package className="h-4 w-4" />,
  }
  return icons[category]
}

const getStockBadge = (quantity: number, min_quantity: number) => {
  if (quantity <= 0) {
    return <Badge variant="destructive" className="gap-1"><PackageX className="h-3 w-3" />Out of Stock</Badge>
  }
  if (quantity < min_quantity) {
    return <Badge variant="secondary" className="gap-1 text-yellow-600"><PackageMinus className="h-3 w-3" />Low Stock</Badge>
  }
  return <Badge variant="default" className="gap-1 bg-green-500"><PackageCheck className="h-3 w-3" />In Stock</Badge>
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num)
}

export default function InventoryPage() {
  const [inventory] = useState(generateMockInventory())
  const [movements] = useState(generateMockMovements())
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("inventory")
  const [selectedItem, setSelectedItem] = useState<typeof inventory[0] | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false)
  const [isIssueStockOpen, setIsIssueStockOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add item form
  const [itemForm, setItemForm] = useState({
    name: "",
    sku: "",
    category: "onu" as ItemCategory,
    unit_cost: "",
    min_quantity: "",
    location: "",
    supplier: "",
    description: "",
  })

  // Stock form
  const [stockForm, setStockForm] = useState({
    item_id: "",
    quantity: "",
    reference: "",
    notes: "",
  })

  // Stats
  const stats = useMemo(() => {
    const totalItems = inventory.length
    const totalValue = inventory.reduce((sum, i) => sum + parseFloat(i.unit_cost) * i.quantity, 0)
    const lowStock = inventory.filter(i => i.quantity < i.min_quantity && i.quantity > 0).length
    const outOfStock = inventory.filter(i => i.quantity <= 0).length
    
    return {
      totalItems,
      totalValue,
      lowStock,
      outOfStock,
      totalUnits: inventory.reduce((sum, i) => sum + i.quantity, 0),
    }
  }, [inventory])

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    let filtered = inventory

    if (searchQuery) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(i => i.category === categoryFilter)
    }

    if (stockFilter === "low") {
      filtered = filtered.filter(i => i.quantity < i.min_quantity && i.quantity > 0)
    } else if (stockFilter === "out") {
      filtered = filtered.filter(i => i.quantity <= 0)
    }

    return filtered
  }, [inventory, searchQuery, categoryFilter, stockFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleViewDetails = (item: typeof inventory[0]) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const handleAddItem = () => {
    console.log("Adding item:", itemForm)
    setIsAddItemOpen(false)
    setItemForm({
      name: "",
      sku: "",
      category: "onu",
      unit_cost: "",
      min_quantity: "",
      location: "",
      supplier: "",
      description: "",
    })
  }

  const handleReceiveStock = () => {
    console.log("Receiving stock:", stockForm)
    setIsReceiveStockOpen(false)
    setStockForm({ item_id: "", quantity: "", reference: "", notes: "" })
  }

  const handleIssueStock = () => {
    console.log("Issuing stock:", stockForm)
    setIsIssueStockOpen(false)
    setStockForm({ item_id: "", quantity: "", reference: "", notes: "" })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track equipment, consumables, and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsReceiveStockOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Receive Stock
          </Button>
          <Button variant="outline" onClick={() => setIsIssueStockOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Issue Stock
          </Button>
          <Button onClick={() => setIsAddItemOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Unique products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              At cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Items below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              Need reorder
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Movements
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Stock Items</CardTitle>
                  <CardDescription>
                    {filteredInventory.length} items found
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="onu">ONU</SelectItem>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="cable">Cable</SelectItem>
                      <SelectItem value="connector">Connector</SelectItem>
                      <SelectItem value="splitter">Splitter</SelectItem>
                      <SelectItem value="olt_module">OLT Module</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{item.sku}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.location}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-bold ${item.quantity < item.min_quantity ? 'text-yellow-600' : ''} ${item.quantity <= 0 ? 'text-red-600' : ''}`}>
                            {item.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            min: {item.min_quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell>{getStockBadge(item.quantity, item.min_quantity)}</TableCell>
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
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <QrCode className="mr-2 h-4 w-4" />
                              Print Label
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setStockForm({ ...stockForm, item_id: String(item.id) })
                              setIsReceiveStockOpen(true)
                            }}>
                              <Download className="mr-2 h-4 w-4" />
                              Receive Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setStockForm({ ...stockForm, item_id: String(item.id) })
                              setIsIssueStockOpen(true)
                            }}>
                              <Upload className="mr-2 h-4 w-4" />
                              Issue Stock
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
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

        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Movements</CardTitle>
                  <CardDescription>Recent inventory transactions</CardDescription>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={movement.type === 'received' ? 'default' : movement.type === 'issued' ? 'secondary' : 'outline'}
                          className={movement.type === 'received' ? 'bg-green-500' : ''}
                        >
                          {movement.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{movement.item_name}</TableCell>
                      <TableCell>
                        <span className={movement.type === 'received' || movement.type === 'returned' ? 'text-green-600' : 'text-red-600'}>
                          {movement.type === 'received' || movement.type === 'returned' ? '+' : '-'}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{movement.reference}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {movement.notes}
                      </TableCell>
                      <TableCell>{movement.created_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Email:</span>
                          <a href={`mailto:${supplier.email}`} className="hover:underline">{supplier.email}</a>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Phone:</span>
                          {supplier.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Location:</span>
                          {supplier.address}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedItem.name}</SheetTitle>
                <SheetDescription>SKU: {selectedItem.sku}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium capitalize">{selectedItem.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium">{selectedItem.location}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Unit Cost</Label>
                    <p className="font-medium">{formatCurrency(selectedItem.unit_cost)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stock Value</Label>
                    <p className="font-medium">{formatCurrency(parseFloat(selectedItem.unit_cost) * selectedItem.quantity)}</p>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Stock Levels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Current: {selectedItem.quantity}</span>
                      <span className="text-sm text-muted-foreground">Min: {selectedItem.min_quantity}</span>
                    </div>
                    <Progress
                      value={Math.min(100, (selectedItem.quantity / (selectedItem.min_quantity * 2)) * 100)}
                      className={`h-3 ${selectedItem.quantity < selectedItem.min_quantity ? '[&>div]:bg-yellow-500' : ''}`}
                    />
                    <div className="mt-2">
                      {getStockBadge(selectedItem.quantity, selectedItem.min_quantity)}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setStockForm({ ...stockForm, item_id: String(selectedItem.id) })
                      setIsReceiveStockOpen(true)
                      setIsDetailOpen(false)
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Receive
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStockForm({ ...stockForm, item_id: String(selectedItem.id) })
                      setIsIssueStockOpen(true)
                      setIsDetailOpen(false)
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Issue
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Add a new item to your inventory
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="e.g. Huawei HG8145V5 ONU"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="e.g. HG8145V5"
                  value={itemForm.sku}
                  onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v as ItemCategory })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onu">ONU</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                    <SelectItem value="connector">Connector</SelectItem>
                    <SelectItem value="splitter">Splitter</SelectItem>
                    <SelectItem value="olt_module">OLT Module</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit_cost">Unit Cost (KES)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  placeholder="0.00"
                  value={itemForm.unit_cost}
                  onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min_quantity">Min Quantity</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  placeholder="10"
                  value={itemForm.min_quantity}
                  onChange={(e) => setItemForm({ ...itemForm, min_quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Select value={itemForm.location} onValueChange={(v) => setItemForm({ ...itemForm, location: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Warehouse</SelectItem>
                    <SelectItem value="nairobi">Nairobi Store</SelectItem>
                    <SelectItem value="mombasa">Mombasa Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={itemForm.supplier} onValueChange={(v) => setItemForm({ ...itemForm, supplier: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Item description..."
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Stock Dialog */}
      <Dialog open={isReceiveStockOpen} onOpenChange={setIsReceiveStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
            <DialogDescription>
              Add stock received from supplier
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Item</Label>
              <Select value={stockForm.item_id} onValueChange={(v) => setStockForm({ ...stockForm, item_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="0"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Reference (PO Number)</Label>
              <Input
                placeholder="PO-2024001"
                value={stockForm.reference}
                onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={stockForm.notes}
                onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveStockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReceiveStock}>
              <Download className="mr-2 h-4 w-4" />
              Receive Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Stock Dialog */}
      <Dialog open={isIssueStockOpen} onOpenChange={setIsIssueStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Stock</DialogTitle>
            <DialogDescription>
              Issue stock for a job or technician
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Item</Label>
              <Select value={stockForm.item_id} onValueChange={(v) => setStockForm({ ...stockForm, item_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.filter(i => i.quantity > 0).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name} ({item.quantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="0"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Reference (Job ID)</Label>
              <Input
                placeholder="JOB-0001"
                value={stockForm.reference}
                onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="e.g. Issued to Peter O. for installation"
                value={stockForm.notes}
                onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIssueStockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIssueStock}>
              <Upload className="mr-2 h-4 w-4" />
              Issue Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
