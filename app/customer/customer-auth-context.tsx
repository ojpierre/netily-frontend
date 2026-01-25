"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { customerApi } from "@/lib/customer-api"

interface CustomerData {
  id: number
  customer_code: string
  full_name: string
  email: string
  phone_number: string
  status: string
  balance: string
  created_at: string
}

interface CustomerAuthContextType {
  customer: CustomerData | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
  refreshCustomer: () => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("customerToken")
      if (token) {
        try {
          // Fetch customer data
          const dashboardData = await customerApi.getDashboard()
          setCustomer(dashboardData.customer)
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem("customerToken")
          localStorage.removeItem("customerRefreshToken")
          setCustomer(null)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (phone: string, password: string) => {
    const response = await customerApi.login(phone, password)
    
    if (response.access) {
      localStorage.setItem("customerToken", response.access)
      if (response.refresh) {
        localStorage.setItem("customerRefreshToken", response.refresh)
      }
      
      // Fetch customer data after login
      const dashboardData = await customerApi.getDashboard()
      setCustomer(dashboardData.customer)
    }
  }

  const logout = () => {
    localStorage.removeItem("customerToken")
    localStorage.removeItem("customerRefreshToken")
    setCustomer(null)
    router.push("/customer/login")
  }

  const refreshCustomer = async () => {
    try {
      const dashboardData = await customerApi.getDashboard()
      setCustomer(dashboardData.customer)
    } catch (error) {
      console.error("Failed to refresh customer data:", error)
    }
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoading,
        isAuthenticated: !!customer,
        login,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider")
  }
  return context
}
