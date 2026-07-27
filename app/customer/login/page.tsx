"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone, Lock, ArrowRight, Wifi, Signal, Network, CheckCircle2 } from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CustomerLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mouse position for gradient lighting effect
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

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

  const normalizeLocalPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "")
    if (digits.startsWith("254") && digits.length === 12) {
      return `0${digits.slice(3)}`
    }
    if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
      return `0${digits}`
    }
    return digits
  }

  const isValidLocalPhone = (phone: string) => /^(07|01)\d{8}$/.test(normalizeLocalPhone(phone))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const phoneNumber = normalizeLocalPhone(identifier)
      if (!isValidLocalPhone(phoneNumber)) {
        setError("Enter a valid 10-digit number starting with 07 or 01.")
        setIsLoading(false)
        return
      }

      const response = await customerApi.login(phoneNumber, password.trim())

      if (response.access) {
        localStorage.setItem("customerToken", response.access)
        if (response.refresh) {
          localStorage.setItem("customerRefreshToken", response.refresh)
        }
        router.push("/customer/dashboard")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Invalid credentials. Enter your number in both fields.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-250px] left-[-150px] w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-250px] right-[-100px] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[150px] animate-pulse [animation-duration:8s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px] animate-pulse [animation-duration:10s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.05),transparent_60%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/8"
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

      {/* Network connection lines decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="white" strokeWidth="0.5" />
          <line x1="20" y1="0" x2="20" y2="100" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5" />
          <line x1="80" y1="0" x2="80" y2="100" stroke="white" strokeWidth="0.5" />
          <circle cx="20" cy="20" r="2" fill="white" />
          <circle cx="50" cy="20" r="2" fill="white" />
          <circle cx="80" cy="20" r="2" fill="white" />
          <circle cx="20" cy="50" r="2" fill="white" />
          <circle cx="50" cy="50" r="2" fill="white" />
          <circle cx="80" cy="50" r="2" fill="white" />
          <circle cx="20" cy="80" r="2" fill="white" />
          <circle cx="50" cy="80" r="2" fill="white" />
          <circle cx="80" cy="80" r="2" fill="white" />
        </svg>
      </div>

      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <Card
        ref={cardRef}
        className="relative w-full max-w-md backdrop-blur-2xl bg-white/5 dark:bg-slate-900/50 border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,.4)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_45px_100px_rgba(0,0,0,.5)] animate-in fade-in zoom-in-95 duration-700 overflow-hidden"
      >
        {/* Mouse gradient lighting */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-25"
          style={{
            background: `radial-gradient(400px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,.1), transparent 50%)`,
          }}
        />

        <div className="relative z-10 p-6">
          <div className="flex flex-col items-center mb-6">
            {/* Animated logo */}
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/20 before:animate-pulse mb-4">
              <div className="relative">
                <Wifi className="w-10 h-10 text-white drop-shadow-lg" />
                <Signal className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 drop-shadow-lg" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-400 mt-1 text-center">
              Access your account, manage your subscription and stay connected.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 bg-red-950/30 border border-red-800/40 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-slate-300 text-sm font-medium">Phone Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                <Input
                  id="identifier"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0712345678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-white/5 border-slate-700/50 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-slate-500 focus:scale-[1.01]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                <Input
                  id="password"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Enter your number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-white/5 border-slate-700/50 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-slate-500 focus:scale-[1.01]"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="relative overflow-hidden w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-[1.02] active:scale-[.98] transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 text-white group"
              disabled={isLoading || !isValidLocalPhone(identifier) || !password.trim()}
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-1000" />
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500/60" />
              <p className="text-center text-xs text-slate-500">
                Secure connection • 24/7 support available
              </p>
            </div>
          </form>
        </div>
      </Card>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); opacity: 0.2; }
          50% { transform: translateY(-18px); opacity: 0.6; }
          100% { transform: translateY(0px); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}