import { normalizeProduct, type Product } from "./products"

const BASE = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/+$/, "")

export class ShopApiError extends Error {
  status: number
  data: unknown
  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

function flatten(v: unknown): string[] {
  if (v == null) return []
  if (typeof v === "string") return [v]
  if (Array.isArray(v)) return v.flatMap(flatten)
  if (typeof v === "object") {
    const o = v as Record<string, unknown>
    if (typeof o.detail === "string") return [o.detail]
    return Object.values(o).flatMap(flatten)
  }
  return []
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) },
    })
  } catch {
    throw new ShopApiError("Network error. Check your connection and try again.", 0)
  }
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { /* non-JSON */ }
  if (!res.ok) {
    const msg = flatten(data).join(" ") || `Request failed (${res.status})`
    throw new ShopApiError(msg, res.status, data)
  }
  return data as T
}

export interface ShopCategory { name: string; slug: string }

export interface CheckoutPayload {
  first_name: string; last_name: string; company?: string; email: string; phone: string
  address: string; apartment?: string; city: string; state?: string; zip_code?: string
  country?: string; notes?: string
  payment_method: "mpesa"
  mpesa_phone?: string
  items: { product_id: string; quantity: number; selected_storage?: string; selected_color?: string }[]
}

export interface CheckoutResponse {
  reference: string
  tracking_token: string
  status: string
  payment_status: "pending" | "paid" | "failed"
  total: number
  currency: string
  amount_kes: number
  payment: { initiated: boolean; message: string }
}

export interface OrderStatus {
  reference: string
  status: "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "expired"
  payment_status: "pending" | "paid" | "failed"
  payment_method: string
  currency: string
  subtotal: number
  shipping_fee: number
  total: number
  amount_kes: number
  mpesa_receipt: string
  payment_failure_reason: string
  city: string
  country: string
  created_at: string
  paid_at: string | null
  items: {
    product_slug: string; name: string; image: string; unit_price: number
    quantity: number; selected_storage: string; selected_color: string; line_total: number
  }[]
}

export const shopApi = {
  async getProducts(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString()
    const r = await request<{ count: number; page: number; page_size: number; results: unknown[] }>(
      `/shop/products/${qs ? `?${qs}` : ""}`
    )
    return { ...r, results: r.results.map(normalizeProduct) as Product[] }
  },
  async getCategories() {
    return request<ShopCategory[]>("/shop/categories/")
  },
  /** Returns null on 404, throws on any other error. */
  async getProduct(slug: string): Promise<Product | null> {
    try {
      return normalizeProduct(await request<unknown>(`/shop/products/${encodeURIComponent(slug)}/`))
    } catch (e) {
      if (e instanceof ShopApiError && e.status === 404) return null
      throw e
    }
  },
  async getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
    const r = await request<unknown[]>(`/shop/products/${encodeURIComponent(slug)}/related/?limit=${limit}`)
    return r.map(normalizeProduct)
  },
  async checkout(payload: CheckoutPayload) {
    return request<CheckoutResponse>("/shop/checkout/", { method: "POST", body: JSON.stringify(payload) })
  },
  async getOrderStatus(reference: string, token: string) {
    return request<OrderStatus>(
      `/shop/orders/${encodeURIComponent(reference)}/?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    )
  },
  async retryPayment(reference: string, token: string, phone?: string) {
    return request<{ initiated: boolean; message: string }>(
      `/shop/orders/${encodeURIComponent(reference)}/pay/`,
      { method: "POST", body: JSON.stringify({ token, phone }) }
    )
  },
}