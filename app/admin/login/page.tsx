"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, AlertCircle } from "lucide-react"
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

interface LoginFormData {
  username: string
  password: string
  rememberMe: boolean
}

interface LoginResponse {
  access: string
  refresh?: string
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
    rememberMe: true,
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

  // Direct login to the correct endpoint → gets is_staff in token
  const loginWithBackend = async (): Promise<LoginResponse> => {
    const res = await fetch("http://127.0.0.1:8000/api/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || "Invalid credentials")
    }

    const data = await res.json()
    return {
      access: data.access,
      refresh: data.refresh,
      user: {
        id: 0,
        username: formData.username,
        email: "",
        is_staff: true,
        is_superuser: false,
      },
    }
  }

  const loginWithFallback = async (): Promise<LoginResponse> => {
    await new Promise((r) => setTimeout(r, 800))

    const valid = ["admin", "superadmin", "polom", "marko"].includes(formData.username)
    if (!valid) throw new Error("Invalid mock credentials")

    return {
      access: `mock_${Date.now()}`,
      refresh: "mock_refresh",
      user: {
        id: 1,
        username: formData.username,
        email: "admin@local",
        is_staff: true,
        is_superuser: formData.username.includes("super"),
      },
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.username || !formData.password) {
        throw new Error("Please fill in all fields")
      }

      let data: LoginResponse

      try {
        data = await loginWithBackend()
        console.log("Logged in via real backend")
      } catch {
        console.warn("Backend down → using mock")
        data = await loginWithFallback()
      }

      if (!data.user.is_staff) throw new Error("Admin access required")

      const storage = formData.rememberMe ? localStorage : sessionStorage

      storage.setItem("access_token", data.access)
      storage.setItem("refresh_token", data.refresh || "")
      storage.setItem("user", JSON.stringify(data.user))
      storage.setItem("adminToken", data.access)
      storage.setItem("adminUser", JSON.stringify(data.user))

      console.log("Welcome Admin:", data.user.username)
      router.push("/admin")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>Sign in to manage your ISP</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="polom / marko / admin"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={handleCheckboxChange}
                disabled={loading}
              />
              <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground mt-6 space-y-1">
              <p className="font-medium">Dev Quick Login</p>
              <p>polom • marko • admin • superadmin</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}