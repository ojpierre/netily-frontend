"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api, Customer } from "@/lib/api"

interface AuthContextType {
  user: Customer | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

interface RegisterFormData {
  name: string
  email: string
  phone: string
  address: string
  zipcode: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (token) {
        const customer = await api.getCustomerProfile()
        setUser(customer)
      }
    } catch (error) {
      console.error("Failed to load user:", error)
      // Clear invalid tokens
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      setUser(null)
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

      // Fetch user profile
      const customer = await api.getCustomerProfile()
      setUser(customer)
      
      // Success - router.push will be handled by the page component
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // Call backend register endpoint
      const response = await api.register({
        username: data.email, // Backend uses email as username
        email: data.email,
        password: data.password,
        full_name: data.name,
        phone: data.phone,
        address: `${data.address}, ${data.zipcode}`, // Combine address and zipcode
      })

      // Store tokens
      localStorage.setItem("access_token", response.access)
      localStorage.setItem("refresh_token", response.refresh)

      // Fetch full customer profile
      const customer = await api.getCustomerProfile()
      setUser(customer)

      // Success - router.push will be handled by the page component
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
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const customer = await api.getCustomerProfile()
      setUser(customer)
    } catch (error) {
      console.error("Failed to refresh user:", error)
      // If refresh fails, logout
      logout()
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
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
