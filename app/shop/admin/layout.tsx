import type React from "react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import Link from "next/link"
import { Shield } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-foreground">
      <Navigation />

      <main className="flex-1 pb-20 pt-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10">
            <span className="mb-2 block text-xs uppercase text-muted-foreground">
              Store Admin
            </span>
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
                    <Shield className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase text-muted-foreground">
                    Admin
                  </span>
                </div>
                <h1 className="font-serif text-3xl lg:text-4xl">
                  Store Management
                </h1>
                <p className="mt-2 text-xs uppercase text-muted-foreground">
                  Manage products, inventory catalog, offers, and customer orders.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-xs uppercase text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Store Status: Active
                </span>
                <Link
                  href="/shop/catalog"
                  className="inline-flex min-h-10 items-center rounded-full border border-border px-5 text-xs uppercase transition-colors hover:bg-muted"
                >
                  View Shop
                </Link>
              </div>
            </div>
          </div>

          {children}
        </div>
      </main>

      <PremiumFooter />
    </div>
  )
}
