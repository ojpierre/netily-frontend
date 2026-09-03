"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, ChevronRight, Cookie, MessageCircle, Settings2, X } from "lucide-react"

type CookiePreferences = {
  necessary: true
  analytics: boolean
  marketing: boolean
}

const COOKIE_STORAGE_KEY = "netily-cookie-preferences"
const WHATSAPP_NUMBER = "254100034307"
const WHATSAPP_TEXT = "Hello Internetily, I would like to make an enquiry."

const publicRoutePrefixes = [
  "/demo",
  "/compare",
  "/blog",
  "/solutions",
  "/alternatives",
  "/docs",
  "/privacy",
  "/terms",
]

const privateRoutePrefixes = [
  "/admin",
  "/superadmin",
  "/customer",
  "/dashboard",
  "/support",
  "/portal",
  "/hotspot",
  "/api",
]

function isPublicMarketingRoute(pathname: string) {
  if (pathname === "/") return true
  if (pathname === "/affiliate" || pathname.startsWith("/affiliate/guide") || pathname.startsWith("/affiliate/verify")) {
    return true
  }
  if (privateRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return pathname === "/support"
  }
  return publicRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function readPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null
  try {
    const saved = window.localStorage.getItem(COOKIE_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function savePreferences(preferences: CookiePreferences) {
  window.localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new CustomEvent("netily-cookie-preferences-updated", { detail: preferences }))
  const gtag = (window as Window & { gtag?: (...args: any[]) => void }).gtag
  if (typeof gtag === "function") {
    gtag("consent", "update", {
      analytics_storage: preferences.analytics ? "granted" : "denied",
      ad_storage: preferences.marketing ? "granted" : "denied",
      ad_user_data: preferences.marketing ? "granted" : "denied",
      ad_personalization: preferences.marketing ? "granted" : "denied",
    })
  }
}

export function PublicEngagementWidgets() {
  const pathname = usePathname() || "/"
  const isPublicRoute = isPublicMarketingRoute(pathname)
  const isDemoRoute = pathname === "/demo" || pathname.startsWith("/demo/")
  const [ready, setReady] = useState(pathname !== "/")
  const [showCookieBanner, setShowCookieBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: false,
  })

  const whatsappHref = useMemo(() => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`
  }, [])

  useEffect(() => {
    if (!isPublicRoute) return
    if (pathname !== "/") {
      const timer = window.setTimeout(() => setReady(true), 350)
      return () => window.clearTimeout(timer)
    }

    setReady(false)
    const timer = window.setTimeout(() => setReady(true), 3100)
    const handleComplete = () => {
      window.clearTimeout(timer)
      setReady(true)
    }
    window.addEventListener("netily-homepage-preloader-complete", handleComplete, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("netily-homepage-preloader-complete", handleComplete)
    }
  }, [isPublicRoute, pathname])

  useEffect(() => {
    if (!isPublicRoute || !ready) return
    const saved = readPreferences()
    if (saved) {
      setPreferences(saved)
      savePreferences(saved)
      setShowCookieBanner(false)
      return
    }
    const timer = window.setTimeout(() => setShowCookieBanner(true), 450)
    return () => window.clearTimeout(timer)
  }, [isPublicRoute, ready])

  if (!isPublicRoute || !ready) return null

  const acceptAll = () => {
    const next = { necessary: true, analytics: true, marketing: true } satisfies CookiePreferences
    setPreferences(next)
    savePreferences(next)
    setShowCookieBanner(false)
    setShowPreferences(false)
  }

  const saveSelected = () => {
    savePreferences(preferences)
    setShowCookieBanner(false)
    setShowPreferences(false)
  }

  return (
    <>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Enquire on WhatsApp"
        className="fixed bottom-5 right-5 z-[80] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-950/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-[#1ebe5d] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 md:bottom-6 md:right-6"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -left-32 hidden rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-lg md:block">
          WhatsApp enquiry
        </span>
      </a>

      {isDemoRoute && (
        <Link
          href="/#contact"
          aria-label="Open Netily contact form"
          className="fixed bottom-24 right-5 z-[80] inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 shadow-2xl shadow-zinc-950/10 transition hover:-translate-y-0.5 hover:bg-zinc-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-300 md:bottom-24 md:right-6"
        >
          Contact Netily
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}

      {showCookieBanner && (
        <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 p-4 text-white shadow-2xl shadow-black/30 sm:bottom-5 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                <Cookie className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">We use cookies thoughtfully</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                  Necessary cookies keep the site working. With your permission, analytics help us understand what ISP teams need, and marketing cookies help us measure campaigns.
                </p>
                <div className="mt-2 text-xs text-zinc-500">
                  Read our <Link href="/privacy" className="text-amber-300 underline-offset-4 hover:underline">privacy policy</Link>.
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4" />
                Manage preferences
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Accept
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-white p-5 text-zinc-950 shadow-2xl dark:bg-zinc-950 dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Cookie preferences</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Choose what Internetily can use on this browser.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                aria-label="Close cookie preferences"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <PreferenceRow title="Necessary" description="Required for security, forms, and core site behaviour." checked disabled />
              <PreferenceRow
                title="Analytics"
                description="Helps us improve pages, pricing content, and product education."
                checked={preferences.analytics}
                onChange={(checked) => setPreferences((current) => ({ ...current, analytics: checked }))}
              />
              <PreferenceRow
                title="Marketing"
                description="Helps measure campaigns and keep enquiries relevant."
                checked={preferences.marketing}
                onChange={(checked) => setPreferences((current) => ({ ...current, marketing: checked }))}
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={saveSelected}
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Save preferences
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <Check className="h-4 w-4" />
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-5 w-5 rounded border-zinc-300 accent-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 dark:accent-white"
      />
    </label>
  )
}
