"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  FileText,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { RouterLogEntry } from "@/lib/types"

interface RouterLogsTabProps {
  routerId: number
  isDemo?: boolean
}

// Demo data
const DEMO_LOGS: RouterLogEntry[] = [
  { time: "jan/21 10:45:23", topics: "system,info", message: "router rebooted" },
  { time: "jan/21 10:44:15", topics: "firewall,info", message: "input: in:ether1 out:(unknown 0), proto TCP (SYN), 192.168.1.50:54321->192.168.1.1:8291, len 60" },
  { time: "jan/21 10:42:08", topics: "dhcp,info", message: "dhcp-server: assigned 192.168.88.55 to AA:BB:CC:DD:EE:55" },
  { time: "jan/21 10:40:00", topics: "script,info", message: "daily-backup: backup created successfully" },
  { time: "jan/21 10:38:45", topics: "wireless,info", message: "wlan1: connected to network" },
  { time: "jan/21 10:35:22", topics: "system,warning", message: "cpu overload detected, current load: 85%" },
  { time: "jan/21 10:30:00", topics: "pppoe,info", message: "pppoe-user1: logged in, ip=10.10.10.5" },
  { time: "jan/21 10:25:15", topics: "hotspot,info", message: "guest001: logged in from 172.16.0.50" },
  { time: "jan/21 10:20:00", topics: "system,error", message: "disk write error on flash" },
  { time: "jan/21 10:15:30", topics: "firewall,warning", message: "forward: possible DoS attack detected from 203.0.113.50" },
]

export function RouterLogsTab({ routerId, isDemo = false }: RouterLogsTabProps) {
  const [logs, setLogs] = useState<RouterLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lineCount, setLineCount] = useState(50)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        setLogs(DEMO_LOGS)
      } else {
        const data = await adminApi.getRouterLogs(routerId, lineCount)
        setLogs(data)
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      toast.error("Failed to fetch logs")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [routerId, isDemo, lineCount])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const getLogIcon = (topics: string) => {
    if (topics.includes("error")) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    if (topics.includes("warning")) {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />
    }
    if (topics.includes("info")) {
      return <Info className="w-4 h-4 text-blue-500" />
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getTopicBadges = (topics: string) => {
    return topics.split(",").map((topic, idx) => {
      const colors: Record<string, string> = {
        system: "bg-purple-100 text-purple-700",
        firewall: "bg-red-100 text-red-700",
        dhcp: "bg-blue-100 text-blue-700",
        script: "bg-green-100 text-green-700",
        wireless: "bg-cyan-100 text-cyan-700",
        pppoe: "bg-orange-100 text-orange-700",
        hotspot: "bg-pink-100 text-pink-700",
        info: "bg-slate-100 text-slate-700",
        warning: "bg-amber-100 text-amber-700",
        error: "bg-red-100 text-red-700",
      }
      return (
        <Badge key={idx} className={`text-xs ${colors[topic.trim()] || "bg-slate-100 text-slate-700"}`}>
          {topic.trim()}
        </Badge>
      )
    })
  }

  // Filter logs
  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.topics.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">System Logs</h2>
          <Badge variant="outline">{filteredLogs.length} entries</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48"
          />
          <Select value={String(lineCount)} onValueChange={(v) => setLineCount(parseInt(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 lines</SelectItem>
              <SelectItem value="50">50 lines</SelectItem>
              <SelectItem value="100">100 lines</SelectItem>
              <SelectItem value="200">200 lines</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No logs found
              </div>
            ) : (
              <div className="divide-y">
                {filteredLogs.map((log, idx) => (
                  <div key={idx} className="p-3 hover:bg-slate-50 flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.topics)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-slate-500 font-mono">{log.time}</span>
                        <div className="flex gap-1 flex-wrap">
                          {getTopicBadges(log.topics)}
                        </div>
                      </div>
                      <p className="text-sm font-mono break-all">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
