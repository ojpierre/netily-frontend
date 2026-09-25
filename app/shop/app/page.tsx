import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { CollectionGrid } from "@/components/collection-grid"
import { HeritageSection } from "@/components/heritage-section"
import { PremiumFooter } from "@/components/premium-footer"

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
