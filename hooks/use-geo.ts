"use client"

import { useState, useEffect } from "react"

// ─── Types ──────────────────────────────────────────────────────────────────
export interface GeoInfo {
  countryCode: string
  countryName: string
  currency: string
  currencySymbol: string
  /** Multiply KES amount by this to get local currency estimate */
  rateFromKES: number
  /** Local mobile-money brand names */
  paymentCopy: string
  flag: string
}

// ─── East Africa geo table ───────────────────────────────────────────────────
// Rates are approximate and updated periodically. Billing always happens in KES.
// Sources: XE.com / CBK — April 2026 cross-rates.
const GEO_TABLE: Record<string, GeoInfo> = {
  KE: {
    countryCode: "KE",
    countryName: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    rateFromKES: 1,
    paymentCopy: "M-Pesa STK Push",
    flag: "🇰🇪",
  },
  UG: {
    countryCode: "UG",
    countryName: "Uganda",
    currency: "UGX",
    currencySymbol: "USh",
    rateFromKES: 27.8,
    paymentCopy: "MTN MoMo & Airtel Money",
    flag: "🇺🇬",
  },
  TZ: {
    countryCode: "TZ",
    countryName: "Tanzania",
    currency: "TZS",
    currencySymbol: "TSh",
    rateFromKES: 2.85,
    paymentCopy: "M-Pesa Tanzania & Tigo Pesa",
    flag: "🇹🇿",
  },
  RW: {
    countryCode: "RW",
    countryName: "Rwanda",
    currency: "RWF",
    currencySymbol: "Fr",
    rateFromKES: 1.12,
    paymentCopy: "MTN MoMo & Airtel Money",
    flag: "🇷🇼",
  },
  ET: {
    countryCode: "ET",
    countryName: "Ethiopia",
    currency: "ETB",
    currencySymbol: "Br",
    rateFromKES: 0.73,
    paymentCopy: "Telebirr & CBEBirr",
    flag: "🇪🇹",
  },
  BI: {
    countryCode: "BI",
    countryName: "Burundi",
    currency: "BIF",
    currencySymbol: "Fr",
    rateFromKES: 37.6,
    paymentCopy: "Lumicash & EcoCash",
    flag: "🇧🇮",
  },
  SS: {
    countryCode: "SS",
    countryName: "South Sudan",
    currency: "SSP",
    currencySymbol: "£",
    rateFromKES: 0.18,
    paymentCopy: "M-Pesa & Airtel Money",
    flag: "🇸🇸",
  },
  NG: {
    countryCode: "NG",
    countryName: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    rateFromKES: 11.6,
    paymentCopy: "Paystack & Flutterwave",
    flag: "🇳🇬",
  },
}

const FALLBACK: GeoInfo = GEO_TABLE["KE"]
const STORAGE_KEY = "netily_geo_v2"
// localStorage: persists across sessions so the IP lookup only fires once per device
// Falls back to sessionStorage if localStorage is unavailable (e.g. incognito + blocked)
function readStorage(): GeoInfo | null {
  for (const store of [
    typeof localStorage !== "undefined" ? localStorage : null,
    typeof sessionStorage !== "undefined" ? sessionStorage : null,
  ]) {
    try {
      const raw = store?.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as GeoInfo
        if (parsed?.countryCode) return parsed
      }
    } catch {
      // blocked or parse error — try next
    }
  }
  return null
}

function writeStorage(value: GeoInfo): void {
  const json = JSON.stringify(value)
  for (const store of [
    typeof localStorage !== "undefined" ? localStorage : null,
    typeof sessionStorage !== "undefined" ? sessionStorage : null,
  ]) {
    try {
      store?.setItem(STORAGE_KEY, json)
      return // written successfully
    } catch {
      // quota exceeded or blocked — try next
    }
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useGeo() {
  const [geo, setGeoState] = useState<GeoInfo>(FALLBACK)
  const [loading, setLoading] = useState(false)
  const [overridden, setOverridden] = useState(false)

  useEffect(() => {
    // 1. Check persistent storage first — skip IP lookup if we have a saved preference
    const cached = readStorage()
    if (cached) {
      setGeoState(cached)
      return
    }

    // 2. Detect via ipapi.co with trial token (1,000 req/day)
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    fetch("https://ipapi.co/json/?token=0S9rn0ymMuzq4gISESx3lztbI8h0jKHJpPiiVK0WukzKrvI50D", {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        const code = (data.country_code || "KE").toUpperCase()
        const resolved = GEO_TABLE[code] ?? FALLBACK
        setGeoState(resolved)
        writeStorage(resolved)
      })
      .catch(() => {
        // Network error or abort — stay with fallback (KE)
      })
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  /** Format a KES amount in the detected local currency */
  const fmt = (kesAmount: number, showDisclaimer = false): string => {
    if (geo.rateFromKES === 1) {
      // Kenya — native KES
      return `KSh ${kesAmount.toLocaleString("en-KE")}`
    }
    const local = Math.round(kesAmount * geo.rateFromKES)
    const base = `${geo.currencySymbol} ${local.toLocaleString()}`
    return showDisclaimer ? `≈ ${base}` : base
  }

  /** Override the auto-detected country manually — persists to localStorage */
  const setCountry = (code: string) => {
    const resolved = GEO_TABLE[code.toUpperCase()] ?? FALLBACK
    setGeoState(resolved)
    setOverridden(true)
    writeStorage(resolved)
  }

  const isEastAfrica = geo.countryCode !== "KE" && !!GEO_TABLE[geo.countryCode]
  const isKES = geo.rateFromKES === 1

  return { geo, fmt, setCountry, loading, overridden, isEastAfrica, isKES, GEO_TABLE }
}
