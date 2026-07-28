"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Flame,
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
  { code: "KE", name: "Kenya", currency: "KES", rate: 500 },
  { code: "UG", name: "Uganda", currency: "UGX", rate: 18000 },
  { code: "TZ", name: "Tanzania", currency: "TZS", rate: 12000 },
  { code: "NG", name: "Nigeria", currency: "NGN", rate: 8000 },
  { code: "GH", name: "Ghana", currency: "GHS", rate: 60 },
  { code: "ZA", name: "South Africa", currency: "ZAR", rate: 90 },
  { code: "RW", name: "Rwanda", currency: "RWF", rate: 6000 },
  { code: "ET", name: "Ethiopia", currency: "ETB", rate: 2800 },
]

export default function AffiliateRegisterPage() {
  const router = useRouter()
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

  // Step 4 — verification polling
  const [resending, setResending] = useState(false)

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
    setResending(true)
    try {
      await affiliateApi.resendVerification(email)
    } finally {
      setResending(false)
    }
  }

  // Auto-transition after "verification" (mock: 5s)
  useEffect(() => {
    if (step !== 4) return
    const timer = setTimeout(() => {
      router.replace("/affiliate/login")
    }, 5000)
    return () => clearTimeout(timer)
  }, [step, router])

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
          <div className="mb-8 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                      step > s.num
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : step === s.num
                        ? "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-200 scale-110"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span className={`mt-1.5 text-[10px] font-semibold ${step >= s.num ? "text-red-700" : "text-gray-300"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mt-[-16px] h-0.5 w-10 rounded-full transition-all duration-500 ${step > s.num ? "bg-emerald-400" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

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
                    Let&apos;s get you earning.
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Refer fellow ISPs to Netily and earn a recurring cut for every successful activation. Drop your details below to grab your unique link.
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
                    <Flame className="mt-0.5 h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Your payout rate</p>
                      <p className="mt-1 text-sm text-gray-600">
                        You&apos;ll earn{" "}
                        <span className="font-black text-red-700">
                          {selectedCountry.currency} {selectedCountry.rate.toLocaleString()}
                        </span>{" "}
                        for each ISP that signs up and pays — paid in {selectedCountry.currency}.
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

                {/* Pulse animation */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  Waiting for verification…
                </div>

                <Button
                  onClick={handleResend}
                  disabled={resending}
                  variant="outline"
                  className="rounded-2xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                >
                  {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Resend verification email
                </Button>

                <p className="text-sm text-gray-400">
                  <button
                    onClick={() => {
                      affiliateApi.logout()
                      window.location.href = "/affiliate/login"
                    }}
                    className="font-semibold text-red-600 hover:underline"
                  >
                    Log out
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
