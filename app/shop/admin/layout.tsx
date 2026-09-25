import type React from "react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import Link from "next/link"
import { Shield } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navigation />

      <div className="pt-24 lg:pt-32 pb-20 flex-1">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Top Admin Bar */}
          <div className="mb-10 pb-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-border bg-card flex items-center justify-center">
                <Shield className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-serif text-2xl lg:text-3xl">
                    Store Management
                  </h1>
                  <span className="text-[10px] uppercase tracking-widest border border-border px-2 py-0.5 text-muted-foreground">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  Manage products, inventory catalog, and customer orders
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider border border-border px-3 py-1.5 text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                Store Status: Active
              </span>
              <Link
                href="/shop/catalog"
                className="text-xs tracking-[0.15em] uppercase border border-border px-4 py-1.5 hover:bg-muted transition-colors"
              >
                View Shop
              </Link>
            </div>
          </div>

          {children}
        </div>
      </div>

      <PremiumFooter />
    </div>
  )
}
