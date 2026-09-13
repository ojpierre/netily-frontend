"use client"

import { useEffect, useState } from "react"
import { Loader2, MessageSquareText, Save, Send, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  superadminApi,
  type SubscriptionInvoice,
  type SubscriptionReminderTemplate,
  type SubscriptionReminderLogEntry,
} from "@/lib/superadmin-api"

type ReminderChannel = "email" | "sms" | "in_app"

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

export default function SubscriptionRemindersPage() {
  const [template, setTemplate] = useState<SubscriptionReminderTemplate | null>(null)
  const [content, setContent] = useState("")
  const [balance, setBalance] = useState<{ success: boolean; balance: number; error?: string } | null>(null)
  const [logs, setLogs] = useState<SubscriptionReminderLogEntry[]>([])
  const [candidates, setCandidates] = useState<SubscriptionInvoice[]>([])
  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [manualChannels, setManualChannels] = useState<ReminderChannel[]>(["sms"])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [manualSending, setManualSending] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [tpl, bal, logRes] = await Promise.all([
        superadminApi.getSubscriptionReminderTemplate(),
        superadminApi.getSubscriptionReminderBalance(),
        superadminApi.getSubscriptionReminderLogs({ page_size: "20" }),
      ])
      const invoiceRes = await superadminApi.getSubscriptionInvoices({ status: "outstanding", page_size: "12" })
      setTemplate(tpl)
      setContent(tpl.content)
      setBalance(bal)
      setLogs(logRes.results)
      setCandidates(invoiceRes.results || [])
      setSelectedCycleId((current) => current || invoiceRes.results?.[0]?.id || "")
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
      setTemplate(updated)
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
    if (!selectedCycleId) {
      toast.error("Select an outstanding invoice first")
      return
    }
    setManualSending(true)
    try {
      const result = await superadminApi.sendSubscriptionReminderManual({
        cycle_id: selectedCycleId,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-violet-400" />
            Subscription Payment Reminders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sends tenant subscription invoice reminders 5 days, 3 days, 1 day, and once expired using the shared Netily Bytewave balance.
          </p>
        </div>
        <Button onClick={sendNow} disabled={sending} variant="outline" className="border-slate-700 text-slate-300">
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Run Sweep Now
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Bytewave Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balance?.success ? (
            <p className="text-2xl font-bold text-white">{balance.balance.toLocaleString()} units</p>
          ) : (
            <p className="text-sm text-red-400">{balance?.error || "Could not load balance"}</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Manual Reminder</CardTitle>
          <CardDescription>
            Send a reminder immediately for an outstanding subscription invoice when the automatic sweep needs a nudge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidates.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              No outstanding subscription invoices are available for manual reminders.
            </div>
          ) : (
            <>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <select
                  value={selectedCycleId}
                  onChange={(event) => setSelectedCycleId(event.target.value)}
                  className="h-11 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-violet-500"
                >
                  {candidates.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.tenant_name} - {invoice.invoice?.invoice_number || "Invoice pending"} - KES {invoice.invoice?.balance || invoice.effective_total || invoice.calculated_total}
                    </option>
                  ))}
                </select>
                <Button onClick={sendManual} disabled={manualSending || !selectedCycleId}>
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
            Available variables:{" "}
            {template?.variables.map((v) => (
              <Badge key={v.key} variant="outline" className="mr-1 mb-1">{v.key}</Badge>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 && <p className="text-slate-500 text-sm">No reminders sent yet.</p>}
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-slate-800 py-2 text-sm">
                <div>
                  <p className="text-white font-medium">{log.company_name}</p>
                  <p className="text-slate-500 text-xs">
                    {reminderMilestoneLabel(log.milestone)}
                    {log.invoice_number ? ` · ${log.invoice_number}` : ""}
                    {` · ${log.channel || "sms"} · ${reminderDestination(log)}`}
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
