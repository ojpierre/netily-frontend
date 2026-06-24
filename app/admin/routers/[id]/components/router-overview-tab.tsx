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
  CheckCircle,
  XCircle,
  Zap,
  Thermometer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { RouterLiveStatus } from "@/lib/types"

interface RouterOverviewTabProps {
  routerId: number
  isDemo?: boolean
}

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

function ArcGauge({ value, color, size = 120 }: { value: number; color: string; size?: number }) {
  const R = size * 0.38
  const circ = 2 * Math.PI * R
  const clamped = Math.min(100, Math.max(0, value))
  const dash = (clamped / 100) * circ
  const cx = size / 2
  const cy = size / 2

  const colorMap: Record<string, { stroke: string; glow: string; text: string }> = {
    blue:   { stroke: '#3b82f6', glow: 'rgba(59,130,246,0.2)',   text: 'text-primary dark:text-primary/80' },
    purple: { stroke: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',   text: 'text-purple-600 dark:text-purple-400' },
    emerald:{ stroke: '#10b981', glow: 'rgba(16,185,129,0.2)',   text: 'text-emerald-600 dark:text-emerald-400' },
    amber:  { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.2)',   text: 'text-warning dark:text-warning' },
    red:    { stroke: '#ef4444', glow: 'rgba(239,68,68,0.2)',    text: 'text-destructive dark:text-destructive' },
  }

  const activeColor = value >= 85 ? 'red' : value >= 65 ? 'amber' : color
  const c = colorMap[activeColor] || colorMap.blue

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={size * 0.083} />
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={c.stroke}
          strokeWidth={size * 0.083}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${c.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-extrabold leading-none ${size >= 120 ? 'text-2xl' : 'text-xl'} text-slate-900 dark:text-white`}>
          {Math.round(clamped)}
        </span>
        <span className="text-xs text-slate-400 font-medium">%</span>
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
    const interval = setInterval(fetchLiveStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveStatus])

  const parseCpuLoad = (load: string | number | undefined | null) => {
    if (load === undefined || load === null) return 0
    if (typeof load === 'number') return Math.round(load)
    return parseInt(String(load).replace('%', '')) || 0
  }

  const parseMemory = (free: string, total: string) => {
    const freeNum = parseInt(free) || 0
    const totalNum = parseInt(total) || 1
    const usedPercent = ((totalNum - freeNum) / totalNum) * 100
    const freeMB = (freeNum / 1024 / 1024).toFixed(0)
    const totalMB = (totalNum / 1024 / 1024).toFixed(0)
    return { usedPercent, freeMB, totalMB }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Connecting to router…</p>
        </div>
      </div>
    )
  }

  if (!liveStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 dark:bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">Unable to connect</p>
        <p className="text-sm text-slate-400">Router may be offline or credentials invalid</p>
        <Button onClick={() => { setIsRefreshing(true); fetchLiveStatus() }} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  const memory = parseMemory(liveStatus.free_memory, liveStatus.total_memory)
  const cpuLoad = parseCpuLoad(liveStatus.cpu_load)
  const hddFree = (parseInt(liveStatus.free_hdd) / 1024 / 1024).toFixed(1)

  const cpuColor = cpuLoad >= 85 ? 'red' : cpuLoad >= 65 ? 'amber' : 'blue'
  const memColor = memory.usedPercent >= 85 ? 'red' : memory.usedPercent >= 65 ? 'amber' : 'purple'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${
            liveStatus.online
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${liveStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
            {liveStatus.online ? 'Online' : 'Offline'}
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => { setIsRefreshing(true); fetchLiveStatus() }} disabled={isRefreshing} className="rounded-xl">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Identity Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Server,      label: 'Identity',    value: liveStatus.identity,    color: 'from-blue-400 to-indigo-500',   shadow: 'shadow-blue-500/25' },
          { icon: Wifi,        label: 'Model',       value: liveStatus.model,       color: 'from-purple-400 to-violet-500', shadow: 'shadow-purple-500/25' },
          { icon: Zap,         label: 'Firmware',    value: liveStatus.firmware,    color: 'from-emerald-400 to-teal-500',  shadow: 'shadow-emerald-500/25' },
          { icon: Clock,       label: 'Uptime',      value: liveStatus.uptime,      color: 'from-amber-400 to-orange-500',  shadow: 'shadow-amber-500/25' },
        ].map(({ icon: Icon, label, value, color, shadow }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${color} shadow-lg ${shadow} flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resource Gauges */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* CPU */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 90% -10%, ${cpuLoad >= 85 ? 'rgba(239,68,68,0.2)' : cpuLoad >= 65 ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)'}, transparent 60%)` }} />
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cpuLoad >= 85 ? 'from-red-400 to-rose-500' : cpuLoad >= 65 ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-indigo-500'}`} />
          <div className="relative flex items-center gap-6">
            <ArcGauge value={cpuLoad} color={cpuColor} size={120} />
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cpuLoad >= 85 ? 'from-red-400 to-rose-500' : cpuLoad >= 65 ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-indigo-500'}`}>
                    <Cpu className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">CPU Usage</p>
                </div>
                <p className="text-xs text-slate-400">{cpuLoad}% utilization</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
                <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${cpuLoad >= 85 ? 'bg-gradient-to-r from-red-400 to-rose-500' : cpuLoad >= 65 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
                    style={{ width: `${cpuLoad}%` }}
                  />
                </div>
                <div className="flex gap-3">
                  {[{ label: 'Normal', dot: 'bg-primary/40' }, { label: 'High', dot: 'bg-warning' }, { label: 'Critical', dot: 'bg-red-400' }].map(t => (
                    <div key={t.label} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                      <span className="text-[10px] text-slate-400">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 90% -10%, ${memory.usedPercent >= 85 ? 'rgba(239,68,68,0.2)' : memory.usedPercent >= 65 ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.15)'}, transparent 60%)` }} />
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${memory.usedPercent >= 85 ? 'from-red-400 to-rose-500' : memory.usedPercent >= 65 ? 'from-amber-400 to-orange-500' : 'from-purple-400 to-violet-500'}`} />
          <div className="relative flex items-center gap-6">
            <ArcGauge value={memory.usedPercent} color={memColor} size={120} />
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${memory.usedPercent >= 85 ? 'from-red-400 to-rose-500' : memory.usedPercent >= 65 ? 'from-amber-400 to-orange-500' : 'from-purple-400 to-violet-500'}`}>
                    <HardDrive className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Memory Usage</p>
                </div>
                <p className="text-xs text-slate-400">{memory.freeMB} MB free of {memory.totalMB} MB</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
                <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${memory.usedPercent >= 85 ? 'bg-gradient-to-r from-red-400 to-rose-500' : memory.usedPercent >= 65 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-purple-400 to-violet-500'}`}
                    style={{ width: `${Math.min(100, memory.usedPercent)}%` }}
                  />
                </div>
                <div className="flex gap-3">
                  {[{ label: 'Normal', dot: 'bg-purple-400' }, { label: 'High', dot: 'bg-warning' }, { label: 'Critical', dot: 'bg-red-400' }].map(t => (
                    <div key={t.label} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                      <span className="text-[10px] text-slate-400">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Details */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-5">System Details</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Serial Number', value: liveStatus.serial, mono: true },
            { label: 'Architecture',  value: liveStatus.architecture, mono: false },
            { label: 'Free Storage',  value: `${hddFree} MB`, mono: false },
            { label: 'Status',        value: liveStatus.online ? 'Connected' : 'Disconnected', mono: false, isStatus: true, online: liveStatus.online },
          ].map(({ label, value, mono, isStatus, online }) => (
            <div key={label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
              {isStatus ? (
                <div className="flex items-center gap-1.5">
                  {online
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-destructive" />}
                  <span className={`text-sm font-semibold ${online ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive dark:text-destructive'}`}>{value}</span>
                </div>
              ) : (
                <p className={`text-sm font-semibold text-slate-900 dark:text-white capitalize ${mono ? 'font-mono' : ''}`}>{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}