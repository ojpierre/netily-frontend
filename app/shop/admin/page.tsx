"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  DollarSign,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Truck,
  Settings,
  BarChart3,
  LogOut,
  Boxes,
  ShieldCheck,
  MessageSquareText,
  Send,
} from "lucide-react"
import {
  getStoredProducts,
  getStoredOfferSlides,
  addOfferSlide,
  removeOfferSlide,
  resetOfferSlidesToDefault,
  addProduct,
  removeProduct,
  resetProductsToDefault,
  categories,
  type Product,
  type ShopOfferSlide
} from "@/shop-ui/lib/products"
import { MOCK_ORDERS, type DjangoOrder } from "@/shop-ui/lib/django-api"
import { toast } from "sonner"

const PRESET_IMAGES = [
  { label: "Router / Gateway", src: "/shop-assets/products/mikrotik_router.jpg" },
  { label: "PoE Switch", src: "/shop-assets/products/poe_switch.jpg" },
  { label: "Fiber Tools", src: "/shop-assets/products/fusion_splicer.jpg" },
  { label: "Cabling Reel", src: "/shop-assets/products/cat6a_cable.jpg" },
  { label: "Server Rack", src: "/shop-assets/products/server_rack.jpg" },
  { label: "Wireless Dish", src: "/shop-assets/products/wireless_dish.jpg" },
]

export default function AdminPage() {
  const router = useRouter()
  const [isAdminReady, setIsAdminReady] = useState(false)
  const [activeTab, setActiveTab] = useState<"products" | "add" | "offers" | "orders" | "inventory" | "fulfillment" | "sms" | "settings" | "overview">("products")
  const [productsList, setProductsList] = useState<Product[]>([])
  const [offerSlides, setOfferSlides] = useState<ShopOfferSlide[]>([])
  const [ordersList, setOrdersList] = useState<DjangoOrder[]>(MOCK_ORDERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [offerToDelete, setOfferToDelete] = useState<ShopOfferSlide | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "Routers & Gateways",
    brand: "",
    price: "",
    inStock: true,
    image: "/shop-assets/products/mikrotik_router.jpg",
    customImageUrl: "",
    description: "",
    warranty: "2-Year Official Netily Warranty",
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [offerForm, setOfferForm] = useState({
    eyebrow: "",
    badge: "",
    title: "",
    description: "",
    image: "/shop-assets/shop_hero.png",
    href: "/shop/catalog",
    ctaLabel: "Shop now",
  })
  const [offerErrors, setOfferErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (typeof window === "undefined") return
    const session = window.localStorage.getItem("netily_shop_admin_session")
    if (session !== "authenticated") {
      router.replace("/shop/admin/login?next=/shop/admin")
      return
    }
    setIsAdminReady(true)
  }, [router])

  useEffect(() => {
    if (!isAdminReady) return
    setProductsList(getStoredProducts())
    setOfferSlides(getStoredOfferSlides())

    const handleUpdate = () => {
      setProductsList(getStoredProducts())
    }
    const handleOfferUpdate = () => {
      setOfferSlides(getStoredOfferSlides())
    }

    window.addEventListener("netily_products_updated", handleUpdate)
    window.addEventListener("netily_shop_offers_updated", handleOfferUpdate)
    window.addEventListener("storage", handleUpdate)
    window.addEventListener("storage", handleOfferUpdate)
    return () => {
      window.removeEventListener("netily_products_updated", handleUpdate)
      window.removeEventListener("netily_shop_offers_updated", handleOfferUpdate)
      window.removeEventListener("storage", handleUpdate)
      window.removeEventListener("storage", handleOfferUpdate)
    }
  }, [isAdminReady])

  const filteredProducts = useMemo(() => {
    return productsList.filter((item) => {
      const matchesCat = selectedCategory === "All" || item.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        item.id.toLowerCase().includes(query)
      return matchesCat && matchesSearch
    })
  }, [productsList, searchQuery, selectedCategory])

  const totalProducts = productsList.length
  const inStockCount = productsList.filter((p) => p.inStock !== false).length
  const outOfStockCount = totalProducts - inStockCount
  const totalOrders = ordersList.length
  const totalRevenue = ordersList.reduce((sum, ord) => sum + Number(ord.totalUsd), 0)
  const pendingOrders = ordersList.filter((ord) => ord.status !== "DELIVERED").length

  const adminSections = [
    { id: "products", label: "Products", count: productsList.length, icon: Package, desc: "Catalog items" },
    { id: "add", label: "Add Product", icon: Plus, desc: "Create listing" },
    { id: "offers", label: "Hero Offers", count: offerSlides.length, icon: Sparkles, desc: "Homepage slider" },
    { id: "orders", label: "Orders", count: ordersList.length, icon: ShoppingBag, desc: "Customer requests" },
    { id: "inventory", label: "Inventory", count: outOfStockCount, icon: Boxes, desc: "Stock control" },
    { id: "fulfillment", label: "Fulfillment", count: pendingOrders, icon: Truck, desc: "Dispatch work" },
    { id: "sms", label: "SMS", icon: MessageSquareText, desc: "Order reminders" },
    { id: "settings", label: "Settings", icon: Settings, desc: "Shop controls" },
    { id: "overview", label: "Overview", icon: BarChart3, desc: "Store health" },
  ] as const

  function handleAdminLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("netily_shop_admin_session")
      window.localStorage.removeItem("netily_shop_admin_email")
    }
    toast.success("Signed out of shop admin")
    router.replace("/shop/admin/login")
  }

  function handleRemoveProduct() {
    if (!productToDelete) return
    const id = productToDelete.id
    const name = productToDelete.name
    removeProduct(id)
    setProductsList(getStoredProducts())
    toast.success(`Removed "${name}" from the shop`)
    setProductToDelete(null)
  }

  function handleResetCatalog() {
    resetProductsToDefault()
    setProductsList(getStoredProducts())
    setShowResetConfirm(false)
    toast.success("Catalog reset to default items")
  }

  function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault()
    const errors: { [key: string]: string } = {}
    if (!offerForm.title.trim()) errors.title = "Add the main offer headline"
    if (!offerForm.description.trim()) errors.description = "Add a short offer description"
    if (!offerForm.image.trim()) errors.image = "Add an image path or URL"
    if (!offerForm.href.trim()) errors.href = "Add a CTA destination"

    if (Object.keys(errors).length) {
      setOfferErrors(errors)
      toast.error("Please complete the offer slide")
      return
    }

    const created = addOfferSlide({
      eyebrow: offerForm.eyebrow || "Shop offer",
      badge: offerForm.badge,
      title: offerForm.title,
      description: offerForm.description,
      image: offerForm.image,
      href: offerForm.href,
      ctaLabel: offerForm.ctaLabel || "Shop now",
    })
    setOfferSlides(getStoredOfferSlides())
    toast.success(`Offer "${created.badge || created.eyebrow}" is live on the shop hero`)
    setOfferForm({
      eyebrow: "",
      badge: "",
      title: "",
      description: "",
      image: "/shop-assets/shop_hero.png",
      href: "/shop/catalog",
      ctaLabel: "Shop now",
    })
    setOfferErrors({})
  }

  function handleRemoveOffer() {
    if (!offerToDelete) return
    removeOfferSlide(offerToDelete.id)
    setOfferSlides(getStoredOfferSlides())
    toast.success("Offer slide removed")
    setOfferToDelete(null)
  }

  function handleResetOffers() {
    resetOfferSlidesToDefault()
    setOfferSlides(getStoredOfferSlides())
    toast.success("Offer slider restored to default artworks")
  }

  function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    const errors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      errors.name = "Please enter a product name"
    }
    const priceNum = Number(formData.price)
    if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
      errors.price = "Please enter a valid price greater than 0"
    }
    if (!formData.category) {
      errors.category = "Please select a category"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Please fill in all required fields")
      return
    }

    const resolvedImage = formData.customImageUrl.trim() || formData.image || "/shop-assets/products/mikrotik_router.jpg"

    const created = addProduct({
      name: formData.name.trim(),
      price: priceNum,
      category: formData.category,
      brand: formData.brand.trim() || "Netily Pro",
      inStock: formData.inStock,
      warranty: formData.warranty.trim() || "2-Year Official Netily Warranty",
      image: resolvedImage,
      hoverImage: resolvedImage,
      description: formData.description.trim() || `${formData.name} certified and verified for professional use.`,
      longDescription:
        formData.description.trim() ||
        `${formData.name} delivers high-performance reliability. Quality checked and verified by Netily.`,
    })

    setProductsList(getStoredProducts())
    toast.success(`"${created.name}" is now live in the shop!`)

    setFormData({
      name: "",
      category: "Routers & Gateways",
      brand: "",
      price: "",
      inStock: true,
      image: "/shop-assets/products/mikrotik_router.jpg",
      customImageUrl: "",
      description: "",
      warranty: "2-Year Official Netily Warranty",
    })
    setFormErrors({})
    setActiveTab("products")
  }

  function handleToggleStock(productId: string) {
    const updated = productsList.map((p) => {
      if (p.id === productId) {
        const nextState = p.inStock === false ? true : false
        toast.success(`Updated stock status: ${nextState ? "In Stock" : "Out of Stock"}`)
        return { ...p, inStock: nextState }
      }
      return p
    })
    if (typeof window !== "undefined") {
      window.localStorage.setItem("netily_shop_products_catalog", JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent("netily_products_updated", { detail: updated }))
    }
    setProductsList(updated)
  }

  if (!isAdminReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
        <div>
          <ShieldCheck className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="font-serif text-xl">Checking shop admin access</p>
          <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Redirecting to secure sign in when needed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-3 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin workspace</p>
            <p className="mt-1 font-serif text-lg">Shop Control</p>
            <p className="mt-1 text-xs text-muted-foreground">Catalog, orders, offers, stock, and fulfillment.</p>
          </div>

          <nav className="space-y-1">
            {adminSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveTab(section.id)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition-all ${
                  activeTab === section.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <section.icon className="h-4 w-4 shrink-0 stroke-[1.6]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em]">{section.label}</span>
                  <span className={`block truncate text-[11px] ${activeTab === section.id ? "text-background/70" : "text-muted-foreground"}`}>
                    {section.desc}
                  </span>
                </span>
                {"count" in section && typeof section.count === "number" && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === section.id ? "bg-background/15" : "bg-muted text-muted-foreground"}`}>
                    {section.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex min-h-10 w-full items-center justify-between rounded-xl border border-border px-3 text-xs uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>Reset Catalog</span>
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleAdminLogout}
              className="flex min-h-10 w-full items-center justify-between rounded-xl border border-border px-3 text-xs uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>Sign Out</span>
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <section className="min-w-0 space-y-8">

      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products by title, category, or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter products by category"
                className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground cursor-pointer focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories
                  .filter((c) => c !== "All")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={() => setActiveTab("add")}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs uppercase text-background transition-colors hover:bg-foreground/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg">Shop Catalog</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {filteredProducts.length} of {productsList.length} items listed on the shop
                </p>
              </div>
              <Link
                href="/shop/catalog"
                className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <span>Browse Store</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <Package className="h-10 w-10 text-muted-foreground mx-auto stroke-[1.2]" />
                <h3 className="font-serif text-lg">No Products Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== "All"
                    ? "Try changing the search term or selecting another category."
                    : "Your store catalog is currently empty. Click 'Add Product' to get started."}
                </p>
                {(searchQuery || selectedCategory !== "All") && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("All")
                    }}
                    className="text-xs uppercase tracking-wider underline text-foreground hover:text-muted-foreground"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/20 border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4 text-center">Stock Status</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredProducts.map((p) => {
                      const isInStock = p.inStock !== false
                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                              <Image
                                src={p.image || "/placeholder.svg"}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <Link
                                href={`/shop/product/${p.id}`}
                                className="font-serif text-sm hover:underline block truncate"
                                title={p.name}
                              >
                                {p.name}
                              </Link>
                              <span className="text-[10px] text-muted-foreground font-mono truncate block">
                                ID: {p.id}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground uppercase tracking-wider text-[11px]">
                            {p.category}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {p.brand || "Netily Pro"}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleStock(p.id)}
                              title="Click to toggle stock status"
                              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase transition-colors ${
                                isInStock
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {isInStock ? "In Stock" : "Out of Stock"}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right font-medium text-sm">
                            ${Number(p.price).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/shop/product/${p.id}`}
                                className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="View in Shop"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="rounded-full border border-border p-1.5 text-red-600 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
                                title="Remove from Shop"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "add" && (
        <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl">Add New Product</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Add a new item to the store catalog. It will immediately appear on the storefront.
            </p>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. MikroTik Cloud Router Switch CRS328-24P-4S+RM"
                className={`w-full rounded-xl border bg-muted/20 p-3 text-sm ${
                  formErrors.name ? "border-red-500" : "border-border"
                } text-foreground focus:outline-none focus:border-foreground`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground cursor-pointer focus:border-foreground focus:outline-none"
                >
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. MikroTik, Ubiquiti, Netily Pro"
                  className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Price in USD ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="395"
                    className={`w-full rounded-xl border bg-muted/20 py-3 pl-8 pr-3 text-sm ${
                      formErrors.price ? "border-red-500" : "border-border"
                    } text-foreground focus:outline-none focus:border-foreground`}
                  />
                </div>
                {formErrors.price && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Stock Availability
                </label>
                <div className="flex items-center gap-4 py-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider">
                    <input
                      type="radio"
                      name="stock"
                      checked={formData.inStock}
                      onChange={() => setFormData({ ...formData, inStock: true })}
                      className="accent-foreground"
                    />
                    <span>In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider">
                    <input
                      type="radio"
                      name="stock"
                      checked={!formData.inStock}
                      onChange={() => setFormData({ ...formData, inStock: false })}
                      className="accent-foreground"
                    />
                    <span>Out of Stock</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Product Image (Choose Preset or Custom URL)
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_IMAGES.map((preset) => {
                  const isSelected = formData.image === preset.src && !formData.customImageUrl
                  return (
                    <button
                      key={preset.src}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.src, customImageUrl: "" })}
                      className={`group relative aspect-square overflow-hidden rounded-xl border p-1 text-left transition-all ${
                        isSelected ? "border-foreground ring-2 ring-foreground/20" : "border-border hover:border-foreground/50"
                      }`}
                    >
                      <Image
                        src={preset.src}
                        alt={preset.label}
                        fill
                        className="object-cover p-1"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-background/90 text-[9px] text-center py-0.5 truncate uppercase tracking-tighter">
                        {preset.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2">
                <input
                  type="url"
                  value={formData.customImageUrl}
                  onChange={(e) => setFormData({ ...formData, customImageUrl: e.target.value })}
                  placeholder="Or enter custom image URL (https://...)"
                  className="w-full rounded-xl border border-border bg-muted/20 p-2.5 font-mono text-xs text-foreground focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Product Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of key specs, ports, and intended deployment..."
                className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Warranty & Verification
              </label>
              <input
                type="text"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                placeholder="e.g. 2-Year Official Netily Warranty"
                className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className="rounded-full border border-border px-5 py-2.5 text-xs uppercase transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-xs uppercase text-background transition-colors hover:bg-foreground/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Publish Product to Shop
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-serif text-lg">Homepage Offer Slider</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Slides shown at the top of /shop and /shop/catalog.</p>
              </div>
              <button onClick={handleResetOffers} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[11px] uppercase hover:bg-muted">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Offers
              </button>
            </div>

            <div className="divide-y divide-border">
              {offerSlides.map((slide) => (
                <div key={slide.id} className="grid gap-4 p-4 md:grid-cols-[160px_1fr_auto] md:items-center">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
                    <Image src={slide.image || "/placeholder.svg"} alt={slide.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-blue-600">{slide.badge || slide.eyebrow}</p>
                    <h3 className="mt-1 text-base font-semibold leading-snug">{slide.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{slide.description}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      CTA: <span className="text-foreground">{slide.ctaLabel}</span> - {slide.href}
                    </p>
                  </div>
                  <button onClick={() => setOfferToDelete(slide)} className="justify-self-start rounded-full border border-red-500/30 p-2 text-red-600 transition hover:bg-red-500/10 md:justify-self-end" title="Remove offer slide">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateOffer} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-5">
              <h3 className="font-serif text-lg">Add Offer Artwork</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Use a strong artwork image, short headline, and a CTA pointing to a category or product.</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Eyebrow</label>
                  <input value={offerForm.eyebrow} onChange={(e) => setOfferForm({ ...offerForm, eyebrow: e.target.value })} placeholder="FTTH rollout bundle" className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Badge</label>
                  <input value={offerForm.badge} onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })} placeholder="Fiber offers" className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm outline-none focus:border-blue-600" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Headline</label>
                <input value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} placeholder="GPON OLTs, ONTs, drop cable, and test tools..." className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm outline-none focus:border-blue-600" />
                {offerErrors.title && <p className="mt-1 text-[11px] text-red-600">{offerErrors.title}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea rows={3} value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} placeholder="Describe the offer in one clear sentence..." className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm outline-none focus:border-blue-600" />
                {offerErrors.description && <p className="mt-1 text-[11px] text-red-600">{offerErrors.description}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Artwork URL / Path</label>
                <input value={offerForm.image} onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })} placeholder="/shop-assets/shop_hero.png" className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm outline-none focus:border-blue-600" />
                {offerErrors.image && <p className="mt-1 text-[11px] text-red-600">{offerErrors.image}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">CTA Label</label>
                  <input value={offerForm.ctaLabel} onChange={(e) => setOfferForm({ ...offerForm, ctaLabel: e.target.value })} placeholder="Shop Fiber Gear" className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">CTA Link</label>
                  <input value={offerForm.href} onChange={(e) => setOfferForm({ ...offerForm, href: e.target.value })} placeholder="/shop/catalog?cat=Fiber+Optics+%26+OLT" className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm outline-none focus:border-blue-600" />
                  {offerErrors.href && <p className="mt-1 text-[11px] text-red-600">{offerErrors.href}</p>}
                </div>
              </div>

              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs uppercase text-white transition hover:bg-blue-700">
                <Plus className="h-3.5 w-3.5" />
                Publish Offer Slide
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h2 className="font-serif text-xl">Customer Orders ({ordersList.length})</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                Orders placed through the checkout flow
              </p>
            </div>
            <button
              onClick={() => toast.success("Refreshed orders list")}
              className="rounded-full border border-border px-3.5 py-1.5 text-xs uppercase hover:bg-muted"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {ordersList.map((ord) => (
              <div
                key={ord.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/10 p-5 md:flex-row md:items-center"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-base font-semibold">
                      Order {ord.orderNumber}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
                        ord.status === "DELIVERED"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : ord.status === "DISPATCHED"
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                          : "border-border bg-card"
                      }`}
                    >
                      {ord.status}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {ord.paymentMethod}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Destination: <strong className="text-foreground">{ord.shippingAddress}</strong>
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Items:{" "}
                      <strong className="text-foreground">
                        {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                      </strong>
                    </span>
                    {ord.trackingNumber && (
                      <span className="font-mono text-[11px]">
                        Tracking: {ord.trackingNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                  <span className="font-serif text-lg">
                    ${Number(ord.totalUsd).toLocaleString()} USD
                  </span>
                  <button
                    onClick={() => {
                      const nextStatus =
                        ord.status === "PENDING"
                          ? "PROCESSING"
                          : ord.status === "PROCESSING"
                          ? "DISPATCHED"
                          : ord.status === "DISPATCHED"
                          ? "DELIVERED"
                          : "DISPATCHED"
                      setOrdersList(
                        ordersList.map((o) => (o.id === ord.id ? { ...o, status: nextStatus as any } : o))
                      )
                      toast.success(`Updated order ${ord.orderNumber} to ${nextStatus}`)
                    }}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs uppercase hover:bg-muted"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Catalog Products",
                value: totalProducts.toString(),
                sub: "Live in store catalog",
                icon: Package,
              },
              {
                title: "Stock Availability",
                value: `${Math.round((inStockCount / (totalProducts || 1)) * 100)}%`,
                sub: `${inStockCount} of ${totalProducts} in stock`,
                icon: CheckCircle2,
              },
              {
                title: "Customer Orders",
                value: totalOrders.toString(),
                sub: "Fulfilled & pending orders",
                icon: ShoppingBag,
              },
              {
                title: "Order Volume",
                value: `$${totalRevenue.toLocaleString()}`,
                sub: "Total merchandise volume",
                icon: DollarSign,
              },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {stat.title}
                  </span>
                  <stat.icon className="h-4 w-4 text-muted-foreground stroke-[1.5]" />
                </div>
                <div className="mt-3">
                  <span className="font-serif text-3xl block">{stat.value}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 lg:col-span-8">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="font-serif text-xl">Recent Store Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground underline"
                >
                  View All Orders
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {ordersList.slice(0, 4).map((ord) => (
                      <tr key={ord.id} className="hover:bg-muted/20">
                        <td className="py-3 px-3 font-mono font-medium">{ord.orderNumber}</td>
                        <td className="py-3 px-3">
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase">
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {ord.items.length} items
                        </td>
                        <td className="py-3 px-3 text-right font-medium">
                          ${Number(ord.totalUsd).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
                <h4 className="font-serif text-lg">Quick Tasks</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("add")}
                    className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-xs uppercase transition-colors hover:bg-muted"
                  >
                    <span>Add New Item</span>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-xs uppercase transition-colors hover:bg-muted"
                  >
                    <span>Manage Catalog</span>
                    <Package className="h-3.5 w-3.5" />
                  </button>
                  <Link href="/shop/catalog" className="block">
                    <button className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-xs uppercase transition-colors hover:bg-muted">
                      <span>View Live Shop</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "In stock", value: inStockCount, sub: "Available for checkout" },
              { label: "Out of stock", value: outOfStockCount, sub: "Needs restock action" },
              { label: "Categories", value: categories.filter((c) => c !== "All").length, sub: "Configured catalog groups" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-serif text-3xl">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-xl">Inventory Control</h2>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Track stock availability and highlight items that need restocking.</p>
              </div>
              <button onClick={() => setActiveTab("products")} className="rounded-full border border-border px-4 py-2 text-xs uppercase hover:bg-muted">
                Update Stock
              </button>
            </div>

            <div className="grid gap-3">
              {productsList.slice(0, 8).map((product) => (
                <div key={product.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-muted">
                      <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-serif text-sm">{product.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStock(product.id)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] uppercase ${
                      product.inStock !== false
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                        : "border-red-500/40 bg-red-500/10 text-red-600"
                    }`}
                  >
                    {product.inStock !== false ? "In Stock" : "Out of Stock"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "fulfillment" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 border-b border-border pb-4">
            <h2 className="font-serif text-xl">Fulfillment Queue</h2>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Dispatch, tracking, delivery, and customer updates for hardware orders.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {["Pick & pack", "Carrier booking", "Delivered"].map((stage) => (
              <div key={stage} className="rounded-2xl border border-border bg-muted/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider">{stage}</p>
                <div className="mt-4 space-y-3">
                  {ordersList
                    .filter((order) =>
                      stage === "Pick & pack"
                        ? order.status === "PENDING" || order.status === "PROCESSING"
                        : stage === "Carrier booking"
                        ? order.status === "DISPATCHED"
                        : order.status === "DELIVERED"
                    )
                    .slice(0, 4)
                    .map((order) => (
                      <div key={order.id} className="rounded-xl border border-border bg-card p-3">
                        <p className="font-mono text-xs font-semibold">{order.orderNumber}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{order.shippingAddress}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{order.paymentMethod}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "sms" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Queued", value: "8", sub: "Ready to send" },
              { label: "Sent today", value: "24", sub: "Order updates" },
              { label: "Failed", value: "1", sub: "Needs retry" },
              { label: "Templates", value: "6", sub: "Active flows" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{metric.label}</p>
                <p className="mt-2 font-serif text-3xl">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-xl">Order Communication Log</h2>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Track SMS reminders for order placement, payment, dispatch, delivery, and warranty follow-up.</p>
                </div>
                <button onClick={() => toast.success("SMS queue refreshed")} className="rounded-full border border-border px-4 py-2 text-xs uppercase hover:bg-muted">
                  Refresh
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { title: "Order confirmation", to: "+254700000001", status: "sent", ref: "ORD-1028" },
                  { title: "Dispatch reminder", to: "+254711223344", status: "queued", ref: "ORD-1027" },
                  { title: "Payment follow-up", to: "+254722334455", status: "failed", ref: "QT-FTTH-1042" },
                  { title: "Delivery completed", to: "+254733445566", status: "sent", ref: "ORD-1025" },
                ].map((sms) => (
                  <div key={`${sms.ref}-${sms.title}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-serif text-sm">{sms.title}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{sms.ref} - {sms.to}</p>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider ${
                      sms.status === "sent"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                        : sms.status === "failed"
                        ? "border-red-500/40 bg-red-500/10 text-red-600"
                        : "border-blue-500/40 bg-blue-500/10 text-blue-700"
                    }`}>
                      {sms.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 border-b border-border pb-4">
                <h3 className="font-serif text-lg">Message Templates</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Short operational templates for common shop events.</p>
              </div>
              <div className="space-y-3">
                {[
                  "Order placed",
                  "Payment received",
                  "Order dispatched",
                  "Delivery reminder",
                  "Warranty claim update",
                  "Quote follow-up",
                ].map((template) => (
                  <button key={template} onClick={() => toast.success(`${template} template selected`)} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border px-3 text-left text-xs uppercase tracking-wider hover:bg-muted">
                    <span>{template}</span>
                    <Send className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            { title: "Storefront", body: "Configure hero offers, catalog defaults, featured categories, and homepage publishing rules." },
            { title: "Checkout", body: "Define payment methods, quote expiry, tax treatment, and delivery regions." },
            { title: "Admin Access", body: "Control shop team roles, session expiry, permissions, and audit trails." },
            { title: "Notifications", body: "Prepare email, SMS, and internal alerts for order confirmation, dispatch, delivery, and restock events." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Shop settings</p>
              <h2 className="mt-2 font-serif text-xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      </section>

      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-serif text-lg text-foreground">Remove Product</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove <strong className="text-foreground">"{productToDelete.name}"</strong> from Netily Shop? It will no longer appear in the shop catalog.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="rounded-full border border-border px-4 py-2 text-xs uppercase transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveProduct}
                className="rounded-full bg-red-600 px-4 py-2 text-xs uppercase text-white transition-colors hover:bg-red-700"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {offerToDelete && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-serif text-lg text-foreground">Remove Offer Slide</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Remove <strong className="text-foreground">"{offerToDelete.badge || offerToDelete.eyebrow}"</strong> from the shop hero slider?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setOfferToDelete(null)} className="rounded-full border border-border px-4 py-2 text-xs uppercase transition-colors hover:bg-muted">
                Cancel
              </button>
              <button onClick={handleRemoveOffer} className="rounded-full bg-red-600 px-4 py-2 text-xs uppercase text-white transition-colors hover:bg-red-700">
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5" />
              <h3 className="font-serif text-lg">Reset Store Catalog</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will restore all default networking and tech products, discarding any custom additions or removals. Continue?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-full border border-border px-4 py-2 text-xs uppercase transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleResetCatalog}
                className="rounded-full bg-foreground px-4 py-2 text-xs uppercase text-background transition-colors hover:bg-foreground/90"
              >
                Reset Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
