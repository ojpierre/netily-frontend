"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck, ArrowRight, LockKeyhole } from "lucide-react"
import { toast } from "sonner"

export default function ShopAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@internetily.shop")
  const [password, setPassword] = useState("shopadmin123")
  const [isLoading, setIsLoading] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      window.localStorage.setItem("netily_shop_admin_session", "authenticated")
      window.localStorage.setItem("netily_shop_admin_email", email)
      setIsLoading(false)
      toast.success("Shop admin unlocked")
      router.replace(params.get("next") || "/shop/admin")
    }, 450)
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="mb-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Shop Admin</p>
          <h1 className="mt-2 font-serif text-3xl">Sign in to manage the store</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Access products, offers, inventory, fulfillment, and order operations from one workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Admin email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-foreground"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-foreground"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs uppercase tracking-[0.16em] text-background transition hover:bg-foreground/90 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Open Admin"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
          Customer shopping accounts use a separate login.{" "}
          <Link href="/shop/login" className="text-foreground underline underline-offset-2">
            Customer login
          </Link>
        </div>
      </div>

      <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border bg-[#0b42d8] text-white">
        <Image src="/internetily-white-logo-320.webp" alt="Internetily" width={220} height={80} className="absolute left-8 top-8 h-14 w-auto object-contain" />
        <div className="absolute inset-x-8 bottom-8">
          <ShieldCheck className="mb-5 h-10 w-10 stroke-[1.4]" />
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">Secure store operations</p>
          <h2 className="mt-3 font-serif text-3xl">Role based store operations</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
            Manage catalog changes, order handling, stock decisions, and fulfillment work from a focused admin console.
          </p>
        </div>
      </div>
    </div>
  )
}
