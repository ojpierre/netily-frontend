"use client"

import { useEffect, useState } from "react"
import { BellRing, CalendarClock, Loader2, MessageSquareText, Save, Send, Users, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  superadminApi,
  type Tenant,
  type SubscriptionReminderBalanceSummary,
  type SubscriptionReminderTemplate,
  type SubscriptionReminderLogEntry,
} from "@/lib/superadmin-api"

type ReminderChannel = "email" | "sms" | "in_app"

const TEMPLATE_PRESETS = [
  {
    name: "Upcoming renewal",
    content:
      "Hi {admin_name}, your Netily subscription for {company_name} ({plan_name}) is due in {days_left} day(s) on {expiry_date}. Please open Admin > Subscription and renew to keep your account active.",
  },
  {
    name: "Due today",
    content:
      "Hi {admin_name}, your Netily subscription for {company_name} is due today. Please open Admin > Subscription and renew to avoid account interruption.",
  },
  {
    name: "Expired",
    content:
      "Hi {admin_name}, your Netily subscription for {company_name} has expired. Please open Admin > Subscription and renew to restore full access.",
  },
]

function reminderMilestoneLabel(milestone: string) {
  if (milestone === "expired") return "Expired notice"
  if (milestone === "5") return "5 days before"
  if (milestone === "3" || milestone === "3_day") return "3 days before"
  if (milestone === "1" || milestone === "1_day") return "1 day before"
  return `${milestone} reminder`
}

function reminderDestination(log: SubscriptionReminderLogEntry) {
  if (log.channel === "email") return log.recipient_email || "no email"
  if (log.channel === "in_app") return log.recipient_name || "in-app"
  return log.recipient_phone || log.phone_number || "no phone"
}

function formatUnits(value?: string | number | null) {
  const numeric = Number(value || 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"
}

function providerBalanceDisplay(balance: SubscriptionReminderBalanceSummary | null) {
  if (!balance?.success) return null
  const raw = balance.raw as { remaining_balance?: string; expired_on?: string } | undefined
  if (raw?.remaining_balance) {
    const numeric = Number(raw.remaining_balance.replace(/[^0-9.]/g, ""))
    return {
      value: Number.isFinite(numeric)
        ? `Ksh ${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : raw.remaining_balance,
      meta: raw.expired_on ? `Expires: ${raw.expired_on}` : balance.provider || "bytewave_master",
    }
  }

  const currency = (balance.currency || "SMS_UNITS").toUpperCase()
  const value = currency === "KES"
    ? `Ksh ${formatUnits(balance.balance)}`
    : `${formatUnits(balance.balance)} units`
  return { value, meta: balance.provider || "bytewave_master" }
}

export default function SubscriptionRemindersPage() {
  const [template, setTemplate] = useState<SubscriptionReminderTemplate | null>(null)
  const [content, setContent] = useState("")
  const [balance, setBalance] = useState<SubscriptionReminderBalanceSummary | null>(null)
  const [logs, setLogs] = useState<SubscriptionReminderLogEntry[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [manualChannels, setManualChannels] = useState<ReminderChannel[]>(["sms"])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [manualSending, setManualSending] = useState(false)
  const providerDisplay = providerBalanceDisplay(balance)
  const platformWallet = balance?.platform_wallet

  const load = async () => {
    setLoading(true)
    try {
      const [tplRes, balRes, logRes, tenantRes] = await Promise.allSettled([
        superadminApi.getSubscriptionReminderTemplate(),
        superadminApi.getSubscriptionReminderBalance(),
        superadminApi.getSubscriptionReminderLogs({ page_size: "20" }),
        superadminApi.getTenants({ page_size: "500" }),
      ])

      if (tplRes.status === "fulfilled") {
        setTemplate(tplRes.value)
        setContent(tplRes.value.content)
      }
      if (balRes.status === "fulfilled") {
        setBalance(balRes.value)
      } else {
        setBalance({ success: false, balance: 0, error: balRes.reason?.message || "Could not load balance" })
      }
      if (logRes.status === "fulfilled") {
        setLogs(logRes.value.results)
      } else {
        setLogs([])
      }
      if (tenantRes.status === "fulfilled") {
        const rows = Array.isArray(tenantRes.value) ? tenantRes.value : []
        setTenants(rows)
        setSelectedTenantId((current) => current || rows[0]?.id || "")
      } else {
        setTenants([])
      }

      const failures = [tplRes, balRes, logRes, tenantRes].filter((result) => result.status === "rejected")
      if (failures.length) {
        const failedSections = [
          tplRes.status === "rejected" ? "template" : "",
          balRes.status === "rejected" ? "balance" : "",
          logRes.status === "rejected" ? "history" : "",
          tenantRes.status === "rejected" ? "tenants" : "",
        ].filter(Boolean).join(", ")
        toast.warning("Some reminder data could not load", {
          description: failedSections ? `Affected section(s): ${failedSections}. Other controls remain usable.` : "Other controls remain usable.",
        })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load reminder settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await superadminApi.updateSubscriptionReminderTemplate(content)
      setTemplate((current) => ({
        ...updated,
        variables: updated.variables || current?.variables || [],
      }))
      toast.success("Template updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const sendNow = async () => {
    setSending(true)
    try {
      const res = await superadminApi.sendSubscriptionRemindersNow()
      toast.success(res.detail)
      load()
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger reminder sweep")
    } finally {
      setSending(false)
    }
  }

  const toggleManualChannel = (channel: ReminderChannel) => {
    setManualChannels((current) => {
      const exists = current.includes(channel)
      const next = exists ? current.filter((item) => item !== channel) : [...current, channel]
      return next.length ? next : ["sms"]
    })
  }

  const sendManual = async () => {
    if (!selectedTenantId) {
      toast.error("Select a tenant first")
      return
    }
    setManualSending(true)
    try {
      const result = await superadminApi.sendSubscriptionReminderManual({
        tenant_id: selectedTenantId,
        channels: manualChannels,
      })
      toast.success("Manual reminder sent", {
        description: result.detail,
      })
      load()
    } catch (err: any) {
      toast.error(err.message || "Failed to send manual reminder")
    } finally {
      setManualSending(false)
    }
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-violet-400" />
            Subscription Payment Reminders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sends tenant subscription invoice reminders 5 days, 3 days, 1 day, and once expired using Netily's platform SMS wallet.
          </p>
        </div>
        <Button onClick={sendNow} disabled={sending} variant="outline" className="h-11 border-slate-700 text-slate-300">
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Run Sweep Now
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Bytewave Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balance?.success ? (
              <>
                <p className="text-3xl font-bold text-white">{providerDisplay?.value}</p>
                <p className="mt-1 text-xs text-slate-500">{providerDisplay?.meta}</p>
              </>
            ) : (
              <p className="text-sm text-red-400">{balance?.error || "Could not load balance"}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              Netily Platform Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{formatUnits(platformWallet?.sms_units)} units</p>
            <p className="mt-1 text-xs text-slate-500">
              {platformWallet?.enforce_balance ? "Balance enforced" : "Tracking mode"} - {formatUnits(platformWallet?.debited_units)} units used
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Tenant SMS Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{formatUnits(balance?.total_inbuilt_units)} units</p>
            <p className="mt-1 text-xs text-slate-500">
              Visibility only - {balance?.inbuilt_tenant_count || 0} tenant{balance?.inbuilt_tenant_count === 1 ? "" : "s"} using Netily SMS
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-violet-400" />
              Automatic Sweep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">5 / 3 / 1</p>
            <p className="mt-1 text-xs text-slate-500">Daily sweep, plus one expired notice when enabled</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <BellRing className="w-4 h-4 text-violet-400" />
            Manual Reminder
          </CardTitle>
          <CardDescription>
            Choose a tenant, select the channels, and send a simple renewal reminder immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenants.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              No tenants are available for manual reminders.
            </div>
          ) : (
            <>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <select
                  value={selectedTenantId}
                  onChange={(event) => setSelectedTenantId(event.target.value)}
                  className="h-11 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-violet-500"
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.company_name || tenant.subdomain} - {tenant.subscription_plan || "Subscription"} - {tenant.subscription_status_display || tenant.status}
                    </option>
                  ))}
                </select>
                <Button onClick={sendManual} disabled={manualSending || !selectedTenantId}>
                  {manualSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Reminder
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["sms", "email", "in_app"] as ReminderChannel[]).map((channel) => (
                  <Button
                    key={channel}
                    type="button"
                    size="sm"
                    variant={manualChannels.includes(channel) ? "default" : "outline"}
                    onClick={() => toggleManualChannel(channel)}
                    className={manualChannels.includes(channel) ? "" : "border-slate-700 text-slate-300"}
                  >
                    {channel === "in_app" ? "In-app" : channel.toUpperCase()}
                  </Button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">SMS Template</CardTitle>
          <CardDescription>
            Pick a starting point, then adjust the copy for the next reminder run. Available variables:{" "}
            {(template?.variables || []).map((v) => (
              <Badge key={v.key} variant="outline" className="mr-1 mb-1">{v.key}</Badge>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            {TEMPLATE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setContent(preset.content)}
                className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-left transition hover:border-violet-500/70 hover:bg-slate-900"
              >
                <span className="block text-sm font-medium text-slate-100">{preset.name}</span>
                <span className="mt-1 line-clamp-2 block text-xs text-slate-500">{preset.content}</span>
              </button>
            ))}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="bg-slate-950 border-slate-700 text-slate-100"
          />
          <Button onClick={save} disabled={saving || content === template?.content}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Template
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Recent Reminders</CardTitle>
          <CardDescription>
            Manual sends appear here immediately. Automatic sends appear after the scheduled sweep finds a matching billing milestone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                No reminders have been recorded yet. Send one manually or run the sweep after the backend deploys and the delivery rows will appear here.
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col gap-3 border-b border-slate-800 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-white font-medium">{log.company_name}</p>
                  <p className="text-slate-500 text-xs">
                    {reminderMilestoneLabel(log.milestone)}
                    {log.invoice_number ? ` - ${log.invoice_number}` : ""}
                    {` - ${log.channel || "sms"} - ${reminderDestination(log)}`}
                  </p>
                </div>
                <Badge className={log.status === "sent" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

