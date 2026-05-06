"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { adminApi } from "@/lib/admin-api"
import type { User } from "@/lib/types"
import type { AdminLoginResponse } from "@/lib/admin-api"

// ==========================================
// CONFIGURATION
// ==========================================

// Toggle this to switch between mock and real backend
// Set NEXT_PUBLIC_USE_MOCK=true in .env.local to use mock data
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

// ==========================================
// TYPES
// ==========================================

interface AdminUser {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  is_staff: boolean
  is_superuser: boolean
  is_active?: boolean
}

interface AdminAuthContextType {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  establishSession: (response: AdminLoginResponse, rememberMe?: boolean) => void
  logout: () => void
  refreshAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

// ==========================================
// MOCK DATA
// ==========================================

const MOCK_ADMIN: AdminUser = {
  id: 1,
  username: "admin",
  email: "admin@netily.com",
  first_name: "Admin",
  last_name: "User",
  is_staff: true,
  is_superuser: true,
  is_active: true,
}

// ==========================================
// ADMIN AUTH PROVIDER
// ==========================================

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUser()
  }, [])

  const clearAuthCookies = () => {
    if (typeof window === "undefined") return
    const host = window.location.hostname
    const hostParts = host.split(".")
    const baseDomain = hostParts.length >= 2 ? `.${hostParts.slice(-2).join(".")}` : ""
    const expire = (name: string, domain?: string) => {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domain ? `; domain=${domain}` : ""}`
    }
    expire("adminToken")
    expire("adminRefreshToken")
    if (baseDomain) {
      expire("adminToken", baseDomain)
      expire("adminRefreshToken", baseDomain)
    }
  }

  const loadUser = async () => {
    if (USE_MOCK_AUTH) {
      setUser(MOCK_ADMIN)
      setLoading(false)
      return
    }

    try {
      const storage = localStorage.getItem("adminToken") ? localStorage : sessionStorage
      const token = storage.getItem("adminToken")
      
      console.log('loadUser: Token found?', !!token)
      
      if (!token) {
        console.log('loadUser: No token found in storage. Aborting auth check and clearing cookies.')
        setUser(null)
        clearAuthCookies()
        return // Exit the try block early, dropping straight to the finally block
      }

      // Verify token by getting current admin user
      console.log('loadUser: Fetching user from /core/users/me/...')
      let userData: any
      try {
        userData = await adminApi.getCurrentAdmin() as any
      } catch (apiError: any) {
        // If 402 Payment Required, user is valid but subscription expired
        // Use cached user data so TrialGuard can show the payment wall
        if (apiError?.status === 402 || apiError?.isPaymentRequired) {
          console.log('loadUser: 402 Payment Required — subscription expired, using cached user')
          const cachedUser = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser')
          if (cachedUser) {
            try {
              const parsed = JSON.parse(cachedUser)
              setUser(parsed)
              return // Let TrialGuard handle the payment wall
            } catch { /* fall through */ }
          }
        }
        throw apiError // Re-throw non-402 errors
      }
      
      console.log('loadUser: Received user data:', userData)
      
      // Check for admin privileges - support multiple field formats
      const allowedRoles = ['admin', 'staff', 'accountant', 'support', 'superadmin']
      const hasAdminRole = userData?.role && allowedRoles.includes(userData.role.toLowerCase())
      const isStaffOrSuper = userData?.is_staff || userData?.is_superuser
      
      console.log('loadUser: Privilege check:', { role: userData?.role, hasAdminRole, isStaffOrSuper })
      
      if (!hasAdminRole && !isStaffOrSuper) {
        console.log('loadUser: User does not have admin privileges')
        throw new Error("Not an admin user")
      }
      
      console.log('loadUser: Setting user successfully')
      setUser(userData)
      
    } catch (error) {
      console.error("loadUser: Failed to load admin user:", error)
      // Clear invalid tokens
      setUser(null) // Ensure user is null on failure
      localStorage.removeItem("adminToken")
      localStorage.removeItem("adminRefreshToken")
      localStorage.removeItem("adminUser")
      sessionStorage.removeItem("adminToken")
      sessionStorage.removeItem("adminRefreshToken")
      sessionStorage.removeItem("adminUser")
      clearAuthCookies()
    } finally {
      // This will ALWAYS run, even if we return early
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    setLoading(true)

    if (USE_MOCK_AUTH) {
      // Mock mode - accept specific test credentials
      const validEmails = ["admin@netily.com", "admin@example.com"]
      await new Promise(r => setTimeout(r, 500))
      
      if (validEmails.includes(email.toLowerCase()) || email.includes("admin") || password === "admin123") {
        setUser({
          ...MOCK_ADMIN,
          email: email,
        })
        setLoading(false)
        return
      }
      
      setLoading(false)
      throw new Error("Invalid credentials")
    }

    try {
      // Call /core/auth/login/ with email
      // The adminApi.login already validates admin privileges
      console.log('login: Calling API with email:', email)
      const response = await adminApi.login(email, password)
      console.log('login: API response:', response)

      if ((response as any).requires_otp) {
        // OTP challenge flow is handled by login page.
        setLoading(false)
        throw new Error("OTP_CHALLENGE_REQUIRED")
      }
      
      // Store both access and refresh tokens
      const storage = rememberMe ? localStorage : sessionStorage
      console.log('login: Using storage:', rememberMe ? 'localStorage' : 'sessionStorage')
      
      const resolved = response as AdminLoginResponse
      storage.setItem("adminToken", resolved.access)
      storage.setItem("adminRefreshToken", resolved.refresh)
      storage.setItem("adminUser", JSON.stringify(resolved.user))
      
      // Verify tokens were saved
      console.log('login: Token saved?', !!storage.getItem("adminToken"))
      
      // Sync access token to cookies for middleware
      document.cookie = `adminToken=${resolved.access}; path=/; max-age=${rememberMe ? 86400 * 7 : 3600}; SameSite=Lax`
      
      setUser(resolved.user)
      console.log('login: User set, login complete')
    } catch (error: any) {
      setLoading(false)
      throw new Error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const establishSession = (response: AdminLoginResponse, rememberMe: boolean = true) => {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem("adminToken", response.access)
    storage.setItem("adminRefreshToken", response.refresh)
    storage.setItem("adminUser", JSON.stringify(response.user))
    document.cookie = `adminToken=${response.access}; path=/; max-age=${rememberMe ? 86400 * 7 : 3600}; SameSite=Lax`
    setUser(response.user as any)
  }

  // Refresh the access token using the refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const storage = localStorage.getItem("adminRefreshToken") ? localStorage : sessionStorage
      const refresh = storage.getItem("adminRefreshToken")
      
      if (!refresh) {
        return false
      }
      
      const response = await adminApi.refreshToken(refresh)
      
      // Update the access token
      storage.setItem("adminToken", response.access)
      document.cookie = `adminToken=${response.access}; path=/; max-age=3600; SameSite=Lax`
      
      return true
    } catch (error) {
      console.error("Token refresh failed:", error)
      // Clear tokens and redirect to login
      logout()
      return false
    }
  }

  const logout = async () => {
    try {
      if (!USE_MOCK_AUTH) {
        await adminApi.logout()
      }
    } catch (error) {
      console.log("Logout API call failed, continuing with local cleanup")
    }
    
    // Clear all storage
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminRefreshToken")
    localStorage.removeItem("adminUser")
    sessionStorage.removeItem("adminToken")
    sessionStorage.removeItem("adminRefreshToken")
    sessionStorage.removeItem("adminUser")
    
    clearAuthCookies()
    
    setUser(null)
    router.push("/admin/login")
  }

  const refreshAuth = async () => {
    await loadUser()
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, establishSession, logout, refreshAuth, refreshToken }}>
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
