"use client"

import { useEffect, useState } from "react"
import { customerApi } from "@/lib/customer-api"
import { getPaymentLocale, type PaymentLocale } from "@/lib/tenant-locale"

let localeRequest: Promise<PaymentLocale> | null = null

export function useCustomerPaymentLocale(): { locale: PaymentLocale; ready: boolean } {
  const [locale, setLocale] = useState<PaymentLocale>(() => getPaymentLocale())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!localeRequest) {
      localeRequest = customerApi.getPlans()
        .then((result) => getPaymentLocale(result.branding?.country, result.branding?.base_currency))
        .catch(() => {
          localeRequest = null
          return getPaymentLocale()
        })
    }
    void localeRequest.then((value) => { setLocale(value); setReady(true) })
  }, [])

  return { locale, ready }
}
