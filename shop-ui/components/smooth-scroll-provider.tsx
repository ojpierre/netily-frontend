"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return <>{children}</>
}
