"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Wifi,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Settings,
  Network,
  Globe,
  Lock,
  Users,
  Zap,
  Plus,
  Search,
  ArrowRight,
  Server,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"

// ==========================================
// TYPES
// ==========================================

interface RouterPort {
  name: string
  type: string
  mac_address: string
  running: boolean
  disabled: boolean
  comment?: string
  default_name?: string
  // For ethernet ports
  speed?: string
  full_duplex?: boolean
  // For bridge ports
  bridge?: string
  // Current config
  current_use?: "wan" | "lan" | "hotspot" | "unused"
}

interface HotspotServer {
  id?: number
  name: string
  interface: string
  address_pool: string
  profile: string
  idle_timeout: string
  keepalive_timeout: string
  login_by: string[]
  disabled: boolean
  addresses_per_mac?: number
}

interface HotspotProfile {
  id?: number
  name: string
  rate_limit?: string
  session_timeout?: string
  shared_users?: number
  mac_cookie_timeout?: string
  login_by?: string
  html_directory?: string
}

interface HotspotPlan {
  id: number
  name: string
  price: string
  duration_minutes: number
  data_limit_mb: number | null
  speed_limit: string
  description?: string
  is_active: boolean
}

interface HotspotConfig {
  is_configured: boolean
  server?: HotspotServer
  profile?: HotspotProfile
  plans: HotspotPlan[]
  active_sessions: number
  portal_url?: string
}

type SetupStep = "ports" | "network" | "server" | "branding" | "plans" | "complete"

interface RouterHotspotTabProps {
  routerId: number
  isDemo?: boolean
}

// ==========================================
// COMPONENT
// ==========================================

export function RouterHotspotTab({ routerId, isDemo = false }: RouterHotspotTabProps) {
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingPorts, setIsCheckingPorts] = useState(false)
  const [ports, setPorts] = useState<RouterPort[]>([])
  const [hotspotConfig, setHotspotConfig] = useState<HotspotConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Setup wizard state
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [currentStep, setCurrentStep] = useState<SetupStep>("ports")
  const [isConfiguring, setIsConfiguring] = useState(false)
  
  // Selected configuration
  const [selectedPort, setSelectedPort] = useState<string | null>(null)
  const [networkConfig, setNetworkConfig] = useState({
    network_address: "10.5.50.1",
    network_mask: "24",
    pool_name: "hotspot-pool",
    pool_range: "10.5.50.10-10.5.50.254",
    dns_server: "8.8.8.8",
  })
  const [serverConfig, setServerConfig] = useState({
    name: "hotspot-server",
    idle_timeout: "5m",
    keepalive_timeout: "2m",
    login_by: ["mac", "http-chap"],
  })
  const [brandingConfig, setBrandingConfig] = useState({
    company_name: "",
    logo_url: "",
    primary_color: "#3B82F6",
    welcome_message: "Welcome to our WiFi network",
    terms_url: "",
  })

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchHotspotConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (isDemo) {
        // Demo data
        setHotspotConfig({
          is_configured: false,
          plans: [],
          active_sessions: 0,
        })
        return
      }

      const response = await adminApi.getRouterHotspotConfig(routerId)
      setHotspotConfig(response)
    } catch (err: any) {
      console.error("Failed to fetch hotspot config:", err)
      // Treat as not configured if endpoint doesn't exist
      setHotspotConfig({
        is_configured: false,
        plans: [],
        active_sessions: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [routerId, isDemo])

  const checkRouterPorts = async () => {
    try {
      setIsCheckingPorts(true)
      setError(null)
      
      if (isDemo) {
        // Demo ports
        setPorts([
          { name: "ether1", type: "ethernet", mac_address: "00:11:22:33:44:55", running: true, disabled: false, speed: "1Gbps", current_use: "wan" },
          { name: "ether2", type: "ethernet", mac_address: "00:11:22:33:44:56", running: true, disabled: false, speed: "1Gbps", current_use: "lan" },
          { name: "ether3", type: "ethernet", mac_address: "00:11:22:33:44:57", running: false, disabled: false, speed: "1Gbps", current_use: "unused" },
          { name: "ether4", type: "ethernet", mac_address: "00:11:22:33:44:58", running: false, disabled: false, speed: "1Gbps", current_use: "unused" },
          { name: "ether5", type: "ethernet", mac_address: "00:11:22:33:44:59", running: false, disabled: false, speed: "1Gbps", current_use: "unused" },
          { name: "wlan1", type: "wireless", mac_address: "00:11:22:33:44:60", running: true, disabled: false, current_use: "unused" },
          { name: "bridge-local", type: "bridge", mac_address: "00:11:22:33:44:61", running: true, disabled: false, current_use: "lan" },
        ])
        return
      }

      const response = await adminApi.getRouterPorts(routerId)
      setPorts(response.ports || [])
    } catch (err: any) {
      console.error("Failed to check router ports:", err)
      setError(err.message || "Failed to retrieve router ports")
      toast.error("Failed to check router ports")
    } finally {
      setIsCheckingPorts(false)
    }
  }

  useEffect(() => {
    fetchHotspotConfig()
  }, [fetchHotspotConfig])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleStartSetup = () => {
    setShowSetupWizard(true)
    setCurrentStep("ports")
    checkRouterPorts()
  }

  const handlePortSelect = (portName: string) => {
    setSelectedPort(portName)
  }

  const handleNextStep = () => {
    const steps: SetupStep[] = ["ports", "network", "server", "branding", "plans", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handlePrevStep = () => {
    const steps: SetupStep[] = ["ports", "network", "server", "branding", "plans", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleConfigureHotspot = async () => {
    if (!selectedPort) {
      toast.error("Please select a port for hotspot")
      return
    }

    try {
      setIsConfiguring(true)
      
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.success("Hotspot configured successfully (Demo)")
        setCurrentStep("complete")
        return
      }

      await adminApi.configureRouterHotspot(routerId, {
        interface: selectedPort,
        network: networkConfig,
        server: serverConfig,
        branding: brandingConfig,
      })
      
      toast.success("Hotspot configured successfully!")
      setCurrentStep("complete")
      fetchHotspotConfig()
    } catch (err: any) {
      console.error("Failed to configure hotspot:", err)
      toast.error(err.message || "Failed to configure hotspot")
    } finally {
      setIsConfiguring(false)
    }
  }

  const handleDisableHotspot = async () => {
    if (!confirm("Are you sure you want to disable the hotspot? Active sessions will be disconnected.")) {
      return
    }

    try {
      setIsConfiguring(true)
      await adminApi.disableRouterHotspot(routerId)
      toast.success("Hotspot disabled")
      fetchHotspotConfig()
    } catch (err: any) {
      toast.error(err.message || "Failed to disable hotspot")
    } finally {
      setIsConfiguring(false)
    }
  }

  // ==========================================
  // RENDER: Loading
  // ==========================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==========================================
  // RENDER: Setup Wizard
  // ==========================================

  if (showSetupWizard) {
    return (
      <div className="space-y-6">
        {/* Progress Steps */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {["ports", "network", "server", "branding", "plans"].map((step, index) => {
                const steps: SetupStep[] = ["ports", "network", "server", "branding", "plans"]
                const currentIndex = steps.indexOf(currentStep)
                const isComplete = index < currentIndex
                const isCurrent = step === currentStep
                
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete ? "bg-green-500 text-white" :
                        isCurrent ? "bg-blue-500 text-white" :
                        "bg-slate-200 text-slate-500"
                      }`}>
                        {isComplete ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                      </div>
                      <span className={`text-xs mt-1 capitalize ${isCurrent ? "font-medium" : "text-slate-500"}`}>
                        {step}
                      </span>
                    </div>
                    {index < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${index < currentIndex ? "bg-green-500" : "bg-slate-200"}`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step: Select Ports */}
        {currentStep === "ports" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Select Hotspot Interface
              </CardTitle>
              <CardDescription>
                Choose which port or interface will be used for the hotspot. This is typically an unused ethernet port or wireless interface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCheckingPorts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                  <span>Scanning router ports...</span>
                </div>
              ) : ports.length === 0 ? (
                <div className="text-center py-12">
                  <Network className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-4">No ports discovered yet</p>
                  <Button onClick={checkRouterPorts}>
                    <Search className="w-4 h-4 mr-2" />
                    Check Router Ports
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {ports.map((port) => {
                      const isSelected = selectedPort === port.name
                      const isDisabled = port.current_use === "wan"
                      
                      return (
                        <div
                          key={port.name}
                          onClick={() => !isDisabled && handlePortSelect(port.name)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : isDisabled
                              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                port.type === "wireless" ? "bg-purple-100" :
                                port.type === "bridge" ? "bg-orange-100" :
                                "bg-blue-100"
                              }`}>
                                {port.type === "wireless" ? (
                                  <Wifi className={`w-5 h-5 ${port.type === "wireless" ? "text-purple-600" : "text-blue-600"}`} />
                                ) : (
                                  <Network className={`w-5 h-5 ${port.type === "bridge" ? "text-orange-600" : "text-blue-600"}`} />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{port.name}</p>
                                <p className="text-sm text-slate-500">
                                  {port.type} • {port.mac_address}
                                  {port.speed && ` • ${port.speed}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {port.running ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-600">
                                  Inactive
                                </Badge>
                              )}
                              {port.current_use && port.current_use !== "unused" && (
                                <Badge variant="secondary" className="capitalize">
                                  {port.current_use}
                                </Badge>
                              )}
                              {isSelected && (
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <Button variant="outline" onClick={checkRouterPorts} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Ports
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => setShowSetupWizard(false)}>
                Cancel
              </Button>
              <Button onClick={handleNextStep} disabled={!selectedPort}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Network Configuration */}
        {currentStep === "network" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Network Configuration
              </CardTitle>
              <CardDescription>
                Configure the IP address range for hotspot clients. These settings will be applied to the selected interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gateway Address</Label>
                  <Input
                    value={networkConfig.network_address}
                    onChange={(e) => setNetworkConfig(prev => ({ ...prev, network_address: e.target.value }))}
                    placeholder="10.5.50.1"
                  />
                  <p className="text-xs text-slate-500">IP address for the hotspot gateway</p>
                </div>
                <div className="space-y-2">
                  <Label>Network Mask (CIDR)</Label>
                  <Select
                    value={networkConfig.network_mask}
                    onValueChange={(value) => setNetworkConfig(prev => ({ ...prev, network_mask: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">/24 (254 hosts)</SelectItem>
                      <SelectItem value="23">/23 (510 hosts)</SelectItem>
                      <SelectItem value="22">/22 (1022 hosts)</SelectItem>
                      <SelectItem value="21">/21 (2046 hosts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>DHCP Pool Name</Label>
                  <Input
                    value={networkConfig.pool_name}
                    onChange={(e) => setNetworkConfig(prev => ({ ...prev, pool_name: e.target.value }))}
                    placeholder="hotspot-pool"
                  />
                </div>
                <div className="space-y-2">
                  <Label>DHCP Pool Range</Label>
                  <Input
                    value={networkConfig.pool_range}
                    onChange={(e) => setNetworkConfig(prev => ({ ...prev, pool_range: e.target.value }))}
                    placeholder="10.5.50.10-10.5.50.254"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>DNS Server</Label>
                <Input
                  value={networkConfig.dns_server}
                  onChange={(e) => setNetworkConfig(prev => ({ ...prev, dns_server: e.target.value }))}
                  placeholder="8.8.8.8"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Server Settings */}
        {currentStep === "server" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Hotspot Server Settings
              </CardTitle>
              <CardDescription>
                Configure hotspot server behavior and authentication methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Server Name</Label>
                <Input
                  value={serverConfig.name}
                  onChange={(e) => setServerConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="hotspot-server"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idle Timeout</Label>
                  <Select
                    value={serverConfig.idle_timeout}
                    onValueChange={(value) => setServerConfig(prev => ({ ...prev, idle_timeout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 minute</SelectItem>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="10m">10 minutes</SelectItem>
                      <SelectItem value="30m">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Disconnect after idle time</p>
                </div>
                <div className="space-y-2">
                  <Label>Keepalive Timeout</Label>
                  <Select
                    value={serverConfig.keepalive_timeout}
                    onValueChange={(value) => setServerConfig(prev => ({ ...prev, keepalive_timeout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 minute</SelectItem>
                      <SelectItem value="2m">2 minutes</SelectItem>
                      <SelectItem value="5m">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Authentication Methods</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { id: "mac", label: "MAC Address", desc: "Auto-login by MAC" },
                    { id: "http-chap", label: "HTTP CHAP", desc: "Secure password" },
                    { id: "http-pap", label: "HTTP PAP", desc: "Simple password" },
                    { id: "cookie", label: "Cookie", desc: "Browser cookie" },
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => {
                        setServerConfig(prev => ({
                          ...prev,
                          login_by: prev.login_by.includes(method.id)
                            ? prev.login_by.filter(m => m !== method.id)
                            : [...prev.login_by, method.id]
                        }))
                      }}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        serverConfig.login_by.includes(method.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          serverConfig.login_by.includes(method.id)
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-300"
                        }`}>
                          {serverConfig.login_by.includes(method.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{method.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-6">{method.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Branding */}
        {currentStep === "branding" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Captive Portal Branding
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your hotspot login page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={brandingConfig.company_name}
                    onChange={(e) => setBrandingConfig(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandingConfig.primary_color}
                      onChange={(e) => setBrandingConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={brandingConfig.primary_color}
                      onChange={(e) => setBrandingConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo URL (Optional)</Label>
                <Input
                  value={brandingConfig.logo_url}
                  onChange={(e) => setBrandingConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea
                  value={brandingConfig.welcome_message}
                  onChange={(e) => setBrandingConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Welcome to our WiFi network"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions URL (Optional)</Label>
                <Input
                  value={brandingConfig.terms_url}
                  onChange={(e) => setBrandingConfig(prev => ({ ...prev, terms_url: e.target.value }))}
                  placeholder="https://example.com/terms"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Plans (Summary & Configure) */}
        {currentStep === "plans" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Review & Configure
              </CardTitle>
              <CardDescription>
                Review your hotspot configuration before applying. Plans can be added after setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuration Summary */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Configuration Summary</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Interface</p>
                    <p className="text-lg font-mono">{selectedPort}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Gateway</p>
                    <p className="text-lg font-mono">{networkConfig.network_address}/{networkConfig.network_mask}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">DHCP Pool</p>
                    <p className="text-sm font-mono">{networkConfig.pool_range}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Server Name</p>
                    <p className="text-lg font-mono">{serverConfig.name}</p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    This will configure the MikroTik router with hotspot settings. Make sure you have a backup before proceeding.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button 
                onClick={handleConfigureHotspot} 
                disabled={isConfiguring}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConfiguring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Apply Configuration
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Complete */}
        {currentStep === "complete" && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hotspot Configured!</h3>
              <p className="text-slate-600 mb-6">
                Your hotspot is now active. You can add pricing plans and customize settings.
              </p>
              <Button onClick={() => {
                setShowSetupWizard(false)
                fetchHotspotConfig()
              }}>
                View Hotspot Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ==========================================
  // RENDER: Hotspot Not Configured
  // ==========================================

  if (!hotspotConfig?.is_configured) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wifi className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Configure Hotspot</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Set up a captive portal hotspot on this router. Customers can purchase WiFi access via M-Pesa.
          </p>
          <Button onClick={handleStartSetup}>
            <Settings className="w-4 h-4 mr-2" />
            Start Hotspot Setup
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ==========================================
  // RENDER: Hotspot Dashboard
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <p className="text-xl font-bold text-green-600">Active</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Sessions</p>
                <p className="text-xl font-bold">{hotspotConfig.active_sessions}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Interface</p>
                <p className="text-xl font-bold font-mono">{hotspotConfig.server?.interface || "—"}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Plans</p>
                <p className="text-xl font-bold">{hotspotConfig.plans.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Configuration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hotspot Server</CardTitle>
            <CardDescription>Current hotspot configuration</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchHotspotConfig}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="destructive" onClick={handleDisableHotspot} disabled={isConfiguring}>
              Disable Hotspot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hotspotConfig.server && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Server Name</p>
                <p className="font-mono font-medium">{hotspotConfig.server.name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Address Pool</p>
                <p className="font-mono font-medium">{hotspotConfig.server.address_pool}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Profile</p>
                <p className="font-mono font-medium">{hotspotConfig.server.profile}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Idle Timeout</p>
                <p className="font-mono font-medium">{hotspotConfig.server.idle_timeout}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Login Methods</p>
                <p className="font-mono font-medium">{hotspotConfig.server.login_by?.join(", ") || "—"}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Portal URL</p>
                <p className="font-mono font-medium text-sm break-all">{hotspotConfig.portal_url || "—"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hotspot Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hotspot Plans</CardTitle>
            <CardDescription>Pricing plans for hotspot access</CardDescription>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          {hotspotConfig.plans.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>No plans configured yet</p>
              <p className="text-sm">Add pricing plans for customers to purchase</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Data Limit</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotspotConfig.plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>KSh {plan.price}</TableCell>
                    <TableCell>{plan.duration_minutes} min</TableCell>
                    <TableCell>{plan.data_limit_mb ? `${plan.data_limit_mb} MB` : "Unlimited"}</TableCell>
                    <TableCell>{plan.speed_limit}</TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
