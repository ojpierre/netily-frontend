"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { ShopCategory } from "@/shop-ui/lib/shop-api"
import { categoryHref, HEADING_FONT } from "@/shop-ui/lib/shop-helpers"
import { ProductArt } from "./product-art"

export function CategoryGrid({ categories, counts }: { categories: ShopCategory[]; counts: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((c) => {
        const count = counts[c.slug] ?? c.product_count ?? 0
        return (
          <li key={c.slug}>
            <Link
              href={categoryHref(c.slug)}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dce4e8] bg-white outline-none transition hover:border-[#b9c9d1] hover:shadow-[0_10px_30px_-14px_rgba(23,37,45,0.25)] focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <div className="aspect-[16/10] overflow-hidden border-b border-[#eef2f4]">
                <div className="h-full w-full transition duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <ProductArt name={c.name} category={c.name} categorySlug={c.slug} image={c.image} variant="card" showLabel={false} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`${HEADING_FONT} text-[15px] font-semibold leading-snug text-[#17252d] sm:text-base`}>{c.name}</h3>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#56656f] transition group-hover:text-[#0874cf]" aria-hidden="true" />
                </div>
                {c.description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#56656f]">{c.description}</p>}
                <p className="mt-auto pt-3 text-xs font-medium tabular-nums text-[#0874cf]">
                  {count} {count === 1 ? "product" : "products"}
                </p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
