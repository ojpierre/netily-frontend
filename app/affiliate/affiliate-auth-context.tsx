"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { affiliateApi, type AffiliateUser } from "@/lib/affiliate-api"

interface AffiliateAuthContextValue {
  user: AffiliateUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
  setUser: (u: AffiliateUser | null) => void
}

const AffiliateAuthContext = createContext<AffiliateAuthContextValue | undefined>(undefined)

const PUBLIC_PATHS = ["/affiliate/login", "/affiliate/register"]

export function AffiliateAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AffiliateUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const current = await affiliateApi.getMe()
      setUser(current)
    } catch {
      setUser(null)
      affiliateApi.logout()
      if (pathname !== "/affiliate" && !PUBLIC_PATHS.some((p) => pathname?.startsWith(p))) {
        router.replace(`/affiliate/login?from=${encodeURIComponent(pathname || "/affiliate/dashboard")}`)
      }
    } finally {
      setLoading(false)
    }
  }, [pathname, router])

  useEffect(() => {
    if (pathname === "/affiliate" || PUBLIC_PATHS.some((p) => pathname?.startsWith(p))) {
      setLoading(false)
      return
    }
    refresh()
  }, [pathname, refresh])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: affiliateUser } = await affiliateApi.login(email, password)
      setUser(affiliateUser)
      router.replace("/affiliate/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    affiliateApi.logout()
    setUser(null)
    router.replace("/affiliate/login")
  }

  return (
    <AffiliateAuthContext.Provider value={{ user, loading, login, logout, refresh, setUser }}>
      {children}
    </AffiliateAuthContext.Provider>
  )
}

export function useAffiliateAuth() {
  const ctx = useContext(AffiliateAuthContext)
  if (!ctx) throw new Error("useAffiliateAuth must be used within AffiliateAuthProvider")
  return ctx
}
