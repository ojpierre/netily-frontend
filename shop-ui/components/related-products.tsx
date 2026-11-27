"use client"

import type { Product } from "@/shop-ui/lib/products"
import { HEADING_FONT } from "@/shop-ui/lib/shop-helpers"
import { ProductCard } from "./product-card"

export function RelatedProducts({ products, title = "You may also need" }: { products: Product[]; title?: string }) {
  if (!products.length) return null
  return (
    <section className="border-t border-[#dce4e8] bg-[#f3f7f8]" aria-labelledby="related-heading">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <h2 id="related-heading" className={`${HEADING_FONT} text-2xl font-semibold tracking-tight text-[#17252d]`}>
          {title}
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <li key={p.id} className="min-w-0">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
