"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Package,
  Plus,
  Edit,
  Check,
  Zap,
  Loader2,
  Wifi,
  Globe,
  Server,
  Search,
  MoreVertical,
  RefreshCw,
  Users,
  TrendingUp,
  Pause,
  Play,
  Eye,
  CreditCard,
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Plan, PlanType } from "@/lib/types"

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num || 0)
}

const getTypeBadge = (type: PlanType) => {
  const config: Record<string, { icon: typeof Wifi; class: string; label: string }> = {
    INTERNET: { icon: Globe, class: "bg-green-100 text-green-700 border-green-200", label: "Internet" },
    ADDON: { icon: Package, class: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Add-on" },
    BUNDLE: { icon: Package, class: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Bundle" },
    TOPUP: { icon: CreditCard, class: "bg-pink-100 text-pink-700 border-pink-200", label: "Top-up" },
    HOTSPOT: { icon: Wifi, class: "bg-blue-100 text-blue-700 border-blue-200", label: "Hotspot" },
    PPPOE: { icon: Globe, class: "bg-purple-100 text-purple-700 border-purple-200", label: "PPPoE" },
    STATIC: { icon: Server, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Static IP" },
  }
  const c = config[type] || { icon: Globe, class: "bg-gray-100 text-gray-700 border-gray-200", label: type }
  const Icon = c.icon
  return (
    <Badge variant="outline" className={c.class}>
      <Icon className="w-3 h-3 mr-1" />
      {c.label}
    </Badge>
  )
}

const formatDuration = (days: number) => {
  if (days === 1) return "Daily"
  if (days === 7) return "Weekly"
  if (days === 30) return "Monthly"
  if (days === 90) return "Quarterly"
  if (days === 365) return "Yearly"
  return `${days} Days`
}

export default function PlansPage() {
  // Data states
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Filter states
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // UI states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Form state
  const [planForm, setPlanForm] = useState({
    name: '',
    plan_type: 'PPPOE' as PlanType,
    description: '',
    download_speed: '',
    upload_speed: '',
    data_limit: '',
    validity_days: '30',
    price: '',
    setup_fee: '',
    is_active: true,
    is_popular: false,
    features: '',
  })

  // Fetch data
  const fetchPlans = useCallback(async () => {
    try {
      const params: Record<string, string> = { ordering: '-created_at' }
      if (activeTab !== 'all') {
        params.plan_type = activeTab.toUpperCase()
      }

      const response = await adminApi.getPlans(params)
      setPlans(response.results || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load plans')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPlans()
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Filter plans by search
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [plans, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter(p => p.is_active).length,
    hotspot: plans.filter(p => p.plan_type === 'HOTSPOT').length,
    pppoe: plans.filter(p => p.plan_type === 'PPPOE').length,
    static: plans.filter(p => p.plan_type === 'STATIC').length,
    subscribers: plans.reduce((sum, p) => sum + (p.subscriber_count || 0), 0),
  }), [plans])

  // Reset form
  const resetForm = () => {
    setPlanForm({
      name: '',
      plan_type: 'PPPOE',
      description: '',
      download_speed: '',
      upload_speed: '',
      data_limit: '',
      validity_days: '30',
      price: '',
      setup_fee: '',
      is_active: true,
      is_popular: false,
      features: '',
    })
  }

  // Create plan
  const handleCreate = async () => {
    if (!planForm.name || !planForm.price) {
      toast.error('Name and price are required')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.createPlan({
        name: planForm.name,
        plan_type: planForm.plan_type,
        description: planForm.description || undefined,
        download_speed: planForm.download_speed ? parseInt(planForm.download_speed) : undefined,
        upload_speed: planForm.upload_speed ? parseInt(planForm.upload_speed) : undefined,
        data_limit: planForm.data_limit ? parseInt(planForm.data_limit) : undefined,
        validity_days: parseInt(planForm.validity_days),
        price: planForm.price,
        setup_fee: planForm.setup_fee || undefined,
        is_active: planForm.is_active,
        is_popular: planForm.is_popular,
        features: planForm.features ? planForm.features.split('\n').filter(f => f.trim()) : undefined,
      })
      toast.success('Plan created successfully')
      setIsCreateOpen(false)
      resetForm()
      fetchPlans()
    } catch (error: any) {
      console.error('Failed to create plan:', error)
      toast.error(error.message || 'Failed to create plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit plan
  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan)
    setPlanForm({
      name: plan.name,
      plan_type: plan.plan_type,
      description: plan.description || '',
      download_speed: plan.download_speed?.toString() || '',
      upload_speed: plan.upload_speed?.toString() || '',
      data_limit: plan.data_limit?.toString() || '',
      validity_days: plan.validity_days?.toString() || '30',
      price: plan.price?.toString() || '',
      setup_fee: plan.setup_fee?.toString() || '',
      is_active: plan.is_active,
      is_popular: plan.is_popular || false,
      features: plan.features?.join('\n') || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedPlan) return

    setIsSubmitting(true)
    try {
      await adminApi.updatePlan(selectedPlan.id, {
        name: planForm.name,
        plan_type: planForm.plan_type,
        description: planForm.description || undefined,
        download_speed: planForm.download_speed ? parseInt(planForm.download_speed) : undefined,
        upload_speed: planForm.upload_speed ? parseInt(planForm.upload_speed) : undefined,
        data_limit: planForm.data_limit ? parseInt(planForm.data_limit) : undefined,
        validity_days: parseInt(planForm.validity_days),
        price: planForm.price,
        setup_fee: planForm.setup_fee || undefined,
        is_active: planForm.is_active,
        is_popular: planForm.is_popular,
        features: planForm.features ? planForm.features.split('\n').filter(f => f.trim()) : undefined,
      })
      toast.success('Plan updated successfully')
      setIsEditOpen(false)
      resetForm()
      fetchPlans()
    } catch (error: any) {
      console.error('Failed to update plan:', error)
      toast.error(error.message || 'Failed to update plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async (plan: Plan) => {
    setTogglingId(plan.id)
    try {
      await adminApi.togglePlanActive(plan.id)
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`)
      fetchPlans()
    } catch (error: any) {
      console.error('Failed to toggle plan:', error)
      toast.error(error.message || 'Failed to toggle plan status')
    } finally {
      setTogglingId(null)
    }
  }

  // View details
  const handleViewDetails = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsDetailOpen(true)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plans Management</h1>
          <p className="text-muted-foreground">
            Manage internet plans, pricing, and features
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Plans</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
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
                <p className="text-2xl font-bold text-blue-600">{stats.subscribers}</p>
                <p className="text-xs text-muted-foreground">Subscribers</p>
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
                <p className="text-2xl font-bold text-blue-600">{stats.hotspot}</p>
                <p className="text-xs text-muted-foreground">Hotspot</p>
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
                <p className="text-2xl font-bold text-purple-600">{stats.pppoe}</p>
                <p className="text-xs text-muted-foreground">PPPoE</p>
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
                <p className="text-2xl font-bold text-orange-600">{stats.static}</p>
                <p className="text-xs text-muted-foreground">Static IP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Plans</TabsTrigger>
            <TabsTrigger value="hotspot">Hotspot</TabsTrigger>
            <TabsTrigger value="pppoe">PPPoE</TabsTrigger>
            <TabsTrigger value="static">Static IP</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium">No plans found</p>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or create a new plan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <Card key={plan.id} className={`relative ${plan.is_popular ? "ring-2 ring-blue-500" : ""}`}>
              {plan.is_popular && (
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
                      {getTypeBadge(plan.plan_type)}
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
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
                      <DropdownMenuItem onClick={() => handleViewDetails(plan)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleActive(plan)}
                        disabled={togglingId === plan.id}
                      >
                        {togglingId === plan.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : plan.is_active ? (
                          <Pause className="w-4 h-4 mr-2" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        {plan.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">
                    {formatCurrency(plan.price ?? plan.base_price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(plan.validity_days ?? plan.duration_days ?? 30)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {plan.download_speed && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>{plan.download_speed} Mbps ↓</span>
                    </div>
                  )}
                  {plan.upload_speed && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500 rotate-180" />
                      <span>{plan.upload_speed} Mbps ↑</span>
                    </div>
                  )}
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-2">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        +{plan.features.length - 3} more features
                      </p>
                    )}
                  </div>
                )}

                {plan.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {plan.subscriber_count || 0} subscribers
                  </span>
                  {plan.data_limit && (
                    <span>{plan.data_limit} GB limit</span>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>Configure a new internet plan</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name *</Label>
              <Input
                placeholder="e.g., Home Basic"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Plan Type *</Label>
              <Select
                value={planForm.plan_type}
                onValueChange={(v) => setPlanForm({ ...planForm, plan_type: v as PlanType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                  <SelectItem value="PPPOE">PPPoE</SelectItem>
                  <SelectItem value="STATIC">Static IP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Download Speed (Mbps)</Label>
              <Input
                type="number"
                placeholder="e.g., 20"
                value={planForm.download_speed}
                onChange={(e) => setPlanForm({ ...planForm, download_speed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Speed (Mbps)</Label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={planForm.upload_speed}
                onChange={(e) => setPlanForm({ ...planForm, upload_speed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Limit (GB, leave empty for unlimited)</Label>
              <Input
                type="number"
                placeholder="e.g., 100"
                value={planForm.data_limit}
                onChange={(e) => setPlanForm({ ...planForm, data_limit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Validity (Days) *</Label>
              <Select
                value={planForm.validity_days}
                onValueChange={(v) => setPlanForm({ ...planForm, validity_days: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">7 Days (Weekly)</SelectItem>
                  <SelectItem value="30">30 Days (Monthly)</SelectItem>
                  <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                  <SelectItem value="365">365 Days (Yearly)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (KES) *</Label>
              <Input
                type="number"
                placeholder="e.g., 2500"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Setup Fee (KES)</Label>
              <Input
                type="number"
                placeholder="e.g., 500"
                value={planForm.setup_fee}
                onChange={(e) => setPlanForm({ ...planForm, setup_fee: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Plan description..."
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea
                placeholder="Unlimited Data&#10;24/7 Support&#10;Static IP Option"
                value={planForm.features}
                onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.is_active}
                  onCheckedChange={(c) => setPlanForm({ ...planForm, is_active: c })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.is_popular}
                  onCheckedChange={(c) => setPlanForm({ ...planForm, is_popular: c })}
                />
                <Label>Popular</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name *</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Plan Type *</Label>
              <Select
                value={planForm.plan_type}
                onValueChange={(v) => setPlanForm({ ...planForm, plan_type: v as PlanType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                  <SelectItem value="PPPOE">PPPoE</SelectItem>
                  <SelectItem value="STATIC">Static IP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Download Speed (Mbps)</Label>
              <Input
                type="number"
                value={planForm.download_speed}
                onChange={(e) => setPlanForm({ ...planForm, download_speed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Speed (Mbps)</Label>
              <Input
                type="number"
                value={planForm.upload_speed}
                onChange={(e) => setPlanForm({ ...planForm, upload_speed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Limit (GB)</Label>
              <Input
                type="number"
                value={planForm.data_limit}
                onChange={(e) => setPlanForm({ ...planForm, data_limit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Validity (Days) *</Label>
              <Select
                value={planForm.validity_days}
                onValueChange={(v) => setPlanForm({ ...planForm, validity_days: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">7 Days (Weekly)</SelectItem>
                  <SelectItem value="30">30 Days (Monthly)</SelectItem>
                  <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                  <SelectItem value="365">365 Days (Yearly)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (KES) *</Label>
              <Input
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Setup Fee (KES)</Label>
              <Input
                type="number"
                value={planForm.setup_fee}
                onChange={(e) => setPlanForm({ ...planForm, setup_fee: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea
                value={planForm.features}
                onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.is_active}
                  onCheckedChange={(c) => setPlanForm({ ...planForm, is_active: c })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.is_popular}
                  onCheckedChange={(c) => setPlanForm({ ...planForm, is_popular: c })}
                />
                <Label>Popular</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Details Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Plan Details</SheetTitle>
            <SheetDescription>{selectedPlan?.name}</SheetDescription>
          </SheetHeader>
          {selectedPlan && (
            <div className="mt-6 space-y-6">
              <div className="flex gap-2">
                {getTypeBadge(selectedPlan.plan_type)}
                <Badge variant={selectedPlan.is_active ? "default" : "secondary"}>
                  {selectedPlan.is_active ? "Active" : "Inactive"}
                </Badge>
                {selectedPlan.is_popular && (
                  <Badge className="bg-blue-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>

              <div className="text-center py-6 bg-muted rounded-lg">
                <p className="text-4xl font-bold">{formatCurrency(selectedPlan.price ?? selectedPlan.base_price)}</p>
                <p className="text-muted-foreground">{formatDuration(selectedPlan.validity_days ?? selectedPlan.duration_days ?? 30)}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedPlan.download_speed && (
                  <div>
                    <p className="text-muted-foreground">Download Speed</p>
                    <p className="font-medium">{selectedPlan.download_speed} Mbps</p>
                  </div>
                )}
                {selectedPlan.upload_speed && (
                  <div>
                    <p className="text-muted-foreground">Upload Speed</p>
                    <p className="font-medium">{selectedPlan.upload_speed} Mbps</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Data Limit</p>
                  <p className="font-medium">{selectedPlan.data_limit ? `${selectedPlan.data_limit} GB` : 'Unlimited'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subscribers</p>
                  <p className="font-medium">{selectedPlan.subscriber_count || 0}</p>
                </div>
                {selectedPlan.setup_fee && (
                  <div>
                    <p className="text-muted-foreground">Setup Fee</p>
                    <p className="font-medium">{formatCurrency(selectedPlan.setup_fee)}</p>
                  </div>
                )}
              </div>

              {selectedPlan.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Description</p>
                    <p>{selectedPlan.description}</p>
                  </div>
                </>
              )}

              {selectedPlan.features && selectedPlan.features.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-3">Features</p>
                    <div className="space-y-2">
                      {selectedPlan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  setIsDetailOpen(false)
                  openEditDialog(selectedPlan)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleToggleActive(selectedPlan)}
                  disabled={togglingId === selectedPlan.id}
                >
                  {togglingId === selectedPlan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedPlan.is_active ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
