"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Headset, Loader2, MessageCircle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminApi } from "@/lib/admin-api"
import type { SupportChatConversation, SupportChatMessage } from "@/lib/types"

const CATEGORIES = ["Billing", "SMS", "M-Pesa", "Routers", "Hotspot", "PPPoE", "Account Access", "Other"]

function formatTime(value?: string | null) {
  if (!value) return ""
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function statusCopy(conversation: SupportChatConversation | null) {
  if (!conversation) return "Start a conversation with Netily Support"
  if (conversation.status === "waiting_on_tenant") return "Netily replied"
  if (conversation.status === "resolved") return "Conversation resolved"
  if (conversation.status === "new") return "New request received"
  return "Conversation open"
}

export function NetilySupportChat() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("Billing")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(false)
  const [error, setError] = useState("")
  const [conversation, setConversation] = useState<SupportChatConversation | null>(null)
  const [messages, setMessages] = useState<SupportChatMessage[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const unreadFromSupport = useMemo(() => {
    if (!messages.length) return false
    return messages[messages.length - 1]?.sender_type === "superadmin"
  }, [messages])

  const loadCurrent = async () => {
    setBooting(true)
    setError("")
    try {
      const data = await adminApi.getCurrentSupportChat()
      setConversation(data.conversation)
      setMessages(data.messages || [])
    } catch {
      setError("We could not load live support right now. You can try again in a moment.")
    } finally {
      setBooting(false)
    }
  }

  useEffect(() => {
    if (!open) return
    loadCurrent()
  }, [open])

  useEffect(() => {
    if (!open || !conversation?.id) return
    const interval = window.setInterval(async () => {
      try {
        const data = await adminApi.getSupportChatMessages(conversation.id)
        setConversation(data.conversation)
        setMessages(data.messages || [])
      } catch {
        // Polling should stay quiet; the next manual send/load can surface errors.
      }
    }, 10000)
    return () => window.clearInterval(interval)
  }, [open, conversation?.id])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, open])

  async function sendMessage(value = message) {
    const trimmed = value.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError("")
    setMessage("")

    try {
      if (!conversation) {
        const data = await adminApi.startSupportChat({
          category,
          subject: category,
          message: trimmed,
          priority: category === "M-Pesa" || category === "Account Access" ? "high" : "normal",
        })
        setConversation(data.conversation)
        setMessages(data.messages || [])
      } else {
        const data = await adminApi.sendSupportChatMessage(conversation.id, trimmed)
        setConversation(data.conversation)
        setMessages((current) => [...current, data.message])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent. Please try again.")
      setMessage(trimmed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[560px] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-slate-900/20">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-white/15 p-2">
                <Headset className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">Chat with Netily Support</p>
                <p className="text-xs text-primary-foreground/80">{statusCopy(conversation)}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-primary-foreground/80 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Tell us what you need help with. We will keep the conversation here so you can continue where you left off.
            </p>
            {!conversation && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      category === item
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {booting && (
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversation...
              </div>
            )}

            {!booting && messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Start with a short message. A Netily superadmin will reply here.
              </div>
            )}

            {messages.map((item) => {
              const mine = item.sender_type === "tenant"
              return (
                <div key={item.id} className={mine ? "text-right" : "text-left"}>
                  <div
                    className={`inline-block max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {!mine && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.sender_name || "Netily Support"}</p>}
                    <p className="whitespace-pre-line">{item.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatTime(item.created_at)}</p>
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {error && <div className="border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>}

          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage()
                }}
                placeholder={conversation ? "Reply to Netily Support..." : `Ask about ${category.toLowerCase()}...`}
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              />
              <Button onClick={() => sendMessage()} disabled={loading || !message.trim()} size="icon" className="rounded-xl">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {conversation ? "Replies refresh automatically every few seconds." : "For urgent payment issues, choose M-Pesa or Account Access."}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="relative flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/30 transition hover:bg-primary/90"
      >
        <MessageCircle className="h-5 w-5" />
        Support
        {unreadFromSupport && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />}
      </button>
    </div>
  )
}
