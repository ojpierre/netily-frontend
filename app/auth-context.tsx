"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { User, Customer, CustomerService } from "@/lib/types"

// ==========================================
// CONFIGURATION
// ==========================================

// Toggle this to switch between mock and real backend
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true

// ==========================================
// TYPES
// ==========================================

interface CustomerUser {
  id: number
  customer_id?: number
  full_name: string
  email: string
  phone: string
  address?: string
  balance: string
  expiry_date?: string
  is_active: boolean
  status?: string
  package?: {
    id: number
    name: string
    speed_down: number
    speed_up: number
    price: string
  } | null
  services?: CustomerService[]
}

interface AuthContextType {
  user: CustomerUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  name: string
  phone: string
  address?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ==========================================
// MOCK DATA
// ==========================================

const MOCK_USER: CustomerUser = {
  id: 1,
  customer_id: 1,
  full_name: "Demo User",
  email: "demo@netily.com",
  phone: "+254712345678",
  address: "123 Demo Street, Nairobi",
  balance: "2500.00",
  expiry_date: "2025-02-15",
  is_active: true,
  status: "active",
  package: {
    id: 1,
    name: "Premium 50Mbps",
    speed_down: 50,
    speed_up: 25,
    price: "3500.00",
  },
}

// ==========================================
// AUTH PROVIDER
// ==========================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    if (USE_MOCK_AUTH) {
      // Mock mode - provide demo user immediately
      setUser(MOCK_USER)
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      if (token) {
        // Get current user from /core/users/me/
        const userData = await api.getCurrentUser()
        
        // Transform User to CustomerUser format
        // The backend might return user data differently, adjust as needed
        const customerUser: CustomerUser = {
          id: userData.id,
          full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
          email: userData.email,
          phone: '',
          balance: '0.00',
          is_active: userData.is_active,
        }
        
        setUser(customerUser)
      }
    } catch (error) {
      console.log("Not authenticated, clearing tokens")
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      document.cookie = "access_token=; path=/; max-age=0"
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    
    if (USE_MOCK_AUTH) {
      // Mock mode - accept any credentials
      await new Promise(r => setTimeout(r, 500))
      setUser({
        ...MOCK_USER,
        email: username || MOCK_USER.email,
      })
      setIsLoading(false)
      return
    }

    try {
      // Call /core/auth/login/
      const { access, refresh, user: responseUser } = await api.login(username, password)
      
      // Store tokens
      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
      document.cookie = `access_token=${access}; path=/; max-age=86400; SameSite=Lax`
      
      // Get full user profile
      const userData = await api.getCurrentUser()
      
      const customerUser: CustomerUser = {
        id: userData.id,
        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
        email: userData.email,
        phone: '',
        balance: '0.00',
        is_active: userData.is_active,
      }
      
      setUser(customerUser)
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    
    if (USE_MOCK_AUTH) {
      await new Promise(r => setTimeout(r, 500))
      setUser({
        ...MOCK_USER,
        full_name: data.name,
        email: data.email,
        phone: data.phone,
      })
      setIsLoading(false)
      return
    }

    try {
      // Call /core/auth/register/
      const response = await api.register({
        username: data.email,
        email: data.email,
        password: data.password,
        password_confirm: data.password,
        first_name: data.name.split(' ')[0] || '',
        last_name: data.name.split(' ').slice(1).join(' ') || '',
        phone: data.phone,
      })
      
      // Store tokens
      localStorage.setItem("access_token", response.access)
      localStorage.setItem("refresh_token", response.refresh)
      document.cookie = `access_token=${response.access}; path=/; max-age=86400; SameSite=Lax`

      // Set user data
      const customerUser: CustomerUser = {
        id: response.user.id,
        full_name: `${response.user.first_name || ''} ${response.user.last_name || ''}`.trim() || response.user.username,
        email: response.user.email,
        phone: data.phone,
        balance: '0.00',
        is_active: response.user.is_active,
      }
      
      setUser(customerUser)
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (!USE_MOCK_AUTH) {
        await api.logout()
      }
    } catch (error) {
      console.log("Logout API call failed, continuing with local cleanup")
    }
    
    // Clear local storage
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    
    // Clear cookies
    document.cookie = "access_token=; path=/; max-age=0"
    
    setUser(null)
    router.push("/")
  }

  const refreshUser = async () => {
    if (USE_MOCK_AUTH) {
      return
    }

    try {
      const userData = await api.getCurrentUser()
      const customerUser: CustomerUser = {
        id: userData.id,
        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
        email: userData.email,
        phone: '',
        balance: '0.00',
        is_active: userData.is_active,
      }
      setUser(customerUser)
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
