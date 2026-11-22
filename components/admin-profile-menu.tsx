"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, useReducedMotion } from "framer-motion"
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
  type LucideIcon,
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
import { SITE_URL } from "@/lib/brand"
import { ADMIN_ROLES, canAccess } from "@/lib/rbac"
import { cn } from "@/lib/utils"

const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://g.page/r/CXBirwJlXb_0EAI/review"

const spring = { type: "spring", stiffness: 420, damping: 30, mass: 0.7 } as const
const HIGHLIGHT_SPRING = { type: "spring", stiffness: 500, damping: 38 } as const

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

/** One highlight pill that glides between whichever row is focused/hovered. */
function Highlight({ show, danger }: { show: boolean; danger?: boolean }) {
  if (!show) return null
  return (
    <motion.span
      layoutId="profile-menu-highlight"
      transition={HIGHLIGHT_SPRING}
      className={cn("absolute inset-0 -z-10 rounded-sm", danger ? "bg-destructive/10" : "bg-accent")}
    />
  )
}

function AnimatedItem({
  id,
  index,
  icon: Icon,
  hovered,
  setHovered,
  onSelect,
  danger,
  iconClassName,
  shortcut,
  children,
}: {
  id: string
  index: number
  icon: LucideIcon
  hovered: string | null
  setHovered: (id: string | null) => void
  onSelect: () => void
  danger?: boolean
  iconClassName?: string
  shortcut?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  const active = hovered === id

  return (
    <DropdownMenuItem
      onSelect={onSelect}
      onFocus={() => setHovered(id)}
      className={cn("focus:bg-transparent", danger && "text-destructive focus:text-destructive")}
    >
      <Highlight show={active} danger={danger} />
      <motion.span
        className="flex w-full items-center"
        initial={reduce ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...spring, delay: reduce ? 0 : Math.min(index * 0.03, 0.3) }}
      >
        <motion.span
          className="mr-2 inline-flex"
          animate={{ x: active ? 2 : 0, scale: active ? 1.15 : 1 }}
          transition={spring}
        >
          <Icon className={cn("h-4 w-4", danger && "text-destructive", iconClassName)} />
        </motion.span>
        {children}
        {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
      </motion.span>
    </DropdownMenuItem>
  )
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
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  useEffect(() => setMounted(true), [])

  const isAdmin = canAccess(user as never, { allowedRoles: ADMIN_ROLES })
  const name = displayName(user)

  const openFeedback = () => {
    window.dispatchEvent(new CustomEvent("netily:support-chat:open", { detail: { category: "Other", message: "Feedback: " } }))
  }

  const row = { hovered, setHovered }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setHovered(null)
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-9 shrink-0 items-center gap-1 px-1 sm:gap-2 sm:px-2" aria-label="Open account menu">
          <motion.span
            className="relative inline-flex"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            transition={spring}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials(user)}</AvatarFallback>
            </Avatar>
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -inset-0.5 rounded-full ring-2 ring-primary/50"
              initial={false}
              animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.85 }}
              transition={spring}
            />
          </motion.span>
          <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
            <span className="max-w-[140px] truncate text-sm font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{roleLabel(user)}</span>
          </span>
          <motion.span className="hidden sm:inline-flex" animate={{ rotate: open ? 180 : 0 }} transition={spring}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        onPointerLeave={() => setHovered(null)}
        className="z-[100] max-h-[min(640px,calc(100dvh-5rem))] w-72 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="flex items-center gap-3 px-2 py-2.5"
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">{initials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{roleLabel(user)}</span>
        </motion.div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <AnimatedItem {...row} id="profile" index={0} icon={UserCircle2} onSelect={() => openSettingsTab(router, "account")}>
            My profile
          </AnimatedItem>
          <AnimatedItem {...row} id="security" index={1} icon={ShieldCheck} onSelect={() => openSettingsTab(router, "security")}>
            Security &amp; PIN
          </AnimatedItem>
          <AnimatedItem {...row} id="settings" index={2} icon={Settings} onSelect={() => router.push("/admin/settings")}>
            Settings
          </AnimatedItem>
          {isAdmin && (
            <AnimatedItem {...row} id="team" index={3} icon={UserCog} onSelect={() => router.push("/admin/staff")}>
              Team &amp; roles
            </AnimatedItem>
          )}
          {isAdmin && (
            <AnimatedItem {...row} id="billing" index={4} icon={CreditCard} onSelect={() => router.push("/admin/settings/billing")}>
              Billing &amp; subscription
            </AnimatedItem>
          )}
          <AnimatedItem {...row} id="logs" index={5} icon={ScrollText} onSelect={() => router.push("/admin/logs")}>
            Activity log
          </AnimatedItem>
          <AnimatedItem {...row} id="refer" index={6} icon={Gift} onSelect={() => window.open(`${SITE_URL}/affiliate/register`, "_blank", "noopener,noreferrer")}>
            Refer an ISP
          </AnimatedItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Display</DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="relative focus:bg-transparent" onFocus={() => setHovered("theme")}>
            <Highlight show={hovered === "theme"} />
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
        <AnimatedItem {...row} id="appearance" index={7} icon={Palette} onSelect={() => openSettingsTab(router, "appearance")}>
          Appearance settings
        </AnimatedItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Help</DropdownMenuLabel>
        <DropdownMenuGroup>
          <AnimatedItem {...row} id="whatsnew" index={8} icon={Sparkles} iconClassName="text-amber-500" onSelect={() => router.push("/admin/whats-new")}>
            What&apos;s new
          </AnimatedItem>
          <AnimatedItem {...row} id="setup" index={9} icon={PlayCircle} onSelect={() => window.dispatchEvent(new CustomEvent("netily:onboarding:start"))}>
            Setup guide &amp; video
          </AnimatedItem>
          <AnimatedItem {...row} id="help" index={10} icon={LifeBuoy} onSelect={() => window.open(`${SITE_URL}/docs`, "_blank", "noopener,noreferrer")}>
            Help center
          </AnimatedItem>
          <AnimatedItem {...row} id="search" index={11} icon={Search} shortcut="Ctrl K" onSelect={onOpenSearch}>
            Search &amp; shortcuts
          </AnimatedItem>
          <AnimatedItem {...row} id="feedback" index={12} icon={MessageSquareText} onSelect={openFeedback}>
            Send feedback
          </AnimatedItem>
          <AnimatedItem {...row} id="review" index={13} icon={Star} iconClassName="text-amber-500" onSelect={() => window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer")}>
            Leave a review
          </AnimatedItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        {canInstall && (
          <AnimatedItem {...row} id="install" index={14} icon={Download} onSelect={() => onInstall?.()}>
            Install app
          </AnimatedItem>
        )}
        <AnimatedItem {...row} id="portal" index={15} icon={Globe} onSelect={() => router.push("/customer/login")}>
          Customer portal
        </AnimatedItem>
        <DropdownMenuSeparator />
        <AnimatedItem {...row} id="signout" index={16} icon={LogOut} danger onSelect={onLogout}>
          Sign out
        </AnimatedItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}