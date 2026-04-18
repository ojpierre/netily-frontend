"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Wifi, Smartphone, Lock, ArrowRight, Mail } from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CustomerLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "")
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.substring(1)
    } else if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned
    }
    return cleaned
  }

  const isEmail = (value: string) => value.includes("@")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      let response
      if (isEmail(identifier)) {
        // Login with email
        response = await customerApi.loginWithEmail(identifier.trim(), password)
      } else {
        // Login with phone
        const formattedPhone = formatPhoneNumber(identifier)
        response = await customerApi.login(formattedPhone, password)
      }
      
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
      setError(err.message || "Invalid credentials. Please check your phone number/email and password.")
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
          <p className="text-white/80 text-sm mt-1">Sign in to manage your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier">Phone Number or Email</Label>
            <div className="relative">
              {isEmail(identifier) ? (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              ) : (
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                id="identifier"
                type="text"
                placeholder="0712345678 or email@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
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
            disabled={isLoading || !identifier.trim() || !password.trim()}
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

          <div className="text-center">
            <Link 
              href="/customer/forgot-password" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
