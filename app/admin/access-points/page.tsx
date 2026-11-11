"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Map as MapIcon,
  Maximize2,
  MoreVertical,
  Plus,
  Radio,
  RefreshCw,
  Router,
  Search,
  Trash2,
  Wifi,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { adminApi } from "@/lib/admin-api"
import type { AccessPoint, AccessPointStatus, KnownHost, Router as RouterType } from "@/lib/types"

type ApFormState = {
  name: string
  mac_address: string
  ip_address: string
  parent: string
}

const DIRECT_PARENT = "__router__"
const CANVAS_WIDTH = 1040
const CANVAS_HEIGHT = 620
const NODE_W = 184
const NODE_H = 64
const ROUTER_W = 232
const ROUTER_H = 64
const ROUTER_X = CANVAS_WIDTH / 2 - ROUTER_W / 2
const ROUTER_Y = 28

const emptyForm: ApFormState = {
  name: "",
  mac_address: "",
  ip_address: "",
  parent: DIRECT_PARENT,
}

const nowIso = () => new Date().toISOString()

const previewRouters: RouterType[] = [
  {
    id: 9001,
    name: "Demo Core Router",
    ip_address: "10.12.0.1",
    api_port: 8728,
    api_username: "admin",
    router_type: "mikrotik",
    model: "CCR2004",
    location: "Main POP",
    status: "online",
    total_users: 486,
    active_users: 392,
    is_active: true,
    created_at: nowIso(),
  },
  {
    id: 9002,
    name: "Estate Sector Router",
    ip_address: "10.21.0.1",
    api_port: 8728,
    api_username: "admin",
    router_type: "mikrotik",
    model: "RB4011",
    location: "Estate cabinet",
    status: "online",
    total_users: 216,
    active_users: 181,
    is_active: true,
    created_at: nowIso(),
  },
]

function previewAccessPoints(router: RouterType): AccessPoint[] {
  const base = router.id
  return [
    {
      id: `preview-${base}-roof`,
      router: router.id,
      router_name: router.name,
      parent: null,
      name: "Rooftop Sector AP",
      mac_address: "AA:10:42:7C:90:11",
      ip_address: "10.12.10.21",
      pos_x: 320,
      pos_y: 145,
      status: "online",
      last_seen: nowIso(),
      last_checked: nowIso(),
      seconds_since_seen: 12,
      is_active: true,
      created_at: nowIso(),
    },
    {
      id: `preview-${base}-court`,
      router: router.id,
      router_name: router.name,
      parent: `preview-${base}-roof`,
      name: "Court Relay",
      mac_address: "AA:10:42:7C:90:22",
      ip_address: "10.12.10.22",
      pos_x: 590,
      pos_y: 92,
      status: "online",
      last_seen: nowIso(),
      last_checked: nowIso(),
      seconds_since_seen: 18,
      is_active: true,
      created_at: nowIso(),
    },
    {
      id: `preview-${base}-shop`,
      router: router.id,
      router_name: router.name,
      parent: `preview-${base}-roof`,
      name: "Shops Lane AP",
      mac_address: "AA:10:42:7C:90:33",
      ip_address: "10.12.10.23",
      pos_x: 590,
      pos_y: 265,
      status: "unknown",
      last_seen: null,
      last_checked: nowIso(),
      seconds_since_seen: null,
      is_active: true,
      created_at: nowIso(),
    },
    {
      id: `preview-${base}-gate`,
      router: router.id,
      router_name: router.name,
      parent: null,
      name: "Gatehouse AP",
      mac_address: "AA:10:42:7C:90:44",
      ip_address: "10.12.10.24",
      pos_x: 320,
      pos_y: 390,
      status: "offline",
      last_seen: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      last_checked: nowIso(),
      seconds_since_seen: 1080,
      is_active: true,
      created_at: nowIso(),
    },
  ]
}

function previewKnownHosts(router: RouterType): KnownHost[] {
  return [
    { mac: "AA:10:42:7C:90:55", ip: router.id === 9002 ? "10.21.8.25" : "10.12.10.25", hostname: "Balcony AP", source: "arp" },
    { mac: "AA:10:42:7C:90:66", ip: router.id === 9002 ? "10.21.8.26" : "10.12.10.26", hostname: "Office Relay", source: "dhcp" },
    { mac: "AA:10:42:7C:90:77", ip: router.id === 9002 ? "10.21.8.27" : "10.12.10.27", hostname: "Water Tank AP", source: "arp" },
  ]
}

function listFromResponse<T>(response: T[] | { results?: T[] } | null | undefined): T[] {
  if (!response) return []
  if (Array.isArray(response)) return response
  return Array.isArray(response.results) ? response.results : []
}

function normalizeMac(value: string) {
  const clean = value.replace(/[^a-fA-F0-9]/g, "").slice(0, 12).toUpperCase()
  return clean.match(/.{1,2}/g)?.join(":") || clean
}

function statusClasses(status: AccessPointStatus) {
  if (status === "online") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === "offline") return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
  return "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300"
}

function statusDotClasses(status: AccessPointStatus) {
  if (status === "online") return "bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)] animate-pulse"
  if (status === "offline") return "bg-rose-500"
  return "bg-slate-400"
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Never seen"
  const diffMs = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diffMs)) return "Unknown"
  const seconds = Math.max(0, Math.floor(diffMs / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function layoutAccessPoints(items: AccessPoint[]) {
  const byId = new Map(items.map((ap) => [ap.id, ap]))
  const depthOf = (ap: AccessPoint) => {
    let depth = 1
    let cur = ap
    const seen = new Set<string>([cur.id])
    while (cur.parent && byId.has(cur.parent) && !seen.has(cur.parent)) {
      cur = byId.get(cur.parent)!
      seen.add(cur.id)
      depth++
    }
    return depth
  }
  const rows = new Map<number, AccessPoint[]>()
  items.forEach((ap) => {
    const d = depthOf(ap)
    rows.set(d, [...(rows.get(d) || []), ap])
  })

  return items.map((ap) => {
    if (Number(ap.pos_x) > 0 || Number(ap.pos_y) > 0) return ap
    const d = depthOf(ap)
    const row = rows.get(d) || [ap]
    const index = row.findIndex((item) => item.id === ap.id)
    const slot = CANVAS_WIDTH / (row.length + 1)
    return {
      ...ap,
      pos_x: Math.round(slot * (index + 1) - NODE_W / 2),
      pos_y: Math.min(CANVAS_HEIGHT - NODE_H - 24, ROUTER_Y + ROUTER_H + 90 + (d - 1) * 140),
    }
  })
}

export default function AccessPointsPage() {
  const [routers, setRouters] = useState<RouterType[]>([])
  const [selectedRouterId, setSelectedRouterId] = useState<string>("")
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([])
  const [knownHosts, setKnownHosts] = useState<KnownHost[]>([])
  const [search, setSearch] = useState("")
  const [loadingRouters, setLoadingRouters] = useState(true)
  const [loadingAps, setLoadingAps] = useState(false)
  const [knownHostsLoading, setKnownHostsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAp, setEditingAp] = useState<AccessPoint | null>(null)
  const [form, setForm] = useState<ApFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const previousStatuses = useRef<Record<string, AccessPointStatus>>({})

  const zoomBy = (delta: number) =>
    setZoom((z) => Math.min(1.6, Math.max(0.5, Number((z + delta).toFixed(2)))))
  const fitToView = () => {
    const w = scrollRef.current?.clientWidth
    if (w) setZoom(Math.min(1.6, Math.max(0.5, Number((w / CANVAS_WIDTH).toFixed(2)))))
  }

  const selectedRouter = useMemo(
    () => routers.find((router) => String(router.id) === selectedRouterId) || null,
    [routers, selectedRouterId],
  )

  const visibleAccessPoints = useMemo(() => {
    const positioned = layoutAccessPoints(accessPoints)
    const query = search.trim().toLowerCase()
    if (!query) return positioned
    return positioned.filter((ap) =>
      [ap.name, ap.mac_address, ap.ip_address, ap.router_name, ap.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [accessPoints, search])

  const stats = useMemo(() => {
    const online = accessPoints.filter((ap) => ap.status === "online").length
    const offline = accessPoints.filter((ap) => ap.status === "offline").length
    const unknown = accessPoints.filter((ap) => ap.status === "unknown").length
    return { total: accessPoints.length, online, offline, unknown }
  }, [accessPoints])

  const parentOptions = useMemo(
    () => accessPoints.filter((ap) => ap.id !== editingAp?.id),
    [accessPoints, editingAp],
  )

  const fetchRouters = useCallback(async () => {
    setLoadingRouters(true)
    try {
      const response = await adminApi.getRouters()
      const list = response.results || []
      const nextRouters = list.length ? list : previewRouters
      setPreviewMode(!list.length)
      setRouters(nextRouters)
      setSelectedRouterId((current) => current || String(nextRouters[0].id))
    } catch {
      setPreviewMode(true)
      setRouters(previewRouters)
      setSelectedRouterId((current) => current || String(previewRouters[0].id))
    } finally {
      setLoadingRouters(false)
    }
  }, [])

  const fetchAccessPoints = useCallback(async (routerId: string) => {
    if (!routerId) return
    setLoadingAps(true)
    try {
      const response = await adminApi.getAccessPoints({ router_id: routerId })
      const list = listFromResponse(response)
      setAccessPoints(layoutAccessPoints(list))
      setLastSync(Date.now())
      previousStatuses.current = Object.fromEntries(list.map((ap) => [ap.id, ap.status]))
    } catch {
      const router = routers.find((item) => String(item.id) === routerId) || previewRouters[0]
      const list = previewAccessPoints(router)
      setPreviewMode(true)
      setAccessPoints(layoutAccessPoints(list))
      previousStatuses.current = Object.fromEntries(list.map((ap) => [ap.id, ap.status]))
    } finally {
      setLoadingAps(false)
    }
  }, [routers])

  const fetchKnownHosts = useCallback(async (routerId: string) => {
    if (!routerId) return
    setKnownHostsLoading(true)
    try {
      const response = await adminApi.getRouterKnownHosts(Number(routerId))
      setKnownHosts(response.hosts || [])
    } catch {
      const router = routers.find((item) => String(item.id) === routerId) || previewRouters[0]
      setKnownHosts(previewKnownHosts(router))
    } finally {
      setKnownHostsLoading(false)
    }
  }, [routers])

  useEffect(() => {
    fetchRouters()
  }, [fetchRouters])

  useEffect(() => {
    if (!selectedRouterId) return
    fetchAccessPoints(selectedRouterId)
    fetchKnownHosts(selectedRouterId)
  }, [fetchAccessPoints, fetchKnownHosts, selectedRouterId])

  useEffect(() => {
    if (!selectedRouterId) return
    if (previewMode) {
      const timer = window.setInterval(() => {
        setAccessPoints((current) =>
          current.map((ap, index) => {
            if (index !== 2) return ap
            const nextStatus: AccessPointStatus = ap.status === "unknown" ? "online" : "unknown"
            previousStatuses.current[ap.id] = nextStatus
            return { ...ap, status: nextStatus, last_seen: nextStatus === "online" ? nowIso() : ap.last_seen, last_checked: nowIso() }
          }),
        )
      }, 9000)
      return () => window.clearInterval(timer)
    }
    const timer = window.setInterval(async () => {
      try {
        const statusMap = await adminApi.getAccessPointStatusMap(selectedRouterId)
        setLastSync(Date.now())
        setAccessPoints((current) =>
          current.map((ap) => {
            const update = statusMap[ap.id]
            if (!update) return ap
            const previous = previousStatuses.current[ap.id]
            if (previous && previous !== update.status) {
              const copy = update.status === "offline" ? `${ap.name} went offline.` : `${ap.name} is ${update.status}.`
              toast(update.status === "offline" ? "Access point offline" : "Access point updated", { description: copy })
            }
            previousStatuses.current[ap.id] = update.status
            return { ...ap, status: update.status, last_seen: update.last_seen }
          }),
        )
      } catch {
        window.clearInterval(timer)
      }
    }, 7000)
    return () => window.clearInterval(timer)
  }, [previewMode, selectedRouterId])

  const openAddDialog = () => {
    setEditingAp(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (ap: AccessPoint) => {
    setEditingAp(ap)
    setForm({
      name: ap.name,
      mac_address: ap.mac_address,
      ip_address: ap.ip_address || "",
      parent: ap.parent || DIRECT_PARENT,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedRouterId) return
    if (!form.name.trim() || !form.mac_address.trim()) {
      toast.error("Name and MAC address are required.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        router: Number(selectedRouterId),
        name: form.name.trim(),
        mac_address: normalizeMac(form.mac_address),
        ip_address: form.ip_address.trim() || null,
        parent: form.parent === DIRECT_PARENT ? null : form.parent,
      }
      if (previewMode) {
        if (editingAp) {
          setAccessPoints((current) => current.map((ap) => (ap.id === editingAp.id ? { ...ap, ...payload } : ap)))
        } else {
          const created: AccessPoint = {
            id: `preview-${Date.now()}`,
            router: Number(selectedRouterId),
            router_name: selectedRouter?.name,
            parent: payload.parent,
            name: payload.name,
            mac_address: payload.mac_address,
            ip_address: payload.ip_address,
            pos_x: 220,
            pos_y: 180,
            status: "unknown",
            last_seen: null,
            last_checked: nowIso(),
            seconds_since_seen: null,
            is_active: true,
            created_at: nowIso(),
          }
          setAccessPoints((current) => [...current, created])
        }
      } else if (editingAp) await adminApi.updateAccessPoint(editingAp.id, payload)
      else await adminApi.createAccessPoint({ ...payload, pos_x: 220, pos_y: 180, status: "unknown", is_active: true })
      toast.success(editingAp ? "Access point updated." : "Access point added.")
      setDialogOpen(false)
      if (!previewMode) await fetchAccessPoints(selectedRouterId)
    } catch (error: any) {
      toast.error(error?.message || "Could not save access point.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (ap: AccessPoint) => {
    if (!window.confirm(`Remove ${ap.name} from this AP map?`)) return
    try {
      if (!previewMode) await adminApi.deleteAccessPoint(ap.id)
      toast.success("Access point removed.")
      setAccessPoints((current) => current.filter((item) => item.id !== ap.id))
    } catch (error: any) {
      toast.error(error?.message || "Could not remove access point.")
    }
  }

  const handleCheckNow = async (ap: AccessPoint) => {
    setCheckingId(ap.id)
    try {
      const updated = previewMode
        ? { ...ap, status: "online" as AccessPointStatus, last_seen: nowIso(), last_checked: nowIso() }
        : await adminApi.checkAccessPointNow(ap.id)
      setAccessPoints((current) => current.map((item) => (item.id === ap.id ? { ...item, ...updated } : item)))
      toast.success(`${updated.name} checked: ${updated.status}.`)
    } catch (error: any) {
      toast.error(error?.message || "Could not check access point.")
    } finally {
      setCheckingId(null)
    }
  }

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, ap: AccessPoint) => {
    if ((event.target as HTMLElement).closest('button, [role="menu"], [role="menuitem"]')) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setDraggingId(ap.id)
    dragOffsetRef.current = {
      x: (event.clientX - rect.left) / zoom - Number(ap.pos_x || 0),
      y: (event.clientY - rect.top) / zoom - Number(ap.pos_y || 0),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(CANVAS_WIDTH - NODE_W - 12, Math.max(12, (event.clientX - rect.left) / zoom - dragOffsetRef.current.x))
    const y = Math.min(CANVAS_HEIGHT - NODE_H - 12, Math.max(ROUTER_Y + ROUTER_H + 24, (event.clientY - rect.top) / zoom - dragOffsetRef.current.y))
    setAccessPoints((current) => current.map((ap) => (ap.id === draggingId ? { ...ap, pos_x: x, pos_y: y } : ap)))
  }

  const endDrag = async () => {
    if (!draggingId) return
    const ap = accessPoints.find((item) => item.id === draggingId)
    setDraggingId(null)
    if (!ap) return
    try {
      if (!previewMode) {
        await adminApi.bulkUpdateAccessPointPositions([{ id: ap.id, pos_x: Number(ap.pos_x), pos_y: Number(ap.pos_y), parent: ap.parent }])
      }
    } catch {
      toast.error("Could not save AP position.")
    }
  }

  const applyKnownHost = (host: KnownHost) => {
    setForm((current) => ({
      ...current,
      mac_address: normalizeMac(host.mac),
      ip_address: host.ip || current.ip_address,
      name: current.name || host.hostname || `AP ${host.mac.slice(-5).replace(":", "")}`,
    }))
  }

  const topologyCopy = "View AP health, parent chains and management IPs in one clean topology workspace."

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Radio className="h-3.5 w-3.5" />
            AP topology
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Access Point Map</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Map downstream APs, switches and chained wireless nodes per router, then monitor live status without per-device ping load.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => selectedRouterId && fetchAccessPoints(selectedRouterId)} disabled={!selectedRouterId || loadingAps}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loadingAps && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={openAddDialog} disabled={!selectedRouterId}>
            <Plus className="mr-2 h-4 w-4" />
            Add AP
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription>Total APs</CardDescription>
            <CardTitle className="text-3xl font-black">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700 dark:text-emerald-300">Online</CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{stats.online}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-rose-500/20 bg-rose-500/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-rose-700 dark:text-rose-300">Offline</CardDescription>
            <CardTitle className="text-3xl font-black text-rose-700 dark:text-rose-300">{stats.offline}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-500/20 bg-slate-500/10">
          <CardHeader className="pb-2">
            <CardDescription>Unknown</CardDescription>
            <CardTitle className="text-3xl font-black">{stats.unknown}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Router className="h-5 w-5 text-primary" />
              Routers
            </CardTitle>
            <CardDescription>Select the router whose bridge/ARP table will drive this AP map.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRouters ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
              </div>
            ) : routers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No routers found.</div>
            ) : (
              <ScrollArea className="h-[380px] pr-3">
                <div className="space-y-2">
                  {routers.map((router) => {
                    const selected = selectedRouterId === String(router.id)
                    return (
                      <button
                        key={router.id}
                        type="button"
                        onClick={() => setSelectedRouterId(String(router.id))}
                        className={cn(
                          "w-full rounded-lg border p-3 text-left transition hover:border-primary/50 hover:bg-primary/5",
                          selected ? "border-primary bg-primary/10" : "border-border bg-background",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{router.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{router.ip_address || router.vpn_ip_address || "No IP"}</p>
                          </div>
                          <Badge variant={router.status === "online" ? "default" : "secondary"}>{router.status}</Badge>
                        </div>
                        <p className="mt-2 truncate text-xs text-muted-foreground">{router.location || "No location set"}</p>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card">
          <CardHeader className="gap-4 border-b border-border md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                {selectedRouter?.name || "Select a router"}
              </CardTitle>
              <CardDescription>{topologyCopy}</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search APs..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAps ? (
              <div className="grid min-h-[520px] place-items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading AP topology...
                </div>
              </div>
            ) : accessPoints.length === 0 ? (
              <div className="grid min-h-[520px] place-items-center p-6">
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wifi className="h-7 w-7" />
                  </div>
                  <h2 className="text-lg font-black text-foreground">No APs mapped yet</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add the first AP for this router, then chain children under it to build the topology.
                  </p>
                  <Button className="mt-4" onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add first AP
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <style>{`@keyframes ap-flow{to{stroke-dashoffset:-16}}.ap-flow{animation:ap-flow 1.2s linear infinite}@media (prefers-reduced-motion:reduce){.ap-flow{animation:none}}`}</style>

                {/* overlays */}
                <div className="pointer-events-none absolute left-3 top-3 z-30 flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-sm backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Live topology
                  <span className="font-medium normal-case tracking-normal opacity-70">
                    · {lastSync ? `updated ${formatRelativeTime(new Date(lastSync).toISOString())}` : "—"}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 z-30 flex overflow-hidden rounded-lg border border-border bg-card/90 shadow-sm backdrop-blur">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => zoomBy(-0.1)} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-x border-border" onClick={fitToView} aria-label="Fit to view"><Maximize2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => zoomBy(0.1)} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
                </div>

                <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex items-center gap-4 rounded-lg border border-border bg-card/90 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Online</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" />Unknown</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Offline</span>
                </div>

                <div ref={scrollRef} className="overflow-auto bg-muted/30 dark:bg-black/20" style={{ height: CANVAS_HEIGHT }}>
                  <div style={{ width: CANVAS_WIDTH * zoom, height: CANVAS_HEIGHT * zoom }}>
                    <div
                      ref={canvasRef}
                      className="relative text-foreground"
                      style={{
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        transform: `scale(${zoom})`,
                        transformOrigin: "0 0",
                        backgroundImage: "radial-gradient(circle at 1px 1px, color-mix(in srgb, currentColor 14%, transparent) 1px, transparent 0)",
                        backgroundSize: "28px 28px",
                      }}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                    >
                      {/* edges (behind cards) */}
                      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
                        {visibleAccessPoints.map((ap) => {
                          const parent = ap.parent ? visibleAccessPoints.find((item) => item.id === ap.parent) : null
                          const x1 = parent ? Number(parent.pos_x) + NODE_W / 2 : ROUTER_X + ROUTER_W / 2
                          const y1 = parent ? Number(parent.pos_y) + NODE_H / 2 : ROUTER_Y + ROUTER_H / 2
                          const x2 = Number(ap.pos_x) + NODE_W / 2
                          const y2 = Number(ap.pos_y) + NODE_H / 2
                          const online = ap.status === "online"
                          return (
                            <line
                              key={`${ap.id}-edge`}
                              x1={x1} y1={y1} x2={x2} y2={y2}
                              strokeLinecap="round"
                              strokeWidth={online ? 2.5 : 1.5}
                              strokeDasharray={online ? "8 8" : ap.status === "offline" ? "3 6" : undefined}
                              className={cn(
                                online && "ap-flow stroke-primary",
                                ap.status === "offline" && "stroke-rose-500/50",
                                ap.status === "unknown" && "stroke-muted-foreground/40",
                              )}
                            />
                          )
                        })}
                      </svg>

                      {/* router node */}
                      <div
                        className="absolute z-20 flex items-center gap-3 rounded-xl border border-primary/50 bg-primary px-3.5 text-primary-foreground shadow-[0_0_36px_-6px] shadow-primary/60"
                        style={{ left: ROUTER_X, top: ROUTER_Y, width: ROUTER_W, height: ROUTER_H }}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                          <Router className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black leading-tight">{selectedRouter?.name}</p>
                          <p className="truncate font-mono text-[10px] opacity-80">
                            {stats.total} APs · {stats.online} online
                          </p>
                        </div>
                      </div>

                      {/* AP nodes */}
                      {visibleAccessPoints.map((ap) => (
                        <div
                          key={ap.id}
                          role="button"
                          tabIndex={0}
                          onPointerDown={(event) => startDrag(event, ap)}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                          className={cn(
                            "absolute z-20 flex cursor-grab touch-none select-none items-center gap-2.5 rounded-xl border bg-card/95 px-2.5 shadow-md backdrop-blur transition-[box-shadow,transform,opacity] active:cursor-grabbing",
                            ap.status === "online" && "border-emerald-500/40 shadow-[0_0_24px_-8px_rgba(16,185,129,0.6)]",
                            ap.status === "offline" && "border-rose-500/40 opacity-80 shadow-[0_0_24px_-10px_rgba(244,63,94,0.5)]",
                            ap.status === "unknown" && "border-border",
                            draggingId === ap.id && "scale-[1.03] ring-2 ring-primary shadow-xl",
                          )}
                          style={{ left: Number(ap.pos_x), top: Number(ap.pos_y), width: NODE_W, height: NODE_H }}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              ap.status === "online" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                              ap.status === "offline" && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                              ap.status === "unknown" && "bg-muted text-muted-foreground",
                            )}
                          >
                            {ap.status === "offline" ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-extrabold leading-tight text-foreground">{ap.name}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[10px] text-muted-foreground">
                              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDotClasses(ap.status))} />
                              <span className="truncate">
                                {ap.status === "online" ? ap.ip_address || "online" : ap.status === "offline" ? `offline · ${formatRelativeTime(ap.last_seen)}` : "unknown"}
                              </span>
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCheckNow(ap)}>
                                {checkingId === ap.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Check now
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(ap)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(ap)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAp ? "Edit access point" : "Add access point"}</DialogTitle>
            <DialogDescription>Use the AP MAC address as the stable identifier. IP address is optional but improves ARP matching.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ap-name">Name</Label>
                <Input id="ap-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Rooftop AP 01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-mac">MAC address</Label>
                <Input
                  id="ap-mac"
                  value={form.mac_address}
                  onChange={(event) => setForm((current) => ({ ...current, mac_address: normalizeMac(event.target.value) }))}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-ip">Management IP</Label>
                <Input id="ap-ip" value={form.ip_address} onChange={(event) => setForm((current) => ({ ...current, ip_address: event.target.value }))} placeholder="192.168.88.20" />
              </div>
              <div className="space-y-2">
                <Label>Chain from</Label>
                <Select value={form.parent} onValueChange={(value) => setForm((current) => ({ ...current, parent: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select upstream node" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DIRECT_PARENT}>Direct from router</SelectItem>
                    {parentOptions.map((ap) => (
                      <SelectItem key={ap.id} value={ap.id}>{ap.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">Known hosts</p>
                  <p className="text-xs text-muted-foreground">Pick from DHCP/ARP</p>
                </div>
                {knownHostsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <ScrollArea className="h-[310px] pr-2">
                <div className="space-y-2">
                  {knownHosts.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">No known hosts returned for this router.</p>
                  ) : (
                    knownHosts.slice(0, 30).map((host) => (
                      <button
                        key={`${host.mac}-${host.ip}`}
                        type="button"
                        onClick={() => applyKnownHost(host)}
                        className="w-full rounded-lg border border-border bg-background p-2 text-left transition hover:border-primary/50 hover:bg-primary/5"
                      >
                        <p className="truncate text-xs font-bold">{host.hostname || host.ip || "Unnamed host"}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">{normalizeMac(host.mac)}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">{host.ip || "No IP"} - {host.source}</p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingAp ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingAp ? "Save changes" : "Add AP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}