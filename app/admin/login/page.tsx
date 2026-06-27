"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, AlertCircle, Mail, Wifi } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useAdminAuth } from "@/app/admin/admin-auth-context"
import { adminApi, type AdminLoginChallengeResponse, type AdminLoginResponse } from "@/lib/admin-api"

// Check if using mock mode
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const formatDuration = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, "0")}`
}

export default function AdminLoginPage() {
  const router = useRouter()
  const { establishSession, user, loading: authLoading } = useAdminAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mouse position for gradient lighting effect
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // OTP state
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const [otpMaskedEmail, setOtpMaskedEmail] = useState("")
  const [otpResendCooldown, setOtpResendCooldown] = useState(0)
  const [otpExpiresIn, setOtpExpiresIn] = useState(0)
  const [otpResendCount, setOtpResendCount] = useState(0)
  const [otpMaxResends, setOtpMaxResends] = useState(5)
  const [challengeId, setChallengeId] = useState("")
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const clearStaleAdminAuth = () => {
    const scoped = (k: string) => `${k}:${window.location.hostname}`
    localStorage.removeItem(scoped("adminToken"))
    localStorage.removeItem(scoped("adminRefreshToken"))
    localStorage.removeItem(scoped("adminUser"))
    sessionStorage.removeItem(scoped("adminToken"))
    sessionStorage.removeItem(scoped("adminRefreshToken"))
    sessionStorage.removeItem(scoped("adminUser"))
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminRefreshToken")
    localStorage.removeItem("adminUser")
    sessionStorage.removeItem("adminToken")
    sessionStorage.removeItem("adminRefreshToken")
    sessionStorage.removeItem("adminUser")

    const host = window.location.hostname
    const hostParts = host.split(".")
    const baseDomain = hostParts.length >= 2 ? `.${hostParts.slice(-2).join(".")}` : ""
    const expire = (name: string, domain?: string) => {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domain ? `; domain=${domain}` : ""}`
    }
    expire("adminToken")
    expire("adminRefreshToken")
    if (baseDomain) {
      expire("adminToken", baseDomain)
      expire("adminRefreshToken", baseDomain)
    }
  }

  // Mouse tracking for gradient lighting
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        setMouse({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/admin")
    }
  }, [user, authLoading, router])

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (otpResendCooldown <= 0) return
    const timer = setTimeout(() => setOtpResendCooldown(otpResendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [otpResendCooldown])

  useEffect(() => {
    if (otpExpiresIn <= 0) return
    const timer = setTimeout(() => setOtpExpiresIn(otpExpiresIn - 1), 1000)
    return () => clearTimeout(timer)
  }, [otpExpiresIn])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }))
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpValues]
    newOtp[index] = value.slice(-1)
    setOtpValues(newOtp)
    setError(null)

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtpValues(pasted.split(""))
      otpInputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields")
      }

      clearStaleAdminAuth()

      if (USE_MOCK) {
        const mockLoginResponse = await adminApi.login(formData.email, formData.password)
        if ((mockLoginResponse as any).requires_otp) {
          throw new Error("Mock mode is not configured for OTP challenge responses.")
        }
        establishSession(mockLoginResponse as AdminLoginResponse, formData.rememberMe)
        window.location.href = "/admin"
        return
      }

      const response = await adminApi.login(formData.email, formData.password)

      if ((response as AdminLoginChallengeResponse).requires_otp) {
        const challenge = response as AdminLoginChallengeResponse
        setChallengeId(challenge.challenge_id)
        setOtpMaskedEmail(challenge.email || "your email")
        setOtpResendCooldown(Math.max(0, challenge.resend_available_in || 60))
        setOtpExpiresIn(Math.max(0, challenge.expires_in || 300))
        setOtpResendCount(0)
        setOtpMaxResends(challenge.max_resends || 5)
        setStep("otp")
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
        return
      }

      const success = response as AdminLoginResponse
      establishSession(success, formData.rememberMe)
      window.location.href = "/admin"
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otp = otpValues.join("")
    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!challengeId) {
        throw new Error("Your login session expired. Please sign in again.")
      }
      const response = await adminApi.login(formData.email, formData.password, {
        challenge_id: challengeId,
        otp_code: otp,
      })
      if ((response as AdminLoginChallengeResponse).requires_otp) {
        throw new Error("OTP verification not completed. Please try again.")
      }
      establishSession(response as AdminLoginResponse, formData.rememberMe)
      window.location.href = "/admin"
    } catch (err: any) {
      setError(err.message || "Invalid OTP")
      setOtpValues(["", "", "", "", "", ""])
      otpInputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return
    setError(null)

    try {
      if (!challengeId) {
        throw new Error("Login challenge expired. Please sign in again.")
      }
      const otpRes = await adminApi.resendLoginOtp(formData.email, formData.password, challengeId)
      setOtpMaskedEmail(otpRes.email || "your email")
      setOtpResendCooldown(Math.max(0, otpRes.resend_available_in || 60))
      setOtpExpiresIn(Math.max(0, otpRes.expires_in || otpExpiresIn))
      setOtpResendCount(otpRes.resend_count || 0)
      setOtpMaxResends(otpRes.max_resends || otpMaxResends)
      setOtpValues(["", "", "", "", "", ""])
      otpInputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP")
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-250px] left-[-150px] w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-250px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet-500/20 blur-[150px] animate-pulse [animation-duration:8s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse [animation-duration:10s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.06),transparent_60%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <Card
        ref={cardRef}
        className="relative w-full max-w-md backdrop-blur-2xl bg-white/5 dark:bg-slate-900/50 border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,.4)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_45px_100px_rgba(0,0,0,.5)] animate-in fade-in zoom-in-95 duration-700 overflow-hidden"
      >
        {/* Mouse gradient lighting */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-30"
          style={{
            background: `radial-gradient(400px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,.12), transparent 50%)`,
          }}
        />

        {step === "credentials" ? (
          <>
            <CardHeader className="text-center space-y-4 relative z-10">
              <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-xl before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/20 before:animate-pulse">
                <Shield className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">
                Network Operations
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Secure access to your management console
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-950/40 border-red-800/50 text-red-300">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={loading}
                      autoComplete="email"
                      required
                      className="h-12 rounded-xl bg-white/5 border-slate-700/50 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-500 focus:scale-[1.01]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                      className="h-12 rounded-xl bg-white/5 border-slate-700/50 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-500 focus:scale-[1.01]"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={handleCheckboxChange}
                    disabled={loading}
                    className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="relative overflow-hidden w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:scale-[1.02] active:scale-[.98] transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 text-white group"
                  disabled={loading}
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-1000" />
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center space-y-4 relative z-10">
              <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-xl before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/20 before:animate-pulse">
                <Mail className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">
                Verify Your Identity
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                We sent a 6-digit code to <span className="font-medium text-slate-300">{otpMaskedEmail}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-950/40 border-red-800/50 text-red-300">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otpValues.map((val, i) => (
                  <Input
                    key={i}
                    ref={(el) => { otpInputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-14 h-16 rounded-2xl text-2xl font-bold text-center bg-white/5 border-slate-700/50 text-white transition-all duration-300 focus:scale-110 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-slate-500"
                    disabled={loading}
                  />
                ))}
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="relative overflow-hidden w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:scale-[1.02] active:scale-[.98] transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 text-white group"
                disabled={loading || otpValues.join("").length !== 6}
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-1000" />
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <div className="text-center text-sm">
                {otpResendCooldown > 0 ? (
                  <span className="text-slate-500">Resend in {formatDuration(otpResendCooldown)}</span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={otpResendCount >= otpMaxResends}
                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="text-center text-xs text-slate-500">
                {otpExpiresIn > 0 ? `Code expires in ${formatDuration(otpExpiresIn)}` : "Code expired. Resend to continue."}
              </div>

              <div className="text-center text-xs text-slate-500">
                Resends used: {otpResendCount}/{otpMaxResends}
              </div>

              <button
                onClick={() => {
                  setStep("credentials")
                  setError(null)
                  setChallengeId("")
                  setOtpValues(["", "", "", "", "", ""])
                  setOtpResendCooldown(0)
                  setOtpExpiresIn(0)
                  setOtpResendCount(0)
                }}
                className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Back to login
              </button>
            </CardContent>
          </>
        )}
      </Card>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-18px); opacity: 0.7; }
          100% { transform: translateY(0px); opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}