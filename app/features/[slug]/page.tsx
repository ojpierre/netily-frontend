import { marketingPaths } from "@/components/marketing/content"
import { marketingMetadata, MarketingRoute } from "@/components/marketing/routes"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return marketingPaths.filter((path) => path.startsWith("/features/")).map((path) => ({ slug: path.split("/").pop()! }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return marketingMetadata(`/features/${slug}`)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <MarketingRoute path={`/features/${slug}`} />
}
