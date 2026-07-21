"use client"

// ─── Token Storage ───
const TOKEN_KEY = "affiliateToken"
const REFRESH_KEY = "affiliateRefreshToken"

// ─── Types ───

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
  created_at: string
}

export interface Referral {
  id: number
  isp_name: string
  company: string
  signup_date: string
  status: "pending" | "paid" | "churned"
  reward_amount: number
  currency: string
}

export interface Payout {
  id: number
  date: string
  amount: number
  currency: string
  method: "mpesa" | "bank"
  status: "completed" | "pending" | "failed"
  reference: string
}

export interface AnalyticsData {
  period: string
  link_views: number
  signups: number
  paid: number
  conversion_rate: number
  epc: number // earnings per click
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
  funnel: {
    link_clicks: number
    page_views: number
    signups: number
    paid: number
  }
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
  referrals_count: number
  total_earned: number
  currency: string
  status: "active" | "inactive" | "suspended"
  tier: "bronze" | "silver" | "gold"
  payment_method: string
  created_at: string
  referrals: Referral[]
}

// ─── Mock Data ───

const MOCK_USER: AffiliateUser = {
  id: 1,
  email: "john@example.com",
  full_name: "John Doe",
  phone: "+254 700 000 000",
  country: "Kenya",
  currency: "KES",
  referral_code: "FGDG7HIN",
  referral_link: "https://affiliate.netily.co.ke/r/FGDG7HIN",
  is_verified: true,
  tier: "bronze",
  created_at: "2025-06-01T10:00:00Z",
}

const MOCK_DASHBOARD: DashboardData = {
  greeting_name: "John",
  referral_code: "FGDG7HIN",
  referral_link: "https://affiliate.netily.co.ke/r/FGDG7HIN",
  stats: {
    link_views: 342,
    signed_up: 18,
    paid: 7,
    conversion_rate: 38.9,
    total_earnings: 3500,
    currency: "KES",
  },
  funnel: { link_clicks: 342, page_views: 289, signups: 18, paid: 7 },
  recent_activity: [
    { date: "2025-07-19", event: "KenyaNet ISP signed up via your link" },
    { date: "2025-07-17", event: "3 new link clicks from WhatsApp" },
    { date: "2025-07-15", event: "Payout of KSh 1,500 completed" },
    { date: "2025-07-12", event: "FastConnect ISP completed first payment" },
  ],
}

const MOCK_REFERRALS: Referral[] = [
  { id: 1, isp_name: "KenyaNet Broadband", company: "KenyaNet Ltd", signup_date: "2025-07-19", status: "pending", reward_amount: 500, currency: "KES" },
  { id: 2, isp_name: "FastConnect ISP", company: "FastConnect Ltd", signup_date: "2025-07-12", status: "paid", reward_amount: 500, currency: "KES" },
  { id: 3, isp_name: "LinkAfrica Networks", company: "LinkAfrica", signup_date: "2025-07-05", status: "paid", reward_amount: 500, currency: "KES" },
  { id: 4, isp_name: "SpeedWave Internet", company: "SpeedWave Co", signup_date: "2025-06-28", status: "paid", reward_amount: 500, currency: "KES" },
  { id: 5, isp_name: "NairobiConnect", company: "NC Solutions", signup_date: "2025-06-20", status: "paid", reward_amount: 500, currency: "KES" },
  { id: 6, isp_name: "CoastalNet", company: "Coastal Digital", signup_date: "2025-06-15", status: "paid", reward_amount: 500, currency: "KES" },
  { id: 7, isp_name: "MountainView ISP", company: "MV Tech", signup_date: "2025-06-10", status: "paid", reward_amount: 500, currency: "KES" },
]

const MOCK_PAYOUTS: Payout[] = [
  { id: 1, date: "2025-07-15", amount: 1500, currency: "KES", method: "mpesa", status: "completed", reference: "QK7VBN3X" },
  { id: 2, date: "2025-07-01", amount: 1000, currency: "KES", method: "mpesa", status: "completed", reference: "PL9MRT2W" },
  { id: 3, date: "2025-06-15", amount: 1000, currency: "KES", method: "mpesa", status: "completed", reference: "XY4DNF8Z" },
]

const MOCK_ANALYTICS: AnalyticsData = {
  period: "30d",
  link_views: 342,
  signups: 18,
  paid: 7,
  conversion_rate: 38.9,
  epc: 10.23,
  daily: Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toISOString().slice(0, 10),
      views: Math.floor(Math.random() * 20) + 2,
      signups: Math.floor(Math.random() * 3),
      paid: Math.random() > 0.7 ? 1 : 0,
    }
  }),
}

const MOCK_TRAFFIC: TrafficSource[] = [
  { source: "Direct", clicks: 142, signups: 8, conversion_rate: 5.6 },
  { source: "WhatsApp", clicks: 98, signups: 6, conversion_rate: 6.1 },
  { source: "Facebook", clicks: 67, signups: 3, conversion_rate: 4.5 },
  { source: "Twitter / X", clicks: 35, signups: 1, conversion_rate: 2.9 },
]

const MOCK_TIER: RewardTier = {
  current_tier: "bronze",
  referrals_count: 7,
  tiers: [
    { name: "Bronze", key: "bronze", min_referrals: 0, max_referrals: 5, reward_per_referral: 500, currency: "KES", unlocked: true },
    { name: "Silver", key: "silver", min_referrals: 6, max_referrals: 15, reward_per_referral: 750, currency: "KES", unlocked: false },
    { name: "Gold", key: "gold", min_referrals: 16, max_referrals: null, reward_per_referral: 1000, currency: "KES", unlocked: false },
  ],
  next_tier_remaining: 9,
}

const MOCK_PAYMENT_METHOD: PaymentMethod = {
  type: "mpesa",
  mpesa_phone: "+254 700 000 000",
  mpesa_name: "JOHN DOE",
  is_verified: true,
}

const MOCK_MARKETING: MarketingAsset[] = [
  {
    id: 1,
    category: "whatsapp",
    title: "Cold Outreach — WISP Operator",
    content: `Hey! 👋 I noticed you're running a WISP. Have you checked out Netily? It automates PPPoE, Hotspots, and M-Pesa billing without the usual Mikrotik lag. Here is my invite link: {{REFERRAL_LINK}}`,
  },
  {
    id: 2,
    category: "whatsapp",
    title: "Follow-Up — After Demo Interest",
    content: `Hey again! Just wanted to check — did you get a chance to look at Netily? They've got a free trial and the M-Pesa auto-billing alone saves hours. Sign up here and I'll help you set up: {{REFERRAL_LINK}}`,
  },
  {
    id: 3,
    category: "whatsapp",
    title: "WhatsApp Group Drop",
    content: `🚀 Fellow ISP operators — if you're tired of manual billing and radius headaches, check out Netily. I switched 3 months ago and my churn dropped 40%. Try it: {{REFERRAL_LINK}}`,
  },
  {
    id: 4,
    category: "social",
    title: "Twitter / X Post",
    content: `Running an ISP in Kenya? Stop fighting with Mikrotik scripts. @NetilyHQ automates PPPoE, hotspot auth, and M-Pesa billing. Free trial 👉 {{REFERRAL_LINK}} #ISP #Kenya #WISP`,
  },
  {
    id: 5,
    category: "social",
    title: "LinkedIn Post",
    content: `I've been recommending Netily to fellow ISP operators across East Africa. The platform handles PPPoE authentication, automated billing via M-Pesa, and customer management — all from one dashboard.\n\nIf you're running a WISP or fibre network, this is worth trying: {{REFERRAL_LINK}}`,
  },
  {
    id: 6,
    category: "brand",
    title: "Netily Logo Pack (PNG + SVG)",
    content: "Official Netily branding assets for your website or promotional materials.",
    file_url: "/brand/netily-logo-pack.zip",
  },
  {
    id: 7,
    category: "brand",
    title: "Referral Banner (1200x628)",
    content: "High-quality banner optimised for social sharing.",
    file_url: "/brand/netily-referral-banner.png",
  },
]

const MOCK_ADMIN_AFFILIATES: AdminAffiliate[] = [
  {
    id: 1, full_name: "John Doe", email: "john@example.com", phone: "+254 700 000 000",
    referral_code: "FGDG7HIN", referrals_count: 7, total_earned: 3500, currency: "KES",
    status: "active", tier: "bronze", payment_method: "M-Pesa", created_at: "2025-06-01T10:00:00Z",
    referrals: MOCK_REFERRALS,
  },
  {
    id: 2, full_name: "Jane Smith", email: "jane@example.com", phone: "+254 711 111 111",
    referral_code: "XK9WP2LR", referrals_count: 12, total_earned: 9000, currency: "KES",
    status: "active", tier: "silver", payment_method: "Bank Transfer", created_at: "2025-04-15T08:30:00Z",
    referrals: [
      { id: 10, isp_name: "Savanna Networks", company: "Savanna Ltd", signup_date: "2025-07-10", status: "paid", reward_amount: 750, currency: "KES" },
      { id: 11, isp_name: "HighPoint ISP", company: "HighPoint", signup_date: "2025-07-02", status: "pending", reward_amount: 750, currency: "KES" },
    ],
  },
  {
    id: 3, full_name: "Mike Ochieng", email: "mike@example.com", phone: "+254 722 222 222",
    referral_code: "BN3TY7QA", referrals_count: 2, total_earned: 1000, currency: "KES",
    status: "active", tier: "bronze", payment_method: "M-Pesa", created_at: "2025-05-20T14:00:00Z",
    referrals: [
      { id: 20, isp_name: "Valley Broadband", company: "Valley Co", signup_date: "2025-06-25", status: "paid", reward_amount: 500, currency: "KES" },
    ],
  },
  {
    id: 4, full_name: "Grace Wanjiku", email: "grace@example.com", phone: "+254 733 333 333",
    referral_code: "RM5KJ8DV", referrals_count: 0, total_earned: 0, currency: "KES",
    status: "inactive", tier: "bronze", payment_method: "M-Pesa", created_at: "2025-07-01T09:00:00Z",
    referrals: [],
  },
]

// ─── Helpers ───

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── API Service ───

class AffiliateApiService {
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

  // ── Auth ──

  async register(data: { full_name: string; email: string; phone: string; country: string; password: string }): Promise<{ user: AffiliateUser }> {
    // TODO: connect to backend — POST /affiliate/register/
    await delay(800)
    const user: AffiliateUser = {
      ...MOCK_USER,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      is_verified: false,
    }
    return { user }
  }

  async login(email: string, password: string): Promise<{ user: AffiliateUser; access: string; refresh: string }> {
    // TODO: connect to backend — POST /affiliate/login/
    await delay(600)
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, "mock-affiliate-token")
      localStorage.setItem(REFRESH_KEY, "mock-affiliate-refresh")
    }
    return { user: MOCK_USER, access: "mock-affiliate-token", refresh: "mock-affiliate-refresh" }
  }

  async getMe(): Promise<AffiliateUser> {
    // TODO: connect to backend — GET /affiliate/me/
    await delay(300)
    const token = this.getToken()
    if (!token) throw new Error("Not authenticated")
    return MOCK_USER
  }

  async resendVerification(): Promise<void> {
    // TODO: connect to backend — POST /affiliate/resend-verification/
    await delay(500)
  }

  async checkVerification(): Promise<boolean> {
    // TODO: connect to backend — GET /affiliate/check-verification/
    await delay(400)
    return true
  }

  logout(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
  }

  // ── Dashboard ──

  async getDashboard(): Promise<DashboardData> {
    // TODO: connect to backend — GET /affiliate/dashboard/
    await delay(500)
    return MOCK_DASHBOARD
  }

  // ── Referrals ──

  async getReferrals(): Promise<Referral[]> {
    // TODO: connect to backend — GET /affiliate/referrals/
    await delay(400)
    return MOCK_REFERRALS
  }

  // ── Analytics ──

  async getAnalytics(period?: string): Promise<AnalyticsData> {
    // TODO: connect to backend — GET /affiliate/analytics/?period=30d
    await delay(400)
    return { ...MOCK_ANALYTICS, period: period || "30d" }
  }

  async getTrafficSources(period?: string): Promise<TrafficSource[]> {
    // TODO: connect to backend — GET /affiliate/traffic/?period=30d
    await delay(300)
    return MOCK_TRAFFIC
  }

  // ── Payouts ──

  async getPayouts(): Promise<{ total_earned: number; pending: number; paid_out: number; currency: string; history: Payout[] }> {
    // TODO: connect to backend — GET /affiliate/payouts/
    await delay(400)
    return {
      total_earned: 3500,
      pending: 500,
      paid_out: 3000,
      currency: "KES",
      history: MOCK_PAYOUTS,
    }
  }

  // ── Marketing ──

  async getMarketingAssets(): Promise<MarketingAsset[]> {
    // TODO: connect to backend — GET /affiliate/marketing/
    await delay(300)
    return MOCK_MARKETING
  }

  // ── Payment Settings ──

  async getPaymentMethod(): Promise<PaymentMethod> {
    // TODO: connect to backend — GET /affiliate/payment-method/
    await delay(300)
    return MOCK_PAYMENT_METHOD
  }

  async updatePaymentMethod(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    // TODO: connect to backend — PATCH /affiliate/payment-method/
    await delay(600)
    return { ...MOCK_PAYMENT_METHOD, ...data }
  }

  async verifyMpesaNumber(phone: string): Promise<{ name: string; verified: boolean }> {
    // TODO: connect to backend — POST /affiliate/verify-mpesa/
    await delay(1000)
    return { name: "JOHN DOE", verified: true }
  }

  // ── Reward Tiers ──

  async getRewardTier(): Promise<RewardTier> {
    // TODO: connect to backend — GET /affiliate/tiers/
    await delay(300)
    return MOCK_TIER
  }

  // ── Admin: Affiliate Management ──

  async adminGetAffiliates(params?: { search?: string; status?: string }): Promise<AdminAffiliate[]> {
    // TODO: connect to backend — GET /affiliate/admin/affiliates/
    await delay(500)
    let results = [...MOCK_ADMIN_AFFILIATES]
    if (params?.search) {
      const q = params.search.toLowerCase()
      results = results.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.referral_code.toLowerCase().includes(q)
      )
    }
    if (params?.status && params.status !== "all") {
      results = results.filter((a) => a.status === params.status)
    }
    return results
  }

  async adminUpdateAffiliate(id: number, data: Partial<AdminAffiliate>): Promise<AdminAffiliate> {
    // TODO: connect to backend — PATCH /affiliate/admin/affiliates/:id/
    await delay(400)
    const affiliate = MOCK_ADMIN_AFFILIATES.find((a) => a.id === id)
    if (!affiliate) throw new Error("Affiliate not found")
    return { ...affiliate, ...data }
  }

  async adminExportCsv(): Promise<Blob> {
    // TODO: connect to backend — GET /affiliate/admin/export/
    await delay(300)
    const headers = "Name,Email,Code,Referrals,Total Earned,Status,Tier\n"
    const rows = MOCK_ADMIN_AFFILIATES.map(
      (a) => `${a.full_name},${a.email},${a.referral_code},${a.referrals_count},${a.total_earned},${a.status},${a.tier}`
    ).join("\n")
    return new Blob([headers + rows], { type: "text/csv" })
  }
}

export const affiliateApi = new AffiliateApiService()
