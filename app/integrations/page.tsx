import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

export const metadata = marketingMetadata("/integrations")

export default function Page() {
  return <MarketingRoute path="/integrations" />
}
