"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Headphones, LayoutDashboard, LogOut, Menu, ShieldCheck, Sparkles, UserPlus, X } from "lucide-react"
import { SupportAuthProvider, useSupportAuth } from "./support-auth-context"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", href: "/support/dashboard", icon: LayoutDashboard },
  { name: "Register Tenant", href: "/admin/selfie", icon: UserPlus },
  { name: "Leads", href: "/support/leads", icon: Headphones },
]

function SupportShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading, logout } = useSupportAuth()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (pathname === "/support/login") return <>{children}</>
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border border-white/30 border-t-white animate-spin" />
      </div>
    )
  }
  if (!user) return null

  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
      {open && <button aria-label="Close sidebar" className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-black/80 backdrop-blur-2xl transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href="/support/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.12)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">Netily Support</p>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Console</p>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all hover:translate-x-1 ${
                  active ? "bg-white text-black" : "text-white/68 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-black">
                {name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{name}</p>
                <p className="truncate text-xs text-white/50">{user.email}</p>
              </div>
            </div>
            <Button onClick={logout} className="mt-4 w-full bg-white text-black hover:bg-white/90">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="relative lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-black/70 px-4 backdrop-blur-xl md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden items-center gap-2 text-sm text-white/60 lg:flex">
            <Sparkles className="h-4 w-4" />
            Platform onboarding and lead support workspace
          </div>
          <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
            {user.is_superuser ? "Superadmin access" : user.support_profile?.title || "Support executive"}
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8">{children}</main>
      </div>
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
