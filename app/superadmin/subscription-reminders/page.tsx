"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Bell, CalendarClock, Check, CheckCircle2, Clock3, FileText, History, Loader2, Mail, MessageSquareText, Play, Save, Search, Send, Smartphone, Wallet, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { superadminApi, type SubscriptionReminderBalanceSummary, type SubscriptionReminderLogEntry, type SubscriptionReminderManualResult, type SubscriptionReminderRecipient, type SubscriptionReminderTemplate } from "@/lib/superadmin-api"

type Channel = "sms" | "email" | "in_app"
type PageTab = "manual" | "automation" | "templates" | "history"
type RecipientFilter = "needs_attention" | "all" | "expired" | "due_soon" | "active" | "trial"

const LOG_PAGE_SIZE = 20
const CHANNELS: Array<{ id: Channel; label: string; description: string; icon: typeof Mail }> = [
  { id: "sms", label: "SMS", description: "Netily platform wallet", icon: Smartphone },
  { id: "email", label: "Email", description: "Tenant account email", icon: Mail },
  { id: "in_app", label: "In-app", description: "Tenant dashboard", icon: Bell },
]
const FILTERS: Array<{ id: RecipientFilter; label: string }> = [
  { id: "needs_attention", label: "Needs attention" }, { id: "expired", label: "Expired" },
  { id: "due_soon", label: "Due soon" }, { id: "active", label: "Active" },
  { id: "trial", label: "Trial" }, { id: "all", label: "All" },
]
const PRESETS = [
  { name: "Upcoming renewal", content: "Hi {admin_name}, your Internetily subscription for {company_name} ({plan_name}) is due in {days_left} day(s) on {expiry_date}. Open Admin > Subscription to renew and keep your account active." },
  { name: "Due today", content: "Hi {admin_name}, your Internetily subscription for {company_name} is due today. Open Admin > Subscription to renew and avoid service interruption." },
  { name: "Expired", content: "Hi {admin_name}, your Internetily subscription for {company_name} has expired. Open Admin > Subscription to renew and restore full access." },
]

function statusLabel(value: string) {
  if (value === "due_soon") return "Due soon"
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}
function timing(row: SubscriptionReminderRecipient) {
  if (row.days_left === null) return "No renewal date"
  if (row.days_left < 0) return `Expired ${Math.abs(row.days_left)} day${row.days_left === -1 ? "" : "s"} ago`
  if (row.days_left === 0) return "Due today"
  return `${row.days_left} day${row.days_left === 1 ? "" : "s"} remaining`
}
function milestoneLabel(value: string) {
  if (value.startsWith("manual-")) return "Manual reminder"
  if (value === "expired") return "Expired notice"
  if (["5", "3", "3_day", "1", "1_day"].includes(value)) return `${value.replace("_day", "")} day${value.startsWith("1") ? "" : "s"} before`
  return `${value} reminder`
}
function destination(log: SubscriptionReminderLogEntry) {
  if (log.channel === "email") return log.recipient_email || "No email"
  if (log.channel === "in_app") return log.recipient_name || "In-app"
  return log.recipient_phone || log.phone_number || "No phone"
}
function formatUnits(value?: string | number | null) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"
}
function renderPreview(content: string, recipient?: SubscriptionReminderRecipient | null) {
  const values: Record<string, string> = {
    company_name: recipient?.company_name || "Example Network", plan_name: recipient?.plan_name || "Starter",
    days_left: String(Math.max(recipient?.days_left ?? 3, 0)),
    expiry_date: recipient?.expiry ? new Date(recipient.expiry).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "30 Oct 2026",
    amount_due: "", admin_name: recipient?.recipient_name?.split(" ")[0] || "James", invoice_number: "",
  }
  return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, value), content)
}

export default function SubscriptionRemindersPage() {
  const [tab, setTab] = useState<PageTab>("manual")
  const [template, setTemplate] = useState<SubscriptionReminderTemplate | null>(null)
  const [savedContent, setSavedContent] = useState("")
  const [manualContent, setManualContent] = useState("")
  const [balance, setBalance] = useState<SubscriptionReminderBalanceSummary | null>(null)
  const [recipients, setRecipients] = useState<SubscriptionReminderRecipient[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [channels, setChannels] = useState<Channel[]>(["sms"])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<RecipientFilter>("needs_attention")
  const [results, setResults] = useState<Array<SubscriptionReminderManualResult & { tenant_id: string }>>([])
  const [logs, setLogs] = useState<SubscriptionReminderLogEntry[]>([])
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const [logStatus, setLogStatus] = useState("all")
  const [logChannel, setLogChannel] = useState("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinel = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => recipients.filter((row) => selectedIds.includes(row.tenant_id)), [recipients, selectedIds])
  const primary = selected[0] || null
  const counts = useMemo(() => ({
    all: recipients.length,
    needs_attention: recipients.filter((r) => ["expired", "due_soon"].includes(r.reminder_status)).length,
    expired: recipients.filter((r) => r.reminder_status === "expired").length,
    due_soon: recipients.filter((r) => r.reminder_status === "due_soon").length,
    active: recipients.filter((r) => r.reminder_status === "active").length,
    trial: recipients.filter((r) => r.reminder_status === "trial").length,
  }), [recipients])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return recipients.filter((row) => {
      const filterMatch = filter === "all" || (filter === "needs_attention" && ["expired", "due_soon"].includes(row.reminder_status)) || row.reminder_status === filter
      const searchMatch = !query || [row.company_name, row.subdomain, row.recipient_name, row.recipient_email, row.recipient_phone].some((value) => value.toLowerCase().includes(query))
      return filterMatch && searchMatch
    })
  }, [filter, recipients, search])
  const providerValue = useMemo(() => {
    if (!balance?.success) return "Unavailable"
    const raw = balance.raw as { remaining_balance?: string } | undefined
    return raw?.remaining_balance || `${formatUnits(balance.balance)} units`
  }, [balance])

  const loadLogs = useCallback(async (page = 1, append = false) => {
    const params: Record<string, string> = { page: String(page), page_size: String(LOG_PAGE_SIZE) }
    if (logStatus !== "all") params.status = logStatus
    if (logChannel !== "all") params.channel = logChannel
    const response = await superadminApi.getSubscriptionReminderLogs(params)
    setLogs((current) => append ? [...current, ...response.results.filter((row) => !current.some((item) => item.id === row.id))] : response.results)
    setLogsPage(response.page || page); setLogsTotal(response.count || 0)
  }, [logChannel, logStatus])

  const load = useCallback(async () => {
    setLoading(true)
    const [templateResult, balanceResult, recipientResult, logResult] = await Promise.allSettled([
      superadminApi.getSubscriptionReminderTemplate(), superadminApi.getSubscriptionReminderBalance(),
      superadminApi.getSubscriptionReminderRecipients(), superadminApi.getSubscriptionReminderLogs({ page: "1", page_size: String(LOG_PAGE_SIZE) }),
    ])
    if (templateResult.status === "fulfilled") {
      setTemplate(templateResult.value); setSavedContent(templateResult.value.content); setManualContent((value) => value || templateResult.value.content)
    }
    if (balanceResult.status === "fulfilled") setBalance(balanceResult.value)
    if (recipientResult.status === "fulfilled") {
      const rows = recipientResult.value.results || []
      setRecipients(rows)
      const first = rows.find((row) => row.can_send && ["expired", "due_soon"].includes(row.reminder_status)) || rows.find((row) => row.can_send)
      setSelectedIds((current) => current.length ? current : first ? [first.tenant_id] : [])
    }
    if (logResult.status === "fulfilled") { setLogs(logResult.value.results || []); setLogsPage(logResult.value.page || 1); setLogsTotal(logResult.value.count || 0) }
    const failed = [templateResult, balanceResult, recipientResult, logResult].filter((result) => result.status === "rejected").length
    if (failed) toast.info(`${failed} reminder section${failed === 1 ? "" : "s"} could not be refreshed. Available controls still work.`)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === "history") loadLogs(1).catch((error) => toast.error(error.message || "Could not load reminder history")) }, [loadLogs, tab])
  useEffect(() => {
    const node = sentinel.current
    if (!node || tab !== "history" || logs.length >= logsTotal) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || loadingMore) return
      setLoadingMore(true)
      loadLogs(logsPage + 1, true).catch((error) => toast.error(error.message || "Could not load more reminders")).finally(() => setLoadingMore(false))
    }, { rootMargin: "240px" })
    observer.observe(node); return () => observer.disconnect()
  }, [loadLogs, loadingMore, logs.length, logsPage, logsTotal, tab])

  function toggleRecipient(row: SubscriptionReminderRecipient) {
    if (!row.can_send) return
    setSelectedIds((current) => current.includes(row.tenant_id) ? current.filter((id) => id !== row.tenant_id) : [...current, row.tenant_id]); setResults([])
  }
  function toggleChannel(channel: Channel) {
    setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]); setResults([])
  }
  async function sendManual() {
    if (!selected.length || !channels.length) return toast.error("Select at least one tenant and one delivery channel.")
    if (!manualContent.trim()) return toast.error("Write or choose reminder copy before sending.")
    if (selected.length > 1 && !window.confirm(`Send this reminder to ${selected.length} tenant account admins?`)) return
    setSending(true); setResults([])
    const processed: Array<SubscriptionReminderManualResult & { tenant_id: string }> = []
    for (const row of selected) {
      const available = channels.filter((channel) => row.available_channels[channel])
      if (!available.length) continue
      try {
        const result = await superadminApi.sendSubscriptionReminderManual({ tenant_id: row.tenant_id, channels: available, message: manualContent.trim() })
        processed.push({ ...result, tenant_id: row.tenant_id })
      } catch (error) {
        processed.push({ tenant_id: row.tenant_id, tenant_name: row.company_name, detail: error instanceof Error ? error.message : "Send failed", invoice_number: "", milestone: "manual", recipient_name: row.recipient_name, email: 0, sms: 0, in_app: 0, failed: 1, skipped: 0, deliveries: [] })
      }
      setResults([...processed])
    }
    const delivered = processed.reduce((sum, result) => sum + result.email + result.sms + result.in_app, 0)
    const failed = processed.reduce((sum, result) => sum + result.failed, 0)
    delivered ? toast.success(`${delivered} delivery${delivered === 1 ? "" : "ies"} sent${failed ? `, ${failed} failed` : ""}.`) : toast.error("No reminders were delivered.")
    await Promise.allSettled([loadLogs(1), superadminApi.getSubscriptionReminderBalance().then(setBalance)]); setSending(false)
  }
  async function saveTemplate() {
    if (!savedContent.trim()) return toast.error("Template content cannot be empty.")
    setSaving(true)
    try { const value = await superadminApi.updateSubscriptionReminderTemplate(savedContent.trim()); setTemplate(value); toast.success("Automatic SMS template saved") }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save template") }
    finally { setSaving(false) }
  }
  async function runSweep() {
    if (!window.confirm("Run the automatic reminder sweep now? Eligible tenants will be contacted once per milestone.")) return
    setSweeping(true)
    try { const response = await superadminApi.sendSubscriptionRemindersNow(); toast.success(response.detail) }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not queue reminder sweep") }
    finally { setSweeping(false) }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>
  const tabs: Array<{ id: PageTab; label: string; icon: typeof Send }> = [
    { id: "manual", label: "Manual send", icon: Send }, { id: "automation", label: "Automation", icon: CalendarClock },
    { id: "templates", label: "Templates", icon: FileText }, { id: "history", label: "Delivery history", icon: History },
  ]

  return <div className="space-y-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><MessageSquareText className="h-6 w-6 text-violet-400" />Subscription reminders</h1><p className="mt-1 text-sm text-slate-400">Manage renewal communication without contacting tenant staff or platform superadmins.</p></div><div className="flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-400" />Automatic schedule enabled</div></div>

    <div className="grid gap-3 md:grid-cols-3">{[
      { title: "Bytewave master", value: providerValue, meta: balance?.provider || "Platform provider", icon: Wallet, color: "text-emerald-400" },
      { title: "Platform wallet", value: `${formatUnits(balance?.platform_wallet?.sms_units)} units`, meta: `${formatUnits(balance?.platform_wallet?.debited_units)} units used`, icon: Smartphone, color: "text-sky-400" },
      { title: "Needs attention", value: String(counts.needs_attention), meta: `${counts.expired} expired · ${counts.due_soon} due soon`, icon: AlertCircle, color: "text-amber-400" },
    ].map((item) => <Card key={item.title} className="border-slate-800 bg-slate-900"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-medium text-slate-400">{item.title}</p><p className="mt-1 text-2xl font-semibold text-white">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div><item.icon className={`h-5 w-5 ${item.color}`} /></CardContent></Card>)}</div>

    <div className="flex gap-1 overflow-x-auto border-b border-slate-800" role="tablist">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${tab === item.id ? "border-violet-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}</div>

    {tab === "manual" && <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
      <Card className="border-slate-800 bg-slate-900"><CardHeader><CardTitle className="text-base text-white">1. Choose subscribers</CardTitle><CardDescription>Select one tenant or a small, intentional group.</CardDescription></CardHeader><CardContent className="space-y-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, admin, email or phone" className="border-slate-700 bg-slate-950 pl-9 text-white" /></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{FILTERS.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs ${filter === item.id ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}>{item.label} <span className="ml-1 opacity-60">{counts[item.id]}</span></button>)}</div>
        <div className="max-h-[520px] overflow-y-auto rounded-md border border-slate-800">{filtered.length ? filtered.map((row) => {
          const checked = selectedIds.includes(row.tenant_id)
          return <button key={row.tenant_id} type="button" disabled={!row.can_send} onClick={() => toggleRecipient(row)} className={`flex w-full items-start gap-3 border-b border-slate-800 p-3 text-left last:border-0 ${checked ? "bg-violet-500/10" : "hover:bg-slate-800/40"} ${!row.can_send ? "opacity-50" : ""}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-violet-400 bg-violet-500 text-white" : "border-slate-600"}`}>{checked && <Check className="h-3.5 w-3.5" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{row.company_name}</span><span className="block truncate text-xs text-slate-500">{row.recipient_name} · {row.recipient_email || row.recipient_phone || "Contact missing"}</span><span className="mt-1.5 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3 w-3" />{timing(row)}</span></span><Badge className={row.reminder_status === "expired" ? "bg-red-500/15 text-red-300" : row.reminder_status === "due_soon" ? "bg-amber-500/15 text-amber-300" : "bg-slate-700 text-slate-300"}>{statusLabel(row.reminder_status)}</Badge></button>
        }) : <div className="p-10 text-center text-sm text-slate-500">No subscribers match this view.</div>}</div><p className="text-xs text-slate-500">{selected.length} selected · each reminder goes only to the resolved tenant account admin.</p>
      </CardContent></Card>

      <div className="space-y-4">
        <Card className="border-slate-800 bg-slate-900"><CardHeader><CardTitle className="text-base text-white">2. Choose delivery channels</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">{CHANNELS.map((item) => {
          const enabled = selected.some((row) => row.available_channels[item.id]); const active = channels.includes(item.id)
          return <button key={item.id} type="button" disabled={!enabled} onClick={() => toggleChannel(item.id)} className={`flex items-center gap-3 rounded-md border p-3 text-left ${active ? "border-violet-500 bg-violet-500/10" : "border-slate-800 bg-slate-950"} ${!enabled ? "opacity-40" : ""}`}><span className={`flex h-9 w-9 items-center justify-center rounded-md ${active ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400"}`}><item.icon className="h-4 w-4" /></span><span><span className="block text-sm font-medium text-white">{item.label}</span><span className="text-xs text-slate-500">{enabled ? item.description : "Unavailable"}</span></span></button>
        })}</CardContent></Card>
        <Card className="border-slate-800 bg-slate-900"><CardHeader><CardTitle className="text-base text-white">3. Review the message</CardTitle><CardDescription>This edit applies only to this send. It does not change automation.</CardDescription></CardHeader><CardContent className="space-y-3">
          <div className="flex gap-2 overflow-x-auto">{PRESETS.map((preset) => <button key={preset.name} type="button" onClick={() => setManualContent(preset.content)} className="shrink-0 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500">{preset.name}</button>)}</div>
          <Textarea value={manualContent} onChange={(event) => setManualContent(event.target.value)} rows={6} maxLength={1200} className="border-slate-700 bg-slate-950 text-white" />
          <div className="rounded-md border border-slate-800 bg-slate-950 p-3"><p className="text-[11px] font-medium uppercase text-slate-500">Preview {primary ? `for ${primary.company_name}` : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{renderPreview(manualContent, primary)}</p></div>
          <div className="flex items-center justify-between text-xs text-slate-500"><span>{manualContent.length}/1,200 characters</span><span>{channels.length} channel{channels.length === 1 ? "" : "s"}</span></div>
          <Button onClick={sendManual} disabled={sending || !selected.length || !channels.length || !manualContent.trim()} className="h-11 w-full">{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{sending ? `Sending ${results.length + 1} of ${selected.length}` : `Review and send to ${selected.length || 0} tenant${selected.length === 1 ? "" : "s"}`}</Button>
        </CardContent></Card>
        {results.length > 0 && <Card className="border-slate-800 bg-slate-900"><CardHeader><CardTitle className="text-base text-white">Delivery results</CardTitle></CardHeader><CardContent className="space-y-2">{results.map((result) => <div key={result.tenant_id} className="flex items-start justify-between rounded-md border border-slate-800 bg-slate-950 p-3"><div><p className="text-sm font-medium text-white">{result.tenant_name}</p><p className="mt-0.5 text-xs text-slate-500">{result.email + result.sms + result.in_app} sent · {result.failed} failed · {result.skipped} skipped</p></div>{result.failed ? <XCircle className="h-4 w-4 text-red-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}</div>)}</CardContent></Card>}
      </div>
    </div>}

    {tab === "automation" && <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="border-slate-800 bg-slate-900"><CardHeader><CardTitle className="text-white">Automatic renewal schedule</CardTitle><CardDescription>Each milestone is deduplicated per billing cycle. Paid or renewed subscriptions are skipped.</CardDescription></CardHeader><CardContent className="space-y-2">{[["5 days before", "A calm early reminder with time to prepare payment"], ["3 days before", "A practical follow-up before the due date"], ["1 day before", "A final reminder before access may be affected"], ["Once expired", "One overdue notice, when expired notices are enabled"]].map(([title, copy], index) => <div key={title} className="flex items-center gap-4 rounded-md border border-slate-800 bg-slate-950 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300">{index + 1}</span><div className="flex-1"><p className="text-sm font-medium text-white">{title}</p><p className="text-xs text-slate-500">{copy}</p></div><Badge className="bg-emerald-500/15 text-emerald-300">Enabled</Badge></div>)}</CardContent></Card>
      <Card className="border-slate-800 bg-slate-900"><CardHeader><CardTitle className="text-white">Run a sweep</CardTitle><CardDescription>Queue the same eligibility checks used by the daily schedule.</CardDescription></CardHeader><CardContent><div className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400"><p className="font-medium text-white">Before anything sends</p><ul className="mt-2 space-y-2 text-xs"><li>Checks the current billing cycle</li><li>Skips paid and renewed tenants</li><li>Contacts one tenant account admin</li><li>Prevents a duplicate milestone delivery</li></ul></div><Button onClick={runSweep} disabled={sweeping} className="mt-4 h-11 w-full">{sweeping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Run sweep now</Button></CardContent></Card>
    </div>}

    {tab === "templates" && <Card className="border-slate-800 bg-slate-900"><CardHeader><CardTitle className="text-white">Automatic SMS template</CardTitle><CardDescription>This saved copy is used by scheduled SMS reminders. Manual sends can edit their own one-off copy.</CardDescription></CardHeader><CardContent className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="space-y-3"><div className="flex gap-2 overflow-x-auto">{PRESETS.map((preset) => <button key={preset.name} onClick={() => setSavedContent(preset.content)} className="shrink-0 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-violet-500">{preset.name}</button>)}</div><Textarea value={savedContent} onChange={(event) => setSavedContent(event.target.value)} rows={9} className="border-slate-700 bg-slate-950 text-white" /><div className="flex flex-wrap gap-1.5">{template?.variables.map((variable) => <button key={variable.key} type="button" onClick={() => setSavedContent((value) => `${value}${value.endsWith(" ") || !value ? "" : " "}${variable.key}`)} className="rounded border border-slate-700 px-2 py-1 font-mono text-[11px] text-slate-400">{variable.key}</button>)}</div><Button onClick={saveTemplate} disabled={saving || savedContent.trim() === template?.content}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save automatic template</Button></div><div className="rounded-md border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-medium uppercase text-slate-500">Message preview</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{renderPreview(savedContent, primary)}</p><div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">Last updated {template?.updated_at ? new Date(template.updated_at).toLocaleString("en-KE") : "not available"}</div></div></CardContent></Card>}

    {tab === "history" && <Card className="border-slate-800 bg-slate-900"><CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between"><div><CardTitle className="text-white">Delivery history</CardTitle><CardDescription>Manual and automatic attempts across all supported channels.</CardDescription></div><div className="flex gap-2"><select value={logChannel} onChange={(event) => setLogChannel(event.target.value)} className="h-9 rounded-md border border-slate-700 bg-slate-950 px-3 text-xs text-slate-300"><option value="all">All channels</option><option value="sms">SMS</option><option value="email">Email</option><option value="in_app">In-app</option></select><select value={logStatus} onChange={(event) => setLogStatus(event.target.value)} className="h-9 rounded-md border border-slate-700 bg-slate-950 px-3 text-xs text-slate-300"><option value="all">All statuses</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="skipped">Skipped</option></select></div></CardHeader><CardContent><div className="divide-y divide-slate-800">{logs.map((log) => <div key={log.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><span className={`flex h-9 w-9 items-center justify-center rounded-md ${log.status === "sent" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{log.channel === "email" ? <Mail className="h-4 w-4" /> : log.channel === "in_app" ? <Bell className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{log.company_name}</p><p className="truncate text-xs text-slate-500">{milestoneLabel(log.milestone)} · {destination(log)}{log.error ? ` · ${log.error}` : ""}</p></div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : ""}</span><Badge className={log.status === "sent" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}>{log.status}</Badge></div></div>)}{!logs.length && <div className="py-12 text-center text-sm text-slate-500">No reminder deliveries match these filters.</div>}</div><div ref={sentinel} className="flex min-h-12 items-center justify-center text-xs text-slate-500">{loadingMore ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Loading more</> : logs.length && logs.length >= logsTotal ? "All matching reminders loaded" : ""}</div></CardContent></Card>}
  </div>
}
