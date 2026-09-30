"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Search, SlidersHorizontal, Truck } from "lucide-react"
import {
  categories,
  getStoredOfferSlides,
  getStoredProducts,
  type Product,
  type ShopOfferSlide,
} from "@/shop-ui/lib/products"

const CATEGORY_ALIASES: Record<string, string[]> = {
  "Fiber Optics & OLT": ["Fiber Optics & OLT", "Fiber Optics & FTTH", "ONTs & Subscriber CPE"],
  "ONTs & Subscriber CPE": ["Fiber Optics & OLT", "ONTs & Subscriber CPE"],
  "Structured Cabling": ["Cabling & Infrastructure", "Structured Cabling"],
  "Access Points & Wi-Fi": ["Access Points & Wi-Fi", "Wireless & Backhaul"],
  "Power Backup & UPS": ["Power Backup & UPS", "Racks & Power"],
  "Tools & Test Equipment": ["Tools & Test Equipment", "Cabling & Infrastructure"],
}

const stockFilters = ["All Stock", "In Stock", "Out of Stock"] as const

function matchesCategory(product: Product, category: string) {
  if (category === "All") return true
  const allowed = CATEGORY_ALIASES[category] || [category]
  return allowed.includes(product.category)
}

function formatPrice(price: number) {
  return `$${Number(price).toLocaleString()} USD`
}

export function ShopCatalogExperience() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("cat") || "All"
  const initialQuery = searchParams.get("q") || ""

  const [products, setProducts] = useState<Product[]>(getStoredProducts)
  const [offers, setOffers] = useState<ShopOfferSlide[]>(getStoredOfferSlides)
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured")
  const [stockFilter, setStockFilter] = useState<(typeof stockFilters)[number]>("All Stock")

  useEffect(() => {
    const syncProducts = () => setProducts(getStoredProducts())
    const syncOffers = () => setOffers(getStoredOfferSlides())
    syncProducts()
    syncOffers()
    window.addEventListener("netily_products_updated", syncProducts)
    window.addEventListener("netily_shop_offers_updated", syncOffers)
    window.addEventListener("storage", syncProducts)
    window.addEventListener("storage", syncOffers)
    return () => {
      window.removeEventListener("netily_products_updated", syncProducts)
      window.removeEventListener("netily_shop_offers_updated", syncOffers)
      window.removeEventListener("storage", syncProducts)
      window.removeEventListener("storage", syncOffers)
    }
  }, [])

  useEffect(() => {
    if (offers.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % offers.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [offers.length])

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return products
      .filter((product) => {
        const inStock = product.inStock !== false
        const matchesStock =
          stockFilter === "All Stock" ||
          (stockFilter === "In Stock" && inStock) ||
          (stockFilter === "Out of Stock" && !inStock)
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          (product.brand || "").toLowerCase().includes(query)
        return matchesCategory(product, activeCategory) && matchesStock && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price
        if (sortBy === "price-desc") return b.price - a.price
        return 0
      })
  }, [activeCategory, products, searchTerm, sortBy, stockFilter])

  const currentOffer = offers[activeSlide] || offers[0]

  return (
    <>
      <section className="relative overflow-hidden bg-[#06183b] pt-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(27,94,255,0.42),transparent_36%),linear-gradient(135deg,#06183b_0%,#0a2e69_52%,#08111f_100%)]" />
        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentOffer?.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45 }}
              >
                <span className="mb-5 inline-flex items-center border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/80 backdrop-blur">
                  {currentOffer?.badge || "Internetily shop"}
                </span>
                <p className="mb-4 text-sm uppercase tracking-[0.28em] text-[#8ec5ff]">{currentOffer?.eyebrow}</p>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-6xl">
                  {currentOffer?.title}
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-white/76 md:text-lg">{currentOffer?.description}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={currentOffer?.href || "/shop/catalog"}
                    className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#1b5eff] px-6 text-sm font-semibold text-white transition hover:bg-[#0f48d8]"
                  >
                    {currentOffer?.ctaLabel || "Shop offers"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#catalog"
                    className="inline-flex min-h-12 items-center justify-center border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Browse catalog
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-10 flex items-center gap-3">
              {offers.map((offer, index) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show offer ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-12 bg-white" : "w-5 bg-white/35"}`}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden border border-white/15 bg-white/8 shadow-2xl shadow-black/25">
            {currentOffer && (
              <Image
                src={currentOffer.image}
                alt={currentOffer.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06183b]/85 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Verified", "Hardware checked"],
                ["Dispatch", "Regional delivery"],
                ["Support", "ISP-ready advice"],
              ].map(([title, copy]) => (
                <div key={title} className="border border-white/15 bg-black/25 p-3 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">{title}</p>
                  <p className="mt-1 text-xs text-white/70">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-background py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="border border-border bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-[#1b5eff]" />
                Catalog filters
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search routers, OLTs, cable..."
                      className="h-11 w-full border border-border bg-muted/30 pl-9 pr-3 text-sm outline-none transition focus:border-[#1b5eff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Categories</label>
                  <div className="grid gap-1.5">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`flex min-h-10 items-center justify-between border px-3 text-left text-xs font-medium transition ${
                          activeCategory === category
                            ? "border-[#1b5eff] bg-[#1b5eff] text-white"
                            : "border-border bg-white text-foreground hover:border-[#1b5eff]/50 hover:bg-[#f2f6ff]"
                        }`}
                      >
                        <span>{category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  <select
                    value={stockFilter}
                    onChange={(event) => setStockFilter(event.target.value as (typeof stockFilters)[number])}
                    className="h-10 border border-border bg-muted/30 px-3 text-xs outline-none focus:border-[#1b5eff]"
                    aria-label="Stock filter"
                  >
                    {stockFilters.map((filter) => (
                      <option key={filter} value={filter}>{filter}</option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                    className="h-10 border border-border bg-muted/30 px-3 text-xs outline-none focus:border-[#1b5eff]"
                    aria-label="Sort products"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </aside>

            <div>
              <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#1b5eff]">Shop catalog</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-[-0.02em]">ISP hardware, ready for deployment</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} items
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeCategory}-${searchTerm}-${sortBy}-${stockFilter}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop/product/${product.id}`}
                      className="group border border-border bg-white p-3 transition hover:-translate-y-1 hover:border-[#1b5eff]/60 hover:shadow-xl hover:shadow-[#1b5eff]/10"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1b5eff]">
                          {product.brand || "Netily"}
                        </div>
                      </div>
                      <div className="space-y-3 px-1 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{product.category}</p>
                          <span className={`text-[10px] font-semibold uppercase ${product.inStock === false ? "text-red-600" : "text-emerald-600"}`}>
                            {product.inStock === false ? "Out" : "In stock"}
                          </span>
                        </div>
                        <h3 className="min-h-12 text-lg font-semibold leading-snug group-hover:text-[#1b5eff]">{product.name}</h3>
                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>
                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <span className="text-base font-semibold">{formatPrice(product.price)}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b5eff]">
                            View
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              </AnimatePresence>

              {filteredProducts.length === 0 && (
                <div className="border border-border bg-white p-10 text-center">
                  <h3 className="text-xl font-semibold">No matching products</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Try another category, search term, or stock filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("All")
                      setSearchTerm("")
                      setStockFilter("All Stock")
                    }}
                    className="mt-5 min-h-11 bg-[#1b5eff] px-5 text-sm font-semibold text-white"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 border border-[#1b5eff]/20 bg-[#f3f7ff] p-4 text-sm text-[#12336e] md:grid-cols-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#1b5eff]" />
              Genuine hardware verification
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-[#1b5eff]" />
              Delivery planning for ISP projects
            </div>
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-[#1b5eff]" />
              Filters built for network teams
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
