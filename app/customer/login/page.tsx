"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Wifi, Smartphone, Lock, ArrowRight } from "lucide-react"
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
        setError("Enter a 10-digit PPPoE phone number starting with 07 or 01.")
        setIsLoading(false)
        return
      }

      const response = await customerApi.login(phoneNumber, password.trim())
      
      // Store tokens
      if (response.access) {
        localStorage.setItem("customerToken", response.access)
        if (response.refresh) {
          localStorage.setItem("customerRefreshToken", response.refresh)
        }
        
        // Redirect to dashboard
        router.push("/customer/dashboard")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Invalid credentials. Enter your PPPoE phone number in both fields.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      {/* Theme toggle in top-right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl dark:border dark:border-slate-800">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Customer Portal</h1>
          <p className="text-white/80 text-sm mt-1">Use your PPPoE phone number to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier">PPPoE Phone Number</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="identifier"
                type="text"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0712345678"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Customers enter the same phone number in both fields.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="Enter the same phone number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
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

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/customer/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Register
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Need help? Contact your ISP support team.
          </p>
        </form>
      </Card>
    </div>
  )
}
