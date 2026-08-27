"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Menu,
  X,
  ChevronLeft,
  Users,
  Wifi,
  Settings,
  CreditCard,
  Package,
  Bell,
} from "lucide-react"

const navItems = [
  { name: "Users", href: "/demo/admin/users", icon: Users },
  { name: "Routers", href: "/demo/admin/routers", icon: Wifi },
  { name: "Payments", href: "/demo/admin/payments", icon: CreditCard },
  { name: "Plans", href: "/demo/admin/plans", icon: Package },
  { name: "Settings", href: "/demo/admin/settings", icon: Settings },
]

function getPageTitle(pathname: string) {
  if (pathname === "/demo/admin") return "Demo Admin"
  const match = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  if (match) return match.name
  return "Demo Admin"
}

export function DemoAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const title = getPageTitle(pathname)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-semibold">
            N
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">Netily Demo</p>
            <p className="text-xs text-muted-foreground">Admin Workspace</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-warning/20 bg-warning/10 px-4 py-2 dark:border-amber-800 dark:bg-amber-950/30">
          <Badge variant="outline" className="border-amber-300 bg-transparent text-warning dark:border-amber-700 dark:text-amber-300">
            Demo Data Only
          </Badge>
        </div>

        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
          <Link href="/demo" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3 w-3" />
            Back to Demo Home
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Netily Demo</p>
            <h1 className="text-base font-semibold">{title}</h1>
          </div>
          <Badge variant="outline" className="hidden border-primary/20 bg-primary/10 text-primary md:inline-flex dark:border-primary/20 dark:bg-blue-950/30 dark:text-primary/60">
            Read Only
          </Badge>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs text-white">DA</AvatarFallback>
          </Avatar>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
