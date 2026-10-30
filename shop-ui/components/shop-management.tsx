"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BarChart3, Boxes, CreditCard, ExternalLink, FolderTree, LayoutTemplate, Package, Pencil, Plus, RefreshCw, Save, Search, ShoppingBag, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { superadminApi, type ShopSettings } from "@/lib/superadmin-api"
import { formatShopMoney } from "@/shop-ui/lib/currency"

type Tab = "overview" | "content" | "orders" | "payments" | "products" | "featured" | "add" | "categories" | "inventory"

type AdminCategory = { id: number; name: string; slug: string; sort_order: number; is_active: boolean }
type AdminProduct = {
  id: number; slug: string; name: string; category: number; category_name: string
  price: string; compare_at_price: string | null; currency: string; image: string; hover_image: string
  stock_quantity: number; track_stock: boolean; sort_order: number
  is_active: boolean; warranty: string; long_description: string; made_in: string; is_featured: boolean
  details: string[]; materials: string[]; care: string[]; specs_sheet: Record<string, string>
}
type AdminOrder = {
  reference: string; status: string; payment_status: string; payment_method: string
  first_name: string; last_name: string; email: string; phone: string
  address: string; city: string; country: string; notes: string
  total: string; currency: string; amount_kes: number; mpesa_receipt: string; created_at: string
  payment_failure_reason?: string; paid_at?: string | null; last_stk_at?: string | null; stk_attempts?: number
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
  name: "", category: "", price: "", compare_at_price: "", stock_quantity: "0", image: "", hover_image: "",
  long_description: "", warranty: "", made_in: "", sort_order: "0",
  details: "", materials: "", care: "", is_featured: false, is_active: true, track_stock: true,
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
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [loadErrors, setLoadErrors] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const [productSearch, setProductSearch] = useState("")
  const [lowOnly, setLowOnly] = useState(false)
  const [orderStatus, setOrderStatus] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
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
    const [categoriesResult, productsResult, statsResult, settingsResult] = await Promise.allSettled([
      superadminApi.getShopCategories(),
      superadminApi.getShopProducts({ page_size: "200" }),
      superadminApi.getShopStats(),
      superadminApi.getShopSettings(),
    ])
    const errors: string[] = []
    if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value.results)
    else errors.push(`Categories: ${errText(categoriesResult.reason)}`)
    if (productsResult.status === "fulfilled") setProducts(productsResult.value.results)
    else errors.push(`Products: ${errText(productsResult.reason)}`)
    if (statsResult.status === "fulfilled") setStats(statsResult.value)
    else errors.push(`Summary: ${errText(statsResult.reason)}`)
    if (settingsResult.status === "fulfilled") setShopSettings(settingsResult.value)
    else errors.push(`Store settings: ${errText(settingsResult.reason)}`)
    setLoadErrors(errors)
    setLoading(false)
  }, [])

  const loadOrders = useCallback(async () => {
    const params: Record<string, string> = { page_size: "100" }
    if (orderStatus) params.status = orderStatus
    if (paymentStatus) params.payment_status = paymentStatus
    if (orderSearch.trim()) params.search = orderSearch.trim()
    try {
      setOrders((await superadminApi.getShopOrders(params)).results)
    } catch (e) {
      toast.error(errText(e))
    }
  }, [orderStatus, orderSearch, paymentStatus])

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
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      stock_quantity: String(product.stock_quantity),
      image: product.image || "",
      hover_image: product.hover_image || "",
      long_description: product.long_description || "",
      warranty: product.warranty || "",
      made_in: product.made_in || "",
      sort_order: String(product.sort_order || 0),
      details: (product.details || []).join("\n"),
      materials: (product.materials || []).join("\n"),
      care: (product.care || []).join("\n"),
      is_featured: product.is_featured,
      is_active: product.is_active,
      track_stock: product.track_stock,
    })
    setTab("add")
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(form.price)
    const compareAtPrice = form.compare_at_price ? Number(form.compare_at_price) : null
    const stock = Number(form.stock_quantity)
    const sortOrder = Number(form.sort_order)
    if (!form.name.trim()) { toast.error("Enter a product name"); return }
    if (!form.category) { toast.error("Create or choose a category first"); return }
    if (!Number.isFinite(price) || price <= 0) { toast.error("Enter a valid KES price"); return }
    if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) { toast.error("Compare-at price must be greater than the selling price"); return }
    if (!Number.isInteger(stock) || stock < 0) { toast.error("Stock must be a whole number"); return }
    if (!Number.isInteger(sortOrder) || sortOrder < 0) { toast.error("Sort order must be zero or a positive whole number"); return }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        category: Number(form.category),
        price: price.toFixed(2),
        compare_at_price: compareAtPrice === null ? null : compareAtPrice.toFixed(2),
        currency: "KES",
        stock_quantity: stock,
        track_stock: form.track_stock,
        image: form.image.trim(),
        hover_image: form.hover_image.trim(),
        long_description: form.long_description.trim(),
        warranty: form.warranty.trim(),
        made_in: form.made_in.trim(),
        sort_order: sortOrder,
        details: form.details.split("\n").map((line) => line.trim()).filter(Boolean),
        materials: form.materials.split("\n").map((line) => line.trim()).filter(Boolean),
        care: form.care.split("\n").map((line) => line.trim()).filter(Boolean),
        is_featured: form.is_featured,
        is_active: form.is_active,
      }
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

  async function saveStoreSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!shopSettings) return
    setSaving(true)
    try {
      const updated = await superadminApi.updateShopSettings({
        ...shopSettings,
        default_shipping_fee: Number(shopSettings.default_shipping_fee || 0),
        free_shipping_threshold: shopSettings.free_shipping_threshold === "" || shopSettings.free_shipping_threshold == null
          ? null
          : Number(shopSettings.free_shipping_threshold),
      })
      setShopSettings(updated)
      toast.success("Storefront settings published")
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "content", label: "Store content", icon: LayoutTemplate },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "products", label: "Products", icon: Package },
    { id: "featured", label: "Featured items", icon: Star },
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
        <div className="mt-3 border-t border-border p-3 text-[11px] leading-5 text-muted-foreground">Catalog, storefront content, checkout, payments, inventory, and fulfilment are managed here.</div>
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

      {tab === "content" && shopSettings && (
        <form onSubmit={saveStoreSettings} className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-semibold">Storefront content</h2><p className="mt-1 text-xs text-muted-foreground">Publish the main campaign, customer contact routes, shipping rules, and checkout availability.</p></div>
            <div className="flex gap-2"><Link href="/shop" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium"><ExternalLink className="h-3.5 w-3.5" />Preview shop</Link><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? "Publishing..." : "Publish changes"}</button></div>
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4"><h3 className="font-semibold">Hero campaign</h3><p className="text-xs text-muted-foreground">This becomes the first offer customers see on the shop home page.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-muted-foreground sm:col-span-2">Announcement<input value={shopSettings.announcement_text} onChange={(e) => setShopSettings({ ...shopSettings, announcement_text: e.target.value })} maxLength={240} className={`${input} mt-1.5`} placeholder="Free delivery on qualifying orders" /></label><label className="text-xs text-muted-foreground">Eyebrow<input value={shopSettings.hero_eyebrow} onChange={(e) => setShopSettings({ ...shopSettings, hero_eyebrow: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Background image<input value={shopSettings.hero_image} onChange={(e) => setShopSettings({ ...shopSettings, hero_image: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground sm:col-span-2">Headline<input value={shopSettings.hero_title} onChange={(e) => setShopSettings({ ...shopSettings, hero_title: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground sm:col-span-2">Description<textarea rows={3} value={shopSettings.hero_description} onChange={(e) => setShopSettings({ ...shopSettings, hero_description: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Primary action label<input value={shopSettings.hero_primary_label} onChange={(e) => setShopSettings({ ...shopSettings, hero_primary_label: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Primary action link<input value={shopSettings.hero_primary_href} onChange={(e) => setShopSettings({ ...shopSettings, hero_primary_href: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Secondary action label<input value={shopSettings.hero_secondary_label} onChange={(e) => setShopSettings({ ...shopSettings, hero_secondary_label: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Secondary action link<input value={shopSettings.hero_secondary_href} onChange={(e) => setShopSettings({ ...shopSettings, hero_secondary_href: e.target.value })} className={`${input} mt-1.5`} /></label></div></section>
              <section className="rounded-2xl border border-border bg-card p-5"><h3 className="mb-4 font-semibold">Support and checkout</h3><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Support email<input type="email" value={shopSettings.support_email} onChange={(e) => setShopSettings({ ...shopSettings, support_email: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Support phone<input value={shopSettings.support_phone} onChange={(e) => setShopSettings({ ...shopSettings, support_phone: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">WhatsApp number<input value={shopSettings.whatsapp_number} onChange={(e) => setShopSettings({ ...shopSettings, whatsapp_number: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Shipping fee (KES)<input type="number" min="0" value={shopSettings.default_shipping_fee ?? 0} onChange={(e) => setShopSettings({ ...shopSettings, default_shipping_fee: e.target.value })} className={`${input} mt-1.5`} /></label><label className="text-xs text-muted-foreground">Free shipping from (KES)<input type="number" min="0" value={shopSettings.free_shipping_threshold ?? ""} onChange={(e) => setShopSettings({ ...shopSettings, free_shipping_threshold: e.target.value })} className={`${input} mt-1.5`} placeholder="Leave blank to disable" /></label><label className="flex items-center gap-3 self-end rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={shopSettings.allow_checkout} onChange={(e) => setShopSettings({ ...shopSettings, allow_checkout: e.target.checked })} />Checkout enabled</label><label className="text-xs text-muted-foreground sm:col-span-2">Checkout notice<input value={shopSettings.checkout_notice} onChange={(e) => setShopSettings({ ...shopSettings, checkout_notice: e.target.value })} maxLength={300} className={`${input} mt-1.5`} placeholder="Shown when checkout is paused" /></label></div></section>
            </div>
            <aside className="h-fit overflow-hidden rounded-2xl border border-border bg-[#06183b] text-white xl:sticky xl:top-24"><div className="relative aspect-[4/3] bg-[#0b2452]">{/* eslint-disable-next-line @next/next/no-img-element */}{shopSettings.hero_image && <img src={shopSettings.hero_image} alt="" className="h-full w-full object-cover opacity-55" />}<div className="absolute inset-0 bg-gradient-to-t from-[#06183b] via-[#06183b]/60 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">{shopSettings.hero_eyebrow || "Campaign eyebrow"}</p><h3 className="mt-2 text-2xl font-semibold leading-tight">{shopSettings.hero_title || "Campaign headline"}</h3></div></div><div className="p-5"><p className="text-sm leading-6 text-white/70">{shopSettings.hero_description || "Campaign description"}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold">{shopSettings.hero_primary_label || "Primary action"}</span><span className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold">{shopSettings.hero_secondary_label || "Secondary action"}</span></div>{shopSettings.announcement_text && <p className="mt-5 rounded-lg bg-white/10 p-3 text-xs">{shopSettings.announcement_text}</p>}</div></aside>
          </div>
        </form>
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
                  <th className="px-4 py-3 text-center">Featured</th>
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
                    <td className="px-4 py-3 text-center"><button onClick={() => patchProduct(p, { is_featured: !p.is_featured }, p.is_featured ? "Removed from featured" : "Added to featured")} className={`rounded-full p-2 ${p.is_featured ? "bg-amber-500/15 text-amber-600" : "text-muted-foreground hover:bg-muted"}`} title={p.is_featured ? "Remove from featured" : "Feature product"}><Star className={`h-4 w-4 ${p.is_featured ? "fill-current" : ""}`} /></button></td>
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
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "featured" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Featured merchandising</h2><p className="mt-1 text-xs text-muted-foreground">Choose and order the products highlighted on the storefront. Hidden items never appear publicly.</p></div><div className="rounded-full bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-700">{products.filter((p) => p.is_featured && p.is_active).length} live featured</div></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.slice().sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order).map((product) => <div key={product.slug} className={`overflow-hidden rounded-2xl border bg-card ${product.is_featured ? "border-amber-500/50" : "border-border"}`}><div className="relative aspect-[16/9] bg-muted">{/* eslint-disable-next-line @next/next/no-img-element */}{product.image && <img src={product.image} alt="" className="h-full w-full object-contain p-4" />}<button onClick={() => patchProduct(product, { is_featured: !product.is_featured }, product.is_featured ? "Removed from featured" : "Added to featured")} className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow ${product.is_featured ? "bg-amber-500 text-white" : "bg-background text-muted-foreground"}`}><Star className={`h-4 w-4 ${product.is_featured ? "fill-current" : ""}`} /></button></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-serif text-base">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.category_name}</p></div><span className={product.is_active ? "text-xs text-emerald-600" : "text-xs text-red-600"}>{product.is_active ? "Live" : "Hidden"}</span></div><div className="mt-4 flex items-center gap-3"><label className="flex-1 text-[10px] uppercase tracking-wider text-muted-foreground">Display order<input type="number" min={0} key={product.sort_order} defaultValue={product.sort_order} onBlur={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 0 && value !== product.sort_order) patchProduct(product, { sort_order: value }, "Featured order updated") }} className="mt-1 w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground" /></label><button onClick={() => editProduct(product)} className="mt-4 rounded-lg border border-border p-2.5 text-muted-foreground hover:bg-muted"><Pencil className="h-4 w-4" /></button></div></div></div>)}</div>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Compare-at price</label>
                <input type="number" min="1" step="1" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className={input} placeholder="Optional original price" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Stock quantity</label>
                <input type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Display order</label>
                <input type="number" min="0" step="1" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={input} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Primary image path or URL</label><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/shop-assets/products/mikrotik_router.jpg" className={input} /></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Hover image</label><input value={form.hover_image} onChange={(e) => setForm({ ...form, hover_image: e.target.value })} placeholder="Optional alternate image" className={input} /></div></div>
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
            <div className="grid gap-4 md:grid-cols-3"><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Product highlights</label><textarea rows={5} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="One feature per line" className={input} /></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">In the box</label><textarea rows={5} value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} placeholder="One item per line" className={input} /></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Support & care</label><textarea rows={5} value={form.care} onChange={(e) => setForm({ ...form, care: e.target.value })} placeholder="One note per line" className={input} /></div></div>
            <div className="grid gap-3 sm:grid-cols-3"><label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />Published</label><label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />Featured item</label><label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={form.track_stock} onChange={(e) => setForm({ ...form, track_stock: e.target.checked })} />Track inventory</label></div>
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

      {tab === "payments" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
            { label: "Revenue collected", value: `KES ${Number(stats.revenue_kes ?? 0).toLocaleString()}`, note: `${stats.paid ?? 0} successful payments`, tone: "text-emerald-600" },
            { label: "Last 30 days", value: `KES ${Number(stats.revenue_kes_30d ?? 0).toLocaleString()}`, note: "Settled shop payments", tone: "text-blue-600" },
            { label: "Awaiting payment", value: String(stats.pending ?? 0), note: "Pending customer action", tone: "text-amber-600" },
            { label: "Failed payments", value: String(stats.failed ?? 0), note: "Review before follow-up", tone: "text-red-600" },
          ].map((item) => <div key={item.label} className="rounded-2xl border border-border bg-card p-5"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p><p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div>)}</div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search receipt, order, customer email or phone" className="w-full rounded-xl border border-border bg-muted/20 py-3 pl-9 pr-3 text-sm" /></div><div className="flex flex-wrap gap-2">{[["", "All"], ["paid", "Paid"], ["pending", "Pending"], ["failed", "Failed"]].map(([value, title]) => <button key={title} onClick={() => setPaymentStatus(value)} className={`rounded-lg border px-3 py-2 text-xs ${paymentStatus === value ? "border-foreground bg-foreground text-background" : "border-border"}`}>{title}</button>)}</div></div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full min-w-[880px] text-left text-sm"><thead className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Receipt / issue</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-border/60">{orders.map((order) => <tr key={order.reference}><td className="px-4 py-3"><p className="font-mono text-xs font-semibold">{order.reference}</p><p className="mt-1 text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleString("en-KE")}</p></td><td className="px-4 py-3"><p>{order.first_name} {order.last_name}</p><p className="text-xs text-muted-foreground">{order.phone}</p></td><td className="px-4 py-3 uppercase text-muted-foreground">{order.payment_method}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${order.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-700" : order.payment_status === "failed" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-700"}`}>{order.payment_status}</span></td><td className="max-w-xs px-4 py-3"><p className="font-mono text-xs">{order.mpesa_receipt || "—"}</p>{order.payment_failure_reason && <p className="mt-1 line-clamp-2 text-[11px] text-red-600">{order.payment_failure_reason}</p>}</td><td className="px-4 py-3 text-right font-semibold">{formatShopMoney(order.total, order.currency)}</td><td className="px-4 py-3 text-right">{order.payment_status !== "paid" && (order.status === "pending_payment" || order.status === "expired") ? <button onClick={() => markPaid(order)} className="rounded-lg border border-amber-500/50 px-3 py-2 text-xs font-medium text-amber-700">Verify & mark paid</button> : <span className="text-xs text-muted-foreground">{order.paid_at ? new Date(order.paid_at).toLocaleDateString("en-KE") : "No action"}</span>}</td></tr>)}{orders.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No payments match this view.</td></tr>}</tbody></table></div>
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
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={`${input} sm:w-52`}><option value="">All payments</option><option value="pending">Payment pending</option><option value="paid">Paid</option><option value="failed">Failed</option></select>
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
