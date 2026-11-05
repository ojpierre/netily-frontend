import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, CreditCard, MessageCircle, PackageSearch, Truck } from "lucide-react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"

export const metadata: Metadata = {
  title: "How to Order Network Equipment | Internetily Shop",
  description: "How to choose, pay for and track routers, fibre, Wi-Fi, CCTV and ISP equipment from Internetily Shop in Kenya.",
}

const steps = [
  { icon: PackageSearch, title: "Choose the equipment", copy: "Search the catalog or browse by category and brand. Check stock, warranty, specifications and compatibility before adding items." },
  { icon: CheckCircle2, title: "Review the installation", copy: "Confirm quantities, delivery details and any project notes. For a larger rollout, send us the topology for a compatibility check." },
  { icon: CreditCard, title: "Approve the M-Pesa payment", copy: "Place the order and approve the secure prompt on your phone. The final amount remains visible throughout checkout." },
  { icon: Truck, title: "Track and receive", copy: "Keep your order reference and tracking link. We update the order as it moves from payment to processing, dispatch and delivery." },
]

export default function HowToOrderPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="bg-[#06183b] px-6 pb-16 pt-28 text-white lg:pt-40">
        <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8c5ff]">Ordering guide</p><h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">From equipment shortlist to delivery, without guesswork.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/70">Internetily Shop is built for practical network purchases. Browse independently, or ask us to check the combination before you pay.</p></div>
      </section>
      <section className="px-6 py-14 md:py-20"><div className="mx-auto max-w-5xl"><div className="grid gap-5 md:grid-cols-2">{steps.map((step, index) => { const Icon = step.icon; return <article key={step.title} className="rounded-xl border border-border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-lg bg-[#eef4ff] text-[#1b5eff]"><Icon className="h-6 w-6" /></span><span className="text-4xl font-semibold text-[#dce7f8]">{index + 1}</span></div><h2 className="mt-5 text-xl font-semibold">{step.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p></article> })}</div><div className="mt-10 rounded-xl border border-[#1b5eff]/25 bg-[#f3f7ff] p-6 md:flex md:items-center md:justify-between"><div><h2 className="text-xl font-semibold text-[#12336e]">Not sure what fits your network?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#35527d]">Share the expected users, topology, existing equipment and power situation. We can help identify mismatched ports, optics, PoE or capacity before dispatch.</p></div><a href="https://wa.me/254100034307" className="mt-5 inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#1b5eff] px-5 text-sm font-semibold text-white md:ml-6 md:mt-0"><MessageCircle className="h-4 w-4" />Ask on WhatsApp</a></div><div className="mt-8 flex flex-wrap gap-3"><Link href="/shop/catalog" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1b5eff] px-5 text-sm font-semibold text-white">Browse the catalog<ArrowRight className="h-4 w-4" /></Link><Link href="/shop/track" className="inline-flex h-11 items-center rounded-lg border border-border bg-white px-5 text-sm font-semibold">Track an existing order</Link></div></div></section>
      <PremiumFooter />
    </main>
  )
}
