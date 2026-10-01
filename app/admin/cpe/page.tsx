"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
  RefreshCw,
  Router,
  Search,
  Settings,
  ShieldAlert,
  Signal,
  Trash2,
  UserRound,
  Wifi,
} from "lucide-react"

import { adminApi } from "@/lib/admin-api"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type DeviceStatus = "online" | "not_answering" | "never_seen"
type TaskStatus = "queued" | "completed" | "failed" | "expired"

interface Subscriber {
  id: number
  name: string
  plan?: string
  already_linked?: boolean
}

interface WifiNetwork {
  id: string
  ssid?: string
  enabled?: boolean
  band?: string
  channel?: number | string
  clients?: number
  password?: string
}

interface ConnectedHost {
  name?: string
  ip?: string
  mac?: string
  type?: string
  active?: boolean
}

interface TR069Device {
  id: number
  label?: string
  serial_number: string
  manufacturer?: string
  model_name?: string
  status: DeviceStatus
  weak_signal?: boolean
  rx_power_dbm?: string | number | null
  tx_power_dbm?: string | number | null
  last_inform_at?: string | null
  has_connected?: boolean
  pending_commands?: number
  subscriber?: Subscriber | null
  data_model?: string
  oui?: string
  product_class?: string
  software_version?: string
  hardware_version?: string
  uptime_seconds?: number | null
  wan_ip?: string
  connected_hosts_count?: number
  wifi_network_count?: number
  wifi_networks?: WifiNetwork[]
  hosts?: ConnectedHost[]
  inform_interval?: number | null
  last_sync_at?: string | null
}

interface TR069Task {
  id: number
  task_type: string
  status: TaskStatus
  error_message?: string
  created_by_name?: string
  created_at?: string
  completed_at?: string | null
}

interface Credentials {
  acs_url: string
  username: string
  password: string
  recommended_interval_seconds?: number
}

interface Summary {
  total: number
  online: number
  not_answering: number
  never_seen: number
  weak_signal: number
  pending_commands: number
}

const EMPTY_SUMMARY: Summary = {
  total: 0,
  online: 0,
  not_answering: 0,
  never_seen: 0,
  weak_signal: 0,
  pending_commands: 0,
}

const statusMeta: Record<DeviceStatus, { label: string; className: string }> = {
  online: { label: "Checked in", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  not_answering: { label: "Not answering", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  never_seen: { label: "Never seen", className: "border-muted-foreground/25 bg-muted text-muted-foreground" },
}

const taskLabels: Record<string, string> = {
  refresh: "Ask for latest state",
  reboot: "Reboot",
  factory_reset: "Factory reset",
  set_wifi: "Change WiFi",
}

const taskStatusClass: Record<TaskStatus, string> = {
  queued: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  expired: "border-muted-foreground/25 bg-muted text-muted-foreground",
}

function formatUptime(seconds?: number | null) {
  if (!seconds && seconds !== 0) return "-"
  if (seconds < 60) return "<1m"
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function relativeTime(value?: string | null) {
  if (!value) return "Never"
  const diff = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diff)) return "Never"
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

function deviceName(device: TR069Device) {
  return device.label || device.model_name || device.serial_number
}

function signalClass(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "text-muted-foreground"
  const n = Number(value)
  if (Number.isNaN(n)) return "text-muted-foreground"
  if (n >= -8) return "text-amber-600 dark:text-amber-300"
  if (n >= -24) return "text-emerald-600 dark:text-emerald-300"
  if (n >= -27) return "text-amber-600 dark:text-amber-300"
  return "text-destructive"
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  const meta = statusMeta[status] || statusMeta.never_seen
  return (
    <Badge variant="outline" className={`gap-1.5 ${meta.className}`}>
      {status === "online" ? <CheckCircle2 className="h-3.5 w-3.5" /> : status === "not_answering" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {meta.label}
    </Badge>
  )
}

function getErrorMessage(error: unknown) {
  const err = error as { message?: string; data?: { error?: string; detail?: string } }
  return err?.data?.error || err?.data?.detail || err?.message || "Something went wrong. Try again."
}

function copyValue(value: string, label: string) {
  navigator.clipboard?.writeText(value)
  toast.success(`${label} copied`)
}

export default function CPEManagementPage() {
  const perms = usePagePermissions("/admin/tr069")
  const [devices, setDevices] = useState<TR069Device[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [tasks, setTasks] = useState<TR069Task[]>([])
  const [selectedDevice, setSelectedDevice] = useState<TR069Device | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [filter, setFilter] = useState<"all" | "not_answering" | "never_seen" | "weak_signal">("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [enrolOpen, setEnrolOpen] = useState(false)
  const [wifiOpen, setWifiOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subscriberSearch, setSubscriberSearch] = useState("")
  const [enrolForm, setEnrolForm] = useState({ serial_number: "", label: "", service_connection: "" })
  const [editForm, setEditForm] = useState({ label: "", service_connection: "" })
  const [wifiForm, setWifiForm] = useState<WifiNetwork[]>([])
  const [applySameWifi, setApplySameWifi] = useState(false)

  const canView = perms.canView
  const canViewDetails = perms.canViewDetails || perms.canView
  const canAdd = perms.canAdd
  const canEdit = perms.canEdit
  const canDelete = perms.canDelete

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | boolean> = { page }
      if (search.trim()) params.search = search.trim()
      if (filter === "not_answering" || filter === "never_seen") params.status = filter
      if (filter === "weak_signal") params.weak_signal = true
      const [listResponse, summaryResponse] = await Promise.all([
        adminApi.getTR069Devices(params),
        adminApi.getTR069Summary(),
      ])
      setDevices(listResponse.results || [])
      setCount(listResponse.count || 0)
      setSummary({ ...EMPTY_SUMMARY, ...(summaryResponse || {}) })
    } catch (error) {
      toast.error("Could not load TR-069 devices", { description: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }, [filter, page, search])

  const fetchDetail = useCallback(async (id: number, quiet = false) => {
    try {
      const [detail, taskList] = await Promise.all([
        adminApi.getTR069Device(id),
        adminApi.getTR069Tasks(id),
      ])
      setSelectedDevice(detail)
      setTasks(taskList || [])
      if (!quiet && detail?.pending_commands > 0) {
        toast("Pending commands", { description: "This page will update when the device answers." })
      }
    } catch (error) {
      toast.error("Could not load device details", { description: getErrorMessage(error) })
    }
  }, [])

  const fetchCredentials = useCallback(async (id: number) => {
    try {
      setCredentials(await adminApi.getTR069Credentials(id))
    } catch (error) {
      toast.error("Could not load device login", { description: getErrorMessage(error) })
    }
  }, [])

  const fetchSubscribers = useCallback(async (term: string) => {
    try {
      setSubscribers(await adminApi.getTR069Subscribers(term))
    } catch {
      setSubscribers([])
    }
  }, [])

  useEffect(() => {
    if (canView) fetchList()
  }, [canView, fetchList])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      if (canView) fetchList()
    }, 350)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (!selectedDevice || !detailOpen) return
    const hasPending = (selectedDevice.pending_commands || 0) > 0 || tasks.some((task) => task.status === "queued")
    if (!hasPending) return
    const started = Date.now()
    const interval = window.setInterval(() => {
      if (document.hidden || Date.now() - started > 300000) {
        window.clearInterval(interval)
        return
      }
      fetchDetail(selectedDevice.id, true)
      fetchList()
    }, 10000)
    return () => window.clearInterval(interval)
  }, [detailOpen, fetchDetail, fetchList, selectedDevice, tasks])

  useEffect(() => {
    const onFocus = () => {
      if (!canView) return
      fetchList()
      if (selectedDevice?.id) fetchDetail(selectedDevice.id, true)
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [canView, fetchDetail, fetchList, selectedDevice?.id])

  useEffect(() => {
    if (!enrolOpen && !editOpen) return
    const timeout = setTimeout(() => fetchSubscribers(subscriberSearch), 250)
    return () => clearTimeout(timeout)
  }, [editOpen, enrolOpen, fetchSubscribers, subscriberSearch])

  const filteredCounts = useMemo(
    () => [
      { key: "all" as const, label: "All", count: summary.total },
      { key: "not_answering" as const, label: "Not answering", count: summary.not_answering },
      { key: "never_seen" as const, label: "Never seen", count: summary.never_seen },
      { key: "weak_signal" as const, label: "Weak signal", count: summary.weak_signal },
    ],
    [summary],
  )

  const openDetail = async (device: TR069Device, tab = "overview") => {
    if (!canViewDetails) return
    setSelectedDevice(device)
    setActiveTab(tab)
    setDetailOpen(true)
    setCredentials(null)
    await fetchDetail(device.id)
    if (tab === "connection") fetchCredentials(device.id)
  }

  const handleCommandResult = async (result: any, fallback = "Done.") => {
    if (result?.status === "queued") {
      toast("Queued", { description: "Applies when the device next checks in." })
    } else {
      toast.success(fallback)
    }
    if (selectedDevice?.id) await fetchDetail(selectedDevice.id, true)
    await fetchList()
  }

  const runAction = async (action: string, fn: () => Promise<any>) => {
    setBusyAction(action)
    try {
      await handleCommandResult(await fn())
    } catch (error) {
      toast.error("Action failed", { description: getErrorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  const enrollDevice = async () => {
    if (!enrolForm.serial_number.trim()) {
      toast.error("Serial number is required")
      return
    }
    setBusyAction("enrol")
    try {
      const created = await adminApi.createTR069Device({
        serial_number: enrolForm.serial_number.trim(),
        label: enrolForm.label.trim() || undefined,
        service_connection: enrolForm.service_connection ? Number(enrolForm.service_connection) : null,
      })
      toast.success("Device enrolled", { description: "Now type the ACS details into the device." })
      setEnrolOpen(false)
      setEnrolForm({ serial_number: "", label: "", service_connection: "" })
      await fetchList()
      await openDetail(created, "connection")
    } catch (error) {
      toast.error("Could not enrol device", { description: getErrorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  const saveEdit = async () => {
    if (!selectedDevice) return
    setBusyAction("edit")
    try {
      const updated = await adminApi.updateTR069Device(selectedDevice.id, {
        label: editForm.label.trim(),
        service_connection: editForm.service_connection ? Number(editForm.service_connection) : null,
      })
      setSelectedDevice(updated)
      setEditOpen(false)
      toast.success("Device updated")
      await fetchList()
    } catch (error) {
      toast.error("Could not update device", { description: getErrorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  const startWifiChange = (device = selectedDevice) => {
    if (!device) return
    if (!device.wifi_networks?.length) {
      toast("No WiFi details yet", { description: "Press Refresh, wait a minute, and try again." })
      return
    }
    setWifiForm(device.wifi_networks.map((network) => ({ ...network, password: "" })))
    setApplySameWifi(false)
    setWifiOpen(true)
  }

  const submitWifi = async () => {
    if (!selectedDevice) return
    const networks = wifiForm.map((network) => {
      const source = applySameWifi ? wifiForm[0] : network
      return {
        id: network.id,
        ssid: source.ssid,
        password: source.password || undefined,
        enabled: source.enabled,
      }
    })
    const invalid = networks.some((network) => {
      if (network.ssid && (network.ssid.length < 1 || network.ssid.length > 32)) return true
      if (network.password && (network.password.length < 8 || network.password.length > 63)) return true
      return false
    })
    if (invalid) {
      toast.error("Check WiFi details", { description: "SSID must be 1-32 characters. Password must be 8-63 characters." })
      return
    }
    setBusyAction("wifi")
    try {
      await handleCommandResult(await adminApi.setTR069Wifi(selectedDevice.id, networks))
      setWifiOpen(false)
    } catch (error) {
      toast.error("Could not change WiFi", { description: getErrorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  const rotatePassword = async () => {
    if (!selectedDevice) return
    if (!window.confirm("The device will stop checking in until the new password is typed into it. Continue?")) return
    setBusyAction("rotate")
    try {
      setCredentials(await adminApi.rotateTR069Credentials(selectedDevice.id))
      toast.success("New ACS password created")
    } catch (error) {
      toast.error("Could not rotate password", { description: getErrorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  const removeDevice = async (device: TR069Device) => {
    if (!window.confirm("Remove this device from Netily? It will stop being managed. The physical device is not changed.")) return
    setBusyAction(`delete-${device.id}`)
    try {
      await adminApi.deleteTR069Device(device.id)
      toast.success("Device removed")
      setDetailOpen(false)
      await fetchList()
    } catch (error) {
      toast.error("Could not remove device", { description: getErrorMessage(error) })
    } finally {
      setBusyAction(null)
    }
  }

  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-semibold">TR-069 is not available for your role</h1>
              <p className="text-sm text-muted-foreground">Ask the account admin to enable network device access.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Network</span>
            <span>/</span>
            <span>TR-069</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">TR-069 devices</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Your subscribers' ONTs and routers. Changes apply when a device next checks in.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchList} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canAdd && (
            <Button onClick={() => setEnrolOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Enrol device
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Devices", value: summary.total, icon: Router, sub: "Managed CPEs" },
          { label: "Checked in", value: summary.online, icon: CheckCircle2, sub: "Recently answered" },
          { label: "Not answering", value: summary.not_answering, icon: AlertTriangle, sub: "Missed check-ins" },
          { label: "Never seen", value: summary.never_seen, icon: Clock, sub: "Awaiting setup" },
          { label: "Pending commands", value: summary.pending_commands, icon: Settings, sub: "Queued for check-in" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filteredCounts.map((item) => (
                <Button
                  key={item.key}
                  variant={filter === item.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter(item.key)
                    setPage(1)
                  }}
                >
                  {item.label}
                  <Badge variant="secondary" className="ml-2">{item.count}</Badge>
                </Button>
              ))}
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search label, serial, model, subscriber..." className="pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last check-in</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Loading TR-069 devices...
                    </TableCell>
                  </TableRow>
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                        <Router className="h-10 w-10 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">No devices yet</p>
                          <p className="text-sm text-muted-foreground">Enrol your first ONT or router to manage its WiFi and see its signal remotely.</p>
                        </div>
                        {canAdd && <Button onClick={() => setEnrolOpen(true)}>Enrol device</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id} className="cursor-pointer" onClick={() => openDetail(device)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Router className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{deviceName(device)}</div>
                            <code className="text-xs text-muted-foreground">{device.serial_number}</code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.subscriber ? (
                          <div>
                            <div className="font-medium">{device.subscriber.name}</div>
                            <div className="text-xs text-muted-foreground">{device.subscriber.plan || "No plan label"}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell>{device.model_name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {device.weak_signal && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          <span className={`font-medium ${signalClass(device.rx_power_dbm)}`}>{device.rx_power_dbm ? `${device.rx_power_dbm} dBm` : "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={device.status} /></TableCell>
                      <TableCell>
                        {device.last_inform_at ? (
                          <span className="text-sm text-muted-foreground">{relativeTime(device.last_inform_at)}</span>
                        ) : (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              openDetail(device, "connection")
                            }}
                          >
                            Never - set up
                          </Button>
                        )}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(device)}><Eye className="mr-2 h-4 w-4" />Open details</DropdownMenuItem>
                            {canEdit && (
                              <>
                                <DropdownMenuItem disabled={!device.has_connected} onClick={() => runAction(`refresh-${device.id}`, () => adminApi.refreshTR069Device(device.id))}>
                                  <RefreshCw className="mr-2 h-4 w-4" />Ask for latest state
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!device.has_connected} onClick={async () => { await openDetail(device); startWifiChange(device) }}>
                                  <Wifi className="mr-2 h-4 w-4" />Change WiFi
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!device.has_connected} onClick={() => runAction(`reboot-${device.id}`, () => adminApi.rebootTR069Device(device.id))}>
                                  <Power className="mr-2 h-4 w-4" />Reboot
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!device.has_connected}
                                  className="text-destructive"
                                  onClick={() => {
                                    if (window.confirm("Factory reset erases WiFi, ACS login and all settings. Continue?")) {
                                      runAction(`reset-${device.id}`, () => adminApi.factoryResetTR069Device(device.id))
                                    }
                                  }}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />Factory reset
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => removeDevice(device)}>
                                  <Trash2 className="mr-2 h-4 w-4" />Remove
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{count} device{count === 1 ? "" : "s"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= count} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          {selectedDevice && (
            <>
              <SheetHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <SheetTitle className="flex flex-wrap items-center gap-2 text-xl">
                      {deviceName(selectedDevice)}
                      <StatusBadge status={selectedDevice.status} />
                    </SheetTitle>
                    <SheetDescription>
                      {selectedDevice.subscriber ? (
                        <Link href={`/admin/users/${selectedDevice.subscriber.id}`} className="hover:underline">{selectedDevice.subscriber.name}</Link>
                      ) : "Not linked to a subscriber"}{" "}
                      - <code>{selectedDevice.serial_number}</code>
                    </SheetDescription>
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" disabled={busyAction === "refresh" || !selectedDevice.has_connected} onClick={() => runAction("refresh", () => adminApi.refreshTR069Device(selectedDevice.id))}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${busyAction === "refresh" ? "animate-spin" : ""}`} />Refresh
                      </Button>
                      <Button variant="outline" size="sm" disabled={!selectedDevice.has_connected} onClick={() => startWifiChange()}>
                        <Wifi className="mr-2 h-4 w-4" />Change WiFi
                      </Button>
                    </div>
                  )}
                </div>
              </SheetHeader>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Signal", value: selectedDevice.rx_power_dbm ? `${selectedDevice.rx_power_dbm} dBm` : "-", sub: selectedDevice.weak_signal ? "check fibre and connectors" : "not reported", icon: Signal },
                  { label: "Uptime", value: formatUptime(selectedDevice.uptime_seconds), sub: "since last restart", icon: Clock },
                  { label: "Connected devices", value: selectedDevice.connected_hosts_count ?? 0, sub: "on WiFi and cable", icon: UserRound },
                  { label: "WiFi networks", value: selectedDevice.wifi_network_count ?? 0, sub: "reported by device", icon: Wifi },
                  { label: "Last check-in", value: relativeTime(selectedDevice.last_inform_at), sub: selectedDevice.inform_interval ? `every ${Math.round(selectedDevice.inform_interval / 60)} min` : "interval not reported", icon: CheckCircle2 },
                  { label: "Pending commands", value: selectedDevice.pending_commands ?? 0, sub: "waiting for check-in", icon: Settings },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{item.value}</div>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value)
                  if (value === "connection" && !credentials) fetchCredentials(selectedDevice.id)
                }}
                className="mt-6"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="commands">Commands{(selectedDevice.pending_commands || 0) > 0 ? ` (${selectedDevice.pending_commands})` : ""}</TabsTrigger>
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 pt-4">
                  {!selectedDevice.has_connected ? (
                    <Card>
                      <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
                        <Clock className="h-10 w-10 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Waiting for this device's first check-in</p>
                          <p className="text-sm text-muted-foreground">Finish the setup on the terminal, then reboot it.</p>
                        </div>
                        <Button onClick={() => setActiveTab("connection")}>Go to setup steps</Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Device profile</CardTitle>
                          <CardDescription>Hardware, software, and last synced values from the ACS.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                          {[
                            ["Manufacturer", selectedDevice.manufacturer || "-"],
                            ["Model", selectedDevice.model_name || "-"],
                            ["Hardware", selectedDevice.hardware_version || "-"],
                            ["Software", selectedDevice.software_version || "-"],
                            ["OUI", selectedDevice.oui || "-"],
                            ["Product class", selectedDevice.product_class || "-"],
                            ["Data model", selectedDevice.data_model || "-"],
                            ["WAN IP", selectedDevice.wan_ip || "-"],
                            ["TX/RX power", `${selectedDevice.tx_power_dbm || "-"} / ${selectedDevice.rx_power_dbm || "-"} dBm`],
                            ["Last synced", relativeTime(selectedDevice.last_sync_at)],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <p className="text-muted-foreground">{label}</p>
                              <p className="font-medium">{value}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle className="text-base">WiFi networks</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {selectedDevice.wifi_networks?.length ? selectedDevice.wifi_networks.map((network) => (
                            <div key={network.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium">{network.ssid || "Unnamed network"}</p>
                                <p className="text-xs text-muted-foreground">{network.band || "Unknown band"} - channel {network.channel || "-"} - {network.clients || 0} clients</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={network.enabled ? "default" : "secondary"}>{network.enabled ? "Enabled" : "Off"}</Badge>
                                {canEdit && <Button variant="outline" size="sm" onClick={() => startWifiChange()}>Change</Button>}
                              </div>
                            </div>
                          )) : <p className="text-sm text-muted-foreground">No WiFi details reported yet.</p>}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle className="text-base">Connected devices</CardTitle></CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>IP</TableHead>
                                  <TableHead>MAC</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedDevice.hosts?.length ? selectedDevice.hosts.slice(0, 200).map((host, index) => (
                                  <TableRow key={`${host.mac || host.ip || index}`}>
                                    <TableCell>{host.name || "Unknown"}</TableCell>
                                    <TableCell><code>{host.ip || "-"}</code></TableCell>
                                    <TableCell><code>{host.mac || "-"}</code></TableCell>
                                    <TableCell>{host.type || "-"}</TableCell>
                                    <TableCell>{host.active ? <Badge>Active</Badge> : <Badge variant="secondary">Idle</Badge>}</TableCell>
                                  </TableRow>
                                )) : (
                                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No connected devices reported.</TableCell></TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="commands" className="space-y-3 pt-4">
                  {tasks.length ? tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{taskLabels[task.task_type] || task.task_type}</p>
                            <Badge variant="outline" className={taskStatusClass[task.status] || taskStatusClass.queued}>
                              {task.status === "completed" ? "Done" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.created_by_name || "System"} - {relativeTime(task.created_at)}</p>
                          {task.error_message && <p className="mt-1 text-sm text-destructive">{task.error_message}</p>}
                        </div>
                        {task.completed_at && <p className="text-xs text-muted-foreground">Completed {relativeTime(task.completed_at)}</p>}
                      </CardContent>
                    </Card>
                  )) : (
                    <Card><CardContent className="py-10 text-center text-muted-foreground">No commands have been queued for this device.</CardContent></Card>
                  )}
                </TabsContent>

                <TabsContent value="connection" className="grid gap-4 pt-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Device login</CardTitle>
                      <CardDescription>Type these into its TR-069 page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!credentials ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading ACS details...</div>
                      ) : (
                        <>
                          {[
                            ["ACS URL", credentials.acs_url],
                            ["Username", credentials.username],
                            ["Password", credentials.password],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-md border p-3">
                              <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <code className="min-w-0 flex-1 break-all text-sm">{value}</code>
                                <Button variant="ghost" size="icon" onClick={() => copyValue(value, label)}><Copy className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                          {canEdit && (
                            <Button variant="outline" className="w-full" onClick={rotatePassword} disabled={busyAction === "rotate"}>
                              <KeyRound className="mr-2 h-4 w-4" />Set new password
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Setting it up</CardTitle>
                      <CardDescription>The ACS URL is the same for every device; username and password are unique to this one.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3 text-sm text-muted-foreground">
                        <li><span className="font-medium text-foreground">1.</span> Open the terminal admin page and find TR-069, ACS, or remote management. On Huawei it is usually System Tools - TR-069.</li>
                        <li><span className="font-medium text-foreground">2.</span> Tick Enable ACS Management and Periodic Informing, then set the interval to 300 seconds.</li>
                        <li><span className="font-medium text-foreground">3.</span> Type the ACS URL, username and password exactly as shown. It starts with http://, not https://.</li>
                        <li><span className="font-medium text-foreground">4.</span> Open WAN, select the internet connection, and set Service Type to one that includes TR-069.</li>
                        <li><span className="font-medium text-foreground">5.</span> Apply, then reboot the terminal. It should check in within a minute.</li>
                      </ol>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditForm({ label: selectedDevice.label || "", service_connection: selectedDevice.subscriber?.id ? String(selectedDevice.subscriber.id) : "" })
                        setSubscriberSearch(selectedDevice.subscriber?.name || "")
                        setEditOpen(true)
                      }}
                    >
                      Edit label/subscriber
                    </Button>
                    <Button variant="outline" disabled={!selectedDevice.has_connected} onClick={() => runAction("reboot", () => adminApi.rebootTR069Device(selectedDevice.id))}>Reboot</Button>
                    <Button
                      variant="outline"
                      className="text-destructive"
                      disabled={!selectedDevice.has_connected}
                      onClick={() => {
                        if (window.confirm(`Factory reset ${selectedDevice.serial_number}? This cannot be undone.`)) {
                          runAction("factory_reset", () => adminApi.factoryResetTR069Device(selectedDevice.id))
                        }
                      }}
                    >
                      Factory reset
                    </Button>
                  </>
                )}
                {canDelete && <Button variant="destructive" onClick={() => removeDevice(selectedDevice)}>Remove</Button>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={enrolOpen} onOpenChange={setEnrolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enrol device</DialogTitle>
            <DialogDescription>Add the serial printed on the ONT or router, then copy the generated ACS details into the device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Serial number</Label>
              <Input value={enrolForm.serial_number} onChange={(event) => setEnrolForm((f) => ({ ...f, serial_number: event.target.value }))} maxLength={64} />
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input placeholder="Flat 2B, Mwangi" value={enrolForm.label} onChange={(event) => setEnrolForm((f) => ({ ...f, label: event.target.value }))} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>PPPoE subscriber</Label>
              <Input placeholder="Search subscriber..." value={subscriberSearch} onChange={(event) => setSubscriberSearch(event.target.value)} />
              <Select value={enrolForm.service_connection} onValueChange={(value) => setEnrolForm((f) => ({ ...f, service_connection: value === "none" ? "" : value }))}>
                <SelectTrigger><SelectValue placeholder="Not linked" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {subscribers.map((subscriber) => (
                    <SelectItem key={subscriber.id} value={String(subscriber.id)}>
                      {subscriber.name} {subscriber.plan ? `- ${subscriber.plan}` : ""} {subscriber.already_linked ? "(has a device)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrolOpen(false)}>Cancel</Button>
            <Button onClick={enrollDevice} disabled={busyAction === "enrol"}>
              {busyAction === "enrol" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enrol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit device</DialogTitle>
            <DialogDescription>Update the friendly label or link this CPE to a PPPoE subscriber.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={editForm.label} onChange={(event) => setEditForm((f) => ({ ...f, label: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>PPPoE subscriber</Label>
              <Input placeholder="Search subscriber..." value={subscriberSearch} onChange={(event) => setSubscriberSearch(event.target.value)} />
              <Select value={editForm.service_connection} onValueChange={(value) => setEditForm((f) => ({ ...f, service_connection: value === "none" ? "" : value }))}>
                <SelectTrigger><SelectValue placeholder="Not linked" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {subscribers.map((subscriber) => (
                    <SelectItem key={subscriber.id} value={String(subscriber.id)}>
                      {subscriber.name} {subscriber.plan ? `- ${subscriber.plan}` : ""} {subscriber.already_linked ? "(has a device)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busyAction === "edit"}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wifiOpen} onOpenChange={setWifiOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change WiFi</DialogTitle>
            <DialogDescription>The customer's devices will disconnect and must rejoin with the new details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {wifiForm.length > 1 && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={applySameWifi} onCheckedChange={(checked) => setApplySameWifi(Boolean(checked))} />
                Apply the same name and password to all bands
              </label>
            )}
            {wifiForm.map((network, index) => (
              <Card key={network.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{network.band || `Network ${index + 1}`}</CardTitle>
                  <CardDescription>Channel {network.channel || "-"} - {network.clients || 0} client(s)</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SSID</Label>
                    <Input value={network.ssid || ""} onChange={(event) => setWifiForm((rows) => rows.map((row, i) => i === index ? { ...row, ssid: event.target.value } : row))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" placeholder="Leave empty to keep current" value={network.password || ""} onChange={(event) => setWifiForm((rows) => rows.map((row, i) => i === index ? { ...row, password: event.target.value } : row))} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={Boolean(network.enabled)} onCheckedChange={(checked) => setWifiForm((rows) => rows.map((row, i) => i === index ? { ...row, enabled: checked } : row))} />
                    Enabled
                  </label>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWifiOpen(false)}>Cancel</Button>
            <Button onClick={submitWifi} disabled={busyAction === "wifi"}>
              {busyAction === "wifi" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply WiFi changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
