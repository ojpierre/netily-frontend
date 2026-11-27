import { superadminApi, type ShopSettings } from "@/lib/superadmin-api"
import type { AdminCategory, AdminOrder, AdminProduct, Page, ShopStats } from "./types"

/** Everything the console needs from the backend. The console takes this as a prop so it can run without a server. */
export interface ShopAdminApi {
  getSettings(): Promise<ShopSettings>
  updateSettings(data: Partial<ShopSettings>): Promise<ShopSettings>
  getStats(): Promise<ShopStats>
  listOrders(params: Record<string, string>): Promise<Page<AdminOrder>>
  getOrder(reference: string): Promise<AdminOrder>
  setOrderStatus(reference: string, status: string): Promise<AdminOrder>
  markOrderPaid(reference: string, receipt: string): Promise<AdminOrder>
  listProducts(params: Record<string, string>): Promise<Page<AdminProduct>>
  createProduct(data: Record<string, unknown>): Promise<AdminProduct>
  updateProduct(slug: string, data: Record<string, unknown>): Promise<AdminProduct>
  deleteProduct(slug: string): Promise<void>
  listCategories(): Promise<Page<AdminCategory>>
  createCategory(data: Record<string, unknown>): Promise<AdminCategory>
  updateCategory(id: number, data: Record<string, unknown>): Promise<AdminCategory>
  deleteCategory(id: number): Promise<void>
  uploadImage(file: File, onProgress?: (percent: number) => void): Promise<{ url: string }>
}

const qs = (params: Record<string, string>) => {
  const q = new URLSearchParams(params).toString()
  return q ? `?${q}` : ""
}
const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const shopAdminApi: ShopAdminApi = {
  getSettings: () => superadminApi.getShopSettings(),
  updateSettings: (data) => superadminApi.shopRequest("/shop/admin/settings/", json("PATCH", data)),
  getStats: () => superadminApi.getShopStats(),
  listOrders: (params) => superadminApi.shopRequest(`/shop/admin/orders/${qs(params)}`),
  getOrder: (reference) => superadminApi.getShopOrder(reference),
  setOrderStatus: (reference, status) => superadminApi.setShopOrderStatus(reference, status),
  markOrderPaid: (reference, receipt) => superadminApi.markShopOrderPaid(reference, receipt),
  listProducts: (params) => superadminApi.shopRequest(`/shop/admin/products/${qs(params)}`),
  createProduct: (data) => superadminApi.shopRequest("/shop/admin/products/", json("POST", data)),
  updateProduct: (slug, data) => superadminApi.shopRequest(`/shop/admin/products/${encodeURIComponent(slug)}/`, json("PATCH", data)),
  deleteProduct: (slug) => superadminApi.shopRequest(`/shop/admin/products/${encodeURIComponent(slug)}/`, { method: "DELETE" }),
  listCategories: () => superadminApi.shopRequest("/shop/admin/categories/?page_size=200"),
  createCategory: (data) => superadminApi.shopRequest("/shop/admin/categories/", json("POST", data)),
  updateCategory: (id, data) => superadminApi.shopRequest(`/shop/admin/categories/${id}/`, json("PATCH", data)),
  deleteCategory: (id) => superadminApi.deleteShopCategory(id),
  uploadImage: (file, onProgress) => superadminApi.uploadShopImage(file, onProgress),
}

/** Loads every page of the product list (the API caps page_size at 200). */
export async function fetchAllProducts(api: ShopAdminApi): Promise<AdminProduct[]> {
  const all: AdminProduct[] = []
  for (let page = 1; page <= 15; page++) {
    const res = await api.listProducts({ page_size: "200", page: String(page) })
    all.push(...res.results)
    if (!res.next) break
  }
  return all
}
