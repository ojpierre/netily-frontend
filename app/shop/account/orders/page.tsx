"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { AccountSidebar } from "@/shop-ui/components/account-sidebar"
import { OrdersList } from "@/shop-ui/components/orders-list"
import { djangoApi, MOCK_ORDERS, DjangoOrder } from "@/shop-ui/lib/django-api"

export default function OrdersPage() {
  const [orders, setOrders] = useState<DjangoOrder[]>(MOCK_ORDERS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await djangoApi.getOrders()
        setOrders(data)
      } catch (err) {
        setOrders(MOCK_ORDERS)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background text-foreground pt-24 lg:pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground block mb-2">
                Procurement Archive
              </span>
              <h1 className="font-serif text-3xl lg:text-4xl mb-2">
                Equipment Orders & Invoices
              </h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Track past hardware dispatches, invoice statuses, and carrier tracking numbers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs tracking-wider uppercase text-muted-foreground border border-border px-3 py-1.5">
                Total Orders: <strong className="text-foreground">{orders.length}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            <AccountSidebar />

            <div className="flex-1">
              <OrdersList orders={orders} />
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter />
    </>
  )
}
