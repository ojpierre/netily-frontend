import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

export const metadata = marketingMetadata("/features")

export default function Page() {
  return <MarketingRoute path="/features" />
}
