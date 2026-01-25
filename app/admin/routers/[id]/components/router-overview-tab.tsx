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

      {/* Resource Usage */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{cpuLoad}%</span>
                <Badge variant={cpuLoad > 80 ? "destructive" : cpuLoad > 50 ? "secondary" : "default"}>
                  {cpuLoad > 80 ? "High" : cpuLoad > 50 ? "Medium" : "Normal"}
                </Badge>
              </div>
              <Progress value={cpuLoad} className="h-3" />
            </div>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{memory.usedPercent.toFixed(0)}%</span>
                <span className="text-sm text-slate-500">
                  {memory.freeMB} MB free of {memory.totalMB} MB
                </span>
              </div>
              <Progress value={memory.usedPercent} className="h-3" />
            </div>
          </CardContent>
        </Card>
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
