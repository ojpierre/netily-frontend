"use client"

import { CreditCard, FileText, LayoutDashboard, Package, User, Wifi } from "lucide-react"
import { getPortalTheme, type PortalThemeId, type PortalThemeMode } from "@/lib/customer-portal-themes"

interface PortalThemePreviewProps {
  themeId: PortalThemeId
  mode: PortalThemeMode
  /** "sm" is the picker thumbnail, "lg" is the live preview panel. */
  size?: "sm" | "lg"
  companyName?: string
}

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Plans", icon: Package },
  { label: "Payments", icon: CreditCard },
  { label: "Invoices", icon: FileText },
  { label: "Profile", icon: User },
]

/**
 * A miniature of the customer dashboard rendered with the real theme tokens (the same
 * `data-portal-theme` attribute and generated CSS the portal uses), so what the admin
 * sees here is what customers get. Requires <PortalThemeStyles /> somewhere on the page.
 */
export function PortalThemePreview({ themeId, mode, size = "sm", companyName = "Your ISP" }: PortalThemePreviewProps) {
  const theme = getPortalTheme(themeId)
  const effectiveMode: PortalThemeMode = theme.forcedMode || mode
  const lg = size === "lg"
  const text = lg ? "text-xs" : "text-[9px]"
  const small = lg ? "text-[11px]" : "text-[8px]"

  return (
    <div
      data-portal-theme={theme.id}
      data-portal-mode={effectiveMode}
      aria-hidden="true"
      className={`portal-canvas relative flex w-full overflow-hidden rounded-xl border border-border text-foreground ${text} ${lg ? "min-h-[320px]" : "h-[150px]"}`}
      style={{ backgroundColor: effectiveMode === "dark" ? "var(--color-slate-950, oklch(0.129 0.04 265))" : "var(--color-slate-50, oklch(0.984 0.003 248))" }}
    >
      {/* Sidebar */}
      <div className={`portal-sidebar flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground ${lg ? "w-36" : "w-[72px]"}`}>
        <div className={`portal-header flex items-center gap-1.5 border-b border-sidebar-border ${lg ? "px-3 py-3" : "px-1.5 py-2"}`}>
          <span className={`flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground ${lg ? "h-6 w-6" : "h-4 w-4"}`}>
            <Wifi className={lg ? "h-3.5 w-3.5" : "h-2.5 w-2.5"} />
          </span>
          <span className={`min-w-0 truncate font-bold leading-tight text-current ${small}`}>{companyName}</span>
        </div>
        <div className={`flex flex-col ${lg ? "gap-1 p-2" : "gap-0.5 p-1"}`}>
          {NAV.slice(0, lg ? 5 : 4).map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 rounded-lg ${lg ? "px-2 py-1.5" : "px-1 py-0.5"} ${
                i === 0 ? "bg-sidebar-primary/10 font-semibold text-sidebar-primary" : "text-sidebar-foreground"
              }`}
            >
              <item.icon className={lg ? "h-3.5 w-3.5 shrink-0" : "h-2 w-2 shrink-0"} />
              <span className={`truncate ${small}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className={`flex min-w-0 flex-1 flex-col ${lg ? "gap-3 p-4" : "gap-1.5 p-2"}`}>
        <div>
          <p className={`font-bold ${lg ? "text-sm" : "text-[10px]"}`}>Welcome back, Amina</p>
          {lg && <p className="text-[11px] text-muted-foreground">Your connection is active and running smoothly.</p>}
        </div>

        <div
          data-slot="card"
          className={`flex items-center justify-between gap-2 rounded-xl border bg-card text-card-foreground ${lg ? "p-3" : "p-1.5"}`}
        >
          <div className="min-w-0">
            <p className={`text-muted-foreground ${small}`}>Current plan</p>
            <p className={`truncate font-bold ${lg ? "text-sm" : "text-[10px]"}`}>Home Fibre 10 Mbps</p>
            <p className={`text-muted-foreground ${small}`}>Expires in 12 days</p>
          </div>
          <span className={`shrink-0 rounded-lg bg-primary font-semibold text-primary-foreground ${lg ? "px-3 py-1.5 text-[11px]" : "px-1.5 py-0.5 text-[8px]"}`}>
            Renew
          </span>
        </div>

        <div data-slot="card" className={`flex flex-col rounded-xl border bg-card text-card-foreground ${lg ? "gap-2 p-3" : "gap-1 p-1.5"}`}>
          {(lg ? [["INV-1042", "Paid", true], ["INV-1051", "Due", false]] : [["INV-1042", "Paid", true]]).map(([ref, state, ok]) => (
            <div key={String(ref)} className="flex items-center justify-between gap-2">
              <span className={`flex items-center gap-1 ${small}`}>
                <FileText className={lg ? "h-3 w-3 text-muted-foreground" : "h-2 w-2 text-muted-foreground"} />
                {ref}
              </span>
              <span
                className={`rounded-full px-1.5 py-px font-medium ${small} ${ok ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"}`}
              >
                {state}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
