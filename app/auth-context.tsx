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

  // Load user on mount
  useEffect(() => {
    checkAuth()
  }, [])

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

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Django uses username field for login (send email as username)
      const { access, refresh } = await api.login(email, password)
      
      // Store tokens
      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
      
      // Sync to cookies for middleware (client-side cookies)
      document.cookie = `access_token=${access}; path=/; max-age=86400; SameSite=Lax`

      // Fetch user profile
      const userData = await api.getCurrentUser()
      setUser(userData)
      
      // Success - router.push will be handled by the page component
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
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
