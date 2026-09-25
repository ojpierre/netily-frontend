"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { products as defaultProducts, getStoredProducts, type Product } from "@/shop-ui/lib/products"

export function CollectionGrid() {
  const [activeProducts, setActiveProducts] = useState<Product[]>(defaultProducts)

  useEffect(() => {
    setActiveProducts(getStoredProducts())
    const handleUpdate = () => {
      setActiveProducts(getStoredProducts())
    }
    window.addEventListener("netily_products_updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)
    return () => {
      window.removeEventListener("netily_products_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [])

  const featured = activeProducts.slice(0, 6)
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24"
        >
          <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3 block">
            Featured Hardware • Netily Shop
          </span>
          <h2 className="font-serif text-3xl lg:text-5xl mb-4">Curated Collection</h2>
          <p className="text-muted-foreground tracking-wide max-w-md mx-auto leading-relaxed">
            Carrier-grade routing, precision GPON optics, certified structured cabling, and pro engineering tech.
          </p>
        </motion.div>

        {/* Asymmetrical editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {featured.map((product, index) => {
            const offsets = ["lg:pt-12", "", "lg:pt-24", "", "lg:pt-16", "lg:-mt-8"]
            return (
              <motion.div
                key={product.id}
                className={offsets[index] ?? ""}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
              >
                <Link href={`/shop/product/${product.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-4 border border-border">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading={index < 2 ? "eager" : "lazy"}
                      className="object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" />
                    {/* Quick view overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <div className="bg-background/95 backdrop-blur-sm py-2.5 text-center text-xs tracking-[0.15em] uppercase border border-border">
                        View Hardware Specs
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
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16 lg:mt-24"
        >
          <Link
            href="/shop/catalog"
            className="inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase border-b border-foreground pb-1 hover:gap-4 transition-all duration-300"
          >
            View All {activeProducts.length} Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
