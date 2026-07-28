"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Gift, KeyRound, Loader2, Lock, Mail, RefreshCw } from "lucide-react"
import { useAffiliateAuth } from "../affiliate-auth-context"
import { affiliateApi } from "@/lib/affiliate-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AffiliateLoginPage() {
  const { login, loading } = useAffiliateAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [challengeId, setChallengeId] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiresIn, setExpiresIn] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (step !== "otp") return
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
      setExpiresIn((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [step])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    try {
      if (step === "credentials") {
        const challenge = await login(email, password)
        if (challenge) {
          setChallengeId(challenge.challenge_id)
          setMaskedEmail(challenge.email)
          setResendCooldown(challenge.resend_available_in)
          setExpiresIn(challenge.expires_in)
          setStep("otp")
        }
        return
      }
      if (!challengeId || otp.length !== 6) throw new Error("Enter the six-digit OTP sent to your email.")
      await login(email, password, { challenge_id: challengeId, otp_code: otp })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.")
    }
  }

  const resendOtp = async () => {
    if (!challengeId || resendCooldown > 0) return
    setError("")
    setResending(true)
    try {
      const challenge = await affiliateApi.resendLoginOtp(email, password, challengeId)
      setChallengeId(challenge.challenge_id)
      setMaskedEmail(challenge.email)
      setResendCooldown(challenge.resend_available_in)
      setExpiresIn(challenge.expires_in)
      setOtp("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-red-100/50 to-transparent" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-red-50/40 to-transparent" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-100/30" />
      </div>

      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-xl shadow-gray-100/50 backdrop-blur-xl md:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-200">
              <Gift className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-gray-900">Affiliate Portal</p>
              <p className="text-sm text-gray-400">{step === "otp" ? "Confirm the code sent to your email" : "Sign in to your Netily affiliate account"}</p>
            </div>
          </div>

          {/* Info box */}
          <div className="mb-6 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 p-4">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-5 w-5 text-red-500" />
              <p className="text-sm leading-6 text-gray-600">
                Track referred ISPs and review manually approved commissions and payouts from one secure account.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {step === "credentials" ? (
              <>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="border-gray-200 bg-gray-50/50 pl-10 focus:border-red-300 focus:ring-red-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-gray-200 bg-gray-50/50 pl-10 focus:border-red-300 focus:ring-red-200"
                  required
                />
              </div>
            </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Enter the six-digit code sent to <strong>{maskedEmail}</strong>.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 font-semibold">One-time password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="h-12 border-gray-200 bg-gray-50/50 pl-10 text-center text-xl font-bold tracking-[0.35em]"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {expiresIn > 0 ? `Code expires in ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, "0")}` : "Code expired. Request a new one."}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => { setStep("credentials"); setOtp(""); setChallengeId(""); setError("") }} className="font-semibold text-gray-500 hover:text-gray-800">
                    Use different credentials
                  </button>
                  <button type="button" onClick={resendOtp} disabled={resending || resendCooldown > 0} className="inline-flex items-center gap-1 font-semibold text-red-600 disabled:text-gray-400">
                    {resending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </div>
            )}

            <Button
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {step === "otp" ? "Verify and sign in" : "Continue"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/affiliate/register" className="font-semibold text-red-600 hover:text-red-700 underline-offset-2 hover:underline">
              Register as affiliate
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
