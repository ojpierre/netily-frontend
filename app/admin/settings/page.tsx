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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Load settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("No access token")

        const res = await fetch("http://127.0.0.1:8000/api/admin/settings/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Failed to load settings")

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

    // Better token retrieval
   const token = localStorage.getItem("access_token") || localStorage.getItem("adminToken")
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

      const res = await fetch("http://127.0.0.1:8000/api/admin/settings/", {
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
      <Tabs defaultValue="radius" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="radius" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            RADIUS
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

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
