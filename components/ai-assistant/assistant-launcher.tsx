"use client"

import React, { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"
import { aiApi, type AiStatus } from "@/lib/ai-assistant-api"
import { AssistantPanel } from "./assistant-panel"

const MISS_KEY = "netily-ai-status-miss"
const MISS_TTL_MS = 10 * 60 * 1000

function recentlyMissed() {
  try {
    const t = Number(sessionStorage.getItem(MISS_KEY))
    return !!t && Date.now() - t < MISS_TTL_MS
  } catch {
    return false
  }
}

/**
 * Floating "Netily Assistant" button + side panel. Renders nothing until
 * /ai/status/ reports `enabled: true` (hidden on 404 / 401 / 403 / network errors).
 * Mounted once in app/admin/layout.tsx. Shortcut: Ctrl/Cmd+J.
 */
export function AssistantLauncher() {
  const pathname = usePathname()
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (recentlyMissed()) return
    let alive = true
    aiApi
      .getStatus()
      .then((s) => {
        if (!alive) return
        if (s && s.enabled) setStatus(s)
      })
      .catch(() => {
        try {
          sessionStorage.setItem(MISS_KEY, String(Date.now()))
        } catch {
          /* storage unavailable */
        }
      })
    return () => {
      alive = false
    }
  }, [])

  const available = !!status
  useEffect(() => {
    if (!available) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "j") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [available])

  if (!status) return null

  return (
    <>
      {/* Sits directly above the Support chat button (fixed bottom-5 right-5) */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Netily Assistant"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+J Meta+J"
        title="Netily Assistant (Ctrl+J)"
        className="group fixed bottom-[4.75rem] right-5 z-40 flex h-11 items-center gap-2 rounded-full border border-primary/25 bg-background pl-3 pr-3 text-sm font-semibold text-primary shadow-lg shadow-primary/15 outline-none transition hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
      >
        <Sparkles className="h-[18px] w-[18px] transition-transform group-hover:rotate-12 motion-reduce:transition-none" aria-hidden />
        <span className="hidden sm:inline">Assistant</span>
      </button>
      <AssistantPanel
        open={open}
        onOpenChange={setOpen}
        status={status}
        pathname={pathname}
        returnFocusRef={buttonRef}
      />
    </>
  )
}
