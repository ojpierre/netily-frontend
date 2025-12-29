"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Check,
  Zap,
  Loader2,
  Wifi,
  Globe,
  Server,
  Ticket,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Copy,
  Download,
  RefreshCw,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  Pause,
  Play,
  Settings,
  QrCode,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

// Plan types
type PlanType = "hotspot" | "pppoe" | "static"
type DurationType = "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly"

interface Plan {
  id: string
  name: string
  type: PlanType
  speedDown: number
  speedUp: number
  duration: number
  durationType: DurationType
  price: number
  dataLimit: number | null // null = unlimited
  description: string
  isPopular: boolean
  features: string[]
  status: "active" | "inactive"
  subscribers: number
  revenue: number
  createdAt: string
  sharedUsers?: number // for shared plans
  burstSpeed?: number // burst speed in Mbps
  priority?: number // QoS priority 1-8
}

interface Voucher {
  id: string
  code: string
  planId: string
  planName: string
  status: "available" | "used" | "expired"
  createdAt: string
  usedAt?: string
  usedBy?: string
  expiresAt: string
  batchId: string
}

interface VoucherBatch {
  id: string
  planId: string
  planName: string
  quantity: number
  available: number
  used: number
  expired: number
  createdAt: string
}

// Stats interface
interface PlanStats {
  totalPlans: number
  activePlans: number
  totalSubscribers: number
  monthlyRevenue: number
  hotspotPlans: number
  pppoePlans: number
  staticPlans: number
  voucherBatches: number
}

// Mock data generators
const generateMockPlans = (): Plan[] => {
  const plans: Plan[] = [
    // Hotspot Plans
    {
      id: "HP-001",
      name: "Daily Surf",
      type: "hotspot",
      speedDown: 5,
      speedUp: 2,
      duration: 1,
      durationType: "daily",
      price: 50,
      dataLimit: 2,
      description: "Perfect for daily casual browsing",
      isPopular: false,
      features: ["2GB Data", "5 Mbps Download", "Captive Portal Access"],
      status: "active",
      subscribers: 234,
      revenue: 11700,
      createdAt: "2024-01-15",
    },
    {
      id: "HP-002",
      name: "Weekly Unlimited",
      type: "hotspot",
      speedDown: 8,
      speedUp: 4,
      duration: 7,
      durationType: "weekly",
      price: 350,
      dataLimit: null,
      description: "Unlimited weekly access",
      isPopular: true,
      features: ["Unlimited Data", "8 Mbps Download", "Multi-device Support"],
      status: "active",
      subscribers: 456,
      revenue: 159600,
      createdAt: "2024-01-10",
    },
    {
      id: "HP-003",
      name: "Monthly Value",
      type: "hotspot",
      speedDown: 10,
      speedUp: 5,
      duration: 30,
      durationType: "monthly",
      price: 1200,
      dataLimit: null,
      description: "Best value for regular users",
      isPopular: true,
      features: ["Unlimited Data", "10 Mbps Download", "Priority Support", "2 Devices"],
      status: "active",
      subscribers: 789,
      revenue: 946800,
      createdAt: "2024-01-01",
    },
    // PPPoE Plans
    {
      id: "PP-001",
      name: "Home Basic",
      type: "pppoe",
      speedDown: 10,
      speedUp: 5,
      duration: 30,
      durationType: "monthly",
      price: 1500,
      dataLimit: null,
      description: "Basic home internet",
      isPopular: false,
      features: ["Unlimited Data", "10 Mbps Symmetrical", "Free Router", "24/7 Support"],
      status: "active",
      subscribers: 345,
      revenue: 517500,
      createdAt: "2024-02-01",
      priority: 4,
    },
    {
      id: "PP-002",
      name: "Home Premium",
      type: "pppoe",
      speedDown: 20,
      speedUp: 10,
      duration: 30,
      durationType: "monthly",
      price: 2500,
      dataLimit: null,
      description: "Premium home experience",
      isPopular: true,
      features: ["Unlimited Data", "20 Mbps Download", "Free Router", "Priority Support", "Static IP Option"],
      status: "active",
      subscribers: 234,
      revenue: 585000,
      createdAt: "2024-02-01",
      burstSpeed: 30,
      priority: 2,
    },
    {
      id: "PP-003",
      name: "Business Pro",
      type: "pppoe",
      speedDown: 50,
      speedUp: 50,
      duration: 30,
      durationType: "monthly",
      price: 8000,
      dataLimit: null,
      description: "Enterprise-grade connectivity",
      isPopular: false,
      features: ["Unlimited Data", "50 Mbps Symmetrical", "Dedicated Support", "Static IP Included", "SLA 99.9%"],
      status: "active",
      subscribers: 56,
      revenue: 448000,
      createdAt: "2024-02-15",
      burstSpeed: 100,
      priority: 1,
    },
    // Static IP Plans
    {
      id: "ST-001",
      name: "Static Basic",
      type: "static",
      speedDown: 20,
      speedUp: 20,
      duration: 30,
      durationType: "monthly",
      price: 3500,
      dataLimit: null,
      description: "Static IP for small business",
      isPopular: false,
      features: ["1 Static IP", "20 Mbps Symmetrical", "Port Forwarding", "Business Support"],
      status: "active",
      subscribers: 89,
      revenue: 311500,
      createdAt: "2024-03-01",
      priority: 2,
    },
    {
      id: "ST-002",
      name: "Static Premium",
      type: "static",
      speedDown: 50,
      speedUp: 50,
      duration: 30,
      durationType: "monthly",
      price: 7500,
      dataLimit: null,
      description: "Premium static for enterprises",
      isPopular: true,
      features: ["5 Static IPs", "50 Mbps Symmetrical", "DDoS Protection", "24/7 Premium Support", "SLA 99.99%"],
      status: "active",
      subscribers: 34,
      revenue: 255000,
      createdAt: "2024-03-01",
      burstSpeed: 100,
      priority: 1,
    },
  ]
  
  return plans
}

const generateMockVouchers = (): Voucher[] => {
  const vouchers: Voucher[] = []
  const statuses: Voucher["status"][] = ["available", "used", "expired"]
  
  for (let i = 0; i < 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    vouchers.push({
      id: `V-${1000 + i}`,
      code: `NET${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      planId: "HP-001",
      planName: "Daily Surf",
      status,
      createdAt: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
      usedAt: status === "used" ? new Date().toISOString() : undefined,
      usedBy: status === "used" ? `User ${Math.floor(Math.random() * 100)}` : undefined,
      expiresAt: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      batchId: `BATCH-${Math.floor(i / 10) + 1}`,
    })
  }
  
  return vouchers
}

const generateMockBatches = (): VoucherBatch[] => {
  return [
    { id: "BATCH-1", planId: "HP-001", planName: "Daily Surf", quantity: 100, available: 45, used: 50, expired: 5, createdAt: "2024-06-01" },
    { id: "BATCH-2", planId: "HP-002", planName: "Weekly Unlimited", quantity: 50, available: 30, used: 18, expired: 2, createdAt: "2024-06-10" },
    { id: "BATCH-3", planId: "HP-003", planName: "Monthly Value", quantity: 25, available: 20, used: 5, expired: 0, createdAt: "2024-06-15" },
  ]
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [batches, setBatches] = useState<VoucherBatch[]>([])
  const [activeTab, setActiveTab] = useState("hotspot")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddPlanDialog, setShowAddPlanDialog] = useState(false)
  const [showGenerateVoucherDialog, setShowGenerateVoucherDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // New plan form state
  const [newPlan, setNewPlan] = useState({
    name: "",
    type: "hotspot" as PlanType,
    speedDown: 10,
    speedUp: 5,
    duration: 30,
    durationType: "monthly" as DurationType,
    price: 1000,
    dataLimit: null as number | null,
    description: "",
    features: [] as string[],
  })

  // Voucher generation state
  const [voucherForm, setVoucherForm] = useState({
    planId: "",
    quantity: 10,
    expiryDays: 30,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      await new Promise(resolve => setTimeout(resolve, 600))
      setPlans(generateMockPlans())
      setVouchers(generateMockVouchers())
      setBatches(generateMockBatches())
    } catch (err) {
      setError("Failed to load plans. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // Calculate stats
  const stats: PlanStats = useMemo(() => {
    return {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === "active").length,
      totalSubscribers: plans.reduce((acc, p) => acc + p.subscribers, 0),
      monthlyRevenue: plans.reduce((acc, p) => acc + p.revenue, 0),
      hotspotPlans: plans.filter(p => p.type === "hotspot").length,
      pppoePlans: plans.filter(p => p.type === "pppoe").length,
      staticPlans: plans.filter(p => p.type === "static").length,
      voucherBatches: batches.length,
    }
  }, [plans, batches])

  // Filter plans by tab
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      if (activeTab === "vouchers") return false
      const matchesType = 
        activeTab === "all" || plan.type === activeTab
      const matchesSearch = 
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [plans, activeTab, searchQuery])

  const getTypeBadge = (type: PlanType) => {
    const config = {
      hotspot: { icon: Wifi, class: "bg-blue-100 text-blue-700 border-blue-200", label: "Hotspot" },
      pppoe: { icon: Globe, class: "bg-purple-100 text-purple-700 border-purple-200", label: "PPPoE" },
      static: { icon: Server, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Static IP" },
    }
    const Icon = config[type].icon
    return (
      <Badge variant="outline" className={config[type].class}>
        <Icon className="w-3 h-3 mr-1" />
        {config[type].label}
      </Badge>
    )
  }

  const formatDuration = (duration: number, type: DurationType) => {
    const labels = {
      hourly: duration === 1 ? "Hour" : "Hours",
      daily: duration === 1 ? "Day" : "Days",
      weekly: duration === 1 ? "Week" : "Weeks",
      monthly: duration === 1 ? "Month" : "Months",
      quarterly: duration === 1 ? "Quarter" : "Quarters",
      yearly: duration === 1 ? "Year" : "Years",
    }
    return `${duration} ${labels[type]}`
  }

  const handleTogglePlanStatus = (planId: string) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p
    ))
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Plans Management</h1>
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
          <h1 className="text-3xl font-bold text-slate-900">Plans Management</h1>
          <p className="text-slate-500 mt-1">Manage Internet plans, pricing, and vouchers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showAddPlanDialog} onOpenChange={setShowAddPlanDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
                <DialogDescription>Configure a new internet plan</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input 
                    placeholder="e.g., Home Basic" 
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan Type</Label>
                  <Select 
                    value={newPlan.type} 
                    onValueChange={(v) => setNewPlan({...newPlan, type: v as PlanType})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotspot">Hotspot</SelectItem>
                      <SelectItem value="pppoe">PPPoE</SelectItem>
                      <SelectItem value="static">Static IP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Download Speed (Mbps)</Label>
                  <Input 
                    type="number" 
                    value={newPlan.speedDown}
                    onChange={(e) => setNewPlan({...newPlan, speedDown: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Speed (Mbps)</Label>
                  <Input 
                    type="number" 
                    value={newPlan.speedUp}
                    onChange={(e) => setNewPlan({...newPlan, speedUp: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input 
                    type="number" 
                    value={newPlan.duration}
                    onChange={(e) => setNewPlan({...newPlan, duration: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration Type</Label>
                  <Select 
                    value={newPlan.durationType} 
                    onValueChange={(v) => setNewPlan({...newPlan, durationType: v as DurationType})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (KES)</Label>
                  <Input 
                    type="number" 
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({...newPlan, price: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Limit (GB, 0 = Unlimited)</Label>
                  <Input 
                    type="number" 
                    placeholder="0 for unlimited"
                    onChange={(e) => setNewPlan({...newPlan, dataLimit: parseInt(e.target.value) || null})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Plan description..."
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPlanDialog(false)}>Cancel</Button>
                <Button>Create Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPlans}</p>
                <p className="text-xs text-slate-500">Total Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.activePlans}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSubscribers.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">KES {(stats.monthlyRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("hotspot")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.hotspotPlans}</p>
                <p className="text-xs text-slate-500">Hotspot</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("pppoe")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.pppoePlans}</p>
                <p className="text-xs text-slate-500">PPPoE</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("static")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Server className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.staticPlans}</p>
                <p className="text-xs text-slate-500">Static IP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("vouchers")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Ticket className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.voucherBatches}</p>
                <p className="text-xs text-slate-500">Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="hotspot" className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">Hotspot Plans</span>
          </TabsTrigger>
          <TabsTrigger value="pppoe" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">PPPoE Plans</span>
          </TabsTrigger>
          <TabsTrigger value="static" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">Static IP</span>
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            <span className="hidden sm:inline">Vouchers</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">All Plans</span>
          </TabsTrigger>
        </TabsList>

        {/* Plans Content */}
        <TabsContent value={activeTab} className="mt-6">
          {activeTab !== "vouchers" ? (
            <>
              {/* Search */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Search plans..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Plans Grid */}
              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-80" />
                  ))}
                </div>
              ) : filteredPlans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 font-medium">No plans found</p>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your search or create a new plan</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlans.map(plan => (
                    <Card key={plan.id} className={`relative ${plan.isPopular ? "ring-2 ring-blue-500" : ""}`}>
                      {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-blue-500 text-white">
                            <Zap className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              {getTypeBadge(plan.type)}
                              <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                                {plan.status}
                              </Badge>
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleTogglePlanStatus(plan.id)}>
                                {plan.status === "active" ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center py-4 bg-slate-50 rounded-lg">
                          <p className="text-4xl font-bold text-slate-900">
                            KES {plan.price.toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDuration(plan.duration, plan.durationType)}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span>{plan.speedDown} Mbps ↓</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500 rotate-180" />
                            <span>{plan.speedUp} Mbps ↑</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 3 && (
                            <p className="text-xs text-slate-500 pl-6">
                              +{plan.features.length - 3} more features
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <div className="flex w-full justify-between text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {plan.subscribers} users
                          </span>
                          <span className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-4 h-4" />
                            KES {(plan.revenue / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Vouchers Tab Content */
            <div className="space-y-6">
              {/* Voucher Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search vouchers..." className="pl-9" />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Dialog open={showGenerateVoucherDialog} onOpenChange={setShowGenerateVoucherDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Generate Vouchers
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Generate Vouchers</DialogTitle>
                            <DialogDescription>Create a batch of voucher codes</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Select Plan</Label>
                              <Select onValueChange={(v) => setVoucherForm({...voucherForm, planId: v})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.filter(p => p.type === "hotspot").map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} - KES {plan.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Quantity</Label>
                              <Input 
                                type="number" 
                                value={voucherForm.quantity}
                                onChange={(e) => setVoucherForm({...voucherForm, quantity: parseInt(e.target.value)})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Expiry (Days)</Label>
                              <Input 
                                type="number" 
                                value={voucherForm.expiryDays}
                                onChange={(e) => setVoucherForm({...voucherForm, expiryDays: parseInt(e.target.value)})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowGenerateVoucherDialog(false)}>Cancel</Button>
                            <Button>Generate {voucherForm.quantity} Vouchers</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Voucher Batches */}
              <Card>
                <CardHeader>
                  <CardTitle>Voucher Batches</CardTitle>
                  <CardDescription>Manage generated voucher batches</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch ID</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Used</TableHead>
                        <TableHead>Expired</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map(batch => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-mono text-sm">{batch.id}</TableCell>
                          <TableCell>{batch.planName}</TableCell>
                          <TableCell>{batch.quantity}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              {batch.available}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              {batch.used}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100 text-red-700">
                              {batch.expired}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={(batch.used / batch.quantity) * 100} className="h-2 w-20" />
                              <span className="text-xs text-slate-500">
                                {Math.round((batch.used / batch.quantity) * 100)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{batch.createdAt}</TableCell>
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
                                  View Codes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Printer className="w-4 h-4 mr-2" />
                                  Print Batch
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Export CSV
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Batch
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

              {/* Recent Vouchers */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Vouchers</CardTitle>
                  <CardDescription>Latest voucher activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Used By</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.slice(0, 10).map(voucher => (
                        <TableRow key={voucher.id}>
                          <TableCell className="font-mono font-medium">{voucher.code}</TableCell>
                          <TableCell>{voucher.planName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              voucher.status === "available" ? "bg-green-100 text-green-700 border-green-200" :
                              voucher.status === "used" ? "bg-blue-100 text-blue-700 border-blue-200" :
                              "bg-red-100 text-red-700 border-red-200"
                            }>
                              {voucher.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(voucher.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {voucher.usedBy || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(voucher.expiresAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
