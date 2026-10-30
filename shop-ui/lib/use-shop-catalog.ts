"use client"
import { useEffect, useState } from "react"
import type { Product } from "./products"
import { shopApi, type PublicShopSettings, type ShopCategory } from "./shop-api"
import { featuredCatalog, featuredCategories } from "./featured-catalog"

export function useShopCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [settings, setSettings] = useState<PublicShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      shopApi.getProducts({ page_size: "200" }),
      shopApi.getCategories(),
      shopApi.getSettings().catch(() => null),
    ])
      .then(([p, c, s]) => {
        if (cancelled) return
        const apiIds = new Set(p.results.map((product) => product.id))
        setProducts([...p.results, ...featuredCatalog.filter((product) => !apiIds.has(product.id))])
        setCategories([...c, ...featuredCategories.filter((category) => !c.some((item) => item.name === category.name))])
        setSettings(s)
      })
      .catch(() => {
        if (cancelled) return
        setProducts(featuredCatalog)
        setCategories(featuredCategories)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  return { products, categories, settings, loading, error }
}
