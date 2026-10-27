export interface Product {
  id: string // slug from the API
  name: string
  price: number
  currency: string
  compareAtPrice?: number | null
  category: string
  categorySlug?: string
  brand?: string
  inStock?: boolean
  isFeatured?: boolean
  warranty?: string
  specsSheet?: Record<string, string>
  image: string
  hoverImage: string
  description: string
  longDescription: string
  materials: string[]
  care: string[]
  sizes: { size: string; available: boolean }[]
  colors: { name: string; hex: string; available: boolean }[]
  details: string[]
  madeIn: string
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

/** Maps the API product to the UI shape and fills fields the backend doesn't store. */
export function normalizeProduct(raw: any): Product {
  const specs: Record<string, string> = raw?.specsSheet && typeof raw.specsSheet === "object" ? raw.specsSheet : {}
  const long: string = raw?.longDescription || ""
  return {
    id: String(raw.id),
    name: raw.name,
    price: Number(raw.price) || 0,
    currency: String(raw.currency || "KES").toUpperCase(),
    compareAtPrice: raw.compareAtPrice ?? null,
    category: raw.category || "",
    categorySlug: raw.categorySlug,
    brand: specs.Brand || specs.brand || "",
    inStock: raw.inStock !== false,
    isFeatured: !!raw.isFeatured,
    warranty: raw.warranty || "",
    specsSheet: specs,
    image: raw.image || "",
    hoverImage: raw.hoverImage || raw.image || "",
    description: long.length > 160 ? `${long.slice(0, 157)}...` : long,
    longDescription: long,
    materials: arr<string>(raw.materials),
    care: arr<string>(raw.care),
    sizes: arr<{ size: string; available?: boolean }>(raw.sizes).map((s) => ({ size: s.size, available: s.available !== false })),
    colors: arr<{ name: string; hex?: string; available?: boolean }>(raw.colors).map((c) => ({
      name: c.name,
      hex: c.hex || "#1C1C1E",
      available: c.available !== false,
    })),
    details: arr<string>(raw.details),
    madeIn: raw.madeIn || "",
  }
}

export interface ShopOfferSlide {
  id: string
  title: string
  eyebrow: string
  description: string
  image: string
  ctaLabel: string
  href: string
  badge?: string
}

// Static for now. The backend has no offers model.
export const defaultOfferSlides: ShopOfferSlide[] = [
  {
    id: "fiber-rollout-offer",
    eyebrow: "FTTH rollout bundle",
    title: "GPON OLTs, ONTs, drop cable, and test tools in one clean order.",
    description: "Build your next estate fiber rollout with verified hardware, dispatch support, and ISP-friendly recommendations.",
    image: "/shop-assets/shop_hero.png",
    ctaLabel: "Shop Fiber Gear",
    href: "/shop/catalog?cat=Fiber+Optics+%26+OLT",
    badge: "Fiber offers",
  },
  {
    id: "tower-upgrade-offer",
    eyebrow: "Tower and backhaul",
    title: "Upgrade tower PoE, backhaul radios, and rack power before peak demand.",
    description: "A practical bundle for WISPs adding sectors, repeaters, tower switches, and clean power protection.",
    image: "/shop-assets/hero_bg.png",
    ctaLabel: "Browse Backhaul",
    href: "/shop/catalog?cat=Wireless+%26+Backhaul",
    badge: "WISP ready",
  },
  {
    id: "network-core-offer",
    eyebrow: "Core network refresh",
    title: "RouterOS edge routers and PoE switching for serious subscriber growth.",
    description: "Choose MikroTik and carrier-grade switching for PPPoE, hotspot, CGNAT, and branch aggregation workloads.",
    image: "/shop-assets/products/mikrotik_router.jpg",
    ctaLabel: "View Core Deals",
    href: "/shop/catalog?cat=Routers+%26+Gateways",
    badge: "Core deals",
  },
]
