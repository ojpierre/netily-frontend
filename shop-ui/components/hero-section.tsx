"use client"

import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
import type { Product } from "@/shop-ui/lib/products"
import type { PublicShopSettings } from "@/shop-ui/lib/shop-api"
import { formatShopMoney } from "@/shop-ui/lib/currency"
import { HEADING_FONT, whatsappLink } from "@/shop-ui/lib/shop-helpers"
import { ProductArt } from "./product-art"

const DEFAULTS = {
  eyebrow: "Network equipment for Kenya",
  title: "Routers, fibre and Wi-Fi gear for networks that earn their keep.",
  description:
    "MikroTik, Ubiquiti, TP-Link, VSOL and more, priced in shillings. Pay with M-Pesa, and have an ISP engineer check your parts list on WhatsApp before you order.",
  primaryLabel: "Shop all equipment",
  primaryHref: "/shop/catalog",
}

/** One featured product per category, so the collage shows range. */
function collageProducts(products: Product[]): Product[] {
  const seen = new Set<string>()
  const out: Product[] = []
  const pool = [...products].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured) || b.price - a.price)
  const wanted = ["routers-gateways", "outdoor-wireless", "fiber-optics-olt", "power-protection", "starlink-satellite", "wireless-access-points"]
  for (const slug of wanted) {
    const p = pool.find((x) => x.categorySlug === slug)
    if (p && !seen.has(p.id)) {
      seen.add(p.id)
      out.push(p)
    }
  }
  for (const p of pool) {
    if (out.length >= 4) break
    if (!seen.has(p.id) && !out.some((o) => o.category === p.category)) {
      seen.add(p.id)
      out.push(p)
    }
  }
  return out.slice(0, 4)
}

export function HeroSection({
  settings,
  products,
  stats,
}: {
  settings: PublicShopSettings | null
  products: Product[]
  stats: { products: number; categories: number; brands: number }
}) {
  const eyebrow = settings?.hero_eyebrow?.trim() || DEFAULTS.eyebrow
  const title = settings?.hero_title?.trim() || DEFAULTS.title
  const description = settings?.hero_description?.trim() || DEFAULTS.description
  const primaryLabel = settings?.hero_primary_label?.trim() || DEFAULTS.primaryLabel
  const primaryHref = settings?.hero_primary_href?.trim() || DEFAULTS.primaryHref
  const secondaryLabel = settings?.hero_secondary_label?.trim()
  const secondaryHref = settings?.hero_secondary_href?.trim()
  const tiles = collageProducts(products)

  return (
    <section className="relative overflow-hidden border-b border-[#dce4e8] bg-[#f3f7f8]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(8,116,207,0.13) 1px, transparent 0)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse at 70% 40%, #000 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 70% 40%, #000 20%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#0874cf]/20 bg-white px-3 py-1 text-xs font-semibold text-[#0874cf]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22a67d]" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className={`${HEADING_FONT} mt-5 text-[2rem] font-semibold leading-[1.1] tracking-tight text-[#17252d] sm:text-5xl lg:text-[3.4rem]`}>{title}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#56656f] sm:text-lg sm:leading-8">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#0874cf] px-6 text-sm font-semibold text-white outline-none transition hover:bg-[#075faa] focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-12 items-center rounded-lg border border-[#dce4e8] bg-white px-6 text-sm font-semibold text-[#17252d] outline-none transition hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
              >
                {secondaryLabel}
              </Link>
            ) : (
              <a
                href={whatsappLink(settings?.whatsapp_number, "Hi Internetily, please check my parts list.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#dce4e8] bg-white px-6 text-sm font-semibold text-[#17252d] outline-none transition hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Ask an engineer
              </a>
            )}
          </div>
          <dl className="mt-10 flex max-w-md gap-8 border-t border-[#dce4e8] pt-6">
            {[
              { v: stats.products, l: "products" },
              { v: stats.categories, l: "categories" },
              { v: stats.brands, l: "brands" },
            ].map((s) => (
              <div key={s.l}>
                <dd className={`${HEADING_FONT} text-2xl font-semibold tabular-nums text-[#17252d]`}>{s.v || "-"}</dd>
                <dt className="mt-0.5 text-xs text-[#56656f]">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Collage */}
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <ul className="grid grid-cols-2 gap-3 sm:gap-4">
            {tiles.map((p, i) => (
              <li key={p.id} className={i % 2 === 1 ? "mt-6 sm:mt-10" : ""}>
                <Link
                  href={`/shop/product/${p.id}`}
                  className="group block overflow-hidden rounded-2xl border border-[#dce4e8] bg-white shadow-[0_14px_40px_-22px_rgba(23,37,45,0.35)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-20px_rgba(23,37,45,0.4)] focus-visible:ring-2 focus-visible:ring-[#0874cf] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="aspect-[4/3]">
                    <ProductArt name={p.name} brand={p.brand} category={p.category} categorySlug={p.categorySlug} image={p.image} variant="hero" eager={i < 2} />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                    <span className="hidden min-w-0 truncate text-[13px] font-medium text-[#17252d] sm:block">{p.category}</span>
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#0874cf]">
                      <span className="mr-1 hidden font-normal text-[#56656f] sm:inline">from</span>
                      {formatShopMoney(p.price, p.currency)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {tiles.length === 0 &&
              [0, 1, 2, 3].map((i) => (
                <li key={i} className={i % 2 === 1 ? "mt-6 sm:mt-10" : ""} aria-hidden="true">
                  <div className="aspect-[4/3] animate-pulse rounded-2xl bg-white/70 motion-reduce:animate-none" />
                </li>
              ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
