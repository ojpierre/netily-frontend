"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, AlertCircle, Mail, Wifi, Eye, EyeOff, Check } from "lucide-react"
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

// ─── PARTICLE SYSTEM ───
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  baseOpacity: number
}

class ParticleSystem {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private animationId: number | null = null
  private mouseX: number = -1000
  private mouseY: number = -1000
  private mouseRadius: number = 300
  private width: number = 0
  private height: number = 0
  private networkOpacity: number = 0.04
  private running: boolean = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.resize()
    this.initParticles()
    this.bindEvents()
    this.animate()
  }

  private resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      this.width = rect.width
      this.height = rect.height
    } else {
      this.width = window.innerWidth
      this.height = window.innerHeight
    }
    this.canvas.width = this.width * window.devicePixelRatio
    this.canvas.height = this.height * window.devicePixelRatio
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }

  private initParticles() {
    const count = Math.min(90, Math.max(70, Math.floor((this.width * this.height) / 10000)))
    this.particles = []
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1 + Math.random() * 3,
        opacity: 0.15 + Math.random() * 0.35,
        baseOpacity: 0.15 + Math.random() * 0.35,
      })
    }
  }

  private bindEvents() {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect()
      this.mouseX = e.clientX - rect.left
      this.mouseY = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      this.mouseX = -1000
      this.mouseY = -1000
    }

    const handleResize = () => {
      this.resize()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', handleResize)

    this.canvas.addEventListener('mouseleave', handleMouseLeave)

    // Store cleanup
    this.canvas.dataset.cleanup = JSON.stringify([handleMouseMove, handleMouseLeave, handleResize])
  }

  private animate() {
    if (!this.running) return
    this.update()
    this.draw()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  private update() {
    const w = this.width
    const h = this.height

    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy

      // Wrap around
      if (p.x < -10) p.x = w + 10
      if (p.x > w + 10) p.x = -10
      if (p.y < -10) p.y = h + 10
      if (p.y > h + 10) p.y = -10

      // Mouse interaction - subtle attraction
      if (this.mouseX > 0 && this.mouseY > 0) {
        const dx = this.mouseX - p.x
        const dy = this.mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < this.mouseRadius && dist > 0) {
          const force = (1 - dist / this.mouseRadius) * 0.02
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
          // Limit velocity
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
          if (speed > 0.5) {
            p.vx = (p.vx / speed) * 0.5
            p.vy = (p.vy / speed) * 0.5
          }
        }
      }

      // Damping
      p.vx *= 0.999
      p.vy *= 0.999

      // Random slight drift
      p.vx += (Math.random() - 0.5) * 0.001
      p.vy += (Math.random() - 0.5) * 0.001

      // Opacity variation
      p.opacity = p.baseOpacity + Math.sin(Date.now() / 5000 + p.x + p.y) * 0.05
      p.opacity = Math.max(0.05, Math.min(0.6, p.opacity))
    }
  }

  private draw() {
    const ctx = this.ctx
    const w = this.width
    const h = this.height

    // Clear with transparency
    ctx.clearRect(0, 0, w, h)

    // Draw connections (network)
    ctx.strokeStyle = `rgba(99, 102, 241, ${this.networkOpacity})`
    ctx.lineWidth = 0.5

    const particles = this.particles
    const connectionDist = Math.min(w, h) * 0.15

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < connectionDist) {
          const opacity = (1 - dist / connectionDist) * this.networkOpacity
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`
          ctx.stroke()
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
      gradient.addColorStop(0, `rgba(99, 102, 241, ${p.opacity})`)
      gradient.addColorStop(0.5, `rgba(99, 102, 241, ${p.opacity * 0.5})`)
      gradient.addColorStop(1, `rgba(99, 102, 241, 0)`)

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity * 0.8})`
      ctx.fill()
    }

    // Mouse glow
    if (this.mouseX > 0 && this.mouseY > 0) {
      const gradient = ctx.createRadialGradient(
        this.mouseX, this.mouseY, 0,
        this.mouseX, this.mouseY, this.mouseRadius
      )
      gradient.addColorStop(0, `rgba(99, 102, 241, 0.03)`)
      gradient.addColorStop(0.5, `rgba(99, 102, 241, 0.015)`)
      gradient.addColorStop(1, `rgba(99, 102, 241, 0)`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
    }
  }

  public destroy() {
    this.running = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    // Cleanup events
    if (this.canvas.dataset.cleanup) {
      const handlers = JSON.parse(this.canvas.dataset.cleanup)
      // Type-safe cleanup would need proper event tracking
    }
    this.canvas.removeEventListener('mouseleave', () => {})
  }
}

// ─── NOISE TEXTURE ───
const NoiseTexture: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    resize()
    window.addEventListener('resize', resize)

    let frame = 0
    const animate = () => {
      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 8
        data[i] = noise
        data[i + 1] = noise
        data[i + 2] = noise
        data[i + 3] = 6 + Math.random() * 2
      }

      ctx.putImageData(imageData, 0, 0)
      frame++
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.6, mixBlendMode: 'overlay' }}
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
  const [showPassword, setShowPassword] = useState(false)

  // Particle system ref
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleSystemRef = useRef<ParticleSystem | null>(null)

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

  // Initialize particle system
  useEffect(() => {
    if (canvasRef.current && !particleSystemRef.current) {
      particleSystemRef.current = new ParticleSystem(canvasRef.current)
    }

    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy()
        particleSystemRef.current = null
      }
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      {/* ─── ANIMATED BACKGROUND ─── */}
      
      {/* Particle canvas - full screen */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Radial lighting - drifting blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/15 blur-[120px] animate-[drift_35s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/12 blur-[140px] animate-[drift_40s_ease-in-out_infinite_alternate_reverse]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-[120px] animate-[drift_30s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/8 blur-[100px] animate-[drift_45s_ease-in-out_infinite_alternate_reverse]" />
        <div className="absolute top-[10%] right-[20%] w-[350px] h-[350px] rounded-full bg-blue-400/8 blur-[110px] animate-[drift_38s_ease-in-out_infinite_alternate]" />
      </div>

      {/* Noise texture overlay */}
      <NoiseTexture />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />

      {/* ─── LOGIN CONTENT ─── */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Logo */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-1 ring-white/10">
                <Wifi className="w-8 h-8 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-transparent" />
              </div>
            </div>

            {step === "credentials" ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Welcome back
                </h1>
                <p className="text-slate-400 text-sm md:text-base">
                  Sign in to manage your network operations
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Verify your identity
                </h1>
                <p className="text-slate-400 text-sm md:text-base">
                  Enter the 6-digit code sent to{" "}
                  <span className="text-slate-300 font-medium">{otpMaskedEmail}</span>
                </p>
              </>
            )}
          </div>

          {/* Form */}
          {step === "credentials" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Alert variant="destructive" className="bg-red-950/40 border-red-800/50 text-red-300">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5 group">
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                  Email
                </Label>
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
                    className="h-12 px-4 pt-1 pb-0 bg-transparent border-0 border-b-2 border-slate-700/50 rounded-none text-white placeholder:text-slate-500 transition-all duration-300 focus:border-b-blue-500 focus:ring-0 focus:outline-none hover:border-slate-500 pl-0"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 transition-transform duration-300 origin-center group-focus-within:scale-x-100" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                    className="h-12 px-4 pt-1 pb-0 bg-transparent border-0 border-b-2 border-slate-700/50 rounded-none text-white placeholder:text-slate-500 transition-all duration-300 focus:border-b-blue-500 focus:ring-0 focus:outline-none hover:border-slate-500 pl-0 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 transition-transform duration-300 origin-center group-focus-within:scale-x-100" />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={handleCheckboxChange}
                  disabled={loading}
                  className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors"
                >
                  Remember me
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="relative overflow-hidden w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 text-white group"
                disabled={loading}
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-700" />
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          ) : (
            /* ─── OTP Screen ─── */
            <div className="space-y-6">
              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Alert variant="destructive" className="bg-red-950/40 border-red-800/50 text-red-300">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otpValues.map((val, i) => (
                  <div key={i} className="relative group">
                    <Input
                      ref={(el) => { otpInputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-16 sm:w-14 sm:h-16 bg-transparent border-0 border-b-2 border-slate-700/50 rounded-none text-2xl font-bold text-center text-white transition-all duration-300 focus:border-b-blue-500 focus:ring-0 focus:outline-none hover:border-slate-500 px-0"
                      disabled={loading}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 transition-transform duration-300 origin-center group-focus-within:scale-x-100" />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="relative overflow-hidden w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 text-white group"
                disabled={loading || otpValues.join("").length !== 6}
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-700" />
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & continue"
                )}
              </Button>

              <div className="text-center text-sm space-y-2">
                {otpResendCooldown > 0 ? (
                  <span className="text-slate-500">
                    Resend in {formatDuration(otpResendCooldown)}
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={otpResendCount >= otpMaxResends}
                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend code
                  </button>
                )}
                <div className="text-xs text-slate-500">
                  {otpExpiresIn > 0
                    ? `Code expires in ${formatDuration(otpExpiresIn)}`
                    : "Code expired. Resend to continue."}
                </div>
                <div className="text-xs text-slate-500">
                  Resends used: {otpResendCount}/{otpMaxResends}
                </div>
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
            </div>
          )}
        </div>
      </div>

      {/* ─── STYLES ─── */}
      <style jsx>{`
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(5%, -3%) scale(1.05); }
          50% { transform: translate(-2%, 4%) scale(0.95); }
          75% { transform: translate(-5%, -2%) scale(1.02); }
          100% { transform: translate(3%, 3%) scale(0.98); }
        }
      `}</style>
    </div>
  )
}