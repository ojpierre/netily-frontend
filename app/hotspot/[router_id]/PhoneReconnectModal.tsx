"use client"

import { AlertCircle, Loader2, Phone } from "lucide-react"

interface PhoneReconnectModalProps {
  reconnectPhone: string
  reconnectPhoneError: string | null
  reconnectPhoneLoading: boolean
  theme: any
  onPhoneChange: (value: string) => void
  onReconnect: () => void
  onClose: () => void
}

export default function PhoneReconnectModal({
  reconnectPhone,
  reconnectPhoneError,
  reconnectPhoneLoading,
  theme,
  onPhoneChange,
  onReconnect,
  onClose,
}: PhoneReconnectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full sm:max-w-md mx-auto ${theme.cardClass} rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300`}>
        <button
          onClick={onClose}
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
                const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                onPhoneChange(v)
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
          onClick={onReconnect}
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
  )
}