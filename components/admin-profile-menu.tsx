"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ChevronDown,
  CreditCard,
  Download,
  Gift,
  Globe,
  LifeBuoy,
  LogOut,
  MessageSquareText,
  Monitor,
  Moon,
  Palette,
  PlayCircle,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  UserCircle2,
  UserCog,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ADMIN_ROLES, canAccess } from "@/lib/rbac"

const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://g.page/r/CXBirwJlXb_0EAI/review"

type ProfileUser = {
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  role?: string | null
  is_superuser?: boolean | null
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  technician: "Technician",
  accountant: "Accountant",
  support: "Support",
  superadmin: "Platform admin",
  super_admin: "Platform admin",
}

function displayName(user?: ProfileUser | null) {
  const full = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim()
  return full || user?.username || "Admin"
}

function roleLabel(user?: ProfileUser | null) {
  const role = String(user?.role || "").toLowerCase()
  // The tenant's principal admin holds the superuser flag inside their own workspace.
  if (role === "admin" && user?.is_superuser) return "Owner"
  return ROLE_LABELS[role] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "Admin")
}

function initials(user?: ProfileUser | null) {
  const name = displayName(user)
  const parts = name.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || "A") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

/** Open a Settings tab directly, whether or not Settings is already on screen. */
function openSettingsTab(router: ReturnType<typeof useRouter>, tab: string) {
  window.dispatchEvent(new CustomEvent("netily:settings-tab", { detail: tab }))
  router.push(`/admin/settings?tab=${tab}`)
}

export function AdminProfileMenu({
  user,
  canInstall,
  onInstall,
  onOpenSearch,
  onLogout,
}: {
  user?: ProfileUser | null
  canInstall?: boolean
  onInstall?: () => void
  onOpenSearch: () => void
  onLogout: () => void
}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isAdmin = canAccess(user as never, { allowedRoles: ADMIN_ROLES })
  const name = displayName(user)

  const openFeedback = () => {
    window.dispatchEvent(new CustomEvent("netily:support-chat:open", { detail: { category: "Other", message: "Feedback: " } }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-9 shrink-0 items-center gap-1 px-1 sm:gap-2 sm:px-2" aria-label="Open account menu">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials(user)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
            <span className="max-w-[140px] truncate text-sm font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{roleLabel(user)}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        className="z-[100] max-h-[min(640px,calc(100dvh-5rem))] w-72 overflow-y-auto"
      >
        <div className="flex items-center gap-3 px-2 py-2.5">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">{initials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{roleLabel(user)}</span>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => openSettingsTab(router, "account")}>
            <UserCircle2 className="mr-2 h-4 w-4" /> My profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openSettingsTab(router, "security")}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Security &amp; PIN
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/admin/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onSelect={() => router.push("/admin/staff")}>
              <UserCog className="mr-2 h-4 w-4" /> Team &amp; roles
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem onSelect={() => router.push("/admin/settings/billing")}>
              <CreditCard className="mr-2 h-4 w-4" /> Billing &amp; subscription
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => router.push("/admin/logs")}>
            <ScrollText className="mr-2 h-4 w-4" /> Activity log
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open("/affiliate", "_blank", "noopener,noreferrer")}>
            <Gift className="mr-2 h-4 w-4" /> Refer an ISP
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Display</DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" /> Theme
            <span className="ml-auto pl-2 text-xs capitalize text-muted-foreground">{mounted ? theme || "system" : ""}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="z-[101]">
            <DropdownMenuRadioGroup value={mounted ? theme || "system" : "system"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light"><Sun className="mr-2 h-4 w-4" /> Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark"><Moon className="mr-2 h-4 w-4" /> Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system"><Monitor className="mr-2 h-4 w-4" /> Match device</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={() => openSettingsTab(router, "appearance")}>
          <Palette className="mr-2 h-4 w-4" /> Appearance settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Help</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push("/admin/whats-new")}>
            <Sparkles className="mr-2 h-4 w-4 text-amber-500" /> What&apos;s new
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.dispatchEvent(new CustomEvent("netily:onboarding:start"))}>
            <PlayCircle className="mr-2 h-4 w-4" /> Setup guide &amp; video
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open("/docs", "_blank", "noopener,noreferrer")}>
            <LifeBuoy className="mr-2 h-4 w-4" /> Help center
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenSearch}>
            <Search className="mr-2 h-4 w-4" /> Search &amp; shortcuts
            <DropdownMenuShortcut>Ctrl K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openFeedback}>
            <MessageSquareText className="mr-2 h-4 w-4" /> Send feedback
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer")}>
            <Star className="mr-2 h-4 w-4 text-amber-500" /> Leave a review
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        {canInstall && (
          <DropdownMenuItem onSelect={onInstall}>
            <Download className="mr-2 h-4 w-4" /> Install app
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => router.push("/customer/login")}>
          <Globe className="mr-2 h-4 w-4" /> Customer portal
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
