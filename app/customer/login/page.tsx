"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone, Lock, ArrowRight, Wifi, Signal, Terminal, Activity, ShieldCheck } from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CustomerLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

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
        setError("ERR: INVALID_FORMAT. Require 10 digits (07/01).")
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
      setError(err.message || "AUTH_FAILED: Verify credentials and retry.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden font-mono selection:bg-cyan-500/40">
      
      {/* 3D Perspective Floor Grid */}
      <div className="absolute inset-0 perspective-container pointer-events-none">
        <div className="absolute bottom-[-20%] left-[-50%] right-[-50%] h-[100%] 3d-grid opacity-40" />
      </div>

      {/* Ambient Vignette & Core Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_80%)] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      {/* Data Stream Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-gradient-to-b from-transparent via-cyan-500 to-transparent w-[1px]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-100%`,
              height: '50%',
              animation: `data-stream ${3 + Math.random() * 2}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Holographic Card Wrapper */}
      <div className="relative z-10 w-full max-w-[440px] group animate-in zoom-in-95 duration-1000">
        
        {/* Glowing Backplate */}
        <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-700 animate-tilt" />
        
        <Card
          ref={cardRef}
          className="relative h-full w-full rounded-2xl border border-cyan-900/50 bg-black/60 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {/* Scanning Laser Line */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
            <div className="absolute w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_#22d3ee] animate-scan opacity-50" />
          </div>

          {/* Mouse Flashlight Tracking */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(400px circle at ${mouse.x}px ${mouse.y}px, rgba(34, 211, 238, 0.15), transparent 40%)`,
            }}
          />

          <div className="relative z-10 p-8">
            {/* Terminal Header */}
            <div className="flex flex-col mb-8 border-b border-cyan-900/50 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex items-center justify-center w-12 h-12 bg-cyan-950/50 border border-cyan-500/30 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-widest uppercase text-glow">
                    Netily
                  </h1>
                  <p className="text-xs text-cyan-500/80 tracking-widest font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    SYSTEM_ONLINE
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-wider">
                &gt; Initialize secure connection<br/>
                &gt; Awaiting client credentials...
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="relative overflow-hidden px-4 py-3 bg-red-950/20 border-l-2 border-red-500 animate-in fade-in slide-in-from-top-2">
                  <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                  <p className="relative text-xs text-red-400 font-semibold tracking-wider">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="identifier" className="text-xs font-bold text-cyan-500 uppercase tracking-widest">
                    Subscriber ID
                  </Label>
                  <span className="text-[10px] text-slate-600">[PHONE_NUM]</span>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Terminal className="w-4 h-4 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors" />
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="07XX-XXX-XXX"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12 w-full pl-10 pr-4 bg-black/50 border-cyan-900/30 text-cyan-50 placeholder:text-slate-700 rounded-none focus-visible:ring-0 focus-visible:border-cyan-400 transition-all duration-300 font-mono tracking-wider"
                    required
                  />
                  {/* Cyberpunk corner accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/0 group-focus-within/input:border-cyan-400 transition-all" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/0 group-focus-within/input:border-cyan-400 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold text-cyan-500 uppercase tracking-widest">
                    Access Key
                  </Label>
                  <span className="text-[10px] text-slate-600">[PIN_CODE]</span>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full pl-10 pr-4 bg-black/50 border-cyan-900/30 text-cyan-50 placeholder:text-slate-700 rounded-none focus-visible:ring-0 focus-visible:border-cyan-400 transition-all duration-300 font-mono tracking-widest"
                    required
                  />
                  {/* Cyberpunk corner accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/0 group-focus-within/input:border-cyan-400 transition-all" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/0 group-focus-within/input:border-cyan-400 transition-all" />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="relative w-full h-12 rounded-none font-bold text-xs uppercase tracking-[0.2em] bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black text-cyan-400 overflow-hidden group transition-all duration-500 disabled:opacity-50"
                  disabled={isLoading || !isValidLocalPhone(identifier) || !password.trim()}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-glitch-slide" />
                  
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>Establish Uplink</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 border-t border-cyan-900/30 mt-6">
                <ShieldCheck className="w-4 h-4 text-cyan-600" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  256-bit Encrypted Session
                </p>
              </div>
            </form>
          </div>
        </Card>
      </div>

      <style jsx global>{`
        /* 3D Grid Perspective */
        .perspective-container {
          perspective: 1000px;
        }
        .3d-grid {
          transform: rotateX(60deg) translateY(50px);
          transform-origin: top;
          background-size: 60px 60px;
          background-image: 
            linear-gradient(to right, rgba(34, 211, 238, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 211, 238, 0.15) 1px, transparent 1px);
          animation: grid-move 20s linear infinite;
        }
        
        /* Text Glow */
        .text-glow {
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5), 0 0 20px rgba(34, 211, 238, 0.3);
        }

        /* Animations */
        @keyframes grid-move {
          0% { transform: rotateX(60deg) translateY(0); }
          100% { transform: rotateX(60deg) translateY(60px); }
        }

        @keyframes data-stream {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(200vh); opacity: 0; }
        }

        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }

        @keyframes glitch-slide {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}