"use client"

import { useEffect, useRef } from "react"
import { adminApi } from "@/lib/admin-api"

type PaymentResult = Awaited<ReturnType<typeof adminApi.checkSubscriptionPaymentStatus>>

export function useSubscriptionPaymentRecovery(
  paymentId: string | null,
  enabled: boolean,
  onActivated: (result: PaymentResult) => void,
) {
  const onActivatedRef = useRef(onActivated)
  useEffect(() => { onActivatedRef.current = onActivated }, [onActivated])

  useEffect(() => {
    if (!paymentId || !enabled) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const deadline = Date.now() + 180_000
    const check = async () => {
      if (cancelled || Date.now() >= deadline) return
      try {
        const result = await adminApi.checkSubscriptionPaymentStatus(paymentId)
        if (cancelled) return
        if (result.status === "completed" && result.subscription_activated === true) {
          adminApi.invalidateSubscriptionCache()
          onActivatedRef.current(result)
          return
        }
        if (result.status === "failed" || result.status === "cancelled") return
      } catch {
        // A dropped connection is not a failed payment; manual checking remains available.
      }
      if (!cancelled) timer = setTimeout(check, 5000)
    }
    timer = setTimeout(check, 5000)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [paymentId, enabled])
}
