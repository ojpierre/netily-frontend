"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

interface User {
  id: number
  full_name: string
  email: string
  phone: string
  address: string
  balance: string
  expiry_date: string
  is_active: boolean
  package: {
    id: number
    name: string
    speed_down: number
    speed_up: number
    price: string
  } | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // AUTH DISABLED FOR DEVELOPMENT - Auto-provide mock user
  useEffect(() => {
    // Bypass auth check - provide demo user immediately
    setUser({
      id: 1,
      full_name: "Demo User",
      email: "demo@netily.com",
      phone: "+254712345678",
      address: "123 Demo Street, Nairobi",
      balance: "2500.00",
      expiry_date: "2025-02-15",
      is_active: true,
      package: {
        id: 1,
        name: "Premium 50Mbps",
        speed_down: 50,
        speed_up: 25,
        price: "3500.00",
      },
    })
    setIsLoading(false)
  }, [])

  /* COMMENTED OUT - Original auth check
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (token) {
        const userData = await api.getCurrentUser()
        setUser(userData)
      }
    } catch (error) {
      console.log("Not authenticated, continuing in demo mode")
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    } finally {
      setIsLoading(false)
    }
  }
  */

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    // AUTH DISABLED - Mock login, accept any credentials
    await new Promise(r => setTimeout(r, 500)) // Simulate delay
    
    setUser({
      id: 1,
      full_name: "Demo User",
      email: email || "demo@netily.com",
      phone: "+254712345678",
      address: "123 Demo Street, Nairobi",
      balance: "2500.00",
      expiry_date: "2025-02-15",
      is_active: true,
      package: {
        id: 1,
        name: "Premium 50Mbps",
        speed_down: 50,
        speed_up: 25,
        price: "3500.00",
      },
    })
    setIsLoading(false)
    
    /* COMMENTED OUT - Original API login
    try {
      const { access, refresh } = await api.login(email, password)
      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
      document.cookie = `access_token=${access}; path=/; max-age=86400; SameSite=Lax`
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
    */
  }

  const register = async (data: any) => {
    setIsLoading(true)
    try {
      // Register user with Django backend
      const response = await api.register({
        username: data.email, // Use email as username
        email: data.email,
        password: data.password,
        full_name: data.name,
        phone: data.phone,
        address: `${data.address}, ${data.zipcode}`,
      })
      
      // Store tokens from registration response
      localStorage.setItem("access_token", response.access)
      localStorage.setItem("refresh_token", response.refresh)
      
      // Sync to cookies for middleware
      document.cookie = `access_token=${response.access}; path=/; max-age=86400; SameSite=Lax`

      // Set user data
      setUser(response.user)
      
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    
    // Clear cookies
    document.cookie = "access_token=; path=/; max-age=0"
    
    setUser(null)
    router.push("/")
  }

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Failed to refresh user data")
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
