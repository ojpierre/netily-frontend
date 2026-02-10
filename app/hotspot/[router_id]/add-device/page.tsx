"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tv, Loader2, CheckCircle2, XCircle, RefreshCw, Smartphone } from "lucide-react"

/**
 * Smart TV / Limited Device — Pairing Code Page
 * 
 * Cloud Controller flow for devices that can't do M-Pesa STK Push:
 * 1. Smart TV connects to hotspot → redirected here
 * 2. This page requests a 6-digit pairing code from the backend
 * 3. TV displays the code + polls for authorization
 * 4. User enters the code on their phone (which has internet)
 * 5. Phone authorizes the TV's MAC via the API
 * 6. TV gets internet access
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

type PairingStatus = "loading" | "showing_code" | "authorized" | "expired" | "error"

export default function AddDevicePage({ params }: { params: { router_id: string } }) {
  const routerId = params.router_id
  const searchParams = useSearchParams()
  const macAddress = searchParams.get("mac") || "00:00:00:00:00:00"

  const [status, setStatus] = useState<PairingStatus>("loading")
  const [pairingCode, setPairingCode] = useState<string>("")
  const [countdown, setCountdown] = useState(300) // 5 minutes
  const [error, setError] = useState<string>("")

  // Request pairing code on mount
  useEffect(() => {
    requestPairingCode()
  }, [])

  // Poll for authorization status
  useEffect(() => {
    if (status !== "showing_code") return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_BASE}/hotspot/device-auth/status/?router_id=${routerId}&mac=${encodeURIComponent(macAddress)}`
        )
        const data = await response.json()

        if (data.status === "authorized") {
          setStatus("authorized")
          clearInterval(pollInterval)
        }
      } catch {
        // Continue polling silently
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [status, routerId, macAddress])

  // Countdown timer
  useEffect(() => {
    if (status !== "showing_code") return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("expired")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  async function requestPairingCode() {
    setStatus("loading")
    setError("")
    setCountdown(300)

    try {
      const response = await fetch(`${API_BASE}/hotspot/device-auth/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          router_id: routerId,
          mac_address: macAddress,
          device_type: "smart_tv",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get pairing code")
      }

      const data = await response.json()
      setPairingCode(data.pairing_code)
      setStatus("showing_code")
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setStatus("error")
    }
  }

  // ── Authorized ──
  if (status === "authorized") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Device Authorized!</h1>
          <p className="text-gray-600 text-lg mb-6">
            This device now has internet access. It should connect automatically within 30 seconds.
          </p>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-700">
              If the connection doesn&apos;t start automatically, disconnect and reconnect to the WiFi network.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={requestPairingCode}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Preparing device pairing...</p>
        </div>
      </div>
    )
  }

  // ── Expired ──
  if (status === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Code Expired</h1>
          <p className="text-gray-600 mb-6">The pairing code has expired. Please request a new one.</p>
          <button
            onClick={requestPairingCode}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Get New Code
          </button>
        </div>
      </div>
    )
  }

  // ── Showing Pairing Code ──
  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center text-white">
          <Tv className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Connect This Device</h1>
          <p className="text-blue-100 text-sm mt-1">Smart TV / Limited Browser Detected</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <p className="text-gray-600 mb-6">
            This device can&apos;t process M-Pesa payments directly. 
            Use your phone to authorize it.
          </p>

          {/* Pairing Code */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-6">
            <p className="text-sm text-gray-500 mb-3 uppercase tracking-wide">Pairing Code</p>
            <div className="flex justify-center gap-2">
              {pairingCode.split("").map((digit, i) => (
                <div
                  key={i}
                  className="w-14 h-16 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center text-3xl font-mono font-bold text-gray-900 shadow-sm"
                >
                  {digit}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Expires in {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-5 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              How to connect
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">1.</span>
                On your phone, connect to this WiFi and buy a plan
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">2.</span>
                After payment, go to the &quot;Add Device&quot; section
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">3.</span>
                Enter the 6-digit code shown above
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">4.</span>
                This device will connect automatically
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
