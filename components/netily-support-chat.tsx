"use client"

import { useState } from "react"
import { Bot, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ChatMessage = {
  role: "user" | "assistant"
  text: string
  sources?: { title: string; source: string; score: number }[]
  requestId?: string
  provider?: string
  model?: string
  diagnostics?: {
    reason?: string
    error?: string
    keyEnv?: string
    modelsTried?: string[]
    expectedEnv?: string[]
  }
}

type SupportChatResponse = {
  answer: string
  sources?: { title: string; source: string; score: number }[]
  blocked?: boolean
  requestId?: string
  provider?: string
  model?: string
  diagnostics?: ChatMessage["diagnostics"]
}

const STARTER: ChatMessage = {
  role: "assistant",
  text: "Hi! 👋 I'm the Netily assistant. Ask me anything about getting started, managing your ISP, routers, billing, hotspot, SMS, or any feature in the platform.",
}

const SUGGESTED_PROMPTS = [
  "How do I connect my first router?",
  "How does billing work for my customers?",
  "How do I set up hotspot vouchers?",
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
      const res = await fetch("/internal-api/docs-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
      const data: SupportChatResponse = await res.json()
      if (!res.ok) {
        console.error("[netily-support-chat] request failed", {
          status: res.status,
          requestId: data.requestId,
          answer: data.answer,
        })
        throw new Error(data.answer || "Support chat failed")
      }
      if (data.provider === "local") {
        console.warn(
          `[netily-support-chat] local fallback reason=${data.diagnostics?.reason || "unknown"} error=${data.diagnostics?.error || "none"}`,
        )
        console.warn("[netily-support-chat] using local fallback", {
          requestId: data.requestId,
          sources: data.sources,
          diagnostics: data.diagnostics,
        })
      } else {
        console.info("[netily-support-chat] answer received", {
          requestId: data.requestId,
          provider: data.provider,
          model: data.model,
          sources: data.sources,
        })
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.answer || "I don't have a specific answer for that yet. Please contact our support team at netily.co.ke for help.",
          sources: data.sources || [],
          requestId: data.requestId,
          provider: data.provider,
          model: data.model,
          diagnostics: data.diagnostics,
        },
      ])
    } catch (error) {
      console.error("[netily-support-chat] network error", error)
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I'm having trouble connecting right now. Please try again in a moment, or reach out to us at netily.co.ke.",
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
          <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-950 to-blue-950 px-4 py-3 text-white dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-white/10 p-2">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">Netily Assistant</p>
                <p className="text-xs text-blue-100">Ask me anything about the platform</p>
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
                    {item.requestId ? ` · ${item.provider || "assistant"}${item.model ? `/${item.model}` : ""} · ${item.requestId}` : ""}
                    {item.diagnostics?.reason ? ` · ${item.diagnostics.reason}` : ""}
                  </p>
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-900">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Thinking...
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
              Powered by Netily Docs · Answers are based on our help content.
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
