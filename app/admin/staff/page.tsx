"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Wrench,
  Calculator,
  HeadphonesIcon,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  UserCog,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { adminApi } from "@/lib/admin-api"
import { adminRouteAccessRules } from "@/lib/rbac"
import type { User, StaffRole, Gender, CreateStaffUserRequest } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ==========================================
// CONSTANTS
// ==========================================

const STAFF_ROLES: { value: StaffRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "staff",
    label: "Staff",
    description: "General staff member for office/support roles",
    icon: Users,
  },
  {
    value: "technician",
    label: "Technician",
    description: "Field technician for installation & maintenance",
    icon: Wrench,
  },
  {
    value: "accountant",
    label: "Accountant",
    description: "Finance, billing & payments handling",
    icon: Calculator,
  },
  {
    value: "support",
    label: "Support",
    description: "Customer support & helpdesk",
    icon: HeadphonesIcon,
  },
]

// 🟢 FIX: Gender values changed to match backend choices (M/F/O)
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "M" as any, label: "Male" },
  { value: "F" as any, label: "Female" },
  { value: "O" as any, label: "Other" },
]

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getRoleBadgeVariant(role?: string): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case "technician":
      return "secondary"
    case "accountant":
      return "outline"
    case "support":
      return "default"
    default:
      return "default"
  }
}

function getRoleIcon(role?: string): React.ElementType {
  switch (role) {
    case "technician":
      return Wrench
    case "accountant":
      return Calculator
    case "support":
      return HeadphonesIcon
    default:
      return Users
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  if (!phone) return true // Optional field
  return /^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ""))
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push("At least 8 characters")
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter")
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter")
  if (!/[0-9]/.test(password)) errors.push("One number")
  return { valid: errors.length === 0, errors }
}

// ==========================================
// CREATE STAFF DIALOG COMPONENT
// ==========================================

interface CreateStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function CreateStaffDialog({ open, onOpenChange, onSuccess }: CreateStaffDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    role: "" as StaffRole | "",
    phone_number: "",
    id_number: "",
    gender: "" as Gender | "",
    date_of_birth: "",
  })

  // Password validation
  const passwordValidation = useMemo(
    () => validatePassword(formData.password),
    [formData.password]
  )

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        role: "",
        phone_number: "",
        id_number: "",
        gender: "",
        date_of_birth: "",
      })
      setErrors({})
      setShowOptionalFields(false)
    }
  }, [open])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.role) {
      newErrors.role = "Role is required"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!passwordValidation.valid) {
      newErrors.password = "Password does not meet requirements"
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Phone number is required
    if (!formData.phone_number?.trim()) {
      newErrors.phone_number = "Phone number is required"
    } else if (!validatePhone(formData.phone_number)) {
      newErrors.phone_number = "Invalid phone format (use +254...)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the form errors")
      return
    }

    setIsSubmitting(true)

    try {
      // Build payload - DO NOT include confirmPassword (backend doesn't accept it)
      const payload: CreateStaffUserRequest = {
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role as StaffRole, // Already lowercase from STAFF_ROLES
        is_staff: true,
      }

      // Add optional fields if provided
      if (formData.phone_number?.trim()) {
        payload.phone_number = formData.phone_number.trim()
      }
      if (formData.id_number?.trim()) {
        payload.id_number = formData.id_number.trim()
      }
      if (formData.gender) {
        payload.gender = formData.gender as Gender
      }
      if (formData.date_of_birth) {
        payload.date_of_birth = formData.date_of_birth
      }

      // Debug log for troubleshooting
      console.log("Sending staff creation payload:", JSON.stringify(payload, null, 2))

      const response = await adminApi.createStaffUser(payload)

      // 🟢 FIX 1: Safely extract user object from response
      const createdUser = (response as any).user ?? response
      toast.success(
        `Staff account created for ${createdUser.first_name} ${createdUser.last_name}`,
        {
          description: `Role: ${formData.role}. They can now log in with their email and password.`,
        }
      )

      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      console.error("Failed to create staff user - Full error:", error)

      // Handle API errors - check if it's a 400 error with field-specific messages
      if (error && typeof error === "object") {
        const errorObj = error as Record<string, unknown>
        
        // Build a user-friendly error message
        const errorMessages: string[] = []
        
        // Check for field-specific errors from backend (DRF format)
        if (errorObj.email) {
          const emailError = Array.isArray(errorObj.email) ? errorObj.email[0] : String(errorObj.email)
          setErrors((prev) => ({ ...prev, email: emailError }))
          errorMessages.push(`Email: ${emailError}`)
        }
        if (errorObj.password) {
          const pwError = Array.isArray(errorObj.password) ? errorObj.password[0] : String(errorObj.password)
          setErrors((prev) => ({ ...prev, password: pwError }))
          errorMessages.push(`Password: ${pwError}`)
        }
        if (errorObj.role) {
          const roleError = Array.isArray(errorObj.role) ? errorObj.role[0] : String(errorObj.role)
          setErrors((prev) => ({ ...prev, role: roleError }))
          errorMessages.push(`Role: ${roleError}`)
        }
        if (errorObj.first_name) {
          const fnError = Array.isArray(errorObj.first_name) ? errorObj.first_name[0] : String(errorObj.first_name)
          setErrors((prev) => ({ ...prev, first_name: fnError }))
          errorMessages.push(`First name: ${fnError}`)
        }
        if (errorObj.last_name) {
          const lnError = Array.isArray(errorObj.last_name) ? errorObj.last_name[0] : String(errorObj.last_name)
          setErrors((prev) => ({ ...prev, last_name: lnError }))
          errorMessages.push(`Last name: ${lnError}`)
        }
        if (errorObj.phone_number) {
          const phoneError = Array.isArray(errorObj.phone_number) ? errorObj.phone_number[0] : String(errorObj.phone_number)
          setErrors((prev) => ({ ...prev, phone_number: phoneError }))
          errorMessages.push(`Phone: ${phoneError}`)
        }
        if (errorObj.non_field_errors) {
          const nfError = Array.isArray(errorObj.non_field_errors) ? errorObj.non_field_errors[0] : String(errorObj.non_field_errors)
          errorMessages.push(nfError)
        }
        if (errorObj.detail) {
          errorMessages.push(String(errorObj.detail))
        }

        const description = errorMessages.length > 0 
          ? errorMessages.join(". ") 
          : (errorObj.message ? String(errorObj.message) : "Please check the form for errors")

        toast.error("Failed to create staff account", { description })
      } else if (error instanceof Error) {
        toast.error("Failed to create staff account", {
          description: error.message,
        })
      } else {
        toast.error("Failed to create staff account", {
          description: "An unexpected error occurred. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            Create Staff Account
          </DialogTitle>
          <DialogDescription>
            Add a new staff member to your ISP team. They will be able to log in and access the
            admin dashboard based on their assigned role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Select Role <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {STAFF_ROLES.map((role) => {
                const Icon = role.icon
                const isSelected = formData.role === role.value
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleInputChange("role", role.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {role.label}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2">{role.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Personal Information</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  placeholder="Jane"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className={errors.first_name ? "border-destructive" : ""}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className={errors.last_name ? "border-destructive" : ""}
                />
                {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+254712345678"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    className={`pl-10 ${errors.phone_number ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Login Credentials</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Password requirements */}
            {formData.password && (
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "8+ chars", met: formData.password.length >= 8 },
                  { label: "Uppercase", met: /[A-Z]/.test(formData.password) },
                  { label: "Lowercase", met: /[a-z]/.test(formData.password) },
                  { label: "Number", met: /[0-9]/.test(formData.password) },
                ].map((req) => (
                  <Badge
                    key={req.label}
                    variant={req.met ? "default" : "secondary"}
                    className={req.met ? "bg-success/15 text-success" : ""}
                  >
                    {req.met && <CheckCircle className="w-3 h-3 mr-1" />}
                    {req.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Optional Fields */}
          <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between">
                <span className="text-sm text-slate-600">Optional Information</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showOptionalFields ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input
                    id="id_number"
                    placeholder="12345678"
                    value={formData.id_number}
                    onChange={(e) => handleInputChange("id_number", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// EDIT STAFF DIALOG COMPONENT
// ==========================================

interface EditStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: User | null
}

function EditStaffDialog({ open, onOpenChange, onSuccess, user }: EditStaffDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    email: "",
    role: "" as StaffRole | "",
    new_password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (user && open) {
      setFormData({
        email: user.email || "",
        role: (user.role as StaffRole) || "",
        new_password: "",
        confirmPassword: "",
      })
      setErrors({})
    }
  }, [user, open])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.role) {
      newErrors.role = "Role is required"
    }
    if (formData.new_password) {
      const pwCheck = validatePassword(formData.new_password)
      if (!pwCheck.valid) newErrors.new_password = "Password does not meet requirements"
      if (formData.new_password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !validateForm()) {
      toast.error("Please fix the form errors")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, any> = {
        email: formData.email.trim(),
        role: formData.role,
      }
      if (formData.new_password) {
        payload.new_password = formData.new_password  // FIX: Use new_password instead of password
      }

      await adminApi.updateStaffUser(user.id, payload)
      toast.success(`Staff account for ${user.first_name} ${user.last_name} updated`)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error("Failed to update staff account", {
        description: error?.message || "Please check the form for errors",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Staff Account
          </DialogTitle>
          <DialogDescription>
            Update details for {user?.first_name} {user?.last_name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Role <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {STAFF_ROLES.map((role) => {
                const Icon = role.icon
                const isSelected = formData.role === role.value
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleInputChange("role", role.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {role.label}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          <Separator />

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {/* New Password (optional) */}
          <div className="space-y-2">
            <Label htmlFor="edit-password">
              New Password{" "}
              <span className="text-slate-400 text-xs font-normal">(leave blank to keep current)</span>
            </Label>
            <Input
              id="edit-password"
              type="password"
              placeholder="••••••••"
              value={formData.new_password}
              onChange={(e) => handleInputChange("new_password", e.target.value)}
              className={errors.new_password ? "border-destructive" : ""}
            />
            {errors.new_password && <p className="text-sm text-destructive">{errors.new_password}</p>}
          </div>

          {formData.new_password && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-confirm-password">Confirm New Password</Label>
                <Input
                  id="edit-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Password strength badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "8+ chars", met: formData.new_password.length >= 8 },
                  { label: "Uppercase", met: /[A-Z]/.test(formData.new_password) },
                  { label: "Lowercase", met: /[a-z]/.test(formData.new_password) },
                  { label: "Number", met: /[0-9]/.test(formData.new_password) },
                ].map((req) => (
                  <Badge
                    key={req.label}
                    variant={req.met ? "default" : "secondary"}
                    className={req.met ? "bg-success/15 text-success" : ""}
                  >
                    {req.met && <CheckCircle className="w-3 h-3 mr-1" />}
                    {req.label}
                  </Badge>
                ))}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// MAIN STAFF PAGE COMPONENT
// ==========================================

const NETILY_ROLE_DEFINITIONS: Array<{
  id: StaffRole
  name: string
  description: string
  accent: string
}> = [
  {
    id: "staff",
    name: "General Staff",
    description: "Day-to-day office operations, customers, dispatch, inventory, leads, and support follow-up.",
    accent: "bg-chart-1",
  },
  {
    id: "technician",
    name: "Field Technician",
    description: "Network and field work: routers, RADIUS, FUP, dispatch jobs, inventory, and customer tickets.",
    accent: "bg-chart-2",
  },
  {
    id: "accountant",
    name: "Accountant",
    description: "Finance operations: invoices, payments, receipts, vouchers, billing reports, and subscription usage.",
    accent: "bg-chart-3",
  },
  {
    id: "support",
    name: "Support",
    description: "Customer support and helpdesk: users, tickets, leads, SMS, loyalty, ads, and dispatch follow-up.",
    accent: "bg-chart-4",
  },
]

const defaultPathsForRole = (role: StaffRole) =>
  adminRouteAccessRules
    .filter((rule) => rule.allowedRoles?.includes(role))
    .map((rule) => rule.pathPrefix)

const labelForPath = (path: string) => adminRouteAccessRules.find((rule) => rule.pathPrefix === path)?.label || path

function EditPermissionsModal({
  open,
  onOpenChange,
  role,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  role: any
  onSave: (role: StaffRole, allowedPaths: string[]) => Promise<void>
}) {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (role) setSelectedPaths(role.allowedPaths || [])
  }, [role])

  if (!role) return null;
  const togglePath = (path: string) => {
    setSelectedPaths((current) => current.includes(path) ? current.filter((item) => item !== path) : [...current, path])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-background">
        <div className="p-6 border-b border-border">
           <DialogHeader>
             <DialogTitle className="text-xl font-bold text-foreground">Edit {role.name} access</DialogTitle>
             <DialogDescription className="pt-2 text-sm text-muted-foreground">
               {role.description}<br/><br/>
               Choose the dashboard pages this role can access. Changes apply to all staff members assigned to this role.
             </DialogDescription>
           </DialogHeader>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-card">
          <div className="space-y-3">
            {adminRouteAccessRules
              .filter((rule) => !rule.allowedRoles?.every((item) => item === "admin" || item === "super_admin"))
              .map((rule) => (
              <label key={rule.pathPrefix} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                <input
                  type="checkbox"
                  checked={selectedPaths.includes(rule.pathPrefix)}
                  onChange={() => togglePath(rule.pathPrefix)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">{rule.label}</span>
                  <span className="block text-xs text-muted-foreground">{rule.pathPrefix}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-border bg-background flex justify-between items-center">
           <p className="text-xs text-slate-500">{selectedPaths.length} dashboard area(s) selected</p>
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-semibold">Cancel</Button>
           <Button
             disabled={isSaving}
             onClick={async () => {
               setIsSaving(true)
               try {
                 await onSave(role.id, selectedPaths)
                 onOpenChange(false)
               } finally {
                 setIsSaving(false)
               }
             }}
             className="bg-primary text-primary-foreground hover:bg-primary/90"
           >
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             Save access
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function StaffManagementPage() {
  const router = useRouter()
  const [staffUsers, setStaffUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"members" | "roles">("members")
  const [searchQuery, setSearchQuery] = useState("")

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [rolePolicies, setRolePolicies] = useState<Record<string, string[]>>({})
  
  const [editingRole, setEditingRole] = useState<any | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getStaffUsers()
      setStaffUsers((data as any).results || data)
      
      try {
        const policies = await adminApi.getRoleAccessPolicies()
        setRolePolicies(
          (policies || []).reduce<Record<string, string[]>>((acc, policy) => {
            acc[policy.role] = policy.allowed_paths || []
            return acc
          }, {})
        )
      } catch (policyError) {
        console.warn("Role access policies endpoint not available yet:", policyError)
      }
      
    } catch (error) {
      console.error("fetchStaff Error:", error)
      toast.error("Failed to fetch staff")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await adminApi.deleteStaffUser(userToDelete.id)
      toast.success("Staff account removed", {
        description: `${userToDelete.first_name || userToDelete.email} can no longer access this tenant dashboard.`,
      })
      setUserToDelete(null)
      fetchStaff()
    } catch (error: any) {
      toast.error("Failed to remove staff account", {
        description: error?.message || "Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredStaff = staffUsers.filter(u => 
    (u.first_name + " " + u.last_name + " " + (u.email || "")).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const roleCards = NETILY_ROLE_DEFINITIONS.map((role) => ({
    ...role,
    allowedPaths: rolePolicies[role.id] || defaultPathsForRole(role.id),
    permissions: (rolePolicies[role.id] || defaultPathsForRole(role.id)).map(labelForPath),
    memberCount: staffUsers.filter((user) => {
      return user.role === role.id
    }).length,
  }))

  const saveRoleAccess = async (role: StaffRole, allowedPaths: string[]) => {
    try {
      const updated = await adminApi.updateRoleAccessPolicy(role, allowedPaths)
      setRolePolicies((current) => ({ ...current, [role]: updated.allowed_paths || [] }))
      window.dispatchEvent(new CustomEvent("netily-role-access-updated"))
      toast.success("Role access updated", {
        description: "Staff navigation and protected pages will now use the new access map.",
      })
    } catch (error: any) {
      toast.error("Failed to update role access", {
        description: error?.message || "Please try again.",
      })
      throw error
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <div className="px-8 py-8 max-w-[1400px] mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              Staff & <span className="text-primary">access</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium dark:text-slate-400">Manage tenant staff accounts and the Netily dashboard areas each role can access.</p>
          </div>
          {activeTab === "members" && (
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add staff
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-card p-1 rounded-full border border-border shadow-sm w-fit">
          <button 
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === "members" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Members <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "members" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"}`}>{staffUsers.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === "roles" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Roles <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "roles" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"}`}>{roleCards.length}</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === "members" ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Name</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Contact</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Role</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12">Status</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading staff...</TableCell></TableRow>
                    ) : filteredStaff.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No staff members found.</TableCell></TableRow>
                    ) : (
                      filteredStaff.map((staff) => (
                        <TableRow key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-semibold text-slate-900 py-4">
                            {staff.first_name} {staff.last_name}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-slate-600">{staff.email || "No email"}</span>
                              <span className="text-xs text-slate-500">{staff.phone_number || "No phone"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
                              {staff.role}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            {staff.is_active !== false ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-200 shadow-sm hover:bg-slate-100 bg-white">
                                  <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-slate-200">
                                <DropdownMenuItem onClick={() => { setSelectedUser(staff); setEditDialogOpen(true); }} className="gap-2 text-sm font-medium cursor-pointer">
                                  <Pencil className="h-4 w-4" /> Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setUserToDelete(staff)}
                                  className="gap-2 text-sm font-medium text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" /> Remove User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs font-semibold text-slate-400 tracking-wider uppercase">
               © 2023-2026 Netily
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-slate-500 font-medium max-w-4xl dark:text-slate-400">Roles are connected to Netily's active route guards. When you edit a staff member's role, their dashboard navigation and protected pages update to match.</p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {roleCards.map((role) => (
                <div key={role.id} className="bg-card border border-border rounded-2xl shadow-sm flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${role.accent}`} />
                        <h3 className="text-lg font-bold text-foreground">{role.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-bold">
                        <UserCog className="w-3.5 h-3.5" /> {role.memberCount}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 min-h-[40px] dark:text-slate-400">{role.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map(perm => (
                        <span key={perm} className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-wider rounded-md">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20 rounded-b-2xl">
                    <span className="text-xs font-semibold text-slate-500">{role.permissions.length} dashboard areas</span>
                    <button onClick={() => setEditingRole(role)} className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary bg-background border border-border px-4 py-2 rounded-xl shadow-sm transition-colors hover:bg-muted">
                      <Eye className="w-3.5 h-3.5" /> View access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateStaffDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={fetchStaff} />
      <EditStaffDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={fetchStaff} user={selectedUser} />
      <EditPermissionsModal open={!!editingRole} onOpenChange={(v) => !v && setEditingRole(null)} role={editingRole} onSave={saveRoleAccess} />
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove staff account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke admin dashboard access for{" "}
              <span className="font-semibold text-slate-900">
                {userToDelete?.first_name} {userToDelete?.last_name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove staff"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
