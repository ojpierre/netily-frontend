import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

export const metadata = marketingMetadata("/contact")

export default function Page() {
  return <MarketingRoute path="/contact" />
}
