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
  isTrending?: boolean
  createdAt?: string
  warranty?: string
  specsSheet?: Record<string, string>
  image: string
  hoverImage: string
  /** One-line pitch for cards and meta descriptions. */
  summary?: string
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
    brand: raw.brand || specs.Brand || specs.brand || "",
    inStock: raw.inStock !== false,
    isFeatured: !!raw.isFeatured,
    isTrending: !!raw.isTrending,
    createdAt: raw.createdAt || "",
    warranty: raw.warranty || "",
    specsSheet: specs,
    image: raw.image || "",
    hoverImage: raw.hoverImage || raw.image || "",
    summary: raw.summary || "",
    description: raw.summary || (long.length > 160 ? `${long.slice(0, 157)}...` : long),
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

// Static for now. The backend has no offers model. Hrefs use category slugs.
export const defaultOfferSlides: ShopOfferSlide[] = [
  {
    id: "fiber-rollout-offer",
    eyebrow: "FTTH rollout",
    title: "OLTs, ONTs, cable and a splicer, in one order.",
    description: "Everything for a GPON estate rollout: the OLT at the hub, ONTs for customers, ADSS cable, connectors and splicing tools.",
    image: "/shop-assets/shop_hero.png",
    ctaLabel: "Shop fibre gear",
    href: "/shop/catalog?cat=fiber-optics-olt",
    badge: "Fibre",
  },
  {
    id: "wisp-offer",
    eyebrow: "Outdoor wireless",
    title: "Radios and access points for your next mast.",
    description: "NanoStation and LiteBeam links, outdoor access points and PoE power for WISPs adding sectors and customers.",
    image: "/shop-assets/hero_bg.png",
    ctaLabel: "Shop outdoor wireless",
    href: "/shop/catalog?cat=outdoor-wireless",
    badge: "WISP",
  },
  {
    id: "network-core-offer",
    eyebrow: "Routers and gateways",
    title: "MikroTik routers from a hEX S to a CCR2116.",
    description: "RouterOS routers sized for PPPoE, hotspot and VLAN loads, from small offices to ISPs with thousands of subscribers.",
    image: "/shop-assets/products/mikrotik_router.jpg",
    ctaLabel: "Shop routers",
    href: "/shop/catalog?cat=routers-gateways",
    badge: "Routers",
  },
]
