"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { categories, getStoredProducts, type Product } from "@/shop-ui/lib/products"
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react"

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ShopContent />
    </Suspense>
  )
}

function ShopContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("cat") || "All"
  const searchQuery = searchParams.get("q") || ""

  const [allProducts, setAllProducts] = useState<Product[]>(getStoredProducts)
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured")

  useEffect(() => {
    setAllProducts(getStoredProducts())
    const handleUpdate = () => {
      setAllProducts(getStoredProducts())
    }
    window.addEventListener("netily_products_updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)
    return () => {
      window.removeEventListener("netily_products_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        const matchesCategory =
          activeCategory === "All" ||
          p.category === activeCategory ||
          (activeCategory === "Fiber Optics & FTTH" && (p.category === "Fiber Optics & OLT" || p.category === "Fiber Optics & FTTH")) ||
          (activeCategory === "Fiber Optics & OLT" && (p.category === "Fiber Optics & OLT" || p.category === "Fiber Optics & FTTH")) ||
          (activeCategory === "Structured Cabling" && (p.category === "Cabling & Infrastructure" || p.category === "Structured Cabling"))
        
        const matchesSearch =
          !searchTerm ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))

        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price
        if (sortBy === "price-desc") return b.price - a.price
        return 0
      })
  }, [activeCategory, searchTerm, sortBy])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Hero Banner */}
      <section className="relative h-[55vh] min-h-[420px] flex items-center justify-center overflow-hidden bg-foreground">
        <div className="absolute inset-0">
          <Image
            src="/shop-assets/shop_hero.png"
            alt="Netily Shop Enterprise Hardware Collection"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/35 to-foreground/75" />
        </div>

        <motion.div
          className="relative z-10 text-center text-white px-6 max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs tracking-[0.4em] uppercase text-white/70 mb-4 block">
            Netily Shop • Hardware Catalog
          </span>
          <h1 className="font-serif text-5xl md:text-7xl mb-6 text-white">The Collection</h1>
          <p className="text-base md:text-xl text-white/80 max-w-xl mx-auto leading-relaxed">
            Curated selection of carrier-grade routing, GPON fiber optics, Fluke-certified cabling, and pro workstations.
          </p>
        </motion.div>
      </section>

      {/* Category Filter & Search Bar */}
      <section className="border-b border-border bg-background sticky top-16 lg:top-20 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category tabs */}
            <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-xs tracking-[0.2em] uppercase transition-all duration-300 pb-1 whitespace-nowrap border-b-2 ${
                    activeCategory === category
                      ? "border-foreground text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>

            {/* Quick search and sort */}
            <div className="flex items-center gap-4 self-end md:self-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter gear..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border outline-none tracking-wider placeholder:text-muted-foreground"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="py-1.5 px-3 text-xs bg-muted/50 border border-border outline-none tracking-wider text-foreground cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-6 flex items-center justify-between text-xs tracking-widest uppercase text-muted-foreground">
            <span>Showing {filteredProducts.length} items</span>
            {activeCategory !== "All" && (
              <button
                onClick={() => setActiveCategory("All")}
                className="underline hover:text-foreground"
              >
                Clear Category Filter
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + searchTerm + sortBy}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: (index % 8) * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link href={`/shop/product/${product.id}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-4 border border-border">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        loading="lazy"
                        className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-0"
                      />
                      <Image
                        src={product.hoverImage || product.image || "/placeholder.svg"}
                        alt={`${product.name} alternate view`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        loading="lazy"
                        className="object-cover absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
                      />
                      {/* Subtle hover overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <div className="bg-background/95 backdrop-blur-sm py-2 text-center text-xs tracking-[0.15em] uppercase border border-border">
                          View Specifications
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs tracking-widest text-muted-foreground uppercase">{product.category}</p>
                      <h3 className="font-serif text-lg group-hover:underline underline-offset-4 transition-all">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ${product.price.toLocaleString()} <span className="text-xs">USD</span>
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <div className="text-center py-24 border border-border p-12">
              <h3 className="font-serif text-2xl mb-3">No Hardware Found</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Try selecting a different category or clearing your search filter.
              </p>
              <button
                onClick={() => {
                  setActiveCategory("All")
                  setSearchTerm("")
                }}
                className="px-6 py-3 text-xs tracking-[0.2em] uppercase bg-foreground text-background hover:opacity-90"
              >
                Reset Catalog
              </button>
            </div>
          )}
        </div>
      </section>

      {/* About CTA */}
      <section className="border-t border-border py-16 md:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-6">Why Choose Netily Shop?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Since 2018, we have partnered with MikroTik, Ubiquiti, and leading fiber manufacturers to ensure African ISPs receive 100% genuine hardware with factory warranties and same-day dispatch.
          </p>
          <Link
            href="/shop/heritage"
            className="inline-flex items-center gap-2 text-sm tracking-widest uppercase border-b border-foreground pb-1 hover:gap-4 transition-all duration-300"
          >
            Our Story & NOC Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <PremiumFooter />
    </main>
  )
}
