// components/ui/payment-ticker.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface PaymentTickerProps {
  items: string[]
  /** How long each item stays fully visible, in ms */
  holdMs?: number
  /** Fade/slide transition duration, in ms */
  transitionMs?: number
  className?: string
}

/**
 * Single-item crossfade ticker. Only one text node is ever mounted,
 * so there is never a risk of two strings rendering simultaneously.
 * Cycle: hold -> fade out -> swap content -> fade in -> repeat.
 */
export function PaymentTicker({
  items,
  holdMs = 3200,
  transitionMs = 600,
  className,
}: PaymentTickerProps) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  }, [])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  // Fade the current item in one frame after it mounts/changes
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [index])

  // Cycle: hold -> fade out -> advance index -> (effect above fades it back in)
  useEffect(() => {
    if (items.length <= 1) return
    clearTimers()
    const holdTimer = setTimeout(() => {
      setVisible(false)
      const swapTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % items.length)
      }, transitionMs)
      timers.current.push(swapTimer)
    }, holdMs)
    timers.current.push(holdTimer)
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length, holdMs, transitionMs])

  if (items.length === 0) return null

  return (
    <div className={cn("relative h-5 overflow-hidden", className)}>
      <span
        key={index}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
        style={{
          transition: reducedMotion.current
            ? "opacity 200ms linear"
            : `opacity ${transitionMs}ms cubic-bezier(0.16,1,0.3,1), transform ${transitionMs}ms cubic-bezier(0.16,1,0.3,1)`,
          opacity: visible ? 1 : 0,
          transform: reducedMotion.current
            ? "none"
            : visible
              ? "translateY(0)"
              : "translateY(6px)",
        }}
      >
        {items[index]}
      </span>
    </div>
  )
}