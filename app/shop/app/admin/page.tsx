"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  DollarSign,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Check,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Sparkles,
  Tag,
  UploadCloud
} from "lucide-react"
import {
  getStoredProducts,
  addProduct,
  removeProduct,
  resetProductsToDefault,
  categories,
  type Product
} from "@/lib/products"
import { MOCK_ORDERS, type DjangoOrder } from "@/lib/django-api"
import { toast } from "sonner"

const PRESET_IMAGES = [
  { label: "Router / Gateway", src: "/products/mikrotik_router.jpg" },
  { label: "PoE Switch", src: "/products/poe_switch.jpg" },
  { label: "Fiber Tools", src: "/products/fusion_splicer.jpg" },
  { label: "Cabling Reel", src: "/products/cat6a_cable.jpg" },
  { label: "Server Rack", src: "/products/server_rack.jpg" },
  { label: "Wireless Dish", src: "/products/wireless_dish.jpg" },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"products" | "add" | "orders" | "overview">("products")
  const [productsList, setProductsList] = useState<Product[]>([])
  const [ordersList, setOrdersList] = useState<DjangoOrder[]>(MOCK_ORDERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Form State for Adding Product
  const [formData, setFormData] = useState({
    name: "",
    category: "Routers & Gateways",
    brand: "",
    price: "",
    inStock: true,
    image: "/products/mikrotik_router.jpg",
    customImageUrl: "",
    description: "",
    warranty: "2-Year Official Netily Warranty",
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Initialize and synchronize products from localStorage
  useEffect(() => {
    setProductsList(getStoredProducts())

    const handleUpdate = () => {
      setProductsList(getStoredProducts())
    }

    window.addEventListener("netily_products_updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)
    return () => {
      window.removeEventListener("netily_products_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [])

  // Filtered products list
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

  // Overview metrics
  const totalProducts = productsList.length
  const inStockCount = productsList.filter((p) => p.inStock !== false).length
  const totalOrders = ordersList.length
  const totalRevenue = ordersList.reduce((sum, ord) => sum + Number(ord.totalUsd), 0)

  // Handlers
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

    const resolvedImage = formData.customImageUrl.trim() || formData.image || "/products/mikrotik_router.jpg"

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

    // Reset form
    setFormData({
      name: "",
      category: "Routers & Gateways",
      brand: "",
      price: "",
      inStock: true,
      image: "/products/mikrotik_router.jpg",
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
    // Save to storage
    if (typeof window !== "undefined") {
      window.localStorage.setItem("netily_shop_products_catalog", JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent("netily_products_updated", { detail: updated }))
    }
    setProductsList(updated)
  }

  return (
    <div className="space-y-8">
      {/* Admin Tab Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-8">
          {[
            { id: "products", label: `Products (${productsList.length})` },
            { id: "add", label: "Add Product" },
            { id: "orders", label: `Orders (${ordersList.length})` },
            { id: "overview", label: "Overview" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs tracking-[0.2em] uppercase transition-all pb-3 whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? "border-foreground text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            title="Reset catalog back to initial default products"
            className="text-[11px] text-muted-foreground hover:text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Catalog
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. ALL PRODUCTS TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border p-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products by title, category, or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter products by category"
                className="py-2 px-3 text-xs bg-muted/30 border border-border text-foreground cursor-pointer focus:outline-none"
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
              className="bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.15em] uppercase px-5 py-2.5 flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </button>
          </div>

          {/* Products Table */}
          <div className="border border-border bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg">Shop Catalog</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {filteredProducts.length} of {productsList.length} items listed on the shop
                </p>
              </div>
              <Link
                href="/shop"
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
                    ? "Try adjusting your search query or category filter."
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
                          {/* Item Name + Thumbnail */}
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted relative border border-border shrink-0">
                              <Image
                                src={p.image || "/placeholder.svg"}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <Link
                                href={`/product/${p.id}`}
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

                          {/* Category */}
                          <td className="py-3.5 px-4 text-muted-foreground uppercase tracking-wider text-[11px]">
                            {p.category}
                          </td>

                          {/* Brand */}
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {p.brand || "Netily Pro"}
                          </td>

                          {/* Stock Status Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleStock(p.id)}
                              title="Click to toggle stock status"
                              className={`text-[10px] uppercase tracking-wider px-2.5 py-1 border transition-colors ${
                                isInStock
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {isInStock ? "In Stock" : "Out of Stock"}
                            </button>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-4 text-right font-medium text-sm">
                            ${Number(p.price).toLocaleString()}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/product/${p.id}`}
                                className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="View in Shop"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 border border-border text-red-600 hover:bg-red-500/10 hover:border-red-500/50 transition-colors"
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

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. ADD PRODUCT TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "add" && (
        <div className="max-w-3xl mx-auto border border-border bg-card p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-2xl">Add New Product</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Add a new item to the store catalog. It will immediately appear on the storefront.
            </p>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. MikroTik Cloud Router Switch CRS328-24P-4S+RM"
                className={`w-full p-3 text-sm bg-muted/20 border ${
                  formErrors.name ? "border-red-500" : "border-border"
                } text-foreground focus:outline-none focus:border-foreground`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 text-sm bg-muted/20 border border-border text-foreground cursor-pointer focus:outline-none focus:border-foreground"
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
                  className="w-full p-3 text-sm bg-muted/20 border border-border text-foreground focus:outline-none focus:border-foreground"
                />
              </div>
            </div>

            {/* Price & Stock */}
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
                    className={`w-full pl-8 pr-3 py-3 text-sm bg-muted/20 border ${
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

            {/* Product Image Selection */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Product Image (Choose Preset or Custom URL)
              </label>

              {/* Presets */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_IMAGES.map((preset) => {
                  const isSelected = formData.image === preset.src && !formData.customImageUrl
                  return (
                    <button
                      key={preset.src}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.src, customImageUrl: "" })}
                      className={`relative aspect-square border text-left p-1 transition-all group ${
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

              {/* Custom Image URL option */}
              <div className="pt-2">
                <input
                  type="url"
                  value={formData.customImageUrl}
                  onChange={(e) => setFormData({ ...formData, customImageUrl: e.target.value })}
                  placeholder="Or enter custom image URL (https://...)"
                  className="w-full p-2.5 text-xs bg-muted/20 border border-border text-foreground focus:outline-none focus:border-foreground font-mono"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Product Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of key specs, ports, and intended deployment..."
                className="w-full p-3 text-sm bg-muted/20 border border-border text-foreground focus:outline-none focus:border-foreground"
              />
            </div>

            {/* Warranty */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Warranty & Verification
              </label>
              <input
                type="text"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                placeholder="e.g. 2-Year Official Netily Warranty"
                className="w-full p-3 text-sm bg-muted/20 border border-border text-foreground focus:outline-none focus:border-foreground"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Publish Product to Shop
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. ORDERS TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "orders" && (
        <div className="border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h2 className="font-serif text-xl">Customer Orders ({ordersList.length})</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                Orders placed through the checkout flow
              </p>
            </div>
            <button
              onClick={() => toast.success("Refreshed orders list")}
              className="text-xs uppercase tracking-wider border border-border px-3.5 py-1.5 hover:bg-muted"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {ordersList.map((ord) => (
              <div
                key={ord.id}
                className="p-5 border border-border bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-base font-semibold">
                      Order {ord.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
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
                    className="text-xs tracking-wider uppercase border border-border px-3.5 py-1.5 hover:bg-muted"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. OVERVIEW TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Key Metrics */}
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
              <div key={i} className="border border-border bg-card p-6">
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

          {/* Quick Actions & Low Stock */}
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 border border-border bg-card p-6 space-y-4">
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
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border border-border bg-muted">
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
              <div className="border border-border bg-card p-6 space-y-4">
                <h4 className="font-serif text-lg">Quick Tasks</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("add")}
                    className="w-full text-left py-3 px-4 text-xs tracking-wider uppercase border border-border hover:bg-muted flex items-center justify-between transition-colors"
                  >
                    <span>Add New Item</span>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="w-full text-left py-3 px-4 text-xs tracking-wider uppercase border border-border hover:bg-muted flex items-center justify-between transition-colors"
                  >
                    <span>Manage Catalog</span>
                    <Package className="h-3.5 w-3.5" />
                  </button>
                  <Link href="/shop" className="block">
                    <button className="w-full text-left py-3 px-4 text-xs tracking-wider uppercase border border-border hover:bg-muted flex items-center justify-between transition-colors">
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

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* CONFIRMATION MODAL: REMOVE PRODUCT */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 max-w-md w-full space-y-4 shadow-xl">
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
                className="px-4 py-2 text-xs uppercase tracking-wider border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveProduct}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* CONFIRMATION MODAL: RESET CATALOG */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 max-w-md w-full space-y-4 shadow-xl">
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
                className="px-4 py-2 text-xs uppercase tracking-wider border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetCatalog}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-colors"
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
