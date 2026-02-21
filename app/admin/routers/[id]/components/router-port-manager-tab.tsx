"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  Network,
  Wifi,
  Save,
  ShieldAlert,
  Cable,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"

interface PortEntry {
  name: string
  type: "ethernet" | "wireless"
  running: boolean
  is_selected: boolean
  is_wan: boolean
  disabled: boolean
}

interface RouterPortManagerTabProps {
  routerId: number
  isDemo?: boolean
}

export function RouterPortManagerTab({ routerId }: RouterPortManagerTabProps) {
  const [ports, setPorts] = useState<PortEntry[]>([])
  const [wanInterface, setWanInterface] = useState<string>("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<{
    added?: string[]
    removed?: string[]
    message?: string
  } | null>(null)

  // Track the original selection so we can detect changes
  const [originalSelected, setOriginalSelected] = useState<Set<string>>(new Set())

  const fetchPorts = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSaveResult(null)
    try {
      const data = await adminApi.getPortManager(routerId)
      setPorts(data.ports)
      setWanInterface(data.wan_interface)

      const sel = new Set(
        data.ports.filter((p) => p.is_selected).map((p) => p.name)
      )
      setSelected(sel)
      setOriginalSelected(new Set(sel))
      setLoaded(true)
    } catch (err: any) {
      setError(err?.message || "Failed to scan router interfaces")
    } finally {
      setLoading(false)
    }
  }, [routerId])

  // Do NOT auto-fetch — let the user click "Scan"
  // useEffect(() => { fetchPorts() }, [fetchPorts])

  const togglePort = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const hasChanges = (() => {
    if (selected.size !== originalSelected.size) return true
    for (const name of selected) {
      if (!originalSelected.has(name)) return true
    }
    return false
  })()

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)
    try {
      const result = await adminApi.savePortManager(
        routerId,
        Array.from(selected)
      )
      if (result.success) {
        toast.success(result.message || "Ports synchronized!")
        setSaveResult({
          added: result.added,
          removed: result.removed,
          message: result.message,
        })
        // Refresh to get the new live state
        await fetchPorts()
      } else {
        toast.error(result.error || result.message || "Failed to save ports")
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save port configuration")
    } finally {
      setSaving(false)
    }
  }

  // ─── Not yet scanned ─────────────────────────────────
  if (!loaded && !loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cable className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Port Manager
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Scan the router to see all physical ports and select which ones
            should serve Hotspot / PPPoE clients via the Netily bridge.
          </p>
          <Button onClick={fetchPorts} size="lg">
            <Network className="w-4 h-4 mr-2" />
            Scan Interfaces
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-6 max-w-md mx-auto text-left">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Scan Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // ─── Loading skeleton ────────────────────────────────
  if (loading && !loaded) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-36 mt-1" />
                </div>
              </div>
              <Skeleton className="w-10 h-6 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // ─── Loaded: port list ───────────────────────────────
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cable className="w-5 h-5" />
              Port Manager
            </CardTitle>
            <CardDescription>
              Toggle which ports are bridged for Hotspot / PPPoE.
              The WAN port (<span className="font-mono font-semibold">{wanInterface}</span>) is locked for safety.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPorts}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Rescan</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {ports.map((port) => {
            const isChecked = selected.has(port.name)
            const isLocked = port.is_wan

            return (
              <div
                key={port.name}
                className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                  isLocked
                    ? "border-slate-200 bg-slate-50 opacity-70"
                    : isChecked
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      port.type === "wireless"
                        ? "bg-purple-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {port.type === "wireless" ? (
                      <Wifi className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Network className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  {/* Label */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{port.name}</span>

                      {/* Running dot */}
                      {port.running && (
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-green-500"
                          title="Cable connected / Link up"
                        />
                      )}

                      {isLocked && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0"
                        >
                          <ShieldAlert className="w-3 h-3 mr-0.5" />
                          WAN Port (Locked)
                        </Badge>
                      )}

                      {port.disabled && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {port.type}
                      {port.running ? " • Link up" : " • Link down"}
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <Switch
                  checked={isChecked}
                  onCheckedChange={() => togglePort(port.name)}
                  disabled={isLocked}
                  aria-label={`Toggle ${port.name}`}
                />
              </div>
            )
          })}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-6">
          <p className="text-sm text-muted-foreground">
            {selected.size} port{selected.size !== 1 ? "s" : ""} selected
          </p>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Ports
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Success result */}
      {saveResult && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertTitle className="text-green-800">
            {saveResult.message || "Ports synchronized!"}
          </AlertTitle>
          <AlertDescription className="text-green-700">
            {saveResult.added && saveResult.added.length > 0 && (
              <span>
                Added: <span className="font-mono">{saveResult.added.join(", ")}</span>.{" "}
              </span>
            )}
            {saveResult.removed && saveResult.removed.length > 0 && (
              <span>
                Removed: <span className="font-mono">{saveResult.removed.join(", ")}</span>.
              </span>
            )}
            {(!saveResult.added || saveResult.added.length === 0) &&
              (!saveResult.removed || saveResult.removed.length === 0) && (
                <span>No changes were necessary.</span>
              )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
