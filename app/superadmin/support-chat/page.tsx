"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Headphones, Loader2, RefreshCw, Send, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  superadminApi,
  type SuperadminSupportChatConversation,
  type SuperadminSupportChatMessage,
} from "@/lib/superadmin-api"
import { toast } from "sonner"

const STATUS_FILTERS = [
  { label: "Active", value: "" },
  { label: "New", value: "new" },
  { label: "Open", value: "open" },
  { label: "Waiting", value: "waiting_on_tenant" },
  { label: "Resolved", value: "resolved" },
]

function timeAgo(value?: string | null) {
  if (!value) return "No activity"
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  if (Number.isNaN(diff)) return "No activity"
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function statusBadgeClass(status: string) {
  if (status === "new") return "bg-sky-500/20 text-sky-300 border-sky-500/30"
  if (status === "waiting_on_tenant") return "bg-amber-500/20 text-amber-300 border-amber-500/30"
  if (status === "resolved") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
  return "bg-violet-500/20 text-violet-300 border-violet-500/30"
}

export default function SuperadminSupportChatPage() {
  const [conversations, setConversations] = useState<SuperadminSupportChatConversation[]>([])
  const [selected, setSelected] = useState<SuperadminSupportChatConversation | null>(null)
  const [messages, setMessages] = useState<SuperadminSupportChatMessage[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const selectedId = selected?.id

  const activeCount = useMemo(
    () => conversations.filter((item) => item.status !== "resolved").length,
    [conversations],
  )

  const loadConversation = async (id: string) => {
    const detail = await superadminApi.getSupportChatConversation(id)
    setSelected(detail)
    setMessages(detail.messages || [])
  }

  const loadConversations = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page_size: "50" }
      if (statusFilter) params.status = statusFilter
      const response = await superadminApi.getSupportChatConversations(params)
      setConversations(response.results)
      if (!selectedId && response.results[0]) {
        await loadConversation(response.results[0].id)
      }
    } catch (error: any) {
      toast.error(error.message || "Could not load live chat inbox")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [statusFilter])

  useEffect(() => {
    if (!selectedId) return
    const interval = window.setInterval(() => {
      loadConversation(selectedId).catch(() => undefined)
      loadConversations().catch(() => undefined)
    }, 10000)
    return () => window.clearInterval(interval)
  }, [selectedId, statusFilter])

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      const result = await superadminApi.replySupportChatConversation(selected.id, reply.trim())
      setReply("")
      setSelected(result.conversation)
      setMessages((current) => [...current, result.message])
      loadConversations()
    } catch (error: any) {
      toast.error(error.message || "Reply could not be sent")
    } finally {
      setSending(false)
    }
  }

  const updateConversation = async (data: Parameters<typeof superadminApi.updateSupportChatConversation>[1]) => {
    if (!selected) return
    try {
      const updated = await superadminApi.updateSupportChatConversation(selected.id, data)
      setSelected((current) => ({ ...(current || updated), ...updated, messages }))
      loadConversations()
    } catch (error: any) {
      toast.error(error.message || "Conversation could not be updated")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Headphones className="h-6 w-6 text-violet-400" />
            Live Support Chat
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Reply to tenant dashboard conversations and keep support context attached to the tenant account.
          </p>
        </div>
        <Button onClick={loadConversations} variant="outline" className="border-slate-700 text-slate-300">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Inbox</CardTitle>
            <CardDescription>{activeCount} active conversation{activeCount === 1 ? "" : "s"}</CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              {STATUS_FILTERS.map((item) => (
                <Button
                  key={item.label}
                  type="button"
                  size="sm"
                  variant={statusFilter === item.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(item.value)}
                  className={statusFilter === item.value ? "" : "border-slate-700 text-slate-300"}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="max-h-[68vh] space-y-2 overflow-y-auto">
            {loading && <p className="text-sm text-slate-500">Loading conversations...</p>}
            {!loading && conversations.length === 0 && (
              <p className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">No conversations in this view.</p>
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => loadConversation(conversation.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selected?.id === conversation.id
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{conversation.tenant_name || conversation.tenant_subdomain}</p>
                    <p className="truncate text-xs text-slate-500">{conversation.subject || conversation.category}</p>
                  </div>
                  <Badge className={statusBadgeClass(conversation.status)}>{conversation.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-400">{conversation.last_message_preview || "No messages yet"}</p>
                <p className="mt-2 text-[11px] text-slate-600">{timeAgo(conversation.last_message_at)}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          {selected ? (
            <>
              <CardHeader className="border-b border-slate-800">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle className="text-white">{selected.tenant_name || selected.tenant_subdomain}</CardTitle>
                    <CardDescription>
                      {selected.category} - {selected.created_by_name || selected.created_by_email || "Tenant admin"} - {selected.tenant_subdomain}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateConversation({ assigned_to_me: true })} className="border-slate-700 text-slate-300">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Assign to me
                    </Button>
                    <Button size="sm" onClick={() => updateConversation({ status: "resolved" })} className="bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex h-[68vh] flex-col p-0">
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => {
                    const mine = message.sender_type === "superadmin"
                    return (
                      <div key={message.id} className={mine ? "text-right" : "text-left"}>
                        <div className={`inline-block max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100"}`}>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{message.sender_name || (mine ? "Netily" : "Tenant")}</p>
                          <p className="whitespace-pre-line">{message.body}</p>
                          <p className="mt-1 text-[10px] opacity-60">{timeAgo(message.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-slate-800 p-4">
                  <Textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Reply to the tenant..."
                    rows={3}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button onClick={sendReply} disabled={sending || !reply.trim()}>
                      {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">
              Select a conversation to reply.
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
