"use client"

/**
 * components/page-transition.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global animation primitives for the /admin and /dashboard layouts.
 *
 * Components:
 *   PageTransition   – wraps page content; fades + slides up on route change
 *   FadeIn           – simple opacity fade for cards and stat panels
 *   StaggerContainer – parent that staggers its children's entrance
 *   StaggerItem      – animated child for use inside StaggerContainer
 *   SlideInLeft      – slides in from left (for sidebars / drawers)
 *   ScaleIn          – pops in with a subtle scale (for modals / badges)
 *
 * Usage in layout.tsx:
 *   import { PageTransition } from "@/components/page-transition"
 *   <main>
 *     <PageTransition>{children}</PageTransition>
 *   </main>
 */

import { AnimatePresence, motion, type Variants } from "framer-motion"
import { usePathname } from "next/navigation"

// ─── Shared easing ────────────────────────────────────────────────────────────

const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const
const EASE_IN_OUT = [0.43, 0.13, 0.23, 0.96] as const

// ─── PageTransition ───────────────────────────────────────────────────────────

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: "blur(2px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.3,
      ease: EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(1px)",
    transition: {
      duration: 0.18,
      ease: EASE_IN_OUT,
    },
  },
}

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────

const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
}

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────

const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerItem ──────────────────────────────────────────────────────────────

const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT },
  },
}

interface StaggerItemProps {
  children: React.ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// ─── SlideInLeft ─────────────────────────────────────────────────────────────

interface SlideInLeftProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function SlideInLeft({ children, className, delay = 0 }: SlideInLeftProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── ScaleIn ─────────────────────────────────────────────────────────────────

interface ScaleInProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScaleIn({ children, className, delay = 0 }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Animated nav list item (for sidebar links) ──────────────────────────────

interface AnimatedNavItemProps {
  children: React.ReactNode
  className?: string
  isActive?: boolean
}

export function AnimatedNavItem({ children, className, isActive }: AnimatedNavItemProps) {
  return (
    <motion.li
      className={className}
      whileHover={{ x: isActive ? 0 : 3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
    >
      {children}
    </motion.li>
  )
}
