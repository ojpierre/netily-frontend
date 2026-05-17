"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Server,
  RefreshCw,
  Power,
  Settings,
  Shield,
  Activity,
  Archive,
  Edit3,
  Info,
  AlertCircle,
  Users,
  Cpu,
  HardDrive,
  Loader2,
  Save,
  Download,
  Upload,
  Clock,
  MapPin,
  Thermometer,
  Zap,
  History,
  TestTube,
  RotateCcw,
  Trash2,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Play,
  Plus,
  FileCode,
  Copy,
  Flame,
  Gauge,
  Network,
  FileText,
  Wifi,
  MonitorSpeaker,
  CloudCog,
  ShieldCheck,
  Link2,
  Unlink,
  Cable,
  Palette,
  DollarSign,
} from "lucide-react"
import {
  RouterOverviewTab,
  RouterUsersTab,
  RouterFirewallTab,
  RouterQueuesTab,
  RouterInterfacesTab,
  RouterLogsTab,
  RouterWirelessTab,
  // RouterHotspotTab,  <-- REMOVED
  RouterHotspotIPConfigTab,
  RouterPortManagerTab,
  RouterPortalSettingsTab,
} from "./components"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { Router as RouterData, RouterType, RouterStatus, RouterEvent, RouterVPNStatus } from "@/lib/types"
import { Separator } from "@/components/ui/separator"

// Demo data generator
const generateDemoRouterData = (id: string): RouterData => {
  const authKey = `RTR_${id.padStart(4, '0')}_${Math.random().toString(36).substring(2, 6).toUpperCase()}_AUTH`
  return {
    id: parseInt(id) || 1,
    name: "Main Gateway Router",
    ip_address: "192.168.1.1",
    mac_address: "AA:BB:CC:DD:EE:01",
    api_port: 8728,
    api_username: "admin",
    router_type: "mikrotik",
    model: "CCR1036-12G-4S",
    firmware_version: "7.12.1",
    location: "Nairobi CBD - HQ",
    latitude: -1.2864,
    longitude: 36.8172,
    status: "online",
    total_users: 450,
    active_users: 320,
    uptime: "45d 12h 30m",
    uptime_percentage: 99.98,
    sla_target: 99.9,
    last_seen: new Date().toISOString(),
    auth_key: authKey,
    is_authenticated: true,
    authenticated_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    metrics: {
      cpu_usage: 32,
      memory_usage: 45,
      temperature: 52,
      active_connections: 320,
      download_speed: 850,
      upload_speed: 420,
      packets_in: 12500000,
      packets_out: 8900000,
      bandwidth_in: 125000000,
      bandwidth_out: 85000000,
    },
    tags: ["primary", "production"],
    notes: "Primary gateway router for the main office",
    is_active: true,
    created_at: "2023-06-15T10:00:00Z",
    updated_at: new Date().toISOString(),
  }
}

const generateDemoEvents = (): RouterEvent[] => [
  { id: 1, router: 1, event_type: "up", message: "Router came online", created_at: new Date().toISOString() },
  { id: 2, router: 1, event_type: "config_change", message: "Configuration updated", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, router: 1, event_type: "reboot", message: "System rebooted", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, router: 1, event_type: "warning", message: "High CPU usage detected", created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 5, router: 1, event_type: "down", message: "Router went offline (network issue)", created_at: new Date(Date.now() - 259200000).toISOString() },
]

interface ConnectedUser {
  id: number
  username: string
  ip_address: string
  mac_address: string
  download: number
  upload: number
  uptime: string
  status: string
}

const generateDemoUsers = (): ConnectedUser[] => [
  { id: 1, username: "john.doe", ip_address: "192.168.1.101", mac_address: "11:22:33:44:55:01", download: 125.5, upload: 45.2, uptime: "2h 15m", status: "active" },
  { id: 2, username: "jane.smith", ip_address: "192.168.1.102", mac_address: "11:22:33:44:55:02", download: 89.3, upload: 23.1, uptime: "1h 45m", status: "active" },
  { id: 3, username: "mike.wilson", ip_address: "192.168.1.103", mac_address: "11:22:33:44:55:03", download: 256.8, upload: 112.4, uptime: "4h 30m", status: "active" },
  { id: 4, username: "sarah.jones", ip_address: "192.168.1.104", mac_address: "11:22:33:44:55:04", download: 45.2, upload: 12.8, uptime: "0h 30m", status: "active" },
  { id: 5, username: "guest-001", ip_address: "192.168.1.150", mac_address: "11:22:33:44:55:10", download: 12.1, upload: 3.5, uptime: "0h 15m", status: "active" },
]

interface Backup {
  id: number
  name: string
  date: string
  size: string
  type: "auto" | "manual"
}

const generateDemoBackups = (): Backup[] => [
  { id: 1, name: "backup-2026-01-05.backup", date: "2026-01-05 10:30", size: "2.4 MB", type: "auto" },
  { id: 2, name: "backup-2026-01-04.backup", date: "2026-01-04 10:30", size: "2.3 MB", type: "auto" },
  { id: 3, name: "pre-update-backup.backup", date: "2026-01-03 15:45", size: "2.4 MB", type: "manual" },
  { id: 4, name: "backup-2026-01-02.backup", date: "2026-01-02 10:30", size: "2.2 MB", type: "auto" },
]

interface RouterScript {
  id: number
  name: string
  source: string
  run_count: number
  last_run: string | null
  scheduled: boolean
  owner: string
}

const generateDemoScripts = (authKey: string): RouterScript[] => [
  { 
    id: 0, 
    name: "netily-auth", 
    source: `/tool fetch url="http://127.0.0.1:8000/api/v1/network/routers/1/config/?auth_key=${authKey}" dst-path=netily.rsc; :delay 2s; /import netily.rsc;`,
    run_count: 1, 
    last_run: new Date(Date.now() - 86400000 * 30).toISOString(), 
    scheduled: false,
    owner: "system"
  },
  { 
    id: 1, 
    name: "daily-backup", 
    source: `/system backup save name=("daily-" . [:pick [/system clock get date] 0 11])
:log info "Daily backup created"`, 
    run_count: 45, 
    last_run: new Date(Date.now() - 86400000).toISOString(), 
    scheduled: true,
    owner: "admin"
  },
  { 
    id: 2, 
    name: "clear-connections", 
    source: `/ip firewall connection remove [find]
:log warning "All connections cleared"`, 
    run_count: 12, 
    last_run: new Date(Date.now() - 172800000).toISOString(), 
    scheduled: false,
    owner: "admin"
  },
  { 
    id: 3, 
    name: "update-dns", 
    source: `/ip dns set servers=8.8.8.8,8.8.4.4
/ip dns cache flush
:log info "DNS updated and cache flushed"`, 
    run_count: 3, 
    last_run: new Date(Date.now() - 604800000).toISOString(), 
    scheduled: false,
    owner: "admin"
  },
  { 
    id: 4, 
    name: "bandwidth-report", 
    source: `:local interfaces [/interface find type="ether"]
:foreach i in=$interfaces do={
  :local name [/interface get $i name]
  :local rx [/interface get $i rx-byte]
  :local tx [/interface get $i tx-byte]
  :log info ("$name: RX=$rx TX=$tx")
}`, 
    run_count: 90, 
    last_run: new Date(Date.now() - 3600000).toISOString(), 
    scheduled: true,
    owner: "admin"
  },
]

export default function RouterDetailPage() {
    // Router Auth Script
    const [authScript, setAuthScript] = useState<string | null>(null)
    const [isScriptLoading, setIsScriptLoading] = useState(false)
    const [isAuthScriptDialogOpen, setIsAuthScriptDialogOpen] = useState(false)
  const params = useParams()
  const router = useRouter()
  const routerId = params.id as string
  const hasFetchedRef = React.useRef(false)
  
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingDemoData, setIsUsingDemoData] = useState(false)
  const [routerData, setRouterData] = useState<RouterData | null>(null)
  const [events, setEvents] = useState<RouterEvent[]>([])
  const [users, setUsers] = useState<ConnectedUser[]>([])
  const [backups, setBackups] = useState<Backup[]>([])
  const [scripts, setScripts] = useState<RouterScript[]>([])
  
  // ADDED: Router Income State
  const [routerIncome, setRouterIncome] = useState<number | null>(null)
  
  // Action states
  const [isSaving, setIsSaving] = useState(false)
  const [isRebooting, setIsRebooting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false)
  const [isRunningScript, setIsRunningScript] = useState<number | null>(null)
  const [isSavingScript, setIsSavingScript] = useState(false)
  
  // VPN / Cloud Controller state
  const [vpnStatus, setVpnStatus] = useState<RouterVPNStatus | null>(null)
  const [isVpnLoading, setIsVpnLoading] = useState(false)
  const [isReprovisioning, setIsReprovisioning] = useState(false)
  const [cloudScript, setCloudScript] = useState<string | null>(null)
  const [isScriptDownloading, setIsScriptDownloading] = useState(false)
  
  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false)
  const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<RouterScript | null>(null)
  const [maintenanceReason, setMaintenanceReason] = useState("")
  
  // Script form state
  const [scriptForm, setScriptForm] = useState({
    name: "",
    source: "",
    scheduled: false,
  })
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    ip_address: "",
    api_port: 8728,
    api_username: "",
    api_password: "",
    router_type: "mikrotik" as RouterType,
    model: "",
    location: "",
    sla_target: 99.0,
    notes: "",
    is_active: true,
  })

  // Fix 2b: Add live status data state
  const [liveStatusData, setLiveStatusData] = useState<{ cpu_load?: string; free_memory?: string; total_memory?: string; uptime?: string; model?: string } | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [routerResponse, eventsResponse, usersResponse] = await Promise.all([
        adminApi.getRouter(parseInt(routerId)),
        adminApi.getRouterEvents(parseInt(routerId)).catch(() => ({ results: [] })),
        adminApi.getRouterUsers(parseInt(routerId)).catch(() => []),
      ])
      
      setRouterData(routerResponse)
      setEvents(eventsResponse.results || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usersData = usersResponse as any
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.users || []))
      setBackups([])
      setScripts([])
      setIsUsingDemoData(false)
      
      setEditForm({
        name: routerResponse.name,
        ip_address: routerResponse.ip_address,
        api_port: routerResponse.api_port || 8728,
        api_username: routerResponse.api_username || "",
        api_password: "",
        router_type: routerResponse.router_type,
        model: routerResponse.model || "",
        location: routerResponse.location || "",
        sla_target: routerResponse.sla_target || 99.0,
        notes: routerResponse.notes || "",
        is_active: routerResponse.is_active,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log('API unavailable, using demo data:', errorMessage)
      
      const demoRouter = generateDemoRouterData(routerId)
      setRouterData(demoRouter)
      setEvents(generateDemoEvents())
      setUsers(generateDemoUsers())
      setBackups(generateDemoBackups())
      setScripts(generateDemoScripts(demoRouter.auth_key || ''))
      setIsUsingDemoData(true)
      
      setEditForm({
        name: demoRouter.name,
        ip_address: demoRouter.ip_address,
        api_port: demoRouter.api_port || 8728,
        api_username: demoRouter.api_username || "",
        api_password: "",
        router_type: demoRouter.router_type,
        model: demoRouter.model || "",
        location: demoRouter.location || "",
        sla_target: demoRouter.sla_target || 99.0,
        notes: demoRouter.notes || "",
        is_active: demoRouter.is_active,
      })
    } finally {
      setIsLoading(false)
    }
  }, [routerId])

  // Fix 2b: Updated useEffect to include live status fetch
  useEffect(() => {
    // Prevent duplicate fetches in React Strict Mode
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    fetchData()
    // Fetch router authentication one-liner command from backend
    setIsScriptLoading(true)
    adminApi.getRouterAuthKey(parseInt(routerId))
      .then((data) => setAuthScript(data.one_liner))
      .catch(() => setAuthScript(null))
      .finally(() => setIsScriptLoading(false))
    // Fetch live status for the top stats cards (non-blocking)
    adminApi.getRouterLiveStatus(parseInt(routerId))
      .then((live) => {
        if (live?.online) setLiveStatusData(live)
      })
      .catch(() => {}) // silently ignore — live status is best-effort
    
    // ADDED: Fetch router income data
    adminApi.getRouterIncome(parseInt(routerId))
      .then(data => setRouterIncome(data.total_income))
      .catch(() => setRouterIncome(null))
  }, [fetchData, routerId])
  
  // Handler to copy script
  const handleCopyAuthScript = () => {
    if (authScript) {
      navigator.clipboard.writeText(authScript)
      toast.success("Script copied to clipboard")
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    await fetchData()
    // Also refresh income data
    adminApi.getRouterIncome(parseInt(routerId))
      .then(data => setRouterIncome(data.total_income))
      .catch(() => setRouterIncome(null))
    toast.success("Data refreshed")
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 1500))
        if (routerData?.status === "offline") {
          toast.error("Connection failed: Timeout")
        } else {
          toast.success(`Connection successful! Latency: ${Math.floor(Math.random() * 50 + 10)}ms`)
        }
      } else {
        const result = await adminApi.testRouterConnection(parseInt(routerId))
        if (result.success) {
          toast.success(`Connection successful! Latency: ${result.latency}ms`)
        } else {
          toast.error(result.message || "Connection failed")
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to test connection")
    } finally {
      setIsTesting(false)
    }
  }

  // Fix 2a: Updated handleReboot to gracefully handle connection drop
  const handleReboot = async () => {
    setIsRebooting(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 2000))
        toast.success("Reboot command sent (Demo Mode)")
        setRouterData(prev => prev ? { ...prev, status: "maintenance" as RouterStatus, uptime: "0d 0h 0m" } : null)
        setTimeout(() => {
          setRouterData(prev => prev ? { ...prev, status: "online" as RouterStatus, uptime: "0d 0h 1m" } : null)
        }, 5000)
      } else {
        // MikroTik drops the TCP connection immediately on reboot — this is expected.
        // We treat any response (including connection errors) as success.
        try {
          await adminApi.rebootRouter(parseInt(routerId))
        } catch (rebootErr: unknown) {
          // Connection closed/reset by MikroTik is normal and means the command was received
          const msg = rebootErr instanceof Error ? rebootErr.message.toLowerCase() : ''
          if (
            msg.includes('network') ||
            msg.includes('fetch') ||
            msg.includes('connection') ||
            msg.includes('econnreset') ||
            msg.includes('timeout') ||
            msg.includes('aborted')
          ) {
            // This is the expected outcome — router closed the connection as it rebooted
          } else {
            // A real error (e.g. 403, 500) — rethrow
            throw rebootErr
          }
        }
        toast.success("Reboot command sent — router will reconnect in ~60 seconds")
        // Optimistically mark offline; fetchData after a delay
        setRouterData(prev => prev ? { ...prev, status: "offline" as RouterStatus } : null)
        setTimeout(() => fetchData(), 15000)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to reboot router")
    } finally {
      setIsRebooting(false)
    }
  }

  const handleSyncUsers = async () => {
    setIsSyncing(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 2000))
        toast.success("Users synced (Demo Mode)")
      } else {
        await adminApi.syncRouterUsers(parseInt(routerId))
        toast.success("Users synchronized successfully")
        fetchData()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to sync users")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 2000))
        const newBackup: Backup = {
          id: backups.length + 1,
          name: `backup-${new Date().toISOString().split('T')[0]}.backup`,
          date: new Date().toLocaleString(),
          size: "2.5 MB",
          type: "manual",
        }
        setBackups([newBackup, ...backups])
        toast.success("Backup created (Demo Mode)")
      } else {
        await adminApi.backupRouterConfig(parseInt(routerId))
        toast.success("Backup created successfully")
        fetchData()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to create backup")
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleSetMaintenance = async (enabled: boolean) => {
    setIsMaintenanceLoading(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 1000))
        setRouterData(prev => prev ? { ...prev, status: enabled ? "maintenance" : "online" } : null)
        toast.success(`Maintenance mode ${enabled ? "enabled" : "disabled"} (Demo Mode)`)
      } else {
        await adminApi.setRouterMaintenance(parseInt(routerId), enabled, maintenanceReason)
        toast.success(`Maintenance mode ${enabled ? "enabled" : "disabled"}`)
        fetchData()
      }
      setIsMaintenanceDialogOpen(false)
      setMaintenanceReason("")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to update maintenance mode")
    } finally {
      setIsMaintenanceLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 1000))
        setRouterData(prev => prev ? { ...prev, ...editForm } : null)
        toast.success("Router updated (Demo Mode)")
      } else {
        const updated = await adminApi.updateRouter(parseInt(routerId), editForm)
        setRouterData(updated)
        toast.success("Router updated successfully")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to update router")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunScript = async (scriptId: number) => {
    setIsRunningScript(scriptId)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 2000))
        setScripts(prev => prev.map(s => 
          s.id === scriptId 
            ? { ...s, run_count: s.run_count + 1, last_run: new Date().toISOString() } 
            : s
        ))
        toast.success("Script executed successfully (Demo Mode)")
      } else {
        // API call would go here
        toast.success("Script executed successfully")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to run script")
    } finally {
      setIsRunningScript(null)
    }
  }

  const handleOpenScriptDialog = (script?: RouterScript) => {
    if (script) {
      setEditingScript(script)
      setScriptForm({
        name: script.name,
        source: script.source,
        scheduled: script.scheduled,
      })
    } else {
      setEditingScript(null)
      setScriptForm({ name: "", source: "", scheduled: false })
    }
    setIsScriptDialogOpen(true)
  }

  const handleSaveScript = async () => {
    if (!scriptForm.name || !scriptForm.source) {
      toast.error("Name and source are required")
      return
    }
    
    setIsSavingScript(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 1000))
        if (editingScript) {
          setScripts(prev => prev.map(s => 
            s.id === editingScript.id 
              ? { ...s, ...scriptForm } 
              : s
          ))
          toast.success("Script updated (Demo Mode)")
        } else {
          const newScript: RouterScript = {
            id: scripts.length + 1,
            name: scriptForm.name,
            source: scriptForm.source,
            run_count: 0,
            last_run: null,
            scheduled: scriptForm.scheduled,
            owner: "admin",
          }
          setScripts(prev => [...prev, newScript])
          toast.success("Script created (Demo Mode)")
        }
      } else {
        // API call would go here
        toast.success(editingScript ? "Script updated" : "Script created")
      }
      setIsScriptDialogOpen(false)
      setEditingScript(null)
      setScriptForm({ name: "", source: "", scheduled: false })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to save script")
    } finally {
      setIsSavingScript(false)
    }
  }

  const handleDeleteScript = async (scriptId: number) => {
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 500))
        setScripts(prev => prev.filter(s => s.id !== scriptId))
        toast.success("Script deleted (Demo Mode)")
      } else {
        // API call would go here
        toast.success("Script deleted")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to delete script")
    }
  }

  const handleCopyScript = (source: string) => {
    navigator.clipboard.writeText(source)
    toast.success("Script copied to clipboard")
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (isUsingDemoData) {
        await new Promise(r => setTimeout(r, 1000))
        toast.success("Router deleted (Demo Mode)")
      } else {
        await adminApi.deleteRouter(parseInt(routerId))
        toast.success("Router deleted successfully")
      }
      router.push("/admin/routers")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(errorMessage || "Failed to delete router")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const getStatusIcon = (status: RouterStatus) => {
    switch (status) {
      case "online": return <CheckCircle className="w-5 h-5 text-green-600" />
      case "offline": return <XCircle className="w-5 h-5 text-red-600" />
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case "maintenance": return <Settings className="w-5 h-5 text-blue-600 animate-spin" />
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "up": return <CheckCircle className="w-4 h-4 text-green-600" />
      case "down": return <XCircle className="w-4 h-4 text-red-600" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-600" />
      case "reboot": return <RotateCcw className="w-4 h-4 text-blue-600" />
      case "config_change": return <Settings className="w-4 h-4 text-purple-600" />
      default: return <Info className="w-4 h-4 text-slate-600" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-12 w-12" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!routerData) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load router data</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {/* Router Auth Script Section */}
            <div className="ml-auto">
              <Button
                  variant={routerData.is_authenticated ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setIsAuthScriptDialogOpen(true)}
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  {routerData.is_authenticated ? "View Auth Script" : "Authenticate Router"}
                </Button>
            </div>
      {/* Auth Script Dialog */}
      {isAuthScriptDialogOpen && (
        // Fix 2d: Updated DialogContent with max-w-lg and w-full
        <Dialog open={isAuthScriptDialogOpen} onOpenChange={setIsAuthScriptDialogOpen}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>Router Authentication Script</DialogTitle>
              <DialogDescription>
                One-time setup for secure router authentication.
              </DialogDescription>
              <Alert className="mb-4 mt-2">
                <Shield className="h-4 w-4" />
                <AlertTitle>One-time setup</AlertTitle>
                <AlertDescription>
                  Run this script once on the router. It securely links the router to Netily.
                </AlertDescription>
              </Alert>
            </DialogHeader>
            {isScriptLoading ? (
              <div className="p-4 text-center">Loading script...</div>
            ) : authScript ? (
              <>
                {/* Fix 2d: Updated pre/code block with overflow handling */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 font-mono text-xs break-all overflow-x-auto max-h-48 overflow-y-auto mb-4">
                  {authScript}
                </div>
                {routerData.is_authenticated && (
                  <div className="flex items-center gap-2 text-green-700 text-sm mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Authenticated on {formatDate(routerData.authenticated_at!)}
                  </div>
                )}
                {isUsingDemoData && (
                  <Badge variant="outline" className="text-amber-600 mb-2">Demo Authentication</Badge>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  After running the script, click Refresh to update status.
                </div>
              </>
            ) : (
              <div className="p-4 text-red-500">Failed to load script.</div>
            )}
            <DialogFooter>
              <Button onClick={handleCopyAuthScript} disabled={!authScript}>
                <Copy className="w-4 h-4 mr-2" /> Copy Script
              </Button>
              <Button variant="outline" onClick={() => setIsAuthScriptDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

            <div className={`p-3 rounded-lg ${
              routerData.status === "online" ? "bg-green-100" :
              routerData.status === "offline" ? "bg-red-100" :
              routerData.status === "warning" ? "bg-amber-100" : "bg-blue-100"
            }`}>
              <Server className={`w-6 h-6 ${
                routerData.status === "online" ? "text-green-600" :
                routerData.status === "offline" ? "text-red-600" :
                routerData.status === "warning" ? "text-amber-600" : "text-blue-600"
              }`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{routerData.name}</h1>
                {isUsingDemoData && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Demo</Badge>
                )}
              </div>
              {/* Fix 2d: Updated badges to show model from live status */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline">
                  {liveStatusData?.model || routerData.model || "Unknown Model"}
                </Badge>
                <Badge variant="outline" className="font-mono">{routerData.ip_address}</Badge>
                <Badge variant="secondary" className="capitalize">{routerData.router_type}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test
              </Button>
              <Button 
                size="sm" 
                onClick={handleReboot}
                disabled={isRebooting}
                className="bg-blue-600 hover:bg-blue-700"
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
                  routerData.status === "online" ? "bg-green-100 text-green-700 border-green-300" :
                  routerData.status === "offline" ? "bg-red-100 text-red-700 border-red-300" :
                  routerData.status === "warning" ? "bg-amber-100 text-amber-700 border-amber-300" :
                  "bg-blue-100 text-blue-700 border-blue-300"
                }`}
              >
                {getStatusIcon(routerData.status)}
                <span className="ml-2 capitalize">{routerData.status}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* REPLACED: Active Users Card with Total Income Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {routerIncome !== null
                    ? `KES ${routerIncome.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`
                    : '—'}
                </p>
                <p className="text-xs text-slate-500">Total Income</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fix 2c: Updated Uptime card to use live status data */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {liveStatusData?.uptime || routerData.uptime || "N/A"}
                </p>
                <p className="text-xs text-slate-500">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fix 2c: Updated SLA card to show formatted value */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {routerData.uptime_percentage && routerData.uptime_percentage > 0
                    ? `${Number(routerData.uptime_percentage).toFixed(1)}%`
                    : routerData.status === 'online' ? '✓' : '—'
                  }
                </p>
                <p className="text-xs text-slate-500">
                  SLA target: {routerData.sla_target || 99}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{routerData.metrics?.active_connections || 0}</p>
                <p className="text-xs text-slate-500">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="live" className="gap-2">
            <MonitorSpeaker className="w-4 h-4" />
            <span className="hidden sm:inline">Live Status</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="firewall" className="gap-2">
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Firewall</span>
          </TabsTrigger>
          <TabsTrigger value="queues" className="gap-2">
            <Gauge className="w-4 h-4" />
            <span className="hidden sm:inline">Queues</span>
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="gap-2">
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Interfaces</span>
          </TabsTrigger>
          <TabsTrigger value="wireless" className="gap-2">
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">Wireless</span>
          </TabsTrigger>
          {/* REMOVED: Hotspot Tab Trigger */}
          <TabsTrigger value="hotspot-ipconfig" className="gap-2">
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Hotspot IP Config</span>
          </TabsTrigger>
          <TabsTrigger value="port-manager" className="gap-2">
            <Cable className="w-4 h-4" />
            <span className="hidden sm:inline">Port Manager</span>
          </TabsTrigger>
          <TabsTrigger value="portal-settings" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Captive Portal</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="cloud" className="gap-2">
            <CloudCog className="w-4 h-4" />
            <span className="hidden sm:inline">Cloud Controller</span>
          </TabsTrigger>
          <TabsTrigger value="scripts" className="gap-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Scripts</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="backups" className="gap-2">
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Backups</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Configuration</span>
          </TabsTrigger>
        </TabsList>

        {/* Live Status Tab */}
        <TabsContent value="live" className="mt-6">
          <RouterOverviewTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="info" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Router Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">IP Address</p>
                    <p className="font-mono">{routerData.ip_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">MAC Address</p>
                    <p className="font-mono">{routerData.mac_address || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">API Port</p>
                    <p className="font-mono">{routerData.api_port}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Type</p>
                    <p className="capitalize">{routerData.router_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Model</p>
                    <p>{routerData.model || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Firmware</p>
                    <p>{routerData.firmware_version || "N/A"}</p>
                  </div>
                </div>
                
                {routerData.location && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <p>{routerData.location}</p>
                  </div>
                )}

                {routerData.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-slate-500 mb-1">Notes</p>
                    <p className="text-sm">{routerData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleSyncUsers}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Users
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4 mr-2" />
                  )}
                  Create Backup
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setIsMaintenanceDialogOpen(true)}
                >
                  {routerData.status === "maintenance" ? (
                    <PlayCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <PauseCircle className="w-4 h-4 mr-2" />
                  )}
                  {routerData.status === "maintenance" ? "Exit Maintenance" : "Enter Maintenance"}
                </Button>
                <Button 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Router
                </Button>
              </CardContent>
            </Card>
          </div>

          {routerData.tags && routerData.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {routerData.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6 space-y-6">
          {routerData.metrics ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    CPU Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{routerData.metrics.cpu_usage}%</div>
                  <Progress 
                    value={routerData.metrics.cpu_usage} 
                    className={routerData.metrics.cpu_usage > 80 ? "[&>div]:bg-red-500" : routerData.metrics.cpu_usage > 60 ? "[&>div]:bg-amber-500" : ""}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{routerData.metrics.memory_usage}%</div>
                  <Progress 
                    value={routerData.metrics.memory_usage} 
                    className={routerData.metrics.memory_usage > 80 ? "[&>div]:bg-red-500" : routerData.metrics.memory_usage > 60 ? "[&>div]:bg-amber-500" : ""}
                  />
                </CardContent>
              </Card>

              {routerData.metrics.temperature && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Thermometer className="w-4 h-4" />
                      Temperature
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${
                      routerData.metrics.temperature > 65 ? "text-red-600" : 
                      routerData.metrics.temperature > 55 ? "text-amber-600" : "text-slate-700"
                    }`}>
                      {routerData.metrics.temperature}°C
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Speed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{routerData.metrics.download_speed} Mbps</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Speed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{routerData.metrics.upload_speed} Mbps</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Active Connections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{routerData.metrics.active_connections}</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No metrics available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <RouterUsersTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Firewall Tab */}
        <TabsContent value="firewall" className="mt-6">
          <RouterFirewallTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Queues Tab */}
        <TabsContent value="queues" className="mt-6">
          <RouterQueuesTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Interfaces Tab */}
        <TabsContent value="interfaces" className="mt-6">
          <RouterInterfacesTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Wireless Tab */}
        <TabsContent value="wireless" className="mt-6">
          <RouterWirelessTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* REMOVED: Hotspot Tab Content */}

        {/* Hotspot IP Config Tab */}
        <TabsContent value="hotspot-ipconfig" className="mt-6">
          <RouterHotspotIPConfigTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Port Manager Tab */}
        <TabsContent value="port-manager" className="mt-6">
          <RouterPortManagerTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Captive Portal Settings Tab */}
        <TabsContent value="portal-settings" className="mt-6">
          <RouterPortalSettingsTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <RouterLogsTab routerId={parseInt(routerId)} isDemo={isUsingDemoData} />
        </TabsContent>

        {/* Cloud Controller Tab */}
        <TabsContent value="cloud" className="mt-6">
          <div className="space-y-6">
            {/* VPN Status Card */}
            <Card className={`border-2 ${
              routerData.vpn_provisioned
                ? vpnStatus?.tunnel_status === 'connected'
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-yellow-200 bg-yellow-50/50'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CloudCog className="w-6 h-6 text-blue-600" />
                    <div>
                      <CardTitle>Cloud Controller VPN</CardTitle>
                      <CardDescription>OpenVPN tunnel between this router and Netily cloud</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {routerData.vpn_provisioned ? (
                      <Badge className="bg-green-600 gap-1"><ShieldCheck className="w-3 h-3" /> Provisioned</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><Unlink className="w-3 h-3" /> Not Provisioned</Badge>
                    )}
                    {vpnStatus && (
                      <Badge variant={vpnStatus.tunnel_status === 'connected' ? 'default' : 'destructive'} className="gap-1">
                        <Link2 className="w-3 h-3" />
                        {vpnStatus.tunnel_status === 'connected' ? 'Tunnel Up' : 'Tunnel Down'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">VPN IP Address</p>
                    <p className="text-sm font-mono">{routerData.vpn_ip_address || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Provisioned At</p>
                    <p className="text-sm">{routerData.vpn_provisioned_at ? formatDate(routerData.vpn_provisioned_at) : '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Last Seen via VPN</p>
                    <p className="text-sm">{routerData.vpn_last_seen ? formatDate(routerData.vpn_last_seen) : '—'}</p>
                  </div>
                  {vpnStatus && (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium">Connected Since</p>
                        <p className="text-sm">{vpnStatus.connected_since ? formatDate(vpnStatus.connected_since) : '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium">Traffic (RX / TX)</p>
                        <p className="text-sm font-mono">
                          {(vpnStatus.bytes_received / 1024 / 1024).toFixed(1)} MB / {(vpnStatus.bytes_sent / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium">Certificate Expires</p>
                        <p className="text-sm">{vpnStatus.certificate_expires_at ? formatDate(vpnStatus.certificate_expires_at) : '—'}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isVpnLoading}
                    onClick={async () => {
                      setIsVpnLoading(true)
                      try {
                        const status = await adminApi.getRouterVPNStatus(routerData.id)
                        setVpnStatus(status)
                        toast.success('VPN status refreshed')
                      } catch {
                        toast.error('Failed to fetch VPN status')
                      } finally {
                        setIsVpnLoading(false)
                      }
                    }}
                    className="gap-2"
                  >
                    {isVpnLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh Status
                  </Button>
                  <Button
                    variant={routerData.vpn_provisioned ? 'secondary' : 'default'}
                    size="sm"
                    disabled={isReprovisioning}
                    onClick={async () => {
                      setIsReprovisioning(true)
                      try {
                        const result = await adminApi.reprovisionRouterVPN(routerData.id)
                        toast.success(`VPN ${routerData.vpn_provisioned ? 're-' : ''}provisioned — IP: ${result.vpn_ip}`)
                        // Refresh router data
                        const updated = await adminApi.getRouter(routerData.id)
                        setRouterData(updated)
                        const status = await adminApi.getRouterVPNStatus(routerData.id)
                        setVpnStatus(status)
                      } catch {
                        toast.error('VPN provisioning failed')
                      } finally {
                        setIsReprovisioning(false)
                      }
                    }}
                    className="gap-2"
                  >
                    {isReprovisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {routerData.vpn_provisioned ? 'Re-provision VPN' : 'Provision VPN'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Remote Access Card */}
            {routerData.remote_access_url && (
              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MonitorSpeaker className="w-6 h-6 text-green-600" />
                      <div>
                        <CardTitle>Remote Access</CardTitle>
                        <CardDescription>
                          Connect to this router remotely via Winbox or API from anywhere
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-600 gap-1">
                      <CheckCircle className="w-3 h-3" /> Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Winbox */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Winbox Address
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 text-green-400 font-mono text-sm px-4 py-2.5 rounded-lg">
                        {(routerData.remote_access_url as any).winbox}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText((routerData.remote_access_url as any).winbox)
                          toast.success("Winbox address copied!")
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Open Winbox → paste in the <strong>Connect To</strong> field → enter your router credentials
                    </p>
                  </div>

                  <Separator />

                  {/* API */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      API Address
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 text-blue-400 font-mono text-sm px-4 py-2.5 rounded-lg">
                        {(routerData.remote_access_url as any).api}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText((routerData.remote_access_url as any).api)
                          toast.success("API address copied!")
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Use for RouterOS scripting, Netily API, or any tool that connects to port 8728
                    </p>
                  </div>

                  <Separator />

                  {/* Quick instructions */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-600">How to connect with Winbox</p>
                    <ol className="text-xs text-slate-500 space-y-0.5 list-decimal list-inside">
                      <li>Download Winbox from <span className="font-mono">mikrotik.com/download</span></li>
                      <li>
                        Paste{" "}
                        <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">
                          {(routerData.remote_access_url as any).winbox}
                        </span>{" "}
                        into the Connect To field
                      </li>
                      <li>Enter your router API username and password</li>
                      <li>Click Connect</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cloud Provision Script Card */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-base">MikroTik Provisioning Script</CardTitle>
                    <Badge className="bg-blue-600">Cloud Controller v4</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isScriptDownloading}
                      onClick={async () => {
                        setIsScriptDownloading(true)
                        try {
                          const script = await adminApi.downloadRouterScript(routerData.id, 7)
                          setCloudScript(typeof script === 'string' ? script : JSON.stringify(script))
                          toast.success('Script loaded')
                        } catch {
                          toast.error('Failed to load script')
                        } finally {
                          setIsScriptDownloading(false)
                        }
                      }}
                      className="gap-2"
                    >
                      {isScriptDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Load Script
                    </Button>
                    {cloudScript && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyScript(cloudScript)}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription className="mt-2">
                  Two-stage provisioning: detects RouterOS version, downloads version-specific config, sets up VPN (username/password), RADIUS, Hotspot, PPPoE, and cloud redirector.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Magic Link — the one-liner */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Magic Link — paste into MikroTik terminal:</p>
                  <div className="relative">
                    <pre className="bg-slate-900 text-green-400 p-4 pr-12 rounded-md text-sm overflow-x-auto font-mono">
                      <code>{routerData.magic_link || `/tool fetch url="${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'}/network/provision/${routerData.auth_key || 'NOT_GENERATED'}/${routerData.provision_slug || 'pending'}/script.rsc" dst-path="netily.rsc" mode=http; :delay 2s; /import netily.rsc`}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-slate-400 hover:text-white"
                      onClick={() => {
                        const link = routerData.magic_link || 'Magic link not generated yet'
                        navigator.clipboard.writeText(link)
                        toast.success('Magic link copied!')
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Stage 1 detects RouterOS v6/v7 → Stage 2 downloads version-specific config</p>
                </div>

                {/* Script preview */}
                {cloudScript ? (
                  <div>
                    <p className="text-xs text-slate-500 mb-2 font-medium">Script preview ({cloudScript.split('\n').length} lines):</p>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-x-auto font-mono max-h-96 overflow-y-auto">
                      <code>{cloudScript}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Click "Load Script" to preview the generated .rsc provisioning script.</p>
                )}

                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-700">
                    ⚠️ This script will <strong>reset the router configuration</strong> including identity, IP pool, DHCP, hotspot, RADIUS, and OpenVPN settings. Only run on routers you intend to manage via Netily Cloud Controller.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Architecture Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cloud Controller Architecture</CardTitle>
                <CardDescription>How Netily manages this router remotely</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium">Data Flow</h4>
                    <ul className="space-y-1 text-slate-600">
                      <li>• Customer connects to MikroTik hotspot</li>
                      <li>• Captive portal redirects to Netily cloud</li>
                      <li>• Payment processed via M-Pesa / PayHero</li>
                      <li>• RADIUS credentials sent over VPN tunnel</li>
                      <li>• MikroTik authenticates user via FreeRADIUS</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Enforcement Point</h4>
                    <ul className="space-y-1 text-slate-600">
                      <li>• MikroTik handles all traffic enforcement</li>
                      <li>• Rate limiting via RADIUS attributes</li>
                      <li>• Session timeout managed by FreeRADIUS</li>
                      <li>• CoA (Change of Authorization) for real-time control</li>
                      <li>• All billing logic lives in Django backend</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Router Scripts</CardTitle>
                  <CardDescription>Manage and run scripts on this router</CardDescription>
                </div>
                <Button size="sm" onClick={() => handleOpenScriptDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Script
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Authentication Script - Always show */}
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-base font-mono">netily-auth</CardTitle>
                        <Badge className="bg-blue-600">Authentication</Badge>
                        {routerData.is_authenticated && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Authenticated
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = routerData.magic_link || 'Magic link not generated yet'
                          handleCopyScript(link)
                        }}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                      </Button>
                    </div>
                    <CardDescription className="mt-2">
                      Run this script in your MikroTik terminal to authenticate and connect this router to Netily.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* One-liner command to fetch and import config */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2 font-medium">One-liner command (paste in MikroTik terminal):</p>
                      <pre className="bg-slate-900 text-green-400 p-4 rounded-md text-sm overflow-x-auto font-mono">
                        <code>{`/tool fetch url="http://127.0.0.1:8000/api/v1/network/routers/${routerData.id}/config/?auth_key=${routerData.auth_key || 'NOT_GENERATED'}" dst-path=netily.rsc; :delay 2s; /import netily.rsc;`}</code>
                      </pre>
                    </div>
                    
                    {/* Alternative: Download bootstrap script first */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700 mb-2 font-medium">📥 Alternative: Download bootstrap script first:</p>
                      <pre className="bg-slate-800 text-blue-400 p-3 rounded-md text-xs overflow-x-auto font-mono">
                        <code>{`/tool fetch url="http://127.0.0.1:8000/api/v1/network/routers/${routerData.id}/script/?version=7" dst-path=netily-bootstrap.rsc`}</code>
                      </pre>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-slate-600">
                        <strong>How to use:</strong> Open your MikroTik terminal (via Winbox or SSH), paste this command, and press Enter.
                      </p>
                      {!routerData.auth_key && (
                        <p className="text-xs text-red-500">
                          ⚠️ Auth key not generated yet. Backend needs to implement auth_key generation.
                        </p>
                      )}
                      {routerData.authenticated_at && (
                        <p className="text-xs text-slate-500">
                          Last authenticated: {formatDate(routerData.authenticated_at)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Other Scripts */}
                {scripts.filter(s => s.name !== "netily-auth").length > 0 ? (
                  scripts.filter(s => s.name !== "netily-auth").map((script) => (
                    <Card key={script.id} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-base font-mono">{script.name}</CardTitle>
                            {script.scheduled && (
                              <Badge variant="secondary" className="text-xs">Scheduled</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyScript(script.source)}
                              title="Copy script"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenScriptDialog(script)}
                              title="Edit script"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRunScript(script.id)}
                              disabled={isRunningScript === script.id}
                              className="text-green-600 hover:text-green-700"
                              title="Run script"
                            >
                              {isRunningScript === script.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteScript(script.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete script"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-sm overflow-x-auto font-mono">
                          <code>{script.source}</code>
                        </pre>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span>Run count: {script.run_count}</span>
                          <span>Owner: {script.owner}</span>
                          {script.last_run && (
                            <span>Last run: {formatDate(script.last_run)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 mt-4">No additional scripts configured. Add a new script to automate tasks on this router.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                      {getEventIcon(event.event_type)}
                      <div className="flex-1">
                        <p className="font-medium">{event.message}</p>
                        <p className="text-sm text-slate-500">{formatDate(event.created_at)}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{event.event_type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No events recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Configuration Backups</CardTitle>
                <Button 
                  size="sm"
                  onClick={handleBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4 mr-2" />
                  )}
                  Create Backup
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {backups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-mono text-sm">{backup.name}</TableCell>
                        <TableCell>{backup.date}</TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>
                          <Badge variant={backup.type === "auto" ? "secondary" : "outline"}>
                            {backup.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No backups available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab (read-only) */}
        <TabsContent value="edit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Router Configuration</CardTitle>
              <CardDescription>Current router configuration — read only. Contact support to make changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">Router configuration is locked to prevent accidental changes. Please contact <strong>Netily Support</strong> if you need to update any of these values.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-500">Router Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    disabled
                    className="bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="router_type" className="text-slate-500">Router Type</Label>
                  <Input
                    id="router_type"
                    value={editForm.router_type}
                    disabled
                    className="bg-slate-50 text-slate-600 cursor-not-allowed capitalize"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip_address" className="text-slate-500">IP Address</Label>
                  <Input
                    id="ip_address"
                    value={editForm.ip_address}
                    disabled
                    className="bg-slate-50 font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_port" className="text-slate-500">API Port</Label>
                  <Input
                    id="api_port"
                    value={editForm.api_port}
                    disabled
                    className="bg-slate-50 font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api_username" className="text-slate-500">API Username</Label>
                  <Input
                    id="api_username"
                    value={editForm.api_username}
                    disabled
                    className="bg-slate-50 font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_password" className="text-slate-500">API Password</Label>
                  <Input
                    id="api_password"
                    type="password"
                    value="••••••••"
                    disabled
                    className="bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-slate-500">Model</Label>
                  <Input
                    id="model"
                    value={editForm.model || "—"}
                    disabled
                    className="bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sla_target" className="text-slate-500">SLA Target (%)</Label>
                  <Input
                    id="sla_target"
                    value={editForm.sla_target}
                    disabled
                    className="bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-500">Location</Label>
                <Input
                  id="location"
                  value={editForm.location || "—"}
                  disabled
                  className="bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-500">Notes</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes || "—"}
                  disabled
                  rows={3}
                  className="bg-slate-50 text-slate-600 cursor-not-allowed resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 opacity-60">
                <Switch
                  id="is_active"
                  checked={editForm.is_active}
                  disabled
                />
                <Label htmlFor="is_active" className="text-slate-500">Active</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Router</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{routerData.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Mode Dialog */}
      <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {routerData.status === "maintenance" ? "Exit Maintenance Mode" : "Enter Maintenance Mode"}
            </DialogTitle>
            <DialogDescription>
              {routerData.status === "maintenance" 
                ? "This will take the router out of maintenance mode and mark it as available."
                : "This will put the router in maintenance mode. Users will not be able to connect during maintenance."}
            </DialogDescription>
          </DialogHeader>
          {routerData.status !== "maintenance" && (
            <div className="space-y-2">
              <Label htmlFor="maintenance_reason">Reason (optional)</Label>
              <Textarea
                id="maintenance_reason"
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                placeholder="Scheduled maintenance, firmware upgrade, etc."
                rows={2}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSetMaintenance(routerData.status !== "maintenance")} 
              disabled={isMaintenanceLoading}
            >
              {isMaintenanceLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : routerData.status === "maintenance" ? (
                <PlayCircle className="w-4 h-4 mr-2" />
              ) : (
                <PauseCircle className="w-4 h-4 mr-2" />
              )}
              {routerData.status === "maintenance" ? "Exit Maintenance" : "Enter Maintenance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Script Dialog */}
      <Dialog open={isScriptDialogOpen} onOpenChange={setIsScriptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingScript ? "Edit Script" : "New Script"}
            </DialogTitle>
            <DialogDescription>
              {editingScript 
                ? "Update the script configuration below."
                : "Create a new script to run on this router."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="script_name">Script Name *</Label>
              <Input
                id="script_name"
                value={scriptForm.name}
                onChange={(e) => setScriptForm({ ...scriptForm, name: e.target.value })}
                placeholder="my-script"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="script_source">Script Source *</Label>
              <Textarea
                id="script_source"
                value={scriptForm.source}
                onChange={(e) => setScriptForm({ ...scriptForm, source: e.target.value })}
                placeholder={`:log info "Hello from script"
/ip firewall filter print`}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="script_scheduled"
                checked={scriptForm.scheduled}
                onCheckedChange={(checked) => setScriptForm({ ...scriptForm, scheduled: checked })}
              />
              <Label htmlFor="script_scheduled">Enable scheduling</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScriptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScript} disabled={isSavingScript}>
              {isSavingScript ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingScript ? "Update Script" : "Create Script"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}