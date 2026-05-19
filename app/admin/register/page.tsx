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
  Rocket,
  Sparkles,
  Shield,
  Wifi,
  Server,
  Users,
  Zap,
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
import { 
  getApiBaseUrl, 
  getSubdomainInfo, 
  getTenantFrontendUrl, 
  slugifyCompanyName,
  isTenantDomain 
} from "@/lib/subdomain"

// ==========================================
// LOADING STEPS - Fun messages during account creation
// ==========================================

const SETUP_STEPS = [
  {
    icon: Building2,
    title: "Creating your company",
    subtitle: "Setting up your ISP headquarters...",
    funFact: "Fun fact: The first ISP was launched in 1989!",
  },
  {
    icon: Server,
    title: "Provisioning your database",
    subtitle: "Building a home for all your data...",
    funFact: "We're creating tables faster than you can say \"bandwidth\"",
  },
  {
    icon: Shield,
    title: "Securing your account",
    subtitle: "Adding military-grade encryption...",
    funFact: "Your password is now safer than a Swiss bank vault 🏦",
  },
  {
    icon: Wifi,
    title: "Configuring network modules",
    subtitle: "Getting your router management ready...",
    funFact: "Soon you'll manage routers like a pro!",
  },
  {
    icon: Users,
    title: "Preparing customer tools",
    subtitle: "Setting up subscriber management...",
    funFact: "Your future customers will thank you 🙏",
  },
  {
    icon: Zap,
    title: "Activating your 14-day trial",
    subtitle: "Almost there! Unlocking all premium features...",
    funFact: "No credit card needed. We trust you! 💙",
  },
  {
    icon: Rocket,
    title: "Launching your dashboard",
    subtitle: "Preparing for takeoff in 3... 2... 1...",
    funFact: "Houston, we have liftoff! 🚀",
  },
]

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

function getRegistrationApiBase(): string {
  // Use explicit env var if set (should include /api/v1 already)
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl) {
    // Ensure it ends with /api/v1 regardless of what was set
    const cleaned = envUrl.replace(/\/+$/, '')
    return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`
  }
  // Fallback: use subdomain-aware detection (shared with rest of app)
  if (typeof window !== 'undefined') {
    return getApiBaseUrl()
  }
  return 'http://127.0.0.1:8000/api/v1'
}

async function registerCompany(data: Omit<RegisterFormData, "admin_password_confirm">) {
  const apiBase = getRegistrationApiBase()
  const response = await fetch(`${apiBase}/core/companies/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  const result = await response.json().catch(async () => {
    const text = await response.text().catch(() => "")
    return {
      detail: text || `Request failed with status ${response.status}`,
    }
  })

  if (!response.ok) {
    throw { status: response.status, errors: result }
  }

  return result
}

// ==========================================
// LOADING OVERLAY COMPONENT
// ==========================================

function CreatingAccountOverlay({ 
  currentStep, 
  isComplete,
  companyName,
  tenantUrl,
  completionNote,
  warningNote,
}: { 
  currentStep: number
  isComplete: boolean
  companyName: string
  tenantUrl?: string
  completionNote?: string | null
  warningNote?: string | null
}) {
  const step = SETUP_STEPS[currentStep] || SETUP_STEPS[0]
  const StepIcon = step.icon
  const progress = ((currentStep + 1) / SETUP_STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            {isComplete ? (
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            ) : (
              <StepIcon className="w-10 h-10 text-white animate-bounce" />
            )}
          </div>
        </div>

        {/* Main message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isComplete ? "All Done! 🎉" : step.title}
          </h1>
          <p className="text-blue-100 text-lg">
            {isComplete ? `Welcome to Netily, ${companyName}!` : step.subtitle}
          </p>
        </div>

        {(completionNote || warningNote) && (
          <div className={`mx-auto mb-6 max-w-sm rounded-2xl border px-4 py-3 text-left backdrop-blur-sm ${
            warningNote
              ? "border-amber-300/30 bg-amber-400/10 text-amber-50"
              : "border-emerald-300/30 bg-emerald-400/10 text-emerald-50"
          }`}>
            {completionNote && <p className="text-sm font-semibold">{completionNote}</p>}
            {warningNote && <p className="mt-1 text-sm text-amber-100">{warningNote}</p>}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${isComplete ? 100 : progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-blue-200">
            <span>Step {currentStep + 1} of {SETUP_STEPS.length}</span>
            <span>{Math.round(isComplete ? 100 : progress)}%</span>
          </div>
        </div>

        {/* Steps indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {SETUP_STEPS.map((s, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index < currentStep
                  ? "bg-green-400"
                  : index === currentStep
                  ? "bg-white scale-125"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Fun fact */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <p className="text-blue-100 text-sm italic">
            {isComplete 
              ? tenantUrl 
                ? `Redirecting you to ${tenantUrl}...` 
                : "Redirecting to your dashboard..." 
              : step.funFact}
          </p>
        </div>

        {/* Completed steps list */}
        {currentStep > 0 && !isComplete && (
          <div className="mt-6 text-left">
            <div className="space-y-2">
              {SETUP_STEPS.slice(0, currentStep).map((s, index) => (
                <div key={index} className="flex items-center gap-2 text-green-300 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AdminRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [tenantUrl, setTenantUrl] = useState<string | null>(null)
  const [completionNote, setCompletionNote] = useState<string | null>(null)
  const [warningNote, setWarningNote] = useState<string | null>(null)
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

  // Step animation during loading
  useEffect(() => {
    if (!loading) {
      setCurrentStep(0)
      setIsSetupComplete(false)
      setTenantUrl(null)
      setCompletionNote(null)
      setWarningNote(null)
      return
    }

    // Cycle through steps while loading
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < SETUP_STEPS.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 2400) // Change step every 2.4 seconds

    return () => clearInterval(stepInterval)
  }, [loading])

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
      const scoped = (k: string) => `${k}:${window.location.hostname}`
      localStorage.setItem(scoped("adminToken"), response.access)
      localStorage.setItem(scoped("adminRefreshToken"), response.refresh)
      localStorage.setItem(scoped("adminUser"), JSON.stringify(response.user))

      // Set cookie for middleware auth check
      document.cookie = `adminToken=${response.access}; path=/; max-age=${86400 * 7}; SameSite=Lax`

      // Store trial start date
      const trialStartDate = new Date().toISOString()
      localStorage.setItem("trialStartDate", trialStartDate)

      // Get tenant subdomain from backend response (source of truth)
      // Backend returns: response.user.company.slug or response.subdomain
      const tenantSubdomain = 
        response.user?.company?.slug || 
        response.user?.company?.subdomain ||
        (response as any).subdomain ||
        slugifyCompanyName(formData.company_name) // Fallback to generated slug
      
      console.log('Registration success, tenant subdomain:', tenantSubdomain)
      
      const tenantAdminUrl = getTenantFrontendUrl(tenantSubdomain, "/admin")
      
      // Set the tenant URL and show completion state
      setTenantUrl(tenantAdminUrl)
      setIsSetupComplete(true)
      const welcomeProvider = response?.welcome_email?.provider
      const welcomeSent = response?.welcome_email?.sent
      const warnings = Array.isArray(response?.warnings) ? response.warnings : []
      const emailMessage = welcomeSent
        ? `Welcome email sent${welcomeProvider ? ` via ${String(welcomeProvider).toUpperCase()}` : ""}.`
        : "Workspace created, but the welcome email was not delivered."
      setCompletionNote(emailMessage)
      setWarningNote(warnings[0] || (!welcomeSent ? "You can still continue directly to the tenant dashboard and fix mail delivery afterward." : null))

      if (welcomeSent) {
        toast.success(emailMessage)
      } else {
        toast.warning(emailMessage)
      }

      // Wait a moment to show the success animation
      await new Promise((resolve) => setTimeout(resolve, welcomeSent ? 2000 : 3500))

      // Redirect to the tenant's admin dashboard
      window.location.href = tenantAdminUrl
    } catch (error: any) {
      setLoading(false)
      if (error.status === 400 && error.errors) {
        // Map backend validation errors to form fields
        setErrors(error.errors)
        const firstError = Object.values(error.errors).flat()[0] as string
        toast.error(firstError || "Please fix the errors in the form")
      } else if (error.status === 500) {
        const backendDetail =
          error?.errors?.detail ||
          error?.errors?.error ||
          "Something went wrong. Please try again later."
        setGeneralError(String(backendDetail))
        toast.error(String(backendDetail))
      } else if (error.status === 502 || error.status === 503 || error.status === 504) {
        const gatewayMessage =
          "Registration service is temporarily unavailable (gateway/server restart). Please retry in 30-60 seconds."
        setGeneralError(gatewayMessage)
        toast.error(gatewayMessage)
      } else {
        const fallbackMessage =
          error?.errors?.detail ||
          error?.errors?.error ||
          error?.message ||
          "Registration failed. Please try again."
        setGeneralError(String(fallbackMessage))
        toast.error(String(fallbackMessage))
      }
    }
  }

  const getFieldError = (field: string): string | undefined => {
    return errors[field]?.[0]
  }

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <CreatingAccountOverlay
          currentStep={currentStep}
          isComplete={isSetupComplete}
          companyName={formData.company_name || "your company"}
          tenantUrl={tenantUrl || undefined}
          completionNote={completionNote}
          warningNote={warningNote}
        />
      )}

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
    </>
  )
}
