"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, Mail, Fingerprint } from "lucide-react"
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
import { startAuthentication } from "@simplewebauthn/browser"

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

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1
    let animationFrame = 0
    let prefersReducedMotion = false

    try {
      prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    } catch {
      prefersReducedMotion = false
    }

    const pointer = { x: -9999, y: -9999, active: false }

    type Particle = {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      depth: number
      hue: "slate" | "blue"
      pulseSpeed: number
      pulsePhase: number
      spark: boolean
    }

    let particles: Particle[] = []

    const countForSize = (w: number, h: number) => {
      const area = w * h
      const target = Math.round(area / 9000)
      return Math.max(60, Math.min(220, target))
    }

    const makeParticle = (w: number, h: number): Particle => {
      const depth = 0.4 + Math.random() * 0.6
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12 * depth,
        vy: (Math.random() - 0.5) * 0.12 * depth,
        radius: (1.4 + Math.random() * 2.6) * depth,
        depth,
        hue: Math.random() < 0.7 ? "slate" : "blue",
        pulseSpeed: 0.4 + Math.random() * 0.6,
        pulsePhase: Math.random() * Math.PI * 2,
        spark: Math.random() < 0.06,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const desired = countForSize(width, height)
      if (particles.length === 0) {
        particles = Array.from({ length: desired }, () => makeParticle(width, height))
      } else if (particles.length < desired) {
        particles = particles.concat(
          Array.from({ length: desired - particles.length }, () => makeParticle(width, height))
        )
      } else if (particles.length > desired) {
        particles = particles.slice(0, desired)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }
    const handlePointerLeave = () => {
      pointer.active = false
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerleave", handlePointerLeave)

    let t = 0
    const connectDist = 120

    const render = () => {
      t += 0.016
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (pointer.active) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const distSq = dx * dx + dy * dy
          const radius = 90
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq) || 1
            const force = ((radius - dist) / radius) * 0.6 * p.depth
            p.vx += (dx / dist) * force * 0.05
            p.vy += (dy / dist) * force * 0.05
          }
        }

        p.vx *= 0.985
        p.vy *= 0.985
        const maxSpeed = 0.35
        const speed = Math.hypot(p.vx, p.vy)
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed
          p.vy = (p.vy / speed) * maxSpeed
        }

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20
      }

      if (!prefersReducedMotion) {
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i]
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const dist = Math.hypot(dx, dy)
            if (dist < connectDist) {
              const alpha = (1 - dist / connectDist) * 0.18 * Math.min(a.depth, b.depth)
              ctx.strokeStyle = `rgba(30, 64, 175, ${alpha})`
              ctx.lineWidth = 0.7
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.stroke()
            }
          }
        }
      }

      for (const p of particles) {
        const pulse = 0.5 + 0.5 * Math.sin(t * p.pulseSpeed + p.pulsePhase)
        const baseAlpha = (p.spark ? 0.75 : 0.5) * p.depth
        const alpha = baseAlpha + pulse * 0.25 * p.depth
        const color = p.hue === "blue" ? "37, 99, 235" : "51, 65, 85" // blue-600 / slate-700

        ctx.beginPath()
        ctx.fillStyle = `rgba(${color}, ${Math.min(alpha, 1)})`
        ctx.shadowColor = `rgba(${color}, ${Math.min(alpha * 0.6, 1)})`
        ctx.shadowBlur = p.spark ? 6 : 2
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      animationFrame = requestAnimationFrame(render)
    }

    animationFrame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
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

  // Passkey state
  const [passkeyLoading, setPasskeyLoading] = useState(false)

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

  // ── Passkey login handler ──
  const handlePasskeyLogin = async () => {
    setError(null)
    setPasskeyLoading(true)
    try {
      const options = await adminApi.getPasskeyLoginOptions(formData.email || undefined)
      const { session_key, ...publicKeyOptions } = options
      const credential = await startAuthentication(publicKeyOptions)
      const response = await adminApi.verifyPasskeyLogin({ session_key, credential })
      establishSession(response, formData.rememberMe)
      window.location.href = "/admin"
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setError("Passkey sign-in was cancelled.")
      } else {
        setError(err.message || "Passkey sign-in failed.")
      }
    } finally {
      setPasskeyLoading(false)
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Ambient depth — soft color washes instead of dark glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-250px] left-[-150px] w-[600px] h-[600px] rounded-full bg-blue-500/[0.06] blur-[140px]" />
        <div className="absolute bottom-[-250px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet-500/[0.06] blur-[150px]" />
      </div>

      <ParticleBackground />

      <Card
        ref={cardRef}
        className="relative w-full max-w-md bg-white border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_60px_-10px_rgba(15,23,42,0.12)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-[0.04]"
          style={{
            background: `radial-gradient(400px circle at ${mouse.x}px ${mouse.y}px, rgba(37,99,235,1), transparent 60%)`,
          }}
        />

        {step === "credentials" ? (
          <>
            <CardHeader className="space-y-1 pt-8 pb-2 relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-6 w-1 rounded-full bg-blue-600" />
                <span className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  Netily
                </span>
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
                Sign in
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter your credentials to access your workspace.
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email</Label>
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
                    className="h-11 rounded-lg bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    className="h-11 rounded-lg bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={handleCheckboxChange}
                    disabled={loading}
                    className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg font-medium bg-slate-900 hover:bg-slate-800 transition-colors duration-200 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-slate-400">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                  className="w-full h-11 rounded-lg border-slate-200 text-slate-700 font-medium hover:bg-slate-50 gap-2 transition-colors duration-200"
                >
                  {passkeyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="h-4 w-4" />
                  )}
                  Sign in with a passkey
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1 pt-8 pb-2 relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-6 w-1 rounded-full bg-blue-600" />
                <span className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  Netily
                </span>
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
                Verify it&apos;s you
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter the 6-digit code sent to <span className="font-medium text-slate-700">{otpMaskedEmail}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
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
                    className="w-12 h-14 rounded-lg text-xl font-semibold text-center bg-slate-50 border-slate-200 text-slate-900 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    disabled={loading}
                  />
                ))}
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="w-full h-11 rounded-lg font-medium bg-slate-900 hover:bg-slate-800 transition-colors duration-200 text-white"
                disabled={loading || otpValues.join("").length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & continue"
                )}
              </Button>

              <div className="text-center text-sm">
                {otpResendCooldown > 0 ? (
                  <span className="text-slate-400">Resend in {formatDuration(otpResendCooldown)}</span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={otpResendCount >= otpMaxResends}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="text-center text-xs text-slate-400">
                {otpExpiresIn > 0 ? `Code expires in ${formatDuration(otpExpiresIn)}` : "Code expired. Resend to continue."}
              </div>

              <div className="text-center text-xs text-slate-400">
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
                className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back to login
              </button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}