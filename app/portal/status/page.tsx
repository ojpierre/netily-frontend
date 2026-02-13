"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Wifi, Clock, ArrowUpDown, Loader2, LogOut, CreditCard, XCircle } from "lucide-react"

// ==========================================
// TYPES
// ==========================================

interface SessionInfo {
  has_session: boolean
  plan_name?: string
  expires_at?: string
  remaining_minutes?: number
  data_used_mb?: number
  data_limit_mb?: number
  speed?: string
  session_start?: string
}

// ==========================================
// API
// ==========================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

async function fetchSessionInfo(routerId: string, mac: string): Promise<SessionInfo> {
  const response = await fetch(`${API_BASE}/hotspot/auto-login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ router_id: routerId, mac_address: mac }),
  })
  if (!response.ok) throw new Error("Failed to fetch session info")
  return response.json()
}

// ==========================================
// HELPERS
// ==========================================

function formatTimeRemaining(minutes: number | undefined): string {
  if (!minutes || minutes <= 0) return "Expired"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) return `${hours}h ${mins}m`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return `${days}d ${remHours}h`
}

function formatData(mb: number | null | undefined): string {
  if (!mb) return "—"
  if (mb < 1000) return `${Math.round(mb)} MB`
  return `${(mb / 1000).toFixed(1)} GB`
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

// ==========================================
// STATUS PAGE COMPONENT
// ==========================================

function PortalStatusContent() {
  const searchParams = useSearchParams()

  const mac = searchParams.get("mac") || "00:00:00:00:00:00"
  const ip = searchParams.get("ip") || ""
  const routerId = searchParams.get("router_id") || ""
  const tenant = searchParams.get("tenant") || ""

  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!routerId || mac === "00:00:00:00:00:00") {
      setError("Missing connection info.")
      setLoading(false)
      return
    }
    loadSession()
  }, [routerId, mac]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSession = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await fetchSessionInfo(routerId, mac)
      setSession(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load session")
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Loading Session...</h2>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Error</h2>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  // ── No active session ──
  if (!session?.has_session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Wifi className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">No Active Session</h2>
          <p className="text-gray-500 mt-2">You don&apos;t have an active internet session.</p>
          <a
            href={`/portal/login?mac=${mac}&ip=${ip}&router_id=${routerId}&tenant=${tenant}`}
            className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Buy a Plan
          </a>
        </div>
      </div>
    )
  }

  // ── Active session ──
  const timeColor = (session.remaining_minutes ?? 0) <= 10 ? "text-red-500" : "text-emerald-600"

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wifi className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">You&apos;re Connected!</h2>
          <p className="text-gray-500 text-sm">{session.plan_name || "Active Plan"}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Time Remaining */}
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Clock className={`w-5 h-5 ${timeColor} mx-auto mb-1`} />
            <p className={`text-lg font-bold ${timeColor}`}>
              {formatTimeRemaining(session.remaining_minutes)}
            </p>
            <p className="text-xs text-gray-400">Remaining</p>
          </div>

          {/* Speed */}
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <ArrowUpDown className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-500">
              {session.speed || "Standard"}
            </p>
            <p className="text-xs text-gray-400">Speed</p>
          </div>

          {/* Data Used */}
          {session.data_limit_mb && (
            <>
              <div className="bg-gray-50 rounded-xl p-3 text-center col-span-2">
                <p className="text-sm font-semibold text-gray-700">
                  {formatData(session.data_used_mb)} / {formatData(session.data_limit_mb)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((session.data_used_mb || 0) / session.data_limit_mb) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Data Usage</p>
              </div>
            </>
          )}
        </div>

        {/* Session Info */}
        <div className="text-sm text-gray-500 space-y-1 mb-6 border-t pt-4">
          <div className="flex justify-between">
            <span>Expires</span>
            <span className="text-gray-700">{formatDateTime(session.expires_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>IP Address</span>
            <span className="text-gray-700">{ip}</span>
          </div>
          <div className="flex justify-between">
            <span>MAC</span>
            <span className="text-gray-700 font-mono text-xs">{mac}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <a
            href={`/portal/login?mac=${mac}&ip=${ip}&router_id=${routerId}&tenant=${tenant}`}
            className="block w-full py-3 bg-indigo-600 text-white rounded-xl text-center font-semibold hover:bg-indigo-700 transition-colors"
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Buy More Time
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by Netily
        </p>
      </div>
    </div>
  )
}

// ==========================================
// PAGE WRAPPER
// ==========================================

export default function PortalStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-white" />
        </div>
      }
    >
      <PortalStatusContent />
    </Suspense>
  )
}
