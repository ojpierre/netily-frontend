"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Cpu,
  HardDrive,
  Loader2,
  Clock,
  Server,
  Wifi,
  Activity,
  Thermometer,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { RouterLiveStatus, RouterSystemHealth } from "@/lib/types"

interface RouterOverviewTabProps {
  routerId: number
  isDemo?: boolean
}

// Demo data
const DEMO_LIVE_STATUS: RouterLiveStatus = {
  online: true,
  identity: "MikroTik-Gateway",
  model: "RB4011iGS+",
  serial: "D4440CE79023",
  firmware: "7.20.6 (stable)",
  uptime: "2d12:34:56",
  cpu_load: "12%",
  free_memory: "524288000",
  total_memory: "1073741824",
  free_hdd: "123456789",
  architecture: "arm",
}

// ── Premium Gauge Card ────────────────────────────────────────────────────────
function PremiumGaugeCard({
  title,
  value,
  icon: Icon,
  detail,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  detail?: string
}) {
  const clampedValue = Math.min(100, Math.max(0, value))

  const theme = clampedValue >= 85
    ? { color: "#ef4444", shadow: "shadow-red-500/20", badge: "bg-red-100 text-red-700 border-red-200", label: "Critical", bar: "bg-red-500", ring: "text-red-500", glow: "bg-red-500/10" }
    : clampedValue >= 65
    ? { color: "#f59e0b", shadow: "shadow-amber-500/20", badge: "bg-amber-100 text-amber-700 border-amber-200", label: "High", bar: "bg-amber-500", ring: "text-amber-500", glow: "bg-amber-500/10" }
    : { color: "#3b82f6", shadow: "shadow-blue-500/20", badge: "bg-blue-100 text-blue-700 border-blue-200", label: "Normal", bar: "bg-blue-500", ring: "text-blue-500", glow: "bg-blue-500/10" }

  const R = 44
  const circ = 2 * Math.PI * R
  const dash = (clampedValue / 100) * circ

  return (
    <div className={`rounded-2xl border bg-white shadow-lg ${theme.shadow} overflow-hidden`}>
      {/* Gradient accent strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${theme.color}88, ${theme.color})` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${theme.glow}`}>
              <Icon className={`w-4 h-4 ${theme.ring}`} />
            </div>
            <span className="font-semibold text-slate-700 text-sm">{title}</span>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${theme.badge}`}>
            {theme.label}
          </span>
        </div>

        {/* Gauge + stats row */}
        <div className="flex items-center gap-5">
          {/* SVG Arc Gauge */}
          <div className="relative flex-shrink-0 w-[100px] h-[100px]">
            {/* Subtle glow ring */}
            <div className={`absolute inset-2 rounded-full blur-xl opacity-30 ${theme.glow}`} />
            <svg width="100" height="100" className="relative -rotate-90">
              {/* Track */}
              <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="10" />
              {/* Progress */}
              <circle
                cx="50" cy="50" r={R}
                fill="none"
                stroke={theme.color}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
              />
              {/* Inner glow ring */}
              <circle
                cx="50" cy="50" r={R}
                fill="none"
                stroke={theme.color}
                strokeWidth="2"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                opacity="0.3"
                style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800 leading-none">
                {Math.round(clampedValue)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">%</span>
            </div>
          </div>

          {/* Right side info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Large percent echo */}
            <div>
              <div className="text-3xl font-black text-slate-800 leading-none">
                {Math.round(clampedValue)}<span className="text-lg font-normal text-slate-400">%</span>
              </div>
              {detail && <p className="text-xs text-slate-400 mt-0.5 truncate">{detail}</p>}
            </div>

            {/* Segmented bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                {/* Tick marks */}
                <div className="absolute inset-0 flex">
                  {[25, 50, 75].map(tick => (
                    <div key={tick} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${tick}%` }} />
                  ))}
                </div>
                <div
                  className={`h-full rounded-full ${theme.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${clampedValue}%` }}
                />
              </div>
            </div>

            {/* Threshold indicators */}
            <div className="flex gap-2">
              {[
                { label: "OK", max: 65, color: "bg-blue-400" },
                { label: "High", max: 85, color: "bg-amber-400" },
                { label: "Crit", max: 100, color: "bg-red-400" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  <span className="text-[10px] text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RouterOverviewTab({ routerId, isDemo = false }: RouterOverviewTabProps) {
  const [liveStatus, setLiveStatus] = useState<RouterLiveStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLiveStatus = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        setLiveStatus(DEMO_LIVE_STATUS)
      } else {
        const data = await adminApi.getRouterLiveStatus(routerId)
        setLiveStatus(data)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch live status:", error)
      toast.error("Failed to fetch router status")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [routerId, isDemo])

  useEffect(() => {
    fetchLiveStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveStatus])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLiveStatus()
  }

  // Parse memory values
  const parseMemory = (free: string, total: string) => {
    const freeNum = parseInt(free) || 0
    const totalNum = parseInt(total) || 1
    const usedPercent = ((totalNum - freeNum) / totalNum) * 100
    const freeMB = (freeNum / 1024 / 1024).toFixed(0)
    const totalMB = (totalNum / 1024 / 1024).toFixed(0)
    return { usedPercent, freeMB, totalMB }
  }

  // Parse CPU load - handles string, number, or undefined
  const parseCpuLoad = (load: string | number | undefined | null) => {
    if (load === undefined || load === null) return 0
    if (typeof load === 'number') return Math.round(load)
    if (typeof load === 'string') return parseInt(load.replace('%', '')) || 0
    return 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!liveStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
          <p className="text-lg font-medium">Unable to connect to router</p>
          <p className="text-sm text-slate-500 mb-4">
            The router may be offline or API credentials are invalid
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const memory = parseMemory(liveStatus.free_memory, liveStatus.total_memory)
  const cpuLoad = parseCpuLoad(liveStatus.cpu_load)

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={liveStatus.online ? "default" : "destructive"} className="gap-1">
            {liveStatus.online ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {liveStatus.online ? "Online" : "Offline"}
          </Badge>
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Info Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500">Identity</p>
                <p className="font-medium truncate">{liveStatus.identity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wifi className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500">Model</p>
                <p className="font-medium truncate">{liveStatus.model}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500">Firmware</p>
                <p className="font-medium truncate">{liveStatus.firmware}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500">Uptime</p>
                <p className="font-medium">{liveStatus.uptime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Resource Usage */}
      <div className="grid md:grid-cols-2 gap-6">
        <PremiumGaugeCard
          title="CPU Usage"
          value={cpuLoad}
          icon={Cpu}
          detail={`${cpuLoad}% utilization`}
        />
        <PremiumGaugeCard
          title="Memory Usage"
          value={memory.usedPercent}
          icon={HardDrive}
          detail={`${memory.freeMB} MB free of ${memory.totalMB} MB`}
        />
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Serial Number</p>
              <p className="font-mono text-sm">{liveStatus.serial}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Architecture</p>
              <p className="capitalize">{liveStatus.architecture}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Free HDD</p>
              <p>{(parseInt(liveStatus.free_hdd) / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <div className="flex items-center gap-1">
                {liveStatus.online ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}