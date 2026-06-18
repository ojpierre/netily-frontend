"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone, Lock, ArrowRight, Wifi } from "lucide-react"
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your connection
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="identifier">Phone Number</Label>
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
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Enter your number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2"
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

            <div className="text-center text-sm text-muted-foreground pt-1">
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/customer/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Register
                </Link>
              </p>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help? Contact your ISP support team.
        </p>
      </div>
    </div>
  )
}