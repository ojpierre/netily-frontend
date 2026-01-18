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
} from "lucide-react"
import { toast } from "sonner"

import { adminApi } from "@/lib/admin-api"
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

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
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
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Optional field validation
    if (formData.phone_number && !validatePhone(formData.phone_number)) {
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

      toast.success(
        `Staff account created for ${response.user.first_name} ${response.user.last_name}`,
        {
          description: `Role: ${formData.role}. They can now log in with their email and password.`,
        }
      )

      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      console.error("Failed to create staff user:", error)

      // Handle API errors
      if (error && typeof error === "object" && "message" in error) {
        const errorObj = error as Record<string, unknown>

        // Check for field-specific errors from backend
        if (errorObj.email) {
          setErrors((prev) => ({ ...prev, email: String(errorObj.email) }))
        }
        if (errorObj.password) {
          setErrors((prev) => ({ ...prev, password: String(errorObj.password) }))
        }
        if (errorObj.role) {
          setErrors((prev) => ({ ...prev, role: String(errorObj.role) }))
        }

        toast.error("Failed to create staff account", {
          description: String(errorObj.message || "Please check the form for errors"),
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
            <UserCog className="w-5 h-5 text-blue-600" />
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
              Select Role <span className="text-red-500">*</span>
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
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          isSelected ? "text-blue-600" : "text-slate-900"
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
            {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Personal Information</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  placeholder="Jane"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className={errors.first_name ? "border-red-500" : ""}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className={errors.last_name ? "border-red-500" : ""}
                />
                {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Login Credentials</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
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
                    className={req.met ? "bg-green-100 text-green-700" : ""}
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
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="+254712345678"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange("phone_number", e.target.value)}
                      className={`pl-10 ${errors.phone_number ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-sm text-red-500">{errors.phone_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input
                    id="id_number"
                    placeholder="12345678"
                    value={formData.id_number}
                    onChange={(e) => handleInputChange("id_number", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
// MAIN STAFF PAGE COMPONENT
// ==========================================

export default function StaffManagementPage() {
  const router = useRouter()
  const [staffUsers, setStaffUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch staff users
  const fetchStaffUsers = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (roleFilter !== "all") {
        params.role = roleFilter
      }
      const response = await adminApi.getStaffUsers(params)
      // Filter to only show staff roles (not customers/admin)
      const staffOnly = response.results.filter((user) =>
        ["staff", "technician", "accountant", "support"].includes(user.role || "")
      )
      setStaffUsers(staffOnly)
    } catch (error) {
      console.error("Failed to fetch staff users:", error)
      toast.error("Failed to load staff members")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStaffUsers()
  }, [roleFilter])

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return staffUsers

    const query = searchQuery.toLowerCase()
    return staffUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        user.phone_number?.includes(query)
    )
  }, [staffUsers, searchQuery])

  // Handle deactivate (preferred over delete per backend recommendation)
  const handleDeactivate = async () => {
    if (!deleteUser) return

    setIsDeleting(true)
    try {
      // Use PATCH to deactivate instead of DELETE (safer, reversible)
      await adminApi.updateStaffUser(deleteUser.id, { is_active: false })
      toast.success(`Staff member ${deleteUser.first_name} ${deleteUser.last_name} deactivated`, {
        description: "They can no longer log in. You can reactivate them later.",
      })
      setDeleteUser(null)
      fetchStaffUsers()
    } catch (error) {
      console.error("Failed to deactivate staff user:", error)
      toast.error("Failed to deactivate staff member")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle reactivate
  const handleReactivate = async (user: User) => {
    try {
      await adminApi.updateStaffUser(user.id, { is_active: true })
      toast.success(`Staff member ${user.first_name} ${user.last_name} reactivated`)
      fetchStaffUsers()
    } catch (error) {
      console.error("Failed to reactivate staff user:", error)
      toast.error("Failed to reactivate staff member")
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = staffUsers.length
    const byRole = {
      staff: staffUsers.filter((u) => u.role === "staff").length,
      technician: staffUsers.filter((u) => u.role === "technician").length,
      accountant: staffUsers.filter((u) => u.role === "accountant").length,
      support: staffUsers.filter((u) => u.role === "support").length,
    }
    const active = staffUsers.filter((u) => u.is_active).length

    return { total, byRole, active }
  }, [staffUsers])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-600">
            Manage your ISP team members and their access roles
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Staff</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        {STAFF_ROLES.map((role) => {
          const Icon = role.icon
          return (
            <Card key={role.value}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {role.label}s
                </CardDescription>
                <CardTitle className="text-2xl">
                  {stats.byRole[role.value as keyof typeof stats.byRole]}
                </CardTitle>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchStaffUsers}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">
                      {searchQuery
                        ? "No staff members match your search"
                        : "No staff members yet"}
                    </p>
                    {!searchQuery && (
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        Add your first staff member
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.first_name?.charAt(0) || ""}
                              {user.last_name?.charAt(0) || ""}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.id_number && (
                              <p className="text-xs text-slate-500">ID: {user.id_number}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${user.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {user.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                          <RoleIcon className="w-3 h-3" />
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Staff"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.phone_number ? (
                          <a
                            href={`tel:${user.phone_number}`}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            {user.phone_number}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(user.date_joined)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/staff/${user.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/staff/${user.id}/edit`)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_active ? (
                              <DropdownMenuItem
                                className="text-amber-600"
                                onClick={() => setDeleteUser(user)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleReactivate(user)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <CreateStaffDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchStaffUsers}
      />

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>
                {deleteUser?.first_name} {deleteUser?.last_name}
              </strong>
              ? They will no longer be able to log in. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeleting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
