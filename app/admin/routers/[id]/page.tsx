"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Router as RouterIcon,
  RefreshCw,
  Power,
  Copy,
  Check,
  Wifi,
  Settings,
  Shield,
  Activity,
  Archive,
  Edit3,
  FileCode,
  Info,
  ExternalLink,
  AlertCircle,
  Users,
  Cpu,
  HardDrive,
  Globe,
  Loader2,
  Save,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

// Mock data - replace with API calls
const getMockRouterData = (id: string) => ({
  id,
  name: "MERAKII",
  model: "GrooveA 52 ac",
  ip: "10.10.148.22",
  hotspot_ip: "172.12.0.1/16",
  status: "offline",
  latency: 0,
  api_port: 8728,
  notification_number: "+254712345678",
  uptime: "45 days, 12:30:15",
  created_at: "1/4/2026",
  cpu_usage: 7,
  memory_usage: 65,
  connected_users: 0,
  total_users: 501,
  web_interface_url: "http://pani.co.ke:53089",
  winbox_url: "win.pani.co.ke:53089",
  uptime_monitoring: {
    online_events: 0,
    offline_events: 1,
    uptime_sla: 99.1395,
    total_events: 1,
  },
  hotspot_config: {
    name: "",
    phone_number: "",
    notification_message: "",
    enable_free_trial: false,
    login_template: "",
  },
  script_url: "https://server3.lipanet.com/download/script/4/merakiyouthgroup",
  script_content: `/tool fetch url="https://server3.lipanet.com/download/script/4/merakiyouthgroup" dst-path=lipanet.rsc; :delay 2s; /import lipanet.rsc;`,
  ports: [
    { name: "ether1", type: "ethernet", enabled: true, comment: "WAN" },
    { name: "ether2", type: "ethernet", enabled: true, comment: "LAN" },
    { name: "wlan1", type: "wireless", enabled: true, comment: "WiFi" },
  ],
  bandwidth: {
    current_download: 45.2,
    current_upload: 12.8,
    max_download: 100,
    max_upload: 50,
    daily_usage: "125 GB",
    monthly_usage: "2.4 TB",
  },
  firewall_rules: [
    { id: 1, chain: "input", action: "accept", protocol: "icmp", src: "any", dst: "any", enabled: true },
    { id: 2, chain: "input", action: "drop", protocol: "tcp", src: "any", dst: "any", enabled: true },
    { id: 3, chain: "forward", action: "accept", protocol: "all", src: "192.168.1.0/24", dst: "any", enabled: true },
  ],
  backups: [
    { id: 1, name: "backup-2026-01-05.backup", date: "2026-01-05 10:30", size: "2.4 MB", type: "auto" },
    { id: 2, name: "backup-2026-01-04.backup", date: "2026-01-04 10:30", size: "2.3 MB", type: "auto" },
    { id: 3, name: "pre-update-backup.backup", date: "2026-01-03 15:45", size: "2.4 MB", type: "manual" },
  ],
})

export default function RouterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRebooting, setIsRebooting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCheckingPorts, setIsCheckingPorts] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [routerData, setRouterData] = useState<any>(null)

  const [editForm, setEditForm] = useState({
    name: "",
    api_port: "",
    notification_number: "",
  })

  const [hotspotForm, setHotspotForm] = useState({
    name: "",
    phone_number: "",
    notification_message: "",
    enable_free_trial: false,
    login_template: "",
  })

  const fetchRouterData = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const data = getMockRouterData(params.id as string)
      setRouterData(data)
      setEditForm({
        name: data.name,
        api_port: data.api_port.toString(),
        notification_number: data.notification_number,
      })
      setHotspotForm(data.hotspot_config)
    } catch (error) {
      console.error("Failed to fetch router:", error)
      toast.error("Failed to load router data")
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchRouterData()
  }, [fetchRouterData])

  const handleSyncFiles = async () => {
    setIsSyncing(true)
    try {
      await new Promise(r => setTimeout(r, 2000))
      toast.success("Files synced successfully")
    } catch (error) {
      toast.error("Failed to sync files")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleReboot = async () => {
    setIsRebooting(true)
    try {
      await new Promise(r => setTimeout(r, 2000))
      toast.success("Reboot command sent")
    } catch (error) {
      toast.error("Failed to reboot router")
    } finally {
      setIsRebooting(false)
    }
  }

  const handleCopyScript = () => {
    if (routerData?.script_content) {
      navigator.clipboard.writeText(routerData.script_content)
      setCopied(true)
      toast.success("Script copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCheckRouter = async () => {
    toast.info("Checking router connection...")
  }

  const handleCheckPorts = async () => {
    setIsCheckingPorts(true)
    try {
      await new Promise(r => setTimeout(r, 2000))
      toast.success("Router ports checked")
    } catch (error) {
      toast.error("Failed to check ports")
    } finally {
      setIsCheckingPorts(false)
    }
  }

  const handleSaveHotspotSettings = async () => {
    setIsSaving(true)
    try {
      await new Promise(r => setTimeout(r, 1500))
      toast.success("Hotspot settings saved")
    } catch (error) {
      toast.error("Failed to save hotspot settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      await new Promise(r => setTimeout(r, 1500))
      toast.success("Router updated successfully")
    } catch (error) {
      toast.error("Failed to update router")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!routerData) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load router data</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="p-3 rounded-lg bg-primary text-primary-foreground">
              <RouterIcon className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{routerData.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline">{routerData.model}</Badge>
                <Badge variant="outline" className="font-mono">{routerData.ip}</Badge>
                <Badge variant="outline" className="font-mono text-blue-600">
                  Hotspot: {routerData.hotspot_ip}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSyncFiles}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync Files
              </Button>

              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleReboot}
                disabled={isRebooting}
              >
                {isRebooting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Power className="w-4 h-4 mr-2" />
                )}
                Reboot
              </Button>

              <Badge
                variant="outline"
                className={`px-3 py-1 ${
                  routerData.status === "online"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-red-100 text-red-700 border-red-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full mr-2 inline-block ${
                  routerData.status === "online" ? "bg-green-500" : "bg-red-500"
                }`} />
                {routerData.status === "online" ? "Online" : "Offline"}
              </Badge>

              <Badge variant="outline" className="px-3 py-1">
                Latency: {routerData.latency}ms
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="info" className="gap-2">
            <Info className="w-4 h-4" />
            Info
          </TabsTrigger>
          <TabsTrigger value="script" className="gap-2">
            <FileCode className="w-4 h-4" />
            Script
          </TabsTrigger>
          <TabsTrigger value="hotspot" className="gap-2">
            <Wifi className="w-4 h-4" />
            Hotspot
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="backups" className="gap-2">
            <Archive className="w-4 h-4" />
            Backups
          </TabsTrigger>
          <TabsTrigger value="bandwidth" className="gap-2">
            <Activity className="w-4 h-4" />
            Bandwidth
          </TabsTrigger>
          <TabsTrigger value="firewall" className="gap-2">
            <Shield className="w-4 h-4" />
            Firewall
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <Edit3 className="w-4 h-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-6 space-y-6">
          {/* Uptime Monitoring */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Uptime Monitoring</CardTitle>
                <Badge
                  variant="outline"
                  className={`${
                    routerData.uptime_monitoring.uptime_sla >= 99
                      ? "bg-green-100 text-green-700"
                      : routerData.uptime_monitoring.uptime_sla >= 95
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {routerData.uptime_monitoring.uptime_sla.toFixed(4)}% uptime
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-green-500 rounded-lg mb-6" />

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Offline</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-green-600">{routerData.uptime_monitoring.online_events}</p>
                  <p className="text-sm text-muted-foreground">Online Events</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">{routerData.uptime_monitoring.offline_events}</p>
                  <p className="text-sm text-muted-foreground">Offline Events</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{routerData.uptime_monitoring.uptime_sla.toFixed(4)}%</p>
                  <p className="text-sm text-muted-foreground">Uptime SLA</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{routerData.uptime_monitoring.total_events}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hotspot IP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Hotspot IP Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="font-medium">How Hotspot IP Works:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li><strong>/16 subnet</strong> - Supports up to 65,534 devices (e.g., 172.12.0.0/16)</li>
                  <li><strong>/24 subnet</strong> - Supports up to 254 devices (e.g., 192.168.10.0/24)</li>
                  <li><strong>/20 subnet</strong> - Supports up to 4,094 devices (e.g., 10.0.0.0/20)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Use /16 for large public hotspots, /24 for small networks</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hotspot IP Address</Label>
                  <Select defaultValue="172.12.0.1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="172.12.0.1">172.12.0.1 (Recommended for large hotspots)</SelectItem>
                      <SelectItem value="192.168.1.1">192.168.1.1</SelectItem>
                      <SelectItem value="10.0.0.1">10.0.0.1</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Gateway IP for your hotspot network</p>
                </div>

                <div className="space-y-2">
                  <Label>Subnet Mask</Label>
                  <Select defaultValue="/16">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/16">/16 - 65,534 hosts 🌟</SelectItem>
                      <SelectItem value="/20">/20 - 4,094 hosts</SelectItem>
                      <SelectItem value="/24">/24 - 254 hosts</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Number of max client IP addresses</p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Configured Range:</strong>
                  <span className="font-mono ml-2">172.12.0.1/16</span>
                </p>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Router Info & System Resources */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Router Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{routerData.model}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={routerData.status === "online" ? "bg-green-500" : "bg-red-500"}>
                    {routerData.status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="font-mono text-blue-600">{routerData.ip}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Connected Users</span>
                  <span className="font-medium">{routerData.connected_users}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{routerData.created_at}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <span className="font-medium">{routerData.cpu_usage}%</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Memory Usage</span>
                  <span className="font-medium">{routerData.memory_usage}%</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <span className="text-muted-foreground">Remote Access</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Web Interface</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{routerData.web_interface_url}</code>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit Site
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Winbox</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{routerData.winbox_url}</code>
                      <Button size="sm" variant="outline" onClick={() => {
                        navigator.clipboard.writeText(routerData.winbox_url)
                        toast.success("Copied!")
                      }}>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span>CPU Usage</span>
                    </div>
                    <span className="font-medium">{routerData.cpu_usage}%</span>
                  </div>
                  <Progress value={routerData.cpu_usage} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-600" />
                      <span>Memory Usage</span>
                    </div>
                    <span className="font-medium">{routerData.memory_usage}%</span>
                  </div>
                  <Progress value={routerData.memory_usage} className="h-2" />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span>Connected Users</span>
                    </div>
                    <span className="font-medium">{routerData.connected_users} / {routerData.total_users} users</span>
                  </div>
                  <Progress value={(routerData.connected_users / routerData.total_users) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Script Tab */}
        <TabsContent value="script" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Router Configuration Script</CardTitle>
                  <CardDescription>
                    Copy this script and paste it in your MikroTik terminal to authenticate this router
                  </CardDescription>
                </div>
                <Button onClick={handleCopyScript}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Script
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Script - Single Line */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Configuration Script</Label>
                <div className="relative">
                  <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>{routerData.script_content}</code>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleCopyScript}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Open your MikroTik terminal (via Winbox or SSH) and paste this command
                </p>
              </div>

              <Separator />

              {/* Instructions */}
              <div className="space-y-4">
                <h4 className="font-semibold">How to configure your router:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Open <strong>Winbox</strong> and connect to your MikroTik router</li>
                  <li>Go to <strong>New Terminal</strong> (or use SSH)</li>
                  <li>Copy the script above and paste it in the terminal</li>
                  <li>Press <strong>Enter</strong> to execute</li>
                  <li>Wait for the script to complete - your router will be authenticated automatically</li>
                </ol>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Getting "Not allowed by device mode" error?</AlertTitle>
                <AlertDescription className="text-yellow-700 space-y-2">
                  <p>Run this command first, then reboot your router:</p>
                  <div className="flex items-center gap-2 bg-white p-2 rounded border mt-2">
                    <code className="flex-1 text-sm font-mono text-slate-800">/system/device-mode update mode=advanced</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText("/system/device-mode update mode=advanced")
                        toast.success("Command copied")
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button onClick={handleCheckRouter}>
                  <RouterIcon className="w-4 h-4 mr-2" />
                  Check Router Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hotspot Tab */}
        <TabsContent value="hotspot" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Router Ports</CardTitle>
              <CardDescription>Select ports to configure for hotspot</CardDescription>
            </CardHeader>
            <CardContent>
              {routerData.ports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Port</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hotspot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routerData.ports.map((port: any) => (
                      <TableRow key={port.name}>
                        <TableCell className="font-medium">{port.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{port.type}</Badge>
                        </TableCell>
                        <TableCell>{port.comment}</TableCell>
                        <TableCell>
                          <Badge className={port.enabled ? "bg-green-100 text-green-700" : "bg-slate-100"}>
                            {port.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No ports detected. Click "Check Router Ports" to scan.
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Button onClick={handleCheckPorts} disabled={isCheckingPorts}>
                  {isCheckingPorts ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RouterIcon className="w-4 h-4 mr-2" />
                  )}
                  Check Router Ports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hotspot Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hotspot Name</Label>
                  <Input
                    placeholder="Enter hotspot name"
                    value={hotspotForm.name}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number (Customer Care)</Label>
                  <Input
                    placeholder="Enter phone number"
                    value={hotspotForm.phone_number}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Message</Label>
                <Textarea
                  placeholder="Enter notification message"
                  value={hotspotForm.notification_message}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, notification_message: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be displayed to customers on the interface when they are purchasing
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="free-trial"
                  checked={hotspotForm.enable_free_trial}
                  onCheckedChange={(checked) =>
                    setHotspotForm({ ...hotspotForm, enable_free_trial: checked as boolean })
                  }
                />
                <div>
                  <Label htmlFor="free-trial" className="cursor-pointer">Enable Free Trial</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow users to access the internet for free for a limited time
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Login Page Template</Label>
                <Select
                  value={hotspotForm.login_template}
                  onValueChange={(v) => setHotspotForm({ ...hotspotForm, login_template: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a login page template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Template</SelectItem>
                    <SelectItem value="modern">Modern Template</SelectItem>
                    <SelectItem value="minimal">Minimal Template</SelectItem>
                    <SelectItem value="branded">Branded Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveHotspotSettings} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Hotspot Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Router Backups</CardTitle>
                  <CardDescription>Manage and restore router configuration backups</CardDescription>
                </div>
                <Button>
                  <Archive className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Backup Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerData.backups.map((backup: any) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-mono text-sm">{backup.name}</TableCell>
                      <TableCell>{backup.date}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={backup.type === "auto" ? "bg-blue-50" : "bg-green-50"}>
                          {backup.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">Restore</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bandwidth Tab */}
        <TabsContent value="bandwidth" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Bandwidth Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Download</span>
                    <span className="font-medium">
                      {routerData.bandwidth.current_download} / {routerData.bandwidth.max_download} Mbps
                    </span>
                  </div>
                  <Progress
                    value={(routerData.bandwidth.current_download / routerData.bandwidth.max_download) * 100}
                    className="h-3"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Upload</span>
                    <span className="font-medium">
                      {routerData.bandwidth.current_upload} / {routerData.bandwidth.max_upload} Mbps
                    </span>
                  </div>
                  <Progress
                    value={(routerData.bandwidth.current_upload / routerData.bandwidth.max_upload) * 100}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold">{routerData.bandwidth.daily_usage}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">{routerData.bandwidth.monthly_usage}</p>
                  </div>
                  <Globe className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bandwidth History</CardTitle>
              <CardDescription>Last 7 days bandwidth usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Bandwidth chart will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firewall Tab */}
        <TabsContent value="firewall" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Firewall Rules</CardTitle>
                  <CardDescription>Manage router firewall configuration</CardDescription>
                </div>
                <Button>
                  <Shield className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerData.firewall_rules.map((rule: any) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.chain}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            rule.action === "accept"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {rule.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.protocol}</TableCell>
                      <TableCell className="font-mono text-sm">{rule.src}</TableCell>
                      <TableCell className="font-mono text-sm">{rule.dst}</TableCell>
                      <TableCell>
                        <Badge className={rule.enabled ? "bg-green-500" : "bg-slate-400"}>
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline" className="text-red-600">Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="mt-6">
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Limited Editing</AlertTitle>
            <AlertDescription className="text-yellow-700">
              You can only edit the router name and API port. For advanced configuration, please use the router's web interface.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Router Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">The display name for this router in the dashboard</p>
                </div>
                <div className="space-y-2">
                  <Label>API Port</Label>
                  <Input
                    value={editForm.api_port}
                    onChange={(e) => setEditForm({ ...editForm, api_port: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Default MikroTik API port is 8728 (8729 for secure API)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Number</Label>
                <Input
                  value={editForm.notification_number}
                  onChange={(e) => setEditForm({ ...editForm, notification_number: e.target.value })}
                  placeholder="+254712345678"
                />
                <p className="text-xs text-muted-foreground">Phone number for router notifications and alerts</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
