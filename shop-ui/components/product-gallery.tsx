"use client"

import { useState } from "react"
import type { Product } from "@/shop-ui/lib/products"
import { ProductArt } from "./product-art"

/** Photos when the product has them, otherwise the category artwork. */
export function ProductGallery({ product }: { product: Pick<Product, "name" | "brand" | "category" | "categorySlug" | "image" | "hoverImage"> }) {
  const images = Array.from(new Set([product.image, product.hoverImage].filter(Boolean)))
  const [active, setActive] = useState(0)
  const current = images[Math.min(active, images.length - 1)] || ""

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#dce4e8] bg-white">
        <ProductArt
          key={current}
          name={product.name}
          brand={product.brand}
          category={product.category}
          categorySlug={product.categorySlug}
          image={current}
          variant="hero"
          eager
        />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3" aria-label="Product images">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`h-16 w-20 overflow-hidden rounded-lg border bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#0874cf] ${
                  i === active ? "border-[#0874cf] ring-1 ring-[#0874cf]" : "border-[#dce4e8] hover:border-[#9db3bf]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
