"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Wifi, Loader2, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { customerApi } from "@/lib/customer-api"

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  password: string
  password_confirm: string
  id_number: string
}

interface FormErrors {
  [key: string]: string
}

export default function CustomerRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirm: "",
    id_number: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required"
    } else {
      // Validate Kenyan phone format
      const cleaned = formData.phone_number.replace(/\D/g, "")
      if (cleaned.length < 9 || cleaned.length > 12) {
        newErrors.phone_number = "Please enter a valid phone number"
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = "Please confirm your password"
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Format phone number to 254 format
  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "")
    
    // Remove leading zero
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1)
    }
    
    // Add 254 prefix if not present
    if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned
    }
    
    return cleaned
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setIsLoading(true)

    try {
      const registrationData = {
        ...formData,
        phone_number: formatPhoneNumber(formData.phone_number),
      }

      const response = await customerApi.register(registrationData)

      // Store tokens
      if (response.access && response.refresh) {
        localStorage.setItem("customerToken", response.access)
        localStorage.setItem("customerRefreshToken", response.refresh)
        localStorage.setItem("customerUser", JSON.stringify(response.user))
      }

      setSuccess(true)

      if (response.requires_verification) {
        setRequiresVerification(true)
        toast.success("Account created! Please verify your phone number.")
        // Redirect to verification page after a short delay
        setTimeout(() => {
          router.push(`/customer/verify?phone=${encodeURIComponent(registrationData.phone_number)}`)
        }, 2000)
      } else {
        toast.success("Account created successfully!")
        // Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error on input
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
            <p className="text-slate-600 mb-4">
              {requiresVerification
                ? "Please check your phone for a verification code."
                : "You can now access your dashboard."}
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Customer Portal</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Register to manage your internet subscription and payments
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={errors.first_name ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-500">{errors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={errors.last_name ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.last_name && (
                    <p className="text-xs text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number (M-Pesa)</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  placeholder="0712345678"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className={errors.phone_number ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">
                  Enter your M-Pesa registered phone number
                </p>
                {errors.phone_number && (
                  <p className="text-xs text-red-500">{errors.phone_number}</p>
                )}
              </div>

              {/* ID Number (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="id_number">
                  ID Number <span className="text-slate-400">(Optional)</span>
                </Label>
                <Input
                  id="id_number"
                  name="id_number"
                  placeholder="12345678"
                  value={formData.id_number}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password</Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  className={errors.password_confirm ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.password_confirm && (
                  <p className="text-xs text-red-500">{errors.password_confirm}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-xs text-center text-slate-500 mt-4">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
