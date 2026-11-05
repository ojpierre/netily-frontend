"use client"

import { type FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowRight, ArrowUp, Loader2, Minus, Rocket, Sparkles } from "lucide-react"
import { AssistantMessage } from "@/components/assistant-message"
import { WanderingEyes } from "@/components/ui/wandering-eyes"

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  followUps?: string[]
  link?: { href: string; label: string }
}

const STORAGE_KEY = "internetily-assistant-v2"
const HEADER_OFFSET = 90
// Kept short so the placeholder is never clipped, even on small phones.
const EXAMPLES = [
  "M-Pesa auto-reconnect",
  "hotspot vouchers",
  "MikroTik PPPoE billing",
  "SMS expiry reminders",
  "revenue per router",
  "remote router fixes",
]
// Short labels in the hero; each sends a full question to the assistant.
const HERO_CHIPS = [
  { label: "M-Pesa auto-reconnect", question: "Auto-reconnect customers after M-Pesa payment" },
  { label: "Hotspot vouchers", question: "Sell hotspot vouchers through agents" },
  { label: "Pricing", question: "What does it cost for 200 subscribers?" },
]
const STARTERS = [
  "Auto-reconnect customers after M-Pesa payment",
  "Sell hotspot vouchers through agents",
  "Manage MikroTik PPPoE subscribers",
  "What does it cost for 200 subscribers?",
]

const newId = () => Math.random().toString(36).slice(2, 10)

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function loadMessages(): Message[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]")
    return Array.isArray(saved) ? saved.slice(-20) : []
  } catch {
    return []
  }
}

export function HeroAssistant() {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [heroInput, setHeroInput] = useState("")
  const [dockInput, setDockInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [docked, setDocked] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [example, setExample] = useState(0)
  const [heroFocused, setHeroFocused] = useState(false)

  const heroRef = useRef<HTMLFormElement | null>(null)
  const dockRef = useRef<HTMLDivElement | null>(null)
  const dockInputRef = useRef<HTMLInputElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const flipFrom = useRef<DOMRect | null>(null)
  const heroVisible = useRef(true)
  const expandedRef = useRef(false)
  const dockedRef = useRef(false)
  const messagesRef = useRef<Message[]>([])

  expandedRef.current = expanded
  dockedRef.current = docked
  messagesRef.current = messages

  useEffect(() => {
    setMounted(true)
    setMessages(loadMessages())
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)))
    } catch {
      // Storage can be unavailable in private windows; the chat still works.
    }
  }, [messages, mounted])

  // Cycle the example in the placeholder while the bar is idle.
  useEffect(() => {
    if (heroFocused || heroInput || prefersReducedMotion()) return
    const timer = window.setInterval(() => setExample((value) => (value + 1) % EXAMPLES.length), 3200)
    return () => window.clearInterval(timer)
  }, [heroFocused, heroInput])

  const dock = useCallback((expand: boolean) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (rect) {
      // Clamp to the viewport so a bar that scrolled off the top still "flies" in visibly.
      flipFrom.current = new DOMRect(rect.left, Math.max(rect.top, HEADER_OFFSET), rect.width, rect.height)
    }
    setDocked(true)
    if (expand) setExpanded(true)
  }, [])

  // Move to the side when the hero bar scrolls out of view; return when it is back.
  useEffect(() => {
    const target = heroRef.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible.current = entry.isIntersecting
      if (!entry.isIntersecting && entry.boundingClientRect.top < HEADER_OFFSET) {
        if (!dockedRef.current) dock(false)
      } else if (entry.isIntersecting && !expandedRef.current) {
        setDocked(false)
      }
    }, { rootMargin: `-${HEADER_OFFSET}px 0px 0px 0px`, threshold: 0 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [dock])

  // FLIP: animate the dock from where the hero bar was to its sticky corner.
  useLayoutEffect(() => {
    const from = flipFrom.current
    const element = dockRef.current
    if (!docked || !from || !element) return
    flipFrom.current = null
    if (prefersReducedMotion()) return
    const to = element.getBoundingClientRect()
    if (!to.width || !to.height) return
    const dx = from.left - to.left
    const dy = from.top - to.top
    const sx = Math.max(from.width / to.width, 0.2)
    const sy = Math.max(from.height / to.height, 0.2)
    element.animate(
      [
        { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.35, borderRadius: "18px" },
        { transformOrigin: "top left", transform: "none", opacity: 1 },
      ],
      { duration: 560, easing: "cubic-bezier(.22, 1, .36, 1)" },
    )
  }, [docked, expanded])

  useEffect(() => {
    if (!expanded) return
    endRef.current?.scrollIntoView({ block: "end", behavior: prefersReducedMotion() ? "auto" : "smooth" })
  }, [messages, busy, expanded])

  useEffect(() => {
    if (!expanded) return
    const timer = window.setTimeout(() => dockInputRef.current?.focus({ preventScroll: true }), 380)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") collapse()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  function collapse() {
    setExpanded(false)
    if (heroVisible.current) setDocked(false)
  }

  async function ask(raw: string, from: "hero" | "dock") {
    const text = raw.trim().slice(0, 600)
    if (!text || busy) return
    if (from === "hero") {
      setHeroInput("")
      dock(true)
    } else {
      setDockInput("")
    }
    const history = messagesRef.current.map(({ role, text: body }) => ({ role, text: body }))
    setMessages((current) => [...current, { id: newId(), role: "user", text }])
    setBusy(true)
    try {
      const response = await fetch("/internal-api/sales-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await response.json().catch(() => ({}))
      setMessages((current) => [...current, {
        id: newId(),
        role: "assistant",
        text: data.answer || "Internetily can help with that. Tell me a bit more about your network and I'll show you how.",
        followUps: Array.isArray(data.followUps) ? data.followUps.slice(0, 3) : undefined,
        link: data.link?.href ? data.link : undefined,
      }])
    } catch {
      setMessages((current) => [...current, {
        id: newId(),
        role: "assistant",
        text: "I couldn't reach the server just now. Try again in a moment, or chat with the team on **WhatsApp** for an instant reply.",
      }])
    } finally {
      setBusy(false)
    }
  }

  function startTrial() {
    const asked = messagesRef.current.filter((item) => item.role === "user").map((item) => `- ${item.text}`).join("\n")
    const message = `I'd like to start a free trial of Internetily.${asked ? `\n\nWhat I asked the assistant:\n${asked}` : ""}`.slice(0, 4000)
    window.dispatchEvent(new CustomEvent("netily:start-trial", { detail: { message } }))
    setExpanded(false)
    const form = document.getElementById("contact")
    if (form) {
      form.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" })
    } else {
      window.location.href = `/?interest=trial&message=${encodeURIComponent(message)}#contact`
    }
  }

  function submitHero(event: FormEvent) {
    event.preventDefault()
    if (heroInput.trim()) void ask(heroInput, "hero")
    else dock(true)
  }

  const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant")
  const hasReply = Boolean(lastAssistant)

  const dockLayer = mounted && docked ? createPortal(
    <div
      ref={dockRef}
      className={
        expanded
          ? "fixed inset-x-3 bottom-22 z-85 flex h-[min(72dvh,600px)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl shadow-zinc-950/25 sm:inset-x-auto sm:right-5 sm:w-[400px] md:bottom-23 md:right-6 md:h-[min(620px,calc(100dvh-8rem))] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          : "fixed bottom-22 right-5 z-85 md:bottom-23 md:right-6"
      }
      role={expanded ? "dialog" : undefined}
      aria-label={expanded ? "Internetily assistant" : undefined}
    >
      {expanded ? (
        <>
          <header className="flex items-center gap-3 border-b border-zinc-200 bg-[#0b2a3c] px-4 py-3 text-white dark:border-zinc-800">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-sky-400 to-emerald-400 text-[#0b2a3c]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Internetily assistant</p>
              <p className="flex items-center gap-1.5 text-xs text-sky-100/80"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Answers in seconds</p>
            </div>
            <button type="button" onClick={collapse} className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Minimise assistant">
              <Minus className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 text-sm dark:bg-zinc-800">
                  Hi! Tell me what you expect your ISP system to do, and I'll show you how Internetily handles it.
                </div>
                <Chips items={STARTERS} onPick={(item) => void ask(item, "dock")} disabled={busy} />
              </div>
            )}

            {messages.map((item) => item.role === "user" ? (
              <div key={item.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-[#0874cf] px-3.5 py-2.5 text-sm text-white">{item.text}</p>
              </div>
            ) : (
              <div key={item.id} className="space-y-2">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2.5 text-sm dark:bg-zinc-800">
                  <AssistantMessage text={item.text} />
                  {item.link && (
                    <Link href={item.link.href} onClick={() => setExpanded(false)} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0874cf] hover:underline dark:text-sky-400">
                      {item.link.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
                {item.id === lastAssistant?.id && !busy && item.followUps?.length ? (
                  <Chips items={item.followUps} onPick={(choice) => void ask(choice, "dock")} disabled={busy} />
                ) : null}
              </div>
            ))}

            {busy && (
              <div className="inline-flex items-center gap-2.5 rounded-2xl rounded-tl-sm bg-zinc-100 py-2 pl-3 pr-3.5 text-[#0874cf] dark:bg-zinc-800 dark:text-sky-400">
                <WanderingEyes className="w-9" duration="4s" label="Assistant is thinking" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400" aria-hidden="true">Thinking…</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {hasReply && (
            <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-sky-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-sky-950/30">
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Ready to see it on your network?</p>
              <button type="button" onClick={startTrial} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-xs font-semibold text-white transition hover:bg-emerald-700">
                <Rocket className="h-3.5 w-3.5" /> Start your free trial
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => { event.preventDefault(); void ask(dockInput, "dock") }}
            className="flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
          >
            <label htmlFor="assistant-dock-input" className="sr-only">Ask the Internetily assistant</label>
            <input
              id="assistant-dock-input"
              ref={dockInputRef}
              value={dockInput}
              onChange={(event) => setDockInput(event.target.value)}
              maxLength={600}
              placeholder="Ask about billing, routers, hotspot…"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#0874cf] focus:ring-2 focus:ring-[#0874cf]/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button type="submit" disabled={busy || !dockInput.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0874cf] text-white transition hover:bg-[#0663b0] disabled:opacity-40" aria-label="Send">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </form>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group flex h-14 items-center gap-3 rounded-full bg-[#0b2a3c] pl-2 pr-2 text-left text-white shadow-2xl shadow-sky-950/30 ring-1 ring-white/15 transition hover:-translate-y-0.5 sm:pr-5"
          aria-label="Open the Internetily assistant"
        >
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-sky-400 to-emerald-400 text-[#0b2a3c]">
            <Sparkles className="h-5 w-5" />
            {hasReply && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0b2a3c] bg-emerald-400" />}
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold leading-tight">{hasReply ? "Continue the chat" : "Ask Internetily AI"}</span>
            <span className="block text-xs text-sky-100/75">What should your ISP system do?</span>
          </span>
        </button>
      )}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <div className="w-full max-w-xl">
        <form
          ref={heroRef}
          onSubmit={submitHero}
          className="rounded-2xl bg-linear-to-r from-sky-400 via-cyan-300 to-emerald-400 p-0.5 shadow-[0_16px_44px_-14px_rgba(56,189,248,0.6)]"
        >
          <div className="flex items-center gap-2 rounded-[14px] bg-white py-1.5 pl-3 pr-1.5 dark:bg-zinc-950">
            <Sparkles className="h-5 w-5 shrink-0 text-sky-500" aria-hidden="true" />
            <label htmlFor="assistant-hero-input" className="sr-only">Search what you expect your ISP system to do</label>
            <input
              id="assistant-hero-input"
              value={heroInput}
              onChange={(event) => setHeroInput(event.target.value)}
              onFocus={() => setHeroFocused(true)}
              onBlur={() => setHeroFocused(false)}
              maxLength={600}
              autoComplete="off"
              enterKeyHint="send"
              placeholder={`Search: ${EXAMPLES[example]}`}
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            />
            <button type="submit" disabled={busy} aria-label="Ask Internetily AI" className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0874cf] px-3.5 text-sm font-semibold text-white transition hover:bg-[#0663b0] disabled:opacity-60 sm:px-4">
              <span className="hidden sm:inline">Ask AI</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-xs text-sky-100/70">Try</span>
          {HERO_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => void ask(chip.question, "hero")}
              disabled={busy}
              className="h-8 shrink-0 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-medium text-white backdrop-blur transition hover:border-white/45 hover:bg-white/20 disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
      {dockLayer}
    </>
  )
}

function Chips({ items, onPick, disabled }: { items: string[]; onPick: (item: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          disabled={disabled}
          className="rounded-full border border-[#0874cf]/30 bg-white px-3 py-1.5 text-left text-xs font-medium text-[#0874cf] transition hover:border-[#0874cf] hover:bg-sky-50 disabled:opacity-50 dark:border-sky-400/30 dark:bg-zinc-900 dark:text-sky-300 dark:hover:bg-zinc-800"
        >
          {item}
        </button>
      ))}
    </div>
  )
}
