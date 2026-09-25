"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import type { Product } from "@/lib/products"

interface RelatedProductsProps {
  products: Product[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <section className="py-16 md:py-24 border-t border-muted">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-serif text-2xl md:text-3xl mb-10 text-center">You May Also Like</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={`/product/${product.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-4">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-sm md:text-base group-hover:underline underline-offset-4">
                    {product.name}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">€{product.price.toLocaleString()}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
