import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { ShopStorefront } from "@/shop-ui/components/shop-storefront"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <ShopStorefront />
      <PremiumFooter />
    </main>
  )
}
