"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Network,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
  Server,
  Globe,
  Wifi,
  Shield,
  Info,
  Zap,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"

// ==========================================
// TYPES
// ==========================================

interface IPAMOption {
  value: string
  label: string
}

interface CalculatedNetwork {
  interface_address: string
  network: string
  gateway: string
  pool_range: string
  broadcast: string
  total_hosts: number
  usable_hosts: number
  subnet_mask: string
}

interface IPAMConfig {
  base_ip: string
  subnet_cidr: number
  calculated: CalculatedNetwork
  options: {
    base_ips: IPAMOption[]
    cidrs: { value: number; label: string }[]
  }
}

interface RouterHotspotIPConfigTabProps {
  routerId: number
  isDemo?: boolean
}

// ==========================================
// CONSTANTS
// ==========================================

const BASE_IP_DESCRIPTIONS: Record<string, { tag: string; desc: string; color: string }> = {
  "172.12.0.1":    { tag: "Recommended", desc: "Best for large public hotspots", color: "bg-success/15 text-success" },
  "192.168.88.1":  { tag: "MikroTik",    desc: "MikroTik factory default",       color: "bg-primary/15 text-primary" },
  "192.168.0.1":   { tag: "Home",        desc: "Common in home routers",          color: "bg-slate-100 text-slate-700" },
  "10.0.0.1":      { tag: "Enterprise",  desc: "Enterprise / data center use",    color: "bg-purple-100 text-purple-700" },
  "172.16.0.1":    { tag: "Private",     desc: "RFC 1918 private range",          color: "bg-warning/15 text-warning" },
  "192.168.100.1": { tag: "Alt",         desc: "Alternative private range",       color: "bg-slate-100 text-slate-700" },
}

const CIDR_DESCRIPTIONS: Record<number, { use: string; color: string }> = {
  8:  { use: "Massive ISP infrastructure",  color: "bg-destructive/15 text-destructive" },
  12: { use: "Regional ISP networks",       color: "bg-warning/15 text-warning" },
  16: { use: "Large public hotspots",        color: "bg-success/15 text-success" },
  20: { use: "Medium venues / campuses",     color: "bg-primary/15 text-primary" },
  24: { use: "Small office / café WiFi",     color: "bg-slate-100 text-slate-700" },
  28: { use: "Tiny / test networks",         color: "bg-gray-100 text-gray-600" },
}

// ==========================================
// COMPONENT
// ==========================================

export function RouterHotspotIPConfigTab({ routerId, isDemo = false }: RouterHotspotIPConfigTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Current saved config
  const [config, setConfig] = useState<IPAMConfig | null>(null)

  // User selections (local edits)
  const [selectedIP, setSelectedIP] = useState("172.12.0.1")
  const [selectedCIDR, setSelectedCIDR] = useState(16)

  // Preview result
  const [preview, setPreview] = useState<CalculatedNetwork | null>(null)

  // Track if user has changed values from saved
  const [isDirty, setIsDirty] = useState(false)

  // Track if we're actually in demo mode (API unavailable)
  const [actuallyDemo, setActuallyDemo] = useState(false)

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Always try real API first, regardless of parent isDemo flag
      try {
        const data = await adminApi.getRouterHotspotIPAM(routerId)
        setConfig(data)
        setSelectedIP(data.base_ip)
        setSelectedCIDR(data.subnet_cidr)
        setPreview(data.calculated)
        setActuallyDemo(false)
        return
      } catch (apiErr: any) {
        // If parent says demo, use fallback; otherwise show the error
        if (!isDemo) {
          throw apiErr
        }
      }

      // Fallback to demo data only if API is down AND parent says demo
      const demoConfig: IPAMConfig = {
        base_ip: "172.12.0.1",
        subnet_cidr: 16,
        calculated: {
          interface_address: "172.12.0.1/16",
          network: "172.12.0.0",
          gateway: "172.12.0.1",
          pool_range: "172.12.0.10-172.12.255.254",
          broadcast: "172.12.255.255",
          total_hosts: 65534,
          usable_hosts: 65524,
          subnet_mask: "255.255.0.0",
        },
        options: {
          base_ips: [
            { value: "172.12.0.1",    label: "172.12.0.1 (Recommended for Hotspot)" },
            { value: "192.168.88.1",  label: "192.168.88.1 (MikroTik Default)" },
            { value: "192.168.0.1",   label: "192.168.0.1 (Common Home Router)" },
            { value: "10.0.0.1",      label: "10.0.0.1 (Enterprise Network)" },
            { value: "172.16.0.1",    label: "172.16.0.1 (Private Network)" },
            { value: "192.168.100.1", label: "192.168.100.1 (Alternative)" },
          ],
          cidrs: [
            { value: 8,  label: "/8 (16,777,214 Hosts)" },
            { value: 12, label: "/12 (1,048,574 Hosts)" },
            { value: 16, label: "/16 (65,534 Hosts - Default)" },
            { value: 20, label: "/20 (4,094 Hosts)" },
            { value: 24, label: "/24 (254 Hosts)" },
            { value: 28, label: "/28 (14 Hosts)" },
          ],
        },
      }
      setConfig(demoConfig)
      setSelectedIP(demoConfig.base_ip)
      setSelectedCIDR(demoConfig.subnet_cidr)
      setPreview(demoConfig.calculated)
      setActuallyDemo(true)
    } catch (err: any) {
      setError(err.message || "Failed to load hotspot IP config")
    } finally {
      setIsLoading(false)
    }
  }, [routerId, isDemo])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleIPChange = (ip: string) => {
    setSelectedIP(ip)
    setIsDirty(ip !== config?.base_ip || selectedCIDR !== config?.subnet_cidr)
    // Auto-preview on change
    handlePreview(ip, selectedCIDR)
  }

  const handleCIDRChange = (cidr: string) => {
    const cidrNum = parseInt(cidr)
    setSelectedCIDR(cidrNum)
    setIsDirty(selectedIP !== config?.base_ip || cidrNum !== config?.subnet_cidr)
    // Auto-preview on change
    handlePreview(selectedIP, cidrNum)
  }

  const handlePreview = async (ip: string, cidr: number) => {
    try {
      setIsPreviewing(true)
      if (actuallyDemo) {
        // Simple demo calculation
        setPreview({
          interface_address: `${ip}/${cidr}`,
          network: ip.replace(/\.\d+$/, ".0"),
          gateway: ip,
          pool_range: `${ip.replace(/\.\d+$/, ".10")}-${ip.replace(/\.\d+$/, ".254")}`,
          broadcast: ip.replace(/\.\d+$/, ".255"),
          total_hosts: cidr === 16 ? 65534 : cidr === 24 ? 254 : cidr === 20 ? 4094 : cidr === 8 ? 16777214 : cidr === 12 ? 1048574 : 14,
          usable_hosts: cidr === 16 ? 65524 : cidr === 24 ? 244 : cidr === 20 ? 4084 : cidr === 8 ? 16777204 : cidr === 12 ? 1048564 : 4,
          subnet_mask: cidr === 16 ? "255.255.0.0" : cidr === 24 ? "255.255.255.0" : "varies",
        })
        return
      }
      const data = await adminApi.previewRouterHotspotIPAM(routerId, ip, cidr)
      setPreview(data.calculated)
    } catch (err: any) {
      toast.error("Preview failed", { description: err.message })
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      if (actuallyDemo) {
        toast.success("Demo mode — configuration not applied")
        setIsDirty(false)
        return
      }

      const result = await adminApi.applyRouterHotspotIPAM(routerId, selectedIP, selectedCIDR)

      if (result.success) {
        if (result.applied) {
          toast.success("Network Config Applied!", {
            description: `Hotspot IPAM updated to ${selectedIP}/${selectedCIDR} on the live router.`,
          })
        } else {
          toast.success("Configuration Saved", {
            description: "Router is offline. Config will be applied when it comes online.",
          })
        }

        // Refresh the config
        setIsDirty(false)
        await fetchConfig()
      } else {
        toast.error("Failed to apply config", {
          description: result.message || "Unknown error",
        })
      }
    } catch (err: any) {
      toast.error("Save failed", { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  // ==========================================
  // RENDER: Loading
  // ==========================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const cidrInfo = CIDR_DESCRIPTIONS[selectedCIDR]
  const ipInfo = BASE_IP_DESCRIPTIONS[selectedIP]

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/15 rounded-lg">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hotspot IP Configuration</h2>
            <p className="text-sm text-slate-500">
              Configure the IP address and subnet for this router&apos;s hotspot network
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchConfig()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="border-primary/20 bg-primary/10/50">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">How Hotspot IP Works</AlertTitle>
        <AlertDescription className="text-primary">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">/16</Badge>
              <span>Up to 65,534 devices</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">/24</Badge>
              <span>Up to 254 devices</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">/20</Badge>
              <span>Up to 4,094 devices</span>
            </div>
          </div>
          <p className="mt-2 text-xs">
            Use <strong>/16</strong> for large public hotspots, <strong>/24</strong> for small networks.
            Changes will disconnect all current devices briefly — they will auto-reconnect within 3 seconds.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══════════ LEFT: Configuration ═══════════ */}
        <div className="space-y-6">
          {/* Hotspot IP Address Dropdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Hotspot IP Address</CardTitle>
                  <CardDescription>Gateway IP for your hotspot network</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="base-ip">Select IP Address</Label>
                <Select value={selectedIP} onValueChange={handleIPChange}>
                  <SelectTrigger id="base-ip" className="font-mono">
                    <SelectValue placeholder="Select IP address" />
                  </SelectTrigger>
                  <SelectContent>
                    {(config?.options?.base_ips || [
                      { value: "172.12.0.1",    label: "172.12.0.1 (Recommended for Hotspot)" },
                      { value: "192.168.88.1",  label: "192.168.88.1 (MikroTik Default)" },
                      { value: "192.168.0.1",   label: "192.168.0.1 (Common Home Router)" },
                      { value: "10.0.0.1",      label: "10.0.0.1 (Enterprise Network)" },
                      { value: "172.16.0.1",    label: "172.16.0.1 (Private Network)" },
                      { value: "192.168.100.1", label: "192.168.100.1 (Alternative)" },
                    ]).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="font-mono">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {ipInfo && (
                <div className="flex items-center gap-2">
                  <Badge className={ipInfo.color}>{ipInfo.tag}</Badge>
                  <span className="text-xs text-slate-500">{ipInfo.desc}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subnet Mask Dropdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Subnet Mask</CardTitle>
                  <CardDescription>Number of available IP addresses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subnet-cidr">Select Subnet</Label>
                <Select value={selectedCIDR.toString()} onValueChange={handleCIDRChange}>
                  <SelectTrigger id="subnet-cidr" className="font-mono">
                    <SelectValue placeholder="Select subnet" />
                  </SelectTrigger>
                  <SelectContent>
                    {(config?.options?.cidrs || [
                      { value: 8,  label: "/8 (16,777,214 Hosts)" },
                      { value: 12, label: "/12 (1,048,574 Hosts)" },
                      { value: 16, label: "/16 (65,534 Hosts - Default)" },
                      { value: 20, label: "/20 (4,094 Hosts)" },
                      { value: 24, label: "/24 (254 Hosts)" },
                      { value: 28, label: "/28 (14 Hosts)" },
                    ]).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()} className="font-mono">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cidrInfo && (
                <div className="flex items-center gap-2">
                  <Badge className={cidrInfo.color}>Best for</Badge>
                  <span className="text-xs text-slate-500">{cidrInfo.use}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="pt-6">
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Applying to Router..." : isDirty ? "Save Network Config" : "No Changes"}
              </Button>
              {isDirty && (
                <p className="text-xs text-warning mt-2 text-center">
                  Unsaved changes — clicking save will update the live router
                </p>
              )}
              {!isDirty && config && (
                <p className="text-xs text-success mt-2 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Configuration is in sync with the router
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══════════ RIGHT: Preview / Calculated ═══════════ */}
        <div className="space-y-6">
          {/* Configured Range Banner */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-primary/80" />
                  <CardTitle className="text-white text-base">Configured Range</CardTitle>
                </div>
                {isPreviewing && <Loader2 className="w-4 h-4 animate-spin text-primary/80" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono tracking-wider text-primary/80">
                {preview?.interface_address || `${selectedIP}/${selectedCIDR}`}
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {preview?.usable_hosts?.toLocaleString() || "—"} usable host addresses
              </p>
            </CardContent>
          </Card>

          {/* Network Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-slate-600" />
                <div>
                  <CardTitle className="text-base">Network Preview</CardTitle>
                  <CardDescription>Calculated from your selections</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="space-y-3">
                  <NetworkDetailRow
                    label="Gateway"
                    value={preview.gateway}
                    badge="Router IP"
                    badgeColor="bg-success/15 text-success"
                  />
                  <Separator />
                  <NetworkDetailRow
                    label="Network Address"
                    value={preview.network}
                    badge="Network ID"
                    badgeColor="bg-slate-100 text-slate-600"
                  />
                  <Separator />
                  <NetworkDetailRow
                    label="Subnet Mask"
                    value={preview.subnet_mask}
                    badge={`/${selectedCIDR}`}
                    badgeColor="bg-primary/15 text-primary"
                  />
                  <Separator />
                  <NetworkDetailRow
                    label="Broadcast"
                    value={preview.broadcast}
                    badge="Last IP"
                    badgeColor="bg-warning/15 text-warning"
                  />
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-500">DHCP Pool Range</span>
                      <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
                        Pool
                      </Badge>
                    </div>
                    <p className="text-sm font-mono font-medium break-all">{preview.pool_range}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {preview.total_hosts?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">Total Hosts</p>
                    </div>
                    <div className="text-center p-3 bg-success/10 rounded-lg">
                      <p className="text-2xl font-bold text-success">
                        {preview.usable_hosts?.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">Usable (Pool)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Select an IP and subnet to see the preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning / Info box */}
          <Alert className="border-warning/20 bg-warning/10/50">
            <Zap className="h-4 w-4 text-warning" />
            <AlertTitle className="text-amber-900 text-sm">What happens when you save?</AlertTitle>
            <AlertDescription className="text-warning text-xs space-y-1">
              <p>1. IP Pool is updated (DHCP stays intact)</p>
              <p>2. Bridge interface gets the new IP</p>
              <p>3. DHCP server network is reconfigured</p>
              <p>4. Hotspot profile address is updated</p>
              <p>5. All DHCP leases are cleared (devices reconnect in ~3s)</p>
              <p className="pt-1 font-medium">
                RADIUS, WPA2, and Walled Garden remain unaffected.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function NetworkDetailRow({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string
  value: string
  badge: string
  badgeColor: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm text-slate-500">{label}</span>
        <p className="text-sm font-mono font-medium">{value}</p>
      </div>
      <Badge className={`${badgeColor} text-xs`}>{badge}</Badge>
    </div>
  )
}
