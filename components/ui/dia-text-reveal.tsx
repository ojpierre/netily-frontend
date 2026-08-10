// components/ui/dia-text-reveal.tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface DiaTextRevealProps {
  text: string | string[]
  colors?: string[]
  textColor?: string
  duration?: number
  delay?: number
  repeat?: boolean
  repeatDelay?: number
  startOnView?: boolean
  once?: boolean
  className?: string
  fixedWidth?: boolean
}

const DEFAULT_COLORS = ["#c679c4", "#fa3d1d", "#ffb005", "#e1e1fe", "#0358f7"]

export function DiaTextReveal({
  text,
  colors = DEFAULT_COLORS,
  textColor = "var(--foreground)",
  duration = 1.5,
  delay = 0,
  repeat = false,
  repeatDelay = 0.5,
  startOnView = true,
  once = true,
  className,
  fixedWidth = false,
}: DiaTextRevealProps) {
  const items = Array.isArray(text) ? text : [text]
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(!startOnView)
  const [playKey, setPlayKey] = useState(0)
  const hasPlayedRef = useRef(false)
  const rootRef = useRef<HTMLSpanElement>(null)

  // Trigger on viewport entry (IntersectionObserver — cheap, no scroll listeners)
  useEffect(() => {
    if (!startOnView) return
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (once && hasPlayedRef.current) return
          hasPlayedRef.current = true
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [startOnView, once])

  // Rotate through array items after each sweep completes
  useEffect(() => {
    if (!inView || !repeat || items.length <= 1) return
    const cycleMs = (duration + repeatDelay) * 1000
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
      setPlayKey((k) => k + 1)
    }, cycleMs)
    return () => clearInterval(t)
  }, [inView, repeat, items.length, duration, repeatDelay])

  const gradient = `linear-gradient(90deg, ${colors.join(", ")})`
  const widest = fixedWidth
    ? items.reduce((a, b) => (b.length > a.length ? b : a), "")
    : null

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-grid", className)}
      style={fixedWidth ? { minWidth: `${widest?.length ?? 0}ch` } : undefined}
    >
      {/* Base solid text — always visible underneath */}
      <span className="col-start-1 row-start-1" style={{ color: textColor }}>
        {items[index]}
      </span>

      {/* Sweeping gradient overlay — fades out to reveal base text */}
      {inView && (
        <span
          key={playKey}
          aria-hidden="true"
          className="col-start-1 row-start-1 dia-sweep-overlay"
          style={{
            backgroundImage: gradient,
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        >
          {items[index]}
        </span>
      )}

      <style jsx>{`
        .dia-sweep-overlay {
          background-position: 200% 0;
          animation-name: dia-sweep;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: forwards;
        }
        @keyframes dia-sweep {
          0% {
            background-position: 200% 0;
            opacity: 1;
          }
          65% {
            background-position: -20% 0;
            opacity: 1;
          }
          100% {
            background-position: -60% 0;
            opacity: 0;
          }
        }
      `}</style>
    </span>
  )
}