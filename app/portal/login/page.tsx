"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { Wifi, Clock, Zap, Phone, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react"
import { getApiBaseUrl, getSubdomainInfo } from "@/lib/subdomain"

// ==========================================
// TYPES
// ==========================================

interface HotspotPlan {
  id: string
  name: string
  price: number
  download_speed: string
  download_unit: string
  validity: string
  validity_unit: string
  description?: string
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
// API FUNCTIONS
// ==========================================

function getApiBase(): string {
  // Hardcoded for precise local testing
  return "http://192.168.100.149:8000/api/v1"
  // Fallback to normal methods if hardcoded fails
  // if (typeof window !== "undefined") return getApiBaseUrl()
  // return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
}

async function fetchCaptivePortal(routerId: string, tenant: string): Promise<CaptivePortalResponse> {
  const response = await fetch(`${getApiBase()}/hotspot/captive-portal/?router=${routerId}&tenant=${tenant}`)
  if (!response.ok) {
    // FIX: Read the exact error from Django!
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to load plans");
  }
  return response.json()
}

async function initiatePurchase(data: {
  router_id: string
  plan_id: string | number
  phone_number: string
  mac_address: string
  tenant: string
}): Promise<PurchaseResponse> {
  const response = await fetch(`${getApiBase()}/hotspot/purchase/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Payment failed" }))
    throw new Error(error.message || error.error || "Payment failed")
  }
  return response.json()
}

async function pollPurchaseStatus(sessionId: string, loginUrl: string, tenant: string): Promise<PurchaseResponse> {
  const params = new URLSearchParams()
  if (loginUrl) params.append("login_url", loginUrl)
  if (tenant) params.append("tenant", tenant)
  
  const response = await fetch(`${getApiBase()}/hotspot/purchase/${sessionId}/status/?${params.toString()}`)
  if (!response.ok) throw new Error("Status check failed")
  return response.json()
}

async function checkAutoLogin(routerId: string, macAddress: string, tenant: string): Promise<AutoLoginResponse> {
  const response = await fetch(`${getApiBase()}/hotspot/auto-login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ router_id: routerId, mac_address: macAddress, tenant: tenant }),
  })
  if (!response.ok) {
    // FIX: Read the exact error from Django!
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Auto-login check failed");
  }
  return response.json()
}

// ==========================================
// HELPERS
// ==========================================

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
// PORTAL LOGIN PAGE COMPONENT
// ==========================================

function PortalLoginContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // ── MikroTik variables from URL ──
  const mac = searchParams.get("mac") || "00:00:00:00:00:00"
  const ip = searchParams.get("ip") || ""
  const routerName = searchParams.get("router") || "WiFi"
  const loginUrl = searchParams.get("login_url") || ""
  const error = searchParams.get("error") || ""
  const tenant = searchParams.get("tenant") || "yellow1"

  // THE ULTIMATE FIX:
  // 1. First try to get router_id from query params
  // 2. If not found, try to extract from the URL path (for /hotspot/{router_id} routes)
  // 3. Finally fallback to the router name from query params
  // The Django backend will dynamically look up the router by ID or name!
  let routerId = searchParams.get("router_id") || ""
  
  if (!routerId && pathname) {
    // Try to extract from pathname (e.g., /hotspot/TEST_ROUTER_1)
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length > 0) {
      // Get the last part of the path which should be the router_id
      routerId = parts[parts.length - 1]
    }
  }
  
  // If still no routerId, fallback to the router name from query params
  if (!routerId) {
    routerId = searchParams.get("router") || ""
  }

  // ── State ──
  const [plans, setPlans] = useState<HotspotPlan[]>([])
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<HotspotPlan | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [paymentMessage, setPaymentMessage] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [autoLoginChecked, setAutoLoginChecked] = useState(false)

  // ── Load plans ──
  useEffect(() => {
    if (!routerId) {
      setLoadError("Missing router information. Please reconnect to WiFi.")
      setLoading(false)
      return
    }
    loadPlans()
  }, [routerId]) 

  const loadPlans = async () => {
    try {
      setLoading(true)
      const currentTenant = tenant || getSubdomainInfo().subdomain || "yellow1"

      if (mac !== "00:00:00:00:00:00") {
        try {
          const autoLogin = await checkAutoLogin(routerId, mac, currentTenant)
          if (autoLogin.has_session && autoLogin.credentials && loginUrl) {
            setAutoLoginChecked(true)
            returnTripToMikrotik(loginUrl, autoLogin.credentials.username, autoLogin.credentials.password)
            return
          }
        } catch (err: unknown) {
          // If auto-login fails, show the error but continue to load plans
          console.error("Auto-login error:", err)
          // Don't set loadError here - just log it and continue
        }
      }

      const data = await fetchCaptivePortal(routerId, currentTenant)
      setPlans(data.plans)
      setPortalConfig(data.portal_config || null)
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  // ── Handle purchase ──
  const handlePurchase = async () => {
    if (!selectedPlan || !isValidKenyanPhone(phoneNumber)) return

    try {
      setPaymentStatus("sending")
      setPaymentMessage("Sending M-Pesa request...")
      const currentTenant = tenant || getSubdomainInfo().subdomain || "yellow1"

      const response = await initiatePurchase({
        router_id: routerId,
        plan_id: selectedPlan.id,
        phone_number: formatPhoneNumber(phoneNumber),
        mac_address: mac,
        tenant: currentTenant,
      })

      setSessionId(response.session_id)
      setPaymentStatus("waiting")
      setPaymentMessage("Check your phone for M-Pesa prompt...")

      pollForPayment(response.session_id, currentTenant)
    } catch (err: unknown) {
      setPaymentStatus("failed")
      setPaymentMessage(err instanceof Error ? err.message : "Payment failed")
    }
  }

  // ── Poll for payment completion ──
  const pollForPayment = useCallback(async (sid: string, currentTenant: string) => {
    const maxAttempts = 60
    const interval = 3000
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus("timeout")
        setPaymentMessage("Payment timed out. If you paid, it will activate shortly.")
        return
      }

      try {
        const status = await pollPurchaseStatus(sid, loginUrl, currentTenant)

        if (status.status === "success") {
          setPaymentStatus("success")
          setPaymentMessage("Payment received! Connecting you to the internet...")

          if (loginUrl && status.access_code) {
            setTimeout(() => {
              returnTripToMikrotik(loginUrl, status.access_code!, status.access_code!)
            }, 2000)
          }
          return
        }

        if (status.status === "failed") {
          setPaymentStatus("failed")
          setPaymentMessage(status.message || "Payment failed. Please try again.")
          return
        }

        attempts++
        setTimeout(poll, interval)
      } catch {
        attempts++
        setTimeout(poll, interval)
      }
    }
    poll()
  }, [loginUrl])

  const primaryColor = portalConfig?.support_phone ? "#667eea" : "#667eea"
  const companyName = portalConfig?.hotspot_name || routerName

  if (autoLoginChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Welcome Back!</h2>
          <p className="text-gray-500 mt-2">You have an active session. Reconnecting...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Loading...</h2>
          <p className="text-gray-500 mt-2">Fetching available plans</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Connection Error</h2>
          <p className="text-gray-500 mt-2 break-words">{loadError}</p>
          <button
            onClick={() => { setLoadError(""); loadPlans() }}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  if (paymentStatus !== "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          {paymentStatus === "sending" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800">Initiating Payment</h2>
            </>
          )}
          {paymentStatus === "waiting" && (
            <>
              <Phone className="w-12 h-12 text-green-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-gray-800">Check Your Phone</h2>
            </>
          )}
          {paymentStatus === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-600">Payment Successful!</h2>
            </>
          )}
          {paymentStatus === "failed" && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-600">Payment Failed</h2>
            </>
          )}
          {paymentStatus === "timeout" && (
            <>
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-yellow-600">Timed Out</h2>
            </>
          )}
          <p className="text-gray-500 mt-2">{paymentMessage}</p>
          {(paymentStatus === "failed" || paymentStatus === "timeout") && (
            <button
              onClick={() => { setPaymentStatus("idle"); setPaymentMessage("") }}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700">
      <div className="text-center pt-8 pb-4 px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wifi className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold text-white">{companyName}</h1>
        </div>
        <p className="text-purple-200 text-sm">
          Connect to {routerName} WiFi
        </p>
        {error && (
          <div className="mt-2 bg-red-500/20 text-red-100 text-xs px-3 py-1 rounded-full inline-block">
            {decodeURIComponent(error)}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="max-w-md mx-auto space-y-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedPlan?.id === plan.id
                  ? "border-white bg-white/20 shadow-lg scale-[1.02]"
                  : "border-white/20 bg-white/10 hover:bg-white/15"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">{plan.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-purple-200 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {plan.validity} {plan.validity_unit}
                    </span>
                    <span className="text-purple-200 text-xs flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {plan.download_speed} {plan.download_unit}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold text-xl">
                    KSh {plan.price}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <div className="px-4 pb-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="font-semibold text-gray-800 mb-1">
              {selectedPlan.name} — KSh {selectedPlan.price}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {selectedPlan.validity} {selectedPlan.validity_unit} • {selectedPlan.download_speed} {selectedPlan.download_unit}
            </p>

            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">M-Pesa Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-800"
                  maxLength={13}
                />
              </div>
              {phoneNumber && !isValidKenyanPhone(phoneNumber) && (
                <p className="text-red-500 text-xs mt-1">Enter a valid Safaricom or Airtel number</p>
              )}
            </div>

            <button
              onClick={handlePurchase}
              disabled={!isValidKenyanPhone(phoneNumber)}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              Pay KSh {selectedPlan.price} via M-Pesa
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Powered by Netily • Secure M-Pesa Payment
            </p>
          </div>
        </div>
      )}

      <div className="text-center pb-6 px-4">
        <p className="text-purple-300 text-xs">
          MAC: {mac} • IP: {ip}
        </p>
      </div>
    </div>
  )
}

export default function PortalLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-white" />
        </div>
      }
    >
      <PortalLoginContent />
    </Suspense>
  )
}