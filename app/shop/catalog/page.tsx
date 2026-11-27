import type { Metadata } from "next"
import { Suspense } from "react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { ShopCatalogExperience } from "@/shop-ui/components/shop-catalog-experience"

export const metadata: Metadata = {
  title: "Shop network equipment in Kenya | Internetily",
  description:
    "Browse routers, Wi-Fi access points, PoE switches, fibre OLTs and ONTs, splicers, Starlink and power backup. Filter by brand and price, and pay with M-Pesa.",
  alternates: { canonical: "/shop/catalog" },
}

export default function ShopCatalogPage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <Navigation />
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <ShopCatalogExperience />
      </Suspense>
      <PremiumFooter />
    </main>
  )
}
