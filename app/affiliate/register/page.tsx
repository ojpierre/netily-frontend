"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  User,
} from "lucide-react"
import { affiliateApi } from "@/lib/affiliate-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Phone formatting ───
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length <= 3) return `+${digits}`
  if (digits.length <= 6) return `+${digits.slice(0, 3)} ${digits.slice(3)}`
  return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`
}

// ─── Password strength ───
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length >= 12) score++
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" }
  if (score <= 3) return { score, label: "Fair", color: "bg-amber-500" }
  return { score, label: "Strong", color: "bg-emerald-500" }
}

// ─── Country data ───
const COUNTRIES = [
  { code: "KE", name: "Kenya", currency: "KES" },
  { code: "UG", name: "Uganda", currency: "UGX" },
  { code: "TZ", name: "Tanzania", currency: "TZS" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "GH", name: "Ghana", currency: "GHS" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "RW", name: "Rwanda", currency: "RWF" },
  { code: "ET", name: "Ethiopia", currency: "ETB" },
]

export default function AffiliateRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Step 1
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("+254 ")

  // Step 2
  const [country, setCountry] = useState("KE")

  // Step 3
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)

  // Step 4 — email verification
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [notice, setNotice] = useState("")

  const selectedCountry = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0]
  const strength = getStrength(password)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d+]/g, "")
    setPhone(formatPhone(raw))
  }

  const goNext = () => {
    setError("")
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || phone.replace(/\D/g, "").length < 10) {
        setError("Please fill in all required fields.")
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Enter a valid email address.")
        return
      }
    }
    setStep((s) => Math.min(s + 1, 4))
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleCreate = async () => {
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (!agreedTerms) {
      setError("You must agree to the terms.")
      return
    }
    setLoading(true)
    try {
      await affiliateApi.register({
        full_name: fullName,
        email,
        phone: phone.replace(/\s/g, ""),
        country: selectedCountry.name,
        password,
      })
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return
    setError("")
    setNotice("")
    setResending(true)
    try {
      await affiliateApi.resendVerification(email)
      setNotice("A new verification link has been sent.")
      setResendCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the verification email.")
    } finally {
      setResending(false)
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [resendCooldown])

  const steps = [
    { num: 1, label: "Details" },
    { num: 2, label: "Location" },
    { num: 3, label: "Security" },
    { num: 4, label: "Verify" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-red-100/60 to-transparent" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-red-50/50 to-transparent" />
        <div className="absolute top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full border border-red-100/40" />
      </div>

      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              <Shield className="h-3.5 w-3.5" />
              Netily Affiliate Program
            </span>
          </div>

          {/* Stepper */}
          <nav aria-label="Registration progress" className="mb-8">
            <div className="relative mx-auto max-w-md">
              <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-gray-100" />
              <div
                className="absolute left-[12.5%] top-5 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-red-600 transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 75}%` }}
              />
              <ol className="relative grid grid-cols-4">
                {steps.map((item) => (
                  <li key={item.num} className="flex flex-col items-center">
                    <button
                      type="button"
                      aria-current={step === item.num ? "step" : undefined}
                      aria-label={`${item.label}: ${step > item.num ? "completed" : step === item.num ? "current step" : "not started"}`}
                      disabled={item.num >= step || step === 4}
                      onClick={() => {
                        setError("")
                        setStep(item.num)
                      }}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-sm font-bold shadow-sm transition-all ${
                        step > item.num
                          ? "bg-emerald-500 text-white"
                          : step === item.num
                            ? "scale-110 bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-200"
                            : "bg-gray-100 text-gray-400"
                      } disabled:cursor-default`}
                    >
                      {step > item.num ? <Check className="h-4 w-4" /> : item.num}
                    </button>
                    <span className={`mt-2 text-[11px] font-semibold sm:text-xs ${step >= item.num ? "text-gray-800" : "text-gray-400"}`}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-4 text-center text-xs font-medium text-gray-400">
              Step {step} of {steps.length} · {steps[step - 1].label}
            </p>
          </nav>

          {/* Card */}
          <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-xl shadow-gray-100/50 backdrop-blur-xl md:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ───── Step 1: Details ───── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
                    Build your affiliate profile.
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Get a unique referral link and track visits and signups. Netily reviews each successful referral and sets commissions manually.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Full name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., John Doe"
                        className="border-gray-200 bg-gray-50/50 pl-10 focus:border-red-300 focus:ring-red-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., john@example.com"
                        className="border-gray-200 bg-gray-50/50 pl-10 focus:border-red-300 focus:ring-red-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="e.g., +254 700 000 000"
                        className="border-gray-200 bg-gray-50/50 pl-10 focus:border-red-300 focus:ring-red-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={goNext}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-center text-sm text-gray-400">
                  Already an affiliate?{" "}
                  <Link href="/affiliate/login" className="font-semibold text-red-600 hover:text-red-700 underline-offset-2 hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            )}

            {/* ───── Step 2: Location ───── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <button onClick={goBack} className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-red-600 transition">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
                    Where are you based?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Your country sets the currency your rewards are paid in.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Country *</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-200 appearance-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Transparent, reviewed rewards</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Referral clicks and signups are tracked automatically. Commission amounts and payouts are reviewed and recorded manually by Netily in{" "}
                        <span className="font-bold text-red-700">{selectedCountry.currency}</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={goNext}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ───── Step 3: Security ───── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <button onClick={goBack} className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-red-600 transition">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
                    Lock down your account.
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Create a secure password to protect your Netily affiliate earnings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="border-gray-200 bg-gray-50/50 pl-10 pr-10 focus:border-red-300 focus:ring-red-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {password.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                            style={{ width: `${(strength.score / 5) * 100}%` }}
                          />
                        </div>
                        <p className={`text-xs font-semibold ${strength.score <= 1 ? "text-red-500" : strength.score <= 3 ? "text-amber-500" : "text-emerald-500"}`}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Confirm password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="border-gray-200 bg-gray-50/50 pl-10 pr-10 focus:border-red-300 focus:ring-red-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
                    )}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-200 accent-red-600"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">
                      I agree to the{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-red-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        affiliate program terms
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                  </label>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create affiliate account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ───── Step 4: Email Verification ───── */}
            {step === 4 && (
              <div className="space-y-6 text-center py-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-100 to-orange-100">
                  <Mail className="h-10 w-10 text-red-600 animate-bounce" />
                </div>

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
                    Check your inbox!
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">
                    We sent a verification link to the email address you used during registration. Open that link to finish setting up your Netily affiliate account.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Verification email sent to <span className="font-semibold text-gray-900">{email}</span>
                </div>

                {notice && (
                  <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {notice}
                  </div>
                )}

                <Button
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  variant="outline"
                  className="rounded-2xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                >
                  {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "Resend verification email"}
                </Button>

                <Button asChild className="h-11 rounded-2xl bg-red-700 font-bold text-white hover:bg-red-800">
                  <Link href="/affiliate/login">I verified my email — continue to login</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
