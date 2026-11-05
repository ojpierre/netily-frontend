import type { Metadata } from "next"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { ShopStorefront } from "@/shop-ui/components/shop-storefront"

export const metadata: Metadata = {
  title: "ISP Network Equipment Shop Kenya | Internetily",
  description: "Shop routers, switches, Wi-Fi access points, fibre optics, CCTV, power and installation equipment for ISPs and businesses in Kenya.",
  alternates: { canonical: "/shop" },
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <ShopStorefront />
      <PremiumFooter />
    </main>
  )
}
