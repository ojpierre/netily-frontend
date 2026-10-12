import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

export const metadata = marketingMetadata("/resources")

export default function Page() {
  return <MarketingRoute path="/resources" />
}
