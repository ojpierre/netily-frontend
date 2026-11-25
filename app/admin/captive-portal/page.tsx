"use client"

// Captive Portal shortcut: the portal is set per router, so pick a router first and land
// straight on its Portal Settings tab. With a single router we go there directly.

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ExternalLink, Loader2, MonitorSmartphone, Palette, Search, Wifi, WifiOff } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import type { Router } from "@/lib/types"
import { portalThemeName } from "@/app/hotspot/[router_id]/theme-engine"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const settingsHref = (id: number) => `/admin/routers/${id}?tab=portal-settings`

export default function CaptivePortalPage() {
  const router = useRouter()
  const [routers, setRouters] = useState<Router[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    adminApi
      .getRouters({ page_size: "200" })
      .then((res) => {
        const list = Array.isArray(res) ? (res as Router[]) : res.results || []
        setRouters(list)
        if (list.length === 1) router.replace(settingsHref(list[0].id))
      })
      .catch(() => setError("Couldn't load your routers. Check your connection and try again."))
  }, [router])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = routers || []
    const sorted = [...list].sort((a, b) => Number(!!b.enable_hotspot) - Number(!!a.enable_hotspot) || a.name.localeCompare(b.name))
    if (!q) return sorted
    return sorted.filter((r) => [r.name, r.hotspot_name, r.location, r.ip_address].some((v) => v?.toLowerCase().includes(q)))
  }, [routers, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MonitorSmartphone className="h-6 w-6 text-primary" />
            Captive Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each router has its own Wi-Fi login page. Pick a router to change its theme, logo, plans display and announcement.
          </p>
        </div>
        {routers && routers.length > 4 && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search routers" className="pl-9" aria-label="Search routers" />
          </div>
        )}
      </div>

      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      {!routers && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      )}

      {routers && routers.length === 1 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening {routers[0].name}…
        </p>
      )}

      {routers && routers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Wifi className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No routers yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">Add a router first; its captive portal can then be styled here.</p>
            <Button asChild>
              <Link href="/admin/routers">Go to Routers</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {routers && routers.length > 1 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const online = r.status === "online"
            return (
              <Card key={r.id} className="group overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.hotspot_name ? `Shown as “${r.hotspot_name}”` : r.location || r.ip_address}
                      </p>
                    </div>
                    <Badge variant="outline" className={online ? "border-emerald-500/40 text-emerald-600" : "text-muted-foreground"}>
                      {online ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
                      {online ? "Online" : r.status || "Offline"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                      <Palette className="h-3 w-3" /> {portalThemeName(r.template_id)}
                    </span>
                    {!r.enable_hotspot && <span className="rounded-full bg-muted px-2 py-1">Hotspot off</span>}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={settingsHref(r.id)}>
                        Portal settings <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="icon" aria-label={`Open ${r.name} portal`} title="Open the live portal">
                      <a href={`/hotspot/${r.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No routers match “{query}”.</p>}
        </div>
      )}
    </div>
  )
}
