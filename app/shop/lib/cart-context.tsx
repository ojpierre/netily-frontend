"use client"

import React, { createContext, useContext, useReducer, useCallback } from "react"

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

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "INCREMENT"; payload: string }
  | { type: "DECREMENT"; payload: string }
  | { type: "CLEAR_CART" }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const uniqueKey = `${action.payload.id}-${action.payload.selectedStorage ?? ""}-${action.payload.selectedColor ?? ""}`
      const existing = state.items.find(
        (i) =>
          i.id === action.payload.id &&
          i.selectedStorage === action.payload.selectedStorage &&
          i.selectedColor === action.payload.selectedColor
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === existing.id &&
            i.selectedStorage === existing.selectedStorage &&
            i.selectedColor === existing.selectedColor
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] }
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) }
    case "INCREMENT":
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.payload ? { ...i, quantity: i.quantity + 1 } : i)),
      }
    case "DECREMENT":
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.payload ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      }
    case "CLEAR_CART":
      return { ...state, items: [] }
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", payload: { ...item, quantity: 1 } })
  }, [])

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
  }, [])

  const increment = useCallback((id: string) => {
    dispatch({ type: "INCREMENT", payload: id })
  }, [])

  const decrement = useCallback((id: string) => {
    dispatch({ type: "DECREMENT", payload: id })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" })
  }, [])

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
