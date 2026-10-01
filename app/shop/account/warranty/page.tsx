"use client"

import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { AccountSidebar } from "@/shop-ui/components/account-sidebar"
import { BadgeCheck, Clock, FilePlus2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

const warrantyItems = [
  { device: "MikroTik CCR2004-16G-2S+", serial: "SN-CCR-8821", cover: "18 months left", status: "Active" },
  { device: "GPON OLT 8 Port", serial: "SN-OLT-4420", cover: "11 months left", status: "Active" },
  { device: "Fusion splicer kit", serial: "SN-FSP-1208", cover: "Under review", status: "Claim open" },
]

export default function WarrantyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pb-20 pt-24 text-foreground lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mb-2 block text-xs uppercase tracking-[0.4em] text-muted-foreground">Warranty Desk</span>
              <h1 className="mb-2 font-serif text-3xl lg:text-4xl">Warranty & Claims</h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Track protected hardware, open claims, warranty cover, and service decisions.
              </p>
            </div>
            <button
              onClick={() => toast.success("Warranty claim draft opened")}
              className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs uppercase tracking-[0.16em] text-background hover:bg-foreground/90"
            >
              <FilePlus2 className="h-4 w-4" />
              New Claim
            </button>
          </div>

          <div className="flex flex-col gap-10 lg:flex-row">
            <AccountSidebar />
            <section className="min-w-0 flex-1 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Protected items", value: "12", icon: ShieldCheck },
                  { label: "Open claims", value: "1", icon: Clock },
                  { label: "Approved returns", value: "2", icon: BadgeCheck },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
                    <item.icon className="mb-3 h-4 w-4 text-muted-foreground" />
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-serif text-3xl">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 border-b border-border pb-4">
                  <h2 className="font-serif text-xl">Covered Hardware</h2>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Serial-number tracking for warranty and return support.</p>
                </div>
                <div className="space-y-3">
                  {warrantyItems.map((item) => (
                    <div key={item.serial} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-serif text-sm">{item.device}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{item.serial} - {item.cover}</p>
                      </div>
                      <span className="w-fit rounded-full border border-border bg-card px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <PremiumFooter />
    </>
  )
}
