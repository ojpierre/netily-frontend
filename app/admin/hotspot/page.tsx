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

  // Plan Form - Enhanced with all new fields
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    price: "",
    // Validity
    validity_type: "HOURS" as "MINUTES" | "HOURS" | "DAYS" | "UNLIMITED",
    validity_value: 1,
    // Data Limits
    limitation_type: "UNLIMITED" as "UNLIMITED" | "DATA",
    data_limit_value: "",
    data_limit_unit: "MB" as "MB" | "GB",
    // Speed
    download_speed: 5,
    upload_speed: 5,
    speed_unit: "MBPS" as "MBPS" | "KBPS",
    // Session limits
    simultaneous_devices: 1,
    // Valid days
    valid_monday: true,
    valid_tuesday: true,
    valid_wednesday: true,
    valid_thursday: true,
    valid_friday: true,
    valid_saturday: true,
    valid_sunday: true,
    // Display settings
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
  const [brandingLogoFile, setBrandingLogoFile] = useState<File | null>(null)
  const [brandingLogoPreview, setBrandingLogoPreview] = useState<string>("")
  const [selectedTemplateId, setSelectedTemplateId] = useState(1)

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
      // API returns flat array (pagination disabled) or could return paginated { results: [] }
      const plansResponse = await adminApi.getHotspotPlans(router.id).catch(() => [])
      const plansData = Array.isArray(plansResponse) 
        ? plansResponse 
        : (plansResponse as any)?.results || (plansResponse as any)?.plans || []
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
      // Load template_id from the router itself
      setSelectedTemplateId((router as any).template_id || 1)
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
        description: plan.description || "",
        price: String(plan.price),
        // Validity
        validity_type: plan.validity_type || "HOURS",
        validity_value: plan.validity_value || 1,
        // Data Limits
        limitation_type: plan.limitation_type || "UNLIMITED",
        data_limit_value: plan.data_limit_value ? String(plan.data_limit_value) : "",
        data_limit_unit: plan.data_limit_unit || "MB",
        // Speed
        download_speed: plan.download_speed || 5,
        upload_speed: plan.upload_speed || 5,
        speed_unit: plan.speed_unit || "MBPS",
        // Session limits
        simultaneous_devices: plan.simultaneous_devices || 1,
        // Valid days
        valid_monday: plan.valid_monday ?? true,
        valid_tuesday: plan.valid_tuesday ?? true,
        valid_wednesday: plan.valid_wednesday ?? true,
        valid_thursday: plan.valid_thursday ?? true,
        valid_friday: plan.valid_friday ?? true,
        valid_saturday: plan.valid_saturday ?? true,
        valid_sunday: plan.valid_sunday ?? true,
        // Display settings
        is_active: plan.is_active,
        is_popular: plan.is_popular || false,
        sort_order: plan.sort_order || 0,
      })
    } else {
      setEditingPlan(null)
      setPlanForm({
        name: "",
        description: "",
        price: "",
        validity_type: "HOURS",
        validity_value: 1,
        limitation_type: "UNLIMITED",
        data_limit_value: "",
        data_limit_unit: "MB",
        download_speed: 5,
        upload_speed: 5,
        speed_unit: "MBPS",
        simultaneous_devices: 1,
        valid_monday: true,
        valid_tuesday: true,
        valid_wednesday: true,
        valid_thursday: true,
        valid_friday: true,
        valid_saturday: true,
        valid_sunday: true,
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
    
    if (!planForm.name || !planForm.price) {
      toast.error("Please fill in plan name and price")
      return
    }

    try {
      setFormLoading(true)
      
      const planData: Partial<HotspotPlan> = {
        name: planForm.name,
        description: planForm.description,
        price: planForm.price,
        // Validity
        validity_type: planForm.validity_type,
        validity_value: planForm.validity_value,
        // Data Limits
        limitation_type: planForm.limitation_type,
        data_limit_value: planForm.data_limit_value ? parseInt(planForm.data_limit_value) : null,
        data_limit_unit: planForm.data_limit_unit,
        // Speed
        download_speed: planForm.download_speed,
        upload_speed: planForm.upload_speed,
        speed_unit: planForm.speed_unit,
        // Session limits
        simultaneous_devices: planForm.simultaneous_devices,
        // Valid days
        valid_monday: planForm.valid_monday,
        valid_tuesday: planForm.valid_tuesday,
        valid_wednesday: planForm.valid_wednesday,
        valid_thursday: planForm.valid_thursday,
        valid_friday: planForm.valid_friday,
        valid_saturday: planForm.valid_saturday,
        valid_sunday: planForm.valid_sunday,
        // Display settings
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
      console.log("[HotspotBranding] Saving branding for router:", selectedRouter.id, brandingForm)
      
      // If a logo file was selected, upload it via FormData
      if (brandingLogoFile) {
        const formData = new FormData()
        formData.append('logo', brandingLogoFile)
        Object.entries(brandingForm).forEach(([key, value]) => {
          formData.append(key, value)
        })
        await adminApi.updateHotspotBrandingWithLogo(selectedRouter.id, formData)
      } else {
        // Save branding (colours, text) without logo
        await adminApi.updateHotspotBranding(selectedRouter.id, brandingForm)
      }
      
      console.log("[HotspotBranding] Saving template_id:", selectedTemplateId, "to router:", selectedRouter.id)
      // Save template_id to the router itself
      await adminApi.updateRouter(selectedRouter.id, { template_id: selectedTemplateId } as any)
      
      toast.success("Branding & template updated successfully")
      setShowBrandingDialog(false)
      setBrandingLogoFile(null)
      setBrandingLogoPreview("")
      
      // Refresh branding data so UI stays in sync
      const updatedBranding = await adminApi.getHotspotBranding(selectedRouter.id)
      if (updatedBranding) {
        setBranding(updatedBranding)
      }
    } catch (error: any) {
      console.error("[HotspotBranding] Save failed:", error)
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
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Manage hotspot pricing plans for <span className="font-medium text-foreground">{selectedRouter.name}</span>
                        </p>
                      </div>
                      <Button onClick={() => handleOpenPlanDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plan
                      </Button>
                    </div>

                    {/* Plans table */}
                    {plans.length > 0 ? (
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[30%]">Plan</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Validity</TableHead>
                              <TableHead>Speed</TableHead>
                              <TableHead>Data Limit</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {plans.map((plan) => (
                              <TableRow key={plan.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <p className="font-medium">{plan.name}</p>
                                      {plan.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-1">{plan.description}</p>
                                      )}
                                    </div>
                                    {plan.is_popular && (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] shrink-0">
                                        <Zap className="w-3 h-3 mr-0.5" />Popular
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-blue-600">
                                  {formatCurrency(parseFloat(plan.price))}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{plan.duration_display || formatDuration(plan.duration_minutes || 0)}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {plan.download_speed || plan.speed_limit_mbps || 5}/{plan.upload_speed || plan.speed_limit_mbps || 5} {plan.speed_unit === "KBPS" ? "Kbps" : "Mbps"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{plan.data_limit_display || formatBytes(plan.data_limit_mb)}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={plan.is_active ? "default" : "secondary"} className="text-xs">
                                    {plan.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenPlanDialog(plan)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeletePlan(plan)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Zap className="w-12 h-12 text-slate-300 mb-4" />
                          <h3 className="font-semibold text-lg mb-2">No Plans Yet</h3>
                          <p className="text-muted-foreground text-center mb-4 max-w-sm">
                            Create pricing plans that customers will see when connecting to this hotspot.
                            Use a preset to get started quickly.
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
                          {/* Phone Frame Preview */}
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

      {/* Plan Dialog - Clean modal with presets & organized form */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {editingPlan ? "Edit Hotspot Plan" : "Create Hotspot Plan"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? `Editing "${editingPlan.name}" for ${selectedRouter?.name || "router"}`
                : `New plan for ${selectedRouter?.name || "router"} — pick a preset or customise below`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* ── Quick Presets (only when creating) ── */}
            {!editingPlan && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quick Presets</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: "1 Hour", icon: <Timer className="w-4 h-4 text-blue-500" />, price: "50", vType: "HOURS" as const, vVal: 1, lType: "DATA" as const, dlVal: "500", dlUnit: "MB" as const, dl: 5, ul: 5 },
                    { label: "Daily", icon: <Timer className="w-4 h-4 text-green-500" />, price: "100", vType: "DAYS" as const, vVal: 1, lType: "DATA" as const, dlVal: "2", dlUnit: "GB" as const, dl: 10, ul: 10 },
                    { label: "Weekly", icon: <Timer className="w-4 h-4 text-purple-500" />, price: "500", vType: "DAYS" as const, vVal: 7, lType: "DATA" as const, dlVal: "10", dlUnit: "GB" as const, dl: 15, ul: 10 },
                    { label: "Monthly", icon: <Timer className="w-4 h-4 text-orange-500" />, price: "1500", vType: "DAYS" as const, vVal: 30, lType: "DATA" as const, dlVal: "50", dlUnit: "GB" as const, dl: 20, ul: 15 },
                    { label: "Unlimited", icon: <Globe className="w-4 h-4 text-red-500" />, price: "3000", vType: "DAYS" as const, vVal: 30, lType: "UNLIMITED" as const, dlVal: "", dlUnit: "GB" as const, dl: 50, ul: 20 },
                  ].map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      variant="outline"
                      className="flex flex-col h-auto py-3 hover:bg-primary/5 hover:border-primary transition-colors"
                      onClick={() => setPlanForm({
                        ...planForm,
                        name: p.label,
                        price: p.price,
                        validity_type: p.vType,
                        validity_value: p.vVal,
                        limitation_type: p.lType,
                        data_limit_value: p.dlVal,
                        data_limit_unit: p.dlUnit,
                        download_speed: p.dl,
                        upload_speed: p.ul,
                      })}
                    >
                      {p.icon}
                      <span className="text-xs font-semibold mt-1">{p.label}</span>
                      <span className="text-[10px] text-muted-foreground">{p.price} KES</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Section 1: Basic Info ── */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Basic Info</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Plan Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g., 1 Hour WiFi"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Price (KES) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Description</Label>
                <Input
                  placeholder="Short description shown to customers on the portal"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                />
              </div>
            </div>

            {/* ── Section 2: Validity & Data ── */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Validity & Data</Label>

              {/* Validity row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Validity</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={planForm.validity_value}
                      onChange={(e) => setPlanForm({ ...planForm, validity_value: parseInt(e.target.value) || 1 })}
                      className="flex-1"
                      disabled={planForm.validity_type === "UNLIMITED"}
                    />
                    <Select
                      value={planForm.validity_type}
                      onValueChange={(v) => setPlanForm({ ...planForm, validity_type: v as any })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MINUTES">Minutes</SelectItem>
                        <SelectItem value="HOURS">Hours</SelectItem>
                        <SelectItem value="DAYS">Days</SelectItem>
                        <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Data limit */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Data Limit</Label>
                  <div className="flex gap-2">
                    {planForm.limitation_type === "UNLIMITED" ? (
                      <Input value="Unlimited" disabled className="flex-1" />
                    ) : (
                      <Input
                        type="number"
                        min="1"
                        placeholder="500"
                        value={planForm.data_limit_value}
                        onChange={(e) => setPlanForm({ ...planForm, data_limit_value: e.target.value })}
                        className="flex-1"
                      />
                    )}
                    <Select
                      value={planForm.limitation_type === "UNLIMITED" ? "UNLIMITED" : planForm.data_limit_unit}
                      onValueChange={(v) => {
                        if (v === "UNLIMITED") {
                          setPlanForm({ ...planForm, limitation_type: "UNLIMITED", data_limit_value: "" })
                        } else {
                          setPlanForm({ ...planForm, limitation_type: "DATA", data_limit_unit: v as any })
                        }
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MB">MB</SelectItem>
                        <SelectItem value="GB">GB</SelectItem>
                        <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Speed ── */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Speed</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Download</Label>
                  <Input
                    type="number"
                    min="1"
                    value={planForm.download_speed}
                    onChange={(e) => setPlanForm({ ...planForm, download_speed: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Upload</Label>
                  <Input
                    type="number"
                    min="1"
                    value={planForm.upload_speed}
                    onChange={(e) => setPlanForm({ ...planForm, upload_speed: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Unit</Label>
                  <Select
                    value={planForm.speed_unit}
                    onValueChange={(v) => setPlanForm({ ...planForm, speed_unit: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MBPS">Mbps</SelectItem>
                      <SelectItem value="KBPS">Kbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── Section 4: Session & Display ── */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Session & Display</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Devices</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={planForm.simultaneous_devices}
                    onChange={(e) => setPlanForm({ ...planForm, simultaneous_devices: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-[11px] text-muted-foreground">Simultaneous</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Sort Order</Label>
                  <Input
                    type="number"
                    min="0"
                    value={planForm.sort_order}
                    onChange={(e) => setPlanForm({ ...planForm, sort_order: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-[11px] text-muted-foreground">Lower = first</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Status</Label>
                  <Select
                    value={planForm.is_active ? "active" : "inactive"}
                    onValueChange={(v) => setPlanForm({ ...planForm, is_active: v === "active" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Valid days */}
              <div className="space-y-1.5">
                <Label className="text-sm">Available Days</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "valid_monday", label: "Mon" },
                    { key: "valid_tuesday", label: "Tue" },
                    { key: "valid_wednesday", label: "Wed" },
                    { key: "valid_thursday", label: "Thu" },
                    { key: "valid_friday", label: "Fri" },
                    { key: "valid_saturday", label: "Sat" },
                    { key: "valid_sunday", label: "Sun" },
                  ].map((day) => {
                    const checked = planForm[day.key as keyof typeof planForm] as boolean
                    return (
                      <button
                        key={day.key}
                        type="button"
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                          checked
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                        }`}
                        onClick={() => setPlanForm({ ...planForm, [day.key]: !checked })}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Popular toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Mark as Popular</span>
                  <span className="text-xs text-muted-foreground">(highlighted on portal)</span>
                </div>
                <Switch
                  checked={planForm.is_popular}
                  onCheckedChange={(v) => setPlanForm({ ...planForm, is_popular: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={formLoading || !planForm.name || !planForm.price}>
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingPlan ? (
                "Update Plan"
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branding Dialog */}
      <Dialog open={showBrandingDialog} onOpenChange={setShowBrandingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Captive Portal</DialogTitle>
            <DialogDescription>
              Choose a visual theme and brand your hotspot login page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Portal Template Picker */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Portal Template</Label>
              <p className="text-sm text-muted-foreground">Choose a visual theme for the captive portal login page</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 1, name: "Classic",    bg: "bg-gradient-to-br from-blue-50 to-indigo-100", accent: "bg-blue-600" },
                  { id: 2, name: "Dark",       bg: "bg-gradient-to-br from-gray-900 to-gray-800", accent: "bg-cyan-500" },
                  { id: 3, name: "Gradient",   bg: "bg-gradient-to-br from-purple-600 to-pink-500", accent: "bg-purple-600" },
                  { id: 4, name: "Minimal",    bg: "bg-gray-50",                                  accent: "bg-gray-900" },
                  { id: 5, name: "Vibrant",    bg: "bg-gradient-to-br from-amber-400 to-orange-500", accent: "bg-orange-500" },
                  { id: 6, name: "Corporate",  bg: "bg-gradient-to-br from-slate-100 to-slate-200", accent: "bg-slate-700" },
                  { id: 7, name: "Glass",      bg: "bg-gradient-to-br from-teal-400 to-blue-500", accent: "bg-white" },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`relative rounded-lg border-2 p-1 transition-all ${
                      selectedTemplateId === tmpl.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className={`${tmpl.bg} rounded-md h-16 flex items-end justify-center pb-1`}>
                      <div className={`${tmpl.accent} rounded w-10 h-3`} />
                    </div>
                    <p className="text-xs font-medium text-center mt-1.5 mb-0.5">{tmpl.name}</p>
                    {selectedTemplateId === tmpl.id && (
                      <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-muted" />

            {/* Company & Colours */}
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                placeholder="Your ISP Name"
                value={brandingForm.company_name}
                onChange={(e) => setBrandingForm({ ...brandingForm, company_name: e.target.value })}
              />
            </div>

            {/* Company Logo Upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {(brandingLogoPreview || (branding as any)?.logo_url) && (
                  <div className="w-16 h-16 rounded-lg border border-muted overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={brandingLogoPreview || (branding as any)?.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setBrandingLogoFile(file)
                        setBrandingLogoPreview(URL.createObjectURL(file))
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG or JPG, max 2MB. Displayed on captive portal login page.
                  </p>
                </div>
              </div>
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
                <>Save Template &amp; Branding</>
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
                    <Label>Validity</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="1"
                        value={planForm.validity_value}
                        onChange={(e) => setPlanForm({ ...planForm, validity_value: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                      <Select
                        value={planForm.validity_type}
                        onValueChange={(v) => setPlanForm({ ...planForm, validity_type: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOURS">Hours</SelectItem>
                          <SelectItem value="DAYS">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Speed (Mbps)</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={planForm.download_speed}
                      onChange={(e) => setPlanForm({ ...planForm, download_speed: parseInt(e.target.value) || 5, upload_speed: parseInt(e.target.value) || 5 })}
                    />
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
