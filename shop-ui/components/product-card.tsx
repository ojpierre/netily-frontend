"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/shop-ui/lib/products"
import { useCart } from "@/shop-ui/lib/cart-context"
import { formatShopMoney } from "@/shop-ui/lib/currency"
import { availability, HEADING_FONT, isOnSale, savePercent } from "@/shop-ui/lib/shop-helpers"
import { ProductArt } from "./product-art"

interface ProductCardProps {
  product: Product
  /** Fixed-width card for horizontal rails. */
  rail?: boolean
  priority?: boolean
}

export function ProductCard({ product, rail = false, priority = false }: ProductCardProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const onSale = isOnSale(product)
  const pct = savePercent(product)
  const stock = availability(product)

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.image,
      category: product.category,
      selectedStorage: "Standard",
      selectedColor: "Default",
    })
    toast.success(`Added to cart: ${product.name}`)
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1800)
  }

  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dce4e8] bg-white transition duration-200 hover:border-[#b9c9d1] hover:shadow-[0_10px_30px_-12px_rgba(23,37,45,0.22)] motion-reduce:transition-none ${
        rail ? "w-[240px] shrink-0 snap-start sm:w-[264px]" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b border-[#eef2f4] bg-[#f3f7f8]">
        <div className="h-full w-full transition duration-300 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <ProductArt
            name={product.name}
            brand={product.brand}
            category={product.category}
            categorySlug={product.categorySlug}
            image={product.image}
            eager={priority}
          />
        </div>
        {onSale && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-[#22a67d] px-2.5 py-1 text-[11px] font-semibold leading-none text-white shadow-sm">
            Save {pct}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0874cf]">{product.brand || product.category}</p>
        <h3 className={`${HEADING_FONT} mt-1 line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-[1.35] text-[#17252d]`}>
          <Link
            href={`/shop/product/${product.id}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-[#0874cf] focus-visible:after:ring-offset-2"
          >
            {product.name}
          </Link>
        </h3>
        {product.summary && <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-[#56656f]">{product.summary}</p>}

        <div className="mt-auto pt-4">
          <p className={`flex items-center gap-1.5 text-xs font-medium ${stock.inStock ? "text-[#168564]" : "text-[#56656f]"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stock.inStock ? "bg-[#22a67d]" : "bg-[#9aa8b0]"}`} aria-hidden="true" />
            {stock.label}
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-none tabular-nums text-[#17252d]">{formatShopMoney(product.price, product.currency)}</p>
              {onSale && (
                <p className="mt-1 text-xs tabular-nums text-[#56656f] line-through">{formatShopMoney(product.compareAtPrice as number, product.currency)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              className={`relative z-10 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white outline-none transition focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2 ${
                added ? "bg-[#22a67d]" : "bg-[#0874cf] hover:bg-[#075faa]"
              }`}
            >
              {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
              {added ? "Added" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton({ rail = false }: { rail?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[#dce4e8] bg-white ${rail ? "w-[240px] shrink-0 sm:w-[264px]" : ""}`} aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-[#eef3f5] motion-reduce:animate-none" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-16 rounded bg-[#eef3f5]" />
        <div className="h-4 w-4/5 rounded bg-[#eef3f5]" />
        <div className="h-3 w-full rounded bg-[#f3f7f8]" />
        <div className="h-5 w-24 rounded bg-[#eef3f5]" />
      </div>
    </div>
  )
}
