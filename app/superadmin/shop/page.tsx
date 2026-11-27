"use client"
import { ShopManagement } from "@/shop-ui/components/shop-management"
export default function Page() {
  return (
    <div className="min-w-0">
      <h1 className="mb-1 text-2xl font-semibold">Shop management</h1>
      <p className="mb-6 text-sm text-slate-400">
        Products, orders and the storefront for the Netily shop, all in one place.
      </p>
      <ShopManagement embedded />
    </div>
  )
}
