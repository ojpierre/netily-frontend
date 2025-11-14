"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  phone: string
  address: string
  zipcode: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("netily_user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    const userData: User = {
      id: "1",
      name: "Peter Ouma",
      email: email,
      phone: "254799538923",
      address: "Sakina",
      zipcode: "001",
    }
    setUser(userData)
    localStorage.setItem("netily_user", JSON.stringify(userData))
    setIsLoading(false)
  }

  const register = async (data: any) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    const userData: User = {
      id: Math.random().toString(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      zipcode: data.zipcode,
    }
    setUser(userData)
    localStorage.setItem("netily_user", JSON.stringify(userData))
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("netily_user")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
