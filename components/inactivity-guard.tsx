"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Loader2, Mail, LogOut, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminApi } from "@/lib/admin-api"
import { useAdminAuth } from "@/app/admin/admin-auth-context"

interface InactivityGuardProps {
  children: React.ReactNode
  /** Inactivity timeout in minutes before showing the popup */
  timeoutMinutes?: number
}

export function InactivityGuard({ children, timeoutMinutes = 5 }: InactivityGuardProps) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const [otpSent, setOtpSent] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { logout } = useAdminAuth()

  const timeoutMs = timeoutMinutes * 60 * 1000

  const resetTimer = useCallback(() => {
    if (showOverlay) return // Don't reset while overlay is showing
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setShowOverlay(true)
    }, timeoutMs)
  }, [timeoutMs, showOverlay])

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]
    const handler = () => resetTimer()
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
    resetTimer()
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.sendOTP()
      setMaskedEmail(res.email || "your email")
      setOtpSent(true)
      setCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpValues]
    newOtp[index] = value.slice(-1)
    setOtpValues(newOtp)
    setError(null)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtpValues(pasted.split(""))
      inputRefs.current[5]?.focus()
    }
  }

  const verify = async () => {
    const otp = otpValues.join("")
    if (otp.length !== 6) { setError("Enter the full 6-digit code"); return }
    setLoading(true)
    setError(null)
    try {
      await adminApi.verifyOTP(otp)
      setShowOverlay(false)
      setOtpSent(false)
      setOtpValues(["", "", "", "", "", ""])
      setError(null)
      resetTimer()
    } catch (err: any) {
      setError(err.message || "Invalid code")
      setOtpValues(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {children}

      {/* Inactivity overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Blur backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

          {/* Modal */}
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Session Timeout</h2>
              <p className="text-sm text-slate-500">
                You&apos;ve been inactive for a while. For your security, please verify your identity to continue.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-3">
                <Button onClick={sendOtp} className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending code...</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" />Send Verification Code</>
                  )}
                </Button>
                <Button variant="outline" onClick={logout} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-center text-slate-500">
                  Code sent to <span className="font-medium text-slate-700">{maskedEmail}</span>
                </p>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otpValues.map((val, i) => (
                    <Input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold"
                      disabled={loading}
                    />
                  ))}
                </div>
                <Button onClick={verify} className="w-full" disabled={loading || otpValues.join("").length !== 6}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : "Verify & Continue"}
                </Button>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    {cooldown > 0 ? `Resend in ${cooldown}s` : (
                      <button onClick={sendOtp} className="text-blue-600 hover:underline font-medium">Resend</button>
                    )}
                  </p>
                  <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 font-medium">
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
