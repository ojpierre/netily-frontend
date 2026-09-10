"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
  Server,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { superadminApi, type ServerStatsResponse } from "@/lib/superadmin-api"

const POLL_MS = 6000
const HISTORY_LIMIT = 30

const STATUS_COLOR: Record<string, string> = {
  healthy: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
}

const statusBadge = (status: string) => {
  const cls =
    status === "critical"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : status === "warning"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  return <Badge className={cls}>{status}</Badge>
}

interface HistoryPoint {
  time: string
  totalMemMb: number
  avgCpu: number
}

export default function ServerStatsPage() {
  const [data, setData] = useState<ServerStatsResponse | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await superadminApi.getServerStats()
      setData(res)
      setError("")

      const totalMemMb = res.containers.reduce((sum, c) => sum + c.mem_used_mb, 0)
      const avgCpu =
        res.containers.length > 0
          ? res.containers.reduce((sum, c) => sum + c.cpu_percent, 0) / res.containers.length
          : 0

      setHistory((prev) => {
        const next = [
          ...prev,
          {
            time: new Date(res.timestamp).toLocaleTimeString("en-KE", { hour12: false }),
            totalMemMb: Math.round(totalMemMb),
            avgCpu: Math.round(avgCpu * 10) / 10,
          },
        ]
        return next.slice(-HISTORY_LIMIT)
      })
    } catch (err: any) {
      setError(err?.message || "Failed to load server stats")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    const startPolling = () => {
      if (timerRef.current) return
      timerRef.current = setInterval(fetchStats, POLL_MS)
    }
    const stopPolling = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    // Pause polling when the tab isn't visible — saves DB/CPU on the server.
    const handleVisibility = () => {
      if (document.hidden) stopPolling()
      else {
        fetchStats()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    )
  }

  const host = data?.host
  const containers = data?.containers || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-violet-400" />
            Server Stats
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live container &amp; VPS resource usage — refreshes every {POLL_MS / 1000}s
          </p>
        </div>
        {data && (
          <p className="text-xs text-slate-500">
            Updated {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Host summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Disk Usage</p>
                <p className="text-xl font-bold text-white">
                  {host?.disk_used_gb ?? 0} / {host?.disk_total_gb ?? 0} GB
                </p>
              </div>
              {host && statusBadge(host.disk_status)}
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${host?.disk_percent ?? 0}%`,
                  backgroundColor: STATUS_COLOR[host?.disk_status || "healthy"],
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Cpu className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Load Average (1m / 5m / 15m)</p>
                <p className="text-xl font-bold text-white">
                  {host?.load_avg_1m} / {host?.load_avg_5m} / {host?.load_avg_15m}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{host?.cpu_count} vCPU(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <MemoryStick className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Containers Tracked</p>
                <p className="text-xl font-bold text-white">{containers.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {containers.filter((c) => c.status !== "healthy").length} need attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend line chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Memory &amp; CPU Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="mem" stroke="#10b981" fontSize={11} />
              <YAxis yAxisId="cpu" orientation="right" stroke="#f59e0b" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                yAxisId="mem"
                type="monotone"
                dataKey="totalMemMb"
                name="Total Mem (MB)"
                stroke="#10b981"
                dot={false}
                strokeWidth={2}
              />
              <Line
                yAxisId="cpu"
                type="monotone"
                dataKey="avgCpu"
                name="Avg CPU %"
                stroke="#f59e0b"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-container bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Memory % by Container</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(containers.length * 34, 200)}>
              <BarChart data={containers} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }} />
                <Bar dataKey="mem_percent" radius={[0, 4, 4, 0]}>
                  {containers.map((c) => (
                    <React.Fragment key={c.name} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">CPU % by Container</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(containers.length * 34, 200)}>
              <BarChart data={containers} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }} />
                <Bar dataKey="cpu_percent" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Container Detail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="px-4 py-3">Container</th>
                  <th className="px-4 py-3">CPU</th>
                  <th className="px-4 py-3">Memory</th>
                  <th className="px-4 py-3">Net I/O</th>
                  <th className="px-4 py-3">Block I/O</th>
                  <th className="px-4 py-3">PIDs</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {containers.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-slate-300">{c.cpu_percent.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-slate-300">
                      {c.mem_used_mb.toFixed(0)} / {c.mem_limit_mb.toFixed(0)} MB ({c.mem_percent.toFixed(1)}%)
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      ↓{c.net_in_mb.toFixed(2)}MB / ↑{c.net_out_mb.toFixed(2)}MB
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      ↓{c.block_in_mb.toFixed(2)}MB / ↑{c.block_out_mb.toFixed(2)}MB
                    </td>
                    <td className="px-4 py-3 text-slate-300">{c.pids}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}