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
const ADMIN_ALLOWED_ROLES = ["admin", "staff", "accountant", "support", "superadmin", "super_admin"]
const PLATFORM_ADMIN_EMAILS = String(process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS || "")
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean)

// ==========================================
// TYPES
// ==========================================

interface AdminUser {
  id: number
  username?: string
  email: string
  first_name?: string
  last_name?: string
  is_staff: boolean
  is_superuser: boolean
  is_active?: boolean
  role?: string
  access_level?: string
  department?: string | null
  department_name?: string | null
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
  role: "super_admin",
  access_level: "super_admin",
  department: null,
  department_name: null,
}

const normalizeAdminUser = (user: any): AdminUser => ({
  id: user?.id,
  username: user?.username || user?.email?.split("@")[0] || "admin",
  email: user?.email,
  first_name: user?.first_name,
  last_name: user?.last_name,
  is_staff: !!user?.is_staff,
  is_superuser: !!user?.is_superuser,
  is_active: user?.is_active,
  role: String(user?.role || user?.access_level || "basic").toLowerCase(),
  access_level: String(user?.access_level || "basic").toLowerCase(),
  department: user?.department ? String(user.department).toLowerCase() : null,
  department_name: user?.department_name || user?.department || null,
})

const isAllowedAdminUser = (user: any): boolean => {
  const role = String(user?.role || "").toLowerCase()
  const accessLevel = String(user?.access_level || "").toLowerCase()
  const isPlatformAdminEmail = !!user?.email && PLATFORM_ADMIN_EMAILS.includes(String(user.email).toLowerCase())
  return [role, accessLevel].some((value) => ADMIN_ALLOWED_ROLES.includes(value)) || !!user?.is_staff || !!user?.is_superuser || isPlatformAdminEmail
}

const hostScopedKey = (base: string): string => {
  if (typeof window === "undefined") return base
  return `${base}:${window.location.hostname}`
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

  const hasAdminLikeRole = (raw: string | null): boolean => {
    if (!raw) return false
    try {
      const u = JSON.parse(raw)
      const role = String(u?.role || "").toLowerCase()
      const accessLevel = String(u?.access_level || "").toLowerCase()
      const isPlatformAdminEmail = !!u?.email && PLATFORM_ADMIN_EMAILS.includes(String(u.email).toLowerCase())
      return [role, accessLevel].some((value) => ADMIN_ALLOWED_ROLES.includes(value)) || !!u?.is_staff || !!u?.is_superuser || isPlatformAdminEmail
    } catch {
      return false
    }
  }

  const readCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
  }

  const pickTokenStorage = (): Storage | null => {
    if (typeof window === "undefined") return null
    const tokenKey = hostScopedKey("adminToken")
    const userKey = hostScopedKey("adminUser")
    const localToken = localStorage.getItem(tokenKey) || localStorage.getItem("adminToken")
    const sessionToken = sessionStorage.getItem(tokenKey) || sessionStorage.getItem("adminToken")
    if (!localToken && !sessionToken) return null
    if (localToken && !sessionToken) return localStorage
    if (!localToken && sessionToken) return sessionStorage

    const localIsAdmin = hasAdminLikeRole(localStorage.getItem(userKey) || localStorage.getItem("adminUser"))
    const sessionIsAdmin = hasAdminLikeRole(sessionStorage.getItem(userKey) || sessionStorage.getItem("adminUser"))
    if (sessionIsAdmin && !localIsAdmin) return sessionStorage
    if (localIsAdmin && !sessionIsAdmin) return localStorage
    // If both exist and ambiguous, prefer session as it's usually the latest interactive login.
    return sessionStorage
  }

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
      const storage = pickTokenStorage()
      let token = storage
        ? (storage.getItem(hostScopedKey("adminToken")) || storage.getItem("adminToken"))
        : null

      // Fallback: recover from auth cookie if storage got cleared by browser/privacy settings.
      if (!token) {
        const cookieToken = readCookie("adminToken")
        if (cookieToken) {
          const preferredStorage = localStorage
          preferredStorage.setItem(hostScopedKey("adminToken"), cookieToken)
          token = cookieToken
        }
      }

      if (!token) {
        console.log('loadUser: No token found in storage. Aborting auth check and clearing cookies.')
        setUser(null)
        clearAuthCookies()
        return
      }
      
      console.log('loadUser: Token found?', !!token)
      
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
          const cachedUser =
            localStorage.getItem(hostScopedKey("adminUser")) ||
            sessionStorage.getItem(hostScopedKey("adminUser")) ||
            localStorage.getItem('adminUser') ||
            sessionStorage.getItem('adminUser')
          if (cachedUser) {
            try {
              const parsed = JSON.parse(cachedUser)
              setUser(normalizeAdminUser(parsed))
              return // Let TrialGuard handle the payment wall
            } catch { /* fall through */ }
          }
        }
        throw apiError // Re-throw non-402 errors
      }
      
      console.log('loadUser: Received user data:', userData)
      
      // Check for admin privileges - support multiple field formats
      const resolvedRole = String(userData?.role || "").toLowerCase()
      const resolvedAccessLevel = String(userData?.access_level || "").toLowerCase()
      const hasAdminRole = [resolvedRole, resolvedAccessLevel].some((value) => ADMIN_ALLOWED_ROLES.includes(value))
      const isStaffOrSuper = userData?.is_staff || userData?.is_superuser
      const isPlatformAdminEmail = !!userData?.email && PLATFORM_ADMIN_EMAILS.includes(String(userData.email).toLowerCase())
      
      console.log('loadUser: Privilege check:', { role: resolvedRole, access_level: resolvedAccessLevel, hasAdminRole, isStaffOrSuper, isPlatformAdminEmail })
      
      if (!hasAdminRole && !isStaffOrSuper && !isPlatformAdminEmail) {
        console.log('loadUser: User does not have admin privileges')
        throw new Error("Not an admin user")
      }
      
      console.log('loadUser: Setting user successfully')
      setUser(normalizeAdminUser(userData))
      
    } catch (error) {
      console.error("loadUser: Failed to load admin user:", error)
      // Clear invalid tokens
      setUser(null) // Ensure user is null on failure
      localStorage.removeItem(hostScopedKey("adminToken"))
      localStorage.removeItem(hostScopedKey("adminRefreshToken"))
      localStorage.removeItem(hostScopedKey("adminUser"))
      sessionStorage.removeItem(hostScopedKey("adminToken"))
      sessionStorage.removeItem(hostScopedKey("adminRefreshToken"))
      sessionStorage.removeItem(hostScopedKey("adminUser"))
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
      const other = rememberMe ? sessionStorage : localStorage
      console.log('login: Using storage:', rememberMe ? 'localStorage' : 'sessionStorage')
      other.removeItem(hostScopedKey("adminToken"))
      other.removeItem(hostScopedKey("adminRefreshToken"))
      other.removeItem(hostScopedKey("adminUser"))
      other.removeItem("adminToken")
      other.removeItem("adminRefreshToken")
      other.removeItem("adminUser")
      const resolved = response as AdminLoginResponse
      if (!isAllowedAdminUser(resolved.user)) {
        clearAuthCookies()
        throw new Error("Access denied. This account is not an admin user.")
      }
      storage.setItem(hostScopedKey("adminToken"), resolved.access)
      storage.setItem(hostScopedKey("adminRefreshToken"), resolved.refresh)
      storage.setItem(hostScopedKey("adminUser"), JSON.stringify(resolved.user))
      // Backward compatibility for older readers that still use legacy keys.
      storage.setItem("adminToken", resolved.access)
      storage.setItem("adminRefreshToken", resolved.refresh)
      storage.setItem("adminUser", JSON.stringify(resolved.user))
      
      // Verify tokens were saved
      console.log('login: Token saved?', !!storage.getItem("adminToken"))
      
      // Sync access token to cookies for middleware
      document.cookie = `adminToken=${resolved.access}; path=/; max-age=${rememberMe ? 86400 * 7 : 3600}; SameSite=Lax`
      
      try {
        const profile = await adminApi.getCurrentAdmin()
        storage.setItem(hostScopedKey("adminUser"), JSON.stringify(profile))
        storage.setItem("adminUser", JSON.stringify(profile))
        setUser(normalizeAdminUser(profile))
      } catch {
        setUser(normalizeAdminUser(resolved.user))
      }
      console.log('login: User set, login complete')
    } catch (error: any) {
      setLoading(false)
      throw new Error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const establishSession = (response: AdminLoginResponse, rememberMe: boolean = true) => {
    if (!isAllowedAdminUser(response.user)) {
      clearAuthCookies()
      throw new Error("Access denied. This account is not an admin user.")
    }
    const storage = rememberMe ? localStorage : sessionStorage
    const other = rememberMe ? sessionStorage : localStorage
    other.removeItem(hostScopedKey("adminToken"))
    other.removeItem(hostScopedKey("adminRefreshToken"))
    other.removeItem(hostScopedKey("adminUser"))
    other.removeItem("adminToken")
    other.removeItem("adminRefreshToken")
    other.removeItem("adminUser")
    storage.setItem(hostScopedKey("adminToken"), response.access)
    storage.setItem(hostScopedKey("adminRefreshToken"), response.refresh)
    storage.setItem(hostScopedKey("adminUser"), JSON.stringify(response.user))
    storage.setItem("adminToken", response.access)
    storage.setItem("adminRefreshToken", response.refresh)
    storage.setItem("adminUser", JSON.stringify(response.user))
    document.cookie = `adminToken=${response.access}; path=/; max-age=${rememberMe ? 86400 * 7 : 3600}; SameSite=Lax`
    setUser(normalizeAdminUser(response.user))
    adminApi.getCurrentAdmin().then((profile) => {
      storage.setItem(hostScopedKey("adminUser"), JSON.stringify(profile))
      storage.setItem("adminUser", JSON.stringify(profile))
      setUser(normalizeAdminUser(profile))
    }).catch(() => {
      // The login payload is enough to keep the session alive; the profile
      // refresh only enriches RBAC fields for department-aware navigation.
    })
  }

  // Refresh the access token using the refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshKey = hostScopedKey("adminRefreshToken")
      const storage = localStorage.getItem(refreshKey) ? localStorage : sessionStorage
      const refresh = storage.getItem(refreshKey) || storage.getItem("adminRefreshToken")
      
      if (!refresh) {
        return false
      }
      
      const response = await adminApi.refreshToken(refresh)
      
      // Update the access token
      storage.setItem(hostScopedKey("adminToken"), response.access)
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
    localStorage.removeItem(hostScopedKey("adminToken"))
    localStorage.removeItem(hostScopedKey("adminRefreshToken"))
    localStorage.removeItem(hostScopedKey("adminUser"))
    sessionStorage.removeItem(hostScopedKey("adminToken"))
    sessionStorage.removeItem(hostScopedKey("adminRefreshToken"))
    sessionStorage.removeItem(hostScopedKey("adminUser"))
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
