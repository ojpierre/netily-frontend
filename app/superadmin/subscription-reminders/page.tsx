"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Bell, BellRing, CalendarClock, CheckCircle2, Clock3, Loader2, Mail, MessageSquareText, Save, Search, Send, Smartphone, Users, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  superadminApi,
  type SubscriptionReminderBalanceSummary,
  type SubscriptionReminderTemplate,
  type SubscriptionReminderLogEntry,
  type SubscriptionReminderManualResult,
  type SubscriptionReminderRecipient,
} from "@/lib/superadmin-api"

type ReminderChannel = "email" | "sms" | "in_app"
type RecipientFilter = "needs_attention" | "all" | "expired" | "due_soon" | "active" | "trial"

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

const LOG_PAGE_SIZE = 20

const CHANNELS: Array<{ id: ReminderChannel; label: string; description: string; icon: typeof Mail }> = [
  { id: "sms", label: "SMS", description: "Send from the Netily platform wallet", icon: Smartphone },
  { id: "email", label: "Email", description: "Send to the account email", icon: Mail },
  { id: "in_app", label: "In-app", description: "Show inside the tenant dashboard", icon: Bell },
]

const RECIPIENT_FILTERS: Array<{ id: RecipientFilter; label: string }> = [
  { id: "needs_attention", label: "Needs attention" },
  { id: "expired", label: "Expired" },
  { id: "due_soon", label: "Due soon" },
  { id: "active", label: "Active" },
  { id: "trial", label: "Trial" },
  { id: "all", label: "All" },
]

function recipientStatusLabel(status: string) {
  if (status === "due_soon") return "Due soon"
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function recipientTiming(recipient: SubscriptionReminderRecipient) {
  if (recipient.days_left === null) return "No renewal date"
  if (recipient.days_left < 0) return `Expired ${Math.abs(recipient.days_left)} day${Math.abs(recipient.days_left) === 1 ? "" : "s"} ago`
  if (recipient.days_left === 0) return "Due today"
  return `${recipient.days_left} day${recipient.days_left === 1 ? "" : "s"} remaining`
}

function reminderMilestoneLabel(milestone: string) {
  if (milestone.startsWith("manual-")) return "Manual reminder"
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
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsLoadingMore, setLogsLoadingMore] = useState(false)
  const [recipients, setRecipients] = useState<SubscriptionReminderRecipient[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [manualChannels, setManualChannels] = useState<ReminderChannel[]>(["sms"])
  const [recipientSearch, setRecipientSearch] = useState("")
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("needs_attention")
  const [manualResult, setManualResult] = useState<SubscriptionReminderManualResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [manualSending, setManualSending] = useState(false)
  const providerDisplay = providerBalanceDisplay(balance)
  const platformWallet = balance?.platform_wallet
  const logsSentinelRef = useRef<HTMLDivElement | null>(null)
  const selectedRecipient = useMemo(
    () => recipients.find((recipient) => recipient.tenant_id === selectedTenantId) || null,
    [recipients, selectedTenantId],
  )
  const filteredRecipients = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase()
    return recipients.filter((recipient) => {
      const matchesStatus = recipientFilter === "all"
        || (recipientFilter === "needs_attention" && ["expired", "due_soon"].includes(recipient.reminder_status))
        || recipient.reminder_status === recipientFilter
      const matchesSearch = !query || [
        recipient.company_name,
        recipient.subdomain,
        recipient.recipient_name,
        recipient.recipient_email,
        recipient.recipient_phone,
      ].some((value) => value.toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    })
  }, [recipientFilter, recipientSearch, recipients])
  const recipientCounts = useMemo(() => ({
    all: recipients.length,
    needs_attention: recipients.filter((recipient) => ["expired", "due_soon"].includes(recipient.reminder_status)).length,
    expired: recipients.filter((recipient) => recipient.reminder_status === "expired").length,
    due_soon: recipients.filter((recipient) => recipient.reminder_status === "due_soon").length,
    active: recipients.filter((recipient) => recipient.reminder_status === "active").length,
    trial: recipients.filter((recipient) => recipient.reminder_status === "trial").length,
  }), [recipients])

  const applyLogPage = useCallback((results: SubscriptionReminderLogEntry[], append: boolean) => {
    setLogs((current) => {
      if (!append) return results
      const seen = new Set(current.map((log) => log.id))
      return [...current, ...results.filter((log) => !seen.has(log.id))]
    })
  }, [])

  const loadLogsPage = useCallback(async (page = 1, append = false) => {
    const response = await superadminApi.getSubscriptionReminderLogs({
      page: String(page),
      page_size: String(LOG_PAGE_SIZE),
    })
    applyLogPage(response.results || [], append)
    setLogsPage(response.page || page)
    setLogsTotal(response.count || 0)
    return response
  }, [applyLogPage])

  const load = async () => {
    setLoading(true)
    try {
      const [tplRes, balRes, logRes, recipientRes] = await Promise.allSettled([
        superadminApi.getSubscriptionReminderTemplate(),
        superadminApi.getSubscriptionReminderBalance(),
        superadminApi.getSubscriptionReminderLogs({ page: "1", page_size: String(LOG_PAGE_SIZE) }),
        superadminApi.getSubscriptionReminderRecipients(),
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
        applyLogPage(logRes.value.results || [], false)
        setLogsPage(logRes.value.page || 1)
        setLogsTotal(logRes.value.count || 0)
      } else {
        setLogs([])
        setLogsPage(1)
        setLogsTotal(0)
      }
      if (recipientRes.status === "fulfilled") {
        const rows = recipientRes.value.results || []
        setRecipients(rows)
        const attentionRecipient = rows.find((row) => row.can_send && ["expired", "due_soon"].includes(row.reminder_status))
        const selected = rows.find((row) => row.tenant_id === selectedTenantId) || attentionRecipient || rows.find((row) => row.can_send)
        setSelectedTenantId(selected?.tenant_id || "")
        if (!selectedTenantId && selected) {
          const preferred = (["sms", "email", "in_app"] as ReminderChannel[])
            .find((channel) => selected.available_channels[channel])
          setManualChannels(preferred ? [preferred] : [])
        }
        if (!attentionRecipient) setRecipientFilter("all")
      } else {
        setRecipients([])
      }

      const failures = [tplRes, balRes, logRes, recipientRes].filter((result) => result.status === "rejected")
      if (failures.length) {
        const failedSections = [
          tplRes.status === "rejected" ? "template" : "",
          balRes.status === "rejected" ? "balance" : "",
          logRes.status === "rejected" ? "history" : "",
          recipientRes.status === "rejected" ? "recipients" : "",
        ].filter(Boolean).join(", ")
        toast.info(failedSections
          ? `Some reminder data could not load: ${failedSections}. Other controls remain usable.`
          : "Some reminder data could not load. Other controls remain usable.")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load reminder settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const loadMoreLogs = useCallback(async () => {
    if (logsLoadingMore || logs.length >= logsTotal) return
    setLogsLoadingMore(true)
    try {
      await loadLogsPage(logsPage + 1, true)
    } catch (err: any) {
      toast.error(err.message || "Could not load more reminders")
    } finally {
      setLogsLoadingMore(false)
    }
  }, [loadLogsPage, logs.length, logsLoadingMore, logsPage, logsTotal])

  useEffect(() => {
    const node = logsSentinelRef.current
    if (!node || logs.length >= logsTotal) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreLogs()
      },
      { rootMargin: "240px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMoreLogs, logs.length, logsTotal])

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
    if (!selectedRecipient?.available_channels[channel]) return
    setManualChannels((current) => current.includes(channel)
      ? current.filter((item) => item !== channel)
      : [...current, channel])
    setManualResult(null)
  }

  const selectRecipient = (recipient: SubscriptionReminderRecipient) => {
    setSelectedTenantId(recipient.tenant_id)
    setManualChannels((current) => {
      const available = current.filter((channel) => recipient.available_channels[channel])
      if (available.length) return available
      const preferred = (["sms", "email", "in_app"] as ReminderChannel[])
        .find((channel) => recipient.available_channels[channel])
      return preferred ? [preferred] : []
    })
    setManualResult(null)
  }

  const sendManual = async () => {
    if (!selectedTenantId) {
      toast.error("Select a tenant first")
      return
    }
    if (!manualChannels.length) {
      toast.error("Select at least one available channel")
      return
    }
    setManualSending(true)
    try {
      const result = await superadminApi.sendSubscriptionReminderManual({
        tenant_id: selectedTenantId,
        channels: manualChannels,
      })
      setManualResult(result)
      const sentCount = result.email + result.sms + result.in_app
      if (sentCount > 0 && result.failed === 0 && result.skipped === 0) {
        toast.success(`Reminder delivered through ${sentCount} channel${sentCount === 1 ? "" : "s"}.`)
      } else if (sentCount > 0) {
        toast.info(`Reminder partly delivered: ${sentCount} sent, ${result.failed} failed, ${result.skipped} skipped.`)
      } else {
        toast.error(`Reminder was not delivered. ${result.detail}`)
      }
      const [logResult, balanceResult] = await Promise.allSettled([
        loadLogsPage(1, false),
        superadminApi.getSubscriptionReminderBalance(),
      ])
      if (balanceResult.status === "fulfilled") setBalance(balanceResult.value)
      if (logResult.status === "rejected") toast.info("The reminder was processed, but history could not refresh.")
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
            Find a tenant, choose how to contact their account admin, and send a renewal reminder immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              No tenant subscriptions are available for manual reminders.
            </div>
          ) : (
            <div className="grid min-h-[460px] overflow-hidden rounded-lg border border-slate-800 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
              <div className="border-b border-slate-800 lg:border-b-0 lg:border-r">
                <div className="space-y-3 border-b border-slate-800 p-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={recipientSearch}
                      onChange={(event) => setRecipientSearch(event.target.value)}
                      placeholder="Search company, admin, email or phone"
                      className="h-10 border-slate-700 bg-slate-950 pl-9 text-slate-100 placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {RECIPIENT_FILTERS.map((filter) => (
                      <Button
                        key={filter.id}
                        type="button"
                        size="sm"
                        variant={recipientFilter === filter.id ? "default" : "outline"}
                        onClick={() => setRecipientFilter(filter.id)}
                        className={recipientFilter === filter.id ? "shrink-0" : "shrink-0 border-slate-700 text-slate-300"}
                      >
                        {filter.label}
                        <span className="ml-1.5 text-xs opacity-70">{recipientCounts[filter.id]}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="max-h-[390px] overflow-y-auto">
                  {filteredRecipients.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                      <Search className="mb-2 h-5 w-5 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No matching tenants</p>
                      <p className="mt-1 text-xs text-slate-500">Change the status filter or search term.</p>
                    </div>
                  ) : filteredRecipients.map((recipient) => {
                    const selected = recipient.tenant_id === selectedTenantId
                    return (
                      <button
                        key={recipient.tenant_id}
                        type="button"
                        onClick={() => selectRecipient(recipient)}
                        className={`flex w-full items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3 text-left transition ${selected ? "bg-violet-500/10" : "hover:bg-slate-800/50"}`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-100">{recipient.company_name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{recipient.subdomain} · {recipient.plan_name}</span>
                          <span className={`mt-2 inline-flex items-center gap-1 text-xs ${recipient.days_left !== null && recipient.days_left <= 5 ? "text-amber-300" : "text-slate-400"}`}>
                            <Clock3 className="h-3.5 w-3.5" />
                            {recipientTiming(recipient)}
                          </span>
                        </span>
                        <Badge className={
                          recipient.reminder_status === "expired" ? "bg-red-500/15 text-red-300" :
                          recipient.reminder_status === "due_soon" ? "bg-amber-500/15 text-amber-300" :
                          recipient.reminder_status === "active" ? "bg-emerald-500/15 text-emerald-300" :
                          "bg-slate-700 text-slate-300"
                        }>
                          {recipientStatusLabel(recipient.reminder_status)}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col p-5">
                {!selectedRecipient ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <Users className="mb-3 h-6 w-6 text-slate-600" />
                    <p className="text-sm text-slate-400">Select a tenant to prepare a reminder.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Send to</p>
                      <p className="mt-1 text-base font-semibold text-white">{selectedRecipient.recipient_name}</p>
                      <p className="mt-1 text-xs text-slate-500">Account admin for {selectedRecipient.company_name}</p>
                    </div>

                    {selectedRecipient.recipient_error && (
                      <div className="mt-4 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{selectedRecipient.recipient_error}</span>
                      </div>
                    )}

                    <div className="mt-5 space-y-2">
                      <p className="text-xs font-medium uppercase text-slate-500">Delivery channels</p>
                      {CHANNELS.map(({ id, label, description, icon: Icon }) => {
                        const available = selectedRecipient.available_channels[id]
                        const selected = manualChannels.includes(id)
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={!available}
                            onClick={() => toggleManualChannel(id)}
                            className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition ${selected ? "border-violet-500 bg-violet-500/10" : "border-slate-800 bg-slate-950"} ${available ? "hover:border-slate-600" : "cursor-not-allowed opacity-45"}`}
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${selected ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-slate-100">{label}</span>
                              <span className="block truncate text-xs text-slate-500">{available ? description : `No ${label.toLowerCase()} contact available`}</span>
                            </span>
                            <span className={`h-4 w-4 rounded-full border ${selected ? "border-violet-400 bg-violet-500 shadow-[inset_0_0_0_3px_rgb(15,23,42)]" : "border-slate-600"}`} />
                          </button>
                        )
                      })}
                    </div>

                    {manualResult && (
                      <div className="mt-4 rounded-md border border-slate-700 bg-slate-950 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                          {manualResult.failed === 0 && manualResult.skipped === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
                          Delivery result
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {manualResult.deliveries.map((delivery) => (
                            <div key={`${delivery.channel}-${delivery.destination}`} className="flex items-start justify-between gap-3 text-xs">
                              <span className="min-w-0 text-slate-400">
                                <span className="block truncate">
                                  {delivery.channel === "in_app" ? "In-app" : delivery.channel.toUpperCase()}
                                  {delivery.destination ? ` · ${delivery.destination}` : ""}
                                </span>
                                {delivery.error && <span className="mt-0.5 block text-red-300">{delivery.error}</span>}
                              </span>
                              <span className={delivery.status === "sent" ? "text-emerald-400" : delivery.status === "failed" ? "text-red-400" : "text-amber-400"}>
                                {delivery.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-5">
                      <Button
                        onClick={sendManual}
                        disabled={manualSending || !selectedRecipient.can_send || manualChannels.length === 0}
                        className="h-11 w-full"
                      >
                        {manualSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {manualSending ? "Sending reminder" : `Send via ${manualChannels.length || 0} channel${manualChannels.length === 1 ? "" : "s"}`}
                      </Button>
                      <p className="mt-2 text-center text-xs text-slate-500">Only this tenant account admin will be contacted.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
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
            <div ref={logsSentinelRef} className="flex min-h-10 items-center justify-center pt-2 text-xs text-slate-500">
              {logsLoadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more reminders
                </span>
              ) : logs.length > 0 && logs.length >= logsTotal ? (
                <span>All reminder history loaded</span>
              ) : logs.length > 0 ? (
                <span>Scroll to load more</span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

