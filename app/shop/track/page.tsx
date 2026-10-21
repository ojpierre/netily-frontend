"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { shopApi, type OrderStatus } from "@/shop-ui/lib/shop-api"

function TrackInner() {
  const params = useSearchParams()
  const ref = params.get("ref") || ""
  const token = params.get("token") || ""
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setOrder(await shopApi.getOrderStatus(ref, token))
      setError("")
    } catch {
      setError("We couldn't find this order. Check your tracking link.")
    }
  }, [ref, token])

  useEffect(() => {
    if (!ref || !token) { setError("Missing order reference or tracking token."); return }
    load()
  }, [ref, token, load])

  useEffect(() => {
    if (!order || order.payment_status !== "pending" || order.status !== "pending_payment") return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [order, load])

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 pb-20 pt-32">
      <h1 className="font-serif text-3xl">Track your order</h1>
      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}
      {order && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm">
            <div className="flex justify-between border-b border-border/50 py-2"><span className="text-muted-foreground">Reference</span><span className="font-mono">{order.reference}</span></div>
            <div className="flex justify-between border-b border-border/50 py-2"><span className="text-muted-foreground">Order status</span><span className="capitalize">{order.status.replace("_", " ")}</span></div>
            <div className="flex justify-between border-b border-border/50 py-2"><span className="text-muted-foreground">Payment</span><span className="capitalize">{order.payment_status}</span></div>
            {order.mpesa_receipt && <div className="flex justify-between border-b border-border/50 py-2"><span className="text-muted-foreground">M-Pesa receipt</span><span className="font-mono">{order.mpesa_receipt}</span></div>}
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Total</span><span>${order.total.toLocaleString()} USD (KES {order.amount_kes.toLocaleString()})</span></div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between border-b border-border/40 py-3 text-sm last:border-0">
                <span>{i.name} × {i.quantity}</span>
                <span>${i.line_total.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {order.payment_status === "failed" && order.payment_failure_reason && (
            <p className="text-sm text-red-700">{order.payment_failure_reason}</p>
          )}
        </div>
      )}
      <Link href="/shop/catalog" className="mt-8 inline-block text-xs uppercase tracking-widest underline">Continue shopping</Link>
    </main>
  )
}

export default function TrackPage() {
  return (
    <>
      <Navigation />
      <Suspense fallback={<div className="min-h-screen" />}>
        <TrackInner />
      </Suspense>
      <PremiumFooter />
    </>
  )
}