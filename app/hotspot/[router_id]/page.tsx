"use client"

import { use, useEffect, useState, useMemo } from "react"
import { Wifi, Clock, Zap, Phone, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle, Megaphone, Database } from "lucide-react"
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

interface CaptivePortalResponse {
  status: string
  portal_config: PortalConfig
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

/** Lazily resolve the API base so we pick up the tenant subdomain from the browser URL */
function getApiBase(): string {
  if (typeof window !== "undefined") {
    return getApiBaseUrl()
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
}

async function fetchCaptivePortal(routerId: string): Promise<CaptivePortalResponse> {
  const tenant = getSubdomainInfo().subdomain || ""
  const response = await fetch(`${getApiBase()}/hotspot/captive-portal/?router=${routerId}&tenant=${tenant}`)
  if (!response.ok) throw new Error("Failed to load hotspot plans")
  return response.json()
}

async function initiatePurchase(data: {
  router_id: string
  plan_id: string
  phone_number: string
  mac_address: string
}): Promise<PurchaseResponse> {
  const response = await fetch(`${getApiBase()}/hotspot/purchase/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Payment initiation failed" }))
    throw new Error(error.message || error.error || "Payment initiation failed")
  }
  return response.json()
}

async function pollPurchaseStatus(sessionId: string, loginUrl?: string): Promise<PurchaseResponse> {
  const params = loginUrl ? `?login_url=${encodeURIComponent(loginUrl)}` : ""
  const response = await fetch(`${getApiBase()}/hotspot/purchase/${sessionId}/status/${params}`)
  if (!response.ok) throw new Error("Failed to check payment status")
  return response.json()
}

async function checkAutoLogin(routerId: string, macAddress: string): Promise<AutoLoginResponse> {
  const response = await fetch(`${getApiBase()}/hotspot/auto-login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ router_id: routerId, mac_address: macAddress }),
  })
  if (!response.ok) throw new Error("Auto-login check failed")
  return response.json()
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
}

function getTheme(id: number, primaryColor?: string): ThemeStyles {
  switch (id) {
    case 2: // Dark Mode
      return {
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
    case 3: // Gradient
      return {
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
    case 4: // Minimal
      return {
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
    case 5: // Vibrant
      return {
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
    case 6: // Corporate
      return {
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
    case 7: // Glass
      return {
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
    default: // Classic (1)
      return {
        pageBg: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100",
        cardClass: "bg-white rounded-2xl shadow-xl",
        headerBg: primaryColor ? "" : "bg-blue-600",
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
        ctaBg: primaryColor ? "" : "bg-blue-600 hover:bg-blue-700",
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
// MAIN COMPONENT
// ==========================================

export default function HotspotPage({ params }: { params: Promise<{ router_id: string }> }) {
  const { router_id: routerId } = use(params)

  // Data state
  const [plans, setPlans] = useState<HotspotPlan[]>([])
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null)
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

  // Theme derived from portal_config
  const templateId = portalConfig?.template_id ?? 1
  const theme = useMemo(() => getTheme(templateId), [templateId])
  const displayName = portalConfig?.hotspot_name || "WiFi Hotspot"
  const supportPhone = portalConfig?.support_phone || ""
  const announcement = portalConfig?.announcement_text || ""

  // ── MikroTik query-params on mount ──
  useEffect(() => {
    const url = getLoginUrl()
    if (url) setLoginUrl(url)
    if (isSmartTV()) {
      const mac = getMacAddress()
      window.location.href = `/hotspot/${routerId}/add-device?mac=${encodeURIComponent(mac)}&router_id=${routerId}`
    }
  }, [routerId])

  // ── Auto-login check ──
  useEffect(() => {
    const mac = getMacAddress()
    if (mac === "00:00:00:00:00:00" || autoLoginChecked) return
    checkAutoLogin(routerId, mac)
      .then((result) => {
        if (result.has_session && result.credentials && loginUrl) {
          setReturningToRouter(true)
          returnTripToMikrotik(loginUrl, result.credentials.username, result.credentials.password)
        }
        setAutoLoginChecked(true)
      })
      .catch(() => setAutoLoginChecked(true))
  }, [routerId, loginUrl, autoLoginChecked])

  // ── Load hotspot plans + portal config ──
  useEffect(() => {
    fetchCaptivePortal(routerId)
      .then((data) => {
        setPlans(data.plans)
        setPortalConfig(data.portal_config || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to load plans")
        setLoading(false)
      })
  }, [routerId])

  // ── Poll payment status ──
  useEffect(() => {
    if (paymentStatus !== "waiting" || !sessionId) return
    const pollInterval = setInterval(async () => {
      try {
        const result = await pollPurchaseStatus(sessionId, loginUrl)
        if (result.status === "success") {
          setPaymentStatus("success")
          setAccessCode(result.access_code || null)
          setExpiresAt(result.expires_at || null)
          clearInterval(pollInterval)
          if (loginUrl && result.access_code) {
            setReturningToRouter(true)
            setTimeout(() => returnTripToMikrotik(loginUrl, result.access_code!, result.access_code!), 2000)
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

  // Phone validation
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    setPhoneError(value && !isValidKenyanPhone(value) ? "Enter a valid Safaricom or Airtel number" : null)
  }

  // ── Initiate payment ──
  const handlePay = async () => {
    if (!selectedPlan) return
    if (!phoneNumber) {
      setPhoneError("Phone number is required")
      return
    }
    if (!isValidKenyanPhone(phoneNumber)) {
      setPhoneError("Enter a valid Safaricom or Airtel number")
      return
    }

    setPaymentStatus("sending")
    setError(null)
    setCountdown(120)

    try {
      const result = await initiatePurchase({
        router_id: routerId,
        plan_id: selectedPlan.id,
        phone_number: formatPhoneNumber(phoneNumber),
        mac_address: getMacAddress(),
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
  const headerStyle = templateId === 1 && primaryColor ? { backgroundColor: primaryColor } : undefined
  const ctaStyle = templateId === 1 && primaryColor ? { backgroundColor: primaryColor } : undefined

  return (
    <div className={`${theme.pageBg} flex items-center justify-center p-4`}>
      <div className={`${theme.cardClass} max-w-md w-full overflow-hidden`}>
        {/* ── Header ── */}
        <div className={`p-6 text-center ${theme.headerBg}`} style={headerStyle}>
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={displayName}
              className="w-16 h-16 mx-auto mb-3 rounded-full object-cover"
            />
          ) : (
            <Wifi className={`w-12 h-12 mx-auto mb-3 ${theme.headerText}`} />
          )}
          <h1 className={`text-2xl font-bold ${theme.headerText}`}>{displayName}</h1>
          {router?.location && (
            <p className={`text-sm mt-1 ${theme.headerSub}`}>{router.location}</p>
          )}
          {supportPhone && (
            <p className={`text-xs mt-2 flex items-center justify-center gap-1 ${theme.headerSub}`}>
              <Phone className="w-3 h-3" />
              {supportPhone}
            </p>
          )}
          {branding?.company_name && (
            <p className={`text-xs mt-1 opacity-60 ${theme.headerSub}`}>
              Powered by {branding.company_name}
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

          <p className={`text-center mb-6 ${theme.bodyText}`}>
            Select a plan and pay with M-Pesa to get connected
          </p>

          {/* Phone Number Input */}
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
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} ${
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

          {/* Plan Cards */}
          <div className="space-y-3 mb-6">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                  selectedPlan?.id === plan.id
                    ? `${theme.planSelectedBorder} ${theme.planSelectedBg} shadow-md`
                    : `${theme.planBorder} ${theme.planBg} hover:shadow-sm`
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${theme.planTitle}`}>{plan.name}</span>
                      {plan.is_popular && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.planPopularBg} ${theme.planPopularText}`}
                        >
                          POPULAR
                        </span>
                      )}
                      {selectedPlan?.id === plan.id && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div className={`flex items-center gap-3 mt-1 text-sm ${theme.planSub}`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {plan.duration_display}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {plan.speed_display}
                      </span>
                    </div>
                    {plan.limitation_type !== "UNLIMITED" && plan.data_limit_value && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${theme.planSub}`}>
                        <Database className="w-3 h-3" />
                        {plan.data_limit_display}
                      </p>
                    )}
                    {plan.description && (
                      <p className={`text-xs mt-1 ${theme.planSub}`}>{plan.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <span className={`text-xl font-bold ${theme.planPrice}`}>
                      {plan.currency || "KES"} {plan.price}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

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
            disabled={!selectedPlan || !phoneNumber || !!phoneError}
            className={`w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${theme.ctaBg} ${theme.ctaText} ${theme.ctaHover}`}
            style={ctaStyle}
          >
            {selectedPlan
              ? `Pay ${selectedPlan.currency || "KES"} ${selectedPlan.price} with M-Pesa`
              : "Select a Plan to Continue"}
          </button>

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
