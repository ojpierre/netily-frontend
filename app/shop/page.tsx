import type { Metadata } from "next"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { ShopStorefront } from "@/shop-ui/components/shop-storefront"

export const metadata: Metadata = {
  title: "Network Equipment Shop Kenya | Routers, Fibre, Wi-Fi | Internetily",
  description:
    "Buy MikroTik, Ubiquiti, TP-Link and VSOL routers, Wi-Fi access points, fibre OLTs, splicers, Starlink and power backup in Kenya. Pay with M-Pesa.",
  alternates: { canonical: "/shop" },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <ShopStorefront />
      <PremiumFooter />
    </main>
  )
}
