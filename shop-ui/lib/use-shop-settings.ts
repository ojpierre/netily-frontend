"use client"
import { useEffect, useState } from "react"
import { shopApi, type PublicShopSettings } from "./shop-api"

let cache: PublicShopSettings | null | undefined
let inflight: Promise<PublicShopSettings | null> | null = null

function load() {
  if (cache !== undefined) return Promise.resolve(cache)
  if (!inflight) {
    inflight = shopApi
      .getSettings()
      .catch(() => null)
      .then((s) => {
        cache = s
        return s
      })
  }
  return inflight
}

/** Public shop settings, fetched once and shared. Null until loaded or when the API has none. */
export function useShopSettings() {
  const [settings, setSettings] = useState<PublicShopSettings | null>(cache ?? null)
  useEffect(() => {
    let cancelled = false
    load().then((s) => !cancelled && setSettings(s))
    return () => {
      cancelled = true
    }
  }, [])
  return settings
}
