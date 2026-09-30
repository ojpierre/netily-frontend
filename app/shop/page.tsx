import { Suspense } from "react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { ShopCatalogExperience } from "@/shop-ui/components/shop-catalog-experience"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <ShopCatalogExperience />
      </Suspense>
      <PremiumFooter />
    </main>
  )
}
