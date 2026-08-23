"use client"

import { AlertCircle, Clock, Database, Phone, Zap } from "lucide-react"
import type { HotspotPlan, PortalConfig } from "./HotspotPortalClient"  // ← changed from "./page"

// Local PhoneInput (or you can import from HotspotPortalClient if you prefer)
function PhoneInputLocal({
  phoneNumber,
  phoneError,
  onPhoneChange,
  theme,
}: {
  phoneNumber: string
  phoneError: string | null
  onPhoneChange: (v: string) => void
  theme: any
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

interface PaymentModalProps {
  selectedPlan: HotspotPlan | null
  phoneNumber: string
  phoneError: string | null
  error: string | null
  theme: any
  branding: any
  portalConfig: PortalConfig | null
  targetDevice: "this" | "tv"
  tvMacVerified: boolean
  onPhoneChange: (value: string) => void
  onPay: () => void
  onClose: () => void
}

export default function PaymentModal({
  selectedPlan,
  phoneNumber,
  phoneError,
  error,
  theme,
  branding,
  portalConfig,
  targetDevice,
  tvMacVerified,
  onPhoneChange,
  onPay,
  onClose,
}: PaymentModalProps) {
  if (!selectedPlan) return null

  const brandingPriceStyle = branding?.primary_color
    ? { color: branding.primary_color }
    : undefined

  const brandingCtaStyle = branding?.primary_color
    ? { backgroundColor: branding.primary_color, borderColor: branding.primary_color }
    : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`relative w-full sm:max-w-md mx-auto ${theme.cardClass} rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300`}>
        {/* Close button */}
        <button
          onClick={onClose}
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
        <PhoneInputLocal
          phoneNumber={phoneNumber}
          phoneError={phoneError}
          onPhoneChange={onPhoneChange}
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
          onClick={onPay}
          disabled={!phoneNumber || !!phoneError || (targetDevice === "tv" && !tvMacVerified)}
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
  )
}