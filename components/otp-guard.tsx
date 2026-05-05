"use client"

import React, { useState, useRef, useEffect } from "react"
import { Loader2, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { adminApi } from "@/lib/admin-api"

interface OtpGuardProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function OtpGuard({ children, title = "Verification Required", description = "This page contains sensitive information. Please verify your identity." }: OtpGuardProps) {
  const [verified, setVerified] = useState(false)
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const [maskedEmail, setMaskedEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const [otpId, setOtpId] = useState<string>("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendOtp = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await adminApi.sendOTP()
      if (res.bypass || res.verified) {
        setVerified(true)
        return
      }
      setMaskedEmail(res.email || "your email")
      setOtpId(res.otp_id || "")
      setOtpSent(true)
      setCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setSending(false)
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
      await adminApi.verifyOTP(otp, otpId || undefined)
      setVerified(true)
    } catch (err: any) {
      setError(err.message || "Invalid code")
      setOtpValues(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  if (verified) return <>{children}</>

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!otpSent ? (
            <Button onClick={sendOtp} className="w-full" disabled={sending}>
              {sending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending code...</>
              ) : (
                <><Mail className="mr-2 h-4 w-4" />Send Verification Code</>
              )}
            </Button>
          ) : (
            <>
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
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : "Verify & Access"}
              </Button>
              <p className="text-sm text-center text-slate-400">
                {cooldown > 0 ? `Resend in ${cooldown}s` : (
                  <button onClick={sendOtp} className="text-blue-600 hover:underline font-medium">Resend code</button>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
