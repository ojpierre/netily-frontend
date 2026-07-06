"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Bell,
  Zap,
  Save,
  RotateCcw,
  CreditCard,
  MessageSquare,
  Mail,
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  RefreshCw,
  TestTube,
  Smartphone,
  Globe,
  Lock,
  Wallet,
  AlertCircle,
  User,
  Camera,
  Loader2,
  WifiOff,
  Phone,
  Plus,
  XCircle,
  Palette,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import { useColorTheme } from "@/components/theme-provider"
import { HotspotPruneSettingsCard } from "@/components/settings/hotspot-prune-settings"

// Account Settings Tab Component
// -- Coming Soon placeholder --
function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{label} — Coming Soon</h3>
      <p className="text-sm text-muted-foreground max-w-xs">This section is still being built. Check back soon.</p>
    </div>
  )
}
function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()

  const modes = [
    {
      id: "light",
      label: "Light",
      desc: "Clean white interface",
      icon: Sun,
      preview: (
        <div className="w-full h-16 rounded-lg bg-white border border-slate-200 overflow-hidden flex flex-col">
          <div className="h-4 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <div className="w-6 h-1 rounded bg-slate-300" />
          </div>
          <div className="flex-1 p-1.5 flex flex-col gap-1">
            <div className="h-1.5 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-blue-100" />
          </div>
        </div>
      ),
    },
    {
      id: "dark",
      label: "Dark",
      desc: "Easy on the eyes at night",
      icon: Moon,
      preview: (
        <div className="w-full h-16 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden flex flex-col">
          <div className="h-4 bg-slate-800 border-b border-slate-700 flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <div className="w-6 h-1 rounded bg-slate-600" />
          </div>
          <div className="flex-1 p-1.5 flex flex-col gap-1">
            <div className="h-1.5 w-2/3 rounded bg-slate-700" />
            <div className="h-3 w-full rounded bg-blue-900/60" />
          </div>
        </div>
      ),
    },
    {
      id: "system",
      label: "System",
      desc: "Follows your OS setting",
      icon: Monitor,
      preview: (
        <div className="w-full h-16 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex">
          <div className="w-1/2 bg-white flex flex-col">
            <div className="h-4 bg-slate-100 border-b border-slate-200 border-r" />
            <div className="flex-1 p-1 flex flex-col gap-0.5">
              <div className="h-1 w-full rounded bg-slate-200" />
              <div className="h-2 w-full rounded bg-blue-100" />
            </div>
          </div>
          <div className="w-1/2 bg-slate-900 flex flex-col">
            <div className="h-4 bg-slate-800 border-b border-slate-700" />
            <div className="flex-1 p-1 flex flex-col gap-0.5">
              <div className="h-1 w-full rounded bg-slate-700" />
              <div className="h-2 w-full rounded bg-blue-900/60" />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const colorOptions: { value: "blue" | "green" | "pink" | "purple" | "black-white" | "pink-purple"; label: string; accent: string; ring: string; bg: string; dark: string; swatch: string }[] = [
    {
      value: "blue",
      label: "Ocean Blue",
      accent: "text-blue-600",
      ring: "ring-blue-500",
      bg: "bg-blue-50",
      dark: "dark:bg-blue-950/30",
      swatch: "bg-blue-500",
    },
    {
      value: "green",
      label: "Emerald Green",
      accent: "text-emerald-600",
      ring: "ring-emerald-500",
      bg: "bg-emerald-50",
      dark: "dark:bg-emerald-950/30",
      swatch: "bg-emerald-500",
    },
    {
      value: "pink",
      label: "Rose Pink",
      accent: "text-pink-600",
      ring: "ring-pink-500",
      bg: "bg-pink-50",
      dark: "dark:bg-pink-950/30",
      swatch: "bg-pink-500",
    },
    {
      value: "purple",
      label: "Deep Purple",
      accent: "text-purple-600",
      ring: "ring-purple-500",
      bg: "bg-purple-50",
      dark: "dark:bg-purple-950/30",
      swatch: "bg-purple-500",
    },
    {
      value: "black-white",
      label: "Black & White",
      accent: "text-slate-950 dark:text-white",
      ring: "ring-slate-950",
      bg: "bg-slate-50",
      dark: "dark:bg-slate-900",
      swatch: "bg-slate-950",
    },
    {
      value: "pink-purple",
      label: "Pink Purple",
      accent: "text-fuchsia-600",
      ring: "ring-fuchsia-500",
      bg: "bg-fuchsia-50",
      dark: "dark:bg-fuchsia-950/30",
      swatch: "bg-linear-to-br from-pink-500 to-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Dark / Light Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Interface Mode</CardTitle>
              <CardDescription>Choose between light, dark, or automatic mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {modes.map(({ id, label, desc, icon: Icon, preview }) => {
              const isActive = theme === id
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-semibold">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Active
                    </span>
                  )}
                  <div className="mb-3">{preview}</div>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                    <span className={`font-semibold text-sm ${isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                      {label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 ml-6">{desc}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Colour Palette */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base">Accent Colour</CardTitle>
              <CardDescription>Pick the brand colour used across buttons, links, and highlights</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {colorOptions.map(({ value, label, ring, bg, dark, swatch }) => {
              const isActive = colorTheme === value
              return (
                <button
                  key={value}
                  onClick={() => setColorTheme(value)}
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 ${ring} ${
                    isActive
                      ? `border-current ${bg} ${dark} shadow-md`
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle className={`w-4 h-4 ${swatch.replace("bg-", "text-")}`} />
                    </span>
                  )}
                  {/* Colour swatch */}
                  <div className={`w-12 h-12 rounded-full ${swatch} shadow-md flex items-center justify-center`}>
                    {isActive && <CheckCircle className="w-5 h-5 text-white drop-shadow" />}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? swatch.replace("bg-", "text-") : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className={`w-6 h-6 rounded-full ${colorOptions.find(c => c.value === colorTheme)?.swatch} shadow flex-shrink-0`} />
            <p className="text-sm text-muted-foreground">
              Active accent: <span className={`font-semibold capitalize ${colorOptions.find(c => c.value === colorTheme)?.accent}`}>
                {colorOptions.find(c => c.value === colorTheme)?.label}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AccountSettingsTab() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Profile form state
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  })
  
  // Company logo state
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [logoSaving, setLogoSaving] = useState(false)
  
  // Password form state
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  
  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const user = await adminApi.getCurrentUser()
        setProfile({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone_number: user.phone_number || "",
        })
        // Load tenant branding from the same endpoint used by dashboard chrome.
        try {
          const branding = await adminApi.getTenantBranding()
          if (branding) {
            setCompanyId(branding.id)
            setCompanyName(branding.name || "")
            const logoUrl = branding.logo_url || branding.logo || ""
            setCompanyLogo(logoUrl)
            if (logoUrl) localStorage.setItem("netily_company_logo", logoUrl)
            if (branding.name) localStorage.setItem("netily_company_name", branding.name)
          }
        } catch { /* non-critical */ }
      } catch (error) {
        console.error("Failed to load profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])
  
  // Save profile
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await adminApi.updateProfile(profile)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }
  
  // Change password
  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("New passwords don't match")
      return
    }
    
    if (passwords.new_password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    
    try {
      setIsSaving(true)
      await adminApi.changePassword(passwords.current_password, passwords.new_password)
      toast.success("Password changed successfully")
      setPasswords({ current_password: "", new_password: "", confirm_password: "" })
    } catch (error) {
      console.error("Failed to change password:", error)
      toast.error("Failed to change password. Check your current password.")
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profile.first_name?.charAt(0) || ""}{profile.last_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile.first_name} {profile.last_name}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Profile Form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                placeholder="+254 712 345 678"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Branding</CardTitle>
          <CardDescription>Upload your company logo — shown on invoices, the dashboard, and customer portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="w-24 h-24 rounded-xl border bg-white flex items-center justify-center overflow-hidden shrink-0">
              {(logoPreview || companyLogo) ? (
                <img
                  src={logoPreview || companyLogo}
                  alt="Company logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Camera className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label
                  htmlFor="company-logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Camera className="w-4 h-4" />
                  {companyLogo || logoPreview ? "Change Logo" : "Upload Logo"}
                </label>
                <input
                  id="company-logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Logo must be smaller than 5 MB")
                      return
                    }
                    setLogoFile(file)
                    setLogoPreview(URL.createObjectURL(file))
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, SVG or WebP. Max 5 MB.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              if (!logoFile) {
                toast.error("Please select a logo file first")
                return
              }
              setLogoSaving(true)
              try {
                const formData = new FormData()
                formData.append('logo', logoFile)
                const data = await adminApi.updateTenantBranding(formData)
                const savedLogoUrl = data.logo_url || data.logo || logoPreview
                setCompanyLogo(savedLogoUrl)
                localStorage.setItem("netily_company_logo", savedLogoUrl)
                if (data.name) {
                  setCompanyName(data.name)
                  localStorage.setItem("netily_company_name", data.name)
                }
                setLogoFile(null)
                setLogoPreview("")
                toast.success("Company logo updated successfully!")
              } catch (error: any) {
                console.error("Failed to upload logo:", error)
                toast.error(error?.message || "Failed to upload logo. Please try again.")
              } finally {
                setLogoSaving(false)
              }
            }}
            disabled={logoSaving || !logoFile}
          >
            {logoSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Logo
              </>
            )}
          </Button>
          {!logoFile && (
            <p className="ml-3 text-xs text-slate-400">Select a logo file above to enable save</p>
          )}
        </CardFooter>
      </Card>

      {/* Company Name Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Set your company name and basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
            />
            <p className="text-xs text-slate-500">This name will appear on invoices and customer communications</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              if (!companyName.trim()) {
                toast.error("Please enter a company name")
                return
              }
              setLogoSaving(true) // Reuse the loading state
              try {
                const formData = new FormData()
                formData.append("name", companyName.trim())
                const data = await adminApi.updateTenantBranding(formData)
                setCompanyId(data.id)
                setCompanyName(data.name || companyName)
                localStorage.setItem("netily_company_name", data.name || companyName.trim())
                
                toast.success("Company information saved successfully!")
              } catch (error: any) {
                console.error("Failed to save company:", error)
                toast.error(error?.message || "Failed to save company information")
              } finally {
                setLogoSaving(false)
              }
            }}
            disabled={logoSaving || !companyName.trim()}
          >
            {logoSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Company
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={passwords.current_password}
                onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          
          <p className="text-sm text-slate-500">
            Password must be at least 8 characters long and include a mix of letters and numbers.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleChangePassword} 
            disabled={isSaving || !passwords.current_password || !passwords.new_password}
            variant="outline"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <AlertTitle className="text-red-800">Delete Account</AlertTitle>
            <AlertDescription className="text-destructive">
              Once you delete your account, there is no going back. Please be certain.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" className="mt-4" disabled>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get admin token
const getAdminToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const key = `adminToken:${window.location.hostname}`
    return (
      localStorage.getItem(key) ||
      sessionStorage.getItem(key) ||
      localStorage.getItem('adminToken') ||
      sessionStorage.getItem('adminToken')
    )
  }
  return null
}

const getAdminSettingsApiBase = (): string => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
  }
  const { protocol, hostname } = window.location
  const knownDomains = ["netily.co.ke"]
  const isTenantSubdomain = knownDomains.some(
    (d) => hostname.endsWith(`.${d}`) && hostname !== `www.${d}` && hostname !== `api.${d}`
  )
  if (isTenantSubdomain) {
    return `${protocol}//${hostname}/api/v1`
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
}

export default function SettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "success" | "error" | null>>({})

  // Router Alert State
  const [routerAlertEnabled, setRouterAlertEnabled] = useState(false)
  const [routerPhoneInput, setRouterPhoneInput] = useState('')
  const [routerPhoneError, setRouterPhoneError] = useState('')
  const [routerPhoneList, setRouterPhoneList] = useState<string[]>([])
  const [routerAlertLoading, setRouterAlertLoading] = useState(false)
  const [smsGatewayConfigured, setSmsGatewayConfigured] = useState(false)

  // RADIUS Settings State
  const [radiusSettings, setRadiusSettings] = useState({
    primaryServer: "",
    primaryPort: "",
    primarySecret: "",
    secondaryServer: "",
    secondaryPort: "",
    secondarySecret: "",
    accountingPort: "",
    timeout: "",
    retries: "",
  })

  // M-Pesa Settings State
  const [mpesaSettings, setMpesaSettings] = useState({
    environment: "sandbox",
    consumerKey: "",
    consumerSecret: "",
    shortcode: "",
    passkey: "",
    callbackUrl: "",
    accountReference: "NETILY",
    transactionDesc: "Internet Subscription",
    enabled: false,
    b2cEnabled: false,
    initiatorName: "",
    initiatorPassword: "",
    securityCredential: "",
  })

  // SMS Gateway Settings State
  const [smsSettings, setSmsSettings] = useState({
    provider: "africastalking",
    // Africa's Talking
    atUsername: "",
    atApiKey: "",
    atSenderId: "",
    // Twilio
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    // Custom
    customApiUrl: "",
    customApiKey: "",
    customHeaders: "",
    enabled: false,
    testPhone: "",
  })

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    provider: "smtp",
    // SMTP
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    smtpEncryption: "tls",
    // SendGrid
    sendgridApiKey: "",
    // Mailgun
    mailgunApiKey: "",
    mailgunDomain: "",
    // Common
    fromEmail: "",
    fromName: "Netily ISP",
    replyTo: "",
    enabled: false,
  })

  // API Keys Settings State
  const [apiKeysSettings, setApiKeysSettings] = useState({
    apiKey: "sk_live_xxxxxxxxxxxxxxxxxx",
    apiSecret: "sk_secret_xxxxxxxxxxxxxx",
    webhookSecret: "whsec_xxxxxxxxxxxxxx",
    webhookUrl: "",
    rateLimitPerMinute: "60",
    ipWhitelist: "",
    enabledEndpoints: ["payments", "customers", "subscriptions"],
  })

  // Automation Settings State
  const [automationSettings, setAutomationSettings] = useState({
    autoRenew: true,
    autoExpiry: true,
    autoNotifications: true,
    autoBackup: false,
    autoReports: true,
    gracePeriod: "",
    backupFrequency: "daily",
    reportFrequency: "weekly",
  })

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: true,
    paymentNotifications: true,
    expiryNotifications: true,
    systemAlerts: true,
    marketingEmails: false,
    adminEmail: "",
    smsGateway: "africastalking",
  })
  const [securitySettings, setSecuritySettings] = useState({
    adminOtpEnabled: false,
  })
  const [supportsOtpToggleField, setSupportsOtpToggleField] = useState(false)
  const [otpToggleFieldName, setOtpToggleFieldName] = useState<string | null>(null)

  // Customer Portal Settings State
  const [portalSettings, setPortalSettings] = useState({
    hideLowerPlans: false,
  })
  const [portalSaving, setPortalSaving] = useState(false)

  const getTenantSecurityStorageKey = (): string => {
    if (typeof window === "undefined") return "tenant_security_settings_default"
    const host = window.location.hostname || "default"
    return `tenant_security_settings_${host}`
  }

  const coerceBoolean = (value: unknown): boolean | null => {
    if (typeof value === "boolean") return value
    if (typeof value === "number") return value === 1
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true
      if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false
    }
    return null
  }

  const detectOtpToggleField = (data: Record<string, any>): { field: string | null; value: boolean | null } => {
    const candidates = [
      "admin_email_otp_enabled",
      "admin_otp_enabled",
      "otp_enabled",
      "two_factor_enabled",
      "enable_admin_otp",
      "require_admin_otp",
      "login_otp_enabled",
    ]
    for (const key of candidates) {
      const maybe = coerceBoolean(data?.[key])
      if (maybe !== null) {
        return { field: key, value: maybe }
      }
    }
    return { field: null, value: null }
  }

  // Helper to toggle secret visibility
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  // Test connection helper
  const testConnection = async (service: string) => {
    setTestingConnection(service)
    setConnectionStatus((prev) => ({ ...prev, [service]: null }))
    
    // TODO: Replace with real connection test API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Connection testing not yet implemented — show as pending
    setConnectionStatus((prev) => ({ ...prev, [service]: "error" }))
    setTestingConnection(null)
  }

  // Load settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = getAdminToken()
        if (!token) {
          // No token - use demo data instead of showing error
          console.log("No token found, using default settings")
          setIsLoading(false)
          return
        }

        const apiBase = getAdminSettingsApiBase()
        
        // Check if SMS gateway is configured
        try {
          const gwRes = await fetch(`${apiBase}/messaging/gateway/`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
          if (gwRes.ok) {
            const gwData = await gwRes.json()
            const gateways = Array.isArray(gwData) ? gwData : (gwData.results ?? [])
            setSmsGatewayConfigured(gateways.some((g: any) => g.is_active))
          }
        } catch { /* non-critical */ }

        // Load router alert settings from notification settings endpoint
        try {
          const nsRes = await fetch(`${apiBase}/messaging/notification-settings/`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
          if (nsRes.ok) {
            const ns = await nsRes.json()
            setRouterAlertEnabled(!!ns.system_router_offline)
            const phones = Array.isArray(ns.router_offline_numbers) && ns.router_offline_numbers.length > 0
              ? ns.router_offline_numbers
              : ns.system_alert_phone
                ? ns.system_alert_phone.split(',').map((s: string) => s.trim()).filter(Boolean)
                : []
            setRouterPhoneList(phones)
          }
        } catch { /* non-critical */ }

        const res = await fetch(`${apiBase}/core/settings/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          // API might not have settings endpoint yet - just use defaults
          console.log("Settings endpoint not available, using defaults")
          setIsLoading(false)
          return
        }

        const data = await res.json()

        setRadiusSettings({
          primaryServer: data.primary_server || "",
          primaryPort: data.primary_port || "",
          primarySecret: data.primary_secret || "",
          secondaryServer: data.secondary_server || "",
          secondaryPort: data.secondary_port || "",
          secondarySecret: data.secondary_secret || "",
          accountingPort: data.accounting_port || "",
          timeout: data.timeout?.toString() || "5",
          retries: data.retries?.toString() || "3",
        })

        setAutomationSettings({
          autoRenew: data.auto_renew ?? true,
          autoExpiry: data.auto_expiry ?? true,
          autoNotifications: data.auto_notifications ?? true,
          autoBackup: data.auto_backup ?? false,
          autoReports: data.auto_reports ?? true,
          gracePeriod: data.grace_period?.toString() || "3",
          backupFrequency: data.backup_frequency || "daily",
          reportFrequency: data.report_frequency || "weekly",
        })

        setNotificationSettings({
          emailEnabled: data.email_enabled ?? true,
          smsEnabled: data.sms_enabled ?? true,
          paymentNotifications: data.payment_notifications ?? true,
          expiryNotifications: data.expiry_notifications ?? true,
          systemAlerts: data.system_alerts ?? true,
          marketingEmails: data.marketing_emails ?? false,
          adminEmail: data.admin_email || "",
          smsGateway: data.sms_gateway || "africastalking",
        })

        const detectedOtp = detectOtpToggleField(data)
        const hasServerOtpField = !!detectedOtp.field
        setSupportsOtpToggleField(hasServerOtpField)
        setOtpToggleFieldName(detectedOtp.field)

        const localRaw = localStorage.getItem(getTenantSecurityStorageKey())
        const localOtpEnabled = localRaw ? !!JSON.parse(localRaw)?.adminOtpEnabled : null
        setSecuritySettings({
          adminOtpEnabled: hasServerOtpField
            ? !!detectedOtp.value
            : (localOtpEnabled ?? false),
        })

        // Load portal settings
        setPortalSettings({
          hideLowerPlans: !!data.hide_lower_plans_in_customer_portal,
        })
      } catch (err: any) {
        console.error("Failed to load settings:", err)
        setError(err.message || "Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = getAdminToken()
      if (!token) {
        setError("No access token — please log in again")
        return
      }

      const payload = {
        // RADIUS
        primary_server: radiusSettings.primaryServer,
        primary_port: radiusSettings.primaryPort,
        primary_secret: radiusSettings.primarySecret,
        secondary_server: radiusSettings.secondaryServer || "",
        secondary_port: radiusSettings.secondaryPort || "",
        secondary_secret: radiusSettings.secondarySecret || "",
        accounting_port: radiusSettings.accountingPort,
        timeout: parseInt(radiusSettings.timeout) || 5,
        retries: parseInt(radiusSettings.retries) || 3,

        // Automation
        auto_renew: automationSettings.autoRenew,
        auto_expiry: automationSettings.autoExpiry,
        auto_notifications: automationSettings.autoNotifications,
        auto_backup: automationSettings.autoBackup,
        auto_reports: automationSettings.autoReports,
        grace_period: parseInt(automationSettings.gracePeriod) || 3,
        backup_frequency: automationSettings.backupFrequency,
        report_frequency: automationSettings.reportFrequency,

        // Notifications
        email_enabled: notificationSettings.emailEnabled,
        sms_enabled: notificationSettings.smsEnabled,
        payment_notifications: notificationSettings.paymentNotifications,
        expiry_notifications: notificationSettings.expiryNotifications,
        system_alerts: notificationSettings.systemAlerts,
        marketing_emails: notificationSettings.marketingEmails,
        admin_email: notificationSettings.adminEmail,
        sms_gateway: notificationSettings.smsGateway,
      }

      if (supportsOtpToggleField && otpToggleFieldName) {
        ;(payload as any)[otpToggleFieldName] = securitySettings.adminOtpEnabled
      }

      const apiBase = getAdminSettingsApiBase()
      const res = await fetch(`${apiBase}/core/settings/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to save")
      }

      localStorage.setItem(getTenantSecurityStorageKey(), JSON.stringify({
        adminOtpEnabled: securitySettings.adminOtpEnabled,
      }))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Save failed")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm("Reset all settings to current database values?")) {
      window.location.reload()
    }
  }

  // Router Alert Handlers
  const handleAddRouterNumber = async () => {
    if (!smsGatewayConfigured) {
      toast.error('Configure an SMS gateway first (SMS → Gateway tab) before adding alert recipients.')
      return
    }
    const num = routerPhoneInput.trim()
    if (!num) return
    const isValid = /^(?:0[17]\d{8}|\+2547\d{8}|\+\d{9,15})$/.test(num)
    if (!isValid) { setRouterPhoneError('Invalid format. Use 07XXXXXXXX or +2547XXXXXXXX'); return }
    if (routerPhoneList.includes(num)) { setRouterPhoneError('Number already in list'); return }
    setRouterPhoneError('')
    const updated = [...routerPhoneList, num]
    setRouterPhoneList(updated)
    setRouterPhoneInput('')
    await saveRouterAlertSettings(routerAlertEnabled, updated)
  }

  const handleRemoveRouterNumber = async (num: string) => {
    const updated = routerPhoneList.filter(n => n !== num)
    setRouterPhoneList(updated)
    await saveRouterAlertSettings(routerAlertEnabled, updated)
  }

  const handleToggleRouterAlert = async (val: boolean) => {
    if (val && !smsGatewayConfigured) {
      toast.error('Configure an SMS gateway first (SMS → Gateway tab) before enabling router alerts.')
      return
    }
    setRouterAlertEnabled(val)
    await saveRouterAlertSettings(val, routerPhoneList)
  }

  const saveRouterAlertSettings = async (enabled: boolean, phones: string[]) => {
    setRouterAlertLoading(true)
    try {
      const token = getAdminToken()
      const apiBase = getAdminSettingsApiBase()
      await fetch(`${apiBase}/messaging/notification-settings/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_router_offline: enabled, router_offline_numbers: phones })
      })
      toast.success('Router alert settings saved')
    } catch { toast.error('Failed to save router alert settings') }
    finally { setRouterAlertLoading(false) }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-slate-500 mt-1">Configure system preferences and integrations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings} disabled={isLoading}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {saveSuccess && (
        <Alert className="bg-success/10 text-green-900 border-success/20">
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-destructive/10 text-red-900 border-destructive/20">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-full md:w-auto">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="system-notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <AccountSettingsTab />
        </TabsContent>

        {/* Security Tab - Admin Login Security ONLY */}
        <TabsContent value="security" className="space-y-6">
          {/* Admin Login Security Card */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Login Security</CardTitle>
              <CardDescription>
                Tenant-specific 2FA policy for admin sign-ins. OTP is disabled by default and can be enabled anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-medium text-foreground">Email OTP for Admin Login</p>
                  <p className="text-sm text-slate-500 mt-1">
                    When enabled, admins must enter a one-time code after password login.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Applies when its enabled.
                  </p>
                </div>
                <Switch
                  checked={securitySettings.adminOtpEnabled}
                  onCheckedChange={(checked) =>
                    setSecuritySettings((prev) => ({ ...prev, adminOtpEnabled: checked }))
                  }
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Default policy</AlertTitle>
                <AlertDescription>
                  New and existing tenants start with OTP disabled until an admin enables it here.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                onClick={async () => {
                  const token = getAdminToken()
                  if (!token) { toast.error("Not authenticated"); return }
                  const apiBase = getAdminSettingsApiBase()
                  try {
                    const res = await fetch(`${apiBase}/core/settings/`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        admin_email_otp_enabled: securitySettings.adminOtpEnabled,
                      }),
                    })
                    if (!res.ok) throw new Error("Save failed")
                    toast.success(
                      securitySettings.adminOtpEnabled
                        ? "OTP login enabled. Admins will need to verify via email."
                        : "OTP login disabled. Admins can log in with password only."
                    )
                  } catch (e: any) {
                    toast.error(e.message || "Failed to save security settings")
                  }
                }}
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* System Tab - Customer Portal Plans + Hotspot Prune Settings */}
        <TabsContent value="system" className="space-y-6">
          {/* Customer Portal Plans Card */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Portal Plans</CardTitle>
              <CardDescription>
                Control which plans customers see when they log in and view available plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-medium text-foreground">
                    Hide lower-priced plans
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    When enabled, customers only see their current plan and plans priced
                    the same or higher — no downgrade options shown.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Off by default.
                  </p>
                </div>
                <Switch
                  checked={portalSettings.hideLowerPlans}
                  onCheckedChange={(checked) =>
                    setPortalSettings((prev) => ({ ...prev, hideLowerPlans: checked }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={async () => {
                  const token = getAdminToken()
                  if (!token) { toast.error("Not authenticated"); return }
                  setPortalSaving(true)
                  const apiBase = getAdminSettingsApiBase()
                  try {
                    const res = await fetch(`${apiBase}/core/settings/`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        hide_lower_plans_in_customer_portal: portalSettings.hideLowerPlans,
                      }),
                    })
                    if (!res.ok) throw new Error("Save failed")
                    toast.success(
                      portalSettings.hideLowerPlans
                        ? "Customers will now only see their plan and higher-tier plans."
                        : "Customers will now see all available plans again."
                    )
                  } catch (e: any) {
                    toast.error(e.message || "Failed to save portal settings")
                  } finally {
                    setPortalSaving(false)
                  }
                }}
                disabled={portalSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Portal Settings
              </Button>
            </CardFooter>
          </Card>

          {/* Hotspot Prune Settings Card */}
          <HotspotPruneSettingsCard />
        </TabsContent>

        {/* System Notifications Tab */}
        <TabsContent value="system-notifications" className="space-y-6">
          {!smsGatewayConfigured && (
            <Alert className="border-warning/20 bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-amber-800">SMS Gateway Required</AlertTitle>
              <AlertDescription className="text-warning">
                You must configure an SMS gateway (your own provider or Netily Inbuilt) in the{' '}
                <a href="/admin/sms" className="underline font-medium">SMS → Gateway tab</a>{' '}
                before enabling system notifications.
              </AlertDescription>
            </Alert>
          )}

          <Card className={!smsGatewayConfigured ? 'opacity-60 pointer-events-none' : ''}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                  <WifiOff className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">MikroTik Router Offline/Online Alerts</CardTitle>
                  <CardDescription>Instant SMS when any router transitions Online ↔ Offline</CardDescription>
                </div>
                <Switch
                  checked={routerAlertEnabled}
                  onCheckedChange={handleToggleRouterAlert}
                  disabled={routerAlertLoading || !smsGatewayConfigured}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className={`flex items-center gap-3 rounded-xl p-3 text-sm ${
                routerAlertEnabled ? 'bg-warning/10 border border-warning/20 text-orange-800' : 'bg-slate-50 border border-slate-100 text-slate-500'
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${routerAlertEnabled ? 'bg-warning animate-pulse' : 'bg-slate-300'}`} />
                {routerAlertEnabled
                  ? `Active — ${routerPhoneList.length} recipient(s) configured`
                  : 'Disabled — toggle on to configure recipients'}
              </div>

              {routerAlertEnabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Alert Recipients</Label>
                    <p className="text-xs text-slate-500">Accepts Kenyan (07XXXXXXXX) or international (+2547XXXXXXXX) formats.</p>
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1 relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          className={`pl-8 h-9 text-sm ${routerPhoneError ? 'border-red-400' : ''}`}
                          placeholder="0712 345 678"
                          value={routerPhoneInput}
                          onChange={e => { setRouterPhoneInput(e.target.value); setRouterPhoneError('') }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRouterNumber() } }}
                        />
                      </div>
                      <Button size="sm" className="h-9 bg-warning hover:bg-orange-600 text-white" onClick={handleAddRouterNumber} disabled={routerAlertLoading}>
                        <Plus className="w-3.5 h-3.5 mr-1" />Add
                      </Button>
                    </div>
                    {routerPhoneError && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />{routerPhoneError}
                      </p>
                    )}
                  </div>

                  {routerPhoneList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-100 bg-warning/10/50 py-8 text-center">
                      <Phone className="w-8 h-8 text-orange-200" />
                      <p className="text-sm font-medium text-warning">No recipients yet</p>
                      <p className="text-xs text-warning">Add a number above to start receiving alerts</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {routerPhoneList.map((num, i) => (
                        <div key={num} className="group flex items-center gap-2 bg-white border border-warning/20 rounded-full px-3 py-1.5 shadow-sm hover:border-orange-400 transition-all">
                          <div className="w-5 h-5 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-warning">{i + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-700 tabular-nums">{num}</span>
                          <button onClick={() => handleRemoveRouterNumber(num)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-300 hover:text-destructive">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RADIUS Settings — TODO: coming soon */}
        <TabsContent value="radius" className="space-y-6">
          <ComingSoonTab label="RADIUS" />
        </TabsContent>

        {/* M-Pesa Settings — TODO: coming soon */}
        <TabsContent value="mpesa" className="space-y-6">
          <ComingSoonTab label="M-Pesa" />
        </TabsContent>

        {/* SMS Gateway Settings — TODO: coming soon */}
        <TabsContent value="sms" className="space-y-6">
          <ComingSoonTab label="SMS" />
        </TabsContent>

        {/* Email Settings — TODO: coming soon */}
        <TabsContent value="email" className="space-y-6">
          <ComingSoonTab label="Email" />
        </TabsContent>

        {/* API Keys Settings — TODO: coming soon */}
        <TabsContent value="api" className="space-y-6">
          <ComingSoonTab label="API" />
        </TabsContent>

        {/* Automation Settings — TODO: coming soon */}
        <TabsContent value="automation" className="space-y-6">
          <ComingSoonTab label="Automation" />
        </TabsContent>

        {/* Notification Settings — TODO: coming soon */}
        <TabsContent value="notifications" className="space-y-6">
          <ComingSoonTab label="Notifications" />
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <AppearanceTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}