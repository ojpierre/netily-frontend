"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { adminApi } from "@/lib/admin-api"

interface LoginFormData {
  username: string
  password: string
  rememberMe: boolean
}

interface LoginResponse {
  access: string
  refresh: string
  user: {
    id: number
    username: string
    email: string
    is_staff: boolean
    is_superuser: boolean
  }
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }))
  }

  const loginWithBackend = async (): Promise<LoginResponse> => {
    // Use centralized admin API service
    const data = await adminApi.login(formData.username, formData.password)
    
    // Validate response structure
    if (!data.access || !data.user) {
      throw new Error("Invalid response from server")
    }

    return data
  }

  const loginWithFallback = async (): Promise<LoginResponse> => {
    // Mock admin credentials for development
    const mockAdmins = [
      { username: "admin", password: "admin123", email: "admin@netily.com" },
      { username: "superadmin", password: "super123", email: "super@netily.com" },
    ]

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const admin = mockAdmins.find(
      (a) => a.username === formData.username && a.password === formData.password
    )

    if (!admin) {
      throw new Error("Invalid admin credentials")
    }

    return {
      access: `mock_admin_token_${Date.now()}`,
      refresh: `mock_refresh_token_${Date.now()}`,
      user: {
        id: 1,
        username: admin.username,
        email: admin.email,
        is_staff: true,
        is_superuser: admin.username === "superadmin",
      },
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate input
      if (!formData.username.trim() || !formData.password.trim()) {
        throw new Error("Please fill in all fields")
      }

      let data: LoginResponse

      // Try backend first, fallback to mock if unavailable
      try {
        data = await loginWithBackend()
        console.log("✅ Admin authenticated with Django backend")
      } catch (backendError) {
        console.warn("⚠️ Backend unavailable, using fallback authentication:", backendError)
        try {
          data = await loginWithFallback()
          console.log("✅ Admin authenticated with fallback mock data")
        } catch (fallbackError) {
          throw fallbackError
        }
      }

      // Verify admin privileges
      if (!data.user || (!data.user.is_staff && !data.user.is_superuser)) {
        throw new Error("Access denied. Admin privileges required.")
      }

      // Store tokens and user data
      const storage = formData.rememberMe ? localStorage : sessionStorage
      const maxAge = formData.rememberMe ? 604800 : 86400 // 7 days or 1 day
      
      storage.setItem("adminToken", data.access)
      if (data.refresh) {
        storage.setItem("adminRefreshToken", data.refresh)
      }
      storage.setItem("adminUser", JSON.stringify(data.user))
      
      // Sync to cookies for middleware (client-side cookies)
      document.cookie = `adminToken=${data.access}; path=/; max-age=${maxAge}; SameSite=Lax`
      
      // Log successful login
      console.log(`✅ Admin logged in: ${data.user.username} (${data.user.is_superuser ? 'Superuser' : 'Staff'})`)

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter admin username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={handleCheckboxChange}
                disabled={loading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-slate-500 mt-4">
              <p className="font-semibold mb-1">Development Mode</p>
              <p className="text-xs">
                Backend fallback credentials:
              </p>
              <p className="font-mono text-xs mt-1">
                admin / admin123 (Staff)
              </p>
              <p className="font-mono text-xs">
                superadmin / super123 (Superuser)
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
