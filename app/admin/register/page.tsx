"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Globe,
  MapPin,
  FileText,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "sonner"

// ==========================================
// TYPES
// ==========================================

interface FormErrors {
  [key: string]: string[]
}

interface RegisterFormData {
  // Company Details (Required)
  company_name: string
  company_email: string
  // Company Details (Optional)
  company_phone: string
  company_address: string
  company_city: string
  company_county: string
  company_registration_number: string
  company_tax_pin: string
  company_website: string
  // Admin Details (Required)
  admin_first_name: string
  admin_last_name: string
  admin_email: string
  admin_phone: string
  admin_password: string
  admin_password_confirm: string
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  // Kenyan phone number format: +254XXXXXXXXX
  const phoneRegex = /^\+254\d{9}$/
  return phone === "" || phoneRegex.test(phone)
}

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (password.length < 8) errors.push("At least 8 characters")
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter")
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter")
  if (!/\d/.test(password)) errors.push("One number")
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("One special character")
  return { valid: errors.length === 0, errors }
}

// ==========================================
// API SERVICE
// ==========================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

async function registerCompany(data: Omit<RegisterFormData, "admin_password_confirm">) {
  const response = await fetch(`${API_BASE}/core/companies/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw { status: response.status, errors: result }
  }

  return result
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AdminRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{ valid: boolean; errors: string[] }>({
    valid: false,
    errors: [],
  })

  const [formData, setFormData] = useState<RegisterFormData>({
    // Company Details
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_city: "",
    company_county: "",
    company_registration_number: "",
    company_tax_pin: "",
    company_website: "",
    // Admin Details
    admin_first_name: "",
    admin_last_name: "",
    admin_email: "",
    admin_phone: "",
    admin_password: "",
    admin_password_confirm: "",
  })

  // Update password strength indicator
  useEffect(() => {
    if (formData.admin_password) {
      setPasswordStrength(validatePassword(formData.admin_password))
    } else {
      setPasswordStrength({ valid: false, errors: [] })
    }
  }, [formData.admin_password])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    setGeneralError(null)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required field validation
    if (!formData.company_name.trim()) {
      newErrors.company_name = ["Company name is required"]
    }
    if (!formData.company_email.trim()) {
      newErrors.company_email = ["Company email is required"]
    } else if (!validateEmail(formData.company_email)) {
      newErrors.company_email = ["Please enter a valid email address"]
    }

    if (!formData.admin_first_name.trim()) {
      newErrors.admin_first_name = ["First name is required"]
    }
    if (!formData.admin_last_name.trim()) {
      newErrors.admin_last_name = ["Last name is required"]
    }
    if (!formData.admin_email.trim()) {
      newErrors.admin_email = ["Admin email is required"]
    } else if (!validateEmail(formData.admin_email)) {
      newErrors.admin_email = ["Please enter a valid email address"]
    }
    if (!formData.admin_phone.trim()) {
      newErrors.admin_phone = ["Phone number is required"]
    } else if (!validatePhone(formData.admin_phone)) {
      newErrors.admin_phone = ["Please enter a valid phone number (+254XXXXXXXXX)"]
    }
    if (!formData.admin_password) {
      newErrors.admin_password = ["Password is required"]
    } else if (!passwordStrength.valid) {
      newErrors.admin_password = ["Password does not meet requirements"]
    }
    if (formData.admin_password !== formData.admin_password_confirm) {
      newErrors.admin_password_confirm = ["Passwords do not match"]
    }

    // Optional field validation
    if (formData.company_phone && !validatePhone(formData.company_phone)) {
      newErrors.company_phone = ["Please enter a valid phone number (+254XXXXXXXXX)"]
    }
    if (formData.company_website && !formData.company_website.startsWith("http")) {
      newErrors.company_website = ["Website must start with http:// or https://"]
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)

    try {
      // Remove confirm password before sending
      const { admin_password_confirm, ...submitData } = formData

      const response = await registerCompany(submitData)

      // Store tokens for auto-login
      localStorage.setItem("adminToken", response.access)
      localStorage.setItem("adminRefreshToken", response.refresh)
      localStorage.setItem("adminUser", JSON.stringify(response.user))

      // Set cookie for middleware auth check
      document.cookie = `adminToken=${response.access}; path=/; max-age=${86400 * 7}; SameSite=Lax`

      // Store trial start date
      const trialStartDate = new Date().toISOString()
      localStorage.setItem("trialStartDate", trialStartDate)

      toast.success("Welcome! Your ISP company has been created.")

      // Redirect to dashboard
      window.location.href = "/admin"
    } catch (error: any) {
      if (error.status === 400 && error.errors) {
        // Map backend validation errors to form fields
        setErrors(error.errors)
        const firstError = Object.values(error.errors).flat()[0] as string
        toast.error(firstError || "Please fix the errors in the form")
      } else if (error.status === 500) {
        setGeneralError("Something went wrong. Please try again later.")
        toast.error("Server error. Please try again later.")
      } else {
        setGeneralError("Registration failed. Please try again.")
        toast.error("Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (field: string): string | undefined => {
    return errors[field]?.[0]
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your ISP Account</CardTitle>
          <CardDescription>
            Start your 14-day free trial. No credit card required.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {generalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Company Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Company Details</h3>
              </div>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    placeholder="e.g., BlueNet Kenya"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className={getFieldError("company_name") ? "border-red-500" : ""}
                  />
                  {getFieldError("company_name") && (
                    <p className="text-sm text-red-500">{getFieldError("company_name")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_email">
                    Company Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="company_email"
                      name="company_email"
                      type="email"
                      placeholder="info@yourcompany.co.ke"
                      value={formData.company_email}
                      onChange={handleInputChange}
                      className={`pl-10 ${getFieldError("company_email") ? "border-red-500" : ""}`}
                    />
                  </div>
                  {getFieldError("company_email") && (
                    <p className="text-sm text-red-500">{getFieldError("company_email")}</p>
                  )}
                </div>
              </div>

              {/* Optional Company Fields */}
              <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-sm text-slate-600">
                      Additional Company Details (Optional)
                    </span>
                    {showOptionalFields ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_phone">Company Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="company_phone"
                          name="company_phone"
                          placeholder="+254712345678"
                          value={formData.company_phone}
                          onChange={handleInputChange}
                          className={`pl-10 ${getFieldError("company_phone") ? "border-red-500" : ""}`}
                        />
                      </div>
                      {getFieldError("company_phone") && (
                        <p className="text-sm text-red-500">{getFieldError("company_phone")}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="company_website"
                          name="company_website"
                          placeholder="https://yourcompany.co.ke"
                          value={formData.company_website}
                          onChange={handleInputChange}
                          className={`pl-10 ${getFieldError("company_website") ? "border-red-500" : ""}`}
                        />
                      </div>
                      {getFieldError("company_website") && (
                        <p className="text-sm text-red-500">{getFieldError("company_website")}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="company_address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="company_address"
                          name="company_address"
                          placeholder="Nairobi CBD, Kenyatta Ave"
                          value={formData.company_address}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_city">City</Label>
                      <Input
                        id="company_city"
                        name="company_city"
                        placeholder="Nairobi"
                        value={formData.company_city}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_county">County</Label>
                      <Input
                        id="company_county"
                        name="company_county"
                        placeholder="NAIROBI"
                        value={formData.company_county}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_registration_number">Registration Number</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="company_registration_number"
                          name="company_registration_number"
                          placeholder="PVT-123456"
                          value={formData.company_registration_number}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_tax_pin">Tax PIN</Label>
                      <Input
                        id="company_tax_pin"
                        name="company_tax_pin"
                        placeholder="A012345678B"
                        value={formData.company_tax_pin}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Admin Account Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Admin Account</h3>
              </div>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_first_name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="admin_first_name"
                    name="admin_first_name"
                    placeholder="John"
                    value={formData.admin_first_name}
                    onChange={handleInputChange}
                    className={getFieldError("admin_first_name") ? "border-red-500" : ""}
                  />
                  {getFieldError("admin_first_name") && (
                    <p className="text-sm text-red-500">{getFieldError("admin_first_name")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_last_name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="admin_last_name"
                    name="admin_last_name"
                    placeholder="Doe"
                    value={formData.admin_last_name}
                    onChange={handleInputChange}
                    className={getFieldError("admin_last_name") ? "border-red-500" : ""}
                  />
                  {getFieldError("admin_last_name") && (
                    <p className="text-sm text-red-500">{getFieldError("admin_last_name")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="admin_email"
                      name="admin_email"
                      type="email"
                      placeholder="john@yourcompany.co.ke"
                      value={formData.admin_email}
                      onChange={handleInputChange}
                      className={`pl-10 ${getFieldError("admin_email") ? "border-red-500" : ""}`}
                    />
                  </div>
                  {getFieldError("admin_email") && (
                    <p className="text-sm text-red-500">{getFieldError("admin_email")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_phone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="admin_phone"
                      name="admin_phone"
                      placeholder="+254700123456"
                      value={formData.admin_phone}
                      onChange={handleInputChange}
                      className={`pl-10 ${getFieldError("admin_phone") ? "border-red-500" : ""}`}
                    />
                  </div>
                  {getFieldError("admin_phone") && (
                    <p className="text-sm text-red-500">{getFieldError("admin_phone")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="admin_password"
                      name="admin_password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.admin_password}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 ${getFieldError("admin_password") ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {getFieldError("admin_password") && (
                    <p className="text-sm text-red-500">{getFieldError("admin_password")}</p>
                  )}
                  {/* Password Strength Indicator */}
                  {formData.admin_password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded ${
                              passwordStrength.errors.length <= 5 - i
                                ? passwordStrength.valid
                                  ? "bg-green-500"
                                  : "bg-amber-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {passwordStrength.errors.map((error) => (
                          <span key={error} className="text-amber-600">
                            • {error}
                          </span>
                        ))}
                        {passwordStrength.valid && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Strong password
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password_confirm">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="admin_password_confirm"
                      name="admin_password_confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.admin_password_confirm}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 ${getFieldError("admin_password_confirm") ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {getFieldError("admin_password_confirm") && (
                    <p className="text-sm text-red-500">{getFieldError("admin_password_confirm")}</p>
                  )}
                  {formData.admin_password_confirm &&
                    formData.admin_password === formData.admin_password_confirm && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500 text-center">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Start Free Trial"
              )}
            </Button>

            <p className="text-sm text-slate-600 text-center">
              Already have an account?{" "}
              <Link href="/admin/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
