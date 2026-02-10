"use client"

import { useEffect, useState } from "react"
import { Wifi, Clock, Zap, Phone, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react"

// ==========================================
// TYPES
// ==========================================

interface HotspotPlan {
  id: number
  name: string
  price: number
  duration_minutes: number
  data_limit_mb: number | null
  speed_limit: string
  description?: string
}

interface RouterInfo {
  id: number
  name: string
  location?: string
}

interface Branding {
  logo_url?: string
  primary_color?: string
  company_name?: string
}

interface HotspotPlansResponse {
  router: RouterInfo
  plans: HotspotPlan[]
  branding?: Branding
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
// API FUNCTIONS (Calls public endpoints - no auth required)
// ==========================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

async function fetchHotspotPlans(routerId: string): Promise<HotspotPlansResponse> {
  const response = await fetch(`${API_BASE}/hotspot/routers/${routerId}/plans/`)
  
  if (!response.ok) {
    throw new Error("Failed to load hotspot plans")
  }
  
  return response.json()
}

async function initiatePurchase(data: {
  router_id: string
  plan_id: number
  phone_number: string
  mac_address: string
}): Promise<PurchaseResponse> {
  const response = await fetch(`${API_BASE}/hotspot/purchase/`, {
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
  const response = await fetch(`${API_BASE}/hotspot/purchase/${sessionId}/status/${params}`)
  
  if (!response.ok) {
    throw new Error("Failed to check payment status")
  }
  
  return response.json()
}

async function checkAutoLogin(routerId: string, macAddress: string): Promise<AutoLoginResponse> {
  const response = await fetch(`${API_BASE}/hotspot/auto-login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ router_id: routerId, mac_address: macAddress }),
  })
  if (!response.ok) throw new Error("Auto-login check failed")
  return response.json()
}

/**
 * "Return Trip" — submits RADIUS credentials back to MikroTik's login URL.
 * This completes the Cloud Controller authentication loop:
 *   MikroTik → Cloud Portal → Payment → RADIUS created → Return Trip → Internet
 */
function returnTripToMikrotik(loginUrl: string, username: string, password: string) {
  // Create a hidden form that POSTs credentials to the MikroTik login URL
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
  addField("dst", "")  // MikroTik will use original destination
  addField("popup", "true")

  document.body.appendChild(form)
  form.submit()
}

// ==========================================
// HELPER FUNCTIONS
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
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1)
  } else if (cleaned.startsWith("+254")) {
    cleaned = cleaned.slice(1)
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned
  }
  return cleaned
}

function isValidKenyanPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  return /^254[17]\d{8}$/.test(formatted)
}

function getMacAddress(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    const mac = params.get("mac")
    if (mac) return mac
  }
  return "00:00:00:00:00:00"
}

/** Get the MikroTik login URL from query params (for Return Trip) */
function getLoginUrl(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    return params.get("login_url") || ""
  }
  return ""
}

/** Check if the connecting device is a Smart TV */
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
// MAIN COMPONENT
// ==========================================

export default function HotspotPage({ params }: { params: { router_id: string } }) {
  const routerId = params.router_id

  // Data state
  const [router, setRouter] = useState<RouterInfo | null>(null)
  const [plans, setPlans] = useState<HotspotPlan[]>([])
  const [branding, setBranding] = useState<Branding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection & payment state
  const [selectedPlan, setSelectedPlan] = useState<HotspotPlan | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(120)
  const [accessCode, setAccessCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  
  // Cloud Controller state
  const [loginUrl, setLoginUrl] = useState<string>("")
  const [autoLoginChecked, setAutoLoginChecked] = useState(false)
  const [returningToRouter, setReturningToRouter] = useState(false)

  // Capture MikroTik query params on mount
  useEffect(() => {
    const mikrotikLoginUrl = getLoginUrl()
    if (mikrotikLoginUrl) setLoginUrl(mikrotikLoginUrl)

    // Redirect Smart TVs to the device-auth page
    if (isSmartTV()) {
      const mac = getMacAddress()
      window.location.href = `/hotspot/${routerId}/add-device?mac=${encodeURIComponent(mac)}&router_id=${routerId}`
      return
    }
  }, [routerId])

  // Auto-login check: if MAC has an active session, skip payment
  useEffect(() => {
    const mac = getMacAddress()
    if (mac === "00:00:00:00:00:00" || autoLoginChecked) return

    checkAutoLogin(routerId, mac)
      .then((result) => {
        if (result.has_session && result.credentials && loginUrl) {
          // User already has an active session — Return Trip immediately
          setReturningToRouter(true)
          returnTripToMikrotik(loginUrl, result.credentials.username, result.credentials.password)
        }
        setAutoLoginChecked(true)
      })
      .catch(() => setAutoLoginChecked(true))
  }, [routerId, loginUrl, autoLoginChecked])

  // Load hotspot plans
  useEffect(() => {
    fetchHotspotPlans(routerId)
      .then((data) => {
        setRouter(data.router)
        setPlans(data.plans)
        setBranding(data.branding || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to load plans")
        setLoading(false)
      })
  }, [routerId])

  // Poll for payment status
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
          
          // ── RETURN TRIP: Auto-submit credentials back to MikroTik ──
          if (loginUrl && result.access_code) {
            setReturningToRouter(true)
            setTimeout(() => {
              returnTripToMikrotik(loginUrl, result.access_code!, result.access_code!)
            }, 2000) // Show success briefly, then redirect
          }
        } else if (result.status === "failed") {
          setPaymentStatus("failed")
          setError(result.message || "Payment failed")
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [paymentStatus, sessionId])

  // Countdown timer
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

  // Validate phone on change
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    if (value && !isValidKenyanPhone(value)) {
      setPhoneError("Enter a valid Safaricom or Airtel number")
    } else {
      setPhoneError(null)
    }
  }

  // Handle payment initiation
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
    } catch (err: any) {
      setPaymentStatus("failed")
      setError(err.message || "Failed to initiate payment")
    }
  }

  // Retry payment
  const handleRetry = () => {
    setPaymentStatus("idle")
    setError(null)
    setSessionId(null)
    setCountdown(120)
  }

  // Get primary color from branding
  const primaryColor = branding?.primary_color || "#3B82F6"

  // ==========================================
  // RENDER: Loading State
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
  // RENDER: Error State (No Plans)
  // ==========================================
  if (error && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Success State
  // ==========================================
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Connected!</h1>
          <p className="text-gray-600 mb-6">Payment successful. Enjoy your internet access.</p>
          
          {returningToRouter && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 inline mr-2" />
              <span className="text-sm text-blue-700">Connecting you to the internet...</span>
            </div>
          )}
          
          {accessCode && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Your Access Code</p>
              <p className="text-3xl font-mono font-bold text-gray-900">{accessCode}</p>
            </div>
          )}
          
          <div className="space-y-2 text-left bg-blue-50 rounded-xl p-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan</span>
              <span className="font-semibold">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-semibold">{selectedPlan ? formatDuration(selectedPlan.duration_minutes) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Speed</span>
              <span className="font-semibold">{selectedPlan?.speed_limit}</span>
            </div>
            {expiresAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires</span>
                <span className="font-semibold">{new Date(expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Payment Processing / Waiting
  // ==========================================
  if (paymentStatus === "sending" || paymentStatus === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {paymentStatus === "sending" ? (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sending STK Push...</h2>
              <p className="text-gray-600">Please wait while we send the payment request to your phone.</p>
            </>
          ) : (
            <>
              <Phone className="w-16 h-16 text-green-600 mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Phone</h2>
              <p className="text-gray-600 mb-4">
                Enter your M-Pesa PIN on your phone to complete the payment.
              </p>
              
              <div className="bg-amber-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <p className="text-sm text-amber-600 mt-1">Time remaining to complete payment</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
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
  // RENDER: Failed / Timeout State
  // ==========================================
  if (paymentStatus === "failed" || paymentStatus === "timeout") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {paymentStatus === "timeout" ? "Payment Timed Out" : "Payment Failed"}
          </h1>
          <p className="text-gray-600 mb-6">
            {paymentStatus === "timeout" 
              ? "The payment request expired. Please try again."
              : error || "Something went wrong. Please try again."}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: Main Plan Selection Screen
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 text-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Wifi className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">{router?.name || "WiFi Hotspot"}</h1>
          {router?.location && (
            <p className="text-white/80 text-sm mt-1">{router.location}</p>
          )}
          {branding?.company_name && (
            <p className="text-white/60 text-xs mt-2">Powered by {branding.company_name}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6">
            Select a plan and pay with M-Pesa to get connected
          </p>

          {/* Phone Number Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="0712 345 678"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  phoneError 
                    ? "border-red-300 focus:ring-red-500" 
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
            </div>
            {phoneError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {phoneError}
              </p>
            )}
          </div>

          {/* Plans Grid */}
          <div className="space-y-3 mb-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{plan.name}</span>
                      {selectedPlan?.id === plan.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(plan.duration_minutes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {plan.speed_limit}
                      </span>
                    </div>
                    {plan.data_limit_mb && (
                      <p className="text-xs text-gray-400 mt-1">
                        Data: {formatData(plan.data_limit_mb)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">
                      KES {plan.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={!selectedPlan || !phoneNumber || !!phoneError}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            {selectedPlan 
              ? `Pay KES ${selectedPlan.price} with M-Pesa`
              : "Select a Plan to Continue"
            }
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            By connecting, you agree to the terms of service
          </p>
        </div>
      </div>
    </div>
  )
}
