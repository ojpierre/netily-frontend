"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Clock3, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type SessionInactivityGuardProps = {
  onLogout: () => void
  areaLabel?: string
  timeoutMs?: number
  warningMs?: number
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const DEFAULT_WARNING_MS = 30 * 1000

export function SessionInactivityGuard({
  onLogout,
  areaLabel = "dashboard",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_MS,
}: SessionInactivityGuardProps) {
  const [warningOpen, setWarningOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(warningMs / 1000))
  const warningTimerRef = useRef<number | null>(null)
  const logoutTimerRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const warningStartedAtRef = useRef<number | null>(null)
  const warningOpenRef = useRef(false)
  const hasLoggedOutRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current)
    if (countdownRef.current) window.clearInterval(countdownRef.current)
    warningTimerRef.current = null
    logoutTimerRef.current = null
    countdownRef.current = null
  }, [])

  const expireSession = useCallback(() => {
    if (hasLoggedOutRef.current) return
    hasLoggedOutRef.current = true
    clearTimers()
    warningOpenRef.current = false
    setWarningOpen(false)
    onLogout()
  }, [clearTimers, onLogout])

  const startCountdown = useCallback(() => {
    warningStartedAtRef.current = Date.now()
    warningOpenRef.current = true
    setSecondsLeft(Math.ceil(warningMs / 1000))
    setWarningOpen(true)

    if (countdownRef.current) window.clearInterval(countdownRef.current)
    countdownRef.current = window.setInterval(() => {
      const startedAt = warningStartedAtRef.current || Date.now()
      const remaining = Math.max(0, Math.ceil((warningMs - (Date.now() - startedAt)) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) expireSession()
    }, 500)
  }, [expireSession, warningMs])

  const resetIdleWindow = useCallback(() => {
    if (hasLoggedOutRef.current) return
    clearTimers()
    warningOpenRef.current = false
    setWarningOpen(false)
    warningStartedAtRef.current = null

    const warningDelay = Math.max(0, timeoutMs - warningMs)
    warningTimerRef.current = window.setTimeout(startCountdown, warningDelay)
    logoutTimerRef.current = window.setTimeout(expireSession, timeoutMs)
  }, [clearTimers, expireSession, startCountdown, timeoutMs, warningMs])

  useEffect(() => {
    resetIdleWindow()

    const activityEvents: Array<keyof WindowEventMap> = [
      "keydown",
      "mousedown",
      "mousemove",
      "scroll",
      "touchstart",
      "wheel",
    ]

    const handleActivity = () => {
      if (!warningOpenRef.current) resetIdleWindow()
    }

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    )
    window.addEventListener("focus", handleActivity)

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
      window.removeEventListener("focus", handleActivity)
      clearTimers()
    }
  }, [clearTimers, resetIdleWindow])

  if (!warningOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 text-foreground shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <Clock3 className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">Your session is about to expire</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          You have been inactive on the {areaLabel}. For security, we will sign you out in{" "}
          <span className="font-semibold text-foreground">{secondsLeft}s</span>.
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, (secondsLeft / Math.ceil(warningMs / 1000)) * 100))}%` }}
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={expireSession}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
          <Button type="button" onClick={resetIdleWindow}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Stay signed in
          </Button>
        </div>
      </div>
    </div>
  )
}
