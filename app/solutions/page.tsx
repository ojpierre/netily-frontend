import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

export const metadata = marketingMetadata("/solutions")

export default function Page() {
  return <MarketingRoute path="/solutions" />
}
