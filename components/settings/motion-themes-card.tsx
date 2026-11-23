"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { MotionThemeBackdrop } from "@/components/motion-theme-backdrop"
import { MOTION_THEMES, isMotionTheme, useColorTheme } from "@/components/theme-provider"

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (!query) return
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener?.("change", update)
    return () => query.removeEventListener?.("change", update)
  }, [])
  return reduced
}

/** Miniature of the admin shell, painted with the theme's own tokens and motion. */
function MotionThemePreview({ value }: { value: (typeof MOTION_THEMES)[number]["value"] }) {
  return (
    <div
      data-theme={value}
      className="relative h-36 overflow-hidden rounded-xl border border-border bg-background"
    >
      <MotionThemeBackdrop theme={value} className="nm-backdrop--contained" />
      <div className="relative z-10 flex h-full gap-2 p-2.5">
        <div className="flex w-12 shrink-0 flex-col gap-1.5 rounded-lg border border-border bg-card/95 p-1.5">
          <span className="nav-active-pill block h-2.5 rounded bg-primary" />
          <span className="block h-2 rounded bg-muted" />
          <span className="block h-2 rounded bg-muted" />
          <span className="block h-2 w-3/4 rounded bg-muted" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="netily-admin-header relative flex h-6 items-center justify-between rounded-md border border-border bg-card/95 px-2">
            <span className="h-1.5 w-10 rounded bg-muted" />
            <span className="h-3 w-3 rounded-full bg-primary/80" />
          </div>
          <div className="mt-auto flex items-center gap-2 rounded-lg border border-border bg-card/95 px-2.5 py-2">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-1">
              <span data-slot="skeleton" className="block h-1.5 w-4/5 rounded" />
              <span data-slot="skeleton" className="block h-1.5 w-1/2 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MotionThemesCard() {
  const { colorTheme, setColorTheme, motionPaused, setMotionPaused } = useColorTheme()
  const reducedMotion = usePrefersReducedMotion()
  const motionActive = isMotionTheme(colorTheme)

  const choose = (value: (typeof MOTION_THEMES)[number]["value"], label: string) => {
    if (value === colorTheme) return
    setColorTheme(value)
    toast.success(
      motionPaused
        ? `${label} theme on. Background animation is paused; turn it on below.`
        : `${label} theme on`,
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Motion Themes
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">New</span>
            </CardTitle>
            <CardDescription>
              Themes that move: a living background, their own loading spinners and a highlighted menu. They follow your light or dark mode.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3" role="radiogroup" aria-label="Motion themes">
          {MOTION_THEMES.map((theme) => {
            const isActive = colorTheme === theme.value
            return (
              <button
                key={theme.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => choose(theme.value, theme.label)}
                className={cn(
                  "group relative rounded-2xl border-2 p-2 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40",
                )}
              >
                <MotionThemePreview value={theme.value} />
                <div className="px-1.5 pb-1 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{theme.label}</span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">{theme.spinner}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{theme.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <Label htmlFor="motion-background" className="text-sm font-semibold">
              Animate background
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              {reducedMotion
                ? "Your device asks for reduced motion, so backgrounds stay still. Spinners still show progress."
                : motionActive
                  ? "Turn off for a still background that keeps the theme's colours. Spinners still show progress."
                  : "Applies when a motion theme is active. Pick one above to see it."}
            </p>
          </div>
          <Switch
            id="motion-background"
            checked={!motionPaused && !reducedMotion}
            disabled={reducedMotion}
            onCheckedChange={(checked) => setMotionPaused(!checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
