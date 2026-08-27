"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supportApi, type SupportUser } from "@/lib/support-api"

interface SupportAuthContextValue {
  user: SupportUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const SupportAuthContext = createContext<SupportAuthContextValue | undefined>(undefined)

export function SupportAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupportUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const current = await supportApi.getMe()
      setUser(current)
    } catch {
      setUser(null)
      supportApi.logout()
      if (pathname !== "/support/login") {
        router.replace(`/support/login?from=${encodeURIComponent(pathname || "/support/dashboard")}`)
      }
    } finally {
      setLoading(false)
    }
  }, [pathname, router])

  useEffect(() => {
    if (pathname === "/support/login") {
      setLoading(false)
      return
    }
    refresh()
  }, [pathname, refresh])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: supportUser } = await supportApi.login(email, password)
      setUser(supportUser)
      router.replace("/support/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    supportApi.logout()
    setUser(null)
    router.replace("/support/login")
  }

  return (
    <SupportAuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </SupportAuthContext.Provider>
  )
}

export function useSupportAuth() {
  const ctx = useContext(SupportAuthContext)
  if (!ctx) throw new Error("useSupportAuth must be used within SupportAuthProvider")
  return ctx
}
