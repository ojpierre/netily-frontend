"use client"
import { useEffect, useState } from "react"
import type { Product } from "./products"
import { shopApi, type ShopCategory } from "./shop-api"

export function useShopCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([shopApi.getProducts({ page_size: "200" }), shopApi.getCategories()])
      .then(([p, c]) => {
        if (cancelled) return
        setProducts(p.results)
        setCategories(c)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not load products"))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  return { products, categories, loading, error }
}