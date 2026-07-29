"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  CreditCard,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { AffiliateAuthProvider, isAffiliatePublicPath, useAffiliateAuth } from "./affiliate-auth-context"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Overview", href: "/affiliate/dashboard", icon: LayoutDashboard },
  { name: "Referrals", href: "/affiliate/referrals", icon: Users },
  { name: "Analytics", href: "/affiliate/analytics", icon: BarChart3 },
  { name: "Payouts", href: "/affiliate/payouts", icon: Wallet },
  { name: "Marketing", href: "/affiliate/marketing", icon: Megaphone },
  { name: "Payment Settings", href: "/affiliate/payment-settings", icon: CreditCard },
  { name: "Reward Tiers", href: "/affiliate/tiers", icon: Trophy },
  { name: "How to Win", href: "/affiliate/guide", icon: BookOpen },
]

function AffiliateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading, logout } = useAffiliateAuth()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Public pages — no shell
  if (isAffiliatePublicPath(pathname)) {
    return <>{children}</>
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-white text-gray-900">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.04),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(185,28,28,0.03),transparent_35%)]" />

      {/* Mobile overlay */}
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200/80 bg-white/90 backdrop-blur-2xl transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-5">
          <Link href="/affiliate/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-200">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-gray-900">Netily</p>
              <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-red-600">
                Affiliates
              </p>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-200"
                    : "text-gray-500 hover:bg-red-50 hover:text-red-700"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] ${active ? "text-white" : "text-gray-400 group-hover:text-red-500"}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Help link */}
        <div className="absolute bottom-[100px] left-0 right-0 px-3">
          <a
            href="mailto:support@netily.co.ke"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <BookOpen className="h-4 w-4" />
            Help &amp; Support
          </a>
        </div>

        {/* User card */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 text-sm font-black text-white shadow-md">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{user.full_name}</p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="mt-3 w-full rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/70 px-4 backdrop-blur-xl md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <div className="hidden items-center gap-2 text-sm text-gray-400 lg:flex">
            <Gift className="h-4 w-4 text-red-400" />
            Earn by referring ISPs to Netily
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
              {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 text-xs font-bold text-white lg:hidden">
              {initials}
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AffiliateAuthProvider>
      <AffiliateShell>{children}</AffiliateShell>
    </AffiliateAuthProvider>
  )
}
