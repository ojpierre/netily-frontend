import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

export const metadata = marketingMetadata("/pricing")

export default function Page() {
  return <MarketingRoute path="/pricing" />
}
