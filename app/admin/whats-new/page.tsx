"use client"

import { useEffect, useMemo, useState } from "react"
import { Bug, CalendarDays, CheckCircle2, Loader2, RefreshCw, Sparkles, Wrench } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import type { PlatformChangelog } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const typeMeta = {
  feature: { label: "New feature", icon: Sparkles, className: "border-primary/25 bg-primary/10 text-primary" },
  improvement: { label: "Improvement", icon: Wrench, className: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  bugfix: { label: "Fix", icon: Bug, className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
} as const

const monthLabel = (value: string) => new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(value))
const dateLabel = (value: string) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))

export default function WhatsNewPage() {
  const [logs, setLogs] = useState<PlatformChangelog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try { setLogs(await adminApi.getPlatformChangelogs()) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load product updates.") }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const grouped = useMemo(() => {
    const months = new Map<string, PlatformChangelog[]>()
    logs.forEach((log) => {
      const month = monthLabel(log.release_date)
      months.set(month, [...(months.get(month) || []), log])
    })
    return Array.from(months.entries())
  }, [logs])

  return <main className="mx-auto w-full max-w-5xl space-y-8 px-1 py-2 sm:px-2">
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold text-primary">Product updates</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">What&apos;s new in Internetily</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">New capabilities, operational improvements, and fixes that affect your team&apos;s daily work.</p></div>
      <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button>
    </header>

    {error && <Alert variant="destructive"><AlertDescription className="flex items-center justify-between gap-3"><span>{error}</span><Button type="button" variant="outline" size="sm" onClick={() => void load()}>Try again</Button></AlertDescription></Alert>}

    {loading && logs.length === 0 ? <div className="space-y-6" aria-label="Loading product updates">{[1, 2, 3].map((item) => <div key={item} className="animate-pulse border-b border-border pb-6"><div className="h-4 w-32 rounded bg-muted" /><div className="mt-4 h-6 w-2/3 rounded bg-muted" /><div className="mt-3 h-4 w-full rounded bg-muted" /></div>)}</div>
      : grouped.length === 0 && !error ? <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 text-center"><CheckCircle2 className="h-8 w-8 text-muted-foreground" /><h2 className="mt-3 text-lg font-semibold">You&apos;re up to date</h2><p className="mt-1 text-sm text-muted-foreground">There are no published release notes yet.</p></div>
      : <div className="space-y-10">{grouped.map(([month, releases]) => { const sectionId = `release-${month.replace(/\s+/g, "-").toLowerCase()}`; return <section key={month} aria-labelledby={sectionId}><div className="mb-4 flex items-center gap-3"><CalendarDays className="h-4 w-4 text-muted-foreground" /><h2 id={sectionId} className="text-sm font-semibold text-foreground">{month}</h2><Separator className="flex-1" /></div><div className="divide-y divide-border border-y border-border">{releases.map((log) => { const meta = typeMeta[log.update_type as keyof typeof typeMeta] || typeMeta.improvement; const Icon = meta.icon; return <article key={log.id} className="grid gap-4 py-6 sm:grid-cols-[9rem_minmax(0,1fr)]"><div><time className="text-sm font-medium text-foreground" dateTime={log.release_date}>{dateLabel(log.release_date)}</time>{log.version && <p className="mt-1 font-mono text-xs text-muted-foreground">{log.version}</p>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={meta.className}><Icon className="mr-1 h-3.5 w-3.5" />{meta.label}</Badge><h3 className="text-lg font-semibold leading-7 text-foreground">{log.title}</h3></div><div className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{log.content}</div></div></article> })}</div></section> })}</div>}
  </main>
}
