"use client"

import React, { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Package,
  Router,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type AdminOnboardingUser = {
  id?: string | number | null
  email?: string | null
  username?: string | null
  role?: string | null
  access_level?: string | null
  is_staff?: boolean | null
  is_superuser?: boolean | null
}

type TourStep = {
  id: string
  route?: string
  target?: string
  event?: string
  icon: React.ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  body: string
  hint?: string
  primary: string
  secondary?: string
}

const STORAGE_PREFIX = "netily-admin-setup-tour"
const SESSION_PREFIX = "netily-admin-setup-session"
const MAX_LOGIN_SHOWS = 3

const steps: TourStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    eyebrow: "Welcome",
    title: "Let us set up the basics first.",
    body: "We will walk through the first router, your service plans, one payment method, and SMS. It is short, practical, and you can leave anytime.",
    hint: "Best done with your MikroTik details, package prices, M-Pesa credentials, and SMS preference nearby.",
    primary: "Start setup",
    secondary: "Skip for now",
  },
  {
    id: "routers-page",
    route: "/admin/routers",
    target: "[data-onboarding='nav-routers'], [data-onboarding='routers-add-button']",
    icon: Router,
    eyebrow: "Step 1",
    title: "Start with your first router.",
    body: "Your router connects customer plans, sessions, hotspot access, and provisioning. Add the first router record so the rest of the system has a network anchor.",
    primary: "Go to routers",
  },
  {
    id: "router-form",
    route: "/admin/routers",
    target: "[data-onboarding='routers-add-button'], [data-onboarding='router-form']",
    event: "netily:onboarding:open-router",
    icon: Router,
    eyebrow: "Router details",
    title: "Add the router name and location.",
    body: "Use a name your team will recognise, choose the router type, and add the location. After saving, you can open the router page and complete connection details or scripts.",
    hint: "Example: Main Gateway, MikroTik, Nairobi CBD POP.",
    primary: "Open router form",
  },
  {
    id: "plans-page",
    route: "/admin/plans",
    target: "[data-onboarding='nav-plans'], [data-onboarding='plans-create-button']",
    icon: Package,
    eyebrow: "Step 2",
    title: "Create the packages customers will buy.",
    body: "Plans define price, speed, validity, pools, and hotspot package behaviour. Start with one clean PPPoE or hotspot plan before adding many options.",
    primary: "Go to plans",
  },
  {
    id: "plan-picker",
    route: "/admin/plans",
    target: "[data-onboarding='plans-create-button'], [data-onboarding='plan-type-picker']",
    event: "netily:onboarding:open-plan-picker",
    icon: Package,
    eyebrow: "Plan type",
    title: "Choose the first plan type.",
    body: "Pick PPPoE for monthly subscriber accounts or Hotspot for captive portal packages. The guide will use PPPoE first because it covers the core billing fields.",
    primary: "Choose plan type",
  },
  {
    id: "plan-form",
    route: "/admin/plans",
    target: "[data-onboarding='plan-form']",
    event: "netily:onboarding:open-plan-pppoe",
    icon: Package,
    eyebrow: "Plan details",
    title: "Fill in the plan name, pool, validity, speed and price.",
    body: "Keep the first plan simple. Use a clear customer-facing name, confirm the IP pool range, choose same-day monthly or a fixed duration, then set the speeds and price.",
    hint: "Example: Home 10Mbps, monthly, KES 1,500.",
    primary: "Open PPPoE form",
  },
  {
    id: "payment-methods",
    route: "/admin/payment-methods",
    target: "[data-onboarding='nav-payment-methods'], [data-onboarding='payment-methods-daraja-card']",
    icon: Banknote,
    eyebrow: "Step 3",
    title: "Connect one payment method.",
    body: "For M-Pesa, connect your Daraja Paybill or Till credentials. Once active, customer payments can be matched to invoices and renewals automatically.",
    primary: "Go to payment methods",
  },
  {
    id: "daraja-form",
    route: "/admin/payment-methods",
    target: "[data-onboarding='payment-methods-daraja-card'], [data-onboarding='daraja-config-form']",
    event: "netily:onboarding:open-daraja",
    icon: Banknote,
    eyebrow: "M-Pesa setup",
    title: "Add Daraja credentials and activate the config.",
    body: "Enter the shortcode, consumer key, consumer secret, passkey, and callback-ready settings. Test first, then activate it as the primary gateway.",
    hint: "Keep keys server-side. Never paste live credentials into chats or public docs.",
    primary: "Open M-Pesa setup",
  },
  {
    id: "sms-gateway",
    route: "/admin/sms",
    target: "[data-onboarding='nav-sms'], [data-onboarding='sms-gateway-tab']",
    event: "netily:onboarding:sms-gateway",
    icon: MessageSquare,
    eyebrow: "Step 4",
    title: "Set up SMS.",
    body: "Use Netily inbuilt SMS for the quickest start, or configure your own provider. SMS powers welcome messages, payment confirmations, expiry reminders, and alerts.",
    primary: "Go to SMS",
  },
  {
    id: "sms-notifications",
    route: "/admin/sms",
    target: "[data-onboarding='sms-notifications-tab'], [data-onboarding='sms-notifications-panel']",
    event: "netily:onboarding:sms-notifications",
    icon: CheckCircle2,
    eyebrow: "Finish",
    title: "Switch on the SMS events you want.",
    body: "Start with customer welcome, payment confirmation, and expiry reminders. You can come back later to add templates, campaigns, and top-ups.",
    primary: "Finish guide",
  },
]

function scopedKey(user: AdminOnboardingUser | null | undefined, suffix: string) {
  const host = typeof window !== "undefined" ? window.location.hostname : "local"
  const userKey = user?.id || user?.email || user?.username || "admin"
  return `${STORAGE_PREFIX}:${host}:${userKey}:${suffix}`
}

function isPrincipalAdmin(user: AdminOnboardingUser | null | undefined) {
  const role = String(user?.role || "").toLowerCase()
  const accessLevel = String(user?.access_level || "").toLowerCase()
  if (!user) return false
  if (user.is_superuser) return false
  if (role.includes("super")) return false
  if (accessLevel.includes("super")) return false
  return role === "admin" || accessLevel === "admin" || (!role && !!user.is_staff)
}

function findTarget(selector?: string) {
  if (!selector || typeof document === "undefined") return null
  return document.querySelector<HTMLElement>(selector)
}

export function AdminOnboardingTour({
  user,
  disabled = false,
}: {
  user?: AdminOnboardingUser | null
  disabled?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [targetMissing, setTargetMissing] = useState(false)

  const step = steps[index]
  const Icon = step.icon
  const progress = Math.round(((index + 1) / steps.length) * 100)

  useEffect(() => {
    if (disabled || !isPrincipalAdmin(user) || typeof window === "undefined") return

    const completeKey = scopedKey(user, "complete")
    if (window.localStorage.getItem(completeKey) === "1") return

    const sessionKey = scopedKey(user, "session")
    const countKey = scopedKey(user, "shows")
    if (!window.sessionStorage.getItem(sessionKey)) {
      const shows = Number(window.localStorage.getItem(countKey) || "0")
      if (shows >= MAX_LOGIN_SHOWS) return
      window.localStorage.setItem(countKey, String(shows + 1))
      window.sessionStorage.setItem(sessionKey, "1")
    }

    const savedIndex = Number(window.localStorage.getItem(scopedKey(user, "step")) || "0")
    setIndex(Number.isFinite(savedIndex) ? Math.min(Math.max(savedIndex, 0), steps.length - 1) : 0)
    const timer = window.setTimeout(() => setActive(true), 700)
    return () => window.clearTimeout(timer)
  }, [disabled, user])

  useEffect(() => {
    if (!active || !user || typeof window === "undefined") return
    window.localStorage.setItem(scopedKey(user, "step"), String(index))
  }, [active, index, user])

  useEffect(() => {
    if (!active || !step?.route || pathname === step.route) return
    router.push(step.route)
  }, [active, pathname, router, step])

  useEffect(() => {
    if (!active) return

    let frame = 0
    const syncRect = () => {
      const target = findTarget(step.target)
      setTargetMissing(Boolean(step.target && !target))
      setRect(target ? target.getBoundingClientRect() : null)
    }

    const tick = () => {
      syncRect()
      frame = window.requestAnimationFrame(tick)
    }

    const timeout = window.setTimeout(syncRect, 250)
    frame = window.requestAnimationFrame(tick)
    window.addEventListener("resize", syncRect)
    window.addEventListener("scroll", syncRect, true)

    return () => {
      window.clearTimeout(timeout)
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", syncRect)
      window.removeEventListener("scroll", syncRect, true)
    }
  }, [active, step])

  const cardStyle = useMemo<React.CSSProperties>(() => {
    if (typeof window === "undefined") return {}
    if (!rect) {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
    }
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left
    const top = Math.min(Math.max(rect.top, 88), window.innerHeight - 360)
    if (spaceRight > 430) return { left: rect.right + 20, top }
    if (spaceLeft > 430) return { left: rect.left - 400, top }
    return { left: "50%", bottom: 20, transform: "translateX(-50%)" }
  }, [rect])

  const close = (complete = false) => {
    if (typeof window !== "undefined" && user) {
      if (complete) window.localStorage.setItem(scopedKey(user, "complete"), "1")
      window.localStorage.setItem(scopedKey(user, "step"), String(index))
    }
    setActive(false)
  }

  const goPrevious = () => setIndex((current) => Math.max(current - 1, 0))

  const goNext = () => {
    if (step.event && typeof window !== "undefined" && (!step.route || pathname === step.route)) {
      window.dispatchEvent(new CustomEvent(step.event))
    }
    if (index >= steps.length - 1) {
      close(true)
      return
    }
    setIndex((current) => current + 1)
  }

  if (!active || disabled || !step) return null

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[6px]" />
      {rect && (
        <div
          className="absolute rounded-2xl border-2 border-primary bg-background/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.35),0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-200"
          style={{
            left: Math.max(rect.left - 8, 8),
            top: Math.max(rect.top - 8, 8),
            width: Math.min(rect.width + 16, window.innerWidth - 16),
            height: rect.height + 16,
          }}
        />
      )}
      <div
        className="pointer-events-auto absolute w-[calc(100vw-2rem)] max-w-[390px] rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl"
        style={cardStyle}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{step.eyebrow}</p>
              <h2 className="text-lg font-bold leading-tight">{step.title}</h2>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => close(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
        {step.hint && (
          <p className="mt-3 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs leading-5 text-foreground">
            {step.hint}
          </p>
        )}
        {targetMissing && pathname === step.route && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
            This page is still loading. The guide will lock onto the control once it appears.
          </p>
        )}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={goPrevious} disabled={index === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {step.secondary && (
              <Button type="button" variant="outline" size="sm" onClick={() => close(false)}>
                {step.secondary}
              </Button>
            )}
            <Button type="button" size="sm" onClick={goNext}>
              {step.primary}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {index + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}
