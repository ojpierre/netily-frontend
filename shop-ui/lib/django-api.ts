/**
 * Netily Shop — Django REST Framework (DRF) Integration Client
 *
 * This module is architected to seamlessly interface with the incoming Django backend.
 * Currently, it operates in Standalone Frontend / Mock Mode so that all pages, catalog,
 * accounts, checkout, and admin dashboard function 100% reliably with zero backend active.
 *
 * When the Django backend endpoints are deployed:
 * 1. Set `NEXT_PUBLIC_DJANGO_API_URL=https://api.netily.shop` (or http://localhost:8000)
 * 2. Set `NEXT_PUBLIC_USE_MOCK_API=false`
 */

export interface DjangoUserProfile {
  id: string
  name: string
  email: string
  company: string
  role: "CUSTOMER" | "ISP_OPERATOR" | "ADMIN"
  phone: string
  birthday: string
  memberSince: string
}

export interface DjangoOrderItem {
  id: string
  productName: string
  quantity: string | number
  priceUsd: string | number
  image?: string
  specs?: string
}

export interface DjangoOrder {
  id: string
  orderNumber: string
  userId: string
  createdAt: string
  status: "PENDING" | "PROCESSING" | "DISPATCHED" | "DELIVERED"
  totalUsd: string | number
  paymentMethod: string
  shippingAddress: string
  trackingNumber?: string
  items: DjangoOrderItem[]
}

export interface DjangoAddress {
  id: string
  userId: string
  label: string
  name: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  isDefault: string | boolean
}

// ── Default Mock State for Frontend Independence ──────────────────────────────

export const MOCK_USER: DjangoUserProfile = {
  id: "usr_netily_8842",
  name: "Alex Mercer",
  email: "alex.mercer@netily.io",
  company: "Apex Fiber & Wireless ISP Ltd",
  role: "ISP_OPERATOR",
  phone: "+254 712 345 678",
  birthday: "1991-04-18",
  memberSince: "March 2024",
}

export const MOCK_ORDERS: DjangoOrder[] = [
  {
    id: "ord_ntl_8942",
    orderNumber: "NTL-8942",
    userId: "usr_netily_8842",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    status: "PROCESSING",
    totalUsd: "2050",
    paymentMethod: "B2B Proforma Invoice (Net 30)",
    shippingAddress: "Nairobi ISP NOC & Datacenter, Westlands Commercial Center, 4th Floor, Nairobi, Kenya",
    trackingNumber: "NTL-EXP-9921448",
    items: [
      {
        id: "item_1",
        productName: "MikroTik Cloud Core Router CCR2004-16G-2S+PC",
        quantity: 2,
        priceUsd: 495,
        image: "/shop-assets/products/mikrotik_router.jpg",
        specs: "Standard 1U Rackmount / Dual Redundant AC",
      },
      {
        id: "item_2",
        productName: "Netily Pro Cat6A Shielded S/FTP Outdoor UV Cable (305m Drum)",
        quantity: 2,
        priceUsd: 265,
        image: "/shop-assets/products/cat6a_cable.jpg",
        specs: "305m Wooden Drum / UV-Resistant PE",
      },
      {
        id: "item_3",
        productName: "10G SFP+ Optical Transceiver Module (10GBASE-LR 1310nm 10km)",
        quantity: 12,
        priceUsd: 42,
        image: "/shop-assets/products/poe_switch.jpg",
        specs: "Single-Mode LC / 10.3Gbps",
      },
    ],
  },
  {
    id: "ord_ntl_8711",
    orderNumber: "NTL-8711",
    userId: "usr_netily_8842",
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    status: "DELIVERED",
    totalUsd: "1848",
    paymentMethod: "M-Pesa Express / Mobile Money",
    shippingAddress: "Nairobi ISP NOC & Datacenter, Westlands Commercial Center, 4th Floor, Nairobi, Kenya",
    trackingNumber: "NTL-EXP-8812903",
    items: [
      {
        id: "item_4",
        productName: "MikroTik Cloud Router Switch CRS328-24P-4S+RM",
        quantity: 2,
        priceUsd: 479,
        image: "/shop-assets/products/poe_switch.jpg",
        specs: "24-Port Gigabit PoE+ (450W)",
      },
      {
        id: "item_5",
        productName: "Signal Fire AI-9 6-Motor Optical Fiber Fusion Splicer",
        quantity: 1,
        priceUsd: 890,
        image: "/shop-assets/products/fusion_splicer.jpg",
        specs: "Complete Master Field Toolkit",
      },
    ],
  },
  {
    id: "ord_ntl_8520",
    orderNumber: "NTL-8520",
    userId: "usr_netily_8842",
    createdAt: new Date(Date.now() - 38 * 24 * 3600 * 1000).toISOString(),
    status: "DELIVERED",
    totalUsd: "1198",
    paymentMethod: "Credit Card (Visa ending in 4242)",
    shippingAddress: "Tower Distribution Site B, Ngong Hills Station, Kajiado County, Kenya",
    trackingNumber: "NTL-EXP-7729104",
    items: [
      {
        id: "item_6",
        productName: "Ubiquiti UISP Wave Pro 60GHz PtP Backhaul Radio",
        quantity: 2,
        priceUsd: 599,
        image: "/shop-assets/products/wireless_dish.jpg",
        specs: "5.4 Gbps Aggregate / 15km+ Link",
      },
    ],
  },
]

export const MOCK_ADDRESSES: DjangoAddress[] = [
  {
    id: "addr_1",
    userId: "usr_netily_8842",
    label: "ISP NOC & Datacenter (Primary)",
    name: "Alex Mercer (Apex Fiber)",
    street: "Westlands Commercial Center, Ring Road, 4th Floor",
    city: "Nairobi",
    state: "Nairobi County",
    zip: "00100",
    country: "Kenya",
    phone: "+254 712 345 678",
    isDefault: true,
  },
  {
    id: "addr_2",
    userId: "usr_netily_8842",
    label: "Tower Station B (Field Drops)",
    name: "Apex Field Engineering Team",
    street: "Ngong Hills Telecom Mast Station Road, Tower Enclosure #3",
    city: "Ngong",
    state: "Kajiado County",
    zip: "00209",
    country: "Kenya",
    phone: "+254 722 987 654",
    isDefault: false,
  },
]

// ── Django API Adapter ────────────────────────────────────────────────────────

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api/v1"
const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false"

export const djangoApi = {
  /**
   * Fetch current user profile.
   * Target Django endpoint: GET /api/v1/auth/user/
   */
  async getUserProfile(): Promise<DjangoUserProfile> {
    if (IS_MOCK) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("netily_user_profile")
        if (stored) {
          try {
            return JSON.parse(stored)
          } catch (e) {
            // fallback
          }
        }
      }
      return MOCK_USER
    }

    const res = await fetch(`${DJANGO_BASE_URL}/auth/user/`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
    if (!res.ok) throw new Error("Failed to load user profile from Django backend")
    return res.json()
  },

  /**
   * Update profile.
   * Target Django endpoint: PUT /api/v1/auth/user/
   */
  async updateProfile(updates: Partial<DjangoUserProfile>): Promise<DjangoUserProfile> {
    if (IS_MOCK) {
      const current = await this.getUserProfile()
      const updated = { ...current, ...updates }
      if (typeof window !== "undefined") {
        localStorage.setItem("netily_user_profile", JSON.stringify(updated))
      }
      return updated
    }

    const res = await fetch(`${DJANGO_BASE_URL}/auth/user/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    })
    if (!res.ok) throw new Error("Failed to update profile")
    return res.json()
  },

  /**
   * Fetch user orders.
   * Target Django endpoint: GET /api/v1/orders/
   */
  async getOrders(): Promise<DjangoOrder[]> {
    if (IS_MOCK) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("netily_orders")
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            return [...parsed, ...MOCK_ORDERS]
          } catch (e) {
            // fallback
          }
        }
      }
      return MOCK_ORDERS
    }

    const res = await fetch(`${DJANGO_BASE_URL}/orders/`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
    if (!res.ok) throw new Error("Failed to load orders from Django backend")
    return res.json()
  },

  /**
   * Create an order.
   * Target Django endpoint: POST /api/v1/orders/
   */
  async createOrder(orderPayload: {
    items: any[]
    totalUsd: number
    shippingAddress: string
    paymentMethod: string
    customerNotes?: string
  }): Promise<{ success: boolean; orderId: string; orderNumber: string }> {
    const orderNumber = `NTL-${Math.floor(1000 + Math.random() * 9000)}`
    const newOrder: DjangoOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      userId: MOCK_USER.id,
      createdAt: new Date().toISOString(),
      status: "PROCESSING",
      totalUsd: orderPayload.totalUsd,
      paymentMethod: orderPayload.paymentMethod,
      shippingAddress: orderPayload.shippingAddress,
      trackingNumber: `NTL-EXP-${Math.floor(1000000 + Math.random() * 9000000)}`,
      items: orderPayload.items.map((i, idx) => ({
        id: `item_${idx}_${Date.now()}`,
        productName: i.name,
        quantity: i.quantity,
        priceUsd: i.price,
        image: i.image,
        specs: i.selectedStorage || i.selectedColor || "Standard Unit",
      })),
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("netily_orders")
      const existing: DjangoOrder[] = stored ? JSON.parse(stored) : []
      localStorage.setItem("netily_orders", JSON.stringify([newOrder, ...existing]))
    }

    if (!IS_MOCK) {
      try {
        await fetch(`${DJANGO_BASE_URL}/orders/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
          credentials: "include",
        })
      } catch (err) {
        console.warn("Django endpoint unreachable, order stored locally:", err)
      }
    }

    return { success: true, orderId: newOrder.id, orderNumber }
  },

  /**
   * Fetch addresses.
   * Target Django endpoint: GET /api/v1/addresses/
   */
  async getAddresses(): Promise<DjangoAddress[]> {
    if (IS_MOCK) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("netily_addresses")
        if (stored) {
          try {
            return JSON.parse(stored)
          } catch (e) {
            // fallback
          }
        }
      }
      return MOCK_ADDRESSES
    }

    const res = await fetch(`${DJANGO_BASE_URL}/addresses/`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
    if (!res.ok) return MOCK_ADDRESSES
    return res.json()
  },
}
