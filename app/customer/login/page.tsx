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

  // Mouse tracking for gradient spotlight
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
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#030712] overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Dynamic Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
      
      {/* Ambient Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-900/20 via-blue-900/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse-slow pointer-events-none animation-delay-4000" />

      {/* Floating Data Packets (Particles) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-up ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Outer Card Wrapper for Glowing Border Effect */}
      <div className="relative group w-full max-w-[420px] z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Animated Conic Gradient Border */}
        <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 opacity-30 blur-sm group-hover:opacity-60 transition-opacity duration-500" />
        <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-b from-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <Card
          ref={cardRef}
          className="relative h-full w-full rounded-[2rem] border-0 bg-slate-950/80 backdrop-blur-2xl shadow-2xl overflow-hidden"
        >
          {/* Interactive Spotlight */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(34, 211, 238, 0.08), transparent 40%)`,
            }}
          />

          <div className="relative z-10 p-8 pt-10">
            {/* Header Section */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative flex items-center justify-center w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent opacity-50" />
                  <Network className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight mb-2">
                Netily Portal
              </h1>
              <p className="text-sm text-slate-400 text-center max-w-[280px] leading-relaxed">
                Enter your credentials to manage your connection and billing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-950/40 border border-red-900/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm text-red-200/90 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Phone Number
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Smartphone className="w-5 h-5 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="0712345678"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-14 w-full pl-12 pr-4 bg-slate-900/50 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50 transition-all duration-300 hover:bg-slate-900/80"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Password
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 w-full pl-12 pr-4 bg-slate-900/50 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50 transition-all duration-300 hover:bg-slate-900/80"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="relative w-full h-14 rounded-xl font-bold text-sm tracking-wide bg-cyan-600 hover:bg-cyan-500 text-white overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:hover:bg-cyan-600"
                  disabled={isLoading || !isValidLocalPhone(identifier) || !password.trim()}
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
                  
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Establish Connection</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </div>

              {/* Footer Status Line */}
              <div className="flex items-center justify-center gap-2.5 pt-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-3 h-3 bg-cyan-500/40 rounded-full animate-ping" />
                  <div className="relative w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>
                <p className="text-xs font-medium text-slate-500 tracking-wide">
                  End-to-End Encrypted Session
                </p>
              </div>
            </form>
          </div>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes float-up {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          20% { opacity: 1; scale: 1; }
          80% { opacity: 1; scale: 1; }
          100% { transform: translateY(-20vh) scale(0); opacity: 0; }
        }
        @keyframes shine {
          100% { transform: translateX(100%); }
        }
        .animate-pulse-slow {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}