"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
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
import { customerApi } from "@/lib/customer-api"
import { ParticleBackground } from "@/components/auth/particle-background"
import { LogoStrandBadge } from "@/components/auth/logo-strand-badge"

export default function CustomerLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const normalizeLocalPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "")
    if (digits.startsWith("254") && digits.length === 12) return `0${digits.slice(3)}`
    if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) return `0${digits}`
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
        const storage = rememberMe ? localStorage : sessionStorage
        storage.setItem("customerToken", response.access)
        if (response.refresh) storage.setItem("customerRefreshToken", response.refresh)
        router.push("/customer/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Ambient depth — soft color washes */}
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

        <CardHeader className="space-y-1 pt-8 pb-2 relative z-10">
          <LogoStrandBadge />
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-1 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
              Netily Customer
            </span>
          </div>
          <CardTitle className="text-2xl font-semibold text-slate-900 tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Sign in to manage your subscription and stay connected.
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
              <Label htmlFor="identifier" className="text-slate-700 text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="identifier"
                type="text"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0712345678"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                required
                className="h-11 rounded-lg bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="h-11 rounded-lg bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
                disabled={isLoading}
                className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="rememberMe" className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-lg font-medium bg-slate-900 hover:bg-slate-800 transition-colors duration-200 text-white"
              disabled={isLoading || !isValidLocalPhone(identifier) || !password.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}