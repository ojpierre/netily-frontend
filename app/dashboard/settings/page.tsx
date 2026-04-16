"use client"

import { useState } from "react"
import { useAuth } from "@/app/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Trash2,
  Eye,
  EyeOff,
  Save,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Account Settings
  const [accountData, setAccountData] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
  })

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Notification Preferences
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    paymentReminders: true,
    promotionalEmails: false,
    usageAlerts: true,
    securityAlerts: true,
  })

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    shareUsageData: false,
    allowMarketing: false,
    twoFactorAuth: false,
  })

  // Language & Display
  const [displaySettings, setDisplaySettings] = useState({
    language: "en",
    timezone: "Africa/Nairobi",
    theme: "light",
  })

  const handleAccountUpdate = async () => {
    setLoading(true)
    try {
      // TODO: Call API to update account
      // await api.updateAccount(accountData)
      toast.success("Account settings updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      // TODO: Call API to change password
      // await api.changePassword(passwordData.currentPassword, passwordData.newPassword)
      toast.success("Password changed successfully!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)
    try {
      // TODO: Call API to update notification preferences
      // await api.updateNotificationPreferences(notificationSettings)
      toast.success("Notification preferences updated!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update preferences")
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacyUpdate = async () => {
    setLoading(true)
    try {
      // TODO: Call API to update privacy settings
      // await api.updatePrivacySettings(privacySettings)
      toast.success("Privacy settings updated!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  const handleDisplayUpdate = async () => {
    setLoading(true)
    try {
      // TODO: Call API to update display settings
      // await api.updateDisplaySettings(displaySettings)
      toast.success("Display settings updated!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      // TODO: Call API to delete account
      // await api.deleteAccount()
      toast.success("Account deleted successfully")
      logout()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account preferences and settings</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 lg:w-auto">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-6">Account Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used for login and communication
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={accountData.phone}
                  onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used for SMS notifications and support
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleAccountUpdate} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-red-50 border-red-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-800 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-6">Change Password</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="pt-4">
                <Button onClick={handlePasswordChange} disabled={loading}>
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-6">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Enable 2FA</p>
                <p className="text-sm text-slate-600">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    {privacySettings.twoFactorAuth ? "Disable" : "Enable"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Scan the QR code with your authenticator app
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6">
                    <div className="w-48 h-48 bg-slate-100 rounded-lg mx-auto flex items-center justify-center">
                      <p className="text-slate-400 text-sm">QR Code Placeholder</p>
                    </div>
                    <div className="mt-4">
                      <Label>Verification Code</Label>
                      <Input placeholder="Enter 6-digit code" className="mt-2" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Verify & Enable</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-6">Notification Preferences</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Email Notifications</p>
                  <p className="text-sm text-slate-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">SMS Notifications</p>
                  <p className="text-sm text-slate-600">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Payment Reminders</p>
                  <p className="text-sm text-slate-600">Get reminded before payment due dates</p>
                </div>
                <Switch
                  checked={notificationSettings.paymentReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, paymentReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Promotional Emails</p>
                  <p className="text-sm text-slate-600">Receive offers and promotional content</p>
                </div>
                <Switch
                  checked={notificationSettings.promotionalEmails}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, promotionalEmails: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Usage Alerts</p>
                  <p className="text-sm text-slate-600">Get notified about your data usage</p>
                </div>
                <Switch
                  checked={notificationSettings.usageAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, usageAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Security Alerts</p>
                  <p className="text-sm text-slate-600">Important security updates (recommended)</p>
                </div>
                <Switch
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, securityAlerts: checked })
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleNotificationUpdate} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-6">Privacy Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Share Usage Data</p>
                  <p className="text-sm text-slate-600">
                    Help us improve our service by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={privacySettings.shareUsageData}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, shareUsageData: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Marketing Communications</p>
                  <p className="text-sm text-slate-600">
                    Allow us to use your data for marketing purposes
                  </p>
                </div>
                <Switch
                  checked={privacySettings.allowMarketing}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, allowMarketing: checked })
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handlePrivacyUpdate} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Data Protection</h3>
                <p className="text-sm text-blue-800 mb-4">
                  We take your privacy seriously. Your data is encrypted and never shared
                  with third parties without your explicit consent.
                </p>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                  Learn More
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-6">Display & Language</h3>
            <div className="space-y-6">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={displaySettings.language}
                  onValueChange={(value) =>
                    setDisplaySettings({ ...displaySettings, language: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={displaySettings.timezone}
                  onValueChange={(value) =>
                    setDisplaySettings({ ...displaySettings, timezone: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Nairobi">East Africa Time (EAT)</SelectItem>
                    <SelectItem value="Africa/Lagos">West Africa Time (WAT)</SelectItem>
                    <SelectItem value="Africa/Cairo">Egypt Time (EET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={displaySettings.theme}
                  onValueChange={(value) =>
                    setDisplaySettings({ ...displaySettings, theme: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleDisplayUpdate} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
