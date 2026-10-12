import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

export const metadata = marketingMetadata("/countries")

export default function Page() {
  return <MarketingRoute path="/countries" />
}
