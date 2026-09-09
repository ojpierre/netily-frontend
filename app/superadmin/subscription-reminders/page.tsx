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
  type SubscriptionReminderTemplate,
  type SubscriptionReminderLogEntry,
} from "@/lib/superadmin-api"

export default function SubscriptionRemindersPage() {
  const [template, setTemplate] = useState<SubscriptionReminderTemplate | null>(null)
  const [content, setContent] = useState("")
  const [balance, setBalance] = useState<{ success: boolean; balance: number; error?: string } | null>(null)
  const [logs, setLogs] = useState<SubscriptionReminderLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [tpl, bal, logRes] = await Promise.all([
        superadminApi.getSubscriptionReminderTemplate(),
        superadminApi.getSubscriptionReminderBalance(),
        superadminApi.getSubscriptionReminderLogs({ page_size: "20" }),
      ])
      setTemplate(tpl)
      setContent(tpl.content)
      setBalance(bal)
      setLogs(logRes.results)
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
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger reminder sweep")
    } finally {
      setSending(false)
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
            Sent via the inbuilt Bytewave SMS to each tenant&apos;s admin phone, 3 days and 1 day before their subscription is due.
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
                    {log.milestone === "3_day" ? "3 days before" : "1 day before"} · {log.phone_number || "no phone"}
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