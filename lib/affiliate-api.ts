"use client"

const TOKEN_KEY = "affiliateToken"
const REFRESH_KEY = "affiliateRefreshToken"

export interface AffiliateUser {
  id: number
  email: string
  full_name: string
  phone: string
  country: string
  currency: string
  referral_code: string
  referral_link: string
  is_verified: boolean
  tier: "bronze" | "silver" | "gold"
  status?: "active" | "inactive" | "suspended"
  created_at: string
}

export interface AffiliateLoginChallenge {
  requires_otp: true
  challenge_id: string
  email: string
  message: string
  expires_in: number
  resend_available_in: number
  resend_count?: number
  max_resends: number
}

export interface AffiliateLoginSuccess {
  user: AffiliateUser
  access: string
  refresh: string
}

export interface Referral {
  id: number
  isp_name: string
  company: string
  signup_email?: string
  signup_date: string
  status: "pending" | "approved" | "paid" | "rejected" | "churned"
  reward_amount: number
  currency: string
  admin_notes?: string
  attribution_type?: "tracked_click" | "lead_form" | "manual"
  click_id?: number | null
  clicked_at?: string | null
  lead_id?: number | null
  source?: string
}

export interface Payout {
  id: number
  date: string
  amount: number
  currency: string
  method: "mpesa" | "bank"
  status: "completed" | "pending" | "failed"
  reference: string
  notes?: string
}

export interface AnalyticsData {
  period: string
  link_views: number
  signups: number
  paid: number
  conversion_rate: number
  epc: number
  daily: { date: string; views: number; signups: number; paid: number }[]
}

export interface TrafficSource {
  source: string
  clicks: number
  signups: number
  conversion_rate: number
}

export interface DashboardData {
  greeting_name: string
  referral_code: string
  referral_link: string
  stats: {
    link_views: number
    signed_up: number
    paid: number
    conversion_rate: number
    total_earnings: number
    currency: string
  }
  funnel: { link_clicks: number; page_views: number; signups: number; paid: number }
  recent_activity: { date: string; event: string }[]
}

export interface RewardTier {
  current_tier: "bronze" | "silver" | "gold"
  referrals_count: number
  tiers: {
    name: string
    key: "bronze" | "silver" | "gold"
    min_referrals: number
    max_referrals: number | null
    reward_per_referral: number
    currency: string
    unlocked: boolean
  }[]
  next_tier_remaining: number | null
}

export interface MarketingAsset {
  id: number
  category: "whatsapp" | "social" | "brand"
  title: string
  content: string
  file_url?: string
}

export interface PaymentMethod {
  type: "mpesa" | "bank"
  mpesa_phone?: string
  mpesa_name?: string
  bank_name?: string
  bank_account?: string
  bank_branch?: string
  is_verified: boolean
}

export interface AdminAffiliate {
  id: number
  full_name: string
  email: string
  phone: string
  referral_code: string
  referral_link: string
  is_verified: boolean
  referrals_count: number
  total_earned: number
  currency: string
  status: "active" | "inactive" | "suspended"
  tier: "bronze" | "silver" | "gold"
  payment_method: string
  created_at: string
  referrals: Referral[]
  payouts?: Payout[]
}

class AffiliateApiService {
  private getBaseUrl(): string {
    if (typeof window === "undefined") return "http://localhost:8000/api/v1"
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
    return `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_API_PORT || "8000"}/api/v1`
  }

  private getToken(type: "affiliate" | "superadmin"): string | null {
    if (typeof window === "undefined") return null
    const key = type === "affiliate" ? TOKEN_KEY : "superadminToken"
    return localStorage.getItem(key) || sessionStorage.getItem(key)
  }

  private getSessionId(): string {
    if (typeof window === "undefined") return "affiliate-server"
    const key = "affiliateSessionId"
    let value = sessionStorage.getItem(key)
    if (!value) {
      value = crypto.randomUUID()
      sessionStorage.setItem(key, value)
    }
    return value
  }

  private async refreshToken(type: "affiliate" | "superadmin"): Promise<string | null> {
    if (typeof window === "undefined") return null
    const refreshKey = type === "affiliate" ? REFRESH_KEY : "superadminRefreshToken"
    const accessKey = type === "affiliate" ? TOKEN_KEY : "superadminToken"
    const storage = localStorage.getItem(refreshKey) ? localStorage : sessionStorage
    const refresh = storage.getItem(refreshKey)
    if (!refresh) return null
    const refreshEndpoint = type === "affiliate" ? "/affiliate/token/refresh/" : "/core/auth/token/refresh/"
    const response = await fetch(`${this.getBaseUrl()}${refreshEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    })
    if (!response.ok) return null
    const data = await response.json()
    storage.setItem(accessKey, data.access)
    return data.access
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    tokenType: "affiliate" | "superadmin" | "public" = "affiliate",
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    }
    const token = tokenType === "public" ? null : this.getToken(tokenType)
    if (token) headers.Authorization = `Bearer ${token}`
    let response = await fetch(`${this.getBaseUrl()}${endpoint}`, { ...options, headers, cache: "no-store" })
    if (response.status === 401 && tokenType !== "public") {
      const refreshed = await this.refreshToken(tokenType)
      if (refreshed) {
        headers.Authorization = `Bearer ${refreshed}`
        response = await fetch(`${this.getBaseUrl()}${endpoint}`, { ...options, headers, cache: "no-store" })
      }
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `Request failed (${response.status})` }))
      const values = typeof error === "object" && error ? Object.values(error).flat() : []
      throw new Error(String(error.detail || error.error || values.join(", ") || "Request failed"))
    }
    if (response.status === 204) return undefined as T
    return response.json()
  }

  async register(data: { full_name: string; email: string; phone: string; country: string; password: string }) {
    return this.request<{ user: AffiliateUser; verification_email_sent: boolean; message: string }>(
      "/affiliate/register/",
      { method: "POST", body: JSON.stringify(data) },
      "public",
    )
  }

  async login(email: string, password: string, otp?: { challenge_id: string; otp_code: string }) {
    const result = await this.request<AffiliateLoginSuccess | AffiliateLoginChallenge>(
      "/affiliate/login/",
      {
        method: "POST",
        headers: { "X-Session-ID": this.getSessionId() },
        body: JSON.stringify({ email, password, ...(otp || {}) }),
      },
      "public",
    )
    if (!("requires_otp" in result)) {
      localStorage.setItem(TOKEN_KEY, result.access)
      localStorage.setItem(REFRESH_KEY, result.refresh)
    }
    return result
  }

  resendLoginOtp(email: string, password: string, challengeId: string) {
    return this.request<AffiliateLoginChallenge>(
      "/affiliate/login/otp/resend/",
      {
        method: "POST",
        headers: { "X-Session-ID": this.getSessionId() },
        body: JSON.stringify({ email, password, challenge_id: challengeId }),
      },
      "public",
    )
  }

  requestPasswordResetOtp(email: string) {
    return this.request<{ detail: string; otp_id?: string; email?: string; expires_in?: number; resend_available_in?: number }>(
      "/affiliate/password-reset/otp/request/",
      { method: "POST", body: JSON.stringify({ email }) },
      "public",
    )
  }

  confirmPasswordResetOtp(data: { email: string; otp_id: string; otp_code: string; new_password: string; confirm_password: string }) {
    return this.request<{ detail: string }>(
      "/affiliate/password-reset/otp/confirm/",
      { method: "POST", body: JSON.stringify(data) },
      "public",
    )
  }

  confirmTemporaryPasswordReset(data: { email: string; temporary_password: string; new_password: string; confirm_password: string }) {
    return this.request<{ detail: string }>(
      "/affiliate/password-reset/temp/confirm/",
      { method: "POST", body: JSON.stringify(data) },
      "public",
    )
  }

  getMe = () => this.request<AffiliateUser>("/affiliate/me/")

  async resendVerification(email: string): Promise<void> {
    await this.request("/affiliate/resend-verification/", { method: "POST", body: JSON.stringify({ email }) }, "public")
  }

  async verifyEmail(token: string): Promise<boolean> {
    const result = await this.request<{ verified: boolean }>("/affiliate/verify/", { method: "POST", body: JSON.stringify({ token }) }, "public")
    return result.verified
  }

  trackClick(code: string, data: { source?: string; landing_url?: string; referrer?: string }) {
    return this.request<{ referral_code: string; attribution_token: string }>(
      `/affiliate/r/${encodeURIComponent(code)}/click/`,
      { method: "POST", body: JSON.stringify(data) },
      "public",
    )
  }

  logout(): void {
    if (typeof window === "undefined") return
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(REFRESH_KEY)
    }
  }

  getDashboard = () => this.request<DashboardData>("/affiliate/dashboard/")
  getReferrals = () => this.request<Referral[]>("/affiliate/referrals/")
  getAnalytics = (period = "30d") => this.request<AnalyticsData>(`/affiliate/analytics/?period=${encodeURIComponent(period)}`)
  getTrafficSources = (period = "30d") => this.request<TrafficSource[]>(`/affiliate/traffic/?period=${encodeURIComponent(period)}`)
  getPayouts = () => this.request<{ total_earned: number; pending: number; paid_out: number; currency: string; history: Payout[] }>("/affiliate/payouts/")
  getMarketingAssets = () => this.request<MarketingAsset[]>("/affiliate/marketing/")
  getPaymentMethod = () => this.request<PaymentMethod>("/affiliate/payment-method/")
  getRewardTier = () => this.request<RewardTier>("/affiliate/tiers/")

  updatePaymentMethod(data: Partial<PaymentMethod>) {
    return this.request<PaymentMethod>("/affiliate/payment-method/", {
      method: "PATCH",
      body: JSON.stringify({ ...data, payment_method: data.type }),
    })
  }

  adminGetAffiliates(params?: { search?: string; status?: string }) {
    const query = new URLSearchParams()
    if (params?.search) query.set("search", params.search)
    if (params?.status) query.set("status", params.status)
    return this.request<AdminAffiliate[]>(`/affiliate/admin/affiliates/?${query}`, {}, "superadmin")
  }

  adminCreateAffiliate(data: {
    full_name: string
    email: string
    phone: string
    country: string
    password: string
    status?: AdminAffiliate["status"]
    tier?: AdminAffiliate["tier"]
    is_verified?: boolean
  }) {
    return this.request<AdminAffiliate>(
      "/affiliate/admin/affiliates/",
      { method: "POST", body: JSON.stringify(data) },
      "superadmin",
    )
  }

  adminUpdateAffiliate(id: number, data: Partial<AdminAffiliate>) {
    return this.request<AdminAffiliate>(`/affiliate/admin/affiliates/${id}/`, { method: "PATCH", body: JSON.stringify(data) }, "superadmin")
  }

  adminDeactivateAffiliate(id: number) {
    return this.request<void>(`/affiliate/admin/affiliates/${id}/`, { method: "DELETE" }, "superadmin")
  }

  adminCreateReferral(affiliateId: number, data: {
    signup_email: string
    company_name?: string
    status?: Referral["status"]
    reward_amount?: number
    currency: string
    admin_notes?: string
  }) {
    return this.request<Referral>(
      `/affiliate/admin/affiliates/${affiliateId}/referrals/`,
      { method: "POST", body: JSON.stringify(data) },
      "superadmin",
    )
  }

  adminUpdateReferral(id: number, data: Partial<Referral>) {
    return this.request<Referral>(`/affiliate/admin/referrals/${id}/`, { method: "PATCH", body: JSON.stringify(data) }, "superadmin")
  }

  adminCreatePayout(affiliateId: number, data: { amount: number; currency: string; method: "mpesa" | "bank"; status: Payout["status"]; reference?: string; notes?: string }) {
    return this.request<Payout>(`/affiliate/admin/affiliates/${affiliateId}/payouts/`, { method: "POST", body: JSON.stringify(data) }, "superadmin")
  }

  adminUpdatePayout(id: number, data: Partial<Payout>) {
    return this.request<Payout>(
      `/affiliate/admin/payouts/${id}/`,
      { method: "PATCH", body: JSON.stringify(data) },
      "superadmin",
    )
  }

  adminGetSettings() {
    return this.request<{ affiliate_email_otp_enabled: boolean }>("/affiliate/admin/settings/", {}, "superadmin")
  }

  adminUpdateSettings(affiliateEmailOtpEnabled: boolean) {
    return this.request<{ affiliate_email_otp_enabled: boolean }>(
      "/affiliate/admin/settings/",
      { method: "PATCH", body: JSON.stringify({ affiliate_email_otp_enabled: affiliateEmailOtpEnabled }) },
      "superadmin",
    )
  }

  adminRequestAffiliateAccess(id: number) {
    return this.request<{ access_url: string; expires_in: number }>(
      `/affiliate/admin/affiliates/${id}/access/`,
      { method: "POST" },
      "superadmin",
    )
  }

  adminChangeAffiliatePassword(id: number, data: { new_password: string; confirm_password: string; send_email?: boolean }) {
    return this.request<{ detail: string }>(
      `/affiliate/admin/affiliates/${id}/password/`,
      { method: "POST", body: JSON.stringify({ mode: "manual", ...data }) },
      "superadmin",
    )
  }

  adminSendAffiliateTemporaryPassword(id: number) {
    return this.request<{ detail: string }>(
      `/affiliate/admin/affiliates/${id}/password/`,
      { method: "POST", body: JSON.stringify({ mode: "temporary" }) },
      "superadmin",
    )
  }

  async exchangeAdminAccess(token: string) {
    const result = await this.request<{ access: string; user: AffiliateUser; expires_in: number }>(
      "/affiliate/admin-access/exchange/",
      { method: "POST", body: JSON.stringify({ token }) },
      "public",
    )
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.setItem(TOKEN_KEY, result.access)
    sessionStorage.removeItem(REFRESH_KEY)
    return result
  }

  async adminExportCsv(): Promise<Blob> {
    let token = this.getToken("superadmin") || ""
    let response = await fetch(`${this.getBaseUrl()}/affiliate/admin/export/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (response.status === 401) {
      token = await this.refreshToken("superadmin") || ""
      response = await fetch(`${this.getBaseUrl()}/affiliate/admin/export/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
    }
    if (!response.ok) throw new Error("Unable to export affiliates.")
    return response.blob()
  }
}

export const affiliateApi = new AffiliateApiService()
