"use client"

import * as React from "react"
import { motion, useAnimationControls, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

const RING = { rotate: [0, -22, 20, -16, 12, -8, 4, 0] }
const RING_TRANSITION = { duration: 0.9, ease: "easeInOut" } as const

/**
 * Rings (a bell-like swing) when `count` goes up, then a few gentle reminder
 * rings while it stays above zero. Quiet in background tabs and when the user
 * prefers reduced motion. The first load with unread items counts as "went up".
 */
export function useRing(count: number, { repeats = 3, everyMs = 9000 } = {}) {
  const controls = useAnimationControls()
  const reduceMotion = useReducedMotion()
  const previous = React.useRef(0)

  React.useEffect(() => {
    const increased = count > previous.current
    previous.current = count
    if (reduceMotion || count <= 0) return

    const ring = () => {
      void controls.start({ ...RING, transition: RING_TRANSITION })
    }
    if (increased) ring()

    let rings = 0
    const timer = window.setInterval(() => {
      if (document.hidden) return
      rings += 1
      if (rings > repeats) {
        window.clearInterval(timer)
        return
      }
      ring()
    }, everyMs)
    return () => window.clearInterval(timer)
  }, [count, controls, reduceMotion, repeats, everyMs])

  return controls
}

/** Wraps an icon so it swings from its top, like a bell, whenever `count` rises. */
export function RingingIcon({ count, className, children }: { count: number; className?: string; children: React.ReactNode }) {
  const controls = useRing(count)
  return (
    <motion.span animate={controls} style={{ transformOrigin: "50% 10%" }} className={cn("inline-flex", className)}>
      {children}
    </motion.span>
  )
}

/** A soft ripple behind a badge; restarts on every new item and fades out after three pulses. */
export function BadgePing({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      key={count}
      aria-hidden="true"
      className={cn("absolute inset-0 rounded-full animate-ping motion-reduce:hidden", className)}
      style={{ animationIterationCount: 3 }}
    />
  )
}
