"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Wrench,
  Calculator,
  HeadphonesIcon,
  Pencil,
  CheckCircle,
  Loader2,
  ChevronDown,
  UserCog,
  Trash2,
  Shield,
  Eye,
  SquarePen,
  PlusCircle,
  Trash,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

import { adminApi } from "@/lib/admin-api"
import {
  adminRouteAccessRules,
  defaultTokensForRole,
  encodeAction,
  getPaths,
  getActionsForPath,
  setRoleAccessPolicies,
  PAGE_ACTION_LABELS,
  type PageAction,
  type RouteAccessRule,
} from "@/lib/rbac"
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
import { Switch } from "@/components/ui/switch"

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

type StaffAccessChoice = StaffRole | "custom"

const STAFF_ACCESS_CHOICES: Array<{
  value: StaffAccessChoice
  label: string
  description: string
  icon: React.ElementType
}> = [
  ...STAFF_ROLES,
  {
    value: "custom",
    label: "Custom Access",
    description: "Choose the exact pages and actions for this person",
    icon: Shield,
  },
]

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
]

// Action icons for the permission editor
const ACTION_ICONS: Record<PageAction, React.ElementType> = {
  view: Eye,
  view_details: FileText,
  add: PlusCircle,
  edit: SquarePen,
  delete: Trash,
}

// Routes that manage this permission editor itself should remain owner/admin-only.
const NON_DELEGABLE_PATHS = ["/admin/staff"]

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  if (!phone) return true
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

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s-]/g, "").trim()
}

function getApiErrorData(error: unknown): Record<string, unknown> {
  if (error && typeof error === "object") {
    const maybeError = error as Record<string, unknown>
    const data = maybeError.data
    if (data && typeof data === "object") return data as Record<string, unknown>
    return maybeError
  }
  return {}
}

function toErrorText(value: unknown): string {
  if (Array.isArray(value)) return value.map(toErrorText).filter(Boolean).join(", ")
  if (value && typeof value === "object") return JSON.stringify(value)
  return String(value || "")
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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    role: "" as StaffAccessChoice | "",
    phone_number: "",
    id_number: "",
    gender: "" as Gender | "",
    date_of_birth: "",
  })
  const [customAllowedPaths, setCustomAllowedPaths] = useState<string[]>([])

  const passwordValidation = useMemo(
    () => validatePassword(formData.password),
    [formData.password]
  )

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
      setCustomAllowedPaths([])
      setShowOptionalFields(false)
    }
  }, [open])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) newErrors.first_name = "First name is required"
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.role) newErrors.role = "Role is required"
    if (formData.role === "custom" && customAllowedPaths.length === 0) {
      newErrors.custom_allowed_paths = "Select at least one page for custom access"
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
      const payload: CreateStaffUserRequest = {
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role === "custom" ? "staff" : formData.role as StaffRole,
        is_staff: true,
        custom_allowed_paths: formData.role === "custom" ? customAllowedPaths : null,
      }

      if (formData.phone_number?.trim()) payload.phone_number = normalizePhoneNumber(formData.phone_number)
      if (formData.id_number?.trim()) payload.id_number = formData.id_number.trim()
      if (formData.gender) payload.gender = formData.gender as Gender
      if (formData.date_of_birth) payload.date_of_birth = formData.date_of_birth

      const response = await adminApi.createStaffUser(payload)
      const createdUser = (response as any).user ?? response
      toast.success(
        `Staff account created for ${createdUser.first_name} ${createdUser.last_name}`,
        {
          description: formData.role === "custom"
            ? `${getPaths(customAllowedPaths).length} custom pages assigned. They can now log in immediately.`
            : `Role: ${formData.role}. They can now log in with their email and password.`,
        }
      )
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      console.error("Failed to create staff user:", error)
      if (error && typeof error === "object") {
        const errorObj = getApiErrorData(error)
        const errorMessages: string[] = []
        const fieldMap: Record<string, string> = {
          email: "Email",
          password: "Password",
          role: "Role",
          first_name: "First name",
          last_name: "Last name",
          phone_number: "Phone",
        }
        for (const [field, label] of Object.entries(fieldMap)) {
          if (errorObj[field]) {
            const msg = toErrorText(errorObj[field])
            setErrors((prev) => ({ ...prev, [field]: msg }))
            errorMessages.push(`${label}: ${msg}`)
          }
        }
        if (errorObj.non_field_errors) {
          errorMessages.push(toErrorText(errorObj.non_field_errors))
        }
        if (errorObj.detail) errorMessages.push(toErrorText(errorObj.detail))
        if (!errorMessages.length && error instanceof Error) errorMessages.push(error.message)
        toast.error("Failed to create staff account", {
          description: errorMessages.length > 0 ? errorMessages.join(". ") : "Please check the form for errors",
        })
      } else {
        toast.error("Failed to create staff account", {
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
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
            Add a new staff member. They will access the admin dashboard based on their role and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Select Role <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {STAFF_ACCESS_CHOICES.map((role) => {
                const Icon = role.icon
                const isSelected = formData.role === role.value
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleInputChange("role", role.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${role.value === "custom" ? "col-span-2" : ""} ${
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
                      <p className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
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

          {formData.role === "custom" && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="mb-4">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  Assign custom pages
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  View is required to open a page. Add, edit, detail and delete permissions remain separate.
                </p>
              </div>
              <PermissionTokenPicker
                value={customAllowedPaths}
                onChange={(tokens) => {
                  setCustomAllowedPaths(tokens)
                  if (errors.custom_allowed_paths) {
                    setErrors((current) => ({ ...current, custom_allowed_paths: "" }))
                  }
                }}
              />
              {errors.custom_allowed_paths && (
                <p className="mt-3 text-sm text-destructive">{errors.custom_allowed_paths}</p>
              )}
            </div>
          )}

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Personal Information</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name <span className="text-destructive">*</span></Label>
                <Input
                  id="first_name"
                  placeholder="Jane"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className={errors.first_name ? "border-destructive" : ""}
                />
                {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="phone_number">Phone Number <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

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
                    className={req.met ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""}
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
                  className={`w-4 h-4 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
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
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Create Account</>
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
    role: "" as StaffAccessChoice | "",
    is_active: true,
    new_password: "",
    confirmPassword: "",
  })
  const [customAllowedPaths, setCustomAllowedPaths] = useState<string[]>([])

  useEffect(() => {
    if (user && open) {
      setFormData({
        email: user.email || "",
        role: user.custom_allowed_paths !== null && user.custom_allowed_paths !== undefined
          ? "custom"
          : (user.role as StaffRole) || "",
        is_active: user.is_active !== false,
        new_password: "",
        confirmPassword: "",
      })
      setCustomAllowedPaths(user.custom_allowed_paths || [])
      setErrors({})
    }
  }, [user, open])

  const handleInputChange = (field: string, value: string | boolean) => {
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
    if (!formData.role) newErrors.role = "Role is required"
    if (formData.role === "custom" && customAllowedPaths.length === 0) {
      newErrors.custom_allowed_paths = "Select at least one page for custom access"
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
        role: formData.role === "custom" ? ((user.role as StaffRole) || "staff") : formData.role,
        is_active: formData.is_active,
        custom_allowed_paths: formData.role === "custom" ? customAllowedPaths : null,
      }
      if (formData.new_password) {
        payload.new_password = formData.new_password
      }

      await adminApi.updateStaffUser(user.id, payload)
      toast.success(`Staff account for ${user.first_name} ${user.last_name} updated`)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      const errorObj = getApiErrorData(error)
      const description =
        toErrorText(errorObj.detail) ||
        toErrorText(errorObj.non_field_errors) ||
        error?.message ||
        "Please check the form for errors"
      toast.error("Failed to update staff account", {
        description,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto">
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
              {STAFF_ACCESS_CHOICES.map((role) => {
                const Icon = role.icon
                const isSelected = formData.role === role.value
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleInputChange("role", role.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${role.value === "custom" ? "col-span-2" : ""} ${
                      isSelected ? "border-primary bg-primary/10" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>
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

          {formData.role === "custom" && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="mb-4">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  Custom page access
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  This override applies only to {user?.first_name || "this staff member"}.
                </p>
              </div>
              <PermissionTokenPicker
                value={customAllowedPaths}
                onChange={(tokens) => {
                  setCustomAllowedPaths(tokens)
                  if (errors.custom_allowed_paths) {
                    setErrors((current) => ({ ...current, custom_allowed_paths: "" }))
                  }
                }}
              />
              {errors.custom_allowed_paths && (
                <p className="mt-3 text-sm text-destructive">{errors.custom_allowed_paths}</p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-is-active" className="text-sm font-semibold">
                  Staff account active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive staff cannot use this account to access the admin workspace.
                </p>
              </div>
              <Switch
                id="edit-is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address <span className="text-destructive">*</span></Label>
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
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
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
                    className={req.met ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""}
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
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// GRANULAR PERMISSIONS MODAL
// ==========================================

interface PagePermState {
  // Whether this page is included at all
  enabled: boolean
  // Which CRUD actions are toggled ON
  actions: Set<PageAction>
}

interface EditPermissionsModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  role: {
    id: StaffRole
    name: string
    description: string
    accent: string
    allowedTokens: string[]  // encoded action tokens like "/admin/leads::view"
  } | null
  onSave: (role: StaffRole, allowedTokens: string[]) => Promise<void>
}

// Collapsible page row inside the permissions modal
function PermissionPageRow({
  rule,
  state,
  onChange,
}: {
  rule: RouteAccessRule
  state: PagePermState
  onChange: (newState: PagePermState) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const availableActions = rule.actions || (["view"] as PageAction[])

  const togglePage = () => {
    const newEnabled = !state.enabled
    // When disabling, clear all actions. When enabling, select all by default.
    const newActions = newEnabled ? new Set<PageAction>(availableActions) : new Set<PageAction>()
    onChange({ enabled: newEnabled, actions: newActions })
    if (newEnabled) setExpanded(true)
  }

  const toggleAction = (action: PageAction) => {
    const newActions = new Set(state.actions)
    if (newActions.has(action)) {
      newActions.delete(action)
      // View is the route gate. Turning it off should disable the page instead
      // of saving hidden action tokens that cannot be reached.
      if (action === "view" || newActions.size === 0) {
        onChange({ enabled: false, actions: new Set() })
        return
      }
    } else {
      newActions.add(action)
      if (action !== "view" && availableActions.includes("view")) {
        newActions.add("view")
      }
    }
    onChange({ enabled: state.enabled, actions: newActions })
  }

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        state.enabled
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background"
      }`}
    >
      {/* Page header row */}
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          id={`page-${rule.pathPrefix}`}
          checked={state.enabled}
          onChange={togglePage}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
        />
        <label
          htmlFor={`page-${rule.pathPrefix}`}
          className="flex-1 cursor-pointer"
        >
          <span className={`block text-sm font-semibold ${state.enabled ? "text-primary" : "text-foreground"}`}>
            {rule.label}
          </span>
          <span className="block text-[11px] text-muted-foreground">{rule.pathPrefix}</span>
        </label>

        {state.enabled && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <span>{state.actions.size} action{state.actions.size !== 1 ? "s" : ""}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Expanded CRUD actions */}
      {state.enabled && expanded && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-2 border-t border-primary/10 pt-3">
          {availableActions.map((action) => {
            const Icon = ACTION_ICONS[action]
            const isChecked = state.actions.has(action)
            return (
              <label
                key={action}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${
                  isChecked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAction(action)}
                  className="sr-only"
                />
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-semibold">{PAGE_ACTION_LABELS[action]}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PermissionTokenPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tokens: string[]) => void
}) {
  const [search, setSearch] = useState("")
  const eligibleRules = useMemo(
    () => adminRouteAccessRules.filter(
      (rule) => !NON_DELEGABLE_PATHS.includes(rule.pathPrefix),
    ),
    [],
  )
  const visibleRules = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return eligibleRules
    return eligibleRules.filter(
      (rule) => rule.label.toLowerCase().includes(query) || rule.pathPrefix.toLowerCase().includes(query),
    )
  }, [eligibleRules, search])

  const stateFor = (rule: RouteAccessRule): PagePermState => {
    const availableActions = rule.actions || (["view"] as PageAction[])
    const actionTokens = getActionsForPath(value, rule.pathPrefix)
    const hasLegacyPath = value.some((token) => token === rule.pathPrefix)
    const actions = actionTokens.length > 0
      ? actionTokens
      : hasLegacyPath
        ? availableActions
        : []
    return { enabled: actions.length > 0, actions: new Set(actions) }
  }

  const updateRule = (rule: RouteAccessRule, state: PagePermState) => {
    const next = value.filter((token) => token.split("::", 1)[0] !== rule.pathPrefix)
    if (state.enabled) {
      const availableActions = rule.actions || (["view"] as PageAction[])
      for (const action of state.actions) {
        if (availableActions.includes(action)) next.push(encodeAction(rule.pathPrefix, action))
      }
    }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search available pages..."
          className="bg-background pl-9"
        />
      </div>
      <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {visibleRules.map((rule) => (
          <PermissionPageRow
            key={rule.pathPrefix}
            rule={rule}
            state={stateFor(rule)}
            onChange={(state) => updateRule(rule, state)}
          />
        ))}
        {visibleRules.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
            No matching dashboard pages.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{getPaths(value).length}</strong> pages selected</span>
        <span><strong className="text-foreground">{value.length}</strong> actions granted</span>
      </div>
    </div>
  )
}

function EditPermissionsModal({ open, onOpenChange, role, onSave }: EditPermissionsModalProps) {
  const [pageStates, setPageStates] = useState<Map<string, PagePermState>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState("")

  // Eligible pages (exclude the permission editor itself)
  const eligibleRules = useMemo(
    () => adminRouteAccessRules.filter((r) => !NON_DELEGABLE_PATHS.some((p) => r.pathPrefix === p)),
    []
  )

  const displayedRules = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase()
    if (!query) return eligibleRules
    return eligibleRules.filter((rule) => {
      return (
        rule.label.toLowerCase().includes(query) ||
        rule.pathPrefix.toLowerCase().includes(query)
      )
    })
  }, [eligibleRules, permissionSearch])

  useEffect(() => {
    if (!role || !open) return
    setPermissionSearch("")
    const currentTokens = role.allowedTokens || []

    const map = new Map<string, PagePermState>()
    for (const rule of eligibleRules) {
      const actionsForPage = getActionsForPath(currentTokens, rule.pathPrefix)
      // Legacy plain-path support
      const plainPaths = getPaths(currentTokens)
      const legacyEnabled = plainPaths.includes(rule.pathPrefix)

      const availableActions = rule.actions || (["view"] as PageAction[])
      let grantedActions: PageAction[] = actionsForPage

      // If no action tokens found but page is in legacy plain list, grant all available
      if (grantedActions.length === 0 && legacyEnabled) {
        grantedActions = availableActions
      }

      map.set(rule.pathPrefix, {
        enabled: grantedActions.length > 0,
        actions: new Set(grantedActions),
      })
    }
    setPageStates(map)
  }, [role, open, eligibleRules])

  if (!role) return null

  const handlePageChange = (pathPrefix: string, newState: PagePermState) => {
    setPageStates((current) => {
      const next = new Map(current)
      next.set(pathPrefix, newState)
      return next
    })
  }

  const buildTokens = (): string[] => {
    const tokens: string[] = []
    for (const [pathPrefix, state] of pageStates.entries()) {
      if (!state.enabled) continue
      const rule = adminRouteAccessRules.find((item) => item.pathPrefix === pathPrefix)
      const availableActions = rule?.actions || (["view"] as PageAction[])
      for (const action of state.actions) {
        if (!availableActions.includes(action)) continue
        tokens.push(encodeAction(pathPrefix, action))
      }
    }
    return tokens
  }

  const enabledCount = [...pageStates.values()].filter((s) => s.enabled).length
  const totalActions = [...pageStates.values()].reduce((acc, s) => acc + s.actions.size, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden bg-background flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-border shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Edit {role.name} permissions
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              {role.description}
              <br /><br />
              Choose which dashboard pages and CRUD operations this role can perform.
              Changes apply to <strong>all staff members</strong> assigned to this role.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable page list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-card">
          <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-border bg-card/95 p-4 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                placeholder="Search pages or routes..."
                className="pl-9"
              />
            </div>
          </div>
          {displayedRules.map((rule) => {
            const state = pageStates.get(rule.pathPrefix) ?? { enabled: false, actions: new Set() }
            return (
              <PermissionPageRow
                key={rule.pathPrefix}
                rule={rule}
                state={state}
                onChange={(newState) => handlePageChange(rule.pathPrefix, newState)}
              />
            )
          })}
          {displayedRules.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
              No matching routes.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-background p-4 shrink-0 gap-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{enabledCount}</span> page{enabledCount !== 1 ? "s" : ""}
            {" · "}
            <span className="font-semibold text-foreground">{totalActions}</span> action{totalActions !== 1 ? "s" : ""} granted
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-semibold">
              Cancel
            </Button>
            <Button
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true)
                try {
                  await onSave(role.id, buildTokens())
                  onOpenChange(false)
                } finally {
                  setIsSaving(false)
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save permissions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// ROLE DEFINITIONS
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

// ==========================================
// MAIN STAFF PAGE COMPONENT
// ==========================================

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

  // Role access policies: maps role -> array of encoded permission tokens
  const [rolePolicies, setRolePolicies] = useState<Record<string, string[]>>({})
  const [editingRole, setEditingRole] = useState<any | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getStaffUsers({ staff_only: "true" })
      const rawUsers = Array.isArray(data) ? data : Array.isArray((data as any).results) ? (data as any).results : []
      const hiddenEmails = ["peter@netily.co.ke", "mark@netily.co.ke", "admin@netily.co.ke"]
      setStaffUsers(
        rawUsers.filter((u: any) => {
          const email = u.email?.toLowerCase?.() || ""
          const role = String(u.role || "").toLowerCase()
          return !hiddenEmails.includes(email) && role !== "customer"
        })
      )

      try {
        const policies = await adminApi.getRoleAccessPolicies()
        setRolePolicies(
          (policies || []).reduce<Record<string, string[]>>((acc, policy) => {
            acc[policy.role] = policy.allowed_paths || []
            return acc
          }, {})
        )
        setRoleAccessPolicies(policies || [])
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

  const filteredStaff = staffUsers.filter((u) => {
    const role = String(u.role || "").toLowerCase()
    if (role === "customer") return false
    return (u.first_name + " " + u.last_name + " " + (u.email || ""))
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  })

  const roleCards = NETILY_ROLE_DEFINITIONS.map((roleDef) => {
    const tokens = rolePolicies[roleDef.id] || defaultTokensForRole(roleDef.id)
    const paths = getPaths(tokens)
    const pageCount = paths.length
    const totalActionCount = tokens.filter((t) => t.includes("::")).length

    return {
      ...roleDef,
      allowedTokens: tokens,
      pageCount,
      totalActionCount,
      memberCount: staffUsers.filter((u) => u.role === roleDef.id).length,
      // Quick summary of page labels
      pageLabels: paths
        .map((p) => adminRouteAccessRules.find((r) => r.pathPrefix === p)?.label || p)
        .filter(Boolean),
    }
  })

  const saveRoleAccess = async (role: StaffRole, allowedTokens: string[]) => {
    try {
      const updated = await adminApi.updateRoleAccessPolicy(role, allowedTokens)
      const nextPolicies = { ...rolePolicies, [role]: updated.allowed_paths || [] }
      setRolePolicies(nextPolicies)
      setRoleAccessPolicies(
        Object.entries(nextPolicies).map(([policyRole, allowed_paths]) => ({
          role: policyRole,
          allowed_paths,
        })),
      )
      window.dispatchEvent(new CustomEvent("netily-role-access-updated"))
      toast.success("Role permissions updated", {
        description: "Staff navigation and protected pages will now use the new access map.",
      })
    } catch (error: any) {
      toast.error("Failed to update role permissions", {
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
              Staff &amp; <span className="text-primary">access</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Manage tenant staff accounts and the granular permissions each role has per dashboard page.
            </p>
          </div>
          {activeTab === "members" && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Add staff
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-card p-1 rounded-full border border-border shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === "members"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Members{" "}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === "members"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {staffUsers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === "roles"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Roles &amp; Permissions{" "}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === "roles"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {roleCards.length}
            </span>
          </button>
        </div>

        {/* Content */}
        {activeTab === "members" ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow>
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</TableHead>
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</TableHead>
                    <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="h-12 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading staff...
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff) => (
                      <TableRow key={staff.id} className="transition-colors hover:bg-muted/30">
                        <TableCell className="py-4 font-semibold text-foreground">
                          {staff.first_name} {staff.last_name}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-foreground/85">{staff.email || "No email"}</span>
                            <span className="text-xs text-muted-foreground">{staff.phone_number || "No phone"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
                              {staff.role}
                            </span>
                            {staff.custom_allowed_paths !== null && staff.custom_allowed_paths !== undefined && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                                <Shield className="h-3 w-3" /> Custom · {getPaths(staff.custom_allowed_paths).length} pages
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {staff.is_active !== false ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border bg-background shadow-sm hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl border-border shadow-lg">
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                {staff.first_name} {staff.last_name}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => { setSelectedUser(staff); setEditDialogOpen(true) }}
                                className="gap-2 text-sm font-medium cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" /> Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (staff.custom_allowed_paths !== null && staff.custom_allowed_paths !== undefined) {
                                    setSelectedUser(staff)
                                    setEditDialogOpen(true)
                                    return
                                  }
                                  const roleCard = roleCards.find((role) => role.id === staff.role)
                                  if (roleCard) setEditingRole(roleCard)
                                }}
                                className="gap-2 text-sm font-medium cursor-pointer"
                              >
                                <Shield className="h-4 w-4" />
                                {staff.custom_allowed_paths !== null && staff.custom_allowed_paths !== undefined
                                  ? "Edit Custom Access"
                                  : "Edit Role Permissions"}
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
            <div className="border-t border-border bg-muted/30 p-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              © 2023-2026 Netily
            </div>
          </div>
        ) : (
          /* Roles & Permissions Tab */
          <div className="space-y-6">
            <p className="max-w-4xl text-sm font-medium text-muted-foreground">
              Roles are connected to Netily's active route guards. Each role can have granular{" "}
              <span className="font-semibold text-foreground">page-level access</span> plus fine-grained{" "}
              <span className="font-semibold text-foreground">CRUD action control</span> — so a support agent can view tickets but not delete them.
            </p>
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
                    <p className="mb-4 min-h-[40px] text-sm text-muted-foreground">{role.description}</p>

                    {/* Summary badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {role.pageLabels.slice(0, 6).map((label) => (
                        <span
                          key={label}
                          className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-wider rounded-md"
                        >
                          {label}
                        </span>
                      ))}
                      {role.pageLabels.length > 6 && (
                        <span className="px-2 py-0.5 bg-muted border border-border text-muted-foreground text-[10px] font-bold tracking-wider rounded-md">
                          +{role.pageLabels.length - 6} more
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        <span className="font-bold text-foreground">{role.pageCount}</span> pages
                      </span>
                      <span>
                        <span className="font-bold text-foreground">{role.totalActionCount}</span> actions granted
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20 rounded-b-2xl">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {role.memberCount} member{role.memberCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => setEditingRole(role)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-muted hover:text-primary"
                    >
                      <Shield className="h-3.5 w-3.5" /> Edit permissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateStaffDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={fetchStaff} />
      <EditStaffDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={fetchStaff} user={selectedUser} />
      <EditPermissionsModal
        open={!!editingRole}
        onOpenChange={(v) => !v && setEditingRole(null)}
        role={editingRole}
        onSave={saveRoleAccess}
      />
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove staff account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke admin dashboard access for{" "}
              <span className="font-semibold text-foreground">
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removing...</>
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
