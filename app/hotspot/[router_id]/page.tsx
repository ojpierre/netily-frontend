"use client"

import { use, useEffect, useState, useMemo } from "react"
import { Wifi, Clock, Zap, Phone, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle, Megaphone, Database, ArrowDown, ArrowUp, Users, Ticket, Monitor, Smartphone } from "lucide-react"
import { getApiBaseUrl, getSubdomainInfo } from "@/lib/subdomain"

// ==========================================
// TYPES
// ==========================================

interface HotspotPlan {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  // Validity
  validity_type: string
  validity_value: number
  duration_display: string
  // Speed
  download_speed: number
  upload_speed: number
  speed_unit: string
  speed_display: string
  // Data limits
  limitation_type: string
  data_limit_value: number | null
  data_limit_unit: string
  data_limit_display: string
  // Device limits
  simultaneous_devices?: number
  // Display
  is_popular?: boolean
}

interface PortalConfig {
  template_id: number
  hotspot_name: string
  support_phone: string
  announcement_text: string
  gateway_ip: string
}

interface BrandingConfig {
  company_name?: string
  logo_url?: string | null
  background_image_url?: string | null
  primary_color?: string
  secondary_color?: string
  text_color?: string
  background_color?: string
  welcome_title?: string
  welcome_message?: string
  support_phone?: string
  support_email?: string
}

interface CaptivePortalResponse {
  status: string
  portal_config: PortalConfig
  branding: BrandingConfig | null
  plans: HotspotPlan[]
}

interface PurchaseResponse {
  status: "pending" | "success" | "failed" | "activating"
  session_id: string
  checkout_request_id?: string
  message: string
  expires_in?: number
  access_code?: string
  expires_at?: string
  data_remaining_mb?: number
  speed?: string
  login_url?: string
}

interface AutoLoginResponse {
  has_session: boolean
  session_id?: string
  access_code?: string
  plan_name?: string
  expires_at?: string
  remaining_minutes?: number
  credentials?: {
    username: string
    password: string
  }
}

type PaymentStatus = "idle" | "sending" | "waiting" | "success" | "failed" | "timeout"

// ==========================================
// API FUNCTIONS (Public endpoints — no auth)
// ==========================================

/** Resolve the API base dynamically from subdomain or environment */
function getApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  }
  
  const hostname = window.location.hostname
  const isDevelopment = hostname.includes("localhost") || hostname.startsWith("127.") || hostname.startsWith("192.168.")
  
  // For LAN IP access (e.g., 192.168.x.x:3000), use the same IP for backend
  if (hostname.startsWith("192.168.")) {
    return `http://${hostname.replace(":3000", "")}:8000/api/v1`
  }
  
  // For subdomain.localhost:3000, route to subdomain.localhost:8000
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".")
    if (parts.length > 1) {
      const subdomain = parts[0]
      return `http://${subdomain}.localhost:8000/api/v1`
    }
    return "http://localhost:8000/api/v1"
  }
  
  // Production: use same origin API
  return `${window.location.origin}/api/v1`
}

async function fetchCaptivePortal(routerId: string): Promise<CaptivePortalResponse> {
  const tenant = getTenant()
  const response = await fetch(
    `${getApiBase()}/hotspot/captive-portal/?router=${routerId}&tenant=${tenant}`,
    { cache: "no-store" },
  )
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || err.error || "Failed to load hotspot plans")
  }
  return response.json()
}

/** Resolve the current tenant from subdomain / query-string */
function getTenant(): string {
  if (typeof window === "undefined") return ""
  
  const info = getSubdomainInfo()
  // Priority: URL query param > subdomain from hostname
  const queryTenant = new URLSearchParams(window.location.search).get("tenant")
  if (queryTenant) return queryTenant
  
  // Get subdomain from hostname (e.g., "indigo3" from "indigo3.localhost")
  if (info.subdomain) return info.subdomain
  
  // Fallback: extract from hostname directly
  const hostname = window.location.hostname
  const parts = hostname.split(".")
  if (parts.length > 1 && !["www", "api", "app"].includes(parts[0])) {
    return parts[0]
  }
  
  return ""
}

async function initiatePurchase(data: {
  router_id: string
  plan_id: string
  phone_number: string
  mac_address: string
  tenant: string
  tv_code?: string
}): Promise<PurchaseResponse> {
  const response = await fetch(`${getApiBase()}/hotspot/purchase/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Payment initiation failed" }))
    throw new Error(error.message || error.error || "Payment initiation failed")
  }
  return response.json()
}

async function pollPurchaseStatus(sessionId: string, loginUrl?: string, tenant?: string): Promise<PurchaseResponse> {
  const qp = new URLSearchParams()
  if (loginUrl) qp.append("login_url", loginUrl)
  qp.append("tenant", tenant || getTenant())
  const response = await fetch(`${getApiBase()}/hotspot/purchase/${sessionId}/status/?${qp.toString()}`, { cache: "no-store" })
  if (!response.ok) throw new Error("Failed to check payment status")
  return response.json()
}

async function checkAutoLogin(routerId: string, macAddress: string): Promise<AutoLoginResponse> {
  const tenant = getTenant()
  const response = await fetch(`${getApiBase()}/hotspot/auto-login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ router_id: routerId, mac_address: macAddress, tenant }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error("Auto-login check failed")
  return response.json()
}

interface VoucherRedeemResponse {
  status: string
  message: string
  session_id: string
  access_code: string
  expires_at: string
  plan_name: string
  voucher_remaining_value: number
}

async function redeemVoucher(data: {
  code: string
  router_id: string
  plan_id?: string
  mac_address: string
  tenant: string
}): Promise<VoucherRedeemResponse> {
  const response = await fetch(`${getApiBase()}/hotspot/voucher-redeem/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Voucher redemption failed" }))
    throw new Error(error.message || error.error || "Voucher redemption failed")
  }
  return response.json()
}

// === NEW TV API FUNCTIONS ===
async function generateTVCode(routerId: string, mac: string, tenant: string) {
  const res = await fetch(`${getApiBase()}/hotspot/tv/generate-code/?tenant=${tenant}&router_id=${routerId}&mac_address=${mac}`)
  if (!res.ok) throw new Error("Failed to generate TV code")
  return res.json()
}

async function verifyTVCode(code: string, tenant: string) {
  const res = await fetch(`${getApiBase()}/hotspot/tv/verify-code/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, tenant })
  })
  if (!res.ok) {
      const err = await res.json().catch(()=>({}))
      throw new Error(err.error || err.message || "Failed to verify TV code")
  }
  return res.json()
}

/**
 * "Return Trip" — submits RADIUS credentials back to MikroTik's login URL.
 * MikroTik -> Cloud Portal -> Payment -> RADIUS created -> Return Trip -> Internet
 */
function returnTripToMikrotik(loginUrl: string, username: string, password: string) {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = loginUrl
  form.style.display = "none"
  const addField = (name: string, value: string) => {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  addField("username", username)
  addField("password", password)
  addField("dst", "")
  addField("popup", "true")
  document.body.appendChild(form)
  form.submit()
}

// ==========================================
// HELPERS
// ==========================================

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.round(minutes / 60)} hour${minutes >= 120 ? "s" : ""}`
  return `${Math.round(minutes / 1440)} day${minutes >= 2880 ? "s" : ""}`
}

function formatData(mb: number | null): string {
  if (!mb) return "Unlimited"
  if (mb < 1000) return `${mb} MB`
  return `${(mb / 1000).toFixed(1)} GB`
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1)
  else if (cleaned.startsWith("+254")) cleaned = cleaned.slice(1)
  else if (!cleaned.startsWith("254")) cleaned = "254" + cleaned
  return cleaned
}

function isValidKenyanPhone(phone: string): boolean {
  return /^254[17]\d{8}$/.test(formatPhoneNumber(phone))
}

function getMacAddress(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    const mac = params.get("mac")
    if (mac) return mac
  }
  return "00:00:00:00:00:00"
}

function getLoginUrl(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    return params.get("login_url") || ""
  }
  return ""
}

function isSmartTV(): boolean {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    if (params.get("smart_tv") === "1") return true
    const ua = navigator.userAgent.toLowerCase()
    return /smart-?tv|webos|tizen|vidaa|hbbtv|roku|firetv|apple\s?tv/i.test(ua)
  }
  return false
}

// ==========================================
// TEMPLATE STYLE ENGINE  (7 themes)
// ==========================================

interface ThemeStyles {
  pageBg: string
  cardClass: string
  headerBg: string
  headerText: string
  headerSub: string
  annBg: string
  annText: string
  annIcon: string
  planSelectedBorder: string
  planSelectedBg: string
  planBorder: string
  planBg: string
  planTitle: string
  planSub: string
  planPrice: string
  planPopularBg: string
  planPopularText: string
  inputBorder: string
  inputBg: string
  inputText: string
  inputPlaceholder: string
  ctaBg: string
  ctaText: string
  ctaHover: string
  bodyText: string
  mutedText: string
  footerText: string
  errorBg: string
  errorText: string
  successBg: string
  successPageBg: string
  // Layout variations
  layoutType: "grid" | "list" | "featured" | "compact"
  // Structural variations
  headerStyle: "centered" | "left-aligned" | "large-hero" | "minimal"
  cardShape: "rounded-2xl" | "rounded-3xl" | "rounded-none" | "rounded-lg"
  ctaStyle: "full-width" | "centered" | "pill"
  showPhoneBeforePlans: boolean
  showWifiIcon: boolean
}

function getTheme(id: number): ThemeStyles {
  switch (id) {
    case 2: // Dark Mode - Featured Layout (Cyberpunk style)
      return {
        layoutType: "featured",
        headerStyle: "large-hero",
        cardShape: "rounded-2xl",
        ctaStyle: "full-width",
        showPhoneBeforePlans: false,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800",
        cardClass: "bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl",
        headerBg: "bg-gradient-to-r from-cyan-600 to-blue-600",
        headerText: "text-white",
        headerSub: "text-cyan-100/80",
        annBg: "bg-cyan-950/40 border border-cyan-700/30",
        annText: "text-cyan-200",
        annIcon: "text-cyan-400",
        planSelectedBorder: "border-cyan-500",
        planSelectedBg: "bg-cyan-950/40",
        planBorder: "border-gray-700/50",
        planBg: "bg-gray-800/50",
        planTitle: "text-white",
        planSub: "text-gray-400",
        planPrice: "text-cyan-400",
        planPopularBg: "bg-cyan-500",
        planPopularText: "text-white",
        inputBorder: "border-gray-600",
        inputBg: "bg-gray-800",
        inputText: "text-white",
        inputPlaceholder: "placeholder:text-gray-500",
        ctaBg: "bg-cyan-500 hover:bg-cyan-400",
        ctaText: "text-white",
        ctaHover: "hover:shadow-cyan-500/25",
        bodyText: "text-gray-200",
        mutedText: "text-gray-400",
        footerText: "text-gray-600",
        errorBg: "bg-red-950/40 border-red-700/30",
        errorText: "text-red-400",
        successBg: "bg-emerald-950/40",
        successPageBg: "min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800",
      }
    case 3: // Gradient - List Layout (Vibrant gradient style)
      return {
        layoutType: "list",
        headerStyle: "centered",
        cardShape: "rounded-3xl",
        ctaStyle: "pill",
        showPhoneBeforePlans: true,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500",
        cardClass: "bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl",
        headerBg: "bg-gradient-to-r from-purple-600 to-pink-500",
        headerText: "text-white",
        headerSub: "text-purple-100/80",
        annBg: "bg-purple-50 border border-purple-200",
        annText: "text-purple-700",
        annIcon: "text-purple-500",
        planSelectedBorder: "border-purple-500",
        planSelectedBg: "bg-purple-50",
        planBorder: "border-gray-200",
        planBg: "bg-white",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-purple-600",
        planPopularBg: "bg-purple-500",
        planPopularText: "text-white",
        inputBorder: "border-gray-300",
        inputBg: "bg-white",
        inputText: "text-gray-900",
        inputPlaceholder: "placeholder:text-gray-400",
        ctaBg: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
        ctaText: "text-white",
        ctaHover: "hover:shadow-purple-500/25",
        bodyText: "text-gray-700",
        mutedText: "text-gray-500",
        footerText: "text-gray-400",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-green-50",
        successPageBg: "min-h-screen bg-gradient-to-br from-emerald-600 to-teal-500",
      }
    case 4: // Minimal - Compact Layout (Clean, Apple-like)
      return {
        layoutType: "compact",
        headerStyle: "minimal",
        cardShape: "rounded-lg",
        ctaStyle: "full-width",
        showPhoneBeforePlans: false,
        showWifiIcon: false,
        pageBg: "min-h-screen bg-white",
        cardClass: "bg-white rounded-2xl shadow-sm border border-gray-100",
        headerBg: "bg-white border-b border-gray-100",
        headerText: "text-gray-900",
        headerSub: "text-gray-500",
        annBg: "bg-gray-50 border border-gray-200",
        annText: "text-gray-700",
        annIcon: "text-gray-500",
        planSelectedBorder: "border-gray-900",
        planSelectedBg: "bg-gray-50",
        planBorder: "border-gray-200",
        planBg: "bg-white",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-gray-900",
        planPopularBg: "bg-gray-900",
        planPopularText: "text-white",
        inputBorder: "border-gray-300",
        inputBg: "bg-white",
        inputText: "text-gray-900",
        inputPlaceholder: "placeholder:text-gray-400",
        ctaBg: "bg-gray-900 hover:bg-gray-800",
        ctaText: "text-white",
        ctaHover: "",
        bodyText: "text-gray-700",
        mutedText: "text-gray-400",
        footerText: "text-gray-300",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-green-50",
        successPageBg: "min-h-screen bg-white",
      }
    case 5: // Vibrant - Grid Layout (Energetic, event-poster style)
      return {
        layoutType: "grid",
        headerStyle: "large-hero",
        cardShape: "rounded-2xl",
        ctaStyle: "pill",
        showPhoneBeforePlans: false,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
        cardClass: "bg-white rounded-2xl shadow-2xl",
        headerBg: "bg-gradient-to-r from-amber-500 to-orange-500",
        headerText: "text-white",
        headerSub: "text-amber-100/80",
        annBg: "bg-amber-50 border border-amber-200",
        annText: "text-amber-800",
        annIcon: "text-amber-600",
        planSelectedBorder: "border-orange-500",
        planSelectedBg: "bg-orange-50",
        planBorder: "border-gray-200",
        planBg: "bg-white",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-orange-600",
        planPopularBg: "bg-orange-500",
        planPopularText: "text-white",
        inputBorder: "border-gray-300",
        inputBg: "bg-white",
        inputText: "text-gray-900",
        inputPlaceholder: "placeholder:text-gray-400",
        ctaBg: "bg-orange-500 hover:bg-orange-600",
        ctaText: "text-white",
        ctaHover: "hover:shadow-orange-500/25",
        bodyText: "text-gray-700",
        mutedText: "text-gray-500",
        footerText: "text-gray-400",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-green-50",
        successPageBg: "min-h-screen bg-gradient-to-br from-emerald-400 to-green-500",
      }
    case 6: // Corporate - Featured Layout (Enterprise, boardroom style)
      return {
        layoutType: "featured",
        headerStyle: "left-aligned",
        cardShape: "rounded-lg",
        ctaStyle: "full-width",
        showPhoneBeforePlans: true,
        showWifiIcon: false,
        pageBg: "min-h-screen bg-gradient-to-b from-slate-50 to-slate-200",
        cardClass: "bg-white rounded-2xl shadow-lg border border-slate-200",
        headerBg: "bg-slate-800",
        headerText: "text-white",
        headerSub: "text-slate-300",
        annBg: "bg-slate-50 border border-slate-200",
        annText: "text-slate-700",
        annIcon: "text-slate-500",
        planSelectedBorder: "border-slate-700",
        planSelectedBg: "bg-slate-50",
        planBorder: "border-slate-200",
        planBg: "bg-white",
        planTitle: "text-slate-900",
        planSub: "text-slate-500",
        planPrice: "text-slate-800",
        planPopularBg: "bg-slate-700",
        planPopularText: "text-white",
        inputBorder: "border-slate-300",
        inputBg: "bg-white",
        inputText: "text-slate-900",
        inputPlaceholder: "placeholder:text-slate-400",
        ctaBg: "bg-slate-800 hover:bg-slate-700",
        ctaText: "text-white",
        ctaHover: "",
        bodyText: "text-slate-700",
        mutedText: "text-slate-400",
        footerText: "text-slate-400",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-green-50",
        successPageBg: "min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100",
      }
    case 7: // Glass - List Layout (Glassmorphism, futuristic)
      return {
        layoutType: "list",
        headerStyle: "centered",
        cardShape: "rounded-3xl",
        ctaStyle: "centered",
        showPhoneBeforePlans: false,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600",
        cardClass: "bg-white/15 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl",
        headerBg: "bg-white/10",
        headerText: "text-white",
        headerSub: "text-white/70",
        annBg: "bg-white/10 border border-white/15",
        annText: "text-white/90",
        annIcon: "text-white/70",
        planSelectedBorder: "border-white/60",
        planSelectedBg: "bg-white/15",
        planBorder: "border-white/15",
        planBg: "bg-white/5",
        planTitle: "text-white",
        planSub: "text-white/60",
        planPrice: "text-white",
        planPopularBg: "bg-white/25",
        planPopularText: "text-white",
        inputBorder: "border-white/20",
        inputBg: "bg-white/10",
        inputText: "text-white",
        inputPlaceholder: "placeholder:text-white/40",
        ctaBg: "bg-white hover:bg-white/90",
        ctaText: "text-teal-700 font-bold",
        ctaHover: "hover:shadow-white/20",
        bodyText: "text-white/80",
        mutedText: "text-white/50",
        footerText: "text-white/30",
        errorBg: "bg-red-500/20 border-red-400/30",
        errorText: "text-red-200",
        successBg: "bg-emerald-500/20",
        successPageBg: "min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
      }
    default: // Classic (1) - Grid Layout (Professional, ISP standard)
      return {
        layoutType: "grid",
        headerStyle: "centered",
        cardShape: "rounded-2xl",
        ctaStyle: "full-width",
        showPhoneBeforePlans: false,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100",
        cardClass: "bg-white rounded-2xl shadow-xl",
        headerBg: "bg-blue-600",
        headerText: "text-white",
        headerSub: "text-white/80",
        annBg: "bg-blue-50 border border-blue-200",
        annText: "text-blue-700",
        annIcon: "text-blue-500",
        planSelectedBorder: "border-blue-500",
        planSelectedBg: "bg-blue-50",
        planBorder: "border-gray-200",
        planBg: "bg-white",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-blue-600",
        planPopularBg: "bg-blue-500",
        planPopularText: "text-white",
        inputBorder: "border-gray-300",
        inputBg: "bg-white",
        inputText: "text-gray-900",
        inputPlaceholder: "placeholder:text-gray-400",
        ctaBg: "bg-blue-600 hover:bg-blue-700",
        ctaText: "text-white",
        ctaHover: "",
        bodyText: "text-gray-700",
        mutedText: "text-gray-500",
        footerText: "text-gray-400",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-green-50",
        successPageBg: "min-h-screen bg-gradient-to-br from-green-50 to-emerald-100",
      }
  }
}

// ==========================================
// PHONE INPUT COMPONENT (DRY helper)
// ==========================================

function PhoneInput({
  phoneNumber,
  phoneError,
  onPhoneChange,
  theme,
}: {
  phoneNumber: string
  phoneError: string | null
  onPhoneChange: (v: string) => void
  theme: ThemeStyles
}) {
  return (
    <div className="mb-6">
      <label className={`block text-sm font-medium mb-2 ${theme.planTitle}`}>
        M-Pesa Phone Number
      </label>
      <div className="relative">
        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.mutedText}`} />
        <input
          type="tel"
          placeholder="0712 345 678"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 border ${theme.cardShape} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} ${
            phoneError ? "!border-red-400 !ring-red-500" : ""
          }`}
        />
      </div>
      {phoneError && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {phoneError}
        </p>
      )}
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function HotspotPage({ params }: { params: Promise<{ router_id: string }> }) {
  const { router_id: routerId } = use(params)

  // Data state
  const [plans, setPlans] = useState<HotspotPlan[]>([])
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null)
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection & payment
  const [selectedPlan, setSelectedPlan] = useState<HotspotPlan | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(120)
  const [accessCode, setAccessCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Cloud Controller
  const [loginUrl, setLoginUrl] = useState<string>("")
  const [autoLoginChecked, setAutoLoginChecked] = useState(false)
  const [returningToRouter, setReturningToRouter] = useState(false)

  // Payment mode toggle
  const [paymentMode, setPaymentMode] = useState<"mpesa" | "voucher">("mpesa")
  const [voucherCode, setVoucherCode] = useState("")
  const [voucherRedeeming, setVoucherRedeeming] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  // === TV MODE STATES ===
  const [isTvDevice, setIsTvDevice] = useState(false)
  const [tvDisplayCode, setTvDisplayCode] = useState<string | null>(null)
  const [tvCodeLoading, setTvCodeLoading] = useState(false)

  // Phone paying for TV
  const [targetDevice, setTargetDevice] = useState<"this" | "tv">("this")
  const [tvInputCode, setTvInputCode] = useState("")
  const [verifiedTV, setVerifiedTV] = useState<{ mac_address: string; router_id?: string; code: string } | null>(null)
  const [isVerifyingTV, setIsVerifyingTV] = useState(false)
  const [tvVerifyError, setTvVerifyError] = useState<string | null>(null)
  // ==========================================

  // Theme derived from portal_config
  const templateId = portalConfig?.template_id ?? 1
  const theme = useMemo(() => getTheme(templateId), [templateId])
  const displayName = branding?.company_name || portalConfig?.hotspot_name || "WiFi Hotspot"
  const welcomeTitle = branding?.welcome_title || ""
  const welcomeMessage = branding?.welcome_message || ""
  const supportPhone = branding?.support_phone || portalConfig?.support_phone || ""
  const announcement = portalConfig?.announcement_text || ""

  // Branding-derived inline style overrides (hex colours from admin panel)
  const brandingHeaderStyle: React.CSSProperties | undefined = branding?.primary_color
    ? { backgroundColor: branding.primary_color }
    : undefined
  const brandingCtaStyle: React.CSSProperties | undefined = branding?.primary_color
    ? { backgroundColor: branding.primary_color, borderColor: branding.primary_color }
    : undefined
  const brandingSelectedBorderStyle: React.CSSProperties | undefined = branding?.primary_color
    ? { borderColor: branding.primary_color }
    : undefined
  const brandingPriceStyle: React.CSSProperties | undefined = branding?.primary_color
    ? { color: branding.primary_color }
    : undefined

  // ── MikroTik query-params on mount ──
  useEffect(() => {
    // 1. READ URL PARAMS
    const params = new URLSearchParams(window.location.search)
    
    // 2. CHECK FOR ROUTER ERRORS (STOP THE LOOP)
    const routerError = params.get("error")
    if (routerError) {
        console.error("Router reported error:", routerError)
        setError(decodeURIComponent(routerError))
        setLoading(false)
        return
    }

    const url = params.get("login_url")
    if (url) setLoginUrl(url)
  }, [routerId])

  // ── Auto-login & TV Detection ──
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get("error")) return

    const mac = getMacAddress()
    if (mac === "00:00:00:00:00:00" || autoLoginChecked) return
    
    checkAutoLogin(routerId, mac)
      .then((result) => {
        if (result.has_session && result.credentials && loginUrl) {
          setReturningToRouter(true)
          returnTripToMikrotik(loginUrl, result.credentials.username, result.credentials.password)
        } else if (isSmartTV()) {
            setIsTvDevice(true)
            const fetchCode = () => {
                setTvCodeLoading(true)
                generateTVCode(routerId, mac, getTenant())
                  .then(data => {
                      setTvDisplayCode(data.code)
                      // Reset countdown when code refreshes
                      setCountdown(120) 
                  })
                  .finally(() => setTvCodeLoading(false))
            }
            fetchCode()
            // Polling every 10s as requested by Senior Dev
            const pollInterval = setInterval(fetchCode, 10000) 
            return () => clearInterval(pollInterval)
        }
        setAutoLoginChecked(true)
      })
      .catch(() => {
         setAutoLoginChecked(true)
         if (isSmartTV()) {
            setIsTvDevice(true)
            generateTVCode(routerId, mac, getTenant())
               .then(data => setTvDisplayCode(data.code))
               .finally(() => setLoading(false))
         }
      })
  }, [routerId, loginUrl, autoLoginChecked])

  // ── Load hotspot plans + portal config ──
  useEffect(() => {
    if (isTvDevice) return
    fetchCaptivePortal(routerId)
      .then((data) => {
        setPlans(data.plans)
        setPortalConfig(data.portal_config || null)
        setBranding(data.branding || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to load plans")
        setLoading(false)
      })
  }, [routerId, isTvDevice])

  // ── Poll payment status ──
  useEffect(() => {
    if (paymentStatus !== "waiting" || !sessionId) return
    const pollInterval = setInterval(async () => {
      try {
        const result = await pollPurchaseStatus(sessionId, loginUrl, getTenant())
        
        if (result.status === "success") {
          setPaymentStatus("success")
          setAccessCode(result.access_code || null)
          setExpiresAt(result.expires_at || null)
          clearInterval(pollInterval)
          
          if (loginUrl && result.access_code) {
             setReturningToRouter(true)
             const username = encodeURIComponent(result.access_code)
             const password = encodeURIComponent(result.access_code)
             const targetUrl = `${loginUrl}?username=${username}&password=${password}`
             setTimeout(() => {
                 window.location.href = targetUrl
             }, 1500)
          }

        } else if (result.status === "failed") {
          setPaymentStatus("failed")
          setError(result.message || "Payment failed")
          clearInterval(pollInterval)
        }
      } catch {
        /* polling error — will retry on next tick */
      }
    }, 3000)
    return () => clearInterval(pollInterval)
  }, [paymentStatus, sessionId, loginUrl])

  // ── Countdown ──
  useEffect(() => {
    if (paymentStatus !== "waiting") return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPaymentStatus("timeout")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [paymentStatus])

  // TV countdown for code refresh
  useEffect(() => {
    if (!isTvDevice || tvCodeLoading) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 120
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isTvDevice, tvCodeLoading])

  // Phone validation
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    setPhoneError(value && !isValidKenyanPhone(value) ? "Enter a valid Safaricom or Airtel number" : null)
  }

  // TV code handlers
  const handleTvCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTvInputCode(e.target.value.toUpperCase())
    if (verifiedTV) setVerifiedTV(null)
    if (tvVerifyError) setTvVerifyError(null)
  }

  const handleVerifyTV = async () => {
    if (tvInputCode.length !== 5) {
        setTvVerifyError("Code must be 5 characters")
        return
    }
    setIsVerifyingTV(true)
    setTvVerifyError(null)
    try {
        const res = await verifyTVCode(tvInputCode, getTenant())
        setVerifiedTV({ mac_address: res.mac_address, router_id: res.router_id, code: tvInputCode })
    } catch(err: any) {
        setTvVerifyError(err.message)
        setVerifiedTV(null)
    } finally {
        setIsVerifyingTV(false)
    }
  }

  // ── Initiate payment ──
  const handlePay = async () => {
    if (!selectedPlan) return
    if (!phoneNumber) { setPhoneError("Phone number is required"); return }
    if (!isValidKenyanPhone(phoneNumber)) { setPhoneError("Enter a valid Safaricom or Airtel number"); return }
    
    if (targetDevice === "tv" && !verifiedTV) { setTvVerifyError("Please verify the TV code first"); return }

    setPaymentStatus("sending")
    setError(null)
    setCountdown(120)

    // IMPORTANT: Use the TV's MAC and Router if verified, else use current device
    let finalMac = getMacAddress()
    let finalRouter = routerId
    let finalTvCode = undefined

    if (targetDevice === "tv" && verifiedTV) {
        finalMac = verifiedTV.mac_address
        // Ensure we pay to the router the TV is actually connected to
        if (verifiedTV.router_id) finalRouter = String(verifiedTV.router_id)
        finalTvCode = verifiedTV.code
    }

    try {
      const result = await initiatePurchase({
        router_id: finalRouter,
        plan_id: selectedPlan.id,
        phone_number: formatPhoneNumber(phoneNumber),
        mac_address: finalMac,
        tenant: getTenant(),
        tv_code: finalTvCode // Passing the TV pairing code to the backend
      })
      setSessionId(result.session_id)
      setPaymentStatus("waiting")
    } catch (err: unknown) {
      setPaymentStatus("failed")
      setError(err instanceof Error ? err.message : "Failed to initiate payment")
    }
  }

  const handleRetry = () => {
    setPaymentStatus("idle")
    setError(null)
    setSessionId(null)
    setCountdown(120)
  }

  // ── Redeem voucher ──
  const handleVoucherRedeem = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Enter your voucher code")
      return
    }

    setVoucherRedeeming(true)
    setVoucherError(null)
    setError(null)

    try {
      const result = await redeemVoucher({
        code: voucherCode.trim(),
        router_id: routerId,
        mac_address: getMacAddress(),
        tenant: getTenant(),
      })

      setAccessCode(result.access_code)
      setExpiresAt(result.expires_at)
      setPaymentStatus("success")

      if (loginUrl && result.access_code) {
        setReturningToRouter(true)
        const username = encodeURIComponent(result.access_code)
        const password = encodeURIComponent(result.access_code)
        const targetUrl = `${loginUrl}?username=${username}&password=${password}`
        setTimeout(() => {
          window.location.href = targetUrl
        }, 1500)
      }
    } catch (err: unknown) {
      setVoucherError(err instanceof Error ? err.message : "Voucher redemption failed")
    } finally {
      setVoucherRedeeming(false)
    }
  }

  // ==========================================
  // RENDER: TV MODE SCREEN
  // ==========================================
  if (isTvDevice) {
    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-white text-center">
            <Monitor className="w-24 h-24 text-blue-500 mb-6" />
            <h1 className="text-4xl font-bold mb-4">Pair Your TV</h1>
            <p className="text-xl text-gray-400 mb-8 max-w-lg">
               Enter this code on your phone to connect this TV:
            </p>
            <div className="bg-gray-900 border-2 border-blue-500 rounded-3xl p-10 mb-6 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                <div className="text-8xl font-mono font-bold tracking-[0.3em] text-blue-400 uppercase">
                    {tvDisplayCode || "Loading"}
                </div>
            </div>
            
            {/* Expiry Countdown requested by Senior Dev */}
            <div className="flex items-center gap-2 text-gray-500 mb-8">
                <Clock className="w-4 h-4" />
                <span>Code refreshes in {countdown}s</span>
            </div>

            <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-blue-500 font-semibold underline">
                <RefreshCw className="w-4 h-4" /> Refresh Now
            </button>
        </div>
    )
  }

  // ==========================================
  // RENDER: Loading
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading hotspot plans...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Fatal Error
  // ==========================================
  if (error && plans.length === 0) {
    return (
      <div className={`${theme.pageBg} flex items-center justify-center p-4`}>
        <div className={`${theme.cardClass} p-8 max-w-md w-full text-center`}>
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-2 ${theme.planTitle}`}>Connection Error</h1>
          <p className={`mb-6 ${theme.mutedText}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${theme.ctaBg} ${theme.ctaText}`}
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Success
  // ==========================================
  if (paymentStatus === "success") {
    return (
      <div className={`${theme.successPageBg || theme.pageBg} flex items-center justify-center p-4`}>
        <div className={`${theme.cardClass} p-8 max-w-md w-full text-center`}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${theme.planTitle}`}>You&apos;re Connected!</h1>
          <p className={`mb-6 ${theme.mutedText}`}>Payment successful. Enjoy your internet access.</p>

          {returningToRouter && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 inline mr-2" />
              <span className="text-sm text-blue-700">Connecting you to the internet...</span>
            </div>
          )}

          {accessCode && (
            <div className={`${theme.successBg} rounded-xl p-4 mb-6`}>
              <p className={`text-sm mb-1 ${theme.mutedText}`}>Your Access Code</p>
              <p className={`text-3xl font-mono font-bold ${theme.planTitle}`}>{accessCode}</p>
            </div>
          )}

          <div className={`${theme.planBg} rounded-xl p-4 text-left space-y-2 border ${theme.planBorder}`}>
            <div className="flex justify-between">
              <span className={theme.mutedText}>Plan</span>
              <span className={`font-semibold ${theme.planTitle}`}>{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.mutedText}>Duration</span>
              <span className={`font-semibold ${theme.planTitle}`}>
                {selectedPlan?.duration_display || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={theme.mutedText}>Speed</span>
              <span className={`font-semibold ${theme.planTitle}`}>{selectedPlan?.speed_display || "-"}</span>
            </div>
            {selectedPlan && selectedPlan.limitation_type !== "UNLIMITED" && (
              <div className="flex justify-between">
                <span className={theme.mutedText}>Data</span>
                <span className={`font-semibold ${theme.planTitle}`}>{selectedPlan.data_limit_display}</span>
              </div>
            )}
            {expiresAt && (
              <div className="flex justify-between">
                <span className={theme.mutedText}>Expires</span>
                <span className={`font-semibold ${theme.planTitle}`}>{new Date(expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Payment Processing
  // ==========================================
  if (paymentStatus === "sending" || paymentStatus === "waiting") {
    return (
      <div className={`${theme.pageBg} flex items-center justify-center p-4`}>
        <div className={`${theme.cardClass} p-8 max-w-md w-full text-center`}>
          {paymentStatus === "sending" ? (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-green-500 mx-auto mb-4" />
              <h2 className={`text-xl font-bold mb-2 ${theme.planTitle}`}>Sending STK Push...</h2>
              <p className={theme.mutedText}>Please wait while we send the payment request to your phone.</p>
            </>
          ) : (
            <>
              <Phone className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
              <h2 className={`text-xl font-bold mb-2 ${theme.planTitle}`}>Check Your Phone</h2>
              <p className={`mb-4 ${theme.bodyText}`}>
                Enter your M-Pesa PIN on your phone to complete the payment.
              </p>

              <div className="bg-amber-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-lg">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <p className="text-sm text-amber-600 mt-1">Time remaining to complete payment</p>
              </div>

              <div className={`${theme.planBg} rounded-xl p-4 text-left space-y-2 border ${theme.planBorder}`}>
                <div className="flex justify-between">
                  <span className={theme.mutedText}>Plan</span>
                  <span className={`font-medium ${theme.planTitle}`}>{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.mutedText}>Amount</span>
                  <span className="font-bold text-green-600">KES {selectedPlan?.price}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Failed / Timeout
  // ==========================================
  if (paymentStatus === "failed" || paymentStatus === "timeout") {
    return (
      <div className={`${theme.pageBg} flex items-center justify-center p-4`}>
        <div className={`${theme.cardClass} p-8 max-w-md w-full text-center`}>
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${theme.planTitle}`}>
            {paymentStatus === "timeout" ? "Payment Timed Out" : "Payment Failed"}
          </h1>
          <p className={`mb-6 ${theme.mutedText}`}>
            {paymentStatus === "timeout"
              ? "The payment request expired. Please try again."
              : error || "Something went wrong. Please try again."}
          </p>
          <button
            onClick={handleRetry}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${theme.ctaBg} ${theme.ctaText}`}
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Main Plan Selection
  // ==========================================

  return (
    <div className={`${theme.pageBg} flex items-center justify-center p-4`}>
      <div className={`${theme.cardClass} max-w-md w-full overflow-hidden`}>
        {/* ── Header — adapts to headerStyle ── */}
        <div
          className={`${theme.headerBg} ${
            theme.headerStyle === "large-hero" ? "p-8" :
            theme.headerStyle === "minimal" ? "p-4" :
            "p-6"
          } ${theme.headerStyle === "left-aligned" ? "text-left" : "text-center"}`}
          style={brandingHeaderStyle}
        >
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={displayName}
              className={`${theme.headerStyle === "large-hero" ? "h-16" : "h-12"} ${theme.headerStyle === "left-aligned" ? "" : "mx-auto"} mb-3 object-contain`}
            />
          ) : theme.showWifiIcon ? (
            <Wifi className={`${theme.headerStyle === "large-hero" ? "w-16 h-16" : "w-12 h-12"} ${theme.headerStyle === "left-aligned" ? "" : "mx-auto"} mb-3 ${theme.headerText}`} />
          ) : null}
          <h1 className={`${theme.headerStyle === "large-hero" ? "text-3xl" : theme.headerStyle === "minimal" ? "text-lg" : "text-2xl"} font-bold ${theme.headerText}`}>{displayName}</h1>
          {welcomeTitle && (
            <p className={`text-sm mt-1 ${theme.headerSub}`}>{welcomeTitle}</p>
          )}
          {supportPhone && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${theme.headerSub} ${theme.headerStyle === "left-aligned" ? "" : "justify-center"}`}>
              <Phone className="w-3 h-3" />
              {supportPhone}
            </p>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-6">
          {/* Announcement Banner */}
          {announcement && (
            <div className={`mb-5 px-4 py-3 rounded-lg ${theme.annBg} flex items-start gap-2`}>
              <Megaphone className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme.annIcon}`} />
              <p className={`text-sm ${theme.annText}`}>{announcement}</p>
            </div>
          )}

          {/* DEVICE TARGET TOGGLE */}
          <div className="mb-6 bg-gray-100 p-1.5 rounded-xl flex items-center">
            <button 
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${targetDevice === 'this' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTargetDevice('this')}
            >
                <Smartphone className="w-4 h-4" /> This Device
            </button>
            <button 
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${targetDevice === 'tv' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTargetDevice('tv')}
            >
                <Monitor className="w-4 h-4" /> Pay for TV
            </button>
          </div>

          {/* TV CODE VERIFICATION BLOCK */}
          {targetDevice === 'tv' && (
              <div className="mb-6 p-4 border rounded-xl bg-blue-50/50 border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter code shown on TV</label>
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          maxLength={5}
                          value={tvInputCode}
                          onChange={handleTvCodeChange}
                          placeholder="e.g. A1B2C"
                          className="flex-1 px-4 py-2 border border-blue-200 rounded-lg font-mono uppercase text-center text-xl tracking-[0.25em] focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                          onClick={handleVerifyTV}
                          disabled={tvInputCode.length !== 5 || isVerifyingTV || !!verifiedTV}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center"
                      >
                          {isVerifyingTV ? <Loader2 className="w-4 h-4 animate-spin" /> : (verifiedTV ? <CheckCircle2 className="w-4 h-4" /> : 'Verify')}
                      </button>
                  </div>
                  {tvVerifyError && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {tvVerifyError}</p>}
                  {verifiedTV && <p className="text-green-600 text-sm mt-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> TV Verified Successfully!</p>}
              </div>
          )}

          <p className={`${theme.headerStyle === "left-aligned" ? "text-left" : "text-center"} mb-6 ${theme.bodyText}`}>
            {welcomeMessage || "Select a plan and pay with M-Pesa to get connected"}
          </p>

          {/* Phone Number Input — shown before plans for certain templates */}
          {theme.showPhoneBeforePlans && paymentMode === "mpesa" && (
            <PhoneInput
              phoneNumber={phoneNumber}
              phoneError={phoneError}
              onPhoneChange={handlePhoneChange}
              theme={theme}
            />
          )}

          {/* Plan Cards - Layout varies by theme */}
          <div className={`mb-6 ${
            theme.layoutType === "grid" 
              ? "grid grid-cols-2 gap-3" 
              : theme.layoutType === "compact"
              ? "flex flex-wrap gap-2"
              : "space-y-3"
          }`}>
            {/* Featured layout: show popular plan first and larger */}
            {theme.layoutType === "featured" && plans.some(p => p.is_popular) && (
              <div className="mb-3">
                {plans.filter(p => p.is_popular).map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full text-left border-2 rounded-2xl p-5 transition-all ${
                      selectedPlan?.id === plan.id
                        ? `${theme.planSelectedBorder} ${theme.planSelectedBg} shadow-lg ring-2 ring-opacity-50`
                        : `${theme.planBorder} ${theme.planBg} hover:shadow-md`
                    }`}
                    style={selectedPlan?.id === plan.id ? brandingSelectedBorderStyle : undefined}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${theme.planPopularBg} ${theme.planPopularText}`}
                        style={branding?.primary_color ? { backgroundColor: branding.primary_color } : undefined}
                      >
                        ★ BEST VALUE
                      </span>
                      {selectedPlan?.id === plan.id && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`text-lg font-bold ${theme.planTitle}`}>{plan.name}</span>
                        <div className={`flex items-center gap-3 mt-1 text-sm ${theme.planSub}`}>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{plan.duration_display}</span>
                          {plan.download_speed ? (
                            <>
                              <span className="flex items-center gap-1 text-green-600"><ArrowDown className="w-3.5 h-3.5" />{plan.download_speed} {plan.speed_unit || 'Mbps'}</span>
                              <span className="flex items-center gap-1 text-blue-600"><ArrowUp className="w-3.5 h-3.5" />{plan.upload_speed} {plan.speed_unit || 'Mbps'}</span>
                            </>
                          ) : <span className="flex items-center gap-1"><Zap className="w-4 h-4" />{plan.speed_display}</span>}
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${theme.planPrice}`} style={brandingPriceStyle}>
                        {plan.currency || "KES"} {plan.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Regular plans (or all plans for non-featured layouts) */}
            {(theme.layoutType === "featured" ? plans.filter(p => !p.is_popular) : plans).map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={`text-left border-2 transition-all ${
                  theme.layoutType === "grid" 
                    ? "rounded-xl p-3 flex flex-col" 
                    : theme.layoutType === "compact"
                    ? "rounded-lg p-2 flex-1 min-w-[140px]"
                    : "w-full rounded-xl p-4"
                } ${
                  selectedPlan?.id === plan.id
                    ? `${theme.planSelectedBorder} ${theme.planSelectedBg} shadow-md`
                    : `${theme.planBorder} ${theme.planBg} hover:shadow-sm`
                }`}
                style={selectedPlan?.id === plan.id ? brandingSelectedBorderStyle : undefined}
              >
                {/* Grid layout: vertical card design */}
                {theme.layoutType === "grid" ? (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold text-sm ${theme.planTitle}`}>{plan.name}</span>
                      {selectedPlan?.id === plan.id && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    {plan.is_popular && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit mb-2 ${theme.planPopularBg} ${theme.planPopularText}`}
                        style={branding?.primary_color ? { backgroundColor: branding.primary_color } : undefined}>POPULAR</span>
                    )}
                    <div className={`text-xs space-y-1 ${theme.planSub} flex-1`}>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.duration_display}</div>
                      <div className="flex items-center gap-1"><Zap className="w-3 h-3" />{plan.speed_display}</div>
                      {plan.simultaneous_devices && plan.simultaneous_devices > 0 && (
                        <div className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.simultaneous_devices} devices</div>
                      )}
                    </div>
                    <div className={`text-lg font-bold mt-2 ${theme.planPrice}`} style={brandingPriceStyle}>
                      {plan.currency || "KES"} {plan.price}
                    </div>
                  </div>
                ) : theme.layoutType === "compact" ? (
                  /* Compact layout: minimal info */
                  <div className="text-center">
                    <span className={`font-semibold text-sm block ${theme.planTitle}`}>{plan.name}</span>
                    <span className={`text-xs ${theme.planSub}`}>{plan.duration_display}</span>
                    <div className={`text-lg font-bold ${theme.planPrice}`} style={brandingPriceStyle}>
                      {plan.currency || "KES"} {plan.price}
                    </div>
                    {selectedPlan?.id === plan.id && <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mt-1" />}
                  </div>
                ) : (
                  /* List/Featured layout: horizontal design */
                  <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${theme.planTitle}`}>{plan.name}</span>
                      {plan.is_popular && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.planPopularBg} ${theme.planPopularText}`}
                          style={branding?.primary_color ? { backgroundColor: branding.primary_color } : undefined}
                        >
                          POPULAR
                        </span>
                      )}
                      {selectedPlan?.id === plan.id && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {/* Duration + Speed row */}
                    <div className={`flex flex-wrap items-center gap-3 mt-2 text-sm ${theme.planSub}`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {plan.duration_display}
                      </span>
                      {/* Show detailed speeds if available, otherwise fallback to speed_display */}
                      {plan.download_speed || plan.upload_speed ? (
                        <>
                          <span className="flex items-center gap-1 text-green-600">
                            <ArrowDown className="w-3.5 h-3.5" />
                            {plan.download_speed} {plan.speed_unit || 'Mbps'}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <ArrowUp className="w-3.5 h-3.5" />
                            {plan.upload_speed} {plan.speed_unit || 'Mbps'}
                          </span>
                        </>
                      ) : plan.speed_display ? (
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {plan.speed_display}
                        </span>
                      ) : null}
                    </div>
                    {/* Data limit + device limit row */}
                    <div className={`flex flex-wrap items-center gap-3 mt-1 text-xs ${theme.planSub}`}>
                      {plan.limitation_type !== "UNLIMITED" && plan.data_limit_value ? (
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {plan.data_limit_display}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600">
                          <Zap className="w-3 h-3" />
                          Unlimited Data
                        </span>
                      )}
                      {plan.simultaneous_devices && plan.simultaneous_devices > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {plan.simultaneous_devices} {plan.simultaneous_devices === 1 ? 'device' : 'devices'}
                        </span>
                      )}
                    </div>
                    {plan.description && (
                      <p className={`text-xs mt-1 ${theme.planSub}`}>{plan.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <span className={`text-xl font-bold ${theme.planPrice}`} style={brandingPriceStyle}>
                      {plan.currency || "KES"} {plan.price}
                    </span>
                  </div>
                </div>
                )}
              </button>
            ))}
          </div>

          {/* Phone Number Input — shown after plans for most templates */}
          {!theme.showPhoneBeforePlans && paymentMode === "mpesa" && (
            <PhoneInput
              phoneNumber={phoneNumber}
              phoneError={phoneError}
              onPhoneChange={handlePhoneChange}
              theme={theme}
            />
          )}

          {/* ── Payment Mode Toggle ── */}
          <div className="mb-4">
            <div className={`flex rounded-lg border ${theme.inputBorder} overflow-hidden`}>
              <button
                type="button"
                onClick={() => { setPaymentMode("mpesa"); setVoucherError(null) }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  paymentMode === "mpesa"
                    ? `${theme.ctaBg} ${theme.ctaText}`
                    : `${theme.planBg} ${theme.mutedText} hover:opacity-80`
                }`}
                style={paymentMode === "mpesa" ? brandingCtaStyle : undefined}
              >
                <Phone className="w-4 h-4" />
                M-Pesa
              </button>
              <button
                type="button"
                onClick={() => { setPaymentMode("voucher"); setPhoneError(null) }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  paymentMode === "voucher"
                    ? `${theme.ctaBg} ${theme.ctaText}`
                    : `${theme.planBg} ${theme.mutedText} hover:opacity-80`
                }`}
                style={paymentMode === "voucher" ? brandingCtaStyle : undefined}
              >
                <Ticket className="w-4 h-4" />
                Voucher
              </button>
            </div>
          </div>

          {/* ── Voucher Input ── */}
          {paymentMode === "voucher" && (
            <div className="mb-6 space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.planTitle}`}>
                  Voucher Code
                </label>
                <div className="relative">
                  <Ticket className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.mutedText}`} />
                  <input
                    type="text"
                    placeholder="Enter 5-digit code"
                    value={voucherCode}
                    onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(null) }}
                    className={`w-full pl-10 pr-4 py-3 border ${theme.cardShape} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} font-mono tracking-wider text-lg ${
                      voucherError ? "!border-red-400 !ring-red-500" : ""
                    }`}
                  />
                </div>
              </div>
              {voucherError && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${theme.errorBg}`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${theme.errorText}`} />
                  <span className={`text-sm ${theme.errorText}`}>{voucherError}</span>
                </div>
              )}
            </div>
          )}

          {/* Inline Error */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${theme.errorBg}`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${theme.errorText}`} />
              <span className={`text-sm ${theme.errorText}`}>{error}</span>
            </div>
          )}

          {/* CTA Button — style varies by theme */}
          <div className={theme.ctaStyle === "centered" ? "flex justify-center" : ""}>
            {paymentMode === "mpesa" ? (
              <button
                onClick={handlePay}
                disabled={!selectedPlan || !phoneNumber || !!phoneError || (targetDevice === "tv" && !verifiedTV)}
                className={`py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${theme.ctaBg} ${theme.ctaText} ${theme.ctaHover} ${
                  theme.ctaStyle === "pill"
                    ? "w-full rounded-full"
                    : theme.ctaStyle === "centered"
                    ? "px-12 rounded-xl"
                    : "w-full rounded-xl"
                }`}
                style={brandingCtaStyle}
              >
                {selectedPlan
                  ? `Pay ${selectedPlan.currency || "KES"} ${selectedPlan.price} with M-Pesa`
                  : "Select a Plan to Continue"}
              </button>
            ) : (
              <button
                onClick={handleVoucherRedeem}
                disabled={!voucherCode.trim() || voucherRedeeming}
                className={`py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 ${theme.ctaBg} ${theme.ctaText} ${theme.ctaHover} ${
                  theme.ctaStyle === "pill"
                    ? "w-full rounded-full"
                    : theme.ctaStyle === "centered"
                    ? "px-12 rounded-xl"
                    : "w-full rounded-xl"
                }`}
                style={brandingCtaStyle}
              >
                {voucherRedeeming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redeeming...
                  </>
                ) : (
                  "Redeem Voucher"
                )}
              </button>
            )}
          </div>

          <p className={`text-center text-xs mt-4 ${theme.footerText}`}>
            By connecting, you agree to the terms of service
          </p>

          {/* Support footer */}
          {supportPhone && (
            <p className={`text-center text-xs mt-2 ${theme.footerText}`}>
              Need help? Call{" "}
              <a href={`tel:${supportPhone}`} className="underline">
                {supportPhone}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}