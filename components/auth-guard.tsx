"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

// AUTH DISABLED FOR DEVELOPMENT
const ENABLE_AUTH = false

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth checks if disabled
    if (!ENABLE_AUTH) return

    /* COMMENTED OUT - Original auth sync and route protection
    // Sync localStorage tokens to cookies for middleware
    const syncTokens = () => {
      if (typeof window !== "undefined") {
        const accessToken = localStorage.getItem("access_token")
        const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken")
        
        // Sync user token
        if (accessToken) {
          document.cookie = `access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`
        }
        
        // Sync admin token
        if (adminToken) {
          document.cookie = `adminToken=${adminToken}; path=/; max-age=86400; SameSite=Lax`
        }

        // Client-side route protection
        const isAdminRoute = pathname.startsWith("/admin")
        const isDashboardRoute = pathname.startsWith("/dashboard")
        const isPublicRoute = pathname === "/" || pathname === "/admin/login" || pathname === "/customer/login"

        if (isAdminRoute && pathname !== "/admin/login" && !adminToken) {
          router.push("/admin/login")
        } else if (isDashboardRoute && !accessToken) {
          router.push("/customer/login")
        } else if (pathname === "/customer/login" && accessToken) {
          router.push("/dashboard")
        } else if (pathname === "/admin/login" && adminToken) {
          router.push("/admin")
        }
      }
    }

    syncTokens()
    */
  }, [pathname, router])

  return <>{children}</>
}
