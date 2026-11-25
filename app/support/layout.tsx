"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react"
import { SupportAuthProvider, useSupportAuth } from "./support-auth-context"
import { SessionInactivityGuard } from "@/components/session-inactivity-guard"
import { InternetilyLogo } from "@/components/internetily-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NavItem = { name: string; href: string; icon: LucideIcon }
type NavSection = { title: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { name: "Dashboard", href: "/support/dashboard", icon: LayoutDashboard },
      { name: "Leads", href: "/support/leads", icon: Headphones },
    ],
  },
  {
    title: "Onboarding",
    items: [{ name: "Register Tenant", href: "/admin/selfie", icon: UserPlus }],
  },
]

const COLLAPSED_KEY = "netily-support-sidebar-collapsed"

function routeMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SupportShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const { user, loading, logout } = useSupportAuth()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1")
    } catch {}
  }, [])

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const activeSection = useMemo(
    () => navSections.find((section) => section.items.some((item) => routeMatches(pathname, item.href))),
    [pathname],
  )
  const activeItem = activeSection?.items.find((item) => routeMatches(pathname, item.href))

  if (pathname === "/support/login") return <>{children}</>
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-5">
          <InternetilyLogo tone="onDark" className="h-7 motion-safe:animate-pulse" priority />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-[#027EFB] motion-safe:animate-pulse" />
          </div>
          <span className="sr-only">Loading support console</span>
        </div>
      </div>
    )
  }
  if (!user) return null

  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
  const initial = name.slice(0, 1).toUpperCase()
  const role = user.is_superuser ? "Superadmin access" : user.support_profile?.title || "Support executive"
  // The collapsed rail only applies on desktop; the mobile drawer is always full width.
  const rail = collapsed && !open

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      if (next) window.localStorage.setItem(COLLAPSED_KEY, "1")
      else window.localStorage.removeItem(COLLAPSED_KEY)
    } catch {}
  }

  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#027EFB] focus-visible:ring-offset-2 focus-visible:ring-offset-black"

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(2,126,251,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />

      <a
        href="#support-main"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating sidebar */}
      <aside
        aria-label="Support navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-neutral-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl transition-[transform,width] duration-200 motion-reduce:transition-none lg:inset-y-4 lg:left-4 lg:translate-x-0 lg:rounded-2xl lg:border ${
          rail ? "lg:w-16" : "lg:w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 ${rail ? "lg:justify-center lg:px-0" : ""}`}>
          <Link
            href="/support/dashboard"
            title="Support dashboard"
            aria-label="Internetily support dashboard"
            className={`flex min-w-0 items-center rounded-lg ${focusRing}`}
          >
            {rail && <InternetilyLogo variant="mark" tone="onDark" className="hidden h-8 lg:block" priority />}
            <div className={`flex flex-col gap-1 ${rail ? "lg:hidden" : ""}`}>
              <InternetilyLogo tone="onDark" className="h-6" priority />
              <span className="text-[10px] font-semibold tracking-[0.2em] text-[#4da3ff]">SUPPORT CONSOLE</span>
            </div>
          </Link>
          <button
            type="button"
            className={`ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden ${focusRing}`}
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav aria-label="Primary" className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 ${rail ? "lg:px-2" : ""} [scrollbar-width:thin]`}>
          {navSections.map((section, index) => (
            <div key={section.title} className={index > 0 ? "mt-5" : ""}>
              <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/35 ${rail ? "lg:hidden" : ""}`}>
                {section.title}
              </p>
              {rail && index > 0 && <div className="mx-2 mb-3 hidden h-px bg-white/10 lg:block" />}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = routeMatches(pathname, item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={rail ? item.name : undefined}
                        aria-label={rail ? item.name : undefined}
                        className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors motion-reduce:transition-none ${focusRing} ${
                          rail ? "lg:justify-center lg:px-0" : ""
                        } ${
                          active
                            ? "bg-[#027EFB] text-white shadow-lg shadow-[#027EFB]/25"
                            : "text-white/65 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        <span className={`truncate ${rail ? "lg:hidden" : ""}`}>{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`shrink-0 space-y-2 border-t border-white/10 p-3 ${rail ? "lg:px-2" : ""}`}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`hidden min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white motion-reduce:transition-none lg:flex ${focusRing}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <p className={`px-1 text-center text-[10px] tracking-wide text-white/35 ${rail ? "lg:hidden" : ""}`}>
            Powered by <span className="font-semibold text-white/60">Internetily</span>
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className={`relative flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 motion-reduce:transition-none ${collapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-white/10 bg-black/70 px-3 backdrop-blur-xl sm:px-4 lg:top-4 lg:mx-0 lg:mr-4 lg:mt-4 lg:rounded-2xl lg:border lg:bg-neutral-950/80 lg:px-5 lg:shadow-lg lg:shadow-black/30">
          <button
            type="button"
            className={`flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white lg:hidden ${focusRing}`}
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-6 w-6" />
          </button>

          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-1.5 text-sm">
              {activeSection && (
                <>
                  <li className="hidden shrink-0 text-white/40 sm:block">{activeSection.title}</li>
                  <li className="hidden shrink-0 text-white/25 sm:block" aria-hidden="true">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                </>
              )}
              <li className="truncate font-semibold text-white" aria-current="page">
                {activeItem?.name ?? "Support"}
              </li>
            </ol>
          </nav>

          <span className="hidden shrink-0 rounded-full border border-[#027EFB]/40 bg-[#027EFB]/10 px-3 py-1 text-xs font-medium text-[#6db8ff] md:inline-block">
            {role}
          </span>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open account menu"
                className={`flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-1.5 text-white/70 hover:bg-white/10 hover:text-white ${focusRing}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-black">
                  {initial}
                </span>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-64">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground md:hidden">{role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="min-h-10 text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main id="support-main" className="min-w-0 flex-1 p-4 md:p-6 lg:pb-8 lg:pl-0 lg:pr-4 lg:pt-6">
          {children}
        </main>
      </div>
      <SessionInactivityGuard onLogout={logout} areaLabel="support dashboard" />
    </div>
  )
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupportAuthProvider>
      <SupportShell>{children}</SupportShell>
    </SupportAuthProvider>
  )
}
