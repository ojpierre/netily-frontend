"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import "react-leaflet-cluster/dist/assets/MarkerCluster.css"
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css"
import L from "leaflet"
import {
  MapContainer,
  TileLayer,          // ← ADDED THIS (was missing)
  LayersControl,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { adminApi, type NetworkMapElement } from "@/lib/admin-api"
import { Loader2, MapPin, Cable, Trash2, AlertTriangle, CheckCircle2, X } from "lucide-react"

// ── Element type catalogue with SVG icons ─────────────────────────────
type TypeConfig = {
  value: NetworkMapElement["element_type"]
  label: string
  color: string
  geometry: "POINT" | "LINE"
  icon: string // inner SVG path markup
}

const ELEMENT_TYPES: TypeConfig[] = [
  {
    value: "CABLE", label: "Fiber Cable", color: "#2563eb", geometry: "LINE",
    icon: '<path d="M4 4l7 7M20 20l-7-7M9 4L4 9m11 11l5-5"/><circle cx="12" cy="12" r="2.5"/>',
  },
  {
    value: "SPLITTER", label: "Splitter", color: "#f59e0b", geometry: "POINT",
    icon: '<path d="M6 3v6l6 6v6M18 3v6l-6 6"/><circle cx="6" cy="3" r="1.5" fill="#fff"/><circle cx="18" cy="3" r="1.5" fill="#fff"/><circle cx="12" cy="21" r="1.5" fill="#fff"/>',
  },
  {
    value: "ODF", label: "ODF / Distribution Frame", color: "#7c3aed", geometry: "POINT",
    icon: '<rect x="4" y="3" width="16" height="7" rx="1"/><rect x="4" y="14" width="16" height="7" rx="1"/><line x1="8" y1="6.5" x2="8" y2="6.5"/><line x1="8" y1="17.5" x2="8" y2="17.5"/>',
  },
  {
    value: "NAP", label: "Network Access Point", color: "#0891b2", geometry: "POINT",
    icon: '<path d="M5 12.5a7 7 0 0114 0"/><path d="M8.5 15a3.5 3.5 0 017 0"/><circle cx="12" cy="18" r="1.5" fill="#fff"/>',
  },
  {
    value: "POLE", label: "Pole", color: "#78716c", geometry: "POINT",
    icon: '<line x1="12" y1="2" x2="12" y2="22"/><line x1="6" y1="6" x2="18" y2="6"/><line x1="7" y1="10" x2="17" y2="10"/>',
  },
  {
    value: "MANHOLE", label: "Manhole / Handhole", color: "#57534e", geometry: "POINT",
    icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  },
  {
    value: "JOINT_CLOSURE", label: "Joint Closure", color: "#059669", geometry: "POINT",
    icon: '<path d="M9 15a4 4 0 010-6l2-2a4 4 0 016 6l-1 1"/><path d="M15 9a4 4 0 010 6l-2 2a4 4 0 01-6-6l1-1"/>',
  },
  {
    value: "CUSTOMER_DROP", label: "Customer Drop", color: "#16a34a", geometry: "POINT",
    icon: '<path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v9h12v-9"/>',
  },
  {
    value: "EQUIPMENT", label: "Router / Equipment", color: "#4f46e5", geometry: "POINT",
    icon: '<rect x="3" y="10" width="18" height="6" rx="1"/><circle cx="8" cy="13" r="0.8" fill="#fff"/><circle cx="12" cy="13" r="0.8" fill="#fff"/><path d="M6 10V7a2 2 0 012-2h8a2 2 0 012 2v3"/>',
  },
  {
    value: "ISSUE", label: "Fault / Cut (standalone marker)", color: "#dc2626", geometry: "POINT",
    icon: '<path d="M12 2L2 20h20L12 2z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.8" fill="#fff"/>',
  },
  {
    value: "OTHER", label: "Other", color: "#64748b", geometry: "POINT",
    icon: '<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  },
]

const typeConfig = (t: string) => ELEMENT_TYPES.find((c) => c.value === t) || ELEMENT_TYPES[ELEMENT_TYPES.length - 1]

const DEFAULT_CENTER: [number, number] = [-1.286389, 36.817223] // Nairobi fallback

// ── Build icon with SVG ────────────────────────────────────────────────
function buildIcon(type: TypeConfig, faulty: boolean) {
  const size = 28
  const bg = faulty ? "#dc2626" : type.color
  const ring = faulty ? "3px solid #fbbf24" : "2px solid #fff"
  return L.divIcon({
    className: "netily-map-marker",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${faulty ? `<div class="netily-pulse" style="position:absolute;inset:-6px;border-radius:9999px;background:${bg};opacity:0.35;"></div>` : ""}
        <div style="position:relative;width:${size}px;height:${size}px;border-radius:9999px;background:${bg};border:${ring};box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${type.icon}</svg>
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function ClickCapture({ enabled, onClick }: { enabled: boolean; onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (enabled) onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FitToElements({ elements }: { elements: NetworkMapElement[] }) {
  const map = useMap()
  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current || elements.length === 0) return
    const points = elements.flatMap((el) => el.coordinates).filter((p) => Array.isArray(p) && p.length === 2)
    if (points.length === 0) return
    try {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 })
      didFit.current = true
    } catch {
      /* ignore bad bounds */
    }
  }, [elements, map])
  return null
}

type FormState = {
  mode: "create" | "edit"
  id?: string
  type: TypeConfig
  name: string
  notes: string
  coreCount: string
  cableType: string
  splitRatio: string
}

type FaultDialogState = { open: boolean; elementId: string | null; severity: string; note: string }

// ── Global CSS for pulse animation ─────────────────────────────────────
const pulseStyles = `
  @keyframes netily-pulse {
    0% { transform: scale(0.8); opacity: 0.5; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  .netily-pulse { animation: netily-pulse 1.6s ease-out infinite; }

  .netily-map-marker.leaflet-div-icon,
  .netily-cluster-icon.leaflet-div-icon {
    background: transparent !important;
    border: none !important;
  }
`

export function NetworkMapClient() {
  const [elements, setElements] = useState<NetworkMapElement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")

  const [placing, setPlacing] = useState(false)
  const [placingType, setPlacingType] = useState<TypeConfig>(ELEMENT_TYPES[0])
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([])

  const [form, setForm] = useState<FormState | null>(null)
  const [faultDialog, setFaultDialog] = useState<FaultDialogState>({ open: false, elementId: null, severity: "MEDIUM", note: "" })
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const loadElements = useCallback(async () => {
    try {
      const data = await adminApi.getNetworkMapElements()
      setElements(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load map data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadElements()
  }, [loadElements])

  // ── ESC key cancels placing mode ─────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && placing) cancelPlacing()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [placing])

  const filtered = elements.filter((el) => {
    if (filterType !== "ALL" && el.element_type !== filterType) return false
    if (filterStatus !== "ALL" && el.status !== filterStatus) return false
    return true
  })

  const faultyCount = elements.filter((el) => el.status === "FAULTY").length

  // ── Drawing flow ──────────────────────────────────────────────────
  const startPlacing = (type: TypeConfig) => {
    setPlacingType(type)
    setPlacing(true)
    setDrawPoints([])
  }

  const cancelPlacing = () => {
    setPlacing(false)
    setDrawPoints([])
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (!placing) return
    if (placingType.geometry === "POINT") {
      setDrawPoints([[lat, lng]])
      setPlacing(false)
      openCreateDialog(placingType, [[lat, lng]])
    } else {
      setDrawPoints((prev) => [...prev, [lat, lng]])
    }
  }

  const finishLine = () => {
    if (drawPoints.length < 2) {
      toast.error("Click at least 2 points to draw a cable run.")
      return
    }
    setPlacing(false)
    openCreateDialog(placingType, drawPoints)
    setDrawPoints([])
  }

  const undoLastPoint = () => setDrawPoints((prev) => prev.slice(0, -1))

  // ── Dialog helpers ───────────────────────────────────────────────
  const openCreateDialog = (type: TypeConfig, coords: [number, number][]) => {
    setPendingCoords(coords)
    setForm({
      mode: "create",
      type,
      name: "",
      notes: "",
      coreCount: "",
      cableType: "",
      splitRatio: "",
    })
  }

  const [pendingCoords, setPendingCoords] = useState<[number, number][] | null>(null)

  const openEditDialog = (el: NetworkMapElement) => {
    setPendingCoords(el.coordinates)
    setForm({
      mode: "edit",
      id: el.id,
      type: typeConfig(el.element_type),
      name: el.name,
      notes: el.notes || "",
      coreCount: el.properties?.core_count || "",
      cableType: el.properties?.cable_type || "",
      splitRatio: el.properties?.split_ratio || "",
    })
  }

  const closeDialog = () => {
    setForm(null)
    setPendingCoords(null)
  }

  const handleSaveForm = async () => {
    if (!form || !pendingCoords) return
    if (!form.name.trim()) {
      toast.error("Please give this element a name.")
      return
    }
    const properties: Record<string, any> = {}
    if (form.coreCount) properties.core_count = form.coreCount
    if (form.cableType) properties.cable_type = form.cableType
    if (form.splitRatio) properties.split_ratio = form.splitRatio

    setSaving(true)
    try {
      if (form.mode === "create") {
        await adminApi.createNetworkMapElement({
          name: form.name.trim(),
          element_type: form.type.value,
          geometry_type: form.type.geometry,
          coordinates: pendingCoords,
          color: form.type.color,
          notes: form.notes,
          properties,
          status: "ACTIVE",
        })
        toast.success("Added to map")
      } else if (form.id) {
        await adminApi.updateNetworkMapElement(form.id, {
          name: form.name.trim(),
          notes: form.notes,
          properties,
        })
        toast.success("Updated")
      }
      closeDialog()
      await loadElements()
    } catch (err: any) {
      toast.error(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete with confirmation dialog ─────────────────────────────
  const requestDelete = (id: string) => setDeleteTargetId(id)

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await adminApi.deleteNetworkMapElement(deleteTargetId)
      toast.success("Deleted")
      await loadElements()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete")
    } finally {
      setDeleteTargetId(null)
    }
  }

  const openFaultDialog = (elementId: string) => setFaultDialog({ open: true, elementId, severity: "MEDIUM", note: "" })

  const submitFault = async () => {
    if (!faultDialog.elementId) return
    try {
      await adminApi.reportNetworkMapFault(faultDialog.elementId, {
        severity: faultDialog.severity,
        note: faultDialog.note,
      })
      toast.success("Marked as faulty")
      setFaultDialog({ open: false, elementId: null, severity: "MEDIUM", note: "" })
      await loadElements()
    } catch (err: any) {
      toast.error(err.message || "Failed to report fault")
    }
  }

  const resolveFault = async (id: string) => {
    try {
      await adminApi.resolveNetworkMapFault(id)
      toast.success("Marked as resolved")
      await loadElements()
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve")
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <style jsx global>{pulseStyles}</style>

      {/* ── Sidebar ── */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total elements</span>
              <span className="font-semibold">{elements.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active faults</span>
              <Badge variant={faultyCount > 0 ? "destructive" : "secondary"}>{faultyCount}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add to map</p>
            {ELEMENT_TYPES.map((t) => (
              <Button
                key={t.value}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                disabled={placing}
                onClick={() => startPlacing(t)}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                {t.geometry === "LINE" ? <Cable className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                {t.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {ELEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="FAULTY">Faulty</SelectItem>
                  <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Legend ── */}
        <Card>
          <CardContent className="pt-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend</p>
            {ELEMENT_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-2 text-xs">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: t.color }}
                  dangerouslySetInnerHTML={{
                    __html: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">${t.icon}</svg>`,
                  }}
                />
                {t.label}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="max-h-[320px] overflow-y-auto">
          <CardContent className="pt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Elements ({filtered.length})
            </p>
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400">Nothing here yet — start adding elements above.</p>
            )}
            {filtered.map((el) => (
              <div
                key={el.id}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: el.status === "FAULTY" ? "#dc2626" : (el.color || typeConfig(el.element_type).color) }}
                  />
                  <span className="truncate">{el.name}</span>
                </div>
                {el.status === "FAULTY" && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Map ── */}
      <div className="relative">
        {placing && (
          <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-lg border bg-white px-4 py-2 text-sm shadow-lg dark:bg-slate-900">
            {placingType.geometry === "POINT" ? (
              <span>Click the map to place a <strong>{placingType.label}</strong>.</span>
            ) : (
              <span>
                Click points to draw the <strong>{placingType.label}</strong> path ({drawPoints.length} pt
                {drawPoints.length === 1 ? "" : "s"}).
              </span>
            )}
            <div className="mt-1.5 flex gap-2">
              {placingType.geometry === "LINE" && (
                <>
                  <Button size="sm" variant="secondary" onClick={undoLastPoint} disabled={drawPoints.length === 0}>
                    Undo point
                  </Button>
                  <Button size="sm" onClick={finishLine} disabled={drawPoints.length < 2}>
                    Finish
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={cancelPlacing}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex h-[70vh] items-center justify-center rounded-xl border">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            scrollWheelZoom
            className="h-[75vh] w-full rounded-xl border z-0"
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Detailed">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Simple (no labels)">
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <FitToElements elements={elements} />
            <ClickCapture enabled={placing} onClick={handleMapClick} />

            {/* Lines stay outside clustering */}
            {filtered
              .filter((el) => el.geometry_type === "LINE" && el.coordinates.length >= 2)
              .map((el) => {
                const cfg = typeConfig(el.element_type)
                const faulty = el.status === "FAULTY"
                return (
                  <Polyline
                    key={el.id}
                    positions={el.coordinates}
                    pathOptions={{
                      color: faulty ? "#dc2626" : el.color || cfg.color,
                      weight: 4,
                      dashArray: el.status === "PLANNED" ? "6 6" : undefined,
                    }}
                  >
                    <Popup>
                      <ElementPopup
                        el={el}
                        onEdit={() => openEditDialog(el)}
                        onDelete={() => requestDelete(el.id)}
                        onReportFault={() => openFaultDialog(el.id)}
                        onResolve={() => resolveFault(el.id)}
                      />
                    </Popup>
                  </Polyline>
                )
              })}

            {/* Points get clustered */}
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount()
                const markers = cluster.getAllChildMarkers()
                const hasFault = markers.some((m: any) => m.options.faulty)
                const size = count < 10 ? 34 : count < 50 ? 42 : 50
                const bg = hasFault ? "#dc2626" : "#2563eb"
                return L.divIcon({
                  html: `<div style="
                    width:${size}px;height:${size}px;border-radius:9999px;
                    background:${bg};border:3px solid #fff;
                    box-shadow:0 2px 6px rgba(0,0,0,0.35);
                    display:flex;align-items:center;justify-content:center;
                    color:#fff;font-weight:600;font-size:${count < 100 ? 13 : 11}px;
                    font-family:inherit;">
                    ${count}${hasFault ? '<span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#fbbf24;border-radius:9999px;border:2px solid #fff;"></span>' : ''}
                  </div>`,
                  className: "netily-cluster-icon",
                  iconSize: L.point(size, size, true),
                })
              }}
            >
              {filtered
                .filter((el) => el.geometry_type !== "LINE")
                .map((el) => {
                  const cfg = typeConfig(el.element_type)
                  const faulty = el.status === "FAULTY"
                  const point = el.coordinates[0]
                  if (!point) return null
                  return (
                    <Marker
                      key={el.id}
                      position={point}
                      icon={buildIcon(cfg, faulty)}
                      // @ts-expect-error custom flag read by iconCreateFunction
                      faulty={faulty}
                    >
                      <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>{el.name}</Tooltip>
                      <Popup>
                        <ElementPopup
                          el={el}
                          onEdit={() => openEditDialog(el)}
                          onDelete={() => requestDelete(el.id)}
                          onReportFault={() => openFaultDialog(el.id)}
                          onResolve={() => resolveFault(el.id)}
                        />
                      </Popup>
                    </Marker>
                  )
                })}
            </MarkerClusterGroup>

            {/* Live drawing preview */}
            {drawPoints.length > 0 && (
              <Polyline positions={drawPoints} pathOptions={{ color: placingType.color, weight: 3, dashArray: "4 4" }} />
            )}
          </MapContainer>
        )}
      </div>

      {/* ── Create / Edit dialog ── */}
      <Dialog open={!!form} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form?.mode === "create" ? `Add ${form.type.label}` : `Edit ${form?.type.label ?? ""}`}
            </DialogTitle>
            <DialogDescription>
              {form?.type.geometry === "LINE" ? "Cable run details" : "Point details"}
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={`e.g. ${form.type.label} - Moi Avenue`}
                />
              </div>

              {form.type.value === "CABLE" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Fiber core count</Label>
                    <Input
                      value={form.coreCount}
                      onChange={(e) => setForm({ ...form, coreCount: e.target.value })}
                      placeholder="e.g. 24"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cable type</Label>
                    <Select value={form.cableType} onValueChange={(v) => setForm({ ...form, cableType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADSS">Aerial (ADSS)</SelectItem>
                        <SelectItem value="DUCTED">Underground Duct</SelectItem>
                        <SelectItem value="DIRECT_BURIED">Direct Buried</SelectItem>
                        <SelectItem value="DROP">Drop Cable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {form.type.value === "SPLITTER" && (
                <div className="space-y-1.5">
                  <Label>Split ratio</Label>
                  <Select value={form.splitRatio} onValueChange={(v) => setForm({ ...form, splitRatio: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["1:2", "1:4", "1:8", "1:16", "1:32", "1:64"].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes, location description, access instructions..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveForm} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form?.mode === "create" ? "Add to map" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this map element?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The element will be permanently removed from the map.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Fault dialog ── */}
      <Dialog open={faultDialog.open} onOpenChange={(open) => !open && setFaultDialog({ open: false, elementId: null, severity: "MEDIUM", note: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a fault / cut</DialogTitle>
            <DialogDescription>This will highlight the element in red on the map.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={faultDialog.severity} onValueChange={(v) => setFaultDialog({ ...faultDialog, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={faultDialog.note}
                onChange={(e) => setFaultDialog({ ...faultDialog, note: e.target.value })}
                placeholder="e.g. Cable cut near junction, reported by field technician"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaultDialog({ open: false, elementId: null, severity: "MEDIUM", note: "" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitFault}>
              Mark as faulty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ElementPopup({
  el,
  onEdit,
  onDelete,
  onReportFault,
  onResolve,
}: {
  el: NetworkMapElement
  onEdit: () => void
  onDelete: () => void
  onReportFault: () => void
  onResolve: () => void
}) {
  return (
    <div className="min-w-[180px] space-y-1.5 text-sm">
      <p className="font-semibold">{el.name}</p>
      <p className="text-xs text-muted-foreground">{el.element_type_display}</p>
      {el.status === "FAULTY" ? (
        <Badge variant="destructive" className="text-[10px]">
          Faulty {el.severity ? `(${el.severity})` : ""}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-[10px]">{el.status_display}</Badge>
      )}
      {el.notes && <p className="text-xs whitespace-pre-line text-slate-500">{el.notes}</p>}
      <div className="flex flex-wrap gap-1.5 pt-1.5">
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onEdit}>Edit</Button>
        {el.status === "FAULTY" ? (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onResolve}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive" onClick={onReportFault}>
            <AlertTriangle className="h-3 w-3 mr-1" /> Report fault
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}