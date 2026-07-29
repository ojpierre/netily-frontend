"use client"

const TOKEN_KEY = "supportToken"
const REFRESH_KEY = "supportRefreshToken"

export interface SupportProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  user_is_active: boolean
  title: string
  phone_number: string
  can_register_tenants: boolean
  can_manage_leads: boolean
  can_view_tenants: boolean
  is_active: boolean
  last_seen_at: string | null
  created_by_email?: string | null
  created_at: string
  updated_at: string
}

export interface SupportUser {
  id: number
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
  role: string
  support_profile: SupportProfile | null
}

export interface SupportActivity {
  id: number
  support_user: number | null
  support_email: string | null
  support_name: string
  action: string
  area: string
  summary: string
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string
  created_at: string
}

export interface SupportLead {
  id: number
  name: string
  email: string
  phone: string
  company_name: string
  lead_source: string
  referral_name: string
  affiliate_referral: {
    referral_id: number
    referral_status: "pending" | "approved" | "paid" | "rejected" | "churned"
    affiliate_id: number
    affiliate_name: string
    affiliate_email: string
    referral_code: string
  } | null
  message: string
  is_contacted: boolean
  contacted_at: string | null
  created_at: string
}

export interface SupportDashboard {
  stats: {
    total_leads: number
    open_leads: number
    contacted_leads: number
    new_leads_7_days: number
    active_tenants: number
    my_actions_today: number
  }
  recent_leads: SupportLead[]
  recent_activity: SupportActivity[]
}

export interface PaginatedSupportLeads {
  count: number
  next: number | null
  previous: number | null
  results: SupportLead[]
}

class SupportApiService {
  private getBaseUrl(): string {
    if (typeof window === "undefined") return "http://localhost:8000/api/v1"
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
    }
    const proto = window.location.protocol
    const hostname = window.location.hostname
    const port = process.env.NEXT_PUBLIC_API_PORT || "8000"
    return `${proto}//${hostname}:${port}/api/v1`
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${this.getBaseUrl()}${endpoint}`, { ...options, headers })
    if (!res.ok) {
      if (res.status === 401) {
        const refreshed = await this.tryRefresh()
        if (refreshed) return this.request<T>(endpoint, options)
        throw new Error("Session expired. Please login again.")
      }
      const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }))
      throw new Error(err.detail || err.message || "Request failed")
    }
    if (res.status === 204) return undefined as T
    return res.json()
  }

  private async tryRefresh(): Promise<boolean> {
    const refresh = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
    if (!refresh) return false
    try {
      const res = await fetch(`${this.getBaseUrl()}/core/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })
      if (!res.ok) return false
      const data = await res.json()
      const storage = localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage
      storage.setItem(TOKEN_KEY, data.access)
      document.cookie = `supportToken=${data.access}; path=/; max-age=3600; SameSite=Lax`
      return true
    } catch {
      return false
    }
  }

  async login(email: string, password: string): Promise<{ user: SupportUser }> {
    const res = await fetch(`${this.getBaseUrl()}/support-console/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }))
      throw new Error(err.detail || "Login failed")
    }
    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.access)
    localStorage.setItem(REFRESH_KEY, data.refresh)
    document.cookie = `supportToken=${data.access}; path=/; max-age=3600; SameSite=Lax`
    return { user: data.user }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    document.cookie = "supportToken=; path=/; max-age=0"
  }

  getMe(): Promise<SupportUser> {
    return this.request("/support-console/me/")
  }

  getDashboard(): Promise<SupportDashboard> {
    return this.request("/support-console/dashboard/")
  }

  getActivity(): Promise<SupportActivity[]> {
    return this.request("/support-console/activity/")
  }

  logActivity(data: { action: string; area?: string; summary: string; metadata?: Record<string, unknown> }) {
    return this.request("/support-console/activity/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  getLeads(params?: Record<string, string>): Promise<PaginatedSupportLeads> {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/support-console/leads/${qs}`)
  }

  createLead(data: Partial<SupportLead>): Promise<SupportLead> {
    return this.request("/support-console/leads/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  updateLead(id: number, data: Partial<SupportLead>): Promise<SupportLead> {
    return this.request(`/support-console/leads/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }
}

export const supportApi = new SupportApiService()
