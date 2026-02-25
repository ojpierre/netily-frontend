"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { superadminApi } from "@/lib/superadmin-api"

// ── Types ──

interface SuperAdminUser {
  id: number
  email: string
  first_name?: string
  last_name?: string
  is_staff: boolean
  is_superuser: boolean
  role?: string
}

interface SuperAdminAuthContextType {
  user: SuperAdminUser | null
  loading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => void
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined)

const TOKEN_KEY = "superadminToken"
const REFRESH_KEY = "superadminRefreshToken"

// ── Provider ──

export function SuperAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SuperAdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadUser = useCallback(async () => {
    try {
      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage
      const token = storage.getItem(TOKEN_KEY)
      if (!token) {
        setLoading(false)
        return
      }

      // Verify token by hitting dashboard (lightweight)
      const kpi = await superadminApi.getDashboard()
      // If we got here the token is valid and user is superadmin
      // Decode minimal user info from the token
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUser({
          id: payload.user_id,
          email: payload.email || "",
          first_name: payload.first_name || "",
          last_name: payload.last_name || "",
          is_staff: true,
          is_superuser: true,
        })
      } catch {
        // token parse failed, but API worked so user is valid
        setUser({
          id: 0,
          email: "superadmin",
          is_staff: true,
          is_superuser: true,
        })
      }
    } catch {
      // Clear stale tokens
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
      document.cookie = "superadminToken=; path=/; max-age=0"
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email: string, password: string, remember = false) => {
    const res = await superadminApi.login(email, password)
    const userData = (res as any).user
    if (!userData?.is_superuser) {
      superadminApi.logout()
      throw new Error("Access denied: this account is not a platform superadmin")
    }
    setUser(userData)
    router.push("/superadmin")
  }

  const logout = () => {
    superadminApi.logout()
    setUser(null)
    router.push("/superadmin/login")
  }

  return (
    <SuperAdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </SuperAdminAuthContext.Provider>
  )
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext)
  if (!ctx) throw new Error("useSuperAdminAuth must be used inside SuperAdminAuthProvider")
  return ctx
}
