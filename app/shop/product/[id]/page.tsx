import type { Metadata } from "next"
import { ProductPageClient } from "@/shop-ui/components/product-page-client"
import { featuredCatalog } from "@/shop-ui/lib/featured-catalog"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = featuredCatalog.find((p) => p.id === id)
  if (!product) {
    return {
      title: "Network equipment | Internetily Shop",
      description: "Routers, fibre, Wi-Fi and power equipment for ISPs, installers, offices and homes in Kenya.",
      alternates: { canonical: `/shop/product/${id}` },
    }
  }
  const description = product.summary || product.description || `${product.name} from Internetily Shop.`
  return {
    title: `${product.name} price in Kenya | Internetily Shop`,
    description,
    alternates: { canonical: `/shop/product/${id}` },
    openGraph: { title: product.name, description, type: "website", url: `https://netily.co.ke/shop/product/${id}` },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductPageClient id={id} />
}
