"use client"

import { useMemo, useRef } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Smartphone,
  Truck,
} from "lucide-react"
import type { Product } from "@/shop-ui/lib/products"
import { useShopCatalog } from "@/shop-ui/lib/use-shop-catalog"
import { featuredCategories } from "@/shop-ui/lib/featured-catalog"
import { formatShopMoney } from "@/shop-ui/lib/currency"
import {
  brandHref,
  categoryHref,
  countByBrand,
  HEADING_FONT,
  isOnSale,
  productInCategory,
  saveAmount,
} from "@/shop-ui/lib/shop-helpers"
import { useShopSettings } from "@/shop-ui/lib/use-shop-settings"
import { HeroSection } from "./hero-section"
import { CategoryGrid } from "./category-grid"
import { ProductCard, ProductCardSkeleton } from "./product-card"
import { ProductArt } from "./product-art"
import { ShopFaq } from "./shop-faq"

const trust = [
  { icon: Smartphone, title: "Pay with M-Pesa", copy: "Approve one prompt on your phone." },
  { icon: Truck, title: "Delivery across Kenya", copy: "We confirm dispatch once payment clears." },
  { icon: BadgeCheck, title: "Genuine brands", copy: "MikroTik, Ubiquiti, TP-Link, VSOL and more." },
  { icon: Headphones, title: "ISP engineers on WhatsApp", copy: "Get your parts list checked before you buy." },
]

interface Project {
  id: string
  title: string
  copy: string
  href: string
  ids: string[]
  fallbackCat: string
}

const projects: Project[] = [
  {
    id: "hotspot",
    title: "Start a WiFi hotspot business",
    copy: "A router to run the hotspot, an outdoor access point to cover the estate, and PoE power to the mast.",
    href: categoryHref("outdoor-wireless"),
    ids: ["mikrotik-hex-s-rb760igs", "ruijie-reyee-rg-rap52-od", "ruijie-reyee-rg-poe-at30"],
    fallbackCat: "outdoor-wireless",
  },
  {
    id: "ftth",
    title: "Roll out fibre (FTTH)",
    copy: "An OLT at the hub, ONTs at the customer, a splicer for the joins, plus cable and connectors for the run.",
    href: categoryHref("fiber-optics-olt"),
    ids: ["vsol-v1600gs-r-gpon-olt", "zte-f660v9-xpon-ont", "signal-fire-ai-5-pro-fusion-splicer"],
    fallbackCat: "fiber-optics-olt",
  },
  {
    id: "office",
    title: "Office and home Wi-Fi",
    copy: "Access points and routers that give every room a steady signal, without a tangle of extenders.",
    href: categoryHref("wireless-access-points"),
    ids: ["ruijie-reyee-rg-rap2260g", "ruijie-reyee-rg-ew1200", "ruijie-reyee-rg-es206gs-p"],
    fallbackCat: "wireless-access-points",
  },
  {
    id: "blackout",
    title: "Keep the internet on during blackouts",
    copy: "A battery to carry your router through an outage, and Starlink where fibre and mobile coverage run thin.",
    href: categoryHref("power-protection"),
    ids: ["starlink-mini", "felicity-hope1000-portable-power-station", "redsun-1kwh-power-backup"],
    fallbackCat: "power-protection",
  },
]

function SectionHeader({ eyebrow, title, copy, href, cta }: { eyebrow?: string; title: string; copy?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0874cf]">{eyebrow}</p>}
        <h2 className={`${HEADING_FONT} mt-1.5 text-2xl font-semibold tracking-tight text-[#17252d] sm:text-3xl`}>{title}</h2>
        {copy && <p className="mt-2 text-[15px] leading-7 text-[#56656f]">{copy}</p>}
      </div>
      {href && cta && (
        <Link href={href} className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-[#0874cf] outline-none hover:text-[#075faa] focus-visible:ring-2 focus-visible:ring-[#0874cf]">
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

export function ShopStorefront() {
  const { products, categories, loading } = useShopCatalog()
  const settings = useShopSettings()
  const railRef = useRef<HTMLUListElement>(null)

  const cats = categories.length ? categories : featuredCategories
  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const c of cats) out[c.slug] = products.length ? products.filter((p) => productInCategory(p, c)).length : c.product_count ?? 0
    return out
  }, [cats, products])

  const brands = useMemo(() => countByBrand(products), [products])
  const namedBrands = brands.filter((b) => b.brand.toLowerCase() !== "generic")
  const featured = useMemo(() => {
    const f = products.filter((p) => p.isFeatured)
    return (f.length >= 4 ? f : products).slice(0, 8)
  }, [products])
  const deals = useMemo(() => products.filter(isOnSale).sort((a, b) => saveAmount(b) - saveAmount(a)).slice(0, 12), [products])

  const projectCards = useMemo(
    () =>
      projects.map((pr) => {
        const byId = pr.ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[]
        if (byId.length >= 3) return { ...pr, items: byId }
        const cat = cats.find((c) => c.slug === pr.fallbackCat)
        const extra = cat ? products.filter((p) => productInCategory(p, cat) && !byId.includes(p)) : []
        return { ...pr, items: [...byId, ...extra].slice(0, 3) }
      }),
    [products, cats],
  )

  function scrollRail(dir: 1 | -1) {
    const el = railRef.current
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" })
  }

  return (
    <div className="bg-white pt-[96px] text-[#17252d] lg:pt-[104px]">
      <HeroSection settings={settings} products={products} stats={{ products: products.length, categories: cats.length, brands: namedBrands.length }} />

      {/* Trust strip */}
      <section aria-label="Why buy here" className="border-b border-[#dce4e8] bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-5 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trust.map(({ icon: Icon, title, copy }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eaf4fc] text-[#0874cf]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-[13px] leading-5 text-[#56656f]">{copy}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8" aria-labelledby="cat-heading">
        <div id="cat-heading">
          <SectionHeader eyebrow="Shop by category" title="Everything a network needs, in eight aisles" href="/shop/catalog" cta="View all products" />
        </div>
        <CategoryGrid categories={cats} counts={counts} />
      </section>

      {/* Featured */}
      <section className="border-y border-[#dce4e8] bg-[#f3f7f8]" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div id="featured-heading">
            <SectionHeader
              eyebrow="Featured"
              title="What ISPs and installers buy most"
              copy="Routers, radios and OLTs that go into live networks every week."
              href="/shop/catalog"
              cta="Shop all"
            />
          </div>
          <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i}>
                    <ProductCardSkeleton />
                  </li>
                ))
              : featured.map((p, i) => (
                  <li key={p.id} className={i >= 4 ? "hidden min-w-0 sm:block" : "min-w-0"}>
                    <ProductCard product={p} priority={i < 4} />
                  </li>
                ))}
          </ul>
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8" aria-labelledby="deals-heading">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div id="deals-heading" className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#168564]">Deals</p>
              <h2 className={`${HEADING_FONT} mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl`}>Priced below the usual</h2>
              <p className="mt-2 text-[15px] leading-7 text-[#56656f]">
                {deals.length} {deals.length === 1 ? "item" : "items"} with a lower price than before. The saving is shown on each one.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                aria-label="Scroll deals left"
                className="hidden h-10 w-10 place-items-center rounded-lg border border-[#dce4e8] bg-white outline-none hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf] sm:grid"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                aria-label="Scroll deals right"
                className="hidden h-10 w-10 place-items-center rounded-lg border border-[#dce4e8] bg-white outline-none hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf] sm:grid"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <Link href="/shop/catalog?sale=1" className="ml-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0874cf] hover:text-[#075faa]">
                See all deals
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <ul ref={railRef} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]" tabIndex={0} aria-label="Deals">
            {deals.map((p) => (
              <li key={p.id} className="shrink-0 snap-start">
                <div className="relative">
                  <ProductCard product={p} rail />
                  <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold tabular-nums text-[#168564] shadow-sm">
                    Save {formatShopMoney(saveAmount(p), p.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Projects */}
      <section className="border-y border-[#dce4e8] bg-[#f3f7f8]" aria-labelledby="projects-heading">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div id="projects-heading">
            <SectionHeader eyebrow="Shop by project" title="Start with the job, not the part number" copy="Four common builds, with the equipment that goes into each." />
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {projectCards.map((pr) => (
              <li key={pr.id} className="flex flex-col rounded-xl border border-[#dce4e8] bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`${HEADING_FONT} text-lg font-semibold`}>{pr.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#56656f]">{pr.copy}</p>
                  </div>
                </div>
                <ul className="mt-5 grid grid-cols-3 gap-3">
                  {pr.items.map((p) => (
                    <li key={p.id} className="min-w-0">
                      <Link
                        href={`/shop/product/${p.id}`}
                        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#0874cf]"
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-lg border border-[#eef2f4]">
                          <ProductArt name={p.name} brand={p.brand} category={p.category} categorySlug={p.categorySlug} image={p.image} variant="glyph" showLabel={false} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs font-medium leading-4 text-[#17252d] group-hover:text-[#0874cf]">{p.name}</p>
                        <p className="mt-0.5 text-xs tabular-nums text-[#56656f]">{formatShopMoney(p.price, p.currency)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={pr.href} className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[#0874cf] outline-none hover:text-[#075faa] focus-visible:ring-2 focus-visible:ring-[#0874cf]">
                  Shop this project
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Brands */}
      {namedBrands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8" aria-labelledby="brands-heading">
          <div id="brands-heading">
            <SectionHeader eyebrow="Shop by brand" title="The names your engineers already trust" />
          </div>
          <ul className="flex flex-wrap gap-2.5">
            {namedBrands.map((b) => (
              <li key={b.brand}>
                <Link
                  href={brandHref(b.brand)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#dce4e8] bg-white px-4 py-2 text-sm font-medium text-[#17252d] outline-none transition hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
                >
                  {b.brand}
                  <span className="rounded-full bg-[#f3f7f8] px-2 py-0.5 text-xs tabular-nums text-[#56656f]">{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cross-sell */}
      <section className="px-4 sm:px-6 lg:px-8" aria-label="Internetily ISP billing">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#17252d] px-6 py-10 text-white sm:px-10 md:py-12">
          <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7cc4f5]">For ISP owners</p>
              <h2 className={`${HEADING_FONT} mt-2 text-2xl font-semibold tracking-tight sm:text-3xl`}>Running an ISP? Bill it with Internetily.</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/75">
                M-Pesa payments, MikroTik integration, and hotspot and PPPoE billing in one place. From KSh 500 a month, with a 2-day free trial.
              </p>
            </div>
            <div className="md:justify-self-end">
              <a
                href="https://netily.co.ke/"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-[#17252d] outline-none transition hover:bg-[#eaf4fc] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#17252d]"
              >
                Try Internetily free for 2 days
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8" aria-label="Frequently asked questions">
        <ShopFaq />
      </section>
    </div>
  )
}
