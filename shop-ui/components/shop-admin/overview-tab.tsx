"use client"

import { AlertTriangle, ArrowRight, Banknote, Boxes, Eye, FolderTree, ImageOff, LayoutTemplate, Package, Plus, ShoppingBag, Truck } from "lucide-react"
import { isLowStock, ksh, formatDateTime, type AdminOrder, type AdminProduct, type ProductFilterPreset, type ShopStats, type Tab } from "./types"
import { Btn, EmptyState, Pill, Skeleton, card, cx, focusRing } from "./ui"
import { OrderStatusPills, customerName } from "./orders-tab"
import type { ReactNode } from "react"

type Kpi = { label: string; value: string; note: string; icon: ReactNode; tone: string; onClick?: () => void; alert?: boolean }

export function OverviewTab({
  stats,
  products,
  recentOrders,
  loading,
  onAddProduct,
  onEditProduct,
  onGo,
  onOpenProducts,
}: {
  stats: ShopStats
  products: AdminProduct[]
  recentOrders: AdminOrder[]
  loading: boolean
  onAddProduct: () => void
  onEditProduct: (p: AdminProduct) => void
  onGo: (tab: Tab) => void
  onOpenProducts: (preset: ProductFilterPreset) => void
}) {
  const live = products.filter((p) => p.is_active).length
  const noPhoto = products.filter((p) => !p.image)
  const stockIssues = products.filter((p) => p.is_active && isLowStock(p))
  const outOfStock = stockIssues.filter((p) => p.stock_quantity === 0).length
  const toAct = Number(stats.to_fulfil ?? 0)

  const kpis: Kpi[] = [
    { label: "Paid revenue", value: ksh(Number(stats.revenue_kes ?? 0)), note: `${ksh(Number(stats.revenue_kes_30d ?? 0))} in the last 30 days`, icon: <Banknote className="h-4 w-4" />, tone: "text-emerald-300 bg-emerald-500/10" },
    { label: "Orders to action", value: String(toAct), note: toAct ? "Paid or being processed" : "Nothing waiting. Nice.", icon: <Truck className="h-4 w-4" />, tone: "text-sky-300 bg-sky-500/10", onClick: () => onGo("orders"), alert: toAct > 0 },
    { label: "Products live", value: String(live), note: `${products.length - live} hidden of ${products.length}`, icon: <Package className="h-4 w-4" />, tone: "text-violet-300 bg-violet-500/10", onClick: () => onOpenProducts({ status: "live" }) },
    { label: "Without a photo", value: String(noPhoto.length), note: noPhoto.length ? "Cards show a placeholder" : "Every product has a photo", icon: <ImageOff className="h-4 w-4" />, tone: "text-amber-300 bg-amber-500/10", onClick: () => onOpenProducts({ missingPhoto: true }), alert: noPhoto.length > 0 },
    { label: "Low or out of stock", value: String(stockIssues.length), note: stockIssues.length ? `${outOfStock} out, 5 or fewer left` : "Stock levels look healthy", icon: <Boxes className="h-4 w-4" />, tone: "text-rose-300 bg-rose-500/10", onClick: () => onOpenProducts({ lowStock: true }), alert: stockIssues.length > 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => {
          const body = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{k.label}</span>
                <span className={cx("grid h-7 w-7 place-items-center rounded-lg", k.tone)}>{k.icon}</span>
              </div>
              {loading ? <Skeleton className="mt-3 h-7 w-24" /> : <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{k.value}</p>}
              <p className="mt-1 text-xs text-slate-500">{k.note}</p>
            </>
          )
          return k.onClick ? (
            <button key={k.label} type="button" onClick={k.onClick} className={cx(card, "p-4 text-left transition-colors hover:border-violet-500/40 hover:bg-slate-900", focusRing)}>{body}</button>
          ) : (
            <div key={k.label} className={cx(card, "p-4")}>{body}</div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={cx(card, "overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Recent orders</h3>
            <Btn size="sm" variant="ghost" onClick={() => onGo("orders")}>All orders <ArrowRight className="h-3.5 w-3.5" /></Btn>
          </div>
          {loading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : recentOrders.length === 0 ? (
            <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title="No orders yet">Orders will appear here as soon as customers check out.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-800/80">
              {recentOrders.map((o) => (
                <li key={o.reference}>
                  <button type="button" onClick={() => onGo("orders")} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-slate-800/30 focus-visible:bg-slate-800/40 focus-visible:outline-none">
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-sm font-semibold text-white">{o.reference}</p>
                      <p className="truncate text-xs text-slate-500">{customerName(o)} · {formatDateTime(o.created_at)}</p>
                    </div>
                    <div className="flex gap-1.5"><OrderStatusPills o={o} /></div>
                    <span className="ml-auto text-sm font-semibold tabular-nums text-white">{ksh(o.total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className={cx(card, "p-4")}>
            <h3 className="text-sm font-semibold text-white">Quick actions</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Btn variant="primary" onClick={onAddProduct} className="justify-start"><Plus className="h-4 w-4" /> Add a product</Btn>
              <Btn onClick={() => onGo("storefront")} className="justify-start"><LayoutTemplate className="h-4 w-4" /> Edit storefront</Btn>
              <Btn onClick={() => onGo("categories")} className="justify-start"><FolderTree className="h-4 w-4" /> Manage categories</Btn>
              <a href="/shop" target="_blank" rel="noreferrer" className={cx("inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 text-sm font-medium text-slate-100 hover:bg-slate-800", focusRing)}><Eye className="h-4 w-4" /> View the shop</a>
            </div>
          </section>

          <section className={cx(card, "p-4")}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-300" aria-hidden />
              <h3 className="text-sm font-semibold text-white">Needs attention</h3>
            </div>
            {loading ? (
              <div className="mt-3 space-y-2"><Skeleton className="h-9" /><Skeleton className="h-9" /></div>
            ) : noPhoto.length === 0 && stockIssues.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Everything looks good. All products have photos and healthy stock.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {stockIssues.slice(0, 4).map((p) => (
                  <li key={`s-${p.slug}`}>
                    <button type="button" onClick={() => onEditProduct(p)} className={cx("flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-800/60", focusRing)}>
                      <span className="truncate text-slate-200">{p.name}</span>
                      <Pill tone={p.stock_quantity === 0 ? "red" : "amber"}>{p.stock_quantity === 0 ? "Out of stock" : `${p.stock_quantity} left`}</Pill>
                    </button>
                  </li>
                ))}
                {noPhoto.slice(0, 4).map((p) => (
                  <li key={`n-${p.slug}`}>
                    <button type="button" onClick={() => onEditProduct(p)} className={cx("flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-800/60", focusRing)}>
                      <span className="truncate text-slate-200">{p.name}</span>
                      <Pill tone="slate">Add photo</Pill>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {(Number(stats.pending ?? 0) > 0 || Number(stats.failed ?? 0) > 0) && (
              <p className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-400">
                {Number(stats.pending ?? 0)} awaiting payment, {Number(stats.failed ?? 0)} failed payments.{" "}
                <button type="button" onClick={() => onGo("orders")} className="text-violet-300 hover:text-violet-200">Review orders</button>
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
