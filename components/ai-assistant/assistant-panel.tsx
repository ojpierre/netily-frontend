"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import {
  AlertCircle,
  ArrowUp,
  Check,
  ChevronLeft,
  Copy,
  Database,
  History,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react"
import {
  aiApi,
  AiApiError,
  describeAiError,
  type AiChatMessage,
  type AiClient,
  type AiConversationSummary,
  type AiInsight,
  type AiSource,
  type AiStatus,
  type AiToolCall,
} from "@/lib/ai-assistant-api"
import { cn } from "@/lib/utils"
import { SafeMarkdown } from "./safe-markdown"
import { SEVERITY_STYLES, sortInsights } from "./insight-cards"

const MAX_CHARS = 2000

type Rating = "up" | "down"

interface UiMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: AiSource[]
  toolCalls?: AiToolCall[]
  fresh?: boolean
  rating?: Rating
  created_at?: string
}

export interface AssistantPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: AiStatus
  pathname?: string | null
  client?: AiClient
  /** Element to focus when the panel closes (the launcher). */
  returnFocusRef?: React.RefObject<HTMLElement | null>
  /** Preview/test hooks. */
  initialMessages?: UiMessage[]
  initialView?: "chat" | "history"
  initialInsights?: AiInsight[]
  initialConversations?: AiConversationSummary[]
}

let tempId = 0
const nextTemp = () => `tmp-${Date.now()}-${tempId++}`

function relTime(iso?: string) {
  if (!iso) return ""
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ""
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function AssistantPanel({
  open,
  onOpenChange,
  status,
  pathname,
  client = aiApi,
  returnFocusRef,
  initialMessages,
  initialView = "chat",
  initialInsights,
  initialConversations,
}: AssistantPanelProps) {
  const [view, setView] = useState<"chat" | "history">(initialView)
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages ?? [])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<{ err: unknown; text: string } | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [terminal, setTerminal] = useState<ReturnType<typeof describeAiError> | null>(null)
  const [insights, setInsights] = useState<AiInsight[]>(initialInsights ?? [])
  const [conversations, setConversations] = useState<AiConversationSummary[] | null>(initialConversations ?? null)
  const [historyError, setHistoryError] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Top insights for the empty state.
  useEffect(() => {
    if (!open || initialInsights || insights.length) return
    let alive = true
    client
      .getInsights()
      .then((r) => alive && setInsights(Array.isArray(r) ? sortInsights(r) : []))
      .catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Rate-limit countdown.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  // Keep latest content in view.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" })
  }, [messages, sending, error, view])

  // Autosize composer.
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input, view])

  const newChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
    setCooldown(0)
    setView("chat")
    setInput("")
    window.setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const send = useCallback(
    async (raw: string, opts?: { retry?: boolean }) => {
      const text = raw.trim().slice(0, MAX_CHARS)
      if (!text || sending) return
      setError(null)
      if (!opts?.retry) {
        setMessages((m) => [...m, { id: nextTemp(), role: "user", content: text }])
        setInput("")
      }
      setSending(true)
      try {
        const res = await client.chat({
          message: text,
          conversation_id: conversationId,
          page_context: pathname ?? null,
        })
        setConversationId(res.conversation_id)
        setMessages((m) => [
          ...m.map((x) => ({ ...x, fresh: false })),
          {
            id: res.message.id,
            role: "assistant",
            content: res.message.content,
            sources: res.message.sources,
            toolCalls: res.tool_calls,
            created_at: res.message.created_at,
            fresh: true,
          },
        ])
        setConversations(null)
      } catch (err) {
        const view = describeAiError(err)
        setError({ err, text })
        if (view.terminal) setTerminal(view)
        if (err instanceof AiApiError && err.code === "rate_limited") setCooldown(err.retryAfter ?? 15)
      } finally {
        setSending(false)
      }
    },
    [client, conversationId, pathname, sending],
  )

  const loadHistory = useCallback(async () => {
    setHistoryError(false)
    setConversations(null)
    try {
      setConversations(await client.listConversations())
    } catch {
      setHistoryError(true)
    }
  }, [client])

  const openHistory = () => {
    setView("history")
    if (!initialConversations) void loadHistory()
  }

  const openConversation = async (id: string) => {
    setOpeningId(id)
    try {
      const detail = await client.getConversation(id)
      setMessages(
        detail.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          created_at: m.created_at,
        })),
      )
      setConversationId(detail.id)
      setError(null)
      setView("chat")
    } catch {
      setHistoryError(true)
    } finally {
      setOpeningId(null)
    }
  }

  const removeConversation = async (id: string) => {
    const prev = conversations
    setConversations((c) => (c ? c.filter((x) => x.id !== id) : c))
    if (id === conversationId) {
      setMessages([])
      setConversationId(null)
    }
    try {
      await client.deleteConversation(id)
    } catch {
      setConversations(prev)
    }
  }

  const rate = (id: string, rating: Rating, reason?: string) => {
    const prev = messages.find((m) => m.id === id)?.rating
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating } : x)))
    client.sendFeedback({ message_id: id, rating, ...(reason ? { reason: reason.slice(0, 300) } : {}) }).catch(() => {
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating: prev } : x)))
    })
  }

  const errorView = error ? describeAiError(error.err) : null
  const disabledView = terminal
  const empty = messages.length === 0 && !sending
  const canSend = !!input.trim() && !sending && !disabledView && cooldown === 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          aria-describedby="netily-ai-notice"
          onCloseAutoFocus={(e) => {
            if (returnFocusRef?.current) {
              e.preventDefault()
              returnFocusRef.current.focus()
            }
          }}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            textareaRef.current?.focus()
          }}
          className="fixed inset-y-0 right-0 z-[61] flex h-dvh w-full flex-col overflow-hidden border-l border-border bg-background text-foreground shadow-2xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-200 data-[state=open]:duration-300 motion-reduce:animate-none sm:max-w-[460px]"
        >
          {/* Header */}
          <header className="flex items-center gap-2 border-b border-border bg-card/60 px-3 py-2.5 sm:px-4">
            {view === "history" ? (
              <button
                type="button"
                onClick={() => setView("chat")}
                aria-label="Back to chat"
                className="rounded-lg p-1.5 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <Dialog.Title className="flex items-center gap-2 text-sm font-semibold leading-none">
                {view === "history" ? "Conversations" : "Netily Assistant"}
                {view === "chat" ? (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Beta
                  </span>
                ) : null}
              </Dialog.Title>
              <p className="mt-1 truncate text-xs text-muted-foreground">{status.tenant_name}</p>
            </div>
            <HeaderButton label="New chat" onClick={newChat} disabled={!messages.length && !conversationId}>
              <MessageSquarePlus className="h-4 w-4" />
            </HeaderButton>
            <HeaderButton label="History" onClick={view === "history" ? () => setView("chat") : openHistory} active={view === "history"}>
              <History className="h-4 w-4" />
            </HeaderButton>
            <Dialog.Close
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </header>

          <Dialog.Description id="netily-ai-notice" className="flex items-start gap-2 border-b border-border bg-muted/40 px-4 py-2 text-[11px] leading-snug text-muted-foreground">
            <Database className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>{status.notice}</span>
          </Dialog.Description>

          {view === "history" ? (
            <HistoryList
              items={conversations}
              error={historyError}
              activeId={conversationId}
              openingId={openingId}
              onOpen={openConversation}
              onDelete={removeConversation}
              onRetry={loadHistory}
              onNew={newChat}
            />
          ) : (
            <>
              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite" aria-busy={sending}>
                {empty && !error ? (
                  <EmptyState
                    status={status}
                    insights={insights}
                    disabled={!!disabledView}
                    onPick={(t) => send(t)}
                  />
                ) : (
                  <ol className="space-y-5">
                    {messages.map((m) => (
                      <li key={m.id}>
                        {m.role === "user" ? (
                          <UserBubble text={m.content} />
                        ) : (
                          <AssistantBubble
                            message={m}
                            onRate={rate}
                            onNavigate={() => onOpenChange(false)}
                          />
                        )}
                      </li>
                    ))}
                    {sending ? (
                      <li>
                        <Thinking tools={status.tools} />
                      </li>
                    ) : null}
                    {errorView && error ? (
                      <li>
                        <ErrorBlock
                          view={errorView}
                          cooldown={cooldown}
                          onRetry={() => send(error.text, { retry: true })}
                        />
                      </li>
                    ) : null}
                  </ol>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-border bg-card/40 px-3 pb-3 pt-2.5 sm:px-4">
                {disabledView ? (
                  <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">{disabledView.title}</p>
                      <p className="mt-0.5">{disabledView.detail}</p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (canSend) void send(input)
                    }}
                    className="flex items-end gap-2 rounded-2xl border border-border bg-background p-1.5 shadow-xs transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30"
                  >
                    <label htmlFor="netily-ai-input" className="sr-only">
                      Message Netily Assistant
                    </label>
                    <textarea
                      id="netily-ai-input"
                      ref={textareaRef}
                      value={input}
                      rows={1}
                      maxLength={MAX_CHARS}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          if (canSend) void send(input)
                        }
                      }}
                      placeholder="Ask about subscribers, payments, routers…"
                      className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-snug outline-none placeholder:text-muted-foreground/70"
                    />
                    <button
                      type="submit"
                      disabled={!canSend}
                      aria-label="Send message"
                      className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground outline-none transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                    </button>
                  </form>
                )}
                <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
                  <span>Enter to send, Shift+Enter for a new line. AI can make mistakes.</span>
                  <span className={cn("tabular-nums", input.length > MAX_CHARS * 0.9 && "font-medium text-amber-600 dark:text-amber-400")}>
                    {input.length > MAX_CHARS * 0.7 ? `${input.length}/${MAX_CHARS}` : null}
                  </span>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function HeaderButton({
  label,
  onClick,
  children,
  disabled,
  active,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "rounded-lg p-1.5 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function EmptyState({
  status,
  insights,
  disabled,
  onPick,
}: {
  status: AiStatus
  insights: AiInsight[]
  disabled: boolean
  onPick: (text: string) => void
}) {
  const top = sortInsights(insights).slice(0, 2)
  return (
    <div className="flex min-h-full flex-col justify-center gap-5 py-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
      <div>
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/15">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">How can I help {status.tenant_name}?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about subscribers, payments, routers or hotspot plans. I read your live data and show where each answer came from.
        </p>
      </div>

      {top.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Worth a look</p>
          <ul className="space-y-2">
            {top.map((i) => {
              const sev = SEVERITY_STYLES[i.severity] ?? SEVERITY_STYLES.info
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(`Tell me more: ${i.title}`)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left outline-none transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                      sev.card,
                    )}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot)} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug">
                        <span className="sr-only">{sev.label}: </span>
                        {i.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{i.body}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {status.suggestions.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {status.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => onPick(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-foreground outline-none transition hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
      <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm leading-relaxed text-primary-foreground">
        {text}
      </p>
    </div>
  )
}

function AssistantBubble({
  message,
  onRate,
  onNavigate,
}: {
  message: UiMessage
  onRate: (id: string, rating: Rating, reason?: string) => void
  onNavigate: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState("")

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const canRate = !message.id.startsWith("tmp-")

  return (
    <div className="flex gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        {message.toolCalls && message.toolCalls.length > 0 && message.fresh ? (
          <ToolActivity calls={message.toolCalls} />
        ) : null}
        <SafeMarkdown text={message.content} onNavigate={onNavigate} />

        {message.sources && message.sources.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sources</span>
            {message.sources.map((s) => (
              <span
                key={s.tool}
                title={s.tool}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <Database className="h-2.5 w-2.5" aria-hidden />
                {s.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-1.5 flex items-center gap-0.5 text-muted-foreground">
          <ActionIcon label={copied ? "Copied" : "Copy answer"} onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </ActionIcon>
          {canRate ? (
            <>
              <ActionIcon
                label="Helpful"
                pressed={message.rating === "up"}
                onClick={() => {
                  setReasonOpen(false)
                  onRate(message.id, "up")
                }}
              >
                <ThumbsUp className={cn("h-3.5 w-3.5", message.rating === "up" && "fill-current text-emerald-600")} />
              </ActionIcon>
              <ActionIcon
                label="Not helpful"
                pressed={message.rating === "down"}
                onClick={() => {
                  onRate(message.id, "down")
                  setReasonOpen(true)
                }}
              >
                <ThumbsDown className={cn("h-3.5 w-3.5", message.rating === "down" && "fill-current text-red-600")} />
              </ActionIcon>
            </>
          ) : null}
        </div>

        {reasonOpen && message.rating === "down" ? (
          <form
            className="mt-2 flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault()
              if (reason.trim()) onRate(message.id, "down", reason.trim())
              setReasonOpen(false)
            }}
          >
            <input
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              aria-label="What went wrong? (optional)"
              placeholder="What went wrong? (optional)"
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button type="submit" className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80">
              Send
            </button>
            <button type="button" onClick={() => setReasonOpen(false)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              Skip
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}

function ActionIcon({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  pressed?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className="rounded-md p-1.5 outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}

/** Tool labels the server reported, revealed in sequence once the answer arrives. */
function ToolActivity({ calls }: { calls: AiToolCall[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-1.5" aria-label="Data checked">
      {calls.map((c, i) => (
        <span
          key={`${c.tool}-${i}`}
          style={{ animationDelay: `${i * 140}ms`, animationFillMode: "backwards" }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] animate-in fade-in-0 zoom-in-95 duration-300 motion-reduce:animate-none",
            c.status === "ok" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            c.status === "denied" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
            c.status === "error" && "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
          )}
        >
          {c.status === "ok" ? <Check className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
          {c.status === "ok" ? "Checked" : c.status === "denied" ? "No access to" : "Couldn't read"} {c.label.toLowerCase()}
        </span>
      ))}
    </div>
  )
}

function Thinking({ tools }: { tools: { name: string; label: string }[] }) {
  const phrases = useMemo(() => {
    const labels = tools.slice(0, 4).map((t) => `Checking ${t.label.toLowerCase()}…`)
    return ["Thinking…", ...labels, "Putting it together…"]
  }, [tools])
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => Math.min(n + 1, phrases.length - 1)), 1800)
    return () => window.clearInterval(t)
  }, [phrases.length])

  return (
    <div className="flex items-center gap-2.5" role="status">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5 animate-pulse motion-reduce:animate-none" aria-hidden />
      </span>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        <span className="flex gap-0.5" aria-hidden>
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 motion-reduce:animate-none"
              style={{ animationDelay: `${d * 140}ms` }}
            />
          ))}
        </span>
        <span key={i} className="animate-in fade-in-0 duration-300 motion-reduce:animate-none">
          {phrases[i]}
        </span>
      </div>
    </div>
  )
}

function ErrorBlock({
  view,
  cooldown,
  onRetry,
}: {
  view: ReturnType<typeof describeAiError>
  cooldown: number
  onRetry: () => void
}) {
  return (
    <div role="alert" className="flex gap-2.5 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3 text-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{view.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{view.detail}</p>
        {view.retryable ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={cooldown > 0}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <RotateCcw className="h-3 w-3" />
            {cooldown > 0 ? `Retry in ${cooldown}s` : "Retry"}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function HistoryList({
  items,
  error,
  activeId,
  openingId,
  onOpen,
  onDelete,
  onRetry,
  onNew,
}: {
  items: AiConversationSummary[] | null
  error: boolean
  activeId: string | null
  openingId: string | null
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onRetry: () => void
  onNew: () => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
      {error ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          Couldn&apos;t load your conversations.
          <button type="button" onClick={onRetry} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
            Try again
          </button>
        </div>
      ) : items === null ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-14 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <History className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No conversations yet.</p>
          <button type="button" onClick={onNew} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            Start a chat
          </button>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((c) => (
            <li
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-xl border border-transparent px-1 transition hover:border-border hover:bg-muted/50",
                c.id === activeId && "border-border bg-muted/60",
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="flex min-w-0 flex-1 flex-col rounded-lg px-2.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="truncate text-sm font-medium">{c.title || "Untitled chat"}</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">
                  {openingId === c.id ? "Opening…" : `${relTime(c.updated_at)} · ${c.message_count} messages`}
                </span>
              </button>
              {confirmId === c.id ? (
                <span className="flex items-center gap-1 pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmId(null)
                      onDelete(c.id)
                    }}
                    className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button type="button" onClick={() => setConfirmId(null)} className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(c.id)}
                  aria-label={`Delete conversation: ${c.title}`}
                  className="rounded-md p-1.5 text-muted-foreground/70 opacity-100 outline-none transition hover:bg-red-500/10 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
