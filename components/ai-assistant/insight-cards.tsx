"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CreditCard,
  Info,
  MessageSquareText,
  Router as RouterIcon,
  Sparkles,
  Ticket,
  X,
  ArrowRight,
} from "lucide-react"
import { aiApi, type AiClient, type AiInsight, type AiInsightSeverity } from "@/lib/ai-assistant-api"
import { cn } from "@/lib/utils"

const KIND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  expiring_soon: CalendarClock,
  expired_recently: CalendarClock,
  routers_offline: RouterIcon,
  payment_failures: CreditCard,
  sms_wallet_low: MessageSquareText,
  revenue_trend: BarChart3,
  idle_hotspot_plans: Ticket,
}

export const SEVERITY_STYLES: Record<
  AiInsightSeverity,
  { card: string; icon: string; dot: string; label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  info: {
    card: "border-sky-500/25 bg-sky-500/[0.06]",
    icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    label: "Info",
    Icon: Info,
  },
  warning: {
    card: "border-amber-500/30 bg-amber-500/[0.07]",
    icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Warning",
    Icon: AlertTriangle,
  },
  critical: {
    card: "border-red-500/35 bg-red-500/[0.07]",
    icon: "bg-red-500/15 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    label: "Critical",
    Icon: AlertOctagon,
  },
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 }

export const sortInsights = (items: AiInsight[]) =>
  [...items].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3))

export interface InsightCardsProps {
  /** Max cards to show (default 3). */
  limit?: number
  className?: string
  /** Heading above the cards. Pass null to hide. */
  title?: string | null
  /** Override the API client (tests/previews). */
  client?: Pick<AiClient, "getInsights" | "dismissInsight">
  /** Provide insights directly instead of fetching. */
  initialInsights?: AiInsight[]
  /** Called when an action link is followed. */
  onAction?: (insight: AiInsight) => void
}

/**
 * Compact, severity-styled proactive insights. Renders nothing while loading,
 * on error (including 404 when the backend isn't deployed) or when empty,
 * so it never shows an error state on the dashboard.
 */
export function InsightCards({
  limit = 3,
  className,
  title = "Netily Assistant noticed",
  client = aiApi,
  initialInsights,
  onAction,
}: InsightCardsProps) {
  const [items, setItems] = useState<AiInsight[] | null>(initialInsights ? sortInsights(initialInsights) : null)

  useEffect(() => {
    if (initialInsights) return
    let alive = true
    client
      .getInsights()
      .then((res) => alive && setItems(Array.isArray(res) ? sortInsights(res) : []))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismiss = useCallback(
    (insight: AiInsight) => {
      setItems((cur) => (cur ? cur.filter((i) => i.id !== insight.id) : cur))
      client.dismissInsight(insight.id).catch(() => {
        // roll back
        setItems((cur) => {
          if (!cur || cur.some((i) => i.id === insight.id)) return cur
          return sortInsights([...cur, insight])
        })
      })
    },
    [client],
  )

  if (!items || items.length === 0) return null
  const visible = items.slice(0, limit)

  return (
    <section aria-label="Assistant insights" className={cn("animate-in fade-in-0 duration-300 motion-reduce:animate-none", className)}>
      {title ? (
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          {title}
        </div>
      ) : null}
      <ul className={cn("grid gap-3", visible.length > 1 && "md:grid-cols-2", visible.length > 2 && "xl:grid-cols-3")}>
        {visible.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onDismiss={dismiss} onAction={onAction} />
        ))}
      </ul>
    </section>
  )
}

function InsightCard({
  insight,
  onDismiss,
  onAction,
}: {
  insight: AiInsight
  onDismiss: (i: AiInsight) => void
  onAction?: (i: AiInsight) => void
}) {
  const sev = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.info
  const KindIcon = KIND_ICONS[insight.kind] ?? sev.Icon
  const href = insight.action?.href
  const safeHref = href && href.startsWith("/") && !href.startsWith("//") ? href : null

  return (
    <li
      className={cn(
        "group relative flex gap-3 rounded-xl border p-3.5 pr-9 text-card-foreground shadow-xs transition-colors",
        sev.card,
      )}
    >
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", sev.icon)}>
        <KindIcon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-foreground">
          <span className="sr-only">{sev.label}: </span>
          {insight.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
        {insight.action && safeHref ? (
          <Link
            href={safeHref}
            onClick={() => onAction?.(insight)}
            className="mt-2 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {insight.action.label}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(insight)}
        aria-label={`Dismiss: ${insight.title}`}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground/70 outline-none transition hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}
