"use client"

import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { AccountSidebar } from "@/shop-ui/components/account-sidebar"
import { Headphones, MessageCircle, PackageSearch, Phone } from "lucide-react"

const supportTickets = [
  { ref: "SUP-2048", subject: "Confirm OLT compatibility", status: "Open", channel: "Chat" },
  { ref: "SUP-1992", subject: "Delivery follow up for tower site", status: "Waiting on carrier", channel: "Phone" },
  { ref: "SUP-1876", subject: "SFP module warranty review", status: "Resolved", channel: "Email" },
]

export default function SupportPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pb-20 pt-24 text-foreground lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10">
            <span className="mb-2 block text-xs uppercase tracking-[0.4em] text-muted-foreground">Shop Helpdesk</span>
            <h1 className="mb-2 font-serif text-3xl lg:text-4xl">Support & Conversations</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Keep product questions, delivery follow-ups, returns, and warranty support easy to trace.
            </p>
          </div>

          <div className="flex flex-col gap-10 lg:flex-row">
            <AccountSidebar />
            <section className="min-w-0 flex-1 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Open tickets", value: "2", icon: Headphones },
                  { label: "Avg first reply", value: "12m", icon: MessageCircle },
                  { label: "Tracked orders", value: "3", icon: PackageSearch },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
                    <item.icon className="mb-3 h-4 w-4 text-muted-foreground" />
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-serif text-3xl">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-serif text-xl">Recent Support</h2>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Order support, delivery updates, and hardware guidance.</p>
                  </div>
                  <a href="tel:0100034307" className="flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs uppercase hover:bg-muted">
                    <Phone className="h-4 w-4" />
                    Call Shop
                  </a>
                </div>
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.ref} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-serif text-sm">{ticket.subject}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{ticket.ref} - {ticket.channel}</p>
                      </div>
                      <span className="w-fit rounded-full border border-border bg-card px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {ticket.status}
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
