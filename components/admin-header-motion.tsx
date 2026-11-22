"use client"

import * as React from "react"
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion"
import { Moon, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export const spring = { type: "spring", stiffness: 420, damping: 30, mass: 0.7 } as const

/** Wrapper: lifts on hover, presses on tap. Children using <MotionIcon> inherit the hover state. */
export function HoverLift({
  className,
  children,
  lift = 1,
  scale = 1.03,
  press = 0.97,
}: {
  className?: string
  children: React.ReactNode
  lift?: number
  scale?: number
  press?: number
}) {
  return (
    <motion.div
      className={className}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={{
        rest: { y: 0, scale: 1 },
        hover: { y: -lift, scale },
        tap: { scale: press },
      }}
      transition={spring}
    >
      {children}
    </motion.div>
  )
}

/** Icon that animates when its nearest HoverLift / motion parent is hovered. */
export function MotionIcon({
  hover,
  className,
  children,
}: {
  hover: TargetAndTransition
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.span
      className={cn("inline-flex", className)}
      variants={{ rest: { rotate: 0, scale: 1, x: 0, y: 0 }, hover }}
      transition={spring}
    >
      {children}
    </motion.span>
  )
}

export function HeaderSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={{
        rest: { y: 0, scale: 1 },
        hover: { y: -1, scale: 1.01 },
        tap: { scale: 0.985 },
      }}
      transition={spring}
      className="relative flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 sm:h-10 sm:px-3"
    >
      <MotionIcon hover={{ scale: 1.2, rotate: -10 }} className="shrink-0">
        <Search className="h-4 w-4" />
      </MotionIcon>
      <span className="min-w-0 flex-1 truncate sm:hidden">Search...</span>
      <span className="hidden min-w-0 flex-1 truncate sm:block">Search pages, customers, routers...</span>
      <kbd className="hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
        Ctrl K
      </kbd>
    </motion.button>
  )
}

export function AnimatedThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"

  return (
    <motion.button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88, rotate: -14 }}
      transition={spring}
      className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="inline-flex"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

export function AnimatedBellBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={spring}
          className="absolute -right-1 -top-1"
        >
          {/* re-mounts on every count change => little "bump" */}
          <motion.span
            key={count}
            initial={{ scale: 1.45 }}
            animate={{ scale: 1 }}
            transition={spring}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-white"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  )
}