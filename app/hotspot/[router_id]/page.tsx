"use client"

import { use, useEffect, useState, useMemo, useRef } from "react"
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
  router_logo_url?: string | null
  hide_plan_speed?: boolean
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

interface HotspotAd {
  id: number
  name: string
  media_url: string
  media_type: 'VIDEO' | 'IMAGE'
  target_url: string
  reward_enabled: boolean
  reward_minutes: number
}

interface AdGrantResponse {
  status: string
  access_code: string
  expires_at: string
  reward_minutes: number
  already_active?: boolean
  error?: string
}

type PaymentStatus = "idle" | "sending" | "waiting" | "success" | "failed" | "timeout"

// ─── Loyalty types ───────────────────────────────────────────────────────────

interface LoyaltyRewardItem {
  id: number
  name: string
  description: string
  points_cost: number
  reward_minutes: number
  reward_speed_mbps: string
}

interface HotspotLoyaltyData {
  program_active: boolean
  has_loyalty: boolean
  member_id?: number
  current_points: number
  lifetime_points?: number
  tier_name?: string
  tier_level?: string
  available_rewards: LoyaltyRewardItem[]
  all_hotspot_rewards: LoyaltyRewardItem[]
}

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

// ==========================================
// NEW: Phone reconnect API
// ==========================================
async function phoneReconnect(data: {
  phone_number: string
  router_id: string
  mac_address: string
  tenant: string
}): Promise<{
  status: string
  message: string
  access_code: string
  expires_at: string | null
  remaining_minutes: number
  plan_name: string
  device_slot: number | string
  device_limit?: number
  credentials: { username: string; password: string }
}> {
  const response = await fetch(`${getApiBase()}/hotspot/phone-reconnect/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error || 'Could not connect')
  return json
}

// === TV API FUNCTIONS ===
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

// === AD API FUNCTIONS ===
async function fetchServableAd(routerId: string, tenant: string): Promise<{ ad: HotspotAd | null }> {
  try {
    const res = await fetch(
      `${getApiBase()}/hotspot/ads/serve/?router_id=${routerId}&tenant=${encodeURIComponent(tenant)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return { ad: null }
    return res.json()
  } catch {
    return { ad: null }
  }
}

async function grantAdAccess(data: {
  ad_id: number
  mac_address: string
  router_id: string
  tenant: string
}): Promise<AdGrantResponse> {
  const res = await fetch(`${getApiBase()}/hotspot/ads/grant-access/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok && res.status !== 409) throw new Error(json.error || 'Failed to grant access')
  return json
}

// ─── Loyalty API functions ──────────────────────────────────────────────────

async function fetchHotspotLoyalty(
  mac: string,
  tenant: string,
  canonicalUsername?: string
): Promise<HotspotLoyaltyData | null> {
  try {
    const params = new URLSearchParams({ mac, tenant })
    if (canonicalUsername) params.append('canonical_username', canonicalUsername)
    const res = await fetch(`${getApiBase()}/hotspot/loyalty-info/?${params.toString()}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function redeemHotspotLoyaltyPoints(data: {
  canonical_username: string
  reward_id: number
  router_id: string
  mac_address: string
  tenant: string
}): Promise<{
  status: string
  access_code: string
  expires_at: string
  reward_minutes: number
  points_used: number
  points_remaining: number
  message: string
  error?: string
}> {
  const res = await fetch(`${getApiBase()}/hotspot/loyalty-redeem/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Redemption failed')
  return json
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

// ==========================================
// AUTO-COMPLETE IMAGE AD COMPONENT
// ==========================================
function AutoCompleteImage({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 5000)
    return () => clearTimeout(t)
  }, [onComplete])
  return null
}

// ==========================================
// 3-LAYER HYBRID TV DETECTION
// ==========================================
function isSmartTV(): boolean {
  if (typeof window === "undefined") return false

  const params = new URLSearchParams(window.location.search)
  
  // Layer 1: explicit param from MikroTik login.html (admin override)
  if (params.get("smart_tv") === "1" || params.get("force_tv") === "1") return true
  if (params.get("smart_tv") === "0" || params.get("force_tv") === "0") return false

  const ua = navigator.userAgent.toLowerCase()

  // Layer 2: known TV UA patterns
  if (/smart-?tv|webos|tizen|vidaa|hbbtv|roku|firetv|appletv|apple\s?tv|bravia|netcast|viera|aft[a-z]|crkey|tv safari/i.test(ua)) {
    return true
  }

  // Android TV: android but no "mobile" token + wide screen (≥1280px)
  if (/android/i.test(ua) && !/mobile/i.test(ua) && window.screen.width >= 1280) {
    return true
  }

  // Layer 3: geometry heuristic (safe — desktop OSes are excluded)
  const isDesktopOS = /windows nt|macintosh|\bx11\b|linux x86_64|cros/i.test(ua)
  if (!isDesktopOS
    && window.screen.width >= 1280
    && window.screen.height >= 720
    && (window.screen.width / window.screen.height) >= 1.5
    && !("ontouchstart" in window)
    && navigator.maxTouchPoints === 0
  ) {
    return true
  }

  return false
}

// ==========================================
// TEMPLATE STYLE ENGINE (12 themes)
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
    case 8: // Neon Noir
      return {
        layoutType: "grid",
        headerStyle: "centered",
        cardShape: "rounded-2xl",
        ctaStyle: "full-width",
        showPhoneBeforePlans: false,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gray-950",
        cardClass: "bg-gray-900 border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-900/20",
        headerBg: "bg-gradient-to-r from-violet-900 to-purple-900",
        headerText: "text-white",
        headerSub: "text-violet-300/70",
        annBg: "bg-violet-950/50 border border-violet-700/30",
        annText: "text-violet-200",
        annIcon: "text-violet-400",
        planSelectedBorder: "border-violet-500",
        planSelectedBg: "bg-violet-950/40",
        planBorder: "border-gray-700/50",
        planBg: "bg-gray-800/60",
        planTitle: "text-white",
        planSub: "text-gray-400",
        planPrice: "text-violet-400",
        planPopularBg: "bg-violet-500",
        planPopularText: "text-white",
        inputBorder: "border-gray-700",
        inputBg: "bg-gray-800",
        inputText: "text-white",
        inputPlaceholder: "placeholder:text-gray-600",
        ctaBg: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500",
        ctaText: "text-white",
        ctaHover: "hover:shadow-violet-500/30",
        bodyText: "text-gray-300",
        mutedText: "text-gray-500",
        footerText: "text-gray-700",
        errorBg: "bg-red-950/40 border-red-700/30",
        errorText: "text-red-400",
        successBg: "bg-violet-950/40",
        successPageBg: "min-h-screen bg-gray-950",
      }
    case 9: // Safari Warmth
      return {
        layoutType: "list",
        headerStyle: "left-aligned",
        cardShape: "rounded-2xl",
        ctaStyle: "full-width",
        showPhoneBeforePlans: false,
        showWifiIcon: false,
        pageBg: "min-h-screen bg-amber-50",
        cardClass: "bg-white rounded-2xl shadow-lg border border-amber-100",
        headerBg: "bg-amber-800",
        headerText: "text-amber-50",
        headerSub: "text-amber-200",
        annBg: "bg-amber-100 border border-amber-300",
        annText: "text-amber-900",
        annIcon: "text-amber-700",
        planSelectedBorder: "border-amber-700",
        planSelectedBg: "bg-amber-50",
        planBorder: "border-amber-100",
        planBg: "bg-white",
        planTitle: "text-gray-900",
        planSub: "text-amber-700",
        planPrice: "text-amber-800",
        planPopularBg: "bg-amber-700",
        planPopularText: "text-white",
        inputBorder: "border-amber-200",
        inputBg: "bg-white",
        inputText: "text-gray-900",
        inputPlaceholder: "placeholder:text-amber-300",
        ctaBg: "bg-amber-700 hover:bg-amber-800",
        ctaText: "text-white",
        ctaHover: "",
        bodyText: "text-gray-700",
        mutedText: "text-amber-600",
        footerText: "text-amber-300",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-green-50",
        successPageBg: "min-h-screen bg-amber-50",
      }
    case 10: // Ocean Breeze
      return {
        layoutType: "grid",
        headerStyle: "large-hero",
        cardShape: "rounded-2xl",
        ctaStyle: "pill",
        showPhoneBeforePlans: false,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gradient-to-b from-sky-400 to-teal-500",
        cardClass: "bg-white/95 rounded-2xl shadow-2xl",
        headerBg: "bg-gradient-to-r from-sky-500 to-teal-500",
        headerText: "text-white",
        headerSub: "text-sky-100",
        annBg: "bg-sky-50 border border-sky-200",
        annText: "text-sky-800",
        annIcon: "text-sky-500",
        planSelectedBorder: "border-teal-500",
        planSelectedBg: "bg-teal-50",
        planBorder: "border-gray-200",
        planBg: "bg-white",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-teal-600",
        planPopularBg: "bg-teal-500",
        planPopularText: "text-white",
        inputBorder: "border-gray-200",
        inputBg: "bg-white",
        inputText: "text-gray-900",
        inputPlaceholder: "placeholder:text-gray-400",
        ctaBg: "bg-teal-500 hover:bg-teal-600",
        ctaText: "text-white",
        ctaHover: "hover:shadow-teal-500/25",
        bodyText: "text-gray-700",
        mutedText: "text-gray-500",
        footerText: "text-gray-400",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-teal-50",
        successPageBg: "min-h-screen bg-gradient-to-b from-sky-400 to-teal-500",
      }
    case 11: // Midnight Luxury
      return {
        layoutType: "featured",
        headerStyle: "centered",
        cardShape: "rounded-2xl",
        ctaStyle: "full-width",
        showPhoneBeforePlans: true,
        showWifiIcon: false,
        pageBg: "min-h-screen bg-slate-900",
        cardClass: "bg-slate-800 border border-yellow-500/10 rounded-2xl shadow-2xl",
        headerBg: "bg-gradient-to-r from-slate-900 to-slate-800 border-b border-yellow-500/20",
        headerText: "text-yellow-400",
        headerSub: "text-slate-400",
        annBg: "bg-yellow-950/30 border border-yellow-700/30",
        annText: "text-yellow-200",
        annIcon: "text-yellow-500",
        planSelectedBorder: "border-yellow-500",
        planSelectedBg: "bg-yellow-950/20",
        planBorder: "border-slate-700",
        planBg: "bg-slate-700/50",
        planTitle: "text-white",
        planSub: "text-slate-400",
        planPrice: "text-yellow-400",
        planPopularBg: "bg-yellow-500",
        planPopularText: "text-slate-900",
        inputBorder: "border-slate-600",
        inputBg: "bg-slate-700",
        inputText: "text-white",
        inputPlaceholder: "placeholder:text-slate-500",
        ctaBg: "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400",
        ctaText: "text-slate-900 font-bold",
        ctaHover: "hover:shadow-yellow-500/20",
        bodyText: "text-slate-300",
        mutedText: "text-slate-500",
        footerText: "text-slate-700",
        errorBg: "bg-red-950/40 border-red-700/30",
        errorText: "text-red-400",
        successBg: "bg-yellow-950/30",
        successPageBg: "min-h-screen bg-slate-900",
      }
    case 12: // Blossom
      return {
        layoutType: "list",
        headerStyle: "centered",
        cardShape: "rounded-3xl",
        ctaStyle: "pill",
        showPhoneBeforePlans: false,
        showWifiIcon: true,
        pageBg: "min-h-screen bg-gradient-to-br from-rose-50 to-pink-100",
        cardClass: "bg-white rounded-3xl shadow-xl border border-pink-100",
        headerBg: "bg-gradient-to-r from-pink-400 to-rose-400",
        headerText: "text-white",
        headerSub: "text-pink-100",
        annBg: "bg-pink-50 border border-pink-200",
        annText: "text-pink-700",
        annIcon: "text-pink-400",
        planSelectedBorder: "border-pink-400",
        planSelectedBg: "bg-pink-50",
        planBorder: "border-pink-100",
        planBg: "bg-white",
        planTitle: "text-gray-900",
        planSub: "text-gray-400",
        planPrice: "text-pink-500",
        planPopularBg: "bg-pink-400",
        planPopularText: "text-white",
        inputBorder: "border-pink-200",
        inputBg: "bg-white",
        inputText: "text-gray-900",
        inputPlaceholder: "placeholder:text-pink-300",
        ctaBg: "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500",
        ctaText: "text-white",
        ctaHover: "hover:shadow-pink-400/25",
        bodyText: "text-gray-700",
        mutedText: "text-gray-400",
        footerText: "text-pink-200",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        successBg: "bg-pink-50",
        successPageBg: "min-h-screen bg-gradient-to-br from-rose-50 to-pink-100",
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
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

  // Voucher state (now on main page)
  const [voucherCode, setVoucherCode] = useState("")
  const [voucherRedeeming, setVoucherRedeeming] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  // Ad state
  const [availableAd, setAvailableAd] = useState<HotspotAd | null>(null)
  const [showAdModal, setShowAdModal] = useState(false)
  const [adVideoCountdown, setAdVideoCountdown] = useState(0)
  const [adCompleted, setAdCompleted] = useState(false)
  const [adGranting, setAdGranting] = useState(false)
  const [adError, setAdError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const preloadVideoRef = useRef<HTMLVideoElement | null>(null)

  // ── Loyalty state ──────────────────────────────────────────────────────────
  const [loyaltyData, setLoyaltyData] = useState<HotspotLoyaltyData | null>(null)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [canonicalUsername, setCanonicalUsername] = useState<string>('')

  // ── Phone reconnect state ──────────────────────────────────────────────────
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [reconnectPhone, setReconnectPhone] = useState('')
  const [reconnectPhoneError, setReconnectPhoneError] = useState<string | null>(null)
  const [reconnectPhoneLoading, setReconnectPhoneLoading] = useState(false)

  // Preload video into browser cache as soon as ad data arrives
  useEffect(() => {
    if (!availableAd?.media_url || availableAd.media_type !== 'VIDEO') return

    // Create a hidden video element to force browser to buffer the file
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none'
    video.src = availableAd.media_url
    video.load()
    document.body.appendChild(video)
    preloadVideoRef.current = video

    return () => {
      video.src = ''
      video.remove()
      preloadVideoRef.current = null
    }
  }, [availableAd?.media_url])

  // === TV MODE STATES ===
  const [isTvDevice, setIsTvDevice] = useState(false)
  const [tvDisplayCode, setTvDisplayCode] = useState<string | null>(null)
  const [tvCodeLoading, setTvCodeLoading] = useState(false)
  const [tvExpiresAtMs, setTvExpiresAtMs] = useState<number | null>(null)
  const [tvPaymentStatus, setTvPaymentStatus] = useState<"pending" | "paid">("pending")

  // Phone paying for TV
  const [targetDevice, setTargetDevice] = useState<"this" | "tv">("this")
  const [tvInputCode, setTvInputCode] = useState("")
  const [verifiedTV, setVerifiedTV] = useState<{ mac_address: string; router_id?: string; code: string } | null>(null)
  const [isVerifyingTV, setIsVerifyingTV] = useState(false)
  const [tvVerifyError, setTvVerifyError] = useState<string | null>(null)
  // ==========================================

  // FIX #2: Theme derived from portal_config — handle encoded template_id
  // IDs 101-200: list layout override (101 = template 1 with list layout, etc.)
  // IDs 201-300: grid layout override (201 = template 1 with grid layout, etc.)
  const rawTemplateId = portalConfig?.template_id ?? 1
  const isListOverride = rawTemplateId > 100 && rawTemplateId <= 200
  const isGridOverride = rawTemplateId > 200
  const templateId = isGridOverride ? rawTemplateId - 200 : isListOverride ? rawTemplateId - 100 : rawTemplateId
  const theme = useMemo(() => {
    const base = getTheme(templateId)
    if (isListOverride) {
      return { ...base, layoutType: "list" as const }
    }
    if (isGridOverride) {
      return { ...base, layoutType: "grid" as const }
    }
    return base
  }, [templateId, isListOverride, isGridOverride])
  const displayName = branding?.company_name || portalConfig?.hotspot_name || "WiFi Hotspot"
  const welcomeTitle = branding?.welcome_title || ""
  const welcomeMessage = branding?.welcome_message || ""
  const supportPhone = branding?.support_phone || portalConfig?.support_phone || ""
  const announcement = portalConfig?.announcement_text || ""

  // Fix logo URL resolution - check both branding logo and portal_config router_logo_url as fallback
  const apiBaseUrl = getApiBase().replace('/api/v1', '')
  const logoUrl = (() => {
    const raw = branding?.logo_url || portalConfig?.router_logo_url || null
    if (!raw) return null
    return raw.startsWith('http') ? raw : `${apiBaseUrl}${raw}`
  })()

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
        if (result.has_session && result.credentials) {
          setCanonicalUsername(result.credentials.username)  // ← ADDED: Track canonical username from auto-login
          if (loginUrl) {
            setReturningToRouter(true)
            returnTripToMikrotik(loginUrl, result.credentials.username, result.credentials.password)
          }
        } else if (isSmartTV()) {
            setIsTvDevice(true)
            const fetchCode = async () => {
                setTvCodeLoading(true)
                try {
                    const data = await generateTVCode(routerId, mac, getTenant())
                    setTvDisplayCode(data.code)
                    const expiresIn = Number(data.expires_in ?? 300)
                    setTvExpiresAtMs(Date.now() + expiresIn * 1000)
                } finally {
                    setTvCodeLoading(false)
                }
            }
            fetchCode()
        }
        setAutoLoginChecked(true)
      })
      .catch(() => {
         setAutoLoginChecked(true)
         if (isSmartTV()) {
            setIsTvDevice(true)
            generateTVCode(routerId, mac, getTenant())
               .then(data => {
                   setTvDisplayCode(data.code)
                   const expiresIn = Number(data.expires_in ?? 300)
                   setTvExpiresAtMs(Date.now() + expiresIn * 1000)
               })
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

  // ── Fetch available ad ──
  useEffect(() => {
    if (isTvDevice || loading) return
    const tenant = getTenant()
    if (!tenant) return
    fetchServableAd(routerId, tenant).then(({ ad }) => setAvailableAd(ad))
  }, [routerId, isTvDevice, loading])

  // ── Fetch loyalty info after plans load ───────────────────────────────────
  useEffect(() => {
    if (loading || isTvDevice) return
    const mac = getMacAddress()
    if (mac === '00:00:00:00:00:00') return
    const tenant = getTenant()
    if (!tenant) return

    fetchHotspotLoyalty(mac, tenant, canonicalUsername || undefined).then(data => {
      if (data?.program_active) setLoyaltyData(data)
    })
  }, [loading, isTvDevice, canonicalUsername])

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
          if (result.access_code) setCanonicalUsername(result.access_code)  // ← ADDED: Track canonical username from payment
          clearInterval(pollInterval)
          
          // ONLY auto-login if we are paying for THIS device (not for TV)
          if (loginUrl && result.access_code && targetDevice !== "tv") {
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
  }, [paymentStatus, sessionId, loginUrl, targetDevice])

  // ── Countdown for phone payment ──
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

  // TV countdown based on real expiry
  useEffect(() => {
    if (!isTvDevice || !tvExpiresAtMs) return

    const timer = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((tvExpiresAtMs - Date.now()) / 1000))
      setCountdown(secondsLeft)

      // Refresh only when truly expired
      if (secondsLeft <= 0 && !tvCodeLoading) {
        const fetchCode = async () => {
          setTvCodeLoading(true)
          try {
            const data = await generateTVCode(routerId, getMacAddress(), getTenant())
            setTvDisplayCode(data.code)
            const expiresIn = Number(data.expires_in ?? 300)
            setTvExpiresAtMs(Date.now() + expiresIn * 1000)
          } finally {
            setTvCodeLoading(false)
          }
        }
        fetchCode()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isTvDevice, tvExpiresAtMs, routerId, tvCodeLoading])

  // FIX #2: TV auto-show "paid" when payment was made on phone
  // Uses existing checkAutoLogin endpoint instead of non-existent pollTvPaidStatus
  useEffect(() => {
    if (!isTvDevice || !tvDisplayCode) return

    const mac = getMacAddress()

    // Poll the backend every 4 seconds using the existing checkAutoLogin endpoint!
    const pollInterval = setInterval(async () => {
      try {
        const result = await checkAutoLogin(routerId, mac)

        // If the backend says this MAC now has an active session, auto-login!
        if (result.has_session && result.credentials) {
          setTvPaymentStatus("paid")
          setAccessCode(result.credentials.username)

          // Auto-login TV via MikroTik login_url
          if (loginUrl) {
            setReturningToRouter(true)
            const username = encodeURIComponent(result.credentials.username)
            const password = encodeURIComponent(result.credentials.password)
            const targetUrl = `${loginUrl}?username=${username}&password=${password}`
            setTimeout(() => {
              window.location.href = targetUrl
            }, 1500)
          }
          
          clearInterval(pollInterval)
        }
      } catch {
        // silent retry (wait for the phone to pay)
      }
    }, 4000)

    return () => clearInterval(pollInterval)
  }, [isTvDevice, tvDisplayCode, routerId, loginUrl])

  // Phone validation
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    setPhoneError(value && !isValidKenyanPhone(value) ? "Enter a valid Safaricom or Airtel number" : null)
  }

  // TV code handlers - Updated for 9-character format with auto-hyphen
  const handleTvCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-alphanumeric characters, then uppercase
    let rawValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Automatically insert the hyphen after the 4th character
    if (rawValue.length > 4) {
      rawValue = rawValue.slice(0, 4) + '-' + rawValue.slice(4, 8);
    }
    
    setTvInputCode(rawValue);
    if (verifiedTV) setVerifiedTV(null);
    if (tvVerifyError) setTvVerifyError(null);
  }

  const handleVerifyTV = async () => {
    if (tvInputCode.length !== 9) {
        setTvVerifyError("Code must be 9 characters (e.g., ABCD-1234)")
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

  // ── Select plan and open payment modal ──
  const selectPlanAndPay = (plan: HotspotPlan) => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
    setPhoneError(null)
    setError(null)
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
        tv_code: finalTvCode
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

  // ── Redeem voucher (now top-level) ──
  const handleVoucherRedeem = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Enter your voucher code")
      return
    }
    
    if (targetDevice === "tv" && !verifiedTV) { 
      setTvVerifyError("Please verify the TV code first"); 
      return 
    }

    setVoucherRedeeming(true)
    setVoucherError(null)
    setError(null)

    let finalMac = getMacAddress()
    let finalRouter = routerId

    if (targetDevice === "tv" && verifiedTV) {
        finalMac = verifiedTV.mac_address
        if (verifiedTV.router_id) finalRouter = String(verifiedTV.router_id)
    }

    // If voucher redemption succeeds, we treat it as a successful "payment"
    setShowPaymentModal(false)

    try {
      const result = await redeemVoucher({
        code: voucherCode.trim(),
        router_id: finalRouter,
        mac_address: finalMac, // Use TV's MAC if in TV mode
        tenant: getTenant(),
      })

      setAccessCode(result.access_code)
      setExpiresAt(result.expires_at)
      setPaymentStatus("success")

      // ONLY auto-login if we are paying for THIS device (not for TV)
      if (loginUrl && result.access_code && targetDevice !== "tv") {
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

  // ── Phone reconnect handler ────────────────────────────────────────────────
  const handlePhoneReconnect = async () => {
    const phone = reconnectPhone.trim()
    // Validate 10-digit Kenyan number starting with 0 then 1 or 7
    if (!phone || !/^0[17]\d{8}$/.test(phone)) {
      setReconnectPhoneError('Enter a valid number: 07XX or 01XX (10 digits)')
      return
    }
    setReconnectPhoneLoading(true)
    setReconnectPhoneError(null)
    try {
      const result = await phoneReconnect({
        phone_number: phone,
        router_id: routerId,
        mac_address: getMacAddress(),
        tenant: getTenant(),
      })
      setAccessCode(result.access_code)
      setExpiresAt(result.expires_at)
      setSelectedPlan({
        id: 'phone-reconnect',
        name: result.plan_name || 'Active Plan',
        duration_display: `${result.remaining_minutes} min remaining`,
        speed_display: '',
        price: 0,
        currency: 'KES',
        validity_type: 'MINUTES',
        validity_value: result.remaining_minutes,
        download_speed: 0,
        upload_speed: 0,
        speed_unit: 'MBPS',
        limitation_type: 'UNLIMITED',
        data_limit_value: null,
        data_limit_unit: 'MB',
        data_limit_display: 'Unlimited',
      })
      setShowPhoneModal(false)
      setPaymentStatus('success')
      if (loginUrl && result.credentials) {
        setReturningToRouter(true)
        const u = encodeURIComponent(result.credentials.username)
        const p = encodeURIComponent(result.credentials.password)
        setTimeout(() => {
          window.location.href = `${loginUrl}?username=${u}&password=${p}`
        }, 1500)
      }
    } catch (err: any) {
      // Surface specific backend messages (slots full, expired, etc.)
      setReconnectPhoneError(err.message || 'Could not connect. Please try again.')
    } finally {
      setReconnectPhoneLoading(false)
    }
  }

  // ── Ad video handlers ──
  const handleAdVideoTimeUpdate = () => {
    if (!videoRef.current) return
    const remaining = Math.ceil(videoRef.current.duration - videoRef.current.currentTime)
    setAdVideoCountdown(Math.max(0, remaining))
  }

  const handleAdVideoLoaded = () => {
    if (!videoRef.current) return
    setAdVideoCountdown(Math.ceil(videoRef.current.duration || 15))
  }

  const handleAdComplete = async () => {
    if (!availableAd || adGranting) return
    setAdCompleted(true)
    setAdGranting(true)
    setAdError(null)
    try {
      const result = await grantAdAccess({
        ad_id: availableAd.id,
        mac_address: getMacAddress(),
        router_id: routerId,
        tenant: getTenant(),
      })
      setAccessCode(result.access_code)
      setExpiresAt(result.expires_at)
      setSelectedPlan({
        id: 'ad-sponsored',
        name: `Ad-Sponsored (${result.reward_minutes} min free)`,
        duration_display: `${result.reward_minutes} minutes`,
        speed_display: '5 Mbps',
        price: 0,
        currency: 'KES',
        validity_type: 'MINUTES',
        validity_value: result.reward_minutes,
        download_speed: 5,
        upload_speed: 5,
        speed_unit: 'MBPS',
        limitation_type: 'UNLIMITED',
        data_limit_value: null,
        data_limit_unit: 'MB',
        data_limit_display: 'Unlimited',
      })
      setShowAdModal(false)
      setPaymentStatus('success')
      // Auto-login via MikroTik if we have a login URL
      if (loginUrl && result.access_code) {
        setReturningToRouter(true)
        const u = encodeURIComponent(result.access_code)
        setTimeout(() => { window.location.href = `${loginUrl}?username=${u}&password=${u}` }, 1500)
      }
    } catch (err: any) {
      setAdError(err.message || 'Could not grant access. Please try again.')
      setAdGranting(false)
      setAdCompleted(false)
    }
  }

  // ==========================================
  // RENDER: TV MODE SCREEN
  // ==========================================
  if (isTvDevice) {
    // Show success screen if payment was made
    if (tvPaymentStatus === "paid") {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-white text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Connected!</h1>
          <p className="text-xl text-gray-400 mb-8">You now have internet access. Enjoy!</p>
          {accessCode && (
            <div className="bg-gray-900 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Your Access Code</p>
              <p className="text-2xl font-mono font-bold text-green-400">{accessCode}</p>
            </div>
          )}
          {returningToRouter && (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting to internet...</span>
            </div>
          )}
        </div>
      )
    }

    // Show pairing screen
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
            
            {/* Expiry Countdown */}
            <div className="flex items-center gap-2 text-gray-500 mb-8">
                <Clock className="w-4 h-4" />
                <span>Code expires in {countdown}s</span>
            </div>

            <button 
              onClick={() => {
                const fetchCode = async () => {
                  setTvCodeLoading(true)
                  try {
                    const data = await generateTVCode(routerId, getMacAddress(), getTenant())
                    setTvDisplayCode(data.code)
                    const expiresIn = Number(data.expires_in ?? 300)
                    setTvExpiresAtMs(Date.now() + expiresIn * 1000)
                  } finally {
                    setTvCodeLoading(false)
                  }
                }
                fetchCode()
              }} 
              className="flex items-center gap-2 text-blue-500 font-semibold underline"
            >
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
            {!portalConfig?.hide_plan_speed && (
              <div className="flex justify-between">
                <span className={theme.mutedText}>Speed</span>
                <span className={`font-semibold ${theme.planTitle}`}>{selectedPlan?.speed_display || "-"}</span>
              </div>
            )}
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
          {logoUrl ? (
            <div className={`flex ${theme.headerStyle === "left-aligned" ? "justify-start" : "justify-center"} mb-3`}>
              <img
                src={logoUrl}
                alt={displayName}
                className={`object-contain ${theme.headerStyle === "large-hero" ? "h-16 max-w-[180px]" : "h-12 max-w-[140px]"}`}
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
                  mixBlendMode: "luminosity" as const,
                }}
                onError={(e) => {
                  // Fallback to wifi icon if logo fails to load
                  const parent = (e.target as HTMLImageElement).parentElement
                  if (parent) {
                    // Replace with wifi icon
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
                    svg.setAttribute("class", `${theme.headerStyle === "large-hero" ? "w-16 h-16" : "w-12 h-12"} ${theme.headerText}`)
                    svg.setAttribute("fill", "none")
                    svg.setAttribute("viewBox", "0 0 24 24")
                    svg.setAttribute("stroke", "currentColor")
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
                    path.setAttribute("stroke-linecap", "round")
                    path.setAttribute("stroke-linejoin", "round")
                    path.setAttribute("stroke-width", "2")
                    path.setAttribute("d", "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0")
                    svg.appendChild(path)
                    parent.innerHTML = ""
                    parent.appendChild(svg)
                  }
                }}
              />
            </div>
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

          {/* ── Loyalty Points Banner ── */}
          {loyaltyData?.program_active && (
            <div className="mb-5">
              {loyaltyData.has_loyalty ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <div>
                      <p className="text-sm font-semibold text-violet-800">
                        {loyaltyData.current_points.toLocaleString()} points
                      </p>
                      <p className="text-xs text-violet-500">
                        {loyaltyData.tier_name} tier
                      </p>
                    </div>
                  </div>
                  {loyaltyData.available_rewards.length > 0 ? (
                    <button
                      onClick={() => { setShowRedeemModal(true); setRedeemError(null) }}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      🎁 Redeem
                    </button>
                  ) : loyaltyData.all_hotspot_rewards.length > 0 ? (
                    <button
                      onClick={() => { setShowRedeemModal(true); setRedeemError(null) }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg"
                    >
                      View Rewards
                    </button>
                  ) : null}
                </div>
              ) : loyaltyData.all_hotspot_rewards.length > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-100">
                  <span className="text-base">⭐</span>
                  <p className="text-xs text-violet-600">
                    Earn loyalty points with every purchase! Redeem for free internet.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* ── Voucher Redemption — top level, always visible ── */}
          <div className="mb-5">
            <div className={`flex rounded-xl border ${theme.inputBorder} overflow-hidden`}>
              <div className="relative flex-1">
                <Ticket className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.mutedText}`} />
                <input
                  type="text"
                  placeholder="Have a voucher code? Enter here"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(null) }}
                  className={`w-full pl-9 pr-3 py-3 text-sm border-0 outline-none ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder}`}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!voucherCode.trim()) { setVoucherError("Enter your voucher code"); return }
                  setShowPaymentModal(false)
                  handleVoucherRedeem()
                }}
                disabled={!voucherCode.trim() || voucherRedeeming}
                className={`px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${theme.ctaBg} ${theme.ctaText}`}
                style={brandingCtaStyle}
              >
                {voucherRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
              </button>
            </div>
            {voucherError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{voucherError}
              </p>
            )}
          </div>

          {/* ── Phone reconnect button (MOVED HERE, just below voucher) ── */}
          <button
            type="button"
            onClick={() => {
              setShowPhoneModal(true)
              setReconnectPhoneError(null)
              setReconnectPhone('')
            }}
            className={`w-full mb-5 py-2.5 text-sm font-medium border rounded-xl transition-colors ${theme.planBorder} ${theme.mutedText} hover:opacity-70`}
          >
            Already paid? Reconnect or add a device
          </button>

          {/* Free Ad-Sponsored Access */}
          {availableAd && availableAd.reward_enabled && availableAd.reward_minutes > 0 && (
            <button
              type="button"
              onClick={() => { setShowAdModal(true); setAdCompleted(false); setAdError(null) }}
              className="w-full mb-4 flex items-center justify-between px-4 py-3.5 rounded-xl border-2 border-dashed border-green-400 bg-green-50 hover:bg-green-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-green-800">Watch a 15s Ad — Get {availableAd.reward_minutes} Min FREE</p>
                  <p className="text-xs text-green-600">No payment needed. Just watch the short ad.</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
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
                  <div className="flex gap-2 items-center">
                      <input 
                          type="text" 
                          maxLength={9}
                          value={tvInputCode}
                          onChange={handleTvCodeChange}
                          placeholder="e.g. ABCD-1234"
                          className="flex-1 min-w-0 px-2 py-2 border border-blue-200 rounded-lg font-mono uppercase text-center text-lg tracking-[0.1em] focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                          onClick={handleVerifyTV}
                          disabled={tvInputCode.length !== 9 || isVerifyingTV || !!verifiedTV}
                          className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center whitespace-nowrap"
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
                    onClick={() => selectPlanAndPay(plan)}
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
                        ★ POPULAR
                      </span>
                      {selectedPlan?.id === plan.id && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`text-lg font-bold ${theme.planTitle}`}>{plan.name}</span>
                        <div className={`flex items-center gap-3 mt-1 text-sm ${theme.planSub}`}>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{plan.duration_display}</span>
                          {!portalConfig?.hide_plan_speed && (
                            plan.download_speed ? (
                              <>
                                <span className="flex items-center gap-1 text-green-600"><ArrowDown className="w-3.5 h-3.5" />{plan.download_speed} {plan.speed_unit || 'Mbps'}</span>
                                <span className="flex items-center gap-1 text-blue-600"><ArrowUp className="w-3.5 h-3.5" />{plan.upload_speed} {plan.speed_unit || 'Mbps'}</span>
                              </>
                            ) : <span className="flex items-center gap-1"><Zap className="w-4 h-4" />{plan.speed_display}</span>
                          )}
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
                onClick={() => selectPlanAndPay(plan)}
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
                      {!portalConfig?.hide_plan_speed && (
                        <div className="flex items-center gap-1"><Zap className="w-3 h-3" />{plan.speed_display}</div>
                      )}
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
                      {!portalConfig?.hide_plan_speed && (
                        plan.download_speed || plan.upload_speed ? (
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
                        ) : null
                      )}
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

          {/* Support footer */}
          {supportPhone && (
            <p className={`text-center text-xs mt-4 ${theme.footerText}`}>
              Need help? Call{" "}
              <a href={`tel:${supportPhone}`} className="underline">
                {supportPhone}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* ━━━ PAYMENT MODAL (M-Pesa only) ━━━ */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}
          />
          {/* Modal */}
          <div className={`relative w-full sm:max-w-md mx-auto ${theme.cardClass} rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300`}>
            {/* Close button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${theme.planBg} ${theme.mutedText} hover:opacity-70`}
            >
              ✕
            </button>

            {/* Plan Summary */}
            <div className={`mb-5 pb-4 border-b ${theme.planBorder}`}>
              <h3 className={`text-lg font-bold mb-2 ${theme.planTitle}`}>{selectedPlan.name}</h3>
              <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${theme.mutedText}`}>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedPlan.duration_display}</span>
                {!portalConfig?.hide_plan_speed && (
                  <span className="flex items-center gap-1"><Zap className="w-4 h-4" />{selectedPlan.speed_display}</span>
                )}
                {selectedPlan.limitation_type !== "UNLIMITED" && selectedPlan.data_limit_value && (
                  <span className="flex items-center gap-1"><Database className="w-4 h-4" />{selectedPlan.data_limit_display}</span>
                )}
              </div>
              <div className={`text-2xl font-bold mt-2 ${theme.planPrice}`} style={brandingPriceStyle}>
                {selectedPlan.currency || "KES"} {selectedPlan.price}
              </div>
            </div>

            {/* Phone Number Input */}
            <PhoneInput
              phoneNumber={phoneNumber}
              phoneError={phoneError}
              onPhoneChange={handlePhoneChange}
              theme={theme}
            />

            {/* Inline Error */}
            {error && (
              <div className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${theme.errorBg}`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${theme.errorText}`} />
                <span className={`text-sm ${theme.errorText}`}>{error}</span>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handlePay}
              disabled={!phoneNumber || !!phoneError || (targetDevice === "tv" && !verifiedTV)}
              className={`w-full py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg rounded-xl ${theme.ctaBg} ${theme.ctaText} ${theme.ctaHover}`}
              style={brandingCtaStyle}
            >
              Pay {selectedPlan.currency || "KES"} {selectedPlan.price} with M-Pesa
            </button>

            <p className={`text-center text-xs mt-3 ${theme.footerText}`}>
              By connecting, you agree to the terms of service
            </p>
          </div>
        </div>
      )}

      {/* ━━━ AD VIDEO MODAL ━━━ */}
      {showAdModal && availableAd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
          {/* Full-screen unskippable player */}
          <div className="relative w-full h-full flex flex-col items-center justify-center">

            {/* Video */}
            {availableAd.media_type === 'VIDEO' ? (
              <video
                ref={videoRef}
                src={availableAd.media_url}
                preload="auto"
                className="w-full h-full object-contain max-h-[80vh]"
                autoPlay
                playsInline
                muted={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onLoadedMetadata={handleAdVideoLoaded}
                onTimeUpdate={handleAdVideoTimeUpdate}
                onEnded={handleAdComplete}
              />
            ) : (
              // Image ad with auto-complete after 5 seconds
              <div className="relative w-full max-w-lg">
                <img src={availableAd.media_url} alt={availableAd.name} className="w-full rounded-xl" />
                <AutoCompleteImage onComplete={handleAdComplete} />
              </div>
            )}

            {/* Countdown overlay — top-right */}
            {!adCompleted && (
              <div className="absolute top-4 right-4 bg-black/70 text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {adVideoCountdown > 0 ? `${adVideoCountdown}s` : 'Almost done...'}
              </div>
            )}

            {/* Granting overlay */}
            {adGranting && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-green-400" />
                <p className="text-white text-lg font-semibold">Unlocking your free access...</p>
              </div>
            )}

            {/* Error */}
            {adError && (
              <div className="absolute bottom-8 left-4 right-4 bg-red-900/90 border border-red-500 text-white rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{adError}</p>
                  <button onClick={handleAdComplete} className="text-xs underline mt-1">Try again</button>
                </div>
              </div>
            )}

            {/* Skip button only after video ends (before granting) */}
            {adCompleted && !adGranting && !adError && (
              <div className="absolute bottom-8 left-4 right-4 text-center">
                <p className="text-white text-sm opacity-70">Activating your free internet...</p>
              </div>
            )}

            {/* "No thanks" — only before video starts */}
            {adVideoCountdown === 0 && !adCompleted && (
              <button
                onClick={() => setShowAdModal(false)}
                className="absolute top-4 left-4 text-white/50 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕ No thanks
              </button>
            )}
          </div>
        </div>
      )}

      {/* ━━━ LOYALTY REDEEM MODAL ━━━ */}
      {showRedeemModal && loyaltyData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRedeemModal(false)}
          />
          <div className="relative w-full sm:max-w-md mx-auto bg-white rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <button
              onClick={() => setShowRedeemModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:opacity-70"
            >
              ✕
            </button>

            <div className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 mb-1">🎁 Loyalty Rewards</h3>
              <p className="text-sm text-gray-500">
                You have <span className="font-bold text-violet-600">{loyaltyData.current_points.toLocaleString()} points</span>
              </p>
            </div>

            {redeemError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {redeemError}
              </div>
            )}

            <div className="space-y-3">
              {(loyaltyData.all_hotspot_rewards.length > 0
                ? loyaltyData.all_hotspot_rewards
                : []
              ).map(reward => {
                const canAfford = loyaltyData.current_points >= reward.points_cost
                return (
                  <div
                    key={reward.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      canAfford
                        ? 'border-violet-200 bg-violet-50'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 text-xl">
                      🌐
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{reward.name}</p>
                      <p className="text-xs text-gray-500">
                        {reward.reward_minutes} min · {reward.reward_speed_mbps} Mbps
                        {reward.description ? ` · ${reward.description}` : ''}
                      </p>
                      <p className={`text-xs font-bold mt-0.5 ${canAfford ? 'text-violet-600' : 'text-gray-400'}`}>
                        {reward.points_cost.toLocaleString()} points
                        {!canAfford && ` (need ${(reward.points_cost - loyaltyData.current_points).toLocaleString()} more)`}
                      </p>
                    </div>
                    {canAfford && (
                      <button
                        disabled={redeemLoading}
                        onClick={async () => {
                          setRedeemLoading(true)
                          setRedeemError(null)
                          try {
                            const mac = getMacAddress()
                            const username = canonicalUsername || ''
                            const result = await redeemHotspotLoyaltyPoints({
                              canonical_username: username,
                              reward_id: reward.id,
                              router_id: routerId,
                              mac_address: mac,
                              tenant: getTenant(),
                            })
                            setShowRedeemModal(false)
                            setAccessCode(result.access_code)
                            setExpiresAt(result.expires_at)
                            setSelectedPlan({
                              id: 'loyalty-reward',
                              name: reward.name,
                              duration_display: `${reward.reward_minutes} minutes (reward)`,
                              speed_display: `${reward.reward_speed_mbps} Mbps`,
                              price: 0,
                              currency: 'KES',
                              validity_type: 'MINUTES',
                              validity_value: reward.reward_minutes,
                              download_speed: Number(reward.reward_speed_mbps),
                              upload_speed: Number(reward.reward_speed_mbps),
                              speed_unit: 'MBPS',
                              limitation_type: 'UNLIMITED',
                              data_limit_value: null,
                              data_limit_unit: 'MB',
                              data_limit_display: 'Unlimited',
                            })
                            setPaymentStatus('success')
                            // Update local points display
                            setLoyaltyData(prev => prev ? {
                              ...prev,
                              current_points: result.points_remaining,
                              available_rewards: prev.available_rewards.filter(
                                r => r.points_cost <= result.points_remaining
                              ),
                            } : null)
                            // Auto-login if we have a login URL
                            if (loginUrl && result.access_code) {
                              setReturningToRouter(true)
                              const u = encodeURIComponent(result.access_code)
                              setTimeout(() => {
                                window.location.href = `${loginUrl}?username=${u}&password=${u}`
                              }, 1500)
                            }
                          } catch (err: any) {
                            setRedeemError(err.message || 'Redemption failed. Try again.')
                          } finally {
                            setRedeemLoading(false)
                          }
                        }}
                        className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        {redeemLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : 'Redeem'}
                      </button>
                    )}
                  </div>
                )
              })}

              {loyaltyData.all_hotspot_rewards.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <p className="text-sm">No hotspot rewards configured yet.</p>
                  <p className="text-xs mt-1">Keep purchasing to earn points!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ━━━ PHONE RECONNECT / MULTI-DEVICE MODAL ━━━ */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPhoneModal(false)}
          />
          <div className={`relative w-full sm:max-w-md mx-auto ${theme.cardClass} rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300`}>
            <button
              onClick={() => setShowPhoneModal(false)}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${theme.planBg} ${theme.mutedText} hover:opacity-70`}
            >
              ✕
            </button>

            <h3 className={`text-lg font-bold mb-1 ${theme.planTitle}`}>
              Connect This Device
            </h3>
            <p className={`text-sm mb-5 ${theme.mutedText}`}>
              Enter the M-Pesa number used to pay. If your plan supports multiple devices,
              this device will be connected automatically.
            </p>

            <div className="mb-4">
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.mutedText}`} />
                <input
                  type="tel"
                  placeholder="07XX or 01XX"
                  value={reconnectPhone}
                  onChange={(e) => {
                    // Only digits, max 10
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setReconnectPhone(v)
                    setReconnectPhoneError(null)
                  }}
                  inputMode="numeric"
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} ${reconnectPhoneError ? '!border-red-400' : ''}`}
                />
              </div>
              {reconnectPhoneError && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {reconnectPhoneError}
                </p>
              )}
            </div>

            <button
              onClick={handlePhoneReconnect}
              disabled={reconnectPhone.length < 10 || reconnectPhoneLoading}
              className={`w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.ctaBg} ${theme.ctaText}`}
            >
              {reconnectPhoneLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Checking...
                </span>
              ) : 'Connect Device'}
            </button>

            <p className={`text-center text-xs mt-3 ${theme.footerText}`}>
              Only the number used to pay will work · Device limits apply
            </p>
          </div>
        </div>
      )}
    </div>
  )
}