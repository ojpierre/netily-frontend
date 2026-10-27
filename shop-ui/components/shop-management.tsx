"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BarChart3, Boxes, ExternalLink, FolderTree, Package, Pencil, Plus, RefreshCw, Search, ShoppingBag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { superadminApi } from "@/lib/superadmin-api"
import { formatShopMoney } from "@/shop-ui/lib/currency"

type Tab = "overview" | "orders" | "products" | "add" | "categories" | "inventory"

type AdminCategory = { id: number; name: string; slug: string; is_active: boolean }
type AdminProduct = {
  id: number; slug: string; name: string; category: number; category_name: string
  price: string; currency: string; image: string; stock_quantity: number; track_stock: boolean
  is_active: boolean; warranty: string; long_description: string; made_in: string; is_featured: boolean
}
type AdminOrder = {
  reference: string; status: string; payment_status: string; payment_method: string
  first_name: string; last_name: string; email: string; phone: string
  address: string; city: string; country: string; notes: string
  total: string; currency: string; amount_kes: number; mpesa_receipt: string; created_at: string
  items?: { name: string; quantity: number; selected_storage: string; selected_color: string; line_total: string }[]
}

const LOW_STOCK = 5
const ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "expired"]
const NEXT_STATUS: Record<string, string[]> = {
  pending_payment: ["cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
}
const EMPTY_FORM = {
  name: "", category: "", price: "", stock_quantity: "0", image: "",
  long_description: "", warranty: "", made_in: "",
}
const errText = (e: unknown) => (e instanceof Error ? e.message : "Request failed")
const label = (s: string) => s.replace(/_/g, " ")
const input = "w-full rounded-xl border border-border bg-muted/20 p-3 text-sm focus:border-foreground focus:outline-none"

export function ShopManagement(_props: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stats, setStats] = useState<Record<string, number | string>>({})
  const [loadErrors, setLoadErrors] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const [productSearch, setProductSearch] = useState("")
  const [lowOnly, setLowOnly] = useState(false)
  const [orderStatus, setOrderStatus] = useState("")
  const [orderSearch, setOrderSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, AdminOrder>>({})

  const [form, setForm] = useState(EMPTY_FORM)
  const [newCategory, setNewCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)

  const refreshStats = useCallback(() => {
    superadminApi.getShopStats().then(setStats).catch(() => {})
  }, [])

  const loadAll = useCallback(async () => {
    setLoadErrors([])
    const [categoriesResult, productsResult, statsResult] = await Promise.allSettled([
      superadminApi.getShopCategories(),
      superadminApi.getShopProducts({ page_size: "200" }),
      superadminApi.getShopStats(),
    ])
    const errors: string[] = []
    if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value.results)
    else errors.push(`Categories: ${errText(categoriesResult.reason)}`)
    if (productsResult.status === "fulfilled") setProducts(productsResult.value.results)
    else errors.push(`Products: ${errText(productsResult.reason)}`)
    if (statsResult.status === "fulfilled") setStats(statsResult.value)
    else errors.push(`Summary: ${errText(statsResult.reason)}`)
    setLoadErrors(errors)
    setLoading(false)
  }, [])

  const loadOrders = useCallback(async () => {
    const params: Record<string, string> = { page_size: "100" }
    if (orderStatus) params.status = orderStatus
    if (orderSearch.trim()) params.search = orderSearch.trim()
    try {
      setOrders((await superadminApi.getShopOrders(params)).results)
    } catch (e) {
      toast.error(errText(e))
    }
  }, [orderStatus, orderSearch])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    const t = setTimeout(loadOrders, 300)
    return () => clearTimeout(t)
  }, [loadOrders])
  useEffect(() => {
    if (!form.category && categories.length) setForm((f) => ({ ...f, category: String(categories[0].id) }))
  }, [categories, form.category])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    return products.filter((p) => {
      if (lowOnly && !(p.track_stock && p.stock_quantity <= LOW_STOCK)) return false
      return !q || p.name.toLowerCase().includes(q) || p.slug.includes(q) || p.category_name.toLowerCase().includes(q)
    })
  }, [products, productSearch, lowOnly])

  const lowStock = useMemo(
    () => products.filter((p) => p.is_active && p.track_stock && p.stock_quantity <= LOW_STOCK),
    [products]
  )

  async function patchProduct(p: AdminProduct, data: Record<string, unknown>, ok: string) {
    setBusy(p.slug)
    try {
      const updated = await superadminApi.updateShopProduct(p.slug, data)
      setProducts((list) => list.map((x) => (x.slug === p.slug ? { ...x, ...updated } : x)))
      toast.success(ok)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  async function removeProduct(p: AdminProduct) {
    if (!window.confirm(`Delete "${p.name}"? Past orders keep their line items. Unpublish instead if unsure.`)) return
    setBusy(p.slug)
    try {
      await superadminApi.deleteShopProduct(p.slug)
      setProducts((list) => list.filter((x) => x.slug !== p.slug))
      toast.success("Product deleted")
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  async function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    try {
      const c = await superadminApi.createShopCategory({ name })
      setCategories((list) => [...list, c])
      setNewCategory("")
      toast.success("Category added")
    } catch (e) {
      toast.error(errText(e))
    }
  }

  async function toggleCategory(category: AdminCategory) {
    setBusy(`category-${category.id}`)
    try {
      const updated = await superadminApi.updateShopCategory(category.id, { is_active: !category.is_active })
      setCategories((list) => list.map((item) => item.id === category.id ? { ...item, ...updated } : item))
      toast.success(category.is_active ? "Category hidden" : "Category published")
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  function startNewProduct() {
    setEditingSlug(null)
    setForm({ ...EMPTY_FORM, category: form.category || String(categories[0]?.id || "") })
    setTab("add")
  }

  function editProduct(product: AdminProduct) {
    setEditingSlug(product.slug)
    setForm({
      name: product.name,
      category: String(product.category),
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      image: product.image || "",
      long_description: product.long_description || "",
      warranty: product.warranty || "",
      made_in: product.made_in || "",
    })
    setTab("add")
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock_quantity)
    if (!form.name.trim()) { toast.error("Enter a product name"); return }
    if (!form.category) { toast.error("Create or choose a category first"); return }
    if (!Number.isFinite(price) || price <= 0) { toast.error("Enter a valid KES price"); return }
    if (!Number.isInteger(stock) || stock < 0) { toast.error("Stock must be a whole number"); return }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        category: Number(form.category),
        price: price.toFixed(2),
        currency: "KES",
        stock_quantity: stock,
        track_stock: true,
        image: form.image.trim(),
        long_description: form.long_description.trim(),
        warranty: form.warranty.trim(),
        made_in: form.made_in.trim(),
      }
      if (!editingSlug) payload.is_active = true
      if (editingSlug) await superadminApi.updateShopProduct(editingSlug, payload)
      else await superadminApi.createShopProduct(payload)
      toast.success(editingSlug ? "Product changes saved" : "Product published")
      setEditingSlug(null)
      setForm({ ...EMPTY_FORM, category: form.category })
      await loadAll()
      setTab("products")
    } catch (err) {
      toast.error(errText(err))
    } finally {
      setSaving(false)
    }
  }

  async function toggleOrder(ref: string) {
    if (expanded === ref) { setExpanded(null); return }
    setExpanded(ref)
    if (!details[ref]) {
      try {
        const d = await superadminApi.getShopOrder(ref)
        setDetails((m) => ({ ...m, [ref]: d }))
      } catch (e) {
        toast.error(errText(e))
      }
    }
  }

  async function changeStatus(o: AdminOrder, status: string) {
    if (!window.confirm(`Move ${o.reference} to "${label(status)}"?`)) return
    setBusy(o.reference)
    try {
      const u = await superadminApi.setShopOrderStatus(o.reference, status)
      setOrders((l) => l.map((x) => (x.reference === o.reference ? { ...x, ...u } : x)))
      refreshStats()
      toast.success(`${o.reference} is now ${label(status)}`)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  async function markPaid(o: AdminOrder) {
    const receipt = window.prompt("M-Pesa receipt code (optional). Only use this after verifying the payment.")
    if (receipt === null) return
    setBusy(o.reference)
    try {
      const u = await superadminApi.markShopOrderPaid(o.reference, receipt.trim())
      setOrders((l) => l.map((x) => (x.reference === o.reference ? { ...x, ...u } : x)))
      refreshStats()
      toast.success(`${o.reference} marked paid`)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "products", label: "Products", icon: Package },
    { id: "add", label: "Add product", icon: Plus },
    { id: "categories", label: "Categories", icon: FolderTree },
    { id: "inventory", label: "Inventory", icon: Boxes },
  ]

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading shop data...</p>

  return (
    <div className="grid gap-5 text-foreground lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border border-border bg-card p-3 lg:sticky lg:top-24">
        <p className="px-3 pb-3 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Shop workspace</p>
        <div className="grid gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => t.id === "add" ? startNewProduct() : setTab(t.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
              tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
        </div>
        <div className="mt-3 border-t border-border p-3 text-[11px] leading-5 text-muted-foreground">Catalog and order data is live. Storefront merchandising remains frontend-managed.</div>
      </aside>

      <div className="min-w-0 space-y-6">

      {loadErrors.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="font-medium">Part of shop management could not load</p><p className="mt-1 text-xs text-muted-foreground">{loadErrors.join(" | ")}</p></div></div>
          <button onClick={() => void loadAll()} className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { t: "Paid revenue", v: `KES ${Number(stats.revenue_kes ?? 0).toLocaleString()}`, s: `${stats.paid ?? 0} paid orders` },
              { t: "Awaiting payment", v: stats.pending ?? 0, s: "Pending STK or unpaid" },
              { t: "To fulfil", v: stats.to_fulfil ?? 0, s: "Paid or processing" },
              { t: "Low stock", v: lowStock.length, s: `${LOW_STOCK} or fewer left` },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.t}</p>
                <p className="mt-2 font-serif text-2xl">{c.v}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.s}</p>
              </div>
            ))}
          </div>
          {lowStock.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 font-serif text-lg">Needs restocking</h3>
              <ul className="space-y-2 text-sm">
                {lowStock.slice(0, 10).map((p) => (
                  <li key={p.slug} className="flex justify-between border-b border-border/40 pb-2 last:border-0">
                    <span>{p.name}</span>
                    <span className={p.stock_quantity === 0 ? "text-red-600" : "text-amber-600"}>{p.stock_quantity} left</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider">
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
              Low stock only
            </label>
            <button onClick={startNewProduct} className="flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs uppercase text-background">
              <Plus className="h-3.5 w-3.5" /> Add product
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProducts.map((p) => (
                  <tr key={p.slug} className={busy === p.slug ? "opacity-60" : ""}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-serif text-sm">{p.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category_name}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatShopMoney(p.price, p.currency)}</td>
                    <td className="px-4 py-3 text-center">
                      {p.track_stock ? (
                        <input
                          type="number"
                          min={0}
                          key={p.stock_quantity}
                          defaultValue={p.stock_quantity}
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (Number.isInteger(v) && v >= 0 && v !== p.stock_quantity) patchProduct(p, { stock_quantity: v }, "Stock updated")
                          }}
                          className={`w-20 rounded-lg border bg-muted/20 px-2 py-1 text-center ${p.stock_quantity <= LOW_STOCK ? "border-amber-500" : "border-border"}`}
                        />
                      ) : (
                        <span className="text-muted-foreground">Not tracked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => patchProduct(p, { is_active: !p.is_active }, p.is_active ? "Unpublished" : "Published")}
                        className={`rounded-full border px-2.5 py-1 text-[10px] uppercase ${
                          p.is_active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "Live" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/shop/product/${p.slug}`} className="rounded-full border border-border p-1.5 text-muted-foreground hover:bg-muted" title="View in shop">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => editProduct(p)} className="rounded-full border border-border p-1.5 text-muted-foreground hover:bg-muted" title="Edit product">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeProduct(p)} className="rounded-full border border-border p-1.5 text-red-600 hover:bg-red-500/10" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "add" && (
        <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div>
            <h2 className="font-serif text-2xl">{editingSlug ? "Edit product" : "Add product"}</h2>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{editingSlug ? "Update catalog details, price, imagery, and stock." : "Goes live on the storefront immediately."}</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Categories ({categories.length})</p>
            <div className="flex gap-2">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name, e.g. Routers & Gateways" className={input} />
              <button type="button" onClick={addCategory} className="shrink-0 rounded-xl border border-border px-4 text-xs uppercase hover:bg-muted">Add</button>
            </div>
          </div>

          <form onSubmit={saveProduct} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Price (KES) *</label>
                <input type="number" min="1" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Stock quantity</label>
                <input type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className={input} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Image path or URL</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/shop-assets/products/mikrotik_router.jpg" className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea rows={4} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} className={input} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Warranty</label>
                <input value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="2-Year Warranty" className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Made in</label>
                <input value={form.made_in} onChange={(e) => setForm({ ...form, made_in: e.target.value })} className={input} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={() => { setEditingSlug(null); setTab("products") }} className="rounded-full border border-border px-5 py-2.5 text-xs uppercase hover:bg-muted">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-full bg-foreground px-6 py-2.5 text-xs uppercase text-background disabled:opacity-50">
                {saving ? "Saving..." : editingSlug ? "Save changes" : "Publish product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">New category name</label>
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="For example, Routers & Gateways" className={input} />
            </div>
            <button type="button" onClick={addCategory} className="h-11 rounded-lg bg-foreground px-5 text-sm font-medium text-background">Add category</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-[1fr_90px_110px] border-b border-border bg-muted/30 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[1fr_120px_120px_130px]"><span>Category</span><span className="hidden sm:block">Products</span><span>Status</span><span className="text-right">Action</span></div>
            {categories.map((category) => {
              const productCount = products.filter((product) => product.category === category.id).length
              return <div key={category.id} className={`grid grid-cols-[1fr_90px_110px] items-center border-b border-border/60 px-4 py-3 text-sm last:border-0 sm:grid-cols-[1fr_120px_120px_130px] ${busy === `category-${category.id}` ? "opacity-50" : ""}`}><div><p className="font-medium">{category.name}</p><p className="text-xs text-muted-foreground">/{category.slug}</p></div><span className="hidden text-muted-foreground sm:block">{productCount}</span><span className={category.is_active ? "text-emerald-600" : "text-muted-foreground"}>{category.is_active ? "Published" : "Hidden"}</span><button onClick={() => toggleCategory(category)} className="justify-self-end rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">{category.is_active ? "Hide" : "Publish"}</button></div>
            })}
          </div>
          <p className="text-xs text-muted-foreground">Categories with products are hidden instead of deleted, preserving product and order history.</p>
        </div>
      )}

      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Inventory</h2><p className="text-xs text-muted-foreground">Update live stock counts without opening each product.</p></div><button onClick={() => setLowOnly((value) => !value)} className={`rounded-lg border px-4 py-2 text-xs font-medium ${lowOnly ? "border-amber-500 bg-amber-500/10 text-amber-700" : "border-border"}`}>{lowOnly ? "Showing low stock" : "Show low stock only"}</button></div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-center">Available</th><th className="px-4 py-3 text-right">Storefront</th></tr></thead><tbody className="divide-y divide-border/60">{filteredProducts.map((product) => <tr key={product.slug}><td className="px-4 py-3 font-medium">{product.name}</td><td className="px-4 py-3 text-muted-foreground">{product.category_name}</td><td className="px-4 py-3 text-center">{product.track_stock ? <input type="number" min={0} key={product.stock_quantity} defaultValue={product.stock_quantity} onBlur={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 0 && value !== product.stock_quantity) patchProduct(product, { stock_quantity: value }, "Stock updated") }} className={`w-24 rounded-lg border px-2 py-1.5 text-center ${product.stock_quantity <= LOW_STOCK ? "border-amber-500 bg-amber-50" : "border-border"}`} /> : <span className="text-xs text-muted-foreground">Not tracked</span>}</td><td className="px-4 py-3 text-right">{product.is_active ? "Published" : "Hidden"}</td></tr>)}</tbody></table></div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row">
            <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search reference, email, phone, receipt..." className={input} />
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={`${input} sm:w-56`}>
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {orders.map((o) => {
              const d = details[o.reference]
              const canMarkPaid = o.payment_status !== "paid" && (o.status === "pending_payment" || o.status === "expired")
              return (
                <div key={o.reference} className={`rounded-2xl border border-border bg-card ${busy === o.reference ? "opacity-60" : ""}`}>
                  <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <button onClick={() => toggleOrder(o.reference)} className="min-w-0 text-left">
                      <p className="font-mono text-sm font-semibold">{o.reference}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.first_name} {o.last_name} · {o.phone} · {new Date(o.created_at).toLocaleString()}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-2.5 py-1 text-[10px] uppercase">{label(o.status)}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase ${
                        o.payment_status === "paid" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                        : o.payment_status === "failed" ? "border-red-500/40 bg-red-500/10 text-red-600"
                        : "border-border bg-muted"
                      }`}>{o.payment_status}</span>
                      <span className="font-serif text-base">{formatShopMoney(o.total, o.currency)}</span>
                      {o.currency !== "KES" && <span className="text-[11px] text-muted-foreground">Charged KES {o.amount_kes.toLocaleString()}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3">
                    {(NEXT_STATUS[o.status] || []).map((s) => (
                      <button key={s} onClick={() => changeStatus(o, s)} className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase hover:bg-muted">
                        → {label(s)}
                      </button>
                    ))}
                    {canMarkPaid && (
                      <button onClick={() => markPaid(o)} className="rounded-full border border-amber-500/50 px-3 py-1.5 text-[11px] uppercase text-amber-700 hover:bg-amber-500/10">
                        Mark paid manually
                      </button>
                    )}
                    {o.mpesa_receipt && <span className="ml-auto self-center font-mono text-[11px] text-muted-foreground">M-Pesa {o.mpesa_receipt}</span>}
                  </div>

                  {expanded === o.reference && (
                    <div className="space-y-3 border-t border-border/60 bg-muted/10 p-4 text-xs">
                      <p className="text-muted-foreground">
                        Ship to: <span className="text-foreground">{o.address}, {o.city}, {o.country}</span> · {o.email}
                      </p>
                      {o.notes && <p className="text-muted-foreground">Notes: <span className="text-foreground">{o.notes}</span></p>}
                      {!d && <p className="text-muted-foreground">Loading items...</p>}
                      {d?.items?.map((i, idx) => (
                        <div key={idx} className="flex justify-between border-b border-border/40 pb-2 last:border-0">
                          <span>{i.name} × {i.quantity}{i.selected_storage ? ` · ${i.selected_storage}` : ""}{i.selected_color ? ` · ${i.selected_color}` : ""}</span>
                          <span>{formatShopMoney(i.line_total, o.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {orders.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No orders match.</p>}
          </div>
          <p className="text-[11px] text-muted-foreground">Showing the 100 most recent matches. Use search to find older orders.</p>
        </div>
      )}
      </div>
    </div>
  )
}
