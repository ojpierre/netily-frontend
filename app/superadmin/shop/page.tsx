"use client"
import { ShopManagement } from "@/shop-ui/components/shop-management"
export default function Page() {
  return (
    <div className="min-w-0">
      <h1 className="mb-2 text-2xl font-semibold">Shop management</h1>
      <p className="mb-6 text-sm text-slate-400">
        Catalog, offers, orders, and customer communication.
      </p>
      <ShopManagement embedded />
    </div>
  )
}
