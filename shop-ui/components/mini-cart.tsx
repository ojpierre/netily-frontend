"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useCart, cartItemKey } from "@/shop-ui/lib/cart-context"
import { formatShopMoney } from "@/shop-ui/lib/currency"
import { useShopSettings } from "@/shop-ui/lib/use-shop-settings"
import { HEADING_FONT } from "@/shop-ui/lib/shop-helpers"
import { ProductArt } from "./product-art"

interface MiniCartProps {
  isOpen: boolean
  onClose: () => void
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { items, increment, decrement, removeItem, total, itemCount } = useCart()
  const settings = useShopSettings()
  const reduce = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  const threshold = settings?.free_shipping_threshold ?? null
  const toFree = threshold && threshold > 0 ? Math.max(0, threshold - total) : null
  const progress = threshold && threshold > 0 ? Math.min(100, (total / threshold) * 100) : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-[#17252d]/50"
          />
          <motion.div
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", duration: reduce ? 0 : 0.28, ease: "easeOut" }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[#dce4e8] bg-white text-[#17252d] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#dce4e8] px-5 py-4">
              <div>
                <h2 className={`${HEADING_FONT} text-lg font-semibold`}>Your cart</h2>
                {itemCount > 0 && <p className="text-xs text-[#56656f]">{itemCount} {itemCount === 1 ? "item" : "items"}</p>}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="-mr-2 grid h-10 w-10 place-items-center rounded-lg outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {toFree !== null && items.length > 0 && (
              <div className="border-b border-[#dce4e8] bg-[#f3f7f8] px-5 py-3">
                <p className="text-xs text-[#17252d]">
                  {toFree > 0 ? (
                    <>Add <strong className="tabular-nums">{formatShopMoney(toFree)}</strong> more for free delivery.</>
                  ) : (
                    <strong className="text-[#168564]">This order qualifies for free delivery.</strong>
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dce4e8]">
                  <div className="h-full rounded-full bg-[#22a67d] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[#dce4e8] bg-[#f3f7f8] text-[#56656f]">
                    <ShoppingBag className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className={`${HEADING_FONT} text-lg font-semibold`}>Your cart is empty</p>
                  <p className="mt-1 text-sm text-[#56656f]">Routers, fibre gear and power kits are a few clicks away.</p>
                  <Link
                    href="/shop/catalog"
                    onClick={onClose}
                    className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#0874cf] px-5 text-sm font-semibold text-white hover:bg-[#075faa]"
                  >
                    Browse equipment
                  </Link>
                </div>
              ) : (
                <ul className="space-y-5">
                  {items.map((item) => {
                    const key = cartItemKey(item)
                    return (
                      <li key={key} className="flex gap-4 border-b border-[#eef2f4] pb-5 last:border-0">
                        <Link href={`/shop/product/${item.id}`} onClick={onClose} className="relative block h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-[#dce4e8]">
                          <ProductArt name={item.name} category={item.category} image={item.image} variant="glyph" showLabel={false} />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                              <Link href={`/shop/product/${item.id}`} onClick={onClose} className="hover:text-[#0874cf]">
                                {item.name}
                              </Link>
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeItem(key)}
                              className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#56656f] outline-none hover:bg-[#f3f7f8] hover:text-[#17252d] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {item.selectedStorage && item.selectedStorage !== "Standard" && <p className="text-xs text-[#56656f]">{item.selectedStorage}</p>}
                          {item.selectedColor && item.selectedColor !== "Default" && <p className="text-xs text-[#56656f]">{item.selectedColor}</p>}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center rounded-lg border border-[#dce4e8]">
                              <button type="button" onClick={() => decrement(key)} className="grid h-8 w-8 place-items-center rounded-l-lg outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]" aria-label="Decrease quantity">
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">{item.quantity}</span>
                              <button type="button" onClick={() => increment(key)} className="grid h-8 w-8 place-items-center rounded-r-lg outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]" aria-label="Increase quantity">
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold tabular-nums">{formatShopMoney(item.price * item.quantity, item.currency)}</p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-[#dce4e8] px-5 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[#56656f]">Subtotal</span>
                  <span className={`${HEADING_FONT} text-xl font-semibold tabular-nums`}>{formatShopMoney(total)}</span>
                </div>
                <p className="text-xs text-[#56656f]">Delivery is added at checkout. You pay by M-Pesa.</p>
                <Link
                  href="/shop/checkout"
                  onClick={onClose}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-[#0874cf] text-sm font-semibold text-white outline-none transition hover:bg-[#075faa] focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2"
                >
                  Checkout
                </Link>
                <button type="button" onClick={onClose} className="w-full text-center text-sm font-medium text-[#56656f] hover:text-[#17252d]">
                  Continue shopping
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
