"use client"

import { useState } from "react"
import { AlertCircle, KeyRound, Loader2, Phone } from "lucide-react"

interface PhoneReconnectModalProps {
  reconnectPhone: string
  reconnectPhoneError: string | null
  reconnectPhoneLoading: boolean
  theme: any
  onPhoneChange: (value: string) => void
  onReconnect: () => void
  onCredentialReconnect: (username: string, password: string) => void
  onClearError: () => void
  onClose: () => void
}

type Mode = "phone" | "credentials"

export default function PhoneReconnectModal({
  reconnectPhone,
  reconnectPhoneError,
  reconnectPhoneLoading,
  theme,
  onPhoneChange,
  onReconnect,
  onCredentialReconnect,
  onClearError,
  onClose,
}: PhoneReconnectModalProps) {
  const [mode, setMode] = useState<Mode>("phone")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const switchMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    onClearError()
  }

  const inputClass = `w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} ${reconnectPhoneError ? "!border-red-400" : ""}`

  const canSubmit =
    mode === "phone"
      ? reconnectPhone.length >= 10
      : username.trim().length >= 4 && password.trim().length > 0

  const submit = () => {
    if (!canSubmit || reconnectPhoneLoading) return
    if (mode === "phone") onReconnect()
    else onCredentialReconnect(username, password)
  }

  const tabClass = (active: boolean) =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
      active ? `${theme.ctaBg} ${theme.ctaText}` : `${theme.planBg} ${theme.mutedText}`
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-md mx-auto ${theme.cardClass} rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${theme.planBg} ${theme.mutedText} hover:opacity-70`}
        >
          ✕
        </button>

        <h3 className={`text-lg font-bold mb-1 ${theme.planTitle}`}>Connect This Device</h3>
        <p className={`text-sm mb-4 ${theme.mutedText}`}>
          {mode === "phone"
            ? "Enter the M-Pesa number used to pay. If your plan supports multiple devices, this device will be connected automatically."
            : "Enter the username and password sent to you by SMS after payment."}
        </p>

        {/* Mode switch */}
        <div className="flex gap-2 mb-4">
          <button type="button" className={tabClass(mode === "phone")} onClick={() => switchMode("phone")}>
            Phone number
          </button>
          <button type="button" className={tabClass(mode === "credentials")} onClick={() => switchMode("credentials")}>
            Username &amp; password
          </button>
        </div>

        <div className="mb-4 space-y-3">
          {mode === "phone" ? (
            <div className="relative">
              <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.mutedText}`} />
              <input
                type="tel"
                placeholder="07XX or 01XX"
                value={reconnectPhone}
                onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                inputMode="numeric"
                maxLength={10}
                className={inputClass}
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <Phone className="hidden" />
                <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.mutedText}`} />
                <input
                  type="text"
                  placeholder="Username e.g. ABCD-1234"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 25))
                    onClearError()
                  }}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
              <div className="relative">
                <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.mutedText}`} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.slice(0, 64))
                    onClearError()
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {reconnectPhoneError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {reconnectPhoneError}
            </p>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit || reconnectPhoneLoading}
          className={`w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.ctaBg} ${theme.ctaText}`}
        >
          {reconnectPhoneLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Checking...
            </span>
          ) : (
            "Connect Device"
          )}
        </button>

        <p className={`text-center text-xs mt-3 ${theme.footerText}`}>
          {mode === "phone"
            ? "Only the number used to pay will work · Device limits apply"
            : "Each device has its own login in your SMS · Device limits apply"}
        </p>
      </div>
    </div>
  )
}