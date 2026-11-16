"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bug, Sparkles, Wrench, ShieldCheck } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import type { PlatformChangelog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Plain-language meaning of each changelog type, so tenants know whether to act.
const TYPE_META = {
  feature: { label: "New feature", meaning: "Something new you can start using today.", icon: Sparkles, tone: "text-primary bg-primary/10" },
  improvement: { label: "Improvement", meaning: "Something you already use now works better.", icon: Wrench, tone: "text-blue-700 bg-blue-500/10 dark:text-blue-300" },
  bugfix: { label: "Fix", meaning: "A problem has been fixed. Nothing for you to do.", icon: Bug, tone: "text-amber-700 bg-amber-500/10 dark:text-amber-300" },
  maintenance: { label: "Maintenance", meaning: "Behind-the-scenes work to keep things fast and reliable.", icon: ShieldCheck, tone: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300" },
} as const

const MAX_ITEMS = 3
const FIRST_VISIT_WINDOW_DAYS = 14

type PopupUser = { id?: number | string | null; email?: string | null } | null | undefined

function storageKeys(user: PopupUser) {
  const who = String(user?.id ?? user?.email ?? "anon")
  return { seen: `netily:whats-new:last-seen:${who}`, session: `netily:whats-new:shown:${who}` }
}

/** Changelog content is markdown or HTML; the popup only needs a short plain-text summary. */
function summarize(content: string, max = 150) {
  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text
}

function read(store: Storage, key: string) {
  try { return store.getItem(key) } catch { return null }
}
function write(store: Storage, key: string, value: string) {
  try { store.setItem(key, value) } catch { /* private mode: popup just shows again next time */ }
}

export function WhatsNewPopup({ user, disabled }: { user: PopupUser; disabled?: boolean }) {
  const [updates, setUpdates] = useState<PlatformChangelog[]>([])
  const [open, setOpen] = useState(false)
  const keys = storageKeys(user)

  useEffect(() => {
    if (disabled || !user) return
    // Once per login session; a fresh login (new session) checks again.
    if (read(sessionStorage, keys.session)) return
    write(sessionStorage, keys.session, "1")

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const logs = (await adminApi.getPlatformChangelogs()).filter((log) => log.is_published !== false)
        const lastSeen = Number(read(localStorage, keys.seen) || 0)
        const cutoff = Date.now() - FIRST_VISIT_WINDOW_DAYS * 86_400_000
        const unseen = logs
          .filter((log) => (lastSeen ? log.id > lastSeen : new Date(log.release_date).getTime() >= cutoff))
          .sort((a, b) => b.id - a.id)
        const newestId = Math.max(lastSeen, ...logs.map((log) => log.id))
        if (!unseen.length) {
          if (newestId) write(localStorage, keys.seen, String(newestId))
          return
        }
        if (!cancelled) { setUpdates(unseen); setOpen(true) }
      } catch {
        // Updates are a nice-to-have; never block the dashboard.
      }
    }, 1200)
    return () => { cancelled = true; window.clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, user?.id, user?.email])

  const close = () => {
    const newest = Math.max(0, ...updates.map((u) => u.id))
    if (newest) write(localStorage, keys.seen, String(Math.max(newest, Number(read(localStorage, keys.seen) || 0))))
    setOpen(false)
  }

  if (!updates.length) return null
  const shown = updates.slice(0, MAX_ITEMS)
  const extra = updates.length - shown.length

  return <Dialog open={open} onOpenChange={(next) => { if (!next) close() }}>
    <DialogContent className="max-w-md gap-5">
      <DialogHeader>
        <DialogTitle>{updates.length === 1 ? "There's a new update" : `${updates.length} new updates`}</DialogTitle>
        <DialogDescription>Here&apos;s what changed in Internetily since you last checked.</DialogDescription>
      </DialogHeader>

      <ul className="space-y-4">
        {shown.map((log) => {
          const meta = TYPE_META[log.update_type] || TYPE_META.improvement
          const Icon = meta.icon
          return <li key={log.id} className="flex gap-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}><Icon className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-foreground">{log.title}</p>
              {log.content && <p className="mt-1 text-sm leading-5 text-muted-foreground">{summarize(log.content)}</p>}
              <p className="mt-1.5 text-xs text-muted-foreground"><span className="font-medium text-foreground">{meta.label}:</span> {meta.meaning}</p>
            </div>
          </li>
        })}
      </ul>
      {extra > 0 && <p className="text-xs text-muted-foreground">+ {extra} more on the What&apos;s new page.</p>}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" asChild onClick={close}><Link href="/admin/whats-new">See all updates</Link></Button>
        <Button onClick={close}>Got it</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
