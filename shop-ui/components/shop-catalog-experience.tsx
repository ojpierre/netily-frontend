"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Search, SlidersHorizontal, Truck } from "lucide-react"
import { useShopCatalog } from "@/shop-ui/lib/use-shop-catalog"
import { formatShopMoney } from "@/shop-ui/lib/currency"

const stockFilters = ["All Stock", "In Stock", "Out of Stock"] as const

function formatPrice(price: number, currency = "KES") {
  return formatShopMoney(price, currency)
}

export function ShopCatalogExperience() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("cat") || "All"
  const initialQuery = searchParams.get("q") || ""

  const { products, categories, loading, error } = useShopCatalog()
  const categoryNames = useMemo(() => ["All", ...categories.map((c) => c.name)], [categories])
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured")
  const [stockFilter, setStockFilter] = useState<(typeof stockFilters)[number]>("All Stock")

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
        return (activeCategory === "All" || product.category === activeCategory) && matchesStock && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price
        if (sortBy === "price-desc") return b.price - a.price
        return 0
      })
  }, [activeCategory, products, searchTerm, sortBy, stockFilter])

  return (
    <>
      <section id="catalog" className="bg-background pb-10 pt-24 md:pb-14 lg:pt-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-2xl border border-border bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
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
                      className="h-11 w-full rounded-xl border border-border bg-muted/30 pl-9 pr-3 text-sm outline-none transition focus:border-[#1b5eff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Categories</label>
                  <div className="grid gap-1.5">
                    {categoryNames.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`flex min-h-10 items-center justify-between rounded-xl border px-3 text-left text-xs font-medium transition ${
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
                    className="h-10 rounded-xl border border-border bg-muted/30 px-3 text-xs outline-none focus:border-[#1b5eff]"
                    aria-label="Stock filter"
                  >
                    {stockFilters.map((filter) => (
                      <option key={filter} value={filter}>{filter}</option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                    className="h-10 rounded-xl border border-border bg-muted/30 px-3 text-xs outline-none focus:border-[#1b5eff]"
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
                  <h2 className="mt-1 text-3xl font-semibold">Deployment-ready hardware, phones & laptops</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} items
                </p>
              </div>

              {loading && <p className="py-10 text-center text-sm text-muted-foreground">Loading products...</p>}
              {error && <p className="py-10 text-center text-sm text-red-700">{error}</p>}

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
                      className="group rounded-2xl border border-border bg-white p-3 transition hover:-translate-y-1 hover:border-[#1b5eff]/60 hover:shadow-xl hover:shadow-[#1b5eff]/10"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase text-[#1b5eff]">
                            {product.brand || "Netily"}
                          </span>
                          {product.isFeatured && (
                            <span className="rounded-full bg-[#1b5eff] px-2.5 py-1 text-[10px] font-semibold uppercase text-white">
                              Popular
                            </span>
                          )}
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
                          <span className="text-base font-semibold">{formatPrice(product.price, product.currency)}</span>
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

              {!loading && !error && filteredProducts.length === 0 && (
                <div className="rounded-2xl border border-border bg-white p-10 text-center">
                  <h3 className="text-xl font-semibold">No matching products</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Try another category, search term, or stock filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("All")
                      setSearchTerm("")
                      setStockFilter("All Stock")
                    }}
                    className="mt-5 min-h-11 rounded-full bg-[#1b5eff] px-5 text-sm font-semibold text-white"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid rounded-2xl border border-[#1b5eff]/20 bg-[#f3f7ff] p-4 text-sm text-[#12336e] md:grid-cols-3">
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
