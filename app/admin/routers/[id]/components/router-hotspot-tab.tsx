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
  Users,
  Zap,
  Plus,
  Search,
  ArrowRight,
  Server,
  DollarSign,
  Check,
  ShieldCheck,
  Activity,
  WifiOff,
  Cable,
  Radio,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"

// ==========================================
// TYPES
// ==========================================

interface PortScanResult {
  port: number
  service: string
  description: string
  status: "open" | "closed" | "filtered" | "error"
  latency_ms: number | null
}

interface PortScanResponse {
  router_id: number
  router_name: string
  router_status: string
  target_ip: string | null
  results: PortScanResult[]
  api_reachable: boolean
  winbox_reachable: boolean
  web_reachable: boolean
  open_count: number
  total_scanned: number
  error?: string
}

interface RouterPort {
  name: string
  type: string
  mac_address: string
  running: boolean
  disabled: boolean
  comment?: string
  default_name?: string
  speed?: string | null
  bridge?: string | null
  ip_address?: string | null
  current_use?: string
  hotspot_server?: string | null
  tx_bytes?: number
  rx_bytes?: number
}

interface HotspotServer {
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
  name: string
  rate_limit?: string
  session_timeout?: string
  shared_users?: number
  login_by?: string
  dns_name?: string
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
  server?: HotspotServer | null
  profile?: HotspotProfile | null
  plans: HotspotPlan[]
  active_sessions: number
  portal_url?: string | null
  total_servers?: number
  total_profiles?: number
}

interface ConfigStep {
  step: string
  status: "ok" | "error" | "warning"
  detail: string
}

type SetupStep = "scan" | "ports" | "network" | "server" | "branding" | "review" | "applying" | "complete"

interface RouterHotspotTabProps {
  routerId: number
  isDemo?: boolean
}

// ==========================================
// COMPONENT
// ==========================================

export function RouterHotspotTab({ routerId, isDemo = false }: RouterHotspotTabProps) {
  // ── Core State ──
  const [isLoading, setIsLoading] = useState(true)
  const [hotspotConfig, setHotspotConfig] = useState<HotspotConfig | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isRouterOffline, setIsRouterOffline] = useState(false)

  // ── Port Scan State ──
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<PortScanResponse | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  // ── Ports State ──
  const [isCheckingPorts, setIsCheckingPorts] = useState(false)
  const [ports, setPorts] = useState<RouterPort[]>([])
  const [portsError, setPortsError] = useState<string | null>(null)

  // ── Setup Wizard ──
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [currentStep, setCurrentStep] = useState<SetupStep>("scan")
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [configProgress, setConfigProgress] = useState<ConfigStep[]>([])
  const [configError, setConfigError] = useState<string | null>(null)

  // ── Selected Configuration ──
  const [selectedPort, setSelectedPort] = useState<string | null>(null)
  const [networkConfig, setNetworkConfig] = useState({
    network_address: "10.5.50.1",
    network_mask: "24",
    pool_name: "hs-pool-1",
    pool_range: "10.5.50.10-10.5.50.254",
    dns_server: "8.8.8.8",
  })
  const [serverConfig, setServerConfig] = useState({
    name: "hotspot1",
    idle_timeout: "5m",
    keepalive_timeout: "2m",
    login_by: ["mac", "http-chap"] as string[],
  })
  const [brandingConfig, setBrandingConfig] = useState({
    company_name: "",
    logo_url: "",
    primary_color: "#3B82F6",
    welcome_message: "Welcome to our WiFi network",
    terms_url: "",
    dns_name: "",
  })

  // ── Expand/Collapse ──
  const [showScanDetails, setShowScanDetails] = useState(false)

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchHotspotConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      setIsRouterOffline(false)

      const response = await adminApi.getRouterHotspotConfig(routerId)
      setHotspotConfig(response)
    } catch (err: any) {
      console.error("Failed to fetch hotspot config:", err)
      const msg = err?.message || ""

      if (msg.toLowerCase().includes("offline") || err?.status === 503) {
        setIsRouterOffline(true)
        setLoadError("Router is offline. Hotspot configuration requires an active connection to the router.")
      } else {
        // Non-offline error — treat as not configured
        setHotspotConfig({
          is_configured: false,
          plans: [],
          active_sessions: 0,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [routerId])

  const runPortScan = async () => {
    try {
      setIsScanning(true)
      setScanError(null)

      const result = await adminApi.scanRouterPorts(routerId)
      setScanResult(result)

      if (result.error) {
        setScanError(result.error)
        toast.error(result.error)
      } else if (result.api_reachable) {
        toast.success(`Port scan complete — ${result.open_count} services reachable`)
      } else {
        toast.warning("Port scan complete — API port not reachable. Check router connectivity.")
      }
    } catch (err: any) {
      console.error("Port scan failed:", err)
      setScanError(err?.message || "Port scan failed")
      toast.error("Port scan failed — check router IP and network connectivity")
    } finally {
      setIsScanning(false)
    }
  }

  const checkRouterPorts = async () => {
    try {
      setIsCheckingPorts(true)
      setPortsError(null)

      const response = await adminApi.getRouterPorts(routerId)
      setPorts(response.ports || [])

      if ((response.ports || []).length === 0) {
        setPortsError("No interfaces found. The router may be unreachable.")
      }
    } catch (err: any) {
      console.error("Failed to check router ports:", err)
      const msg = err?.message || "Failed to retrieve router ports"
      setPortsError(msg)
      toast.error(msg)
    } finally {
      setIsCheckingPorts(false)
    }
  }

  useEffect(() => {
    fetchHotspotConfig()
  }, [fetchHotspotConfig])

  // ==========================================
  // WIZARD HANDLERS
  // ==========================================

  const handleStartSetup = () => {
    setShowSetupWizard(true)
    setCurrentStep("scan")
    setConfigProgress([])
    setConfigError(null)
    setScanResult(null)
  }

  const handlePortSelect = (portName: string) => {
    setSelectedPort(portName)
  }

  const wizardSteps: SetupStep[] = ["scan", "ports", "network", "server", "branding", "review", "applying", "complete"]

  const handleNextStep = () => {
    const currentIndex = wizardSteps.indexOf(currentStep)
    if (currentIndex < wizardSteps.length - 1) {
      const next = wizardSteps[currentIndex + 1]
      setCurrentStep(next)

      // Auto-start actions for specific steps
      if (next === "ports" && ports.length === 0) {
        checkRouterPorts()
      }
    }
  }

  const handlePrevStep = () => {
    const currentIndex = wizardSteps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(wizardSteps[currentIndex - 1])
    }
  }

  const handleConfigureHotspot = async () => {
    if (!selectedPort) {
      toast.error("Please select a port for hotspot")
      return
    }

    try {
      setIsConfiguring(true)
      setConfigError(null)
      setConfigProgress([])
      setCurrentStep("applying")

      const result = await adminApi.configureRouterHotspot(routerId, {
        interface: selectedPort,
        network: networkConfig,
        server: serverConfig,
        branding: brandingConfig,
      })

      if (result?.success) {
        setConfigProgress(result.result?.steps || [])
        toast.success("Hotspot configured successfully!")
        setCurrentStep("complete")
        fetchHotspotConfig()
      } else {
        setConfigProgress(result?.steps || [])
        setConfigError(result?.message || "Configuration failed")
        toast.error(result?.message || "Configuration failed")
      }
    } catch (err: any) {
      console.error("Failed to configure hotspot:", err)
      setConfigError(err?.message || "Failed to configure hotspot")
      toast.error(err?.message || "Failed to configure hotspot")
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
      toast.error(err?.message || "Failed to disable hotspot")
    } finally {
      setIsConfiguring(false)
    }
  }

  const handleEnableHotspot = async () => {
    try {
      setIsConfiguring(true)
      const serverName = hotspotConfig?.server?.name || "hotspot1"
      await adminApi.enableRouterHotspot(routerId, serverName)
      toast.success("Hotspot enabled")
      fetchHotspotConfig()
    } catch (err: any) {
      toast.error(err?.message || "Failed to enable hotspot")
    } finally {
      setIsConfiguring(false)
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  const portStatusColor = (s: string) => {
    switch (s) {
      case "open": return "bg-green-100 text-green-700 border-green-200"
      case "closed": return "bg-red-50 text-red-600 border-red-200"
      case "filtered": return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default: return "bg-slate-100 text-slate-600 border-slate-200"
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
  // RENDER: Router Offline
  // ==========================================

  if (isRouterOffline) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Router Offline</h3>
          <p className="text-slate-600 mb-2 max-w-md mx-auto">
            {loadError || "Cannot reach the router. Hotspot configuration requires an active connection."}
          </p>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Ensure the router is powered on and the VPN tunnel is established, then try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => runPortScan()}>
              <Search className="w-4 h-4 mr-2" />
              Run Port Scan
            </Button>
            <Button onClick={() => fetchHotspotConfig()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>

          {isScanning && (
            <div className="mt-6">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-slate-500 mt-2">Scanning ports...</p>
            </div>
          )}

          {scanResult && !isScanning && (
            <div className="mt-6 max-w-lg mx-auto text-left">
              <ScanResultCard result={scanResult} showDetails={showScanDetails} onToggleDetails={() => setShowScanDetails(!showScanDetails)} />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ==========================================
  // RENDER: Setup Wizard
  // ==========================================

  if (showSetupWizard) {
    const visibleSteps = ["scan", "ports", "network", "server", "branding", "review"] as const
    const currentVisibleIndex = visibleSteps.indexOf(currentStep as any)

    return (
      <div className="space-y-6">
        {/* Progress Steps */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {visibleSteps.map((step, index) => {
                const isComplete = currentStep === "complete" || currentStep === "applying"
                  ? true
                  : index < currentVisibleIndex
                const isCurrent = step === currentStep

                const stepLabels: Record<string, string> = {
                  scan: "Scan", ports: "Interface", network: "Network",
                  server: "Server", branding: "Branding", review: "Review",
                }

                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isComplete ? "bg-green-500 text-white" :
                        isCurrent ? "bg-blue-500 text-white" :
                        "bg-slate-200 text-slate-500"
                      }`}>
                        {isComplete ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                      </div>
                      <span className={`text-xs mt-1 ${isCurrent ? "font-semibold text-blue-600" : "text-slate-500"}`}>
                        {stepLabels[step]}
                      </span>
                    </div>
                    {index < visibleSteps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded ${
                        (currentStep === "complete" || currentStep === "applying") ? "bg-green-500" :
                        index < currentVisibleIndex ? "bg-green-500" : "bg-slate-200"
                      }`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Step: Port Scan ── */}
        {currentStep === "scan" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Router Connectivity Check
              </CardTitle>
              <CardDescription>
                Scan the router to verify which management services are reachable before configuring the hotspot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!scanResult && !isScanning && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-slate-600 mb-4">
                    Start a port scan to check which services are available on this router.
                  </p>
                  <Button onClick={runPortScan} size="lg">
                    <Search className="w-4 h-4 mr-2" />
                    Start Port Scan
                  </Button>
                </div>
              )}

              {isScanning && (
                <div className="text-center py-10">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="font-medium text-slate-700">Scanning router ports...</p>
                  <p className="text-sm text-slate-500 mt-1">Checking 10 common MikroTik services</p>
                </div>
              )}

              {scanResult && !isScanning && (
                <ScanResultCard
                  result={scanResult}
                  showDetails={showScanDetails}
                  onToggleDetails={() => setShowScanDetails(!showScanDetails)}
                />
              )}

              {scanError && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="w-4 h-4" />
                  <AlertTitle>Scan Failed</AlertTitle>
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => setShowSetupWizard(false)}>Cancel</Button>
              <div className="flex gap-2">
                {scanResult && (
                  <Button variant="outline" onClick={runPortScan}>
                    <RotateCcw className="w-4 h-4 mr-2" />Re-scan
                  </Button>
                )}
                <Button onClick={handleNextStep} disabled={!scanResult || !scanResult.api_reachable}>
                  {scanResult && !scanResult.api_reachable ? "API Not Reachable" : "Continue"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* ── Step: Select Interface ── */}
        {currentStep === "ports" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Select Hotspot Interface
              </CardTitle>
              <CardDescription>
                Choose which port or interface will be used for the hotspot. This is typically an unused ethernet port, wireless interface, or bridge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCheckingPorts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                  <span>Querying router interfaces...</span>
                </div>
              ) : portsError ? (
                <Alert variant="destructive" className="mb-4">
                  <XCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {portsError}
                    <Button variant="link" className="ml-2 p-0 h-auto" onClick={checkRouterPorts}>Retry</Button>
                  </AlertDescription>
                </Alert>
              ) : ports.length === 0 ? (
                <div className="text-center py-12">
                  <Network className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-4">No interfaces discovered yet</p>
                  <Button onClick={checkRouterPorts}>
                    <Search className="w-4 h-4 mr-2" />Discover Interfaces
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {ports.map((port) => {
                      const isSelected = selectedPort === port.name
                      const isWan = port.current_use === "wan"
                      const isHotspot = port.current_use === "hotspot"

                      return (
                        <div
                          key={port.name}
                          onClick={() => !isWan && handlePortSelect(port.name)}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 cursor-pointer"
                              : isWan
                              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
                              : "border-slate-200 hover:border-slate-300 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                port.type === "wlan" ? "bg-purple-100" :
                                port.type === "bridge" ? "bg-orange-100" :
                                "bg-blue-100"
                              }`}>
                                {port.type === "wlan" ? (
                                  <Radio className="w-5 h-5 text-purple-600" />
                                ) : port.type === "bridge" ? (
                                  <Cable className="w-5 h-5 text-orange-600" />
                                ) : (
                                  <Network className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{port.name}</p>
                                <p className="text-sm text-slate-500">
                                  {port.type}
                                  {port.mac_address && ` • ${port.mac_address}`}
                                  {port.speed && ` • ${port.speed}`}
                                  {port.ip_address && ` • ${port.ip_address}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {port.running ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-600">Inactive</Badge>
                              )}
                              {port.current_use && port.current_use !== "unused" && (
                                <Badge variant="secondary" className="capitalize text-xs">
                                  {port.current_use === "bridge-member" ? `→ ${port.bridge}` : port.current_use}
                                </Badge>
                              )}
                              {isHotspot && port.hotspot_server && (
                                <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
                                  Hotspot: {port.hotspot_server}
                                </Badge>
                              )}
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Button variant="outline" onClick={checkRouterPorts} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />Refresh Interfaces
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button onClick={handleNextStep} disabled={!selectedPort}>
                Continue <ChevronRight className="w-4 h-4 ml-2" />
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
                      <SelectItem value="20">/20 (4094 hosts)</SelectItem>
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
                <Label>Captive Portal Domain (Optional)</Label>
                <Input
                  value={brandingConfig.dns_name}
                  onChange={(e) => setBrandingConfig(prev => ({ ...prev, dns_name: e.target.value }))}
                  placeholder="hotspot.yourdomain.com"
                />
                <p className="text-xs text-slate-500">DNS name shown on the captive portal. Leave blank for default.</p>
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

        {/* ── Step: Review ── */}
        {currentStep === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Review Configuration
              </CardTitle>
              <CardDescription>
                Verify all settings before applying them to the router. Plans can be added after setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  <p className="text-sm font-mono">{networkConfig.pool_name}: {networkConfig.pool_range}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">Server Name</p>
                  <p className="text-lg font-mono">{serverConfig.name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">DNS Server</p>
                  <p className="text-lg font-mono">{networkConfig.dns_server}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">Auth Methods</p>
                  <p className="text-sm font-mono">{serverConfig.login_by.join(", ")}</p>
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Before You Continue</AlertTitle>
                <AlertDescription className="text-amber-700">
                  This will create IP addresses, pools, and a hotspot server on the router. Existing configurations with the same names will be replaced. Ensure you have a backup.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button
                onClick={handleConfigureHotspot}
                disabled={isConfiguring}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConfiguring ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Apply Configuration</>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── Step: Applying ── */}
        {currentStep === "applying" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {configError ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                )}
                {configError ? "Configuration Error" : "Applying Configuration..."}
              </CardTitle>
              <CardDescription>
                {configError ? "An error occurred during provisioning." : "Setting up the hotspot on the router — do not close this page."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configProgress.length > 0 ? (
                <div className="space-y-3">
                  {configProgress.map((step, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
                      step.status === "success" ? "bg-green-50" :
                      step.status === "error" ? "bg-red-50" :
                      "bg-blue-50"
                    }`}>
                      {step.status === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : step.status === "error" ? (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{step.step}</p>
                        {step.detail && <p className="text-xs text-slate-600 mt-0.5">{step.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-slate-600">Connecting to router...</p>
                </div>
              )}

              {configError && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="w-4 h-4" />
                  <AlertTitle>Failed</AlertTitle>
                  <AlertDescription>{configError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            {configError && (
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentStep("review")}>Back to Review</Button>
                <Button onClick={handleConfigureHotspot}>
                  <RotateCcw className="w-4 h-4 mr-2" />Retry
                </Button>
              </CardFooter>
            )}
          </Card>
        )}

        {/* ── Step: Complete ── */}
        {currentStep === "complete" && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hotspot Configured Successfully!</h3>
              <p className="text-slate-600 mb-4">
                All provisioning steps completed. Your hotspot is now active on <span className="font-mono font-semibold">{selectedPort}</span>.
              </p>

              {configProgress.length > 0 && (
                <div className="max-w-md mx-auto mb-6">
                  {configProgress.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-left py-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700">{step.step}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={() => {
                setShowSetupWizard(false)
                fetchHotspotConfig()
              }} size="lg">
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
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Hotspot Configured</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            This router has no hotspot server running. Launch the setup wizard to configure a captive portal with IP pools, authentication, and branding.
          </p>
          <Button onClick={handleStartSetup} size="lg">
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
                <p className={`text-xl font-bold ${hotspotConfig?.server?.disabled ? "text-slate-500" : "text-green-600"}`}>
                  {hotspotConfig?.server?.disabled ? "Disabled" : "Active"}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                hotspotConfig?.server?.disabled ? "bg-slate-100" : "bg-green-100"
              }`}>
                {hotspotConfig?.server?.disabled ? (
                  <WifiOff className="w-5 h-5 text-slate-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
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
            {hotspotConfig?.server?.disabled ? (
              <Button onClick={handleEnableHotspot} disabled={isConfiguring} className="bg-green-600 hover:bg-green-700">
                {isConfiguring ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enabling...</>
                ) : (
                  <><Wifi className="w-4 h-4 mr-2" />Enable Hotspot</>
                )}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleDisableHotspot} disabled={isConfiguring}>
                {isConfiguring ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Disabling...</>
                ) : (
                  <>Disable Hotspot</>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hotspotConfig.server && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Server Name</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium">{hotspotConfig.server.name}</p>
                  <Badge variant={hotspotConfig.server.disabled ? "secondary" : "default"}>
                    {hotspotConfig.server.disabled ? "Disabled" : "Active"}
                  </Badge>
                </div>
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

// ==========================================
// Sub-component: Port Scan Result Card
// ==========================================

function ScanResultCard({
  result,
  showDetails,
  onToggleDetails,
}: {
  result: PortScanResponse
  showDetails: boolean
  onToggleDetails: () => void
}) {
  const statusBadge = (status: string) => {
    if (status === "open") return <Badge className="bg-green-500 hover:bg-green-600 text-xs">Open</Badge>
    if (status === "closed") return <Badge variant="secondary" className="text-xs">Closed</Badge>
    return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Filtered</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-4 rounded-lg text-center ${result.api_reachable ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <p className="text-xs font-medium text-slate-600 mb-1">API (8728)</p>
          <p className={`font-bold ${result.api_reachable ? "text-green-700" : "text-red-700"}`}>
            {result.api_reachable ? "Reachable" : "Closed"}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${result.winbox_reachable ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <p className="text-xs font-medium text-slate-600 mb-1">Winbox (8291)</p>
          <p className={`font-bold ${result.winbox_reachable ? "text-green-700" : "text-red-700"}`}>
            {result.winbox_reachable ? "Reachable" : "Closed"}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${result.web_reachable ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <p className="text-xs font-medium text-slate-600 mb-1">Web (80/443)</p>
          <p className={`font-bold ${result.web_reachable ? "text-green-700" : "text-red-700"}`}>
            {result.web_reachable ? "Reachable" : "Closed"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Target: <span className="font-mono">{result.target_ip}</span></span>
        <span>{result.open_count} / {result.results.length} ports open</span>
      </div>

      {/* Expandable detail table */}
      <Button variant="ghost" size="sm" onClick={onToggleDetails} className="w-full">
        {showDetails ? (
          <><ChevronUp className="w-4 h-4 mr-2" />Hide Port Details</>
        ) : (
          <><ChevronDown className="w-4 h-4 mr-2" />Show Port Details</>
        )}
      </Button>

      {showDetails && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Port</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.results.map((r) => (
              <TableRow key={r.port}>
                <TableCell className="font-mono">{r.port}</TableCell>
                <TableCell>{r.service}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {r.latency_ms !== null ? `${r.latency_ms} ms` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}