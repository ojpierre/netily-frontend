"use client"

import { useEffect } from "react"
import { RefreshCw, WifiOff } from "lucide-react"

export default function HotspotError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Best-effort client-side log — visible if you ever wire up a logging endpoint
    console.error("Hotspot portal crashed:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6">
          The WiFi login page hit an unexpected error. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  )
}