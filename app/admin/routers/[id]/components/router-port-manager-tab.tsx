// app/admin/routers/[id]/components/router-port-manager-tab.tsx
"use client"

import { useState, useCallback } from "react"
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
  ArrowRight,
  Globe,
  ChevronRight,
  Scan,
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

// ─── Types ───────────────────────────────────────────────────────────────────

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

type Step = "idle" | "scanning" | "wan-select" | "port-select"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PortTypeIcon({ type, className }: { type: string; className?: string }) {
  return type === "wireless" ? (
    <Wifi className={className ?? "w-5 h-5 text-purple-600"} />
  ) : (
    <Network className={className ?? "w-5 h-5 text-blue-600"} />
  )
}

function PortTypePill({ type }: { type: string }) {
  return type === "wireless" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
      <Wifi className="w-2.5 h-2.5" /> Wireless
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
      <Network className="w-2.5 h-2.5" /> Ethernet
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RouterPortManagerTab({ routerId }: RouterPortManagerTabProps) {
  const [step, setStep] = useState<Step>("idle")
  const [ports, setPorts] = useState<PortEntry[]>([])
  const [wanInterface, setWanInterface] = useState<string>("")   // suggested by API
  const [userWan, setUserWan] = useState<string>("")              // chosen by user
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [originalSelected, setOriginalSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<{
    added?: string[]
    removed?: string[]
    message?: string
  } | null>(null)

  // ── Scan ────────────────────────────────────────────────────────────────────

  const fetchPorts = useCallback(async () => {
    setStep("scanning")
    setError(null)
    setSaveResult(null)
    try {
      const data = await adminApi.getPortManager(routerId)
      setPorts(data.ports)
      setWanInterface(data.wan_interface)          // API suggestion
      setUserWan("")                                // reset user choice
      setStep("wan-select")
    } catch (err: any) {
      setError(err?.message || "Failed to scan router interfaces")
      setStep("idle")
    }
  }, [routerId])

  // ── WAN confirmed → move to port selection ───────────────────────────────

  const confirmWan = () => {
    if (!userWan) return
    // Pre-populate bridge selections from API state, excluding the chosen WAN
    const sel = new Set(
      ports
        .filter((p) => p.is_selected && p.name !== userWan)
        .map((p) => p.name)
    )
    setSelected(sel)
    setOriginalSelected(new Set(sel))
    setStep("port-select")
  }

  // ── Toggle bridge port ───────────────────────────────────────────────────

  const togglePort = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
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

  // ── Save (FIXED) ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)
    try {
      const result = await adminApi.savePortManager(routerId, Array.from(selected))
      if (result.success) {
        toast.success(result.message || "Ports synchronized!")
        setSaveResult({ added: result.added, removed: result.removed, message: result.message })
        
        // Refresh port data without resetting the user's WAN choice
        const data = await adminApi.getPortManager(routerId)
        setPorts(data.ports)
        
        // Rebuild selected set from fresh data, still excluding the chosen WAN
        const sel = new Set(
          data.ports
            .filter((p) => p.is_selected && p.name !== userWan)
            .map((p) => p.name)
        )
        setSelected(sel)
        setOriginalSelected(new Set(sel))
      } else {
        toast.error(result.error || result.message || "Failed to save ports")
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save port configuration")
    } finally {
      setSaving(false)
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: Idle — welcome screen
  // ════════════════════════════════════════════════════════════════════════════

  if (step === "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        {/* Icon ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-blue-500/10 scale-150 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Cable className="w-9 h-9 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          Port Manager
        </h2>
        <p className="text-slate-500 text-center max-w-sm mb-8 text-sm leading-relaxed">
          Scan the router to discover all interfaces, then tell us which port is your
          WAN — we'll lock it and let you assign the rest to the Hotspot bridge.
        </p>

        {/* Steps preview */}
        <div className="flex items-center gap-2 mb-8 text-xs text-slate-400">
          {["Scan", "Set WAN", "Pick Ports", "Save"].map((label, i, arr) => (
            <span key={label} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-slate-500 text-[10px]">
                  {i + 1}
                </span>
                {label}
              </span>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3" />}
            </span>
          ))}
        </div>

        <Button onClick={fetchPorts} size="lg" className="gap-2 px-8 shadow-lg shadow-blue-500/20">
          <Scan className="w-4 h-4" />
          Scan Interfaces
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-6 max-w-sm">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Scan Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: Scanning skeleton
  // ════════════════════════════════════════════════════════════════════════════

  if (step === "scanning") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <div>
              <CardTitle>Scanning Router Interfaces…</CardTitle>
              <CardDescription>Discovering all physical and virtual ports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 border rounded-xl">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="w-10 h-6 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: Step 2 — WAN port selection
  // ════════════════════════════════════════════════════════════════════════════

  if (step === "wan-select") {
    return (
      <div className="space-y-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Which port is your WAN (Internet) connection?
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              This port will be <strong>locked</strong> to protect your internet uplink.
              All other ports can be assigned to the Hotspot bridge.
            </p>
          </div>
        </div>

        {/* Suggestion callout */}
        {wanInterface && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-blue-700">
              We detected <span className="font-mono font-semibold">{wanInterface}</span> as likely WAN — confirm or choose another below.
            </span>
          </div>
        )}

        {/* Port cards */}
        <div className="grid gap-3">
          {ports.map((port) => {
            const isChosen = userWan === port.name
            const isSuggested = wanInterface === port.name

            return (
              <button
                key={port.name}
                onClick={() => setUserWan(port.name)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isChosen
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                    : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      port.type === "wireless" ? "bg-purple-100" : "bg-slate-100"
                    }`}>
                      <PortTypeIcon
                        type={port.type}
                        className={`w-5 h-5 ${port.type === "wireless" ? "text-purple-600" : "text-slate-600"}`}
                      />
                    </div>

                    {/* Labels */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {port.name}
                        </span>
                        <PortTypePill type={port.type} />
                        {isSuggested && (
                          <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Suggested
                          </span>
                        )}
                        {port.running ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Link up
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                            Link down
                          </span>
                        )}
                      </div>
                      {port.disabled && (
                        <span className="text-[11px] text-slate-400">Administratively disabled</span>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isChosen
                      ? "border-amber-500 bg-amber-500"
                      : "border-slate-300"
                  }`}>
                    {isChosen && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={fetchPorts} className="gap-2 text-slate-500">
            <RefreshCw className="w-4 h-4" />
            Rescan
          </Button>
          <Button
            onClick={confirmWan}
            disabled={!userWan}
            className="gap-2 px-6"
          >
            Set as WAN & Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: Step 3 — Bridge port selection (port-select)
  // ════════════════════════════════════════════════════════════════════════════

  const bridgePorts = ports.filter((p) => p.name !== userWan)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cable className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Select Bridge Ports</CardTitle>
              <CardDescription className="mt-0.5">
                Toggle which ports join the Hotspot / PPPoE bridge.{" "}
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {userWan}
                </span>{" "}
                is locked as WAN.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* WAN chip — click to go back and change */}
            <button
              onClick={() => setStep("wan-select")}
              className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              title="Click to change WAN port"
            >
              <ShieldAlert className="w-3 h-3" />
              WAN: {userWan}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPorts}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rescan</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5">
          {/* WAN port — locked, shown at top for context */}
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3 opacity-80">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {userWan}
                </span>
                <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 text-[10px] px-1.5 py-0">
                  <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />
                  WAN — Locked
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Internet uplink — protected from bridge assignment</p>
            </div>
            <Switch checked={false} disabled aria-label="WAN port (locked)" />
          </div>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-950 px-3 text-[10px] uppercase tracking-widest text-slate-400">
                Bridge Ports
              </span>
            </div>
          </div>

          {/* Assignable ports */}
          {bridgePorts.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">
              No additional ports available after WAN selection.
            </p>
          ) : (
            bridgePorts.map((port) => {
              const isChecked = selected.has(port.name)

              return (
                <div
                  key={port.name}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition-all duration-150 ${
                    isChecked
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    port.type === "wireless" ? "bg-purple-100" : "bg-slate-100 dark:bg-slate-800"
                  }`}>
                    <PortTypeIcon type={port.type} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                        {port.name}
                      </span>
                      <PortTypePill type={port.type} />
                      {port.running ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Link up
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          Link down
                        </span>
                      )}
                      {port.disabled && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Disabled</Badge>
                      )}
                    </div>
                    {isChecked && (
                      <p className="text-[11px] text-blue-600 mt-0.5 font-medium">
                        Will be added to Hotspot bridge
                      </p>
                    )}
                  </div>

                  {/* Toggle */}
                  <Switch
                    checked={isChecked}
                    onCheckedChange={() => togglePort(port.name)}
                    aria-label={`Toggle ${port.name}`}
                  />
                </div>
              )
            })
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-5">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{selected.size}</span>{" "}
            {selected.size === 1 ? "port" : "ports"} selected for bridge
          </p>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/30"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            ) : (
              <><Save className="w-4 h-4" />Save Ports</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Save result */}
      {saveResult && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-300">
            {saveResult.message || "Ports synchronized!"}
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
            {saveResult.added?.length ? (
              <span>Added: <span className="font-mono">{saveResult.added.join(", ")}</span>. </span>
            ) : null}
            {saveResult.removed?.length ? (
              <span>Removed: <span className="font-mono">{saveResult.removed.join(", ")}</span>.</span>
            ) : null}
            {!saveResult.added?.length && !saveResult.removed?.length && (
              <span>No changes were necessary.</span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}