"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface DiaTextRevealProps {
  text: string[]
  repeat?: boolean
  repeatDelay?: number
  duration?: number
  className?: string
}

export function DiaTextReveal({
  text,
  repeat = true,
  repeatDelay = 2,
  duration = 1.1,
  className,
}: DiaTextRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (text.length <= 1) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % text.length)
        setIsAnimating(false)
      }, duration * 1000)
    }, (duration + repeatDelay) * 1000)

    return () => clearInterval(interval)
  }, [text, repeatDelay, duration, text.length])

  if (text.length === 0) return null

  return (
    <span
      className={cn(
        "inline-block transition-all",
        isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        className
      )}
      style={{
        transitionDuration: `${duration}s`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      key={currentIndex}
    >
      {text[currentIndex]}
    </span>
  )
}