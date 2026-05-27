"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Activity, TrendingDown, TrendingUp, Wifi } from "lucide-react"

interface DataPoint {
  t: number   // timestamp ms
  rx: number  // kbps
  tx: number  // kbps
}

interface Props {
  username: string
  isOnline: boolean
  baseUrl: string
  authToken: string
  maxPoints?: number
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ""
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpX = (prev.x + curr.x) / 2
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`
  }
  return d
}

function formatSpeed(kbps: number) {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`
  return `${Math.round(kbps)} Kbps`
}

export function BandwidthGraph({ username, isOnline, baseUrl, authToken, maxPoints = 20 }: Props) {
  const [points, setPoints] = useState<DataPoint[]>([])
  const [currentRx, setCurrentRx] = useState(0)
  const [currentTx, setCurrentTx] = useState(0)
  const [peakRx, setPeakRx] = useState(0)
  const [peakTx, setPeakTx] = useState(0)
  const [phase, setPhase] = useState<"connecting" | "live" | "stale" | "error">("connecting")
  const prevRef = useRef<{ bytes_in: number; bytes_out: number; ts: number } | null>(null)
  const lastSpeedRef = useRef({ rx: 0, tx: 0 })
  const animFrameRef = useRef<number | undefined>(undefined)
  const scanRef = useRef(0)
  const [scanX, setScanX] = useState(0)
  const W = 400
  const H = 80

  // ── Fetch every 30s (RADIUS interim = 3min, 30s gives 6 samples per window)
  const fetchBytes = useCallback(async () => {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/radius/accounting/?username=${encodeURIComponent(username)}&active=true&page_size=1`,
        { headers: { Authorization: `Bearer ${authToken}` }, signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) throw new Error("fetch failed")
      const json = await res.json()
      const session = json.results?.[0]
      if (!session) { setPhase("stale"); return }

      const now = Date.now()
      const bytesIn = session.acctinputoctets ?? 0
      const bytesOut = session.acctoutputoctets ?? 0

      if (prevRef.current) {
        const dtSec = (now - prevRef.current.ts) / 1000
        const bytesChanged = bytesIn !== prevRef.current.bytes_in || bytesOut !== prevRef.current.bytes_out
        
        let rx: number
        let tx: number

        if (bytesChanged) {
          // Real delta — user is actively transferring
          rx = Math.max(0, ((bytesIn - prevRef.current.bytes_in) * 8) / dtSec / 1000)
          tx = Math.max(0, ((bytesOut - prevRef.current.bytes_out) * 8) / dtSec / 1000)
          lastSpeedRef.current = { rx, tx }
          setPhase("live")
        } else {
          // No new RADIUS update yet — decay last known speed gracefully
          rx = lastSpeedRef.current.rx * 0.7
          tx = lastSpeedRef.current.tx * 0.7
          lastSpeedRef.current = { rx, tx }
          setPhase("stale")
        }

        const clampedRx = Math.min(rx, 100_000)
        const clampedTx = Math.min(tx, 100_000)
        setCurrentRx(clampedRx)
        setCurrentTx(clampedTx)
        setPeakRx(p => Math.max(p, clampedRx))
        setPeakTx(p => Math.max(p, clampedTx))
        setPoints(prev => [...prev.slice(-(maxPoints - 1)), { t: now, rx: clampedRx, tx: clampedTx }])
      }

      prevRef.current = { bytes_in: bytesIn, bytes_out: bytesOut, ts: now }
    } catch {
      setPhase("error")
    }
  }, [username, baseUrl, authToken, maxPoints])

  useEffect(() => {
    if (!isOnline || !username) return
    fetchBytes()
    const id = setInterval(fetchBytes, 30_000)
    return () => clearInterval(id)
  }, [fetchBytes, isOnline, username])

  // Animate scanner line
  useEffect(() => {
    const animate = () => {
      scanRef.current = (scanRef.current + 0.4) % W
      setScanX(scanRef.current)
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current!)
  }, [])

  if (!isOnline) return null

  // Build SVG paths
  const n = points.length
  const maxVal = Math.max(...points.map(p => Math.max(p.rx, p.tx)), 1)

  const toCoords = (vals: number[]) =>
    vals.map((v, i) => ({
      x: n <= 1 ? W : (i / (n - 1)) * W,
      y: H - (v / maxVal) * (H - 4) - 2,
    }))

  const rxCoords = toCoords(points.map(p => p.rx))
  const txCoords = toCoords(points.map(p => p.tx))
  const rxPath = smoothPath(rxCoords)
  const txPath = smoothPath(txCoords)
  const rxArea = rxPath + (rxCoords.length ? ` L ${rxCoords.at(-1)!.x} ${H} L 0 ${H} Z` : "")
  const txArea = txPath + (txCoords.length ? ` L ${txCoords.at(-1)!.x} ${H} L 0 ${H} Z` : "")

  const isLive = phase === "live"
  const dotRx = rxCoords.at(-1)
  const dotTx = txCoords.at(-1)

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={`relative flex h-2 w-2`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-emerald-500" : phase === "error" ? "bg-red-500" : "bg-amber-400"}`} />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Live Bandwidth</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {phase === "live" ? "LIVE" : phase === "stale" ? "~3m avg" : phase === "error" ? "ERR" : "…"}
        </span>
      </div>

      {/* Speed readouts */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <div className="rounded-lg bg-slate-800/60 border border-emerald-500/20 p-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Download</span>
          </div>
          <p className="text-lg font-bold font-mono text-emerald-400 tabular-nums leading-none">
            {formatSpeed(currentRx)}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5 font-mono">peak {formatSpeed(peakRx)}</p>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-sky-500/20 p-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Upload</span>
          </div>
          <p className="text-lg font-bold font-mono text-sky-400 tabular-nums leading-none">
            {formatSpeed(currentTx)}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5 font-mono">peak {formatSpeed(peakTx)}</p>
        </div>
      </div>

      {/* Graph */}
      <div className="px-4 pb-4">
        <div className="relative rounded-lg overflow-hidden bg-slate-950/60 border border-slate-700/40" style={{ height: H + 4 }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
            <defs>
              {/* RX gradient fill */}
              <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
              {/* TX gradient fill */}
              <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
              {/* Glow filters */}
              <filter id="rxGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="txGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Scanner gradient */}
              <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(r => (
              <line key={r} x1="0" y1={H * r} x2={W} y2={H * r}
                stroke="#1e293b" strokeWidth="1" strokeDasharray="3 6" />
            ))}

            {/* Area fills */}
            {n >= 2 && <path d={rxArea} fill="url(#rxGrad)" />}
            {n >= 2 && <path d={txArea} fill="url(#txGrad)" />}

            {/* Lines */}
            {n >= 2 && (
              <>
                <path d={rxPath} fill="none" stroke="#34d399" strokeWidth="1.5" filter="url(#rxGlow)" strokeLinecap="round" />
                <path d={txPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" filter="url(#txGlow)" strokeLinecap="round" />
              </>
            )}

            {/* Live dots */}
            {dotRx && n >= 1 && (
              <>
                <circle cx={dotRx.x} cy={dotRx.y} r="3" fill="#34d399" opacity="0.3" />
                <circle cx={dotRx.x} cy={dotRx.y} r="1.5" fill="#34d399" />
              </>
            )}
            {dotTx && n >= 1 && (
              <>
                <circle cx={dotTx.x} cy={dotTx.y} r="3" fill="#38bdf8" opacity="0.3" />
                <circle cx={dotTx.x} cy={dotTx.y} r="1.5" fill="#38bdf8" />
              </>
            )}

            {/* Animated scanner */}
            <rect x={scanX - 20} y={0} width={40} height={H} fill="url(#scanGrad)" />

            {/* No data state */}
            {n < 2 && (
              <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="middle"
                fill="#475569" fontSize="10" fontFamily="monospace">
                {phase === "connecting" ? "Collecting data…" : "Waiting for traffic"}
              </text>
            )}
          </svg>
        </div>

        {/* Legend + note */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-3 h-px bg-emerald-400 inline-block" />RX
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-3 h-px bg-sky-400 inline-block" />TX
            </span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">
            {phase === "stale" ? "⟳ next update ~3m" : "⟳ 30s poll"}
          </span>
        </div>
      </div>
    </div>
  )
}