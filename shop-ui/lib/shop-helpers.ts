import type { Product } from "./products"
import type { ShopCategory } from "./shop-api"

/** Font stacks. The root layout loads Outfit and Plus Jakarta Sans as CSS variables. */
export const HEADING_FONT = "[font-family:var(--font-outfit),system-ui,sans-serif]"
export const BODY_FONT = "[font-family:var(--font-plus-jakarta-sans),system-ui,sans-serif]"

export const DEFAULT_WHATSAPP = "254100034307"
export const SITE_URL = "https://netily.co.ke"

export type ArtKind = "router" | "ap" | "outdoor" | "switch" | "fibre" | "tool" | "satellite" | "power"

export interface CategoryTint {
  /** Gradient start (lightest). */
  from: string
  /** Gradient end. */
  to: string
  /** Line and accent colour for the artwork. */
  deep: string
}

export const CATEGORY_KIND: Record<string, ArtKind> = {
  "routers-gateways": "router",
  "wireless-access-points": "ap",
  "outdoor-wireless": "outdoor",
  "switches-poe": "switch",
  "fiber-optics-olt": "fibre",
  "tools-test-equipment": "tool",
  "starlink-satellite": "satellite",
  "power-protection": "power",
}

const KIND_TINT: Record<ArtKind, CategoryTint> = {
  router: { from: "#f1f8fe", to: "#d9ebf9", deep: "#0874cf" },
  ap: { from: "#f0faf9", to: "#d8f0ee", deep: "#0b8a86" },
  outdoor: { from: "#f3f4fd", to: "#dfe2f8", deep: "#4a56c9" },
  switch: { from: "#f6f2fd", to: "#e5dcf7", deep: "#7448c4" },
  fibre: { from: "#f0faf6", to: "#d6f0e5", deep: "#1b9873" },
  tool: { from: "#fdf4ef", to: "#f8e0d3", deep: "#b9552a" },
  satellite: { from: "#f3f6f8", to: "#dde4e9", deep: "#17252d" },
  power: { from: "#fdf8ea", to: "#f6e8c3", deep: "#b88414" },
}

/** Words that tell us which category a name belongs to when the slug is missing. */
export function kindFor(input: { categorySlug?: string; category?: string; name?: string }): ArtKind {
  if (input.categorySlug && CATEGORY_KIND[input.categorySlug]) return CATEGORY_KIND[input.categorySlug]
  const hay = `${input.category || ""} ${input.name || ""}`.toLowerCase()
  if (/starlink|satellite/.test(hay)) return "satellite"
  if (/power|battery|backup|ups|inverter/.test(hay)) return "power"
  if (/splic|tool|test|locator/.test(hay)) return "tool"
  if (/olt|ont|fib|gpon|adss|optic/.test(hay)) return "fibre"
  if (/switch|poe/.test(hay)) return "switch"
  if (/nanostation|litebeam|cpe|outdoor wireless|dish/.test(hay)) return "outdoor"
  if (/access point|wi-fi|wifi|\bap\b|eap|rap|uap/.test(hay)) return "ap"
  return "router"
}

export function tintFor(kind: ArtKind): CategoryTint {
  return KIND_TINT[kind]
}

/** Product name without the brand prefix, e.g. "MikroTik RB5009UG+S+IN" becomes "RB5009UG+S+IN". */
export function shortModel(name: string, brand?: string): string {
  if (!brand) return name
  const brandWords = brand
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
  const words = name.split(/\s+/)
  let i = 0
  while (i < words.length - 1 && brandWords.includes(words[i].toLowerCase().replace(/[^a-z0-9]/g, ""))) i++
  return words.slice(i).join(" ") || name
}

export function isOnSale(p: Pick<Product, "price" | "compareAtPrice">): boolean {
  return Boolean(p.compareAtPrice && p.compareAtPrice > p.price)
}

export function saveAmount(p: Pick<Product, "price" | "compareAtPrice">): number {
  return isOnSale(p) ? (p.compareAtPrice as number) - p.price : 0
}

export function savePercent(p: Pick<Product, "price" | "compareAtPrice">): number {
  return isOnSale(p) ? Math.round((saveAmount(p) / (p.compareAtPrice as number)) * 100) : 0
}

export function whatsappLink(number: string | undefined | null, text?: string): string {
  const digits = (number || DEFAULT_WHATSAPP).replace(/\D/g, "") || DEFAULT_WHATSAPP
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`
}

export function categoryHref(slug: string): string {
  return `/shop/catalog?cat=${encodeURIComponent(slug)}`
}

export function brandHref(brand: string): string {
  return `/shop/catalog?brand=${encodeURIComponent(brand)}`
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/fiber/g, "fibre")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

/** Resolves ?cat= given either a slug or a (possibly old) category name. */
export function resolveCategory(value: string | null | undefined, categories: ShopCategory[]): ShopCategory | null {
  if (!value) return null
  const v = value.trim()
  const direct = categories.find((c) => c.slug === v) || categories.find((c) => c.name.toLowerCase() === v.toLowerCase())
  if (direct) return direct
  const n = norm(v)
  const byNorm = categories.find((c) => norm(c.name) === n || norm(c.slug) === n)
  if (byNorm) return byNorm
  const stop = new Set(["and", "the", "equipment", "test"])
  const tokens = n.split(" ").filter((t) => t.length > 2 && !stop.has(t))
  let best: ShopCategory | null = null
  let bestScore = 0
  for (const c of categories) {
    const ct = new Set(norm(`${c.name} ${c.slug}`).split(" "))
    const score = tokens.filter((t) => ct.has(t)).length
    if (score > bestScore) {
      best = c
      bestScore = score
    }
  }
  return best
}

export function productInCategory(p: Product, c: ShopCategory): boolean {
  return (p.categorySlug && p.categorySlug === c.slug) || p.category === c.name
}

export function countByBrand(products: Product[]): { brand: string; count: number }[] {
  const map = new Map<string, number>()
  for (const p of products) {
    if (!p.brand) continue
    map.set(p.brand, (map.get(p.brand) || 0) + 1)
  }
  return Array.from(map, ([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
}

/** Plain-language availability label. */
export function availability(p: Pick<Product, "inStock">): { label: string; inStock: boolean } {
  return p.inStock === false ? { label: "Available to order", inStock: false } : { label: "In stock", inStock: true }
}
