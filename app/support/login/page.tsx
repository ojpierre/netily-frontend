"use client"

import React, { useState } from "react"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { useSupportAuth } from "../support-auth-context"
import { InternetilyLogo } from "@/components/internetily-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const inputClass =
  "h-11 border-white/15 bg-white/[0.06] pl-10 text-white placeholder:text-white/35 focus-visible:border-[#027EFB] focus-visible:ring-2 focus-visible:ring-[#027EFB]/40"

export default function SupportLoginPage() {
  const { login, loading } = useSupportAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(2,126,251,0.2),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="absolute left-1/2 top-1/2 hidden h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 sm:block" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10">
        <InternetilyLogo tone="onDark" className="h-9" priority />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#4da3ff]">Support Console</p>

        <div className="mt-8 w-full rounded-3xl border border-white/15 bg-white/[0.06] p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl md:p-8">
          <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-white/55">Sign in with your support account to continue.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate={false}>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support@netily.co.ke"
                  className={inputClass}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#027EFB]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#027EFB] font-bold text-white hover:bg-[#1a8dff] focus-visible:ring-2 focus-visible:ring-[#027EFB]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
              {loading ? "Signing in…" : "Enter support workspace"}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          Powered by <span className="font-semibold text-white/65">Internetily</span> · Authorized support staff only
        </p>
      </main>
    </div>
  )
}
