"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Copy, ExternalLink, ImageOff, Package, Pencil, Plus, Search, Star, Trash2 } from "lucide-react"
import { isLowStock, isOnSale, ksh, savePercent, type AdminCategory, type AdminProduct, type ProductFilterPreset } from "./types"
import { Btn, EmptyState, IconBtn, Pagination, Pill, Skeleton, Switch, card, cx, focusRing, inputCls, ConfirmDialog, PageHeader } from "./ui"

const PAGE_SIZE = 20

function Thumb({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-800 bg-slate-100">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-contain" />
      ) : (
        <ImageOff className="h-4 w-4 text-slate-400" aria-label="No photo" />
      )}
    </div>
  )
}

function StockCell({ p, onSave }: { p: AdminProduct; onSave: (qty: number) => void }) {
  const [draft, setDraft] = useState(String(p.stock_quantity))
  useEffect(() => setDraft(String(p.stock_quantity)), [p.stock_quantity])
  if (!p.track_stock) return <span className="text-xs text-slate-500">Not tracked</span>
  const commit = () => {
    const n = Number(draft)
    if (Number.isInteger(n) && n >= 0) {
      if (n !== p.stock_quantity) onSave(n)
    } else setDraft(String(p.stock_quantity))
  }
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={draft}
        aria-label={`Stock for ${p.name}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur())}
        className={cx(inputCls, "h-8 w-16 px-2 py-1 text-center", p.stock_quantity <= 5 && "border-amber-500/60")}
      />
      {p.stock_quantity === 0 ? <Pill tone="red">Out</Pill> : p.stock_quantity <= 5 ? <Pill tone="amber"><AlertTriangle className="h-3 w-3" />Low</Pill> : null}
    </div>
  )
}

export function ProductsTab({
  products,
  categories,
  loading,
  preset,
  onAdd,
  onEdit,
  onDuplicate,
  onPatch,
  onDelete,
}: {
  products: AdminProduct[]
  categories: AdminCategory[]
  loading: boolean
  preset?: ProductFilterPreset
  onAdd: () => void
  onEdit: (p: AdminProduct) => void
  onDuplicate: (p: AdminProduct) => void
  onPatch: (p: AdminProduct, patch: Partial<AdminProduct>, message: string) => void
  onDelete: (p: AdminProduct) => Promise<void>
}) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState<"all" | "live" | "hidden">(preset?.status ?? "all")
  const [missingPhoto, setMissingPhoto] = useState(!!preset?.missingPhoto)
  const [onSale, setOnSale] = useState(!!preset?.onSale)
  const [lowStock, setLowStock] = useState(!!preset?.lowStock)
  const [featured, setFeatured] = useState(!!preset?.featured)
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const counts = useMemo(
    () => ({
      missing: products.filter((p) => !p.image).length,
      sale: products.filter(isOnSale).length,
      low: products.filter(isLowStock).length,
      featured: products.filter((p) => p.is_featured).length,
    }),
    [products],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (category && String(p.category) !== category) return false
      if (status === "live" && !p.is_active) return false
      if (status === "hidden" && p.is_active) return false
      if (missingPhoto && p.image) return false
      if (onSale && !isOnSale(p)) return false
      if (lowStock && !isLowStock(p)) return false
      if (featured && !p.is_featured) return false
      return !q || p.name.toLowerCase().includes(q) || p.slug.includes(q) || (p.brand || "").toLowerCase().includes(q) || (p.category_name || "").toLowerCase().includes(q)
    })
  }, [products, search, category, status, missingPhoto, onSale, lowStock, featured])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const anyFilter = !!(search || category || status !== "all" || missingPhoto || onSale || lowStock || featured)
  const reset = () => { setSearch(""); setCategory(""); setStatus("all"); setMissingPhoto(false); setOnSale(false); setLowStock(false); setFeatured(false); setPage(1) }
  const filterChange = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1) }

  const chip = (active: boolean, label: string, count: number, toggle: () => void) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => { toggle(); setPage(1) }}
      className={cx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors", focusRing, active ? "border-violet-500/60 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-300 hover:bg-slate-800")}
    >
      {label}
      <span className={cx("rounded-full px-1.5 text-[10px] tabular-nums", active ? "bg-violet-500/30" : "bg-slate-800 text-slate-400")}>{count}</span>
    </button>
  )

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await onDelete(toDelete)
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description={`${products.length} ${products.length === 1 ? "product" : "products"} in the catalogue`}
        actions={<Btn variant="primary" onClick={onAdd}><Plus className="h-4 w-4" /> Add product</Btn>}
      />

      <div className={cx(card, "space-y-3 p-3 sm:p-4")}>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, brand or category" aria-label="Search products" className={cx(inputCls, "pl-9")} />
          </div>
          <select value={category} onChange={(e) => filterChange(setCategory)(e.target.value)} aria-label="Filter by category" className={inputCls}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={status} onChange={(e) => filterChange(setStatus)(e.target.value as typeof status)} aria-label="Filter by status" className={inputCls}>
            <option value="all">Live and hidden</option>
            <option value="live">Live only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chip(missingPhoto, "Missing photo", counts.missing, () => setMissingPhoto((v) => !v))}
          {chip(onSale, "On sale", counts.sale, () => setOnSale((v) => !v))}
          {chip(lowStock, "Low or out of stock", counts.low, () => setLowStock((v) => !v))}
          {chip(featured, "Featured", counts.featured, () => setFeatured((v) => !v))}
          {anyFilter && <button type="button" onClick={reset} className={cx("rounded text-xs text-violet-300 hover:text-violet-200", focusRing)}>Clear filters</button>}
        </div>
      </div>

      <div className={cx(card, "overflow-hidden")}>
        <div className="hidden grid-cols-[minmax(0,2.6fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_150px_132px] gap-3 border-b border-slate-800 bg-slate-950/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
          <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Live / Featured</span><span className="text-right">Actions</span>
        </div>

        {loading && products.length === 0 ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState icon={<Package className="h-5 w-5" />} title="No products yet" action={<Btn variant="primary" onClick={onAdd}><Plus className="h-4 w-4" /> Add your first product</Btn>}>
            Run <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">python manage.py import_shop_catalog</code> to load the starter range, or add your first product.
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" />} title="No products match" action={<Btn onClick={reset}>Clear filters</Btn>}>
            Try a different search or remove some filters.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-800/80">
            {rows.map((p) => {
              const pct = savePercent(Number(p.price), Number(p.compare_at_price))
              return (
                <li key={p.slug} className="grid gap-3 px-4 py-3 transition-colors hover:bg-slate-800/30 lg:grid-cols-[minmax(0,2.6fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_150px_132px] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <Thumb src={p.image} name={p.name} />
                    <div className="min-w-0">
                      <button type="button" onClick={() => onEdit(p)} className={cx("block max-w-full truncate rounded text-left text-sm font-medium text-white hover:text-violet-300", focusRing)}>{p.name}</button>
                      <p className="truncate text-xs text-slate-500">
                        {p.brand || "No brand"}
                        {!p.image && <span className="ml-2 text-amber-400">No photo</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 lg:text-slate-400"><span className="mr-1 text-xs text-slate-500 lg:hidden">Category:</span>{p.category_name || categories.find((c) => c.id === p.category)?.name || "-"}</div>
                  <div className="text-sm">
                    <span className="font-medium text-white">{ksh(p.price)}</span>
                    {pct > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 line-through">{ksh(p.compare_at_price)}</span>
                        <Pill tone="green">-{pct}%</Pill>
                      </span>
                    )}
                  </div>
                  <div><StockCell p={p} onSave={(qty) => onPatch(p, { stock_quantity: qty }, "Stock updated")} /></div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <Switch checked={p.is_active} label={`${p.name} live on shop`} onChange={(v) => onPatch(p, { is_active: v }, v ? "Now live on the shop" : "Hidden from the shop")} />
                      <span className="lg:sr-only">{p.is_active ? "Live" : "Hidden"}</span>
                    </label>
                    <button
                      type="button"
                      aria-pressed={p.is_featured}
                      aria-label={p.is_featured ? `Remove ${p.name} from featured` : `Feature ${p.name}`}
                      title={p.is_featured ? "Featured" : "Not featured"}
                      onClick={() => onPatch(p, { is_featured: !p.is_featured }, p.is_featured ? "Removed from featured" : "Added to featured")}
                      className={cx("grid h-8 w-8 place-items-center rounded-lg transition-colors", focusRing, p.is_featured ? "bg-amber-500/15 text-amber-300" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200")}
                    >
                      <Star className={cx("h-4 w-4", p.is_featured && "fill-current")} />
                    </button>
                  </div>
                  <div className="flex items-center justify-start gap-0.5 lg:justify-end">
                    <IconBtn label={`Edit ${p.name}`} onClick={() => onEdit(p)}><Pencil className="h-4 w-4" /></IconBtn>
                    <IconBtn label={`Duplicate ${p.name}`} onClick={() => onDuplicate(p)}><Copy className="h-4 w-4" /></IconBtn>
                    <a href={`/shop/product/${p.slug}`} target="_blank" rel="noreferrer" aria-label={`View ${p.name} on the shop`} title="View on the shop" className={cx("grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white", focusRing)}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <IconBtn label={`Delete ${p.name}`} className="hover:text-red-300" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></IconBtn>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <Pagination page={current} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      <ConfirmDialog
        open={!!toDelete}
        destructive
        loading={deleting}
        title={`Delete ${toDelete?.name ?? "this product"}?`}
        description="It will disappear from the shop for good. Past orders keep their line items. If you only want to pause sales, hide it instead."
        confirmLabel="Delete product"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
