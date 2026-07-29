"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { affiliateApi, type AffiliateLoginChallenge, type AffiliateUser } from "@/lib/affiliate-api"

interface AffiliateAuthContextValue {
  user: AffiliateUser | null
  loading: boolean
  login: (email: string, password: string, otp?: { challenge_id: string; otp_code: string }) => Promise<AffiliateLoginChallenge | null>
  logout: () => void
  refresh: () => Promise<void>
  setUser: (u: AffiliateUser | null) => void
}

const AffiliateAuthContext = createContext<AffiliateAuthContextValue | undefined>(undefined)

const AFFILIATE_PUBLIC_PATHS = ["/affiliate/login", "/affiliate/register", "/affiliate/verify"]

export function isAffiliatePublicPath(pathname: string | null): boolean {
  return pathname === "/affiliate" || AFFILIATE_PUBLIC_PATHS.some((path) => pathname?.startsWith(path))
}

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
      if (!isAffiliatePublicPath(pathname)) {
        router.replace(`/affiliate/login?from=${encodeURIComponent(pathname || "/affiliate/dashboard")}`)
      }
    } finally {
      setLoading(false)
    }
  }, [pathname, router])

  useEffect(() => {
    if (isAffiliatePublicPath(pathname)) {
      setLoading(false)
      return
    }
    refresh()
  }, [pathname, refresh])

  const login = async (email: string, password: string, otp?: { challenge_id: string; otp_code: string }) => {
    setLoading(true)
    try {
      const result = await affiliateApi.login(email, password, otp)
      if ("requires_otp" in result) return result
      setUser(result.user)
      router.replace("/affiliate/dashboard")
      return null
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
