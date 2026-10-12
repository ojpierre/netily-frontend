import MarketingHomePage from "@/components/marketing/home-page"
import MarketingLayout from "@/components/marketing/layout"
import { marketingMetadata, MarketingStructuredData } from "@/components/marketing/routes"

export const metadata = marketingMetadata()

export default function HomePage() {
  return <MarketingLayout><MarketingStructuredData /><MarketingHomePage /></MarketingLayout>
}
