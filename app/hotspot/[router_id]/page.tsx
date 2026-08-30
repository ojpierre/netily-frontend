"use client"

import { use, useEffect, useState, useMemo, useRef } from "react"
import { Wifi, Clock, Zap, Phone, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle, Megaphone, Database, ArrowDown, ArrowUp, Users, Ticket, Monitor, Smartphone } from "lucide-react"
import { getApiBaseUrl, getSubdomainInfo } from "@/lib/subdomain"
import dynamic from "next/dynamic"
import { getTheme, type ThemeStyles } from "./theme-engine"
import { fetchWithRetry } from "./fetchWithRetry"

// Lazy-load modals with ssr: false
const PaymentModal = dynamic(() => import("./PaymentModal"), { ssr: false })
const AdVideoModal = dynamic(() => import("./AdVideoModal"), { ssr: false })
const LoyaltyRedeemModal = dynamic(() => import("./LoyaltyRedeemModal"), { ssr: false })
const PhoneReconnectModal = dynamic(() => import("./PhoneReconnectModal"), { ssr: false })

// ==========================================
// TYPES - EXPORTED for use in modal components
// ==========================================

export interface HotspotPlan {
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
  // NEW FREE TRIAL FIELDS
  is_free_trial?: boolean
  trial_duration_minutes?: number
  // NEW TV PLAN FIELD
  is_tv_plan?: boolean
}

export interface PortalConfig {
  template_id: number
  hotspot_name: string
  support_phone: string
  announcement_text: string
  gateway_ip: string
  router_logo_url?: string | null
  hide_plan_speed?: boolean
  portal_font?: string
}

export interface BrandingConfig {
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

const PORTAL_FONT_FAMILIES: Record<string, string> = {
  outfit: 'var(--font-outfit), "Outfit", system-ui, sans-serif',
  montserrat: 'var(--font-montserrat), "Montserrat", system-ui, sans-serif',
  "space-grotesk": 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
  calibri: 'Calibri, "Segoe UI", Arial, system-ui, sans-serif',
  inter: 'var(--font-inter), "Inter", system-ui, sans-serif',
  roboto: 'var(--font-roboto), "Roboto", system-ui, sans-serif',
  lato: 'var(--font-lato), "Lato", system-ui, sans-serif',
  "open-sans": 'var(--font-open-sans), "Open Sans", system-ui, sans-serif',
  "source-sans-3": 'var(--font-source-sans-3), "Source Sans 3", system-ui, sans-serif',
  "ibm-plex-sans": 'var(--font-ibm-plex-sans), "IBM Plex Sans", system-ui, sans-serif',
  manrope: 'var(--font-manrope), "Manrope", system-ui, sans-serif',
  "dm-sans": 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  poppins: 'var(--font-poppins), "Poppins", system-ui, sans-serif',
  "plus-jakarta-sans": 'var(--font-plus-jakarta-sans), "Plus Jakarta Sans", system-ui, sans-serif',
  "work-sans": 'var(--font-work-sans), "Work Sans", system-ui, sans-serif',
  archivo: 'var(--font-archivo), "Archivo", system-ui, sans-serif',
}

function getPortalFontFamily(value?: string) {
  return PORTAL_FONT_FAMILIES[value || "outfit"] || PORTAL_FONT_FAMILIES.outfit
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

export interface HotspotAd {
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

export interface LoyaltyRewardItem {
  id: number
  name: string
  description: string
  points_cost: number
  reward_minutes: number
  reward_speed_mbps: string
}

export interface HotspotLoyaltyData {
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

/** Detect if we're likely inside Android/iOS's sandboxed captive-portal WebView. */
function isCaptivePortalContext(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent || ""
  const isKnownCaptiveUA = /CaptivePortalLogin|CaptiveNetworkSupport|Android.*wv\)/i.test(ua)
  const isPlainHttp = window.location.protocol === "http:"
  // Most captive WebViews still expose sessionStorage, so don't rely on that alone —
  // keep it as a weak secondary signal, not primary.
  return isKnownCaptiveUA || isPlainHttp
}

// ============================================================
// FIX 1: Tighten fetchCaptivePortal (worst case ~8.7s, not 17.8s)
// ============================================================
async function fetchCaptivePortal(routerId: string): Promise<CaptivePortalResponse> {
  const tenant = getTenant()
  const captive = isCaptivePortalContext()
  const response = await fetchWithRetry(
    `${getApiBase()}/hotspot/captive-portal/?router=${routerId}&tenant=${tenant}`,
    { cache: "no-store" },
    captive
      ? { timeoutMs: 2500, retries: 1, retryDelayMs: 200 }   // captive WebView: fail fast, don't hang
      : { timeoutMs: 4000, retries: 3, retryDelayMs: 300 }   // normal browser: keep current resilience
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
  const response = await fetchWithRetry(
    `${getApiBase()}/hotspot/purchase/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    },
    { timeoutMs: 5000, retries: 1, retryDelayMs: 300 }
  )
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
  const response = await fetchWithRetry(
    `${getApiBase()}/hotspot/purchase/${sessionId}/status/?${qp.toString()}`,
    { cache: "no-store" },
    { timeoutMs: 3500, retries: 1, retryDelayMs: 250 }
  )
  if (!response.ok) throw new Error("Failed to check payment status")
  return response.json()
}

// ============================================================
// FIX 1: Tighten checkAutoLogin (worst case reduced)
// ============================================================
async function checkAutoLogin(routerId: string, macAddress: string): Promise<AutoLoginResponse> {
  const tenant = getTenant()
  const captive = isCaptivePortalContext()
  const response = await fetchWithRetry(
    `${getApiBase()}/hotspot/auto-login/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ router_id: routerId, mac_address: macAddress, tenant }),
      cache: "no-store",
    },
    captive
      ? { timeoutMs: 2000, retries: 0, retryDelayMs: 0 }   // never let this hold up first paint
      : { timeoutMs: 3000, retries: 1, retryDelayMs: 300 }
  )
  if (!response.ok) throw new Error("Auto-login check failed")
  return response.json()
}

// ── NEW: verifyMikrotikAuth – checks if the router actually has a session ──
async function verifyMikrotikAuth(routerId: string, mac: string): Promise<boolean> {
  try {
    const result = await checkAutoLogin(routerId, mac)
    return !!result.has_session
  } catch {
    return false
  }
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
  const response = await fetchWithRetry(
    `${getApiBase()}/hotspot/voucher-redeem/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    },
    { timeoutMs: 5000, retries: 1, retryDelayMs: 300 }
  )
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Voucher redemption failed" }))
    throw new Error(error.message || error.error || "Voucher redemption failed")
  }
  return response.json()
}

// ==========================================
// FREE TRIAL API FUNCTION
// ==========================================
async function claimFreeTrial(data: {
  router_id: string
  plan_id: string
  mac_address: string
  tenant: string
}): Promise<{
  status: string
  access_code: string
  expires_at: string
  duration_display: string
  plan_name: string
  message: string
}> {
  const response = await fetchWithRetry(
    `${getApiBase()}/hotspot/free-trial/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    },
    { timeoutMs: 5000, retries: 1, retryDelayMs: 300 }
  )
  const json = await response.json()
  if (!response.ok) throw new Error(json.error || 'Failed to claim free trial')
  return json
}

// ==========================================
// Phone reconnect API
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
  const response = await fetchWithRetry(
    `${getApiBase()}/hotspot/phone-reconnect/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    },
    { timeoutMs: 5000, retries: 1, retryDelayMs: 300 }
  )
  const json = await response.json()
  if (!response.ok) throw new Error(json.error || 'Could not connect')
  return json
}

// === NEW MAC-based TV API FUNCTIONS ===
// scanNetworkDevices - calls backend to scan for devices on the network
// Updated to include mac_masked field
async function scanNetworkDevices(routerId: string, tenant: string): Promise<{ip: string; mac: string; mac_masked: string; label: string}[]> {
  try {
    const res = await fetchWithRetry(
      `${getApiBase()}/hotspot/scan-devices/?router_id=${encodeURIComponent(routerId)}&tenant=${encodeURIComponent(tenant)}`,
      { cache: 'no-store' },
      { timeoutMs: 4000, retries: 1, retryDelayMs: 300 }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.devices || []
  } catch {
    return []
  }
}

// === AD API FUNCTIONS ===
async function fetchServableAd(routerId: string, tenant: string): Promise<{ ad: HotspotAd | null }> {
  try {
    const res = await fetchWithRetry(
      `${getApiBase()}/hotspot/ads/serve/?router_id=${routerId}&tenant=${encodeURIComponent(tenant)}`,
      { cache: 'no-store' },
      { timeoutMs: 4000, retries: 1, retryDelayMs: 300 }
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
  const res = await fetchWithRetry(
    `${getApiBase()}/hotspot/ads/grant-access/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    },
    { timeoutMs: 5000, retries: 1, retryDelayMs: 300 }
  )
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
    const res = await fetchWithRetry(
      `${getApiBase()}/hotspot/loyalty-info/?${params.toString()}`,
      { cache: 'no-store' },
      { timeoutMs: 4000, retries: 1, retryDelayMs: 300 }
    )
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
  const res = await fetchWithRetry(
    `${getApiBase()}/hotspot/loyalty-redeem/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    },
    { timeoutMs: 5000, retries: 1, retryDelayMs: 300 }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Redemption failed')
  return json
}

/**
 * The ONLY way we hand credentials back to MikroTik.
 * POST form submit matches exactly what MikroTik's own hotspot login
 * page does — GET query-string redirects to link-login-only are
 * unreliable and can silently fail to authenticate (frontend shows
 * "connected" while the router never actually logs the user in).
 */
function submitRouterLogin(loginUrl: string, username: string, password: string) {
  if (!loginUrl) return false
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
  return true
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
// PHONE INPUT COMPONENT (DRY helper) - EXPORTED
// ==========================================

export function PhoneInput({
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

  // ============================================================
  // FIX 2: Progressive reassurance - never let spinner look stuck
  // ============================================================
  const [slowNetwork, setSlowNetwork] = useState(false)

  useEffect(() => {
    if (!loading) {
      setSlowNetwork(false)
      return
    }
    const t = setTimeout(() => setSlowNetwork(true), 2000)
    return () => clearTimeout(t)
  }, [loading])

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

  // FREE TRIAL STATE
  const [freeTrialClaiming, setFreeTrialClaiming] = useState(false)
  const [freeTrialError, setFreeTrialError] = useState<string | null>(null)
  const [freeTrialAlreadyClaimed, setFreeTrialAlreadyClaimed] = useState(false)

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

  // ── Logo error state (FIX #1) ─────────────────────────────────────────────
  const [logoError, setLogoError] = useState(false)

  // 🔥 FIX 2: preconnect on mount — place as the FIRST effect in the component
  useEffect(() => {
    const origin = window.location.origin
    const addHint = (rel: string) => {
      if (document.querySelector(`link[rel="${rel}"][href="${origin}"]`)) return
      const link = document.createElement("link")
      link.rel = rel
      link.href = origin
      document.head.appendChild(link)
    }
    addHint("dns-prefetch")
    addHint("preconnect")
  }, [])

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

  // === TV MODE STATES (MAC-based system - phone only) ===
  // MAC-based TV payment (no TV-side detection or polling needed)
  const [tvMacInput, setTvMacInput] = useState("")
  const [tvMacLastDigits, setTvMacLastDigits] = useState("")
  // Updated to include mac_masked field
  const [tvScannedDevices, setTvScannedDevices] = useState<{ip: string; mac: string; mac_masked: string; label: string}[]>([])
  const [tvScanLoading, setTvScanLoading] = useState(false)
  const [tvSelectedDevice, setTvSelectedDevice] = useState<{ip: string; mac: string; mac_masked: string; label: string} | null>(null)
  const [tvMacVerified, setTvMacVerified] = useState(false)
  const [tvMacError, setTvMacError] = useState<string | null>(null)
  const [tvPayMode, setTvPayMode] = useState<"scan" | "manual">("scan")

  // Phone paying for TV
  const [targetDevice, setTargetDevice] = useState<"this" | "tv">("this")

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
  const portalFontFamily = getPortalFontFamily(portalConfig?.portal_font)

  // Fix logo URL resolution - check both branding logo and portal_config router_logo_url as fallback
  const apiBaseUrl = getApiBase().replace('/api/v1', '')
  const logoUrl = (() => {
    const raw = branding?.logo_url || portalConfig?.router_logo_url || null
    if (!raw) return null
    return raw.startsWith('http') ? raw : `${apiBaseUrl}${raw}`
  })()

  // Reset logo error when logo URL changes
  useEffect(() => {
    setLogoError(false)
  }, [logoUrl])

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
    
    // 2. CHECK FOR ROUTER ERRORS (STOP THE LOOP) — FIX #2 applied
    const routerError = params.get("error")
    if (routerError) {
        console.error("Router reported error:", routerError)
        let decoded = routerError
        try {
            decoded = decodeURIComponent(routerError)
        } catch {
            // malformed percent-encoding from router firmware — keep raw string
        }
        setError(decoded)
        setLoading(false)
        return
    }

    const url = params.get("login_url")
    if (url) setLoginUrl(url)
  }, [routerId])

  // ── Auto-login check (no TV detection) ──
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get("error")) return

    const mac = getMacAddress()
    if (mac === "00:00:00:00:00:00" || autoLoginChecked) return
    
    checkAutoLogin(routerId, mac)
      .then((result) => {
        if (result.has_session && result.credentials) {
          setCanonicalUsername(result.credentials.username)
          if (loginUrl) {
            setReturningToRouter(true)
            submitRouterLogin(loginUrl, result.credentials.username, result.credentials.password)
          }
        }
        setAutoLoginChecked(true)
      })
      .catch(() => {
        setAutoLoginChecked(true)
        setLoading(false)
      })
  }, [routerId, loginUrl, autoLoginChecked])

  // 🔥 FIX 2: 🔥 OPTIMIZATION: Load hotspot plans + portal config with sessionStorage cache + timestamp TTL
  // Cache carries a timestamp; skip the network call entirely if it's under 20s old
  // (matches backend cache_version TTL window)
  // C. Stop the spinner the instant cached data exists, refresh silently after
  useEffect(() => {
    const cacheKey = `portal_cache:${routerId}`
    const cached = sessionStorage.getItem(cacheKey)
    let hasCachedData = false

    if (cached) {
      try {
        const data = JSON.parse(cached)
        setPlans(data.plans || [])
        setPortalConfig(data.portal_config || null)
        setBranding(data.branding || null)
        setLoading(false)              // ← spinner gone immediately, even if cache is stale
        hasCachedData = true

        if (Date.now() - (data._cachedAt || 0) < 20000) {
          return // fresh enough — skip the network round trip entirely
        }
      } catch {
        // Invalid cache, ignore
      }
    }

    // Stale-while-revalidate: refetch in the background, never re-show the spinner
    // once we already have something on screen.
    fetchCaptivePortal(routerId)
      .then((data) => {
        setPlans(data.plans)
        setPortalConfig(data.portal_config || null)
        setBranding(data.branding || null)
        if (!hasCachedData) setLoading(false)   // only needed on true cold start
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, _cachedAt: Date.now() }))
        } catch {
          // Storage full/unavailable in this WebView — ignore, network fetch still worked
        }
      })
      .catch((err) => {
        if (!hasCachedData) {
          setError(err.message || "Failed to load plans")
          setLoading(false)
        }
        // If we have cached data, silently keep showing it — don't surface a
        // background-refresh failure to a user who's already looking at plans.
      })
  }, [routerId])

  // 🔥 FIX 2: D. Defer ads/loyalty fetch out of the captive-context critical path
  useEffect(() => {
    const tenant = getTenant()
    if (!tenant) return

    const runSecondaryFetches = () => {
      fetchServableAd(routerId, tenant).then(({ ad }) => setAvailableAd(ad))

      const mac = getMacAddress()
      if (mac !== '00:00:00:00:00:00') {
        fetchHotspotLoyalty(mac, tenant, canonicalUsername || undefined).then(data => {
          if (data?.program_active) setLoyaltyData(data)
        })
      }
    }

    if (isCaptivePortalContext()) {
      // Inside the sandboxed WebView, let the plans fetch/render win the race
      // for bandwidth and JS thread time — defer non-critical calls slightly.
      const t = setTimeout(runSecondaryFetches, 600)
      return () => clearTimeout(t)
    }

    // Normal browser: no contention concerns, fire immediately as before.
    runSecondaryFetches()
  }, [routerId, canonicalUsername])

  // 🔥 FIX 3: Warm modal chunks in the background right after plans render
  // This eliminates cold-start chunk latency when user taps a plan
  useEffect(() => {
    if (loading) return
    const warm = () => {
      import("./PaymentModal")
      import("./AdVideoModal")
      import("./LoyaltyRedeemModal")
      import("./PhoneReconnectModal")
    }
    if ("requestIdleCallback" in window) {
      ;(window as any).requestIdleCallback(warm, { timeout: 2000 })
    } else {
      setTimeout(warm, 300)
    }
  }, [loading])

  // ── Poll payment status — ADAPTIVE POLLING (1.2s first 10 attempts, then 3s) ──
  useEffect(() => {
    if (paymentStatus !== "waiting" || !sessionId) return

    let attempt = 0
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      try {
        const result = await pollPurchaseStatus(sessionId, loginUrl, getTenant())
        
        if (result.status === "success") {
          setPaymentStatus("success")
          setAccessCode(result.access_code || null)
          setExpiresAt(result.expires_at || null)
          if (result.access_code) setCanonicalUsername(result.access_code)
          
          // RADIUS creds are already committed server-side by the time this response lands,
          // there is nothing left to wait for — submit immediately
          if (loginUrl && result.access_code && targetDevice !== "tv") {
            setReturningToRouter(true)
            submitRouterLogin(loginUrl, result.access_code, result.access_code)
          }
          return
        }

        if (result.status === "failed") {
          setPaymentStatus("failed")
          setError(result.message || "Payment failed")
          return
        }
      } catch {
        /* retry on next tick */
      }

      attempt++
      // Tight polling for the first ~15s (M-Pesa confirmations usually land
      // within a couple seconds of PIN entry), then back off to save requests.
      timer = setTimeout(tick, attempt < 10 ? 1200 : 3000)
    }

    timer = setTimeout(tick, 1200)
    return () => clearTimeout(timer)
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

  // Phone validation
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    setPhoneError(value && !isValidKenyanPhone(value) ? "Enter a valid Safaricom number" : null)
  }

  // ── TV MAC verification handlers ──
  const handleScanDevices = async () => {
    setTvScanLoading(true)
    setTvMacError(null)
    const devices = await scanNetworkDevices(routerId, getTenant())
    if (devices.length === 0) {
      setTvMacError("No devices found on this network. Try entering the MAC address manually.")
    }
    setTvScannedDevices(devices)
    setTvScanLoading(false)
  }

  const handleSelectScannedDevice = (device: {ip: string; mac: string; mac_masked: string; label: string}) => {
    setTvSelectedDevice(device)
    setTvMacLastDigits("")
    setTvMacVerified(false)
    setTvMacError(null)
  }

  const handleVerifyMacDigits = () => {
    if (!tvSelectedDevice && !tvMacInput) {
      setTvMacError("Please select or enter a device MAC address")
      return
    }
    const targetMac = tvSelectedDevice ? tvSelectedDevice.mac : tvMacInput
    const normalized = targetMac.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
    const lastFour = normalized.slice(-4)
    const inputNorm = tvMacLastDigits.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
    if (inputNorm.length < 2) {
      setTvMacError("Enter at least the last 2 digits of the MAC address")
      return
    }
    if (!lastFour.endsWith(inputNorm) && !lastFour.includes(inputNorm)) {
      setTvMacError("MAC digits don't match. Check your TV's Settings → About → MAC Address")
      return    }
    setTvMacVerified(true)
    setTvMacError(null)
  }

  // ── FREE TRIAL HANDLER ──
  const handleClaimFreeTrial = async (plan: HotspotPlan) => {
    setFreeTrialClaiming(true)
    setFreeTrialError(null)
    setFreeTrialAlreadyClaimed(false)
    
    let finalMac = getMacAddress()
    let finalRouter = routerId

    if (targetDevice === "tv" && tvMacVerified) {
      const rawMac = tvSelectedDevice ? tvSelectedDevice.mac : tvMacInput.trim()
      const stripped = rawMac.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
      if (stripped.length === 12) {
        finalMac = stripped.match(/.{2}/g)!.join(':')
      } else {
        finalMac = rawMac.toUpperCase()
      }
    }

    try {
      const result = await claimFreeTrial({
        router_id: finalRouter,
        plan_id: plan.id,
        mac_address: finalMac,
        tenant: getTenant(),
      })
      setAccessCode(result.access_code)
      setExpiresAt(result.expires_at)
      setSelectedPlan(plan)
      setPaymentStatus('success')
      
      // RADIUS creds are already committed server-side, submit immediately
      if (loginUrl && result.access_code && targetDevice !== "tv") {
        setReturningToRouter(true)
        submitRouterLogin(loginUrl, result.access_code, result.access_code)
      }
    } catch (err: any) {
      if (err.message?.includes('already used') || err.message?.includes('already claimed')) {
        setFreeTrialAlreadyClaimed(true)
      }
      setFreeTrialError(err.message || 'Could not claim free trial')
    } finally {
      setFreeTrialClaiming(false)
    }
  }

  // ── Select plan and open payment modal ──
  const selectPlanAndPay = (plan: HotspotPlan) => {
    // If it's a free trial plan, claim it directly without opening payment modal
    if (plan.is_free_trial) {
      handleClaimFreeTrial(plan)
      return
    }
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
    
    if (targetDevice === "tv" && !tvMacVerified) { setTvMacError("Please verify the TV device first"); return }

    setPaymentStatus("sending")
    setError(null)
    setCountdown(120)

    // IMPORTANT: Use the TV's MAC if verified, else use current device
    let finalMac = getMacAddress()
    let finalRouter = routerId

    if (targetDevice === "tv" && tvMacVerified) {
      const rawMac = tvSelectedDevice ? tvSelectedDevice.mac : tvMacInput.trim()
      // Normalize to AA:BB:CC:DD:EE:FF format
      const stripped = rawMac.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
      if (stripped.length === 12) {
        finalMac = stripped.match(/.{2}/g)!.join(':')
      } else {
        finalMac = rawMac.toUpperCase()
      }
    }

    try {
      const result = await initiatePurchase({
        router_id: finalRouter,
        plan_id: selectedPlan.id,
        phone_number: formatPhoneNumber(phoneNumber),
        mac_address: finalMac,
        tenant: getTenant(),
        tv_code: undefined
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
    
    if (targetDevice === "tv" && !tvMacVerified) { 
      setTvMacError("Please verify the TV device first"); 
      return 
    }

    setVoucherRedeeming(true)
    setVoucherError(null)
    setError(null)

    let finalMac = getMacAddress()
    let finalRouter = routerId

    if (targetDevice === "tv" && tvMacVerified) {
      const rawMac = tvSelectedDevice ? tvSelectedDevice.mac : tvMacInput.trim()
      const stripped = rawMac.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
      finalMac = stripped.length === 12 ? stripped.match(/.{2}/g)!.join(':') : rawMac.toUpperCase()
    }

    // If voucher redemption succeeds, we treat it as a successful "payment"
    setShowPaymentModal(false)

    try {
      const result = await redeemVoucher({
        code: voucherCode.trim(),
        router_id: finalRouter,
        mac_address: finalMac,
        tenant: getTenant(),
      })

      setAccessCode(result.access_code)
      setExpiresAt(result.expires_at)
      setPaymentStatus("success")

      // RADIUS creds are already committed server-side, submit immediately
      if (loginUrl && result.access_code && targetDevice !== "tv") {
        setReturningToRouter(true)
        submitRouterLogin(loginUrl, result.access_code, result.access_code)
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

      // ── Claude's fix: verify + retry ──────────────────────────
      if (loginUrl && result.credentials) {
        const { username, password } = result.credentials
        setReturningToRouter(true)
        // First attempt
        submitRouterLogin(loginUrl, username, password)

        // Give MikroTik a moment, then confirm it actually authenticated.
        // If not, resubmit once — handles the race where the first POST
        // lands before the router clears the stale binding for this MAC.
        setTimeout(async () => {
          const mac = getMacAddress()
          const confirmed = await verifyMikrotikAuth(routerId, mac)
          if (!confirmed) {
            submitRouterLogin(loginUrl, username, password)
          }
        }, 2500)
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
      // RADIUS creds are already committed server-side, submit immediately
      if (loginUrl && result.access_code) {
        setReturningToRouter(true)
        submitRouterLogin(loginUrl, result.access_code, result.access_code)
      }
    } catch (err: any) {
      setAdError(err.message || 'Could not grant access. Please try again.')
      setAdGranting(false)
      setAdCompleted(false)
    }
  }

  // ── Loyalty redeem handler ──
  const handleLoyaltyRedeem = async (reward: LoyaltyRewardItem) => {
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
      // RADIUS creds are already committed server-side, submit immediately
      if (loginUrl && result.access_code) {
        setReturningToRouter(true)
        submitRouterLogin(loginUrl, result.access_code, result.access_code)
      }
    } catch (err: any) {
      setRedeemError(err.message || 'Redemption failed. Try again.')
    } finally {
      setRedeemLoading(false)
    }
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
          {/* FIX 2: Progressive reassurance - show slow network message after 2s */}
          {slowNetwork && (
            <p className="text-gray-400 text-sm mt-2">
              Your connection looks slow — still trying, hang tight…
            </p>
          )}
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

              {/* NEW: STK cancel warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 text-left">
                  Do not cancel this M-Pesa prompt more than 3 times. Repeated cancellations
                  may permanently block you from making further purchases.
                </p>
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

  // Get free trial plans separately for display
  const freeTrialPlans = plans.filter(p => p.is_free_trial)
  const nonTrialPlans = plans.filter(p => !p.is_free_trial)

  // Split by device target: TV mode only shows TV-marked plans,
  // normal mode hides TV-only plans from the regular list.
  const paidPlans = targetDevice === 'tv'
    ? nonTrialPlans.filter(p => p.is_tv_plan)
    : nonTrialPlans.filter(p => !p.is_tv_plan)

  return (
    <div className={`${theme.pageBg} flex items-center justify-center p-4`} style={{ fontFamily: portalFontFamily }}>
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
          {/* FIX #1: Logo with error handling using state */}
          {logoUrl && !logoError ? (
            <div className={`flex ${theme.headerStyle === "left-aligned" ? "justify-start" : "justify-center"} mb-3`}>
              <img
                src={logoUrl}
                alt={displayName}
                className={`object-contain ${theme.headerStyle === "large-hero" ? "h-16 max-w-[180px]" : "h-12 max-w-[140px]"}`}
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
                  mixBlendMode: "luminosity" as const,
                }}
                onError={() => setLogoError(true)}
              />
            </div>
          ) : theme.showWifiIcon || logoError ? (
            <Wifi
              className={`${theme.headerStyle === "large-hero" ? "w-16 h-16" : "w-12 h-12"} ${
                theme.headerStyle === "left-aligned" ? "" : "mx-auto"
              } mb-3 ${theme.headerText}`}
            />
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

          {/* ── FREE TRIAL SECTION ── */}
          {freeTrialPlans.length > 0 && (
            <div className="mb-5">
              {freeTrialPlans.map(plan => (
                <div key={plan.id} className="relative overflow-hidden rounded-2xl border-2 border-dashed border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 p-5 mb-3">
                  {/* Shimmer badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                      FREE
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{plan.name}</h3>
                      <p className="text-sm text-green-700">{plan.duration_display} · No payment needed</p>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                  )}

                  {freeTrialAlreadyClaimed && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      This device has already used the free trial.
                    </div>
                  )}

                  {freeTrialError && !freeTrialAlreadyClaimed && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {freeTrialError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleClaimFreeTrial(plan)}
                    disabled={freeTrialClaiming || freeTrialAlreadyClaimed || (targetDevice === "tv" && !tvMacVerified)}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {freeTrialClaiming ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Activating...</>
                    ) : freeTrialAlreadyClaimed ? (
                      'Trial already used on this device'
                    ) : (
                      <><Zap className="w-5 h-5" /> Get Free {plan.duration_display}</>
                    )}
                  </button>
                </div>
              ))}
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

          {/* TV MAC VERIFICATION BLOCK */}
          {targetDevice === 'tv' && (
            <div className="mb-6 p-4 border rounded-xl bg-blue-50/50 border-blue-100">
              {!tvMacVerified ? (
                <>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => { setTvPayMode("scan"); setTvSelectedDevice(null); setTvMacVerified(false); setTvMacError(null) }}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tvPayMode === 'scan' ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-gray-600'}`}
                    >
                      Scan for TV
                    </button>
                    <button
                      onClick={() => { setTvPayMode("manual"); setTvSelectedDevice(null); setTvMacVerified(false); setTvMacError(null) }}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tvPayMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-gray-600'}`}
                    >
                      Enter MAC
                    </button>
                  </div>

                  {tvPayMode === 'scan' ? (
                    <div>
                      <button
                        onClick={handleScanDevices}
                        disabled={tvScanLoading}
                        className="w-full mb-3 py-2.5 text-sm font-medium bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {tvScanLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Scanning network...</>
                        ) : (
                          <><Monitor className="w-4 h-4" /> Scan for devices on this WiFi</>
                        )}
                      </button>
                      {tvScannedDevices.length > 0 && (
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                          {tvScannedDevices.map((d, i) => (
                            <button
                              key={i}
                              onClick={() => handleSelectScannedDevice(d)}
                              className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${tvSelectedDevice?.mac === d.mac ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                            >
                              <div className="font-medium text-gray-800">{d.label || `Device ${i+1}`}</div>
                              <div className="text-xs text-gray-400 font-mono">{d.ip} · {d.mac_masked || d.mac}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        TV MAC address (found in TV Settings → Network → MAC Address)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AA:BB:CC:DD:EE:FF"
                        value={tvMacInput}
                        onChange={(e) => { setTvMacInput(e.target.value); setTvMacError(null) }}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}

                  {(tvSelectedDevice || tvMacInput) && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 mb-1 font-medium">
                        Confirm: enter the 4 hidden characters shown as **** on your TV&apos;s Settings → Network
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Hidden chars"
                          value={tvMacLastDigits}
                          onChange={(e) => { setTvMacLastDigits(e.target.value.toUpperCase()); setTvMacError(null) }}
                          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg font-mono text-center uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={handleVerifyMacDigits}
                          disabled={tvMacLastDigits.length < 2}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                  {tvMacError && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {tvMacError}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  TV device verified — internet will connect to this device after payment
                </div>
              )}
            </div>
          )}

          <p className={`${theme.headerStyle === "left-aligned" ? "text-left" : "text-center"} mb-6 ${theme.bodyText}`}>
            {welcomeMessage || "Select a plan and pay with M-Pesa to get connected"}
          </p>

          {/* Plan Cards - Layout varies by theme */}
          {targetDevice === 'tv' && paidPlans.length === 0 ? (
            <div className={`mb-6 rounded-xl border-2 border-dashed p-6 text-center ${theme.planBorder} ${theme.planBg}`}>
              <Monitor className={`w-8 h-8 mx-auto mb-2 ${theme.mutedText}`} />
              <p className={`text-sm font-medium ${theme.planTitle}`}>No TV plans available</p>
              <p className={`text-xs mt-1 ${theme.mutedText}`}>
                Ask the ISP to add a TV plan, or switch to &quot;This Device&quot; to buy a regular plan.
              </p>
            </div>
          ) : (
          <div className={`mb-6 ${
            theme.layoutType === "grid" 
              ? "grid grid-cols-2 gap-3" 
              : theme.layoutType === "compact"
              ? "flex flex-wrap gap-2"
              : "space-y-3"
          }`}>
            {/* Featured layout: show popular plan first and larger */}
            {theme.layoutType === "featured" && paidPlans.some(p => p.is_popular) && (
              <div className="mb-3">
                {paidPlans.filter(p => p.is_popular).map((plan) => (
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
            {(theme.layoutType === "featured" ? paidPlans.filter(p => !p.is_popular) : paidPlans).map((plan) => (
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
          )}

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
        <PaymentModal
          selectedPlan={selectedPlan}
          phoneNumber={phoneNumber}
          phoneError={phoneError}
          error={error}
          theme={theme}
          branding={branding}
          portalConfig={portalConfig}
          targetDevice={targetDevice}
          tvMacVerified={tvMacVerified}
          onPhoneChange={handlePhoneChange}
          onPay={handlePay}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* ━━━ AD VIDEO MODAL ━━━ */}
      {showAdModal && availableAd && (
        <AdVideoModal
          availableAd={availableAd}
          adVideoCountdown={adVideoCountdown}
          adCompleted={adCompleted}
          adGranting={adGranting}
          adError={adError}
          videoRef={videoRef}
          onVideoLoaded={handleAdVideoLoaded}
          onVideoTimeUpdate={handleAdVideoTimeUpdate}
          onComplete={handleAdComplete}
          onClose={() => setShowAdModal(false)}
        />
      )}

      {/* ━━━ LOYALTY REDEEM MODAL ━━━ */}
      {showRedeemModal && loyaltyData && (
        <LoyaltyRedeemModal
          loyaltyData={loyaltyData}
          redeemLoading={redeemLoading}
          redeemError={redeemError}
          canonicalUsername={canonicalUsername}
          routerId={routerId}
          loginUrl={loginUrl}
          onRedeem={handleLoyaltyRedeem}
          onClose={() => setShowRedeemModal(false)}
        />
      )}

      {/* ━━━ PHONE RECONNECT / MULTI-DEVICE MODAL ━━━ */}
      {showPhoneModal && (
        <PhoneReconnectModal
          reconnectPhone={reconnectPhone}
          reconnectPhoneError={reconnectPhoneError}
          reconnectPhoneLoading={reconnectPhoneLoading}
          theme={theme}
          onPhoneChange={(value) => {
            setReconnectPhone(value)
            setReconnectPhoneError(null)
          }}
          onReconnect={handlePhoneReconnect}
          onClose={() => setShowPhoneModal(false)}
        />
      )}
    </div>
  )
}