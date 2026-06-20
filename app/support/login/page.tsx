"use client"

import React, { useState } from "react"
import { Headphones, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"
import { useSupportAuth } from "../support-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SupportLoginPage() {
  const { login, loading } = useSupportAuth()
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
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,0.12),transparent_28%)]" />
      <div className="absolute left-1/2 top-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl md:p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-black">
              <Headphones className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">Support Console</p>
              <p className="text-sm text-white/55">Netily platform operations</p>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-white" />
              <p className="text-sm leading-6 text-white/70">
                Sign in with a support account created by superadmin. Superadmin can also enter here for first access.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support@netily.co.ke"
                  className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/35"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/35"
                  required
                />
              </div>
            </div>

            <Button disabled={loading} className="h-12 w-full rounded-2xl bg-white font-bold text-black hover:bg-white/90">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enter support workspace
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
