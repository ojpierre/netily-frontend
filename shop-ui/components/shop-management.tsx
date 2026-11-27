"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, BarChart3, FolderTree, LayoutTemplate, Package, RefreshCw, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { shopAdminApi, fetchAllProducts, type ShopAdminApi } from "./shop-admin/api"
import { CategoriesTab } from "./shop-admin/categories-tab"
import { OrdersTab } from "./shop-admin/orders-tab"
import { OverviewTab } from "./shop-admin/overview-tab"
import { ProductEditor } from "./shop-admin/product-editor"
import { ProductsTab } from "./shop-admin/products-tab"
import { StorefrontSettingsTab } from "./shop-admin/settings-tab"
import { errText, type AdminCategory, type AdminOrder, type AdminProduct, type ProductFilterPreset, type ShopSettings, type ShopStats, type Tab } from "./shop-admin/types"
import { cx, focusRing } from "./shop-admin/ui"

type EditorState = { product: AdminProduct | null; template: AdminProduct | null; key: number }

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "storefront", label: "Storefront", icon: LayoutTemplate },
]

const byOrder = (a: AdminCategory, b: AdminCategory) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)

export function ShopManagement({ api = shopAdminApi }: { embedded?: boolean; api?: ShopAdminApi }) {
  const [tab, setTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [loadErrors, setLoadErrors] = useState<string[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [stats, setStats] = useState<ShopStats>({})
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([])
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [preset, setPreset] = useState<{ value: ProductFilterPreset; key: number }>({ value: {}, key: 0 })

  const loadAll = useCallback(async () => {
    setLoadErrors([])
    const [prods, cats, st, set, orders] = await Promise.allSettled([
      fetchAllProducts(api),
      api.listCategories(),
      api.getStats(),
      api.getSettings(),
      api.listOrders({ page_size: "6" }),
    ])
    const errors: string[] = []
    if (prods.status === "fulfilled") setProducts(prods.value)
    else errors.push(`Products: ${errText(prods.reason)}`)
    if (cats.status === "fulfilled") setCategories(cats.value.results.slice().sort(byOrder))
    else errors.push(`Categories: ${errText(cats.reason)}`)
    if (st.status === "fulfilled") setStats(st.value)
    else errors.push(`Summary: ${errText(st.reason)}`)
    if (set.status === "fulfilled") setSettings(set.value)
    else errors.push(`Storefront settings: ${errText(set.reason)}`)
    if (orders.status === "fulfilled") setRecentOrders(orders.value.results)
    else errors.push(`Orders: ${errText(orders.reason)}`)
    setLoadErrors(errors)
    setLoading(false)
  }, [api])

  useEffect(() => { void loadAll() }, [loadAll])

  const refreshOrdersData = useCallback(() => {
    api.getStats().then(setStats).catch(() => {})
    api.listOrders({ page_size: "6" }).then((r) => setRecentOrders(r.results)).catch(() => {})
  }, [api])

  const brands = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.brand && set.add(p.brand))
    categories.forEach((c) => c.featured_brands.forEach((b) => set.add(b)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products, categories])

  // ── Products ──

  const patchProduct = useCallback(
    async (p: AdminProduct, patch: Partial<AdminProduct>, message: string) => {
      const keys = Object.keys(patch) as (keyof AdminProduct)[]
      const previous = Object.fromEntries(keys.map((k) => [k, p[k]])) as Partial<AdminProduct>
      setProducts((list) => list.map((x) => (x.slug === p.slug ? { ...x, ...patch } : x)))
      try {
        const saved = await api.updateProduct(p.slug, patch)
        setProducts((list) => list.map((x) => (x.slug === p.slug ? { ...x, ...saved } : x)))
        toast.success(message)
      } catch (e) {
        setProducts((list) => list.map((x) => (x.slug === p.slug ? { ...x, ...previous } : x)))
        toast.error(`${errText(e)} Your change was undone.`)
      }
    },
    [api],
  )

  const deleteProduct = useCallback(
    async (p: AdminProduct) => {
      try {
        await api.deleteProduct(p.slug)
        setProducts((list) => list.filter((x) => x.slug !== p.slug))
        toast.success(`${p.name} deleted`)
      } catch (e) {
        toast.error(errText(e))
      }
    },
    [api],
  )

  const upsertProduct = useCallback((saved: AdminProduct) => {
    setProducts((list) => {
      const exists = list.some((x) => x.slug === saved.slug)
      const next = exists ? list.map((x) => (x.slug === saved.slug ? { ...x, ...saved } : x)) : [...list, saved]
      return next.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    })
  }, [])

  const openEditor = (product: AdminProduct | null, template: AdminProduct | null = null) => setEditor({ product, template, key: Date.now() })

  const openProducts = (value: ProductFilterPreset) => {
    setPreset({ value, key: preset.key + 1 })
    setTab("products")
  }

  const toAction = Number(stats.to_fulfil ?? 0)

  return (
    <div className="min-w-0 space-y-5 text-slate-100">
      <div role="tablist" aria-label="Shop sections" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              id={`shop-tab-${t.id}`}
              aria-selected={active}
              aria-controls={`shop-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cx(
                "relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                focusRing,
                active ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40" : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <t.icon className="h-4 w-4" aria-hidden />
              {t.label}
              {t.id === "orders" && toAction > 0 && (
                <span className={cx("rounded-full px-1.5 text-[10px] font-semibold tabular-nums", active ? "bg-white/25" : "bg-sky-500/20 text-sky-300")} aria-label={`${toAction} to action`}>{toAction}</span>
              )}
            </button>
          )
        })}
      </div>

      {loadErrors.length > 0 && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium text-amber-100">Part of the shop console could not load</p>
              <p className="mt-1 text-xs text-amber-200/80">{loadErrors.join(" | ")}</p>
            </div>
          </div>
          <button type="button" onClick={() => { setLoading(true); void loadAll() }} className={cx("inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100", focusRing)}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      )}

      <div role="tabpanel" id={`shop-panel-${tab}`} aria-labelledby={`shop-tab-${tab}`}>
        {tab === "overview" && (
          <OverviewTab
            stats={stats}
            products={products}
            recentOrders={recentOrders}
            loading={loading}
            onAddProduct={() => openEditor(null)}
            onEditProduct={(p) => openEditor(p)}
            onGo={setTab}
            onOpenProducts={openProducts}
          />
        )}
        {tab === "products" && (
          <ProductsTab
            key={preset.key}
            products={products}
            categories={categories}
            loading={loading}
            preset={preset.value}
            onAdd={() => openEditor(null)}
            onEdit={(p) => openEditor(p)}
            onDuplicate={(p) => openEditor(null, p)}
            onPatch={(p, patch, message) => void patchProduct(p, patch, message)}
            onDelete={deleteProduct}
          />
        )}
        {tab === "categories" && (
          <CategoriesTab
            api={api}
            categories={categories}
            products={products}
            loading={loading}
            onUpsert={(c) => setCategories((list) => (list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]).sort(byOrder))}
            onRemove={(id) => setCategories((list) => list.filter((c) => c.id !== id))}
          />
        )}
        {tab === "orders" && <OrdersTab api={api} stats={stats} refreshKey={0} onChanged={refreshOrdersData} />}
        {tab === "storefront" && <StorefrontSettingsTab api={api} settings={settings} loading={loading} onSaved={setSettings} />}
      </div>

      {editor && (
        <ProductEditor
          key={editor.key}
          api={api}
          categories={categories}
          brands={brands}
          product={editor.product}
          template={editor.template}
          onSaved={upsertProduct}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}
