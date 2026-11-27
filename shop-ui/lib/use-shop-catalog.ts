"use client"
import { useEffect, useState } from "react"
import type { Product } from "./products"
import { shopApi, type PublicShopSettings, type ShopCategory } from "./shop-api"
import { featuredCatalog, featuredCategories } from "./featured-catalog"

/**
 * Live catalogue from the shop API. The bundled starter catalogue is used only
 * when the API is unreachable or has no products yet, never merged in, so a
 * product a superadmin hides or deletes does not come back from the fallback.
 */
export function useShopCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [settings, setSettings] = useState<PublicShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      shopApi.getProducts({ page_size: "200" }),
      shopApi.getCategories(),
      shopApi.getSettings().catch(() => null),
    ])
      .then(([p, c, s]) => {
        if (cancelled) return
        setSettings(s)
        if (p.results.length) {
          setProducts(p.results)
          setCategories(c.filter((category) => (category.product_count ?? 1) > 0))
        } else {
          setProducts(featuredCatalog)
          setCategories(featuredCategories)
          setUsingFallback(true)
        }
      })
      .catch(() => {
        if (cancelled) return
        setProducts(featuredCatalog)
        setCategories(featuredCategories)
        setUsingFallback(true)
        setError("We could not reach the shop just now. Showing our standard range.")
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  return { products, categories, settings, loading, error, usingFallback }
}
