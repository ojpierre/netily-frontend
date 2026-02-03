"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Wifi,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Settings,
  Eye,
  Copy,
  ExternalLink,
  Download,
  Palette,
  Server,
  Loader2,
  Search,
  Zap,
  Globe,
  DollarSign,
  Timer,
  Signal,
  Smartphone,
  QrCode,
  Code,
  FileCode,
  Play,
  Pause,
  Image,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Link2,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Router, HotspotPlan, HotspotSession, HotspotBranding } from "@/lib/types"

// ========================================
// TYPES
// ========================================

interface HotspotRouter extends Router {
  hotspot_enabled?: boolean
  hotspot_plans_count?: number
  active_sessions?: number
  total_revenue?: number
  radius_secret?: string
}

interface HotspotStats {
  total_routers: number
  hotspot_enabled: number
  total_plans: number
  active_sessions: number
  today_revenue: number
  today_sessions: number
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''}`
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return `${days}d ${hours > 0 ? `${hours}h` : ''}`
}

function formatBytes(mb: number | null): string {
  if (!mb) return "Unlimited"
  if (mb < 1024) return `${mb} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function HotspotManagementPage() {
  // State
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [routers, setRouters] = useState<HotspotRouter[]>([])
  const [selectedRouter, setSelectedRouter] = useState<HotspotRouter | null>(null)
  const [plans, setPlans] = useState<HotspotPlan[]>([])
  const [sessions, setSessions] = useState<HotspotSession[]>([])
  const [branding, setBranding] = useState<HotspotBranding | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState<HotspotStats>({
    total_routers: 0,
    hotspot_enabled: 0,
    total_plans: 0,
    active_sessions: 0,
    today_revenue: 0,
    today_sessions: 0,
  })

  // Dialogs
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showBrandingDialog, setShowBrandingDialog] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [showMikroTikConfig, setShowMikroTikConfig] = useState(false)
  const [editingPlan, setEditingPlan] = useState<HotspotPlan | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Plan Form
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    duration_minutes: "60",
    data_limit_mb: "",
    speed_limit_mbps: "5", // Speed choice: 1, 2, 5, 10, 15, 20, 50, 100
    is_active: true,
    is_popular: false,
    sort_order: 0,
  })

  // Branding Form
  const [brandingForm, setBrandingForm] = useState({
    company_name: "",
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    welcome_title: "Welcome to WiFi",
    welcome_message: "Select a plan to get started",
    support_phone: "",
    support_email: "",
  })

  // Setup Wizard State
  const [wizardStep, setWizardStep] = useState(1)

  // ========================================
  // DATA FETCHING
  // ========================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch routers
      const routersRes = await adminApi.getRouters().catch(() => ({ results: [] }))
      const routersList = routersRes.results || []
      setRouters(routersList)
      
      // Calculate stats
      setStats({
        total_routers: routersList.length,
        hotspot_enabled: routersList.filter((r: HotspotRouter) => r.hotspot_enabled).length,
        total_plans: 0, // Will be updated when router is selected
        active_sessions: 0,
        today_revenue: 0,
        today_sessions: 0,
      })
      
      // Auto-select first router if available
      if (routersList.length > 0 && !selectedRouter) {
        handleSelectRouter(routersList[0])
      }
    } catch (error) {
      console.error("Failed to fetch hotspot data:", error)
      toast.error("Failed to load hotspot data")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectRouter = async (router: HotspotRouter) => {
    setSelectedRouter(router)
    
    try {
      // Fetch plans for this router
      // API might return array or { plans: [...] } object
      const plansResponse = await adminApi.getHotspotPlans(router.id).catch(() => [])
      // Handle both cases: direct array or object with plans property
      const plansData = Array.isArray(plansResponse) 
        ? plansResponse 
        : (plansResponse as any)?.plans || []
      setPlans(plansData)
      
      // Fetch sessions
      const sessionsData = await adminApi.getHotspotSessions(router.id).catch(() => ({ results: [] }))
      setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData.results || [])
      
      // Fetch branding
      const brandingData = await adminApi.getHotspotBranding(router.id)
      setBranding(brandingData)
      
      if (brandingData) {
        setBrandingForm({
          company_name: brandingData.company_name || "",
          primary_color: brandingData.primary_color || "#3B82F6",
          secondary_color: brandingData.secondary_color || "#1E40AF",
          welcome_title: brandingData.welcome_title || "Welcome to WiFi",
          welcome_message: brandingData.welcome_message || "Select a plan to get started",
          support_phone: brandingData.support_phone || "",
          support_email: brandingData.support_email || "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch router details:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ========================================
  // PLAN CRUD
  // ========================================

  const handleOpenPlanDialog = (plan?: HotspotPlan) => {
    if (plan) {
      setEditingPlan(plan)
      setPlanForm({
        name: plan.name,
        price: String(plan.price),
        duration_minutes: String(plan.duration_minutes || 60),
        data_limit_mb: plan.data_limit_mb ? String(plan.data_limit_mb) : "",
        speed_limit_mbps: plan.speed_limit_mbps || "5",
        is_active: plan.is_active,
        is_popular: plan.is_popular || false,
        sort_order: plan.sort_order || 0,
      })
    } else {
      setEditingPlan(null)
      setPlanForm({
        name: "",
        price: "",
        duration_minutes: "60",
        data_limit_mb: "",
        speed_limit_mbps: "5",
        is_active: true,
        is_popular: false,
        sort_order: 0,
      })
    }
    setShowPlanDialog(true)
  }

  const handleSavePlan = async () => {
    if (!selectedRouter) {
      toast.error("Please select a router first")
      return
    }
    
    if (!planForm.name || !planForm.price || !planForm.duration_minutes) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setFormLoading(true)
      
      const planData: Partial<HotspotPlan> = {
        name: planForm.name,
        price: planForm.price,
        duration_minutes: parseInt(planForm.duration_minutes),
        data_limit_mb: planForm.data_limit_mb ? parseInt(planForm.data_limit_mb) : null,
        speed_limit_mbps: planForm.speed_limit_mbps,
        is_active: planForm.is_active,
        is_popular: planForm.is_popular,
        sort_order: planForm.sort_order,
      }

      if (editingPlan) {
        await adminApi.updateHotspotPlan(selectedRouter.id, editingPlan.id, planData)
        toast.success("Plan updated successfully")
      } else {
        await adminApi.createHotspotPlan(selectedRouter.id, planData)
        toast.success("Plan created successfully")
      }

      setShowPlanDialog(false)
      handleSelectRouter(selectedRouter) // Refresh plans
    } catch (error: any) {
      toast.error(error.message || "Failed to save plan")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeletePlan = async (plan: HotspotPlan) => {
    if (!selectedRouter) return
    
    if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      return
    }

    try {
      await adminApi.deleteHotspotPlan(selectedRouter.id, plan.id)
      toast.success("Plan deleted successfully")
      handleSelectRouter(selectedRouter)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete plan")
    }
  }

  // ========================================
  // BRANDING
  // ========================================

  const handleSaveBranding = async () => {
    if (!selectedRouter) {
      toast.error("Please select a router first")
      return
    }

    try {
      setFormLoading(true)
      await adminApi.updateHotspotBranding(selectedRouter.id, brandingForm)
      toast.success("Branding updated successfully")
      setShowBrandingDialog(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save branding")
    } finally {
      setFormLoading(false)
    }
  }

  // ========================================
  // MIKROTIK CONFIG GENERATION
  // ========================================

  const generateMikroTikConfig = (): string => {
    if (!selectedRouter) return ""
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const tenantSubdomain = "your-tenant" // This should come from tenant context
    
    return `# ============================================
# NETILY HOTSPOT CONFIGURATION
# Router: ${selectedRouter.name}
# Generated: ${new Date().toISOString()}
# ============================================

# Step 1: Create Hotspot Server Profile
/ip hotspot profile
add name="netily-profile" \\
    hotspot-address=${selectedRouter.ip_address} \\
    html-directory=hotspot \\
    login-by=http-pap \\
    http-cookie-lifetime=1d \\
    split-user-domain=no \\
    use-radius=yes

# Step 2: Configure RADIUS
/radius
add address=${process.env.NEXT_PUBLIC_RADIUS_IP || "your-radius-server"} \\
    secret="${selectedRouter.radius_secret || "your-radius-secret"}" \\
    service=hotspot \\
    timeout=3s

/ip hotspot profile set netily-profile radius-accounting=yes

# Step 3: Create Hotspot Server (adjust interface as needed)
/ip hotspot
add name="netily-hotspot" \\
    interface=bridge-hotspot \\
    profile=netily-profile \\
    address-pool=hotspot-pool \\
    disabled=no

# Step 4: Configure Walled Garden (allow access to payment page)
/ip hotspot walled-garden ip
add dst-host=${baseUrl.replace('https://', '').replace('http://', '')} action=accept
add dst-host=*.mpesa.safaricom.co.ke action=accept
add dst-host=*.payhero.co.ke action=accept

# Step 5: Set Login Page Redirect
# Upload this HTML to your router's hotspot directory
# The login page will redirect to: ${baseUrl}/hotspot/${selectedRouter.id}

# Step 6: Create login.html redirect (copy this to router)
# ==========================================
# File: /hotspot/login.html
# ==========================================
# <!DOCTYPE html>
# <html>
# <head>
#     <meta http-equiv="refresh" content="0;url=${baseUrl}/hotspot/${selectedRouter.id}?mac=$(mac)&ip=$(ip)&router=${selectedRouter.id}">
# </head>
# <body>
#     <p>Redirecting to payment portal...</p>
# </body>
# </html>

# ============================================
# DHCP Pool (if not already configured)
# ============================================
/ip pool
add name=hotspot-pool ranges=10.10.0.2-10.10.0.254

/ip dhcp-server
add name=dhcp-hotspot \\
    address-pool=hotspot-pool \\
    interface=bridge-hotspot \\
    lease-time=1h

/ip address
add address=10.10.0.1/24 interface=bridge-hotspot

# ============================================
# DONE! Test by connecting to the hotspot WiFi
# ============================================
`
  }

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(generateMikroTikConfig())
    toast.success("Configuration copied to clipboard")
  }

  const handleDownloadConfig = () => {
    const config = generateMikroTikConfig()
    const blob = new Blob([config], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hotspot-config-${selectedRouter?.name || "router"}.rsc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Configuration downloaded")
  }

  // ========================================
  // RENDER: LOADING STATE
  // ========================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // ========================================
  // RENDER: MAIN
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wifi className="w-8 h-8 text-blue-600" />
            Hotspot Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure captive portals and manage hotspot plans for your routers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowSetupWizard(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Setup New Hotspot
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_routers}</p>
                <p className="text-xs text-muted-foreground">Total Routers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.hotspot_enabled}</p>
                <p className="text-xs text-muted-foreground">Hotspot Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{sessions.length}</p>
                <p className="text-xs text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.today_revenue)}</p>
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Router Selection + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Router Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Routers</CardTitle>
            <CardDescription>Select a router to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search routers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {routers
                .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((router) => (
                  <div
                    key={router.id}
                    onClick={() => handleSelectRouter(router)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRouter?.id === router.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-sm">{router.name}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={router.status === "online" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {router.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {router.location || router.ip_address}
                    </p>
                  </div>
                ))}
              
              {routers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No routers found</p>
                  <p className="text-xs">Add routers in the Routers page</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedRouter ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="w-5 h-5" />
                      {selectedRouter.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedRouter.location || selectedRouter.ip_address}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowMikroTikConfig(true)}>
                      <Code className="w-4 h-4 mr-2" />
                      MikroTik Config
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowBrandingDialog(true)}>
                      <Palette className="w-4 h-4 mr-2" />
                      Branding
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Plans ({plans.length})
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Sessions ({sessions.length})
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-blue-600">{plans.length}</p>
                          <p className="text-sm text-muted-foreground">Active Plans</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-green-600">{sessions.length}</p>
                          <p className="text-sm text-muted-foreground">Active Sessions</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-purple-600">0</p>
                          <p className="text-sm text-muted-foreground">Today's Purchases</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-amber-600">KES 0</p>
                          <p className="text-sm text-muted-foreground">Today's Revenue</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Setup Guide */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          Quick Setup Checklist
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              plans.length > 0 ? "bg-green-500" : "bg-slate-300"
                            }`}>
                              {plans.length > 0 ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : (
                                <span className="text-white text-xs">1</span>
                              )}
                            </div>
                            <span className={plans.length > 0 ? "text-green-700" : ""}>
                              Create hotspot plans
                            </span>
                            {plans.length === 0 && (
                              <Button size="sm" variant="outline" onClick={() => handleOpenPlanDialog()}>
                                <Plus className="w-3 h-3 mr-1" />
                                Add Plan
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              branding ? "bg-green-500" : "bg-slate-300"
                            }`}>
                              {branding ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : (
                                <span className="text-white text-xs">2</span>
                              )}
                            </div>
                            <span className={branding ? "text-green-700" : ""}>
                              Customize branding
                            </span>
                            {!branding && (
                              <Button size="sm" variant="outline" onClick={() => setShowBrandingDialog(true)}>
                                <Palette className="w-3 h-3 mr-1" />
                                Setup
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-300">
                              <span className="text-white text-xs">3</span>
                            </div>
                            <span>Configure MikroTik router</span>
                            <Button size="sm" variant="outline" onClick={() => setShowMikroTikConfig(true)}>
                              <Code className="w-3 h-3 mr-1" />
                              Get Config
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-300">
                              <span className="text-white text-xs">4</span>
                            </div>
                            <span>Test the captive portal</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/hotspot/${selectedRouter.id}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Plans Tab */}
                  <TabsContent value="plans" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Manage hotspot pricing plans for this router
                      </p>
                      <Button onClick={() => handleOpenPlanDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plan
                      </Button>
                    </div>

                    {plans.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plans.map((plan) => (
                          <Card key={plan.id} className="relative">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleOpenPlanDialog(plan)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleDeletePlan(plan)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="text-3xl font-bold text-blue-600">
                                {formatCurrency(parseFloat(plan.price))}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Timer className="w-4 h-4 text-slate-400" />
                                  {formatDuration(plan.duration_minutes || 0)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Signal className="w-4 h-4 text-slate-400" />
                                  {plan.speed_limit_mbps || 5} Mbps
                                </div>
                                <div className="flex items-center gap-2 col-span-2">
                                  <Globe className="w-4 h-4 text-slate-400" />
                                  Data: {formatBytes(plan.data_limit_mb || 0)}
                                </div>
                              </div>
                              {plan.is_popular && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                  Popular
                                </Badge>
                              )}
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Badge variant={plan.is_active ? "default" : "secondary"}>
                                {plan.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Zap className="w-12 h-12 text-slate-300 mb-4" />
                          <h3 className="font-semibold text-lg mb-2">No Plans Yet</h3>
                          <p className="text-muted-foreground text-center mb-4">
                            Create pricing plans that customers will see when connecting to this hotspot
                          </p>
                          <Button onClick={() => handleOpenPlanDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Plan
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Sessions Tab */}
                  <TabsContent value="sessions">
                    {sessions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Data Used</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{session.phone_number || session.mac_address}</p>
                                  <p className="text-xs text-muted-foreground">{session.access_code}</p>
                                </div>
                              </TableCell>
                              <TableCell>{session.plan_name || "Unknown"}</TableCell>
                              <TableCell>{session.activated_at ? new Date(session.activated_at).toLocaleString() : "-"}</TableCell>
                              <TableCell>{formatBytes(session.data_used_mb || 0)}</TableCell>
                              <TableCell>
                                <Badge variant={session.status === "active" ? "default" : "secondary"}>
                                  {session.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Disconnect
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <h3 className="font-semibold text-lg mb-2">No Active Sessions</h3>
                        <p className="text-sm">Sessions will appear here when users connect to the hotspot</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Preview Tab */}
                  <TabsContent value="preview">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Preview how your captive portal looks to customers
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => window.open(`/hotspot/${selectedRouter.id}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Full Preview
                        </Button>
                      </div>
                      
                      <div className="bg-slate-100 rounded-lg p-4">
                        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                          {/* Mock Phone Frame */}
                          <div 
                            className="p-6 text-center"
                            style={{ backgroundColor: branding?.primary_color || "#3B82F6" }}
                          >
                            <Wifi className="w-12 h-12 mx-auto mb-3 text-white" />
                            <h2 className="text-xl font-bold text-white">
                              {branding?.welcome_title || "Welcome to WiFi"}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                              {branding?.welcome_message || "Select a plan to get started"}
                            </p>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            {plans.slice(0, 3).map((plan) => (
                              <div 
                                key={plan.id}
                                className="p-3 border rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-semibold">{plan.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDuration(plan.duration_minutes || 0)} • {formatBytes(plan.data_limit_mb || 0)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-blue-600">{formatCurrency(parseFloat(plan.price))}</p>
                                </div>
                              </div>
                            ))}
                            
                            {plans.length === 0 && (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                Add plans to see preview
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center py-16">
              <div className="text-center">
                <Server className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold mb-2">Select a Router</h3>
                <p className="text-muted-foreground">
                  Choose a router from the sidebar to manage its hotspot settings
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create Hotspot Plan"}</DialogTitle>
            <DialogDescription>
              Configure pricing and limits for this hotspot plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name *</Label>
                <Input
                  placeholder="e.g., 1 Hour WiFi"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (KES) *</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes) *</Label>
                <Select
                  value={planForm.duration_minutes}
                  onValueChange={(v) => setPlanForm({ ...planForm, duration_minutes: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="360">6 hours</SelectItem>
                    <SelectItem value="720">12 hours</SelectItem>
                    <SelectItem value="1440">24 hours (1 day)</SelectItem>
                    <SelectItem value="4320">3 days</SelectItem>
                    <SelectItem value="10080">7 days</SelectItem>
                    <SelectItem value="43200">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Speed Limit (Mbps)</Label>
                <Select
                  value={planForm.speed_limit_mbps}
                  onValueChange={(v) => setPlanForm({ ...planForm, speed_limit_mbps: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Mbps</SelectItem>
                    <SelectItem value="2">2 Mbps</SelectItem>
                    <SelectItem value="5">5 Mbps</SelectItem>
                    <SelectItem value="10">10 Mbps</SelectItem>
                    <SelectItem value="15">15 Mbps</SelectItem>
                    <SelectItem value="20">20 Mbps</SelectItem>
                    <SelectItem value="50">50 Mbps</SelectItem>
                    <SelectItem value="100">100 Mbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Data Limit (MB)</Label>
              <Input
                type="number"
                placeholder="Leave empty for unlimited"
                value={planForm.data_limit_mb}
                onChange={(e) => setPlanForm({ ...planForm, data_limit_mb: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited data
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.is_popular}
                  onCheckedChange={(v) => setPlanForm({ ...planForm, is_popular: v })}
                />
                <Label>Mark as Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.is_active}
                  onCheckedChange={(v) => setPlanForm({ ...planForm, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Plan</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branding Dialog */}
      <Dialog open={showBrandingDialog} onOpenChange={setShowBrandingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customize Captive Portal</DialogTitle>
            <DialogDescription>
              Brand your hotspot login page with your company details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                placeholder="Your ISP Name"
                value={brandingForm.company_name}
                onChange={(e) => setBrandingForm({ ...brandingForm, company_name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={brandingForm.primary_color}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={brandingForm.primary_color}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={brandingForm.secondary_color}
                    onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={brandingForm.secondary_color}
                    onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Welcome Title</Label>
              <Input
                placeholder="Welcome to WiFi"
                value={brandingForm.welcome_title}
                onChange={(e) => setBrandingForm({ ...brandingForm, welcome_title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <Textarea
                placeholder="Select a plan to get started"
                value={brandingForm.welcome_message}
                onChange={(e) => setBrandingForm({ ...brandingForm, welcome_message: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Support Phone</Label>
                <Input
                  placeholder="+254 7XX XXX XXX"
                  value={brandingForm.support_phone}
                  onChange={(e) => setBrandingForm({ ...brandingForm, support_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  type="email"
                  placeholder="support@yourisp.com"
                  value={brandingForm.support_email}
                  onChange={(e) => setBrandingForm({ ...brandingForm, support_email: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrandingDialog(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranding} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Branding</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MikroTik Config Dialog */}
      <Dialog open={showMikroTikConfig} onOpenChange={setShowMikroTikConfig}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              MikroTik Configuration
            </DialogTitle>
            <DialogDescription>
              Copy and paste these commands into your MikroTik terminal to set up the captive portal
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-[400px] font-mono">
              {generateMikroTikConfig()}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDownloadConfig}>
              <Download className="w-4 h-4 mr-2" />
              Download .rsc
            </Button>
            <Button onClick={handleCopyConfig}>
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Wizard Dialog */}
      <Dialog open={showSetupWizard} onOpenChange={setShowSetupWizard}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hotspot Setup Wizard</DialogTitle>
            <DialogDescription>
              Follow these steps to set up a new hotspot on your router
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    wizardStep >= step ? "bg-blue-500 text-white" : "bg-slate-200"
                  }`}>
                    {wizardStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      wizardStep > step ? "bg-blue-500" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Step Content */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 1: Select Router</h3>
                <p className="text-muted-foreground text-sm">
                  Choose which router you want to enable hotspot on
                </p>
                <Select
                  value={selectedRouter?.id ? String(selectedRouter.id) : ""}
                  onValueChange={(v) => {
                    const router = routers.find(r => r.id === parseInt(v))
                    if (router) setSelectedRouter(router)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a router" />
                  </SelectTrigger>
                  <SelectContent>
                    {routers.map((router) => (
                      <SelectItem key={router.id} value={String(router.id)}>
                        {router.name} - {router.ip_address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {wizardStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 2: Create Your First Plan</h3>
                <p className="text-muted-foreground text-sm">
                  Set up a pricing plan that customers will see
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan Name</Label>
                    <Input
                      placeholder="1 Hour WiFi"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (KES)</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select
                      value={planForm.duration_minutes}
                      onValueChange={(v) => setPlanForm({ ...planForm, duration_minutes: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                        <SelectItem value="720">12 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Speed (Mbps)</Label>
                    <Select
                      value={planForm.speed_limit_mbps}
                      onValueChange={(v) => setPlanForm({ ...planForm, speed_limit_mbps: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Mbps</SelectItem>
                        <SelectItem value="10">10 Mbps</SelectItem>
                        <SelectItem value="20">20 Mbps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {wizardStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 3: Customize Branding</h3>
                <p className="text-muted-foreground text-sm">
                  Add your company branding to the captive portal
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Company Name</Label>
                    <Input
                      placeholder="Your ISP Name"
                      value={brandingForm.company_name}
                      onChange={(e) => setBrandingForm({ ...brandingForm, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={brandingForm.primary_color}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={brandingForm.primary_color}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input
                      placeholder="+254 7XX XXX XXX"
                      value={brandingForm.support_phone}
                      onChange={(e) => setBrandingForm({ ...brandingForm, support_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {wizardStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 4: Configure Router</h3>
                <p className="text-muted-foreground text-sm">
                  Apply these commands to your MikroTik router
                </p>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-[200px] font-mono">
                  {generateMikroTikConfig().slice(0, 1000)}...
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownloadConfig}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Config
                  </Button>
                  <Button variant="outline" onClick={handleCopyConfig}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Config
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
              disabled={wizardStep === 1}
            >
              Previous
            </Button>
            {wizardStep < 4 ? (
              <Button onClick={() => setWizardStep(wizardStep + 1)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => {
                setShowSetupWizard(false)
                toast.success("Hotspot setup complete!")
              }}>
                Finish Setup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
