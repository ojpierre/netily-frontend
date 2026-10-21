"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  selectedStorage?: string
  selectedColor?: string
  quantity: number
}

const CART_KEY = "netily_shop_cart_v1"
const MAX_QTY = 1000

export const cartItemKey = (i: Pick<CartItem, "id" | "selectedStorage" | "selectedColor">) =>
  `${i.id}::${i.selectedStorage ?? ""}::${i.selectedColor ?? ""}`

interface CartState { items: CartItem[] }

type CartAction =
  | { type: "HYDRATE"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "INCREMENT"; payload: string }
  | { type: "DECREMENT"; payload: string }
  | { type: "CLEAR_CART" }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.payload }
    case "ADD_ITEM": {
      const key = cartItemKey(action.payload)
      const exists = state.items.some((i) => cartItemKey(i) === key)
      if (exists) {
        return {
          items: state.items.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QTY) } : i
          ),
        }
      }
      return { items: [...state.items, { ...action.payload, quantity: 1 }] }
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => cartItemKey(i) !== action.payload) }
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          cartItemKey(i) === action.payload ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QTY) } : i
        ),
      }
    case "DECREMENT":
      return {
        items: state.items
          .map((i) => (cartItemKey(i) === action.payload ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      }
    case "CLEAR_CART":
      return { items: [] }
    default:
      return state
  }
}

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (i) =>
        i && typeof i.id === "string" && typeof i.name === "string" &&
        Number.isFinite(i.price) && Number.isInteger(i.quantity) && i.quantity > 0
    )
    .map((i) => ({ ...i, quantity: Math.min(i.quantity, MAX_QTY) }))
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (key: string) => void
  increment: (key: string) => void
  decrement: (key: string) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY)
      if (raw) dispatch({ type: "HYDRATE", payload: sanitize(JSON.parse(raw)) })
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(state.items)) } catch {}
  }, [state.items, hydrated])

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", payload: { ...item, quantity: 1 } })
  }, [])
  const removeItem = useCallback((key: string) => dispatch({ type: "REMOVE_ITEM", payload: key }), [])
  const increment = useCallback((key: string) => dispatch({ type: "INCREMENT", payload: key }), [])
  const decrement = useCallback((key: string) => dispatch({ type: "DECREMENT", payload: key }), [])
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), [])

  const total = state.items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const itemCount = state.items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, increment, decrement, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}