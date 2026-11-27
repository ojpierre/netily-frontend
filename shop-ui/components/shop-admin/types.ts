import type { ShopSettings } from "@/lib/superadmin-api"

export type { ShopSettings }

export type AdminCategory = {
  id: number
  name: string
  slug: string
  description: string
  image: string
  featured_brands: string[]
  sort_order: number
  is_active: boolean
}

export type AdminProduct = {
  id?: number
  slug: string
  name: string
  brand: string
  category: number
  category_name?: string
  price: string | number
  currency: string
  compare_at_price: string | number | null
  image: string
  hover_image: string
  summary: string
  long_description: string
  details: string[]
  materials: string[]
  care: string[]
  specs_sheet: Record<string, string>
  sizes?: unknown[]
  colors?: unknown[]
  warranty: string
  made_in: string
  track_stock: boolean
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  is_trending: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type AdminOrderItem = {
  id?: number
  product_slug: string
  name: string
  unit_price: string | number
  quantity: number
  selected_storage: string
  selected_color: string
  line_total: string | number
}

export type AdminOrder = {
  reference: string
  status: string
  payment_status: string
  payment_method: string
  first_name: string
  last_name: string
  company?: string
  email: string
  phone: string
  address: string
  apartment?: string
  city: string
  state?: string
  zip_code?: string
  country: string
  notes: string
  currency: string
  subtotal?: string | number
  shipping_fee?: string | number
  total: string | number
  amount_kes: number
  mpesa_phone?: string
  mpesa_receipt: string
  payment_failure_reason?: string
  stk_attempts?: number
  last_stk_at?: string | null
  paid_at?: string | null
  created_at: string
  updated_at?: string
  items?: AdminOrderItem[]
}

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] }

export type ShopStats = Record<string, number | string>

export type Tab = "overview" | "products" | "categories" | "orders" | "storefront"

export type ProductFilterPreset = {
  status?: "all" | "live" | "hidden"
  missingPhoto?: boolean
  lowStock?: boolean
  onSale?: boolean
  featured?: boolean
}

export const LOW_STOCK = 5
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "expired"]
/** Mirrors ORDER_TRANSITIONS in the backend. */
export const NEXT_STATUS: Record<string, string[]> = {
  pending_payment: ["cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
}

export const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.")
export const fieldErrorsOf = (e: unknown): Record<string, string[]> =>
  e && typeof e === "object" && "fieldErrors" in e ? ((e as { fieldErrors: Record<string, string[]> }).fieldErrors || {}) : {}

export const statusLabel = (s: string) => {
  const text = s.replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function ksh(value: number | string | null | undefined) {
  const n = Number(value)
  return `KSh ${(Number.isFinite(n) ? n : 0).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150)
}

export const savePercent = (price: number, compareAt: number) =>
  compareAt > price && price > 0 ? Math.round(((compareAt - price) / compareAt) * 100) : 0

export const isOnSale = (p: AdminProduct) => p.compare_at_price != null && Number(p.compare_at_price) > Number(p.price)
export const isLowStock = (p: AdminProduct) => p.track_stock && p.stock_quantity <= LOW_STOCK
export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : ""
