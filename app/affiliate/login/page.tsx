"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Gift, Loader2, Lock, Mail } from "lucide-react"
import { useAffiliateAuth } from "../affiliate-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AffiliateLoginPage() {
  const { login, loading } = useAffiliateAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.")
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
              <p className="text-sm text-gray-400">Sign in to your Netily affiliate account</p>
            </div>
          </div>

          {/* Info box */}
          <div className="mb-6 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 p-4">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-5 w-5 text-red-500" />
              <p className="text-sm leading-6 text-gray-600">
                Earn commissions by referring ISPs to Netily. Track your referrals, analytics, and payouts all from one place.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

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

            <Button
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign in to dashboard
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
