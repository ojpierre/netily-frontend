"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AdminUser {
  id: number
  username: string
  email: string
  is_staff: boolean
  is_superuser: boolean
}

interface AdminAuthContextType {
  user: AdminUser | null
  loading: boolean
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadUser = () => {
    try {
      const storage = localStorage.getItem("adminToken") ? localStorage : sessionStorage
      const userStr = storage.getItem("adminUser")
      if (userStr) {
        setUser(JSON.parse(userStr))
      }
    } catch (error) {
      console.error("Failed to load admin user:", error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminRefreshToken")
    localStorage.removeItem("adminUser")
    sessionStorage.removeItem("adminToken")
    sessionStorage.removeItem("adminRefreshToken")
    sessionStorage.removeItem("adminUser")
    
    // Clear cookies
    document.cookie = "adminToken=; path=/; max-age=0"
    
    setUser(null)
    router.push("/admin/login")
  }

  const refreshAuth = async () => {
    loadUser()
  }

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <AdminAuthContext.Provider value={{ user, loading, logout, refreshAuth }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return context
}
