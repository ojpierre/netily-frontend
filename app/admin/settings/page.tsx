"use client"

import React, { useState, useEffect } from "react"
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

// Account Settings Tab Component
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
        // Load company logo if user has a company
        const cId = (user as any).company_id || (user as any).company?.id
        if (cId) {
          setCompanyId(cId)
          try {
            const company = await adminApi.getCompany(cId)
            setCompanyLogo(company.logo || "")
          } catch { /* non-critical */ }
        }
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
                    if (file.size > 2 * 1024 * 1024) {
                      toast.error("Logo must be smaller than 2 MB")
                      return
                    }
                    setLogoFile(file)
                    setLogoPreview(URL.createObjectURL(file))
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, SVG or WebP. Max 2 MB.</p>
            </div>
          </div>
        </CardContent>
        {logoFile && (
          <CardFooter>
            <Button
              onClick={async () => {
                if (!companyId || !logoFile) return
                setLogoSaving(true)
                try {
                  const formData = new FormData()
                  formData.append('logo', logoFile)
                  await fetch(`/api/core/companies/${companyId}/`, {
                    method: 'PATCH',
                    headers: {
                      'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
                    },
                    body: formData,
                  }).then(async (res) => {
                    if (!res.ok) throw new Error('Upload failed')
                    const data = await res.json()
                    setCompanyLogo(data.logo || logoPreview)
                    setLogoFile(null)
                    setLogoPreview("")
                    toast.success("Company logo updated")
                  })
                } catch (error) {
                  console.error("Failed to upload logo:", error)
                  toast.error("Failed to upload logo")
                } finally {
                  setLogoSaving(false)
                }
              }}
              disabled={logoSaving}
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
          </CardFooter>
        )}
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
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertTitle className="text-red-800">Delete Account</AlertTitle>
            <AlertDescription className="text-red-700">
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

export default function SettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "success" | "error" | null>>({})

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

  // Helper function to get admin token
  const getAdminToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
    }
    return null
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

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'
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

    // Optional: decode token to check is_staff
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!payload.is_staff) {
        setError("You must be an admin to save settings")
        return
      }
    } catch (e) {
      console.log("Token decode failed, continuing...")
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

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'
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
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
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
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 text-red-900 border-red-200">
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
            <TabsTrigger value="radius" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">RADIUS</span>
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">M-Pesa</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">SMS</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <AccountSettingsTab />
        </TabsContent>

        {/* RADIUS Settings */}
        <TabsContent value="radius" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary RADIUS Server</CardTitle>
              <CardDescription>Configure the main authentication server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryServer">Server IP Address</Label>
                  <Input
                    id="primaryServer"
                    placeholder="192.168.1.10"
                    value={radiusSettings.primaryServer}
                    onChange={(e) =>
                      setRadiusSettings({ ...radiusSettings, primaryServer: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryPort">Port</Label>
                  <Input
                    id="primaryPort"
                    placeholder="1812"
                    value={radiusSettings.primaryPort}
                    onChange={(e) =>
                      setRadiusSettings({ ...radiusSettings, primaryPort: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primarySecret">Shared Secret</Label>
                <Input
                  id="primarySecret"
                  type="password"
                  placeholder="Enter shared secret"
                  value={radiusSettings.primarySecret}
                  onChange={(e) =>
                    setRadiusSettings({ ...radiusSettings, primarySecret: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary RADIUS Server (Backup)</CardTitle>
              <CardDescription>Fallback server for high availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="secondaryServer">Server IP Address</Label>
                  <Input
                    id="secondaryServer"
                    placeholder="192.168.1.11"
                    value={radiusSettings.secondaryServer}
                    onChange={(e) =>
                      setRadiusSettings({ ...radiusSettings, secondaryServer: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryPort">Port</Label>
                  <Input
                    id="secondaryPort"
                    placeholder="1812"
                    value={radiusSettings.secondaryPort}
                    onChange={(e) =>
                      setRadiusSettings({ ...radiusSettings, secondaryPort: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondarySecret">Shared Secret</Label>
                <Input
                  id="secondarySecret"
                  type="password"
                  placeholder="Enter shared secret"
                  value={radiusSettings.secondarySecret}
                  onChange={(e) =>
                    setRadiusSettings({ ...radiusSettings, secondarySecret: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accounting & Connection Settings</CardTitle>
              <CardDescription>Configure accounting and connection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountingPort">Accounting Port</Label>
                  <Input
                    id="accountingPort"
                    placeholder="1813"
                    value={radiusSettings.accountingPort}
                    onChange={(e) =>
                      setRadiusSettings({ ...radiusSettings, accountingPort: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    placeholder="5"
                    value={radiusSettings.timeout}
                    onChange={(e) =>
                      setRadiusSettings({ ...radiusSettings, timeout: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retries">Retries</Label>
                  <Input
                    id="retries"
                    type="number"
                    placeholder="3"
                    value={radiusSettings.retries}
                    onChange={(e) =>
                      setRadiusSettings({ ...radiusSettings, retries: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* M-Pesa Settings */}
        <TabsContent value="mpesa" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    M-Pesa Daraja API
                  </CardTitle>
                  <CardDescription>
                    Configure M-Pesa payment integration via Safaricom Daraja API
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={mpesaSettings.enabled ? "default" : "secondary"}>
                    {mpesaSettings.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={mpesaSettings.enabled}
                    onCheckedChange={(checked) =>
                      setMpesaSettings({ ...mpesaSettings, enabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={mpesaSettings.environment}
                  onValueChange={(value) =>
                    setMpesaSettings({ ...mpesaSettings, environment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    <SelectItem value="production">Production (Live)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa-consumer-key">Consumer Key</Label>
                  <div className="relative">
                    <Input
                      id="mpesa-consumer-key"
                      type={showSecrets["mpesa-consumer-key"] ? "text" : "password"}
                      placeholder="Enter consumer key"
                      value={mpesaSettings.consumerKey}
                      onChange={(e) =>
                        setMpesaSettings({ ...mpesaSettings, consumerKey: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleSecretVisibility("mpesa-consumer-key")}
                    >
                      {showSecrets["mpesa-consumer-key"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpesa-consumer-secret">Consumer Secret</Label>
                  <div className="relative">
                    <Input
                      id="mpesa-consumer-secret"
                      type={showSecrets["mpesa-consumer-secret"] ? "text" : "password"}
                      placeholder="Enter consumer secret"
                      value={mpesaSettings.consumerSecret}
                      onChange={(e) =>
                        setMpesaSettings({ ...mpesaSettings, consumerSecret: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleSecretVisibility("mpesa-consumer-secret")}
                    >
                      {showSecrets["mpesa-consumer-secret"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa-shortcode">Business Shortcode</Label>
                  <Input
                    id="mpesa-shortcode"
                    placeholder="174379"
                    value={mpesaSettings.shortcode}
                    onChange={(e) =>
                      setMpesaSettings({ ...mpesaSettings, shortcode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpesa-passkey">Lipa Na M-Pesa Passkey</Label>
                  <div className="relative">
                    <Input
                      id="mpesa-passkey"
                      type={showSecrets["mpesa-passkey"] ? "text" : "password"}
                      placeholder="Enter passkey"
                      value={mpesaSettings.passkey}
                      onChange={(e) =>
                        setMpesaSettings({ ...mpesaSettings, passkey: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleSecretVisibility("mpesa-passkey")}
                    >
                      {showSecrets["mpesa-passkey"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mpesa-callback">Callback URL</Label>
                <Input
                  id="mpesa-callback"
                  placeholder="https://your-domain.com/api/mpesa/callback"
                  value={mpesaSettings.callbackUrl}
                  onChange={(e) =>
                    setMpesaSettings({ ...mpesaSettings, callbackUrl: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  This URL will receive payment confirmation callbacks from M-Pesa
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa-account-ref">Account Reference</Label>
                  <Input
                    id="mpesa-account-ref"
                    placeholder="NETILY"
                    value={mpesaSettings.accountReference}
                    onChange={(e) =>
                      setMpesaSettings({ ...mpesaSettings, accountReference: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpesa-trans-desc">Transaction Description</Label>
                  <Input
                    id="mpesa-trans-desc"
                    placeholder="Internet Subscription"
                    value={mpesaSettings.transactionDesc}
                    onChange={(e) =>
                      setMpesaSettings({ ...mpesaSettings, transactionDesc: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => testConnection("mpesa")}
                disabled={testingConnection === "mpesa"}
              >
                {testingConnection === "mpesa" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </Button>
              {connectionStatus["mpesa"] && (
                <Badge variant={connectionStatus["mpesa"] === "success" ? "default" : "destructive"}>
                  {connectionStatus["mpesa"] === "success" ? "Connected" : "Connection Failed"}
                </Badge>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>B2C Disbursement</CardTitle>
                  <CardDescription>
                    Configure Business to Customer payments for refunds
                  </CardDescription>
                </div>
                <Switch
                  checked={mpesaSettings.b2cEnabled}
                  onCheckedChange={(checked) =>
                    setMpesaSettings({ ...mpesaSettings, b2cEnabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {mpesaSettings.b2cEnabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2c-initiator">Initiator Name</Label>
                    <Input
                      id="b2c-initiator"
                      placeholder="apitest"
                      value={mpesaSettings.initiatorName}
                      onChange={(e) =>
                        setMpesaSettings({ ...mpesaSettings, initiatorName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b2c-password">Initiator Password</Label>
                    <div className="relative">
                      <Input
                        id="b2c-password"
                        type={showSecrets["b2c-password"] ? "text" : "password"}
                        placeholder="Enter password"
                        value={mpesaSettings.initiatorPassword}
                        onChange={(e) =>
                          setMpesaSettings({ ...mpesaSettings, initiatorPassword: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecretVisibility("b2c-password")}
                      >
                        {showSecrets["b2c-password"] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b2c-security">Security Credential</Label>
                  <Textarea
                    id="b2c-security"
                    placeholder="Encrypted security credential..."
                    rows={3}
                    value={mpesaSettings.securityCredential}
                    onChange={(e) =>
                      setMpesaSettings({ ...mpesaSettings, securityCredential: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* SMS Gateway Settings */}
        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    SMS Gateway Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure SMS provider for customer notifications
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={smsSettings.enabled ? "default" : "secondary"}>
                    {smsSettings.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={smsSettings.enabled}
                    onCheckedChange={(checked) =>
                      setSmsSettings({ ...smsSettings, enabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>SMS Provider</Label>
                <Select
                  value={smsSettings.provider}
                  onValueChange={(value) =>
                    setSmsSettings({ ...smsSettings, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="africastalking">Africa's Talking</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Africa's Talking Settings */}
              {smsSettings.provider === "africastalking" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Africa's Talking Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="at-username">Username</Label>
                      <Input
                        id="at-username"
                        placeholder="sandbox or your username"
                        value={smsSettings.atUsername}
                        onChange={(e) =>
                          setSmsSettings({ ...smsSettings, atUsername: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="at-api-key">API Key</Label>
                      <div className="relative">
                        <Input
                          id="at-api-key"
                          type={showSecrets["at-api-key"] ? "text" : "password"}
                          placeholder="Enter API key"
                          value={smsSettings.atApiKey}
                          onChange={(e) =>
                            setSmsSettings({ ...smsSettings, atApiKey: e.target.value })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility("at-api-key")}
                        >
                          {showSecrets["at-api-key"] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="at-sender-id">Sender ID (Alphanumeric)</Label>
                    <Input
                      id="at-sender-id"
                      placeholder="NETILY"
                      value={smsSettings.atSenderId}
                      onChange={(e) =>
                        setSmsSettings({ ...smsSettings, atSenderId: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use default shortcode
                    </p>
                  </div>
                </div>
              )}

              {/* Twilio Settings */}
              {smsSettings.provider === "twilio" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Twilio Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twilio-sid">Account SID</Label>
                      <Input
                        id="twilio-sid"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={smsSettings.twilioAccountSid}
                        onChange={(e) =>
                          setSmsSettings({ ...smsSettings, twilioAccountSid: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-token">Auth Token</Label>
                      <div className="relative">
                        <Input
                          id="twilio-token"
                          type={showSecrets["twilio-token"] ? "text" : "password"}
                          placeholder="Enter auth token"
                          value={smsSettings.twilioAuthToken}
                          onChange={(e) =>
                            setSmsSettings({ ...smsSettings, twilioAuthToken: e.target.value })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility("twilio-token")}
                        >
                          {showSecrets["twilio-token"] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilio-phone">Phone Number</Label>
                    <Input
                      id="twilio-phone"
                      placeholder="+1234567890"
                      value={smsSettings.twilioPhoneNumber}
                      onChange={(e) =>
                        setSmsSettings({ ...smsSettings, twilioPhoneNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Custom API Settings */}
              {smsSettings.provider === "custom" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Custom API Configuration
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="custom-url">API Endpoint URL</Label>
                    <Input
                      id="custom-url"
                      placeholder="https://api.sms-provider.com/send"
                      value={smsSettings.customApiUrl}
                      onChange={(e) =>
                        setSmsSettings({ ...smsSettings, customApiUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-api-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="custom-api-key"
                        type={showSecrets["custom-api-key"] ? "text" : "password"}
                        placeholder="Enter API key"
                        value={smsSettings.customApiKey}
                        onChange={(e) =>
                          setSmsSettings({ ...smsSettings, customApiKey: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecretVisibility("custom-api-key")}
                      >
                        {showSecrets["custom-api-key"] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-headers">Custom Headers (JSON)</Label>
                    <Textarea
                      id="custom-headers"
                      placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
                      rows={3}
                      value={smsSettings.customHeaders}
                      onChange={(e) =>
                        setSmsSettings({ ...smsSettings, customHeaders: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="+254712345678"
                  className="w-40"
                  value={smsSettings.testPhone}
                  onChange={(e) =>
                    setSmsSettings({ ...smsSettings, testPhone: e.target.value })
                  }
                />
                <Button
                  variant="outline"
                  onClick={() => testConnection("sms")}
                  disabled={testingConnection === "sms"}
                >
                  {testingConnection === "sms" ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Send Test SMS
                </Button>
              </div>
              {connectionStatus["sms"] && (
                <Badge variant={connectionStatus["sms"] === "success" ? "default" : "destructive"}>
                  {connectionStatus["sms"] === "success" ? "SMS Sent" : "Send Failed"}
                </Badge>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-purple-600" />
                    Email Server Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure email delivery for notifications and reports
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={emailSettings.enabled ? "default" : "secondary"}>
                    {emailSettings.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={emailSettings.enabled}
                    onCheckedChange={(checked) =>
                      setEmailSettings({ ...emailSettings, enabled: checked })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select
                  value={emailSettings.provider}
                  onValueChange={(value) =>
                    setEmailSettings({ ...emailSettings, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Server</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* SMTP Settings */}
              {emailSettings.provider === "smtp" && (
                <div className="space-y-4">
                  <h4 className="font-medium">SMTP Configuration</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        placeholder="smtp.gmail.com"
                        value={emailSettings.smtpHost}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        placeholder="587"
                        value={emailSettings.smtpPort}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">Username</Label>
                      <Input
                        id="smtp-username"
                        placeholder="your-email@gmail.com"
                        value={emailSettings.smtpUsername}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="smtp-password"
                          type={showSecrets["smtp-password"] ? "text" : "password"}
                          placeholder="Enter password"
                          value={emailSettings.smtpPassword}
                          onChange={(e) =>
                            setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility("smtp-password")}
                        >
                          {showSecrets["smtp-password"] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Encryption</Label>
                    <Select
                      value={emailSettings.smtpEncryption}
                      onValueChange={(value) =>
                        setEmailSettings({ ...emailSettings, smtpEncryption: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* SendGrid Settings */}
              {emailSettings.provider === "sendgrid" && (
                <div className="space-y-4">
                  <h4 className="font-medium">SendGrid Configuration</h4>
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="sendgrid-key"
                        type={showSecrets["sendgrid-key"] ? "text" : "password"}
                        placeholder="SG.xxxxxxxxxxxxxxxxxxxxxx"
                        value={emailSettings.sendgridApiKey}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, sendgridApiKey: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecretVisibility("sendgrid-key")}
                      >
                        {showSecrets["sendgrid-key"] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mailgun Settings */}
              {emailSettings.provider === "mailgun" && (
                <div className="space-y-4">
                  <h4 className="font-medium">Mailgun Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mailgun-key">API Key</Label>
                      <div className="relative">
                        <Input
                          id="mailgun-key"
                          type={showSecrets["mailgun-key"] ? "text" : "password"}
                          placeholder="key-xxxxxxxxxxxxxxxxxxxxxx"
                          value={emailSettings.mailgunApiKey}
                          onChange={(e) =>
                            setEmailSettings({ ...emailSettings, mailgunApiKey: e.target.value })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility("mailgun-key")}
                        >
                          {showSecrets["mailgun-key"] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mailgun-domain">Domain</Label>
                      <Input
                        id="mailgun-domain"
                        placeholder="mg.your-domain.com"
                        value={emailSettings.mailgunDomain}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, mailgunDomain: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Common Email Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Sender Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      placeholder="no-reply@netily.com"
                      value={emailSettings.fromEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      placeholder="Netily ISP"
                      value={emailSettings.fromName}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reply-to">Reply-To Email</Label>
                  <Input
                    id="reply-to"
                    placeholder="support@netily.com"
                    value={emailSettings.replyTo}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, replyTo: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => testConnection("email")}
                disabled={testingConnection === "email"}
              >
                {testingConnection === "email" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Send Test Email
              </Button>
              {connectionStatus["email"] && (
                <Badge variant={connectionStatus["email"] === "success" ? "default" : "destructive"}>
                  {connectionStatus["email"] === "success" ? "Email Sent" : "Send Failed"}
                </Badge>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* API Keys Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-orange-600" />
                API Keys Management
              </CardTitle>
              <CardDescription>
                Manage API access credentials for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  API keys provide full access to your account. Keep them secure and never share them publicly.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key (Public)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showSecrets["api-key"] ? "text" : "password"}
                        value={apiKeysSettings.apiKey}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecretVisibility("api-key")}
                      >
                        {showSecrets["api-key"] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(apiKeysSettings.apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>API Secret (Private)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showSecrets["api-secret"] ? "text" : "password"}
                        value={apiKeysSettings.apiSecret}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecretVisibility("api-secret")}
                      >
                        {showSecrets["api-secret"] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(apiKeysSettings.apiSecret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate API Keys
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Webhook Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-domain.com/api/webhooks"
                    value={apiKeysSettings.webhookUrl}
                    onChange={(e) =>
                      setApiKeysSettings({ ...apiKeysSettings, webhookUrl: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showSecrets["webhook-secret"] ? "text" : "password"}
                        value={apiKeysSettings.webhookSecret}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleSecretVisibility("webhook-secret")}
                      >
                        {showSecrets["webhook-secret"] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(apiKeysSettings.webhookSecret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this secret to verify webhook signatures
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Rate Limiting & Security</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Rate Limit (requests/minute)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      value={apiKeysSettings.rateLimitPerMinute}
                      onChange={(e) =>
                        setApiKeysSettings({ ...apiKeysSettings, rateLimitPerMinute: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                    <Input
                      id="ip-whitelist"
                      placeholder="192.168.1.1, 10.0.0.1"
                      value={apiKeysSettings.ipWhitelist}
                      onChange={(e) =>
                        setApiKeysSettings({ ...apiKeysSettings, ipWhitelist: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Enabled Endpoints</h4>
                <div className="grid grid-cols-2 gap-3">
                  {["payments", "customers", "subscriptions", "invoices", "usage", "tickets"].map(
                    (endpoint) => (
                      <div key={endpoint} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{endpoint}</span>
                        </div>
                        <Switch
                          checked={apiKeysSettings.enabledEndpoints.includes(endpoint)}
                          onCheckedChange={(checked) => {
                            const newEndpoints = checked
                              ? [...apiKeysSettings.enabledEndpoints, endpoint]
                              : apiKeysSettings.enabledEndpoints.filter((e) => e !== endpoint)
                            setApiKeysSettings({ ...apiKeysSettings, enabledEndpoints: newEndpoints })
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Automation</CardTitle>
              <CardDescription>
                Automate subscription and billing workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoRenew">Auto-Renewal</Label>
                  <p className="text-sm text-slate-500">
                    Automatically renew expired subscriptions when payment is received
                  </p>
                </div>
                <Switch
                  id="autoRenew"
                  checked={automationSettings.autoRenew}
                  onCheckedChange={(checked) =>
                    setAutomationSettings({ ...automationSettings, autoRenew: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoExpiry">Auto-Expiry</Label>
                  <p className="text-sm text-slate-500">
                    Automatically deactivate accounts when subscription expires
                  </p>
                </div>
                <Switch
                  id="autoExpiry"
                  checked={automationSettings.autoExpiry}
                  onCheckedChange={(checked) =>
                    setAutomationSettings({ ...automationSettings, autoExpiry: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                <Input
                  id="gracePeriod"
                  type="number"
                  placeholder="3"
                  value={automationSettings.gracePeriod}
                  onChange={(e) =>
                    setAutomationSettings({ ...automationSettings, gracePeriod: e.target.value })
                  }
                />
                <p className="text-sm text-slate-500">
                  Days before auto-deactivation after expiry
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications & Alerts</CardTitle>
              <CardDescription>
                Automate user notifications and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoNotifications">Automated Notifications</Label>
                  <p className="text-sm text-slate-500">
                    Send automatic emails and SMS for events
                  </p>
                </div>
                <Switch
                  id="autoNotifications"
                  checked={automationSettings.autoNotifications}
                  onCheckedChange={(checked) =>
                    setAutomationSettings({ ...automationSettings, autoNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>
                Configure automated backups and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoBackup">Automatic Backups</Label>
                  <p className="text-sm text-slate-500">
                    Schedule regular database backups
                  </p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={automationSettings.autoBackup}
                  onCheckedChange={(checked) =>
                    setAutomationSettings({ ...automationSettings, autoBackup: checked })
                  }
                />
              </div>

              {automationSettings.autoBackup && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={automationSettings.backupFrequency}
                      onValueChange={(value) =>
                        setAutomationSettings({ ...automationSettings, backupFrequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoReports">Automatic Reports</Label>
                  <p className="text-sm text-slate-500">
                    Generate and email periodic reports
                  </p>
                </div>
                <Switch
                  id="autoReports"
                  checked={automationSettings.autoReports}
                  onCheckedChange={(checked) =>
                    setAutomationSettings({ ...automationSettings, autoReports: checked })
                  }
                />
              </div>

              {automationSettings.autoReports && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="reportFrequency">Report Frequency</Label>
                    <Select
                      value={automationSettings.reportFrequency}
                      onValueChange={(value) =>
                        setAutomationSettings({ ...automationSettings, reportFrequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Enable or disable notification delivery methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailEnabled">Email Notifications</Label>
                  <p className="text-sm text-slate-500">
                    Send notifications via email
                  </p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={notificationSettings.emailEnabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailEnabled: checked })
                  }
                />
              </div>

              {notificationSettings.emailEnabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email Address</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@netily.com"
                      value={notificationSettings.adminEmail}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          adminEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsEnabled">SMS Notifications</Label>
                  <p className="text-sm text-slate-500">
                    Send notifications via SMS
                  </p>
                </div>
                <Switch
                  id="smsEnabled"
                  checked={notificationSettings.smsEnabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, smsEnabled: checked })
                  }
                />
              </div>

              {notificationSettings.smsEnabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="smsGateway">SMS Gateway</Label>
                    <Select
                      value={notificationSettings.smsGateway}
                      onValueChange={(value) =>
                        setNotificationSettings({ ...notificationSettings, smsGateway: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africastalking">Africa's Talking</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="custom">Custom Gateway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="paymentNotifications">Payment Notifications</Label>
                  <p className="text-sm text-slate-500">
                    Notify users about payment confirmations
                  </p>
                </div>
                <Switch
                  id="paymentNotifications"
                  checked={notificationSettings.paymentNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      paymentNotifications: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="expiryNotifications">Expiry Reminders</Label>
                  <p className="text-sm text-slate-500">
                    Remind users about upcoming subscription expiry
                  </p>
                </div>
                <Switch
                  id="expiryNotifications"
                  checked={notificationSettings.expiryNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      expiryNotifications: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="systemAlerts">System Alerts</Label>
                  <p className="text-sm text-slate-500">
                    Send alerts for system events and errors
                  </p>
                </div>
                <Switch
                  id="systemAlerts"
                  checked={notificationSettings.systemAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, systemAlerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketingEmails">Marketing Emails</Label>
                  <p className="text-sm text-slate-500">
                    Send promotional and marketing content
                  </p>
                </div>
                <Switch
                  id="marketingEmails"
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                Configure authentication and access settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  Security settings are managed at the system level. Contact your system administrator to modify these settings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys & Webhooks</CardTitle>
              <CardDescription>
                Manage API access and webhook endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value="sk_live_xxxxxxxxxxxxxxxxxx"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-domain.com/webhooks"
                />
              </div>
              <Button variant="outline" size="sm">
                Regenerate API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
