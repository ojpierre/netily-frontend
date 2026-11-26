"use client"

// PPPoE Captive Portal: pick the look of the customer portal (login, dashboard, invoices...)
// that this ISP's PPPoE subscribers use. The choice is stored per tenant.

import { useEffect, useMemo, useState } from "react"
import { Check, ExternalLink, LayoutTemplate, Loader2, Moon, Save, Sun } from "lucide-react"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import { safeStorage } from "@/lib/safe-storage"
import {
  DEFAULT_PORTAL_THEME,
  PORTAL_THEMES,
  PORTAL_THEME_STORAGE_KEY,
  getPortalTheme,
  normalizePortalTheme,
  type PortalThemeId,
  type PortalThemeMode,
} from "@/lib/customer-portal-themes"
import { PortalThemeStyles } from "@/components/customer-portal/portal-theme-provider"
import { PortalThemePreview } from "@/components/customer-portal/portal-theme-preview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PppoePortalPage() {
  const [saved, setSaved] = useState<PortalThemeId>(DEFAULT_PORTAL_THEME)
  const [selected, setSelected] = useState<PortalThemeId>(DEFAULT_PORTAL_THEME)
  const [mode, setMode] = useState<PortalThemeMode>("light")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true
    adminApi
      .getCustomerPortalTheme()
      .then((res) => {
        if (!active) return
        const id = normalizePortalTheme(res.customer_portal_theme)
        setSaved(id)
        setSelected(id)
      })
      .catch(() => {
        if (!active) return
        setLoadFailed(true)
        toast.error("Couldn't load the current portal theme")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const dirty = selected !== saved
  const selectedTheme = useMemo(() => getPortalTheme(selected), [selected])
  const forced = selectedTheme.forcedMode
  const previewMode: PortalThemeMode = forced || mode

  const handleSave = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      const res = await adminApi.updateCustomerPortalTheme(selected)
      const id = normalizePortalTheme(res.customer_portal_theme)
      setSaved(id)
      setSelected(id)
      safeStorage.set(PORTAL_THEME_STORAGE_KEY, id)
      toast.success(`${getPortalTheme(id).name} theme is now live on your customer portal`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to save the portal theme")
    } finally {
      setSaving(false)
    }
  }

  const saveButton = (
    <Button onClick={handleSave} disabled={!dirty || saving || loading} className="w-full sm:w-auto">
      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      {saving ? "Saving…" : dirty ? "Save theme" : "No changes"}
    </Button>
  )

  return (
    <div className="space-y-6">
      <PortalThemeStyles />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <LayoutTemplate className="h-6 w-6 text-primary" />
            PPPoE Captive Portal
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Choose how your customer portal looks for PPPoE subscribers: the login page, dashboard, invoices, payments and
            everything else they see. The change applies to all your customers as soon as you save.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="/customer/login" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open customer portal
            </a>
          </Button>
          {saveButton}
        </div>
      </div>

      {loadFailed && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          We couldn&apos;t read your saved theme, so Classic is shown. You can still pick and save a theme.
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Theme picker */}
        <div
          role="group"
          aria-label="Customer portal themes"
          className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3"
        >
          {PORTAL_THEMES.map((theme) => {
            const isSelected = theme.id === selected
            const isLive = theme.id === saved
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(theme.id)}
                disabled={loading}
                className={`group flex flex-col gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-md"
                    : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className="relative">
                  <PortalThemePreview themeId={theme.id} mode={theme.forcedMode || mode} size="sm" />
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-3.5 w-3.5" />
                      <span className="sr-only">Selected</span>
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 px-1">
                  <div className="min-w-0">
                    <p className="font-semibold">{theme.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                  {isLive && (
                    <Badge variant="outline" className="shrink-0 border-emerald-500/40 text-emerald-600">
                      Live
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                  <div className="flex items-center" aria-hidden="true">
                    {theme.swatch.map((c, i) => (
                      <span
                        key={i}
                        className="-ml-1 h-5 w-5 rounded-full border border-black/10 first:ml-0 dark:border-white/20"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {theme.traits.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Live preview */}
        <Card className="xl:sticky xl:top-20">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTheme.name}
                  {dirty && <Badge variant="secondary">Unsaved</Badge>}
                </CardTitle>
                <CardDescription className="mt-1">Live preview of the customer dashboard.</CardDescription>
              </div>
              <div role="group" aria-label="Preview mode" className="flex shrink-0 rounded-lg border p-0.5">
                {(["light", "dark"] as const).map((m) => {
                  const Icon = m === "light" ? Sun : Moon
                  const active = previewMode === m
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={active}
                      disabled={!!forced && forced !== m}
                      onClick={() => setMode(m)}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 ${
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PortalThemePreview themeId={selected} mode={previewMode} size="lg" />
            {forced && (
              <p className="text-xs text-muted-foreground">{selectedTheme.name} is a dark-only theme, so customers always see it in dark mode.</p>
            )}
            {!forced && (
              <p className="text-xs text-muted-foreground">
                Customers can still switch between light and dark on their own device.
              </p>
            )}
            {saveButton}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
