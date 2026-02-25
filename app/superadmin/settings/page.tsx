"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  Settings,
  Loader2,
  Save,
  Bell,
  Clock,
  Mail,
  Smartphone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { superadminApi } from "@/lib/superadmin-api"

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await superadminApi.getSettings()
      setSettings(data as Record<string, any>)
    } catch (err: any) {
      toast.error(err.message || "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      await superadminApi.updateSettings(settings)
      toast.success("Settings saved successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const update = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-violet-400" />
            System Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global platform configuration
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-500 text-white"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      {/* Automation */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SettingsToggle label="Auto-Renew" checked={settings.auto_renew} onChange={(v) => update("auto_renew", v)} />
            <SettingsToggle label="Auto-Expiry" checked={settings.auto_expiry} onChange={(v) => update("auto_expiry", v)} />
            <SettingsToggle label="Auto-Notifications" checked={settings.auto_notifications} onChange={(v) => update("auto_notifications", v)} />
            <SettingsToggle label="Auto-Backup" checked={settings.auto_backup} onChange={(v) => update("auto_backup", v)} />
            <SettingsToggle label="Auto-Reports" checked={settings.auto_reports} onChange={(v) => update("auto_reports", v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <SettingsInput label="Grace Period (days)" value={settings.grace_period} onChange={(v) => update("grace_period", parseInt(v))} type="number" />
            <SettingsInput label="Backup Frequency" value={settings.backup_frequency} onChange={(v) => update("backup_frequency", v)} />
            <SettingsInput label="Report Frequency" value={settings.report_frequency} onChange={(v) => update("report_frequency", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-pink-400" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SettingsToggle label="Email Enabled" checked={settings.email_enabled} onChange={(v) => update("email_enabled", v)} />
            <SettingsToggle label="SMS Enabled" checked={settings.sms_enabled} onChange={(v) => update("sms_enabled", v)} />
            <SettingsToggle label="Payment Notifications" checked={settings.payment_notifications} onChange={(v) => update("payment_notifications", v)} />
            <SettingsToggle label="Expiry Notifications" checked={settings.expiry_notifications} onChange={(v) => update("expiry_notifications", v)} />
            <SettingsToggle label="System Alerts" checked={settings.system_alerts} onChange={(v) => update("system_alerts", v)} />
            <SettingsToggle label="Marketing Emails" checked={settings.marketing_emails} onChange={(v) => update("marketing_emails", v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <SettingsInput label="Admin Email" value={settings.admin_email} onChange={(v) => update("admin_email", v)} icon={<Mail className="w-4 h-4" />} />
            <SettingsInput label="SMS Gateway" value={settings.sms_gateway} onChange={(v) => update("sms_gateway", v)} icon={<Smartphone className="w-4 h-4" />} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  icon,
}: {
  label: string
  value: any
  onChange: (v: string) => void
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <Label className="text-slate-400 text-xs">{label}</Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-2.5 text-slate-500">{icon}</div>
        )}
        <Input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-slate-800 border-slate-700 text-white ${icon ? "pl-10" : ""}`}
        />
      </div>
    </div>
  )
}

function SettingsToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <Label className="text-slate-300 text-sm">{label}</Label>
      <Switch checked={checked ?? false} onCheckedChange={onChange} />
    </div>
  )
}
