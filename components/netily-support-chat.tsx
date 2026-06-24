"use client"

import { useState } from "react"
import { Bot, Send, Sparkles, X } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"

type ChatMessage = {
  role: "user" | "assistant"
  text: string
  sources?: { title: string; source: string; score: number }[]
}

type SupportChatResponse = {
  answer: string
  sources?: { title: string; source: string; score: number }[]
  blocked?: boolean
}

const STARTER: ChatMessage = {
  role: "assistant",
  text: "Ask me about Netily onboarding, billing, routers, hotspot, leads, dispatch, or inventory. I only answer from approved support docs.",
}

const SUGGESTED_PROMPTS = [
  "How do I connect my first router?",
  "How is my monthly invoice calculated?",
  "Where do I manage leads?",
]

export function NetilySupportChat() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER])

  async function sendMessage(value = message) {
    const trimmed = value.trim()
    if (!trimmed || loading) return

    setMessage("")
    setMessages((current) => [...current, { role: "user", text: trimmed }])
    setLoading(true)

    try {
      const response = await adminApi.rawRequest<SupportChatResponse>("/core/support-chat/", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      })
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: response.answer || "I could not find an approved support answer for that yet.",
          sources: response.sources || [],
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not reach Netily Support Chat right now. Please try again in a moment.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[520px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-950 to-blue-950 px-4 py-3 text-white dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-white/10 p-2">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">Netily Support</p>
                <p className="text-xs text-blue-100">Approved onboarding help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-blue-100 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={item.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                    item.role === "user"
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  {item.text}
                </div>
                {item.sources?.length ? (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Source: {item.sources.map((source) => source.title).join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-900">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Searching approved docs...
              </div>
            )}
            {messages.length === 1 && !loading ? (
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-left text-xs font-semibold text-primary transition hover:border-primary/20 hover:bg-primary/15 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-primary/40"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-100 p-3 dark:border-slate-800">
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage()
                }}
                placeholder="Ask about billing, routers, hotspot..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ring focus:ring-2 dark:border-slate-800 dark:bg-slate-900"
              />
              <Button onClick={() => sendMessage()} disabled={loading || !message.trim()} size="icon" className="rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Safe mode: no architecture, credentials, or deployment answers.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition hover:bg-primary"
      >
        <Bot className="h-5 w-5" />
        Support
      </button>
    </div>
  )
}
