import { Navigation } from "@/shop-ui/components/navigation"
import { HeroSection } from "@/shop-ui/components/hero-section"
import { CollectionGrid } from "@/shop-ui/components/collection-grid"
import { HeritageSection } from "@/shop-ui/components/heritage-section"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <CollectionGrid />
      <HeritageSection />
      <PremiumFooter />
    </main>
  )
}
