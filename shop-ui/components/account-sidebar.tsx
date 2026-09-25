"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Package, MapPin, Settings, Shield, LogOut } from "lucide-react"

const accountLinks = [
  { href: "/shop/account/profile", label: "Profile & Organization", icon: User },
  { href: "/shop/account/orders", label: "Orders & Invoices", icon: Package },
  { href: "/shop/account/addresses", label: "Sites & Delivery", icon: MapPin },
  { href: "/shop/account/settings", label: "Preferences", icon: Settings },
  { href: "/shop/admin", label: "Admin Console", icon: Shield, badge: "Admin" },
]

export function AccountSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-card border border-border p-2">
        <nav className="space-y-1">
          {accountLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3 text-xs tracking-[0.15em] uppercase transition-colors ${
                  isActive
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <link.icon className="h-4 w-4 stroke-[1.5]" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 border ${
                      isActive ? "border-background/40 text-background" : "border-border text-muted-foreground"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}

          <div className="pt-2 my-2 border-t border-border">
            <Link
              href="/shop/login"
              className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
            >
              <LogOut className="h-4 w-4 stroke-[1.5]" />
              Sign Out
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}
