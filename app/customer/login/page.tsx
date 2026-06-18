"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone, Lock, ArrowRight } from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CustomerLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#0B0E14] overflow-hidden">
      {/* Ambient signal field background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-amber-400/[0.06] blur-[100px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="fixed top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-[420px] z-10">
        {/* Signature mark: signal pulse */}
        <div className="flex justify-center mb-8">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500/20 animate-ping [animation-duration:2.5s]" />
            <span className="absolute inline-flex h-11 w-11 rounded-full bg-amber-500/15" />
            <span className="relative inline-flex h-7 w-7 rounded-full bg-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.65)]" />
          </div>
        </div>

        <div className="text-center mb-9">
          <h1 className="font-serif text-[28px] leading-tight text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-[#8B92A3] text-sm mt-2">
            Sign in to manage your connection
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleSubmit} className="p-7 space-y-5">
            {error && (
              <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-[#C8CDD8] text-xs font-medium uppercase tracking-wide">
                Phone Number
              </Label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="identifier"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0712345678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#5B6271] focus-visible:ring-amber-500/40 focus-visible:border-amber-500/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#C8CDD8] text-xs font-medium uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="password"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Enter your number again"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#5B6271] focus-visible:ring-amber-500/40 focus-visible:border-amber-500/40"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 bg-amber-500 hover:bg-amber-400 text-[#1A1206] font-semibold shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all"
              disabled={isLoading || !isValidLocalPhone(identifier) || !password.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-[#8B92A3] pt-1">
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/customer/register" className="text-amber-400 hover:text-amber-300 font-medium">
                  Register
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-[#5B6271] mt-6">
          Need help? Contact your ISP support team.
        </p>
      </div>
    </div>
  )
}