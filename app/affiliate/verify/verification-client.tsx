"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Gift, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { affiliateApi } from "@/lib/affiliate-api"

type VerificationState = "loading" | "verified" | "error"

export default function AffiliateVerificationClient({ token }: { token: string }) {
  const [state, setState] = useState<VerificationState>(token ? "loading" : "error")
  const [message, setMessage] = useState(token ? "" : "The verification token is missing.")

  const verify = useCallback(async () => {
    if (!token) return
    setState("loading")
    setMessage("")
    try {
      await affiliateApi.verifyEmail(token)
      setState("verified")
    } catch (error) {
      setState("error")
      setMessage(error instanceof Error ? error.message : "We could not verify this email address.")
    }
  }, [token])

  useEffect(() => {
    void verify()
  }, [verify])

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-red-100/60 to-transparent" />
        <div className="absolute -bottom-40 -left-40 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-red-50/60 to-transparent" />
      </div>

      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <section
          aria-live="polite"
          className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white/95 p-7 text-center shadow-xl shadow-gray-100/70 backdrop-blur-xl md:p-9"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
            <Gift className="h-3.5 w-3.5" />
            Netily Affiliates
          </div>

          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
              state === "verified"
                ? "bg-emerald-50 text-emerald-600"
                : state === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-red-50 text-red-600"
            }`}
          >
            {state === "loading" && <Loader2 className="h-10 w-10 animate-spin" />}
            {state === "verified" && <CheckCircle2 className="h-10 w-10" />}
            {state === "error" && <XCircle className="h-10 w-10" />}
          </div>

          <h1 className="mt-6 text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
            {state === "loading"
              ? "Verifying your email"
              : state === "verified"
                ? "Email verified"
                : "Verification unsuccessful"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            {state === "loading"
              ? "Please keep this page open while we securely confirm your affiliate account."
              : state === "verified"
                ? "Your affiliate account is active. Continue to login, confirm the OTP sent to your email, and you will be taken to your dashboard."
                : message}
          </p>

          {state === "verified" && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Next step: sign in with your password and complete the six-digit email OTP.</span>
              </div>
            </div>
          )}

          <div className="mt-7 space-y-3">
            {state === "verified" && (
              <Button asChild className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800">
                <Link href="/affiliate/login">Continue to secure login</Link>
              </Button>
            )}
            {state === "error" && token && (
              <Button type="button" onClick={verify} variant="outline" className="h-11 w-full rounded-2xl">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try verification again
              </Button>
            )}
            {state === "error" && (
              <Button asChild variant="ghost" className="w-full rounded-2xl text-gray-500">
                <Link href="/affiliate/login">Return to login</Link>
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
