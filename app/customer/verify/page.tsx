"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Wifi, Loader2, CheckCircle, Phone, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { customerApi } from "@/lib/customer-api"

function VerifyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get("phone") || ""

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Take only last character

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join("")
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)

    try {
      const response = await customerApi.verifyPhone({
        phone_number: phoneNumber,
        otp_code: otpCode,
      })

      if (response.verified) {
        setVerified(true)
        toast.success("Phone number verified successfully!")
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        toast.error(response.message || "Verification failed. Please try again.")
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch (error: any) {
      console.error("Verification error:", error)
      toast.error(error.message || "Verification failed. Please try again.")
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setIsResending(true)

    try {
      await customerApi.resendOTP({ phone_number: phoneNumber })
      toast.success("Verification code sent!")
      setCountdown(60)
      setCanResend(false)
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (error: any) {
      console.error("Resend error:", error)
      toast.error(error.message || "Failed to resend code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  // Success state
  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verified!</h2>
            <p className="text-slate-600 mb-4">
              Your phone number has been verified successfully.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mask phone number for display
  const maskedPhone = phoneNumber
    ? `${phoneNumber.slice(0, 6)}****${phoneNumber.slice(-2)}`
    : "your phone"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Customer Portal</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <span className="font-medium">{maskedPhone}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={isLoading || otp.some((d) => !d)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Phone Number"
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              {canResend ? (
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-primary hover:text-primary"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-sm text-slate-500">
                  Resend code in <span className="font-medium">{countdown}s</span>
                </p>
              )}
            </div>

            {/* Back Link */}
            <div className="text-center">
              <Link
                href="/customer/login"
                className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  )
}
