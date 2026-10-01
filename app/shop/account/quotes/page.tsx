"use client"

import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { AccountSidebar } from "@/shop-ui/components/account-sidebar"
import { FileText, Plus, Send } from "lucide-react"
import { toast } from "sonner"

const quoteRequests = [
  { ref: "QT-FTTH-1042", title: "FTTH rollout bundle", status: "Awaiting stock check", total: "$4,820" },
  { ref: "QT-NOC-0991", title: "PoE switches and racks", status: "Ready for review", total: "$2,140" },
  { ref: "QT-WISP-0875", title: "Backhaul radios and mounting kit", status: "Draft", total: "$1,760" },
]

export default function QuotesPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pb-20 pt-24 text-foreground lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mb-2 block text-xs uppercase tracking-[0.4em] text-muted-foreground">Proforma Desk</span>
              <h1 className="mb-2 font-serif text-3xl lg:text-4xl">Quotes & Bulk Requests</h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Request pricing for bundles, site rollouts, tenders, and bulk networking hardware.
              </p>
            </div>
            <button
              onClick={() => toast.success("Quote request started")}
              className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs uppercase tracking-[0.16em] text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              New Quote
            </button>
          </div>

          <div className="flex flex-col gap-10 lg:flex-row">
            <AccountSidebar />
            <section className="min-w-0 flex-1 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Open quotes", value: "3" },
                  { label: "Ready for review", value: "1" },
                  { label: "Avg response", value: "4h" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-serif text-3xl">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 border-b border-border pb-4">
                  <h2 className="font-serif text-xl">Recent Requests</h2>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Keep tender and bulk hardware pricing in one place.</p>
                </div>
                <div className="space-y-3">
                  {quoteRequests.map((quote) => (
                    <div key={quote.ref} className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-serif text-sm">{quote.title}</p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{quote.ref} - {quote.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-lg">{quote.total}</span>
                        <button className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Send quote follow up">
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
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
