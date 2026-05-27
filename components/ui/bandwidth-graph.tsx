// components/ui/bandwidth-graph.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, TrendingDown, TrendingUp } from "lucide-react"

interface DataPoint {
  time: string
  rx: number // kbps
  tx: number // kbps
}

interface BandwidthGraphProps {
  username: string
  isOnline: boolean
  baseUrl: string
  authToken: string
  maxPoints?: number
  pollIntervalMs?: number
}

export function BandwidthGraph({
  username,
  isOnline,
  baseUrl,
  authToken,
  maxPoints = 30,
  pollIntervalMs = 4000,
}: BandwidthGraphProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [currentRx, setCurrentRx] = useState(0)
  const [currentTx, setCurrentTx] = useState(0)
  const [peakRx, setPeakRx] = useState(0)
  const [peakTx, setPeakTx] = useState(0)
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting")
  const prevRef = useRef<{ bytes_in: number; bytes_out: number; ts: number } | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`
    return `${kbps.toFixed(0)} Kbps`
  }

  const fetchAndUpdate = async () => {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/radius/accounting/?username=${encodeURIComponent(username)}&active=true&page_size=1`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      if (!res.ok) throw new Error("fetch failed")
      const json = await res.json()
      const session = json.results?.[0]
      if (!session) return

      const now = Date.now()
      const bytesIn = session.acctinputoctets || 0
      const bytesOut = session.acctoutputoctets || 0

      if (prevRef.current) {
        const dtSec = (now - prevRef.current.ts) / 1000
        const rxKbps = Math.max(0, ((bytesIn - prevRef.current.bytes_in) * 8) / dtSec / 1000)
        const txKbps = Math.max(0, ((bytesOut - prevRef.current.bytes_out) * 8) / dtSec / 1000)

        setCurrentRx(rxKbps)
        setCurrentTx(txKbps)
        setPeakRx(p => Math.max(p, rxKbps))
        setPeakTx(p => Math.max(p, txKbps))

        const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        setData(prev => [...prev.slice(-(maxPoints - 1)), { time: timeLabel, rx: rxKbps, tx: txKbps }])
        setStatus("live")
      }

      prevRef.current = { bytes_in: bytesIn, bytes_out: bytesOut, ts: now }
    } catch {
      setStatus("error")
    }
  }

  useEffect(() => {
    if (!isOnline || !username) return
    fetchAndUpdate() // immediate first fetch
    intervalRef.current = setInterval(fetchAndUpdate, pollIntervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [username, isOnline])

  // SVG sparkline renderer
  const renderSparkline = (points: number[], color: string, height = 60) => {
    if (points.length < 2) return null
    const max = Math.max(...points, 1)
    const w = 100 / (points.length - 1)
    const coords = points.map((v, i) => `${i * w},${height - (v / max) * height}`)
    return (
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  const rxPoints = data.map(d => d.rx)
  const txPoints = data.map(d => d.tx)
  const maxVal = Math.max(...rxPoints, ...txPoints, 1)

  if (!isOnline) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-700">Live Bandwidth</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "live" ? "bg-emerald-500 animate-pulse" :
              status === "connecting" ? "bg-amber-400 animate-pulse" : "bg-red-400"
            }`}
          />
          <span className="text-xs text-slate-500">
            {status === "live" ? "Live" : status === "connecting" ? "Connecting..." : "Error"}
          </span>
        </div>
      </div>

      {/* Current speeds */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-emerald-100">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs text-slate-500 font-medium">Download (RX)</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">{formatSpeed(currentRx)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Peak: {formatSpeed(peakRx)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-slate-500 font-medium">Upload (TX)</span>
          </div>
          <p className="text-lg font-bold text-blue-600">{formatSpeed(currentTx)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Peak: {formatSpeed(peakTx)}</p>
        </div>
      </div>

      {/* SVG Graph */}
      <div className="relative bg-white rounded-lg border border-slate-200 p-2 overflow-hidden" style={{ height: 80 }}>
        {data.length < 2 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-slate-400">Collecting data...</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${(data.length - 1) * (100 / (data.length - 1)) * (data.length - 1)} 60`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <line
                key={ratio}
                x1="0" y1={60 * ratio}
                x2="100%" y2={60 * ratio}
                stroke="#f1f5f9"
                strokeWidth="0.5"
              />
            ))}
            {/* RX line (green) */}
            <svg viewBox={`0 0 100 60`} preserveAspectRatio="none" width="100%" height="100%">
              {renderSparkline(rxPoints.map(v => (v / maxVal) * 60), "#10b981")}
              {renderSparkline(txPoints.map(v => (v / maxVal) * 60), "#3b82f6")}
            </svg>
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
          Download (RX)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
          Upload (TX)
        </span>
        <span className="ml-auto opacity-60">Updates every 4s</span>
      </div>
    </div>
  )
}