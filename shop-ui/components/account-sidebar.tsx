"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BadgeCheck, FileText, Headphones, LogOut, MapPin, Package, ReceiptText, Settings, ShieldCheck, User } from "lucide-react"

const accountLinks = [
  { href: "/shop/account/profile", label: "Profile", icon: User, desc: "Company details" },
  { href: "/shop/account/orders", label: "Orders", icon: Package, desc: "Dispatch history" },
  { href: "/shop/account/quotes", label: "Quotes", icon: FileText, desc: "Proforma requests" },
  { href: "/shop/account/addresses", label: "Sites", icon: MapPin, desc: "Delivery locations" },
  { href: "/shop/account/warranty", label: "Warranty", icon: BadgeCheck, desc: "Claims and cover" },
  { href: "/shop/account/support", label: "Support", icon: Headphones, desc: "Shop assistance" },
  { href: "/shop/account/settings", label: "Preferences", icon: Settings, desc: "Alerts and security" },
]

export function AccountSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:sticky lg:top-28 lg:w-72 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="mb-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
            <ShieldCheck className="h-4 w-4 stroke-[1.6]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Customer workspace</p>
          <p className="mt-1 font-serif text-lg">Shop Account</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Track hardware orders, quotes, delivery sites, warranty claims, and support.</p>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <ReceiptText className="mb-2 h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open orders</p>
            <p className="mt-1 font-serif text-xl">3</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <BadgeCheck className="mb-2 h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Warranty</p>
            <p className="mt-1 font-serif text-xl">Active</p>
          </div>
        </div>

        <nav className="space-y-1">
          {accountLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-14 items-center gap-3 rounded-xl px-3 text-left transition-all ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4 shrink-0 stroke-[1.6]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em]">{link.label}</span>
                  <span className={`block truncate text-[11px] ${isActive ? "text-background/70" : "text-muted-foreground"}`}>
                    {link.desc}
                  </span>
                </span>
              </Link>
            )
          })}

          <div className="mt-3 border-t border-border pt-3">
            <Link
              href="/shop/login"
              className="flex min-h-10 w-full items-center justify-between rounded-xl border border-border px-3 text-xs uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>Sign Out</span>
              <LogOut className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}
