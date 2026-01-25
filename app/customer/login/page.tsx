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

export default function CustomerLoginPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      const response = await customerApi.login(formattedPhone, password)
      
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
      setError(err.message || "Invalid phone number or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
            disabled={isLoading || !phoneNumber.trim() || !password.trim()}
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

          <div className="text-center text-sm text-slate-600">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/customer/register" className="text-blue-600 hover:underline font-medium">
                Register
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link 
              href="/customer/forgot-password" 
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
